import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProducts } from "@/lib/products";

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
