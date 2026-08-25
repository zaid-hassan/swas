import { fetchSheetProducts } from "./fetchsheet";
import { Product } from "@/types/products";

export async function getProducts(): Promise<Product[]> {
  const data = await fetchSheetProducts();

  return data.map((row: any) => ({
    id: String(row["S No"]),
    category: row["Category"],
    name: row["Product Name"],
    description: row["Description"],
    material: row["Material"],
    design: row["Design"],
    finish: row["Finish"],
    idealFor: row["IdealFor"],
    price: Number(row["MRP"] || 0),

    // Cover image
    image: row["Image"],

    // Product gallery
    images: [row["Image"], row["Image1"], row["Image2"], row["Image3"]].filter(
      (img): img is string => typeof img === "string" && img.trim() !== ""
    ),

    slug: row["Product Name"]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  }));
}

export async function getCategories() {
  const products = await getProducts();

  const map = new Map<string, { title: string; slug: string; image: string }>();

  for (const product of products) {
    const title = product?.category?.trim();

    if (title && !map.has(title)) {
      map.set(title, {
        title,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        image: product?.image || "",
      });
    }
  }

  return Array.from(map.values()).slice(1);
}
