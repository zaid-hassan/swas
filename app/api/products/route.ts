import { fetchSheetProducts } from "@/lib/fetchsheet";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await fetchSheetProducts();

  const products = data.map((row: any) => ({
    id: row["S No"],
    category: row["Category"],
    name: row["Product Name"],
    description: row["Description"],
    material: row["Material"],
    design: row["Design"],
    finish: row["Finish"],
    idealFor: row["IdealFor"],
    price: Number(row["MRP"] || 0),
    image: row["Image"],
    slug: row["Product Name"]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  }));

  return NextResponse.json(products);
}
