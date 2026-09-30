import { normalizeProductRow, productDocId } from "./product-rows";
import type { NormalizedProductDoc } from "./product-rows";
import type { Firestore } from "firebase-admin/firestore";

export type ManualProductInput = {
  name: string;
  category?: string;
  description?: string;
  material?: string;
  design?: string;
  finish?: string;
  idealFor?: string;
  mrp: number;
  images: string[];
  videos: string[];
};

const IMAGE_EXT = /\.(jpg|jpeg|png|webp)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm)(\?|#|$)/i;
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
    if (!IMAGE_EXT.test(u)) return { ok: false, error: `Invalid image URL: ${u}` };
  }
  for (const u of videos) {
    if (!VIDEO_EXT.test(u)) return { ok: false, error: `Invalid video URL: ${u}` };
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

    let sNo: number;
    if (counterSnap.exists) {
      sNo = Number((counterSnap.data() as any).lastSNo || 0) + 1;
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
      Category: input.category ?? "",
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

    tx.set(db.collection("products").doc(doc.docId), { ...doc });
    tx.set(counterRef, { lastSNo: sNo }, { merge: true });
    return doc;
  });
}
