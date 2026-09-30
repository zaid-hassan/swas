import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProducts } from "@/lib/products";
import { docToProduct } from "@/lib/product-rows";
import type { ManualProductInput } from "@/lib/product-create";

// GET /api/admin/products — Firestore-backed list including hidden products.
export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const products = await getAllProducts();
    return NextResponse.json({ success: true, products });
  } catch (err) {
    console.error("admin/products failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products — create one product with auto-allocated S No.
// Body: ManualProductInput (images/videos are Cloudinary URLs).
export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const input: ManualProductInput = {
      name: body.name,
      category: body.category,
      description: body.description,
      material: body.material,
      design: body.design,
      finish: body.finish,
      idealFor: body.idealFor,
      mrp: body.mrp,
      images: body.images ?? [],
      videos: body.videos ?? [],
    };

    const { validateManualInput, createManualProduct } = await import(
      "@/lib/product-create"
    );
    const check = validateManualInput(input);
    if (!check.ok) {
      return NextResponse.json({ success: false, error: check.error }, { status: 400 });
    }

    // Lazy-load firebase-admin so `next build` doesn't evaluate service
    // account credentials at build time (runtime has real env).
    const [{ adminDb }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/products"),
    ]);

    const doc = await createManualProduct(adminDb, input);
    clearProductsCache();
    return NextResponse.json({ success: true, product: docToProduct(doc) });
  } catch (err: any) {
    console.error("admin/product create failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Create failed" },
      { status: 500 }
    );
  }
}
