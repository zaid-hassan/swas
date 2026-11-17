import assert from "node:assert/strict";

import {
  normalizeProductRow,
  docToProduct,
  productHash,
  slugify,
  productDocId,
} from "../lib/product-rows";
import type { NormalizedProductDoc } from "../lib/product-rows";
import { buildSyncPlan } from "../lib/product-sync";
import { isAdminEmail, isSuperAdminEmail, requireAdmin, requireSuperAdmin } from "../lib/admin-auth";
import { buildRefundReview } from "../lib/refunds";
import { buildFulfillmentPatch } from "../lib/orders";
import { createManualProduct, validateManualInput } from "../lib/product-create";
import { buildProductEditPatch } from "../lib/product-edit";
import { calculateBulkPrice, productBelongsToBulkPriceCategory } from "../lib/bulk-price";
import { countProductsByCollectionId, createCollection, getActiveCollection, updateCollection, setCollectionActive, validateCollectionInput } from "../lib/collections";
import { createCategory, isCatalogRecordAvailable, listCategories, sortCategories, updateCategory, validateCategoryInput } from "../lib/categories";
import { validateCartItems } from "../lib/cart/validate-cart";
import { findCategoryForProduct, resolveCategoryParam } from "../lib/products";
import type { Product } from "../types/products";
import { isMediaAllowed, isVideoUrl, interleaveMedia, resolveCloudinaryCloudName, resolveCloudinaryUploadPreset } from "../lib/media-upload";
import {
  CAROUSEL_DEFAULT_COUNT,
  CAROUSEL_MAX,
  DEFAULT_HOME_VIDEOS,
  HOME_VIDEO_KEYS,
  SINGLE_HOME_VIDEO_SLOTS,
  carouselSlides,
  normalizeHomeVideos,
  validateHomeVideoInput,
} from "../lib/home-videos";

let passed = 0;
let failed = 0;
const asyncTests: Array<{ name: string; fn: () => Promise<void> }> = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log("  FAIL", name, err);
  }
}

function testAsync(name: string, fn: () => Promise<void>) {
  asyncTests.push({ name, fn });
}

const sheetRow = {
  "S No": 42,
  Category: "Necklace",
  "Product Name": "Gold Plated Necklace",
  Description: "Nice",
  Material: "Brass",
  Design: "Floral",
  Finish: "Gold",
  IdealFor: "Women",
  MRP: "1499",
  Image: "https://res.cloudinary.com/x/a.jpg",
  Image1: "https://res.cloudinary.com/x/a.jpg",
  Image2: "https://res.cloudinary.com/x/b.jpg",
  Image3: "",
  "DATE OF ADD": "2026-01-01",
};

console.log("\nproduct-rows");

test("collection schema accepts one video banner without collection capacity or ordering fields", () => {
  const legacyInput = {
    name: "Taruni",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
    slogan: "Legacy slogan should be ignored",
    expiresAt: 2_000_000_000_000,
  };
  const result = validateCollectionInput(legacyInput);
  assert.deepEqual(result, {
    ok: true,
    name: "Taruni",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
    expiresAt: 2_000_000_000_000,
  });
});

test("collection schema rejects an image banner URL", () => {
  assert.equal(validateCollectionInput({
    name: "Taruni",
    bannerUrl: "https://res.cloudinary.com/x/banner.webp",
  }).ok, false);
});

testAsync("collection edits keep category assignments on the collection record", async () => {
  const collectionRef = { id: "collection-1", path: "collections/collection-1" };
  const ringRef = { id: "rings", path: "categories/rings" };
  const earringRef = { id: "earrings", path: "categories/earrings" };
  const categoriesCollection = { doc: (id: string) => id === "rings" ? ringRef : earringRef };
  const productQuery = { kind: "collection-products" };
  const categoryDocs = [
    { id: "rings", ref: ringRef, data: () => ({ name: "Rings" }) },
    { id: "earrings", ref: earringRef, data: () => ({ name: "Earrings" }) },
  ];
  const writes: Array<{ ref: unknown; data: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      if (name === "collections") return { doc: () => collectionRef };
      if (name === "categories") return { ...categoriesCollection, get: () => ({ docs: categoryDocs }) };
      if (name === "products") return { where: () => productQuery };
      throw new Error(`Unexpected collection ${name}`);
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === collectionRef) return { exists: true, data: () => ({ name: "Spring", categoryIds: ["rings", "earrings"] }) };
          if (ref === categoriesCollection || typeof ref === "object" && ref !== null && "get" in ref) return { docs: categoryDocs };
          if (ref === productQuery) return { docs: [] };
          if (ref === ringRef) return { exists: true, data: () => categoryDocs[0].data() };
          if (ref === earringRef) return { exists: true, data: () => categoryDocs[1].data() };
          throw new Error("Unexpected transaction read");
        },
        set(ref: unknown, data: Record<string, unknown>) { writes.push({ ref, data }); },
        delete() {},
      });
    },
  } as never;

  await updateCollection(db, "collection-1", { categoryIds: ["rings"] });
  assert.ok(!writes.some((write) => write.ref === ringRef || write.ref === earringRef));
  assert.ok(writes.some((write) => write.ref === collectionRef && write.data.categoryCount === 1));
  assert.ok(writes.some((write) => write.ref === collectionRef && Array.isArray(write.data.categoryIds) && write.data.categoryIds.join(",") === "rings"));
});


testAsync("canonical catalog relation helpers ignore category-owned memberships", async () => {
  const schema = await import("../lib/catalog-schema");
  const hasCategory = schema.collectionHasCategory;
  const belongs = schema.productBelongsToCollection;
  const collection = { id: "spring", categoryIds: ["rings"] };
  assert.equal(hasCategory(collection, "rings"), true);
  assert.equal(hasCategory({ id: "spring", categoryIds: [] }, "rings"), false);
  assert.equal(hasCategory({ id: "spring", categoryIds: undefined, collectionIds: ["rings"] } as never, "rings"), false);
  assert.equal(belongs({ categoryId: "rings", collectionId: "spring" }, collection), true);
  assert.equal(belongs({ category: "Rings", collectionId: "spring" }, collection), false);
  assert.equal(belongs({ categoryId: "rings", collectionId: "summer" }, collection), false);
});


