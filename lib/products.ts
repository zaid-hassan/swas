import { fetchSheetProducts } from "./fetchsheet";
import { docToProduct, normalizeProductRow } from "./product-rows";
import { Product } from "@/types/products";

// Flip to true once Firestore `products` collection is populated via
// /api/admin/products/sync. Sheets CSV stays as automatic fallback.
const USE_FIRESTORE_PRODUCTS =
  process.env.USE_FIRESTORE_PRODUCTS === "true" ||
  process.env.NEXT_PUBLIC_USE_FIRESTORE_PRODUCTS === "true";

// In-memory cache: 88 docs × per-request reads would get expensive.
// All 7 read paths (shop, category, search, catalogue, [slug],
// validate-cart, /api/products) funnel through getProducts(), so one
// 5-minute cache here caps Firestore reads at ~12 × 88/day worst case.
let cache: { at: number; products: Product[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function fromSheetRow(row: any): Product {
  const { doc } = normalizeProductRow(row);
  if (!doc) {
    // Preserve old lenient behavior for rows that fail strict validation
    const images = [row["Image"], row["Image1"], row["Image2"], row["Image3"]].filter(
      (img): img is string => typeof img === "string" && img.trim() !== ""
    );
    return {
      id: String(row["S No"] ?? ""),
      category: row["Category"] ?? "",
      name: row["Product Name"] ?? "",
      description: row["Description"] ?? "",
      material: row["Material"] ?? "",
      design: row["Design"] ?? "",
      finish: row["Finish"] ?? "",
      idealFor: row["IdealFor"] ?? "",
      price: Number(row["MRP"] ?? row["MRP1"] ?? 0) || 0,
      image: row["Image"] ?? "",
      images: Array.from(new Set(images)),
      slug: String(row["Product Name"] ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    };
  }
  return docToProduct(doc);
}

async function getSheetProducts(): Promise<Product[]> {
  const data = await fetchSheetProducts();
  return (data as any[]).map(fromSheetRow);
}

async function getFirestoreProducts(): Promise<Product[]> {
  // Server-only: dynamic import so client bundles never pull firebase-admin.
  const { adminDb } = await import("./firebase-admin");
  const snap = await adminDb.collection("products").get();
  const products: Product[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    // Only serve visible products to the storefront; dashboard reads
    // the collection directly so drafts stay editable.
    if (data.isVisible === false) return;
    products.push(
      docToProduct({
        sNo: Number(data.sNo),
        docId: d.id,
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
      })
    );
  });
  // Keep storefront order stable (S No ascending)
  products.sort((a, b) => Number(a.id) - Number(b.id));
  return products;
}

export async function getProducts(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.products;

  // Default: Sheets (unchanged behavior until you flip the flag)
  if (!USE_FIRESTORE_PRODUCTS) {
    const products = await getSheetProducts();
    cache = { at: Date.now(), products };
    return products;
  }

  try {
    const products = await getFirestoreProducts();
    // Empty collection (not yet synced) → fall back to Sheets rather
    // than showing an empty shop.
    if (!products.length) throw new Error("Firestore products empty");
    cache = { at: Date.now(), products };
    return products;
  } catch (err) {
    console.error("Firestore products failed, falling back to Sheets:", err);
    const products = await getSheetProducts();
    cache = { at: Date.now(), products };
    return products;
  }
}

export function clearProductsCache() {
  cache = null;
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
