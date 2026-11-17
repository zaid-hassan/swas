import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { isVideoUrl } from "./media-upload";
import { slugify } from "./product-rows";
import { isCatalogRecordAvailable } from "./categories";

export type CollectionRecord = {
  id: string;
  categoryIds: string[];
  isActive: boolean;
  name: string;
  slug: string;
  bannerUrl: string;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type AdminCollection = CollectionRecord & { categoryCount: number; productCount: number; expired: boolean };

export type CollectionInput = {
  name: unknown;
  bannerUrl: unknown;
  categoryIds?: unknown;
  expiresAt?: unknown;
};

function normalizeCategoryIds(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Category selection must contain valid category IDs");
  }
  return [...new Set(value.map((id: string) => id.trim()))];
}

function storedCategoryIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean))]
    : [];
}

function validCloudinaryVideo(url: string): boolean {
  if (!isVideoUrl(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function validateCollectionInput(
  input: CollectionInput
): { ok: true; name: string; bannerUrl: string; expiresAt: number | null } | { ok: false; error: string } {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const bannerUrl = typeof input?.bannerUrl === "string" ? input.bannerUrl.trim() : "";
  const expiresAt = input?.expiresAt == null || input.expiresAt === "" ? null : Number(input.expiresAt);
  if (!name) return { ok: false, error: "Collection name is required" };
  if (name.length > 100) return { ok: false, error: "Collection name must be 100 characters or fewer" };
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= 0)) return { ok: false, error: "Expiry must be a valid date" };
  if (!validCloudinaryVideo(bannerUrl)) return { ok: false, error: "Banner URL must be a secure Cloudinary video URL" };
  return { ok: true, name, bannerUrl, expiresAt };
}

function collectionBannerUrl(data: Record<string, unknown>): string {
  const current = typeof data.bannerUrl === "string" ? data.bannerUrl.trim() : "";
  if (validCloudinaryVideo(current)) return current;
  const legacy = typeof data.bannerVideoUrl === "string" ? data.bannerVideoUrl.trim() : "";
  return validCloudinaryVideo(legacy) ? legacy : "";
}

export function countProductsByCollectionId(
  collectionId: string,
  products: Array<{ collectionId?: unknown }>
): number {
  return products.reduce((count, product) => count + (product.collectionId === collectionId ? 1 : 0), 0);
}

export async function createCollection(
  db: Firestore,
  input: CollectionInput
): Promise<CollectionRecord> {
  const validation = validateCollectionInput(input);
  if (!validation.ok) throw new Error(validation.error);

  const categoryIds = normalizeCategoryIds(input.categoryIds);
  const nameLower = validation.name.toLowerCase();
  const reservationId = createHash("sha256").update(nameLower).digest("hex");
  const reservationRef = db.collection("collectionNames").doc(reservationId);
  const categoryRefs = categoryIds.map((categoryId) => db.collection("categories").doc(categoryId));
  const ref = db.collection("collections").doc();
  const now = Date.now();
  const slugBase = slugify(validation.name) || "collection";
  const record: CollectionRecord = {
    id: ref.id,
    categoryIds,
    isActive: true,
    name: validation.name,
    slug: slugBase,
    bannerUrl: validation.bannerUrl,
    expiresAt: validation.expiresAt,
    createdAt: now,
    updatedAt: now,
  };
  return db.runTransaction(async (transaction) => {
    const activeRef = db.collection("collectionSettings").doc("activeCollection");
    const [reservation, existing, slugMatches, active, selectedCategories] = await Promise.all([
      transaction.get(reservationRef),
      transaction.get(db.collection("collections").where("nameLower", "==", nameLower).limit(1)),
      transaction.get(db.collection("collections").where("slug", "==", slugBase).limit(1)),
      transaction.get(activeRef),
      Promise.all(categoryRefs.map((categoryRef) => transaction.get(categoryRef))),
    ]);
    if (reservation.exists || !existing.empty) {
      throw new Error("A collection with this name already exists");
    }
    if (selectedCategories.some((category) => !category.exists)) throw new Error("Selected category does not exist");
    if (selectedCategories.some((category) => !isCatalogRecordAvailable(category.data() ?? {}, now))) {
      throw new Error("Selected category is expired or deleted");
    }
    if (!slugMatches.empty) record.slug = `${slugBase}-${ref.id.slice(0, 6)}`;
    const activeData = active.data();
    const previousId = typeof activeData?.collectionId === "string" ? activeData.collectionId : "";
    const previousRef = previousId ? db.collection("collections").doc(previousId) : null;
    const previous = previousRef ? await transaction.get(previousRef) : null;
    transaction.create(reservationRef, { collectionId: ref.id, nameLower, createdAt: now });
    if (previousRef && previous?.exists) {
      transaction.set(previousRef, { isActive: false, updatedAt: now }, { merge: true });
    }
    transaction.create(ref, { ...record, nameLower, categoryCount: categoryIds.length, productCount: 0 });
    transaction.set(activeRef, { collectionId: ref.id, updatedAt: now }, { merge: true });
    return record;
  });
}

export async function getActiveCollection(db: Firestore): Promise<CollectionRecord | null> {
  const pointer = await db.collection("collectionSettings").doc("activeCollection").get();
  const id = pointer.data()?.collectionId;
  if (!pointer.exists || typeof id !== "string" || !id) return null;

  const snapshot = await db.collection("collections").doc(id).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  if (data.deletedAt || (typeof data.expiresAt === "number" && data.expiresAt <= Date.now())) return null;
  return {
    id: snapshot.id,
    categoryIds: storedCategoryIds(data.categoryIds),
    isActive: true,
    name: typeof data.name === "string" ? data.name : "",
    slug: typeof data.slug === "string" ? data.slug : slugify(typeof data.name === "string" ? data.name : ""),
    bannerUrl: collectionBannerUrl(data),
    expiresAt: typeof data.expiresAt === "number" ? data.expiresAt : null,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

export async function getCollectionBySlug(db: Firestore, slug: string): Promise<CollectionRecord | null> {
  const [matches, active] = await Promise.all([
    db.collection("collections").where("slug", "==", slug).limit(1).get(),
    db.collection("collectionSettings").doc("activeCollection").get(),
  ]);
  const doc = matches.docs[0];
  if (!doc) return null;
  const data = doc.data();
  return {
    id: doc.id,
    categoryIds: storedCategoryIds(data.categoryIds),
    isActive: active.data()?.collectionId === doc.id,
    name: typeof data.name === "string" ? data.name : "",
    slug: typeof data.slug === "string" ? data.slug : slugify(typeof data.name === "string" ? data.name : ""),
    bannerUrl: collectionBannerUrl(data),
    expiresAt: typeof data.expiresAt === "number" ? data.expiresAt : null,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

export async function updateCollection(
  db: Firestore,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const ref = db.collection("collections").doc(id);
  const update: Record<string, unknown> = { updatedAt: Date.now() };

  if (patch.name !== undefined) {
    if (typeof patch.name !== "string" || !patch.name.trim() || patch.name.trim().length > 100) {
      throw new Error("Collection name is required and must be 100 characters or fewer");
    }
    update.name = patch.name.trim();
    update.nameLower = patch.name.trim().toLowerCase();
  }
  if (Object.hasOwn(patch, "slogan")) {
    throw new Error("Collection slogans are no longer supported");
  }
  const selectedCategoryIds = Object.hasOwn(patch, "categoryIds")
    ? normalizeCategoryIds(patch.categoryIds)
    : undefined;
  if (patch.bannerUrl !== undefined) {
    if (typeof patch.bannerUrl !== "string" || !validCloudinaryVideo(patch.bannerUrl.trim())) {
      throw new Error("Banner URL must be a secure Cloudinary video URL");
    }
    update.bannerUrl = patch.bannerUrl.trim();
  }
  if (patch.expiresAt !== undefined) {
    if (patch.expiresAt === null || patch.expiresAt === "") update.expiresAt = null;
    else {
      const expiresAt = Number(patch.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= 0) throw new Error("Expiry must be a valid date");
      update.expiresAt = expiresAt;
    }
  }

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new Error("Collection not found");
    const current = snap.data() ?? {};
    const oldNameLower = typeof current.nameLower === "string"
      ? current.nameLower
      : String(current.name ?? "").trim().toLowerCase();
    const newNameLower = typeof update.nameLower === "string" ? update.nameLower : oldNameLower;
    let newReservationRef: FirebaseFirestore.DocumentReference | null = null;
    let oldReservationRef: FirebaseFirestore.DocumentReference | null = null;

    if (newNameLower && newNameLower !== oldNameLower) {
      const reservationId = createHash("sha256").update(newNameLower).digest("hex");
      newReservationRef = db.collection("collectionNames").doc(reservationId);
      const nameQuery = db.collection("collections").where("nameLower", "==", newNameLower).limit(1);
      const [reservation, matches] = await Promise.all([
        transaction.get(newReservationRef),
        transaction.get(nameQuery),
      ]);
      if (reservation.exists || matches.docs.some((doc) => doc.id !== id)) {
        throw new Error("A collection with this name already exists");
      }
      if (oldNameLower) {
        const oldReservationId = createHash("sha256").update(oldNameLower).digest("hex");
        oldReservationRef = db.collection("collectionNames").doc(oldReservationId);
      }
    }

    if (selectedCategoryIds) {
      if (!Array.isArray(current.categoryIds)) {
        throw new Error("Collection category assignments need migration before editing");
      }
      const previousCategoryIds = storedCategoryIds(current.categoryIds);
      const previousIds = new Set(previousCategoryIds);
      const selectedCategoryRefs = selectedCategoryIds.map((categoryId) => db.collection("categories").doc(categoryId));
      const productsQuery = db.collection("products").where("collectionId", "==", id);
      const [selectedCategories, assignedProducts] = await Promise.all([
        Promise.all(selectedCategoryRefs.map((categoryRef) => transaction.get(categoryRef))),
        transaction.get(productsQuery),
      ]);
      if (selectedCategories.some((category) => !category.exists)) throw new Error("Selected category does not exist");
      for (const category of selectedCategories) {
        if (!previousIds.has(category.id) && !isCatalogRecordAvailable(category.data() ?? {})) {
          throw new Error("Selected category is expired or deleted");
        }
      }
      const selectedIds = new Set(selectedCategoryIds);
      const removedIds = new Set(previousCategoryIds.filter((categoryId) => !selectedIds.has(categoryId)));
      const hasAssignedProducts = assignedProducts.docs.some((product) => removedIds.has(String(product.data().categoryId ?? "")));
      if (hasAssignedProducts) {
        throw new Error("Move products to another category before removing them from this collection");
      }
      update.categoryIds = selectedCategoryIds;
      update.categoryCount = selectedCategoryIds.length;
    }

    if (newReservationRef) {
      transaction.set(newReservationRef, { collectionId: id, nameLower: newNameLower, updatedAt: Date.now() });
    }
    if (oldReservationRef) transaction.delete(oldReservationRef);
    transaction.set(ref, {
      ...update,
      slogan: FieldValue.delete(),
      bannerVideoUrl: FieldValue.delete(),
      maxCategories: FieldValue.delete(),
      maxItems: FieldValue.delete(),
      sortOrder: FieldValue.delete(),
    }, { merge: true });
  });
}

export async function setCollectionActive(db: Firestore, id: string, isActive: boolean): Promise<void> {
  const activeRef = db.collection("collectionSettings").doc("activeCollection");
  const collectionRef = db.collection("collections").doc(id);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const [active, selected] = await Promise.all([
      transaction.get(activeRef),
      transaction.get(collectionRef),
    ]);
    if (!selected.exists) throw new Error("Collection not found");
    const previousId = typeof active.data()?.collectionId === "string" ? active.data()?.collectionId as string : "";
    const previousRef = previousId && previousId !== id ? db.collection("collections").doc(previousId) : null;
    const previous = previousRef ? await transaction.get(previousRef) : null;

    if (isActive && typeof selected.data()?.expiresAt === "number" && selected.data()!.expiresAt <= now) {
      throw new Error("Edit the expiry date before activating this expired collection");
    }
    if (isActive) {
      if (previousRef && previous?.exists) transaction.set(previousRef, { isActive: false, updatedAt: now }, { merge: true });
      transaction.set(collectionRef, { isActive: true, updatedAt: now }, { merge: true });
      transaction.set(activeRef, { collectionId: id, updatedAt: now }, { merge: true });
      return;
    }

    transaction.set(collectionRef, { isActive: false, updatedAt: now }, { merge: true });
    if (previousId === id) transaction.set(activeRef, { collectionId: null, updatedAt: now }, { merge: true });
  });
}

export async function deleteCollection(db: Firestore, id: string): Promise<void> {
  const ref = db.collection("collections").doc(id);
  const activeRef = db.collection("collectionSettings").doc("activeCollection");
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new Error("Collection not found");
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    const [products, active] = await Promise.all([
      transaction.get(db.collection("products").where("collectionId", "==", id).limit(1)),
      transaction.get(activeRef),
    ]);
    if (storedCategoryIds(data.categoryIds).length || !products.empty) {
      throw new Error("Reassign or remove this collection’s categories and products before deleting it");
    }
    const nameLower = typeof data.nameLower === "string" ? data.nameLower : String(data.name ?? "").toLowerCase();
    const reservationId = createHash("sha256").update(nameLower).digest("hex");
    transaction.delete(ref);
    transaction.delete(db.collection("collectionNames").doc(reservationId));
    if (active.data()?.collectionId === id) {
      transaction.set(activeRef, { collectionId: null, updatedAt: Date.now() }, { merge: true });
    }
  });
}