testAsync("collection edits persist a changed display name", async () => {
  const collectionRef = { id: "collection-1", path: "collections/collection-1" };
  const nameQuery = { kind: "name-query" };
  const writes: Array<Record<string, unknown>> = [];
  const db = {
    collection(name: string) {
      if (name === "collections") return {
        doc: () => collectionRef,
        where: () => ({ limit: () => nameQuery }),
      };
      return { doc: (id: string) => ({ id, path: `collectionNames/${id}` }) };
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === collectionRef) return { exists: true, data: () => ({ name: "Old name", nameLower: "old name" }) };
          if (ref === nameQuery) return { docs: [] };
          return { exists: false };
        },
        set(_ref: unknown, data: Record<string, unknown>) { writes.push(data); },
        delete() {},
      });
    },
  } as never;

  await updateCollection(db, "collection-1", { name: "New name" });
  assert.ok(writes.some((write) => write.name === "New name" && write.nameLower === "new name"));
  assert.ok(writes.some((write) => Object.hasOwn(write, "slogan")));
});

testAsync("collection edits reject the removed slogan field", async () => {
  await assert.rejects(
    updateCollection({ collection: () => ({ doc: () => ({}) }) } as never, "collection-1", { slogan: "No longer allowed" }),
    /Collection slogans are no longer supported/
  );
});


testAsync("category creation starts unassigned until selected from a collection", async () => {
  const categoryRef = { id: "category-1", path: "categories/category-1" };
  const slugQuery = { kind: "slug-query" };
  const categoriesCollection = {
    doc: () => categoryRef,
    where: () => ({ limit: () => slugQuery }),
  };
  const created: Array<{ ref: unknown; data: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      if (name === "categories") return categoriesCollection;
      throw new Error(`Unexpected collection ${name}`);
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === categoriesCollection) return { docs: [] };
          if (ref === slugQuery) return { empty: true };
          throw new Error("Unexpected transaction read");
        },
        create(ref: unknown, data: Record<string, unknown>) { created.push({ ref, data }); },
        set() {},
      });
    },
  } as never;

  const category = await createCategory(db, { name: "Rings" });
  assert.equal("collectionIds" in category, false);
  assert.equal("collectionIds" in (created[0]?.data ?? {}), false);
});

testAsync("manual product creation ignores an old collection product limit", async () => {
  const counterRef = { id: "products", path: "counters/products" };
  const categoryRef = { id: "category-1", path: "categories/category-1" };
  const collectionRef = { id: "collection-1", path: "collections/collection-1" };
  const assignedProductsQuery = { kind: "assigned-products" };
  const topProductsQuery = { kind: "top-products" };
  const productsCollection = {
    doc: (id?: string) => id ? { id, path: `products/${id}` } : counterRef,
    where: () => assignedProductsQuery,
    orderBy: () => ({ limit: () => topProductsQuery }),
  };
  const db = {
    collection(name: string) {
      if (name === "counters") return { doc: () => counterRef };
      if (name === "categories") return { doc: () => categoryRef };
      if (name === "collections") return { doc: () => collectionRef };
      if (name === "products") return productsCollection;
      throw new Error(`Unexpected collection ${name}`);
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === counterRef) return { exists: false };
          if (ref === categoryRef) return { exists: true, data: () => ({ name: "Rings" }) };
          if (ref === collectionRef) return { exists: true, data: () => ({ categoryIds: ["category-1"] }) };
          if (ref === assignedProductsQuery) return { size: 0 };
          if (ref === topProductsQuery) return { empty: true, docs: [] };
          if (typeof ref === "object" && ref !== null && "path" in ref && String(ref.path).startsWith("products/")) return { exists: false };
          throw new Error("Unexpected transaction read");
        },
        set() {},
      });
    },
  } as never;

  const product = await createManualProduct(db, {
    name: "Gold ring",
    categoryId: "category-1",
    collectionId: "collection-1",
    mrp: 1200,
    images: ["https://res.cloudinary.com/x/ring.jpg"],
    videos: [],
  });
  assert.equal(product.collectionId, "collection-1");
});

test("category validation no longer requires a collection selection", () => {
  assert.deepEqual(validateCategoryInput({ name: "Rings" }), {
    ok: true,
    name: "Rings",
    description: "",
    imageUrl: "",
    expiresAt: null,
  });
});

test("collection validation requires a name and one secure Cloudinary video URL", () => {
  const video = "https://res.cloudinary.com/x/banner.mp4";
  assert.equal(validateCollectionInput({ name: "Taruni", bannerUrl: video }).ok, true);
  assert.equal(validateCollectionInput({ name: "  ", bannerUrl: video }).ok, false);
  assert.equal(validateCollectionInput({ name: "Taruni", bannerUrl: "http://res.cloudinary.com/x/banner.mp4" }).ok, false);
  assert.equal(validateCollectionInput({ name: "Taruni", bannerUrl: "https://example.com/banner.mp4" }).ok, false);
  assert.equal(validateCollectionInput({ name: "Taruni", bannerUrl: "https://res.cloudinary.com/x/banner.webp" }).ok, false);
  const legacyBannerInput = { name: "Taruni", bannerVideoUrl: video } as unknown as Parameters<typeof validateCollectionInput>[0];
  assert.equal(validateCollectionInput(legacyBannerInput).ok, false);
});

test("collection schema ignores removed capacity and sort-order fields", () => {
  const legacyInput = {
    name: "Taruni",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
    slogan: "Made for every day",
    maxCategories: 6,
    maxItems: 80,
    sortOrder: 20,
  };
  const result = validateCollectionInput(legacyInput);
  assert.deepEqual(result, {
    ok: true,
    name: "Taruni",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
    expiresAt: null,
  });
});

test("collection schema keeps optional expiry and defaults it to null", () => {
  const video = "https://res.cloudinary.com/x/banner.mp4";
  const withExpiry = validateCollectionInput({ name: "Taruni", bannerUrl: video, expiresAt: 2_000_000_000_000 });
  const withoutExpiry = validateCollectionInput({ name: "Taruni", bannerUrl: video });
  assert.deepEqual(withExpiry.ok ? withExpiry.expiresAt : null, 2_000_000_000_000);
  assert.deepEqual(withoutExpiry.ok ? withoutExpiry.expiresAt : undefined, null);
});

