import { fetchSheetProducts } from "./fetchsheet";

export async function getProducts() {
  const data = await fetchSheetProducts();

  return data.map((row: any) => ({
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
}

export async function getCategories() {
  const products = await getProducts();

  const map = new Map<
    string,
    { title: string; slug: string; image: string }
  >();

  for (const product of products) {
    const title = product.category.trim();

    if (!map.has(title)) {
      map.set(title, {
        title,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        image: product.image, // first product image of category
      });
    }
  }

  return Array.from(map.values());
}