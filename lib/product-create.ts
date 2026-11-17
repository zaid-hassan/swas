import { normalizeProductRow, productDocId } from "./product-rows";
import type { NormalizedProductDoc } from "./product-rows";
import { isImageUrl, isVideoUrl } from "./media-upload";
import type { Firestore } from "firebase-admin/firestore";
import { isCatalogRecordAvailable } from "./categories";
import { collectionHasCategory } from "./catalog-schema";

export type ManualProductInput = {
  name: string;
  categoryId: string;
  collectionId: string;
  description?: string;
  material?: string;
  design?: string;
  finish?: string;
  idealFor?: string;
  mrp: number;
  images: string[];
  videos: string[];
};

const MAX_ALLOCATION_ATTEMPTS = 10;

function cleanUrl(u: unknown): string {
  return typeof u === "string" ? u.trim() : "";
}

export function validateManualInput(
  input: ManualProductInput
): { ok: true } | { ok: false; error: string } {
  if (!input || typeof input.name !== "string" || !input.name.trim()) {
    return { ok: false, error: "Product name required" };
  }
  if (typeof input.categoryId !== "string" || !input.categoryId.trim()) {
    return { ok: false, error: "Select a category" };
  }
  if (typeof input.collectionId !== "string" || !input.collectionId.trim()) {
    return { ok: false, error: "Select a collection" };
  }
  const mrp = Number(input.mrp);
  if (!Number.isFinite(mrp) || mrp <= 0) {
    return { ok: false, error: "MRP must be greater than 0" };
  }
  const images = (input.images ?? []).map(cleanUrl).filter(Boolean);
  const videos = (input.videos ?? []).map(cleanUrl).filter(Boolean);
  if (images.length + videos.length === 0) {
    return { ok: false, error: "At least one image or video required" };
  }
  for (const u of images) {
    if (!isImageUrl(u)) return { ok: false, error: `Invalid image URL: ${u}` };
  }
  for (const u of videos) {
    if (!isVideoUrl(u)) return { ok: false, error: `Invalid video URL: ${u}` };
  }
  return { ok: true };
}

/**
 * Creates one product with an auto-allocated S No (max+1) inside a
 * `counters/products` transaction. The doc is built through the same
 * normalize/hash path as Excel rows and stamped `source:'manual'` so bulk
 * sync never hides it.
 */
export async function createManualProduct(
  db: Firestore,
  input: ManualProductInput
): Promise<NormalizedProductDoc> {
  const check = validateManualInput(input);
  if (!check.ok) throw new Error(check.error);

  const images = input.images.map(cleanUrl).filter(Boolean).slice(0, 3);
  const videos = input.videos.map(cleanUrl).filter(Boolean).slice(0, 3);

  return db.runTransaction(async (tx) => {
    const counterRef = db.collection("counters").doc("products");
    const counterSnap = await tx.get(counterRef);
    const categoryRef = db.collection("categories").doc(input.categoryId.trim());
    const categorySnap = await tx.get(categoryRef);
    if (!categorySnap.exists) throw new Error("Selected category does not exist");
    const category = (categorySnap.data() ?? {}) as Record<string, unknown>;
    const collectionRef = db.collection("collections").doc(input.collectionId.trim());
    const collectionSnap = await tx.get(collectionRef);
    if (!collectionSnap.exists) throw new Error("Category collection does not exist");
    const collection = (collectionSnap.data() ?? {}) as Record<string, unknown>;
    if (!collectionHasCategory({ id: collectionRef.id, categoryIds: collection.categoryIds }, categoryRef.id)) {
      throw new Error("Selected collection does not include this category");
    }
    const now = Date.now();
    if (!isCatalogRecordAvailable(category, now)) {
      throw new Error("Selected category is expired or deleted");
    }
    if (!isCatalogRecordAvailable(collection, now)) {
      throw new Error("Selected collection is expired or deleted");
    }

    const assignedProducts = await tx.get(
      db.collection("products").where("collectionId", "==", collectionRef.id)
    );
    const currentProductCount = assignedProducts.size;

    let sNo: number;
    if (counterSnap.exists) {
      sNo = Number(counterSnap.data()?.lastSNo || 0) + 1;
    } else {
      const topSnap = await tx.get(
        db.collection("products").orderBy("sNo", "desc").limit(1)
      );
      const maxSNo = topSnap.empty ? 0 : Number(topSnap.docs[0].data().sNo || 0);
      sNo = maxSNo + 1;
    }

    for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS; attempt++) {
      const existing = await tx.get(
        db.collection("products").doc(productDocId(sNo))
      );
      if (!existing.exists) break;
      sNo++;
      if (attempt === MAX_ALLOCATION_ATTEMPTS - 1) {
        throw new Error("SNo allocation failed after 10 attempts");
      }
    }

    const row = {
      "S No": sNo,
      "Product Name": input.name.trim(),
      Category: typeof category.name === "string" ? category.name : "",
      Description: input.description ?? "",
      Material: input.material ?? "",
      Design: input.design ?? "",
      Finish: input.finish ?? "",
      IdealFor: input.idealFor ?? "",
      MRP: Number(input.mrp),
      Image: images[0] ?? "",
      Image1: images[1] ?? "",
      Image2: images[2] ?? "",
      Video: videos[0] ?? "",
      Video1: videos[1] ?? "",
      Video2: videos[2] ?? "",
      "DATE OF ADD": new Date().toISOString().slice(0, 10),
    };

    const { doc, error } = normalizeProductRow(row);
    if (!doc) throw new Error(error || "Invalid product");
    doc.source = "manual";
    doc.categoryId = categoryRef.id;
    doc.collectionId = collectionRef.id;
    doc.stockStatus = "in_stock";

    tx.set(db.collection("products").doc(doc.docId), { ...doc });
    tx.set(counterRef, { lastSNo: sNo }, { merge: true });
    tx.set(collectionRef, { productCount: currentProductCount + 1, updatedAt: now }, { merge: true });
    return doc;
  });
}