testAsync("creating a collection activates it and deactivates the previous one", async () => {
  const oldRef = { id: "old", path: "collections/old" };
  const newRef = { id: "new", path: "collections/new" };
  const activeRef = { id: "activeCollection", path: "collectionSettings/activeCollection" };
  const reservationRef = { id: "reservation", path: "collectionNames/reservation" };
  const nameQuery = { kind: "name-query" };
  const writes: Array<{ operation: string; ref: unknown; data?: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      return {
        doc(id?: string) {
          if (name === "collections" && !id) return newRef;
          if (name === "collections" && id === "old") return oldRef;
          if (name === "collectionSettings") return activeRef;
          return reservationRef;
        },
        where() { return { limit() { return nameQuery; } }; },
      };
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      const transaction = {
        async get(ref: unknown) {
          if (ref === reservationRef) return { exists: false };
          if (ref === nameQuery) return { empty: true };
          if (ref === activeRef) return { exists: true, data: () => ({ collectionId: "old" }) };
          if (ref === oldRef) return { exists: true, data: () => ({ id: "old" }) };
          throw new Error("Unexpected transaction read");
        },
        create(ref: unknown, data: Record<string, unknown>) { writes.push({ operation: "create", ref, data }); },
        set(ref: unknown, data: Record<string, unknown>) { writes.push({ operation: "set", ref, data }); },
      };
      return work(transaction);
    },
  } as never;

  const collection = await createCollection(db, {
    name: "New collection",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
  });

  assert.equal(collection.isActive, true);
  assert.equal(Object.hasOwn(collection, "slogan"), false);
  assert.ok(writes.some((write) => write.operation === "set" && write.ref === oldRef && write.data?.isActive === false));
  assert.ok(writes.some((write) => write.operation === "set" && write.ref === activeRef && write.data?.collectionId === "new"));
});

testAsync("activating a collection replaces the active homepage pointer", async () => {
  const oldRef = { id: "old", path: "collections/old" };
  const selectedRef = { id: "selected", path: "collections/selected" };
  const activeRef = { id: "activeCollection", path: "collectionSettings/activeCollection" };
  const writes: Array<{ ref: unknown; data: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      return { doc: (id: string) => name === "collectionSettings" ? activeRef : id === "old" ? oldRef : selectedRef };
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === activeRef) return { data: () => ({ collectionId: "old" }) };
          if (ref === oldRef) return { exists: true, data: () => ({}) };
          if (ref === selectedRef) return { exists: true, data: () => ({ expiresAt: null }) };
          throw new Error("Unexpected transaction read");
        },
        set(ref: unknown, data: Record<string, unknown>) { writes.push({ ref, data }); },
      });
    },
  } as never;

  await setCollectionActive(db, "selected", true);
  assert.ok(writes.some((write) => write.ref === oldRef && write.data.isActive === false));
  assert.ok(writes.some((write) => write.ref === selectedRef && write.data.isActive === true));
  assert.ok(writes.some((write) => write.ref === activeRef && write.data.collectionId === "selected"));
});


testAsync("deactivating the active collection clears the homepage pointer", async () => {
  const selectedRef = { id: "selected", path: "collections/selected" };
  const activeRef = { id: "activeCollection", path: "collectionSettings/activeCollection" };
  const writes: Array<{ ref: unknown; data: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      return { doc: () => name === "collectionSettings" ? activeRef : selectedRef };
    },
    async runTransaction(work: (transaction: unknown) => Promise<unknown>) {
      return work({
        async get(ref: unknown) {
          if (ref === activeRef) return { data: () => ({ collectionId: "selected" }) };
          if (ref === selectedRef) return { exists: true, data: () => ({}) };
          throw new Error("Unexpected transaction read");
        },
        set(ref: unknown, data: Record<string, unknown>) { writes.push({ ref, data }); },
      });
    },
  } as never;

  await setCollectionActive(db, "selected", false);
  assert.ok(writes.some((write) => write.ref === selectedRef && write.data.isActive === false));
  assert.ok(writes.some((write) => write.ref === activeRef && write.data.collectionId === null));
});


testAsync("there is no active homepage collection when the active pointer is empty", async () => {
  const db = {
    collection() {
      return { doc: () => ({ get: async () => ({ exists: false, data: () => undefined }) }) };
    },
  } as never;

  assert.equal(await getActiveCollection(db), null);
});

testAsync("the homepage reads the active collection record without using the cached product list", async () => {
  const collectionData = {
    name: "New Collection",
    slug: "new-collection",
    bannerUrl: "https://res.cloudinary.com/x/banner.mp4",
    slogan: "Old stored field",
    expiresAt: null,
  };
  const db = {
    collection(name: string) {
      return {
        doc: (id: string) => ({
          get: async () => name === "collectionSettings"
            ? { exists: true, data: () => ({ collectionId: id === "activeCollection" ? "collection-1" : "" }) }
            : { exists: true, id, data: () => collectionData },
        }),
      };
    },
  } as never;

  const active = await getActiveCollection(db);
  assert.equal(active?.id, "collection-1");
  assert.equal(active?.name, "New Collection");
  assert.equal(active?.bannerUrl, "https://res.cloudinary.com/x/banner.mp4");
  assert.equal(Object.hasOwn(active ?? {}, "slogan"), false);
  assert.equal(active?.isActive, true);
});

test("category validation ignores collection assignment and accepts optional details and expiry", () => {
  assert.deepEqual(validateCategoryInput({
    name: " Rings ",
    description: " Daily pieces ",
    imageUrl: "https://res.cloudinary.com/x/rings.webp",
    expiresAt: 2_000_000_000_000,
  }), {
    ok: true,
    name: "Rings",
    description: "Daily pieces",
    imageUrl: "https://res.cloudinary.com/x/rings.webp",
    expiresAt: 2_000_000_000_000,
  });
  assert.equal(validateCategoryInput({ name: "Rings" }).ok, true);
});

testAsync("category listing reads memberships from collection-owned category IDs", async () => {
  const categoryDocs = [{ id: "rings", data: () => ({ name: "Rings", sortOrder: 1 }) }];
  const collectionDocs = [{ id: "spring", data: () => ({ name: "Spring", categoryIds: ["rings"] }) }];
  const db = {
    collection(name: string) {
      return { get: async () => ({ docs: name === "categories" ? categoryDocs : name === "collections" ? collectionDocs : [] }) };
    },
  } as never;
  const categories = await listCategories(db);
  assert.deepEqual(categories[0].assignedCollectionIds, ["spring"]);
  assert.deepEqual(categories[0].collectionNames, ["Spring"]);
});

