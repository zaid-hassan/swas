import { docToProduct } from "./product-rows";
import type { NormalizedProductDoc } from "./product-rows";
import { Product, AdminProduct } from "@/types/products";

// In-memory cache: 88 docs × per-request reads would get expensive.
// All storefront read paths funnel through getProducts(), so one 5-minute
// cache here caps Firestore reads regardless of visitor traffic.
let cache: { at: number; products: Product[] } | null = null;
// Admin needs hidden products too; separate short-lived cache.
let adminCache: { at: number; products: AdminProduct[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toNormalized(docId: string, data: any): NormalizedProductDoc {
  return {
    sNo: Number(data.sNo),
    docId,
    category: data.category ?? "",
    name: data.name ?? "",
    description: data.description ?? "",
    material: data.material ?? "",
    design: data.design ?? "",
    finish: data.finish ?? "",
    idealFor: data.idealFor ?? "",
    mrp: Number(data.mrp ?? 0),
    image: data.image ?? "",
    image1: data.image1 ?? "",
    image2: data.image2 ?? "",
    image3: data.image3 ?? "",
    dateOfAdd: data.dateOfAdd ?? "",
    slug: data.slug ?? "",
    isVisible: data.isVisible ?? true,
    hash: data.hash ?? "",
    updatedAt: data.updatedAt ?? 0,
  };
}

async function readAllNormalized(): Promise<NormalizedProductDoc[]> {
  // Server-only: dynamic import so client bundles never pull firebase-admin.
  const { adminDb } = await import("./firebase-admin");
  const snap = await adminDb.collection("products").get();
  const out: NormalizedProductDoc[] = [];
  snap.forEach((d) => out.push(toNormalized(d.id, d.data())));
  // Keep storefront/admin order stable (S No ascending)
  out.sort((a, b) => a.sNo - b.sNo);
  return out;
}

export async function getProducts(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.products;

  const all = await readAllNormalized();
  const products = all
    .filter((p) => p.isVisible !== false)
    .map(docToProduct);

  cache = { at: Date.now(), products };
  return products;
}

export async function getAllProducts(): Promise<AdminProduct[]> {
  if (adminCache && Date.now() - adminCache.at < CACHE_TTL_MS) {
    return adminCache.products;
  }

  const all = await readAllNormalized();
  const products: AdminProduct[] = all.map((p) => ({
    ...docToProduct(p),
    isVisible: p.isVisible !== false,
  }));

  adminCache = { at: Date.now(), products };
  return products;
}

export function clearProductsCache() {
  cache = null;
  adminCache = null;
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