export async function listCollections(db: Firestore): Promise<AdminCollection[]> {
  const [collectionSnapshot, productSnapshot, activeSnapshot] = await Promise.all([
    db.collection("collections").get(),
    db.collection("products").get(),
    db.collection("collectionSettings").doc("activeCollection").get(),
  ]);
  const activeId = activeSnapshot.data()?.collectionId;
  const products = productSnapshot.docs.map((doc) => doc.data());

  return collectionSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      const categoryIds = storedCategoryIds(data.categoryIds);
      const record: CollectionRecord = {
        id: doc.id,
        categoryIds,
        isActive: activeId === doc.id,
        name: typeof data.name === "string" ? data.name : "",
        slug: typeof data.slug === "string" ? data.slug : slugify(typeof data.name === "string" ? data.name : ""),
        bannerUrl: collectionBannerUrl(data),
        expiresAt: Number.isFinite(Number(data.expiresAt)) && data.expiresAt != null ? Number(data.expiresAt) : null,
        createdAt: Number(data.createdAt ?? 0),
        updatedAt: Number(data.updatedAt ?? 0),
      };
      return {
        ...record,
        expired: Boolean(data.deletedAt) || (typeof data.expiresAt === "number" && data.expiresAt <= Date.now()),
        categoryCount: categoryIds.length,
        productCount: products.filter((product) => product.collectionId === doc.id).length,
      };
    });
}
