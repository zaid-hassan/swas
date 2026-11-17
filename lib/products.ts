import { docToProduct } from "./product-rows";
import type { NormalizedProductDoc } from "./product-rows";
import { Product, AdminProduct } from "@/types/products";
import { isCatalogRecordAvailable, sortCategories } from "./categories";
import { collectionCategoryIds } from "./catalog-schema";
import { slugify } from "./product-rows";

// In-memory cache: 88 docs × per-request reads would get expensive.
// All storefront read paths funnel through getProducts(), so one 5-minute
// cache here caps Firestore reads regardless of visitor traffic.
let cache: { at: number; products: Product[] } | null = null;
// Admin needs hidden products too; separate short-lived cache.
let adminCache: { at: number; products: AdminProduct[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toNormalized(docId: string, data: Record<string, unknown>): NormalizedProductDoc {
  const text = (key: string) => typeof data[key] === "string" ? data[key] as string : "";
  const number = (key: string) => {
    const value = Number(data[key] ?? 0);
    return Number.isFinite(value) ? value : 0;
  };
  return {
    sNo: number("sNo"),
    docId,
    category: text("category"),
    ...(typeof data.categoryId === "string" && data.categoryId ? { categoryId: data.categoryId } : {}),
    name: text("name"),
    description: text("description"),
    material: text("material"),
    design: text("design"),
    finish: text("finish"),
    idealFor: text("idealFor"),
    mrp: number("mrp"),
    image: text("image"),
    image1: text("image1"),
    image2: text("image2"),
    image3: text("image3"),
    video: text("video"),
    video1: text("video1"),
    video2: text("video2"),
    source: data.source === "manual" ? "manual" : "excel",
    ...(typeof data.collectionId === "string" && data.collectionId ? { collectionId: data.collectionId } : {}),
    stockStatus: data.stockStatus === "out_of_stock" ? "out_of_stock" : "in_stock",
    dateOfAdd: text("dateOfAdd"),
    slug: text("slug"),
    isVisible: typeof data.isVisible === "boolean" ? data.isVisible : true,
    hash: text("hash"),
    updatedAt: number("updatedAt"),
  };
}

type CategoryLink = {
  id: string;
  name?: unknown;
  slug?: unknown;
  expiresAt?: unknown;
  deletedAt?: unknown;
};

/**
 * Resolves a product's category record from its stored `categoryId` only.
 * Category *identity* never comes from the free-text `category` label, and a
 * label that happens to match a saved category is not treated as an assignment.
 */
export function findCategoryForProduct(
  product: { categoryId?: unknown; category?: unknown },
  categories: CategoryLink[]
): CategoryLink | undefined {
  if (typeof product.categoryId === "string" && product.categoryId) {
    return categories.find((category) => category.id === product.categoryId);
  }
  return undefined;
}

async function readAllNormalized(): Promise<NormalizedProductDoc[]> {
  // Server-only: dynamic import so client bundles never pull firebase-admin.
  const { adminDb } = await import("./firebase-admin");
  const [snap, categorySnap, collectionSnap] = await Promise.all([
    adminDb.collection("products").get(),
    adminDb.collection("categories").get(),
    adminDb.collection("collections").get(),
  ]);
  const categoryRecords = categorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const collections = new Map(collectionSnap.docs.map((doc) => [doc.id, doc.data()]));
  const now = Date.now();
  const out: NormalizedProductDoc[] = [];
  snap.forEach((d) => {
    const data = d.data();
    const normalized = toNormalized(d.id, data);
    const category = findCategoryForProduct(normalized, categoryRecords);
    const collectionId = typeof normalized.collectionId === "string" ? normalized.collectionId : "";
    const collection = collectionId ? collections.get(collectionId) : undefined;

    if (!category || !collection) {
      // Canonical assignment requires both a saved category and a saved collection.
      normalized.storefrontAvailable = false;
    } else {
      if (!normalized.collectionId) normalized.collectionId = collectionId;
      normalized.category = typeof category.name === "string" ? category.name : normalized.category;
      normalized.categorySlug = typeof category.slug === "string" ? category.slug : slugify(normalized.category);
      normalized.storefrontAvailable =
        collectionCategoryIds({ id: collectionId, categoryIds: collection.categoryIds }).includes(category.id) &&
        isCatalogRecordAvailable(category, now) &&
        isCatalogRecordAvailable(collection, now);
    }
    out.push(normalized);
  });
  // Keep storefront/admin order stable (S No ascending)
  out.sort((a, b) => a.sNo - b.sNo);
  return out;
}

export async function getProducts(options: { fresh?: boolean } = {}): Promise<Product[]> {
  if (!options.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.products;

  const all = await readAllNormalized();
  const products = all
    .filter((p) => p.isVisible !== false && p.storefrontAvailable !== false)
    .map(docToProduct);

  cache = { at: Date.now(), products };
  return products;
}

export async function getAllProducts(): Promise<AdminProduct[]> {
  if (adminCache && Date.now() - adminCache.at < CACHE_TTL_MS) {
    return adminCache.products;
  }

  const all = await readAllNormalized();
  const products: AdminProduct[] = all.map((p) => ({
    ...docToProduct(p),
    isVisible: p.isVisible !== false,
  }));

  adminCache = { at: Date.now(), products };
  return products;
}

export function clearProductsCache() {
  cache = null;
  adminCache = null;
}

/**
 * Storefront category list: every saved category that at least one available
 * collection lists in `categoryIds`. Membership is owned by collections only —
 * free-text product labels never create storefront categories.
 */
export async function getCategories(): Promise<Array<{
  id: string;
  collectionId?: string;
  title: string;
  slug: string;
  image: string;
  sortOrder: number;
}>> {
  const [{ adminDb }, products] = await Promise.all([
    import("./firebase-admin"),
    getProducts(),
  ]);
  const [categorySnapshot, collectionSnapshot] = await Promise.all([
    adminDb.collection("categories").get(),
    adminDb.collection("collections").get(),
  ]);
  const collectionEntries = collectionSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as Record<string, unknown>,
  }));
  const collections = new Map(collectionEntries.map((entry) => [entry.id, entry.data]));
  const now = Date.now();

  return sortCategories(categorySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      const owningCollectionIds = collectionEntries
        .filter(({ data: collection }) => collectionCategoryIds({ id: "", categoryIds: collection.categoryIds }).includes(doc.id))
        .map(({ id }) => id);
      const collectionId = owningCollectionIds.find((id) => {
        const collection = collections.get(id);
        return collection && isCatalogRecordAvailable(collection, now);
      }) ?? "";
      const collection = collections.get(collectionId);
      if (!isCatalogRecordAvailable(data, now) || !collection) return null;
      const title = typeof data.name === "string" ? data.name.trim() : "";
      if (!title) return null;
      const related = products.find((product) => product.categoryId === doc.id);
      return {
        id: doc.id,
        collectionId,
        title,
        slug: typeof data.slug === "string" ? data.slug : slugify(title),
        image: typeof data.imageUrl === "string" && data.imageUrl ? data.imageUrl : related?.image || "",
        sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((category): category is NonNullable<typeof category> => Boolean(category)));
}

/** Resolves a `?category=` value to a storefront category id; accepts an id or a slug. */
export function resolveCategoryParam(
  categories: Array<{ id: string; slug: string }>,
  value: string
): string | undefined {
  const needle = value.trim();
  if (!needle) return undefined;
  return categories.find((category) => category.id === needle)?.id
    ?? categories.find((category) => category.slug === needle)?.id;
}