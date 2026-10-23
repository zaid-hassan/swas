import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateBulkPrice } from "@/lib/bulk-price";
import { productHash } from "@/lib/product-rows";

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category) {
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
    const snapshot = await adminDb.collection("products").get();
    const matching = snapshot.docs.filter((doc) => {
      const value = doc.data().category;
      return typeof value === "string" && value.trim().toLowerCase() === category.toLowerCase();
    });

    if (!matching.length) {
      return NextResponse.json(
        { success: false, error: `No products found in category “${category}”` },
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
    return NextResponse.json({ success: true, category, price, updated: matching.length });
  } catch (error) {
    console.error("bulk product price update failed:", error);
    return NextResponse.json({ success: false, error: "Bulk price update failed" }, { status: 500 });
  }
}
