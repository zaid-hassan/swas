import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { isImageUrl } from "./media-upload";

export type CollectionRecord = {
  id: string;
  name: string;
  bannerUrl: string;
  createdAt: number;
  updatedAt: number;
};

export type AdminCollection = CollectionRecord & { productCount: number };

export type CollectionInput = { name: unknown; bannerUrl: unknown };

export function validateCollectionInput(
  input: CollectionInput
): { ok: true; name: string; bannerUrl: string } | { ok: false; error: string } {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const bannerUrl = typeof input?.bannerUrl === "string" ? input.bannerUrl.trim() : "";
  if (!name) return { ok: false, error: "Collection name is required" };
  if (name.length > 100) return { ok: false, error: "Collection name must be 100 characters or fewer" };
  if (!isImageUrl(bannerUrl)) return { ok: false, error: "Upload a valid image banner (jpg, png, or webp)" };
  try {
    const parsed = new URL(bannerUrl);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com" || parsed.username || parsed.password) {
      return { ok: false, error: "Banner URL must be a secure Cloudinary image URL" };
    }
  } catch {
    return { ok: false, error: "Upload a valid image banner (jpg, png, or webp)" };
  }
  return { ok: true, name, bannerUrl };
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

  const nameLower = validation.name.toLowerCase();
  const reservationId = createHash("sha256").update(nameLower).digest("hex");
  const reservationRef = db.collection("collectionNames").doc(reservationId);
  const ref = db.collection("collections").doc();
  const now = Date.now();
  const record: CollectionRecord = {
    id: ref.id,
    name: validation.name,
    bannerUrl: validation.bannerUrl,
    createdAt: now,
    updatedAt: now,
  };
  return db.runTransaction(async (transaction) => {
    const reservation = await transaction.get(reservationRef);
    const existing = await transaction.get(
      db.collection("collections").where("nameLower", "==", nameLower).limit(1)
    );
    if (reservation.exists || !existing.empty) {
      throw new Error("A collection with this name already exists");
    }
    transaction.create(reservationRef, { collectionId: ref.id, nameLower, createdAt: now });
    transaction.create(ref, { ...record, nameLower });
    return record;
  });
}

export async function listCollections(db: Firestore): Promise<AdminCollection[]> {
  const [collectionSnapshot, productSnapshot] = await Promise.all([
    db.collection("collections").get(),
    db.collection("products").get(),
  ]);
  const products = productSnapshot.docs.map((doc) => doc.data());

  return collectionSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      const record: CollectionRecord = {
        id: doc.id,
        name: typeof data.name === "string" ? data.name : "",
        bannerUrl: typeof data.bannerUrl === "string" ? data.bannerUrl : "",
        createdAt: Number(data.createdAt ?? 0),
        updatedAt: Number(data.updatedAt ?? 0),
      };
      return {
        ...record,
        productCount: countProductsByCollectionId(doc.id, products),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
