import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateBulkPrice, productBelongsToBulkPriceCategory } from "@/lib/bulk-price";
import { isCatalogRecordAvailable } from "@/lib/categories";
import { productHash } from "@/lib/product-rows";

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Select a category" }, { status: 400 });
    }

    let price: number;
    try {
      price = calculateBulkPrice(Number(body.basePrice), Number(body.percentage), body.direction);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Invalid price update" },
        { status: 400 }
      );
    }

    const [{ adminDb }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/products"),
    ]);
    const now = Date.now();
    const categorySnapshot = await adminDb.collection("categories").doc(categoryId).get();
    if (!categorySnapshot.exists) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }
    const categoryData = categorySnapshot.data() ?? {};
    if (!isCatalogRecordAvailable(categoryData, now)) {
      return NextResponse.json({ success: false, error: "Category is expired or deleted" }, { status: 400 });
    }
    const categoryName = typeof categoryData.name === "string" && categoryData.name.trim()
      ? categoryData.name.trim()
      : categoryId;

    // Canonical membership: products carry `categoryId`, so one equality query
    // selects the category's products in every collection that lists it.
    const snapshot = await adminDb.collection("products").where("categoryId", "==", categoryId).get();
    const matching = snapshot.docs.filter((doc) => productBelongsToBulkPriceCategory(doc.data(), categoryId));
    if (!matching.length) {
      return NextResponse.json(
        { success: false, error: `No products found in category “${categoryName}”` },
        { status: 404 }
      );
    }

    for (let offset = 0; offset < matching.length; offset += 450) {
      const batch = adminDb.batch();
      for (const doc of matching.slice(offset, offset + 450)) {
        const current = doc.data();
        const next: Record<string, unknown> = { ...current, mrp: price, updatedAt: Date.now() };
        next.hash = productHash(next as unknown as Parameters<typeof productHash>[0]);
        batch.set(doc.ref, next, { merge: true });
      }
      await batch.commit();
    }

    clearProductsCache();
    return NextResponse.json({ success: true, category: categoryName, price, updated: matching.length });
  } catch (error) {
    console.error("bulk product price update failed:", error);
    return NextResponse.json({ success: false, error: "Bulk price update failed" }, { status: 500 });
  }
}
