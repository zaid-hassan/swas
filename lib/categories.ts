import type { Firestore } from "firebase-admin/firestore";
import { isImageUrl } from "./media-upload";
import { slugify } from "./product-rows";
import { collectionCategoryIds } from "./catalog-schema";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type AdminCategory = CategoryRecord & {
  assignedCollectionIds: string[];
  collectionName: string;
  collectionNames: string[];
  productCount: number;
  expired: boolean;
};

export type CategoryInput = {
  name: unknown;
  description?: unknown;
  imageUrl?: unknown;
  expiresAt?: unknown;
};

export function validateCategoryInput(
  input: CategoryInput
): { ok: true; name: string; description: string; imageUrl: string; expiresAt: number | null } | { ok: false; error: string } {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const description = typeof input?.description === "string" ? input.description.trim() : "";
  const imageUrl = typeof input?.imageUrl === "string" ? input.imageUrl.trim() : "";
  const expiresAt = input?.expiresAt == null || input.expiresAt === "" ? null : Number(input.expiresAt);

  if (!name) return { ok: false, error: "Category name is required" };
  if (name.length > 80) return { ok: false, error: "Category name must be 80 characters or fewer" };
  if (description.length > 500) return { ok: false, error: "Category description must be 500 characters or fewer" };
  if (imageUrl && !isImageUrl(imageUrl)) return { ok: false, error: "Category image must be a supported image URL" };
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= 0)) {
    return { ok: false, error: "Expiry must be a valid date" };
  }

  return { ok: true, name, description, imageUrl, expiresAt };
}

export function isExpired(record: { expiresAt?: unknown }, now = Date.now()): boolean {
  return typeof record.expiresAt === "number" && record.expiresAt <= now;
}

export function isCatalogRecordAvailable(
  record: { expiresAt?: unknown; deletedAt?: unknown },
  now = Date.now()
): boolean {
  return !record.deletedAt && !isExpired(record, now);
}

export function sortCategories<T extends { sortOrder?: unknown; name?: unknown }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : Number.MAX_SAFE_INTEGER;
    return orderA - orderB || String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
}

export async function listCategories(db: Firestore): Promise<AdminCategory[]> {
  const [categorySnapshot, collectionSnapshot, productSnapshot] = await Promise.all([
    db.collection("categories").get(),
    db.collection("collections").get(),
    db.collection("products").get(),
  ]);
  const collectionEntries = collectionSnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const collections = new Map(collectionEntries.map(({ id, data }) => [id, data]));
  const products = productSnapshot.docs.map((doc) => doc.data());
  const now = Date.now();

  return sortCategories(categorySnapshot.docs.map((doc) => {
    const data = doc.data();
    const assignedCollectionIds = collectionEntries
      .filter(({ data: collection }) => collectionCategoryIds({ id: "", categoryIds: collection.categoryIds }).includes(doc.id))
      .map(({ id }) => id);
    const collectionNames = assignedCollectionIds.map((id) => {
      const collectionName = collections.get(id)?.name;
      return typeof collectionName === "string" ? collectionName : id;
    });
    const categoryName = typeof data.name === "string" ? data.name : "";
    const categorySlug = typeof data.slug === "string" ? data.slug : slugify(categoryName);
    const availableCollectionIds = assignedCollectionIds.filter((id) => {
      const collection = collections.get(id);
      return collection && isCatalogRecordAvailable(collection, now);
    });
    return {
      id: doc.id,
      assignedCollectionIds,
      name: categoryName,
      slug: categorySlug,
      description: typeof data.description === "string" ? data.description : "",
      imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : Number.MAX_SAFE_INTEGER,
      expiresAt: typeof data.expiresAt === "number" ? data.expiresAt : null,
      createdAt: Number(data.createdAt ?? 0),
      updatedAt: Number(data.updatedAt ?? 0),
      collectionName: collectionNames.join(", "),
      collectionNames,
      productCount: products.filter((product) => product.categoryId === doc.id).length,
      expired: !isCatalogRecordAvailable(data, now) || (assignedCollectionIds.length > 0 && !availableCollectionIds.length),
    };
  }));
}

export async function createCategory(db: Firestore, input: CategoryInput): Promise<CategoryRecord> {
  const validation = validateCategoryInput(input);
  if (!validation.ok) throw new Error(validation.error);

  const categoryRef = db.collection("categories").doc();
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const allCategories = await transaction.get(db.collection("categories"));
    const existing = allCategories.docs.map((doc) => doc.data());
    const baseSlug = slugify(validation.name) || "category";
    const slugQuery = await transaction.get(db.collection("categories").where("slug", "==", baseSlug).limit(1));
    const slug = slugQuery.empty ? baseSlug : `${baseSlug}-${categoryRef.id.slice(0, 6)}`;
    const sortOrder = existing.reduce((max, category) =>
      Math.max(max, Number.isFinite(Number(category.sortOrder)) ? Number(category.sortOrder) : 0), 0
    ) + 1000;
    const record: CategoryRecord = {
      id: categoryRef.id,
      name: validation.name,
      slug,
      description: validation.description,
      imageUrl: validation.imageUrl,
      sortOrder,
      expiresAt: validation.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    transaction.create(categoryRef, { ...record, nameLower: validation.name.toLowerCase() });
    return record;
  });
}

