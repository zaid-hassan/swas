// components/sections/catalogue/Catalogue.tsx

import { getProducts } from "@/lib/products";
import CatalogueClient from "./CatalogueClient";

export default async function Catalogue() {
  const products = await getProducts();
  console.log(products.map((p) => p.category));
  return <CatalogueClient products={products} />;
}