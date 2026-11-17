import { NextResponse } from "next/server";
import { productHash, slugify } from "@/lib/product-rows";
import { requireAdmin } from "@/lib/admin-auth";
import { isCatalogRecordAvailable } from "@/lib/categories";
import { collectionHasCategory } from "@/lib/catalog-schema";

// PATCH /api/admin/products/:id  (id = docId, e.g. p-42)
// Body: partial fields { name?, category?, description?, material?,
// design?, finish?, idealFor?, mrp?, image?, image1?, image2?, image3?,
// dateOfAdd?, isVisible? } — only changed fields are written.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const patch = await req.json();
    // Lazy-load firebase-admin so `next build` doesn't evaluate service
    // account credentials at build time (runtime has real env).
    const [{ adminDb }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/products"),
    ]);
    const ref = adminDb.collection("products").doc(id);
    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new Error("Not found");
      const cur = snap.data() ?? {};
      const next = { ...cur };
      let oldCollectionRef: FirebaseFirestore.DocumentReference | null = null;
      let newCollectionRef: FirebaseFirestore.DocumentReference | null = null;
      let oldCount = 0;
      let newCount = 0;

      if (patch.categoryId !== undefined || patch.collectionId !== undefined) {
        if (patch.categoryId !== undefined && (typeof patch.categoryId !== "string" || !patch.categoryId.trim())) {
          throw new Error("Select a category");
        }
        const categoryId = patch.categoryId !== undefined ? patch.categoryId.trim() : String(cur.categoryId ?? "");
        if (!categoryId) throw new Error("Select a category");
        const categoryRef = adminDb.collection("categories").doc(categoryId);
        const categorySnap = await transaction.get(categoryRef);
        if (!categorySnap.exists) throw new Error("Selected category does not exist");
        const category = categorySnap.data() ?? {};
        if (patch.collectionId !== undefined && (typeof patch.collectionId !== "string" || !patch.collectionId.trim())) {
          throw new Error("Select a collection");
        }
        const targetCollectionId = typeof patch.collectionId === "string"
          ? patch.collectionId.trim()
          : (typeof cur.collectionId === "string" ? cur.collectionId : "");
        if (!targetCollectionId) throw new Error("Select a collection");
        newCollectionRef = adminDb.collection("collections").doc(targetCollectionId);
        const newCollectionSnap = await transaction.get(newCollectionRef);
        if (!newCollectionSnap.exists) throw new Error("Category collection does not exist");
        const newCollection = newCollectionSnap.data() ?? {};
        if (!collectionHasCategory({ id: newCollectionRef.id, categoryIds: newCollection.categoryIds }, categoryRef.id)) {
          throw new Error("Selected collection does not include this category");
        }
        const now = Date.now();
        const changingAssignment = categoryId !== cur.categoryId || targetCollectionId !== cur.collectionId;
        if (changingAssignment && (!isCatalogRecordAvailable(category, now) || !isCatalogRecordAvailable(newCollection, now))) {
          throw new Error("Selected category or collection is expired");
        }
        next.categoryId = categoryRef.id;
        next.category = String(category.name ?? "");
        next.collectionId = newCollectionRef.id;

        const oldCollectionId = typeof cur.collectionId === "string" ? cur.collectionId : "";
        if (oldCollectionId !== newCollectionRef.id) {
          if (oldCollectionId) {
            oldCollectionRef = adminDb.collection("collections").doc(oldCollectionId);
            const [oldCollectionSnap, oldProducts] = await Promise.all([
              transaction.get(oldCollectionRef),
              transaction.get(adminDb.collection("products").where("collectionId", "==", oldCollectionId)),
            ]);
            oldCount = oldProducts.size;
            if (!oldCollectionSnap.exists) oldCollectionRef = null;
          }
          const targetProducts = await transaction.get(
            adminDb.collection("products").where("collectionId", "==", newCollectionRef.id)
          );
          newCount = targetProducts.size;
        }
      }

      const allowed = [
        "name", "description", "material", "design", "finish", "idealFor", "dateOfAdd",
        "image", "image1", "image2", "image3", "video", "video1", "video2", "isVisible",
      ] as const;
      for (const key of allowed) {
        if (patch[key] !== undefined) next[key] = typeof patch[key] === "string" ? patch[key].trim() : patch[key];
      }
      if (patch.mrp !== undefined) {
        const mrp = Number(patch.mrp);
        if (!Number.isFinite(mrp) || mrp < 0) throw new Error("Invalid mrp");
        next.mrp = mrp;
      }
      if (patch.stockStatus !== undefined) {
        if (patch.stockStatus !== "in_stock" && patch.stockStatus !== "out_of_stock") throw new Error("Invalid stock status");
        next.stockStatus = patch.stockStatus;
      }
      if (!next.name) throw new Error("Name required");
      if (patch.name && patch.name !== cur.name) next.slug = `${slugify(next.name)}-${next.sNo}`;
      next.stockStatus = next.stockStatus === "out_of_stock" ? "out_of_stock" : "in_stock";
      next.hash = productHash(next as Parameters<typeof productHash>[0]);
      next.updatedAt = Date.now();

      if (next.hash === cur.hash && next.collectionId === cur.collectionId &&
          next.categoryId === cur.categoryId && next.stockStatus === cur.stockStatus) {
        return { skipped: true };
      }
      transaction.set(ref, next, { merge: true });
      if (oldCollectionRef && oldCollectionRef.path !== newCollectionRef?.path) {
        transaction.set(oldCollectionRef, { productCount: Math.max(0, oldCount - 1), updatedAt: Date.now() }, { merge: true });
      }
      if (newCollectionRef && oldCollectionRef?.path !== newCollectionRef.path && newCollectionRef.id !== cur.collectionId) {
        transaction.set(newCollectionRef, { productCount: newCount + 1, updatedAt: Date.now() }, { merge: true });
      }
      return { skipped: false };
    });
    if (result.skipped) return NextResponse.json({ success: true, skipped: true });
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("products/patch failed:", err);
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Not found" ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