export async function updateCategory(
  db: Firestore,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const ref = db.collection("categories").doc(id);
  if (Object.hasOwn(patch, "collectionIds") || Object.hasOwn(patch, "collectionId")) {
    throw new Error("Assign categories from the collection settings");
  }
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Category not found");
  const update: Record<string, unknown> = { updatedAt: Date.now() };

  if (patch.name !== undefined) {
    if (typeof patch.name !== "string" || !patch.name.trim() || patch.name.trim().length > 80) {
      throw new Error("Category name must be between 1 and 80 characters");
    }
    update.name = patch.name.trim();
    update.nameLower = patch.name.trim().toLowerCase();
    update.slug = slugify(patch.name.trim()) || "category";
  }
  if (patch.description !== undefined) {
    if (typeof patch.description !== "string" || patch.description.trim().length > 500) {
      throw new Error("Category description must be 500 characters or fewer");
    }
    update.description = patch.description.trim();
  }
  if (patch.imageUrl !== undefined) {
    if (typeof patch.imageUrl !== "string" || (patch.imageUrl.trim() && !isImageUrl(patch.imageUrl.trim()))) {
      throw new Error("Category image must be a supported image URL");
    }
    update.imageUrl = patch.imageUrl.trim();
  }
  if (patch.sortOrder !== undefined) {
    const sortOrder = Number(patch.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new Error("Sort order must be a non-negative whole number");
    update.sortOrder = sortOrder;
  }
  if (patch.expiresAt !== undefined) {
    if (patch.expiresAt === null || patch.expiresAt === "") update.expiresAt = null;
    else {
      const expiresAt = Number(patch.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= 0) throw new Error("Expiry must be a valid date");
      update.expiresAt = expiresAt;
    }
  }

  await ref.set(update, { merge: true });
}
export async function reorderCategories(db: Firestore, firstId: string, secondId: string): Promise<void> {
  if (!firstId || !secondId || firstId === secondId) throw new Error("Choose two different categories");
  const now = Date.now();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(db.collection("categories"));
    const ordered = sortCategories(snapshot.docs.map((doc) => ({
      id: doc.id,
      ref: doc.ref,
      sortOrder: doc.data().sortOrder,
      name: doc.data().name,
    })));
    const firstIndex = ordered.findIndex((category) => category.id === firstId);
    const secondIndex = ordered.findIndex((category) => category.id === secondId);
    if (firstIndex < 0 || secondIndex < 0) throw new Error("Category not found");
    if (Math.abs(firstIndex - secondIndex) !== 1) throw new Error("Categories must be adjacent to reorder");
    [ordered[firstIndex], ordered[secondIndex]] = [ordered[secondIndex], ordered[firstIndex]];
    if (ordered.length > 450) throw new Error("Too many categories to reorder in one operation");
    ordered.forEach((category, index) => {
      const sortOrder = (index + 1) * 1000;
      if (Number(category.sortOrder) !== sortOrder) {
        transaction.update(category.ref, { sortOrder, updatedAt: now });
      }
    });
  });
}

export async function deleteCategory(db: Firestore, id: string): Promise<void> {
  const categoryRef = db.collection("categories").doc(id);
  await db.runTransaction(async (transaction) => {
    const categorySnap = await transaction.get(categoryRef);
    if (!categorySnap.exists) throw new Error("Category not found");
    const [assignedProducts, collectionSnapshot] = await Promise.all([
      transaction.get(db.collection("products").where("categoryId", "==", id).limit(1)),
      transaction.get(db.collection("collections")),
    ]);
    if (!assignedProducts.empty) {
      throw new Error("Reassign or remove this category’s products before deleting it");
    }
    const now = Date.now();
    transaction.delete(categoryRef);
    for (const collectionDoc of collectionSnapshot.docs) {
      const collectionData = collectionDoc.data() ?? {};
      const currentIds = collectionCategoryIds({ id: collectionDoc.id, categoryIds: collectionData.categoryIds });
      if (!currentIds.includes(id)) continue;
      const remainingCategoryIds = currentIds.filter((categoryId) => categoryId !== id);
      transaction.set(collectionDoc.ref, {
        categoryIds: remainingCategoryIds,
        categoryCount: remainingCategoryIds.length,
        updatedAt: now,
      }, { merge: true });
    }
  });
}