test("categories sort by admin order with a deterministic name tie-breaker", () => {
  const ordered = sortCategories([
    { id: "b", collectionId: "second-collection", name: "Bracelets", sortOrder: 20 },
    { id: "z", collectionId: "first-collection", name: "Rings", sortOrder: 10 },
    { id: "a", collectionId: "second-collection", name: "Anklets", sortOrder: 10 },
  ]);
  assert.deepEqual(ordered.map((category) => category.id), ["a", "z", "b"]);
});

testAsync("renaming a category updates its slug with its normalized name", async () => {
  let saved: Record<string, unknown> = {};
  const ref = {
    get: async () => ({ exists: true }),
    set: async (patch: Record<string, unknown>) => { saved = patch; },
  };
  const db = { collection: () => ({ doc: () => ref }) } as never;

  await updateCategory(db, "category-1", { name: " Updated Category " });

  assert.equal(saved.name, "Updated Category");
  assert.equal(saved.nameLower, "updated category");
  assert.equal(saved.slug, "updated-category");
});

test("product category identity comes only from the stored category ID", () => {
  const categories = [
    { id: "rings-a", name: "Rings" },
    { id: "rings-b", name: "Rings" },
  ];
  assert.equal(findCategoryForProduct({ categoryId: "rings-b" }, categories)?.id, "rings-b");
  assert.equal(findCategoryForProduct({ category: "RINGS" }, categories), undefined);
  assert.equal(findCategoryForProduct({ category: "Rings", categoryId: "missing" }, categories), undefined);
});

test("shop category filter resolves saved IDs and slugs to the canonical category ID", () => {
  const categories = [
    { id: "cat-rings", slug: "rings" },
    { id: "cat-earrings", slug: "earrings" },
  ];
  assert.equal(resolveCategoryParam(categories, "cat-rings"), "cat-rings");
  assert.equal(resolveCategoryParam(categories, " rings "), "cat-rings");
  assert.equal(resolveCategoryParam(categories, "earrings"), "cat-earrings");
  assert.equal(resolveCategoryParam(categories, "no-such-category"), undefined);
  assert.equal(resolveCategoryParam(categories, "   "), undefined);
});

test("catalog records expire at their deadline and deleted records are unavailable", () => {
  assert.equal(isCatalogRecordAvailable({ expiresAt: 200 }, 199), true);
  assert.equal(isCatalogRecordAvailable({ expiresAt: 200 }, 200), false);
  assert.equal(isCatalogRecordAvailable({ deletedAt: 1 }, 100), false);
});

test("checkout cart rejects out-of-stock or unavailable items instead of silently dropping them", () => {
  const products = [
    { id: "1", slug: "ring-1", name: "Ring", price: 100, image: "ring.jpg", stockStatus: "in_stock" },
    { id: "2", slug: "ring-2", name: "Other ring", price: 200, image: "other.jpg", stockStatus: "out_of_stock" },
  ] as Product[];
  assert.equal(validateCartItems([{ id: "2", quantity: 1 }], products).length, 0);
  assert.equal(validateCartItems([{ id: "1", quantity: 1 }, { id: "missing", quantity: 1 }], products).length, 0);
  assert.equal(validateCartItems([{ id: "1", quantity: 1 }], products)[0].price, 100);
});

test("collection product count counts only products assigned to that collection", () => {
  assert.equal(countProductsByCollectionId("c-1", [
    { collectionId: "c-1" },
    { collectionId: "c-1" },
    { collectionId: "c-2" },
    {},
  ]), 2);
});

test("bulk pricing matches products by saved category ID across every collection", () => {
  assert.equal(productBelongsToBulkPriceCategory({ categoryId: "rings-id", category: "Other", collectionId: "elsewhere" }, "rings-id"), true);
  assert.equal(productBelongsToBulkPriceCategory({ category: "Rings", collectionId: "summer" }, "rings-id"), false);
  assert.equal(productBelongsToBulkPriceCategory({ category: "Rings" }, "rings-id"), false);
  assert.equal(productBelongsToBulkPriceCategory({ categoryId: "earrings-id", category: "Rings" }, "rings-id"), false);
  assert.equal(productBelongsToBulkPriceCategory({ categoryId: "", category: "Rings" }, "rings-id"), false);
  assert.equal(productBelongsToBulkPriceCategory({ categoryId: 42 }, "42"), false);
});


test("bulk price applies increase percentage to the category base price", () => {
  assert.equal(calculateBulkPrice(1000, 15, "increase"), 1150);
});

test("bulk price applies decrease percentage to the category base price", () => {
  assert.equal(calculateBulkPrice(1000, 15, "decrease"), 850);
});

test("bulk price rejects invalid values and discounts over 100 percent", () => {
  assert.throws(() => calculateBulkPrice(0, 10, "increase"));
  assert.throws(() => calculateBulkPrice(1000, 101, "decrease"));
});

test("full product edit maps all fields and media to Firestore slots", () => {
  const patch = buildProductEditPatch({
    name: "Edited ring", price: 250, image: "cover.jpg",
    images: ["cover.jpg", "side.jpg", "detail.jpg", "back.jpg", "ignored.jpg"],
    videos: ["one.mp4", "two.mp4", "three.mp4", "ignored.mp4"],
    category: "Rings", categoryId: "cat-rings", collectionId: "collection-a", description: "New description", material: "Silver",
    design: "Floral", finish: "Polished", idealFor: "Daily wear", isVisible: false,
    stockStatus: "out_of_stock",
  });
  assert.equal(patch.name, "Edited ring");
  assert.equal(patch.mrp, 250);
  assert.equal(patch.image, "cover.jpg");
  assert.equal(patch.image3, "back.jpg");
  assert.equal(patch.video2, "three.mp4");
  assert.equal(patch.description, "New description");
  assert.equal(patch.isVisible, false);
  assert.equal(patch.categoryId, "cat-rings");
  assert.equal(patch.collectionId, "collection-a");
  assert.equal(patch.stockStatus, "out_of_stock");
});

test("slugify", () => {
  assert.equal(slugify("Gold Plated Necklace!"), "gold-plated-necklace");
});

test("productDocId", () => {
  assert.equal(productDocId(42), "p-42");
});

test("normalize valid row", () => {
  const { doc } = normalizeProductRow(sheetRow);
  assert.ok(doc);
  assert.equal(doc!.sNo, 42);
  assert.equal(doc!.docId, "p-42");
  assert.equal(doc!.mrp, 1499);
  assert.equal(doc!.slug, "gold-plated-necklace-42");
  assert.equal(doc!.isVisible, true);
  assert.ok(doc!.hash.length > 0);
});

