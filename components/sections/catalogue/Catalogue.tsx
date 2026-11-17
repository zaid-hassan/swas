// components/sections/catalogue/Catalogue.tsx

import { getCategories, getProducts } from "@/lib/products";
import CatalogueClient from "./CatalogueClient";

export default async function Catalogue() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <CatalogueClient
      products={products}
      categories={categories.map((category) => ({ id: category.id, title: category.title, slug: category.slug }))}
    />
  );
}