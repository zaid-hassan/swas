import { getProducts } from "@/lib/products";
import { NextResponse } from "next/server";

export async function GET() {
  // Now goes through the cached Firestore-first getProducts().
  // Same response shape as before so shop/search/category keep working.
  const products = await getProducts();

  return NextResponse.json(products);
}