test("invalid S No rejected", () => {
  const { doc, error } = normalizeProductRow({ ...sheetRow, "S No": "" });
  assert.equal(doc, null);
  assert.match(error!, /Invalid S No/);
});

test("missing name rejected", () => {
  const { doc, error } = normalizeProductRow({ ...sheetRow, "Product Name": "" });
  assert.equal(doc, null);
  assert.match(error!, /missing Product Name/);
});

test("mrp 0 + no image => hidden", () => {
  const { doc } = normalizeProductRow({
    ...sheetRow,
    MRP: 0,
    Image: "",
    Image1: "",
    Image2: "",
    Image3: "",
  });
  assert.equal(doc!.isVisible, false);
});

test("case-insensitive key fallback", () => {
  const { doc } = normalizeProductRow({ sno: 7, name: "Ring", category: "Rings", mrp: 500, image: "https://x/r.jpg" });
  assert.ok(doc);
  assert.equal(doc!.sNo, 7);
  assert.equal(doc!.mrp, 500);
});

test("hash stable / changes with content", () => {
  const a = normalizeProductRow(sheetRow).doc!;
  const b = normalizeProductRow(sheetRow).doc!;
  const c = normalizeProductRow({ ...sheetRow, MRP: "1999" }).doc!;
  assert.equal(a.hash, b.hash);
  assert.notEqual(a.hash, c.hash);
});

test("docToProduct dedupes images", () => {
  const { doc } = normalizeProductRow(sheetRow);
  const p = docToProduct(doc!);
  assert.equal(p.id, "42");
  assert.equal(p.price, 1499);
  assert.deepEqual(p.images, [
    "https://res.cloudinary.com/x/a.jpg",
    "https://res.cloudinary.com/x/b.jpg",
  ]);
  assert.equal(docToProduct({ ...doc!, collectionId: "collection-a" }).collectionId, "collection-a");
});

test("docToProduct exposes the category link and stock status", () => {
  const doc = normalizeProductRow(sheetRow).doc!;
  const product = docToProduct({ ...doc, categoryId: "cat-earrings", stockStatus: "out_of_stock" });
  assert.equal(product.categoryId, "cat-earrings");
  assert.equal(product.stockStatus, "out_of_stock");
});

test("productHash deterministic", () => {
  const base: Omit<NormalizedProductDoc, "hash" | "updatedAt"> = {
    sNo: 1,
    docId: "p-1",
    category: "Rings",
    name: "Ring",
    description: "",
    material: "",
    design: "",
    finish: "",
    idealFor: "",
    mrp: 100,
    image: "https://x/1.jpg",
    image1: "",
    image2: "",
    image3: "",
    video: "",
    video1: "",
    video2: "",
    source: "excel",
    dateOfAdd: "",
    slug: "ring-1",
    isVisible: true,
  };
  assert.equal(productHash(base), productHash({ ...base }));
  assert.notEqual(productHash(base), productHash({ ...base, mrp: 200 }));
});

console.log("\nproduct-sync (full-replace, soft-hide)");

const testCatalog = {
  collections: [
    { id: "spring", name: "Spring", slug: "spring", categoryIds: ["rings", "earrings"] },
    { id: "summer", name: "Summer", slug: "summer", categoryIds: ["rings"] },
  ],
  categories: [
    { id: "rings", name: "Rings", slug: "rings" },
    { id: "earrings", name: "Earrings", slug: "earrings" },
  ],
};

function row(sNo: number, name: string, mrp = 100, image = "https://x/i.jpg", collection = "Spring", category = "Rings") {
  return { "S No": sNo, "Product Name": name, Collection: collection, Category: category, MRP: mrp, Image: image };
}

test("inserts new products", () => {
  const plan = buildSyncPlan([row(1, "A")], new Map(), testCatalog);
  assert.equal(plan.safe, true);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "insert");
  assert.equal(plan.hides.length, 0);
  assert.equal(plan.writes[0].doc.collectionId, "spring");
  assert.equal(plan.writes[0].doc.categoryId, "rings");
});

test("skips unchanged products", () => {
  const base = normalizeProductRow(row(1, "A")).doc!;
  const linked = { ...base, collectionId: "spring", categoryId: "rings" };
  linked.hash = productHash(linked);
  const existing = new Map([[base.docId, { hash: linked.hash, isVisible: linked.isVisible, collectionId: "spring", categoryId: "rings" }]]);
  const plan = buildSyncPlan([row(1, "A")], existing, testCatalog);
  assert.equal(plan.writes.length, 0);
  assert.equal(plan.skipped, 1);
});

test("updates changed products", () => {
  const doc = normalizeProductRow(row(1, "A")).doc!;
  const existing = new Map([[doc.docId, { hash: doc.hash, isVisible: doc.isVisible }]]);
  const plan = buildSyncPlan([row(1, "A", 999)], existing, testCatalog);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "update");
});

test("preserves Firebase category and stock assignments when an XLSX row updates it", () => {
  const doc = normalizeProductRow(row(1, "A")).doc!;
  const existing = new Map([[doc.docId, {
    hash: doc.hash,
    isVisible: doc.isVisible,
    collectionId: "collection-a",
    categoryId: "category-a",
    categorySlug: "rings",
    stockStatus: "out_of_stock" as const,
  }]]);
  const plan = buildSyncPlan([row(1, "Updated A")], existing, testCatalog);
  assert.ok(plan.writes[0].doc);
  assert.equal(plan.writes[0].doc.collectionId, "spring");
  assert.equal(plan.writes[0].doc.categoryId, "rings");
  assert.equal(plan.writes[0].doc.categorySlug, "rings");
  assert.equal(plan.writes[0].doc.stockStatus, "out_of_stock");
});

test("soft-hides products missing from the file", () => {
  const doc = normalizeProductRow(row(1, "Existing")).doc!;
  const existing = new Map([
    [doc.docId, { hash: "x", isVisible: true }],
    ["p-2", { hash: "y", isVisible: false }],
  ]);
  const plan = buildSyncPlan([row(3, "New")], existing, testCatalog);
  assert.deepEqual(plan.hides, [doc.docId]);
});

test("unsafe when zero valid rows", () => {
  const plan = buildSyncPlan([{ "S No": "", "Product Name": "" }], new Map(), testCatalog);
  assert.equal(plan.safe, false);
  assert.equal(plan.validCount, 0);
});

test("unsafe when invalid >= valid", () => {
  const rows = [row(1, "A"), { "S No": "", "Product Name": "" }, { "S No": "x", "Product Name": "" }];
  const plan = buildSyncPlan(rows, new Map(), testCatalog);
  assert.equal(plan.safe, false);
  assert.equal(plan.errors.length, 2);
  assert.equal(plan.validCount, 1);
});

test("safe when valid > invalid", () => {
  const rows = [row(1, "A"), row(2, "B"), { "S No": "", "Product Name": "" }];
  const plan = buildSyncPlan(rows, new Map(), testCatalog);
  assert.equal(plan.safe, true);
});

console.log("\nadmin-auth (fail-closed)");

test("denies when env unset", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  assert.equal(isAdminEmail("a@b.com"), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
});

test("allows matching email only", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@x.com";
  assert.equal(isAdminEmail("admin@x.com"), true);
  assert.equal(isAdminEmail("other@x.com"), false);
  assert.equal(isAdminEmail(null), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
  else delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
});

test("requireAdmin reads x-admin-email header", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@x.com";
  assert.equal(requireAdmin(new Request("http://x", { headers: { "x-admin-email": "admin@x.com" } })), true);
  assert.equal(requireAdmin(new Request("http://x", { headers: { "x-admin-email": "no@x.com" } })), false);
  assert.equal(requireAdmin(new Request("http://x")), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
  else delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
});

console.log("\nadmin roles (admin vs super admin)");

const ADMIN_ENV_KEYS = [
  "NEXT_PUBLIC_ADMIN_EMAIL",
  "NEXT_PUBLIC_ADMIN_EMAILS",
  "NEXT_PUBLIC_SUPER_ADMIN_EMAILS",
];

/** Run `fn` with only the given admin env set, then restore. */
function withAdminEnv(vars: Record<string, string>, fn: () => void) {
  const saved = ADMIN_ENV_KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of ADMIN_ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(vars)) process.env[key] = value;
  try {
    fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("super admin list is trimmed and case-insensitive", () => {
  withAdminEnv(
    {
      NEXT_PUBLIC_ADMIN_EMAILS: " one@x.com , two@x.com ",
      NEXT_PUBLIC_SUPER_ADMIN_EMAILS: " Boss@X.com ",
    },
    () => {
      assert.equal(isAdminEmail("one@x.com"), true);
      assert.equal(isAdminEmail("two@x.com"), true);
      assert.equal(isSuperAdminEmail("BOSS@x.com"), true);
      assert.equal(isAdminEmail("boss@x.com"), true);
      assert.equal(isSuperAdminEmail("one@x.com"), false);
      assert.equal(isAdminEmail("nobody@x.com"), false);
      assert.equal(isSuperAdminEmail("nobody@x.com"), false);
    }
  );
});

test("legacy single admin keeps the bulk upload when no super list is set", () => {
  withAdminEnv({ NEXT_PUBLIC_ADMIN_EMAIL: "owner@x.com" }, () => {
    assert.equal(isAdminEmail("owner@x.com"), true);
    assert.equal(isSuperAdminEmail("owner@x.com"), true);
  });
});

test("an explicit super list overrides the legacy fallback", () => {
  withAdminEnv(
    {
      NEXT_PUBLIC_ADMIN_EMAIL: "owner@x.com",
      NEXT_PUBLIC_SUPER_ADMIN_EMAILS: "boss@x.com",
    },
    () => {
      assert.equal(isAdminEmail("owner@x.com"), true);
      assert.equal(isSuperAdminEmail("owner@x.com"), false);
      assert.equal(isSuperAdminEmail("boss@x.com"), true);
    }
  );
});

test("fail-closed: nothing configured denies admin and super admin", () => {
  withAdminEnv({}, () => {
    const headers = { "x-admin-email": "owner@x.com" };
    assert.equal(isAdminEmail("owner@x.com"), false);
    assert.equal(isSuperAdminEmail("owner@x.com"), false);
    assert.equal(requireAdmin(new Request("http://x", { headers })), false);
    assert.equal(requireSuperAdmin(new Request("http://x", { headers })), false);
  });
});

test("requireSuperAdmin turns plain admins away at the header", () => {
  withAdminEnv(
    {
      NEXT_PUBLIC_ADMIN_EMAIL: "owner@x.com",
      NEXT_PUBLIC_ADMIN_EMAILS: "plain@x.com",
    },
    () => {
      const plain = new Request("http://x", { headers: { "x-admin-email": "plain@x.com" } });
      const owner = new Request("http://x", { headers: { "x-admin-email": "owner@x.com" } });
      assert.equal(requireAdmin(plain), true);
      assert.equal(requireSuperAdmin(plain), false);
      assert.equal(requireSuperAdmin(owner), true);
      assert.equal(requireSuperAdmin(new Request("http://x")), false);
    }
  );
});

console.log("\nrefunds (review + coin credit)");

test("approve with user credits once", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1" }, "approve", 1000);
  assert.equal(plan.status, "approved");
  assert.equal(plan.creditCoins, true);
  assert.equal(plan.coinAmount, 100);
  assert.equal(plan.coinsAdded, true);
  assert.equal(plan.coinsAddedAt, 1000);
});

test("approve without user does not credit", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: null }, "approve");
  assert.equal(plan.status, "approved");
  assert.equal(plan.creditCoins, false);
  assert.equal(plan.coinsAdded, false);
});

test("approve already-credited does not double credit", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1", coinsAdded: true }, "approve");
  assert.equal(plan.creditCoins, false);
  assert.equal(plan.coinsAdded, true);
});

test("reject never credits", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1" }, "reject");
  assert.equal(plan.status, "rejected");
  assert.equal(plan.creditCoins, false);
});

console.log("\norders (fulfillment)");

test("sets courier + awb", () => {
  const patch = buildFulfillmentPatch({ status: "paid" }, { courier: "Delhivery", awb: " A1 " });
  assert.equal(patch.fulfillment.courier, "Delhivery");
  assert.equal(patch.fulfillment.awb, "A1");
});

test("shipped stamps shippedAt once", () => {
  const first = buildFulfillmentPatch({ status: "paid" }, { status: "shipped" }, 500);
  assert.equal(first.status, "shipped");
  assert.equal(first.fulfillment.shippedAt, 500);

  const second = buildFulfillmentPatch(
    { status: "shipped", fulfillment: first.fulfillment },
    { status: "shipped" },
    900
  );
  assert.equal(second.fulfillment.shippedAt, 500);
});

test("delivered stamps shippedAt + deliveredAt", () => {
  const patch = buildFulfillmentPatch({ status: "shipped" }, { status: "delivered" }, 700);
  assert.equal(patch.status, "delivered");
  assert.equal(patch.fulfillment.shippedAt, 700);
  assert.equal(patch.fulfillment.deliveredAt, 700);
});

test("invalid status ignored", () => {
  const patch = buildFulfillmentPatch({ status: "paid" }, { status: "banana" });
  assert.equal(patch.status, undefined);
});

console.log("\nproduct videos + source");

test("normalize picks video fields, defaults source excel", () => {
  const { doc } = normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" });
  assert.equal(doc!.video, "https://res.cloudinary.com/x/v.mp4");
  assert.equal(doc!.source, "excel");
});

test("hash changes when video changes", () => {
  const a = normalizeProductRow(sheetRow).doc!;
  const b = normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" }).doc!;
  assert.notEqual(a.hash, b.hash);
});

test("docToProduct exposes videos, images unchanged", () => {
  const p = docToProduct(normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" }).doc!);
  assert.deepEqual(p.videos, ["https://res.cloudinary.com/x/v.mp4"]);
  assert.deepEqual(p.images, [
    "https://res.cloudinary.com/x/a.jpg",
    "https://res.cloudinary.com/x/b.jpg",
  ]);
});

test("video-only product is still visible", () => {
  const { doc } = normalizeProductRow({
    ...sheetRow,
    Image: "",
    Image1: "",
    Image2: "",
    Video: "https://res.cloudinary.com/x/v.mp4",
  });
  assert.equal(doc!.isVisible, true);
});

test("no media at all stays hidden", () => {
  const { doc } = normalizeProductRow({
    ...sheetRow,
    Image: "",
    Image1: "",
    Image2: "",
  });
  assert.equal(doc!.isVisible, false);
});

console.log("\nsync skips manual docs");

test("manual docs are never hidden", () => {
  const existing = new Map([["p-9", { hash: "x", isVisible: true, source: "manual" }]]);
  const plan = buildSyncPlan([{ "S No": 1, "Product Name": "A", Collection: "Spring", Category: "Rings", MRP: 100, Image: "https://x/i.jpg" }], existing, testCatalog);
  assert.deepEqual(plan.hides, []);
});

test("excel row reusing a manual S No wins and flips source", () => {
  const existing = new Map([["p-9", { hash: "old", isVisible: true, source: "manual" }]]);
  const plan = buildSyncPlan([{ "S No": 9, "Product Name": "A", Collection: "Spring", Category: "Rings", MRP: 100, Image: "https://x/i.jpg" }], existing, testCatalog);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "update");
});

console.log("\nmanual create validation");

test("validateManualInput accepts a category assignment", () => {
  const result = validateManualInput({
    name: "A",
    mrp: 100,
    images: ["https://res.cloudinary.com/x/a.jpg"],
    videos: [],
    categoryId: "category-1",
    collectionId: "collection-2",
  });
  assert.equal(result.ok, true);
});

test("validateManualInput requires both a category and a collection", () => {
  assert.equal(validateManualInput({
    name: "A", mrp: 100, images: ["https://res.cloudinary.com/x/a.jpg"], videos: [],
    categoryId: "category-1", collectionId: "",
  }).ok, false);

  const result = validateManualInput({
    name: "A",
    mrp: 100,
    images: ["https://res.cloudinary.com/x/a.jpg"],
    videos: [],
    categoryId: "",
    collectionId: "collection-1",
  });
  assert.equal(result.ok, false);
});

test("validateManualInput rejects zero-media submit", () => {
  assert.equal(validateManualInput({ name: "A", mrp: 100, images: [], videos: [], categoryId: "category-1", collectionId: "collection-1" }).ok, false);
});

test("validateManualInput accepts Cloudinary URL with query params", () => {
  assert.equal(validateManualInput({ name: "A", mrp: 100, images: [], videos: ["https://res.cloudinary.com/x/v.mp4?tx=crop"], categoryId: "category-1", collectionId: "collection-1" }).ok, true);
});

console.log("\nmedia upload guards");

test("Cloudinary upload uses the project cloud and unsigned preset when env values are unset", () => {
  assert.equal(resolveCloudinaryCloudName(undefined), "dndppvnjl");
  assert.equal(resolveCloudinaryCloudName("custom-cloud"), "custom-cloud");
  assert.equal(resolveCloudinaryUploadPreset(undefined), "swas_products");
  assert.equal(resolveCloudinaryUploadPreset("custom-preset"), "custom-preset");
});

test("isMediaAllowed rejects wrong type and oversize video", () => {
  assert.equal(isMediaAllowed({ name: "a.exe", size: 10 }), false);
  assert.equal(isMediaAllowed({ name: "v.mp4", size: 200 * 1024 * 1024 }), false);
  assert.equal(isMediaAllowed({ name: "p.webp", size: 1000 }), true);
});

console.log("\ngallery media order");

test("interleaves image/video in fixed slots", () => {
  const media = interleaveMedia(["i0", "i1", "i2", "i3"], ["v0", "v1", "v2"]);
  assert.deepEqual(media, [
    { kind: "image", src: "i0" },
    { kind: "video", src: "v0" },
    { kind: "image", src: "i1" },
    { kind: "video", src: "v1" },
    { kind: "image", src: "i2" },
    { kind: "video", src: "v2" },
    { kind: "image", src: "i3" },
  ]);
});

test("excel products (no videos) keep image-only order", () => {
  assert.deepEqual(interleaveMedia(["a.jpg", "b.jpg"]), [
    { kind: "image", src: "a.jpg" },
    { kind: "image", src: "b.jpg" },
  ]);
});

test("three images + three videos yield six alternating slots", () => {
  const media = interleaveMedia(["m1", "m2", "m3"], ["v1", "v2", "v3"]);
  assert.deepEqual(
    media.map((m) => m.kind),
    ["image", "video", "image", "video", "image", "video"]
  );
});

test("empty/whitespace slots are dropped", () => {
  assert.deepEqual(interleaveMedia(["", "  "], ["  "]), []);
});

console.log("\nhome page videos");

test("shipped defaults pass the validator", () => {
  assert.equal(DEFAULT_HOME_VIDEOS.carousel.length, CAROUSEL_DEFAULT_COUNT);
  assert.equal(validateHomeVideoInput({ ...DEFAULT_HOME_VIDEOS }).ok, true);
});

test("missing or empty settings fall back to the shipped defaults", () => {
  assert.deepEqual(normalizeHomeVideos(null), DEFAULT_HOME_VIDEOS);
  assert.deepEqual(normalizeHomeVideos({}), DEFAULT_HOME_VIDEOS);
});

test("collection banner video is not part of editable homepage videos", () => {
  const banner = "https://res.cloudinary.com/demo/video/upload/v1/collection.mp4";
  assert.deepEqual(normalizeHomeVideos({ collectionFilm: banner }), {
    hero: DEFAULT_HOME_VIDEOS.hero,
    carousel: DEFAULT_HOME_VIDEOS.carousel,
  });
  assert.equal(validateHomeVideoInput({ collectionFilm: banner }).ok, false);
});

test("stored override wins, untouched slots keep the default", () => {
  const hero = "https://res.cloudinary.com/demo/video/upload/v1/new-hero.mp4";
  const videos = normalizeHomeVideos({ hero });
  assert.equal(videos.hero, hero);
  assert.deepEqual(videos.carousel, DEFAULT_HOME_VIDEOS.carousel);
  assert.deepEqual(Object.keys(videos).sort(), ["carousel", "hero"]);
});

test("blank or non-video stored values fall back to the default", () => {
  assert.deepEqual(
    normalizeHomeVideos({ carousel: "   " }).carousel,
    DEFAULT_HOME_VIDEOS.carousel
  );
  assert.deepEqual(
    normalizeHomeVideos({ carousel: ["https://x/poster.jpg"] }).carousel,
    DEFAULT_HOME_VIDEOS.carousel
  );
});

test("carousel keeps several distinct clips, in order", () => {
  const a = "https://res.cloudinary.com/demo/video/upload/v1/card-a.mp4";
  const b = "https://res.cloudinary.com/demo/video/upload/v1/card-b.webm";
  assert.deepEqual(normalizeHomeVideos({ carousel: [a, b] }).carousel, [a, b]);
});

test("carousel accepts a legacy single string and drops invalid entries", () => {
  const a = "https://res.cloudinary.com/demo/video/upload/v1/card-a.mp4";
  assert.deepEqual(normalizeHomeVideos({ carousel: a }).carousel, [a]);
  assert.deepEqual(
    normalizeHomeVideos({ carousel: [a, "not a url", "", "https://x/pic.png"] }).carousel,
    [a]
  );
});

test("carousel is capped at CAROUSEL_MAX clips", () => {
  const many = Array.from(
    { length: CAROUSEL_MAX + 4 },
    (_, i) => `https://res.cloudinary.com/demo/video/upload/v1/c${i}.mp4`
  );
  assert.equal(normalizeHomeVideos({ carousel: many }).carousel.length, CAROUSEL_MAX);
});

test("validateHomeVideoInput accepts a partial https video patch", () => {
  const url = "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4?tx=crop";
  const result = validateHomeVideoInput({ hero: url });
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok ? result.patch : null, { hero: url });
});

test("validateHomeVideoInput accepts a carousel list", () => {
  const urls = [
    "https://res.cloudinary.com/demo/video/upload/v1/card-a.mp4",
    "https://res.cloudinary.com/demo/video/upload/v1/card-b.webm?tx=1",
  ];
  const result = validateHomeVideoInput({ carousel: urls });
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok ? result.patch : null, { carousel: urls });
});

test("validateHomeVideoInput rejects bad carousel payloads", () => {
  const url = "https://res.cloudinary.com/demo/video/upload/v1/card.mp4";
  assert.equal(validateHomeVideoInput({ carousel: url }).ok, false, "bare string");
  assert.equal(validateHomeVideoInput({ carousel: [] }).ok, false, "empty");
  assert.equal(
    validateHomeVideoInput({ carousel: Array.from({ length: CAROUSEL_MAX + 1 }, () => url) }).ok,
    false,
    "over the cap"
  );
  assert.equal(validateHomeVideoInput({ carousel: [url, "https://x/pic.png"] }).ok, false, "image");
  assert.equal(validateHomeVideoInput({ carousel: [url, "http://x/a.mp4"] }).ok, false, "http");
});

test("validateHomeVideoInput rejects unknown slots, images, http and blanks", () => {
  assert.equal(validateHomeVideoInput(null).ok, false);
  assert.equal(validateHomeVideoInput({}).ok, false);
  assert.equal(validateHomeVideoInput({ banner: "https://x/a.mp4" }).ok, false);
  assert.equal(validateHomeVideoInput({ hero: "https://x/a.jpg" }).ok, false);
  assert.equal(validateHomeVideoInput({ hero: "http://x/a.mp4" }).ok, false);
  assert.equal(validateHomeVideoInput({ hero: "   " }).ok, false);
});

test("slot metadata covers exactly the video keys", () => {
  assert.deepEqual(
    [...SINGLE_HOME_VIDEO_SLOTS.map((s) => s.key), "carousel"].sort(),
    [...HOME_VIDEO_KEYS].sort()
  );
});

test("carouselSlides pairs a clip per card and cycles captions", () => {
  const captions = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(carouselSlides(["a", "b"], captions), [
    { video: "a", caption: { id: 1 } },
    { video: "b", caption: { id: 2 } },
  ]);

  // More clips than captions: captions cycle.
  assert.deepEqual(
    carouselSlides(["a", "b", "c"], captions).map((s) => s.caption),
    [{ id: 1 }, { id: 2 }, { id: 1 }]
  );

  // No captions at all: clips still render.
  assert.deepEqual(carouselSlides(["a"], []), [{ video: "a", caption: undefined }]);
  assert.deepEqual(carouselSlides([], captions), []);
});

test("isVideoUrl reads the last path segment and ignores query strings", () => {
  assert.equal(
    isVideoUrl("https://res.cloudinary.com/demo/video/upload/f_mp4,q_auto,w_1200/clip.mp4"),
    true
  );
  assert.equal(
    isVideoUrl("https://res.cloudinary.com/demo/video/upload/v1/clip.webm?tx=crop"),
    true
  );
  assert.equal(isVideoUrl("https://res.cloudinary.com/demo/image/upload/v1/a.mp4.jpg"), false);
  assert.equal(isVideoUrl(""), false);
  assert.equal(isVideoUrl(null), false);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
void (async () => {
  for (const { name, fn } of asyncTests) {
    try {
      await fn();
      passed++;
      console.log(`  PASS  ${name}`);
    } catch (err) {
      failed++;
      console.log("  FAIL", name, err);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
