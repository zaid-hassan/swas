import type { Product } from "@/types/products";

export type RawProductRow = Record<string, any>;

export type NormalizedProductDoc = {
  sNo: number;
  docId: string;
  category: string;
  name: string;
  description: string;
  material: string;
  design: string;
  finish: string;
  idealFor: string;
  mrp: number;
  image: string;
  image1: string;
  image2: string;
  image3: string;
  dateOfAdd: string;
  slug: string;
  isVisible: boolean;
  hash: string;
  updatedAt: number;
};

export function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pick(row: RawProductRow, ...keys: string[]) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return row[k];
    }
  }
  // fall back to case-insensitive match
  const lower: Record<string, any> = {};
  for (const k of Object.keys(row)) lower[k.toLowerCase()] = row[k];
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

export function productDocId(sNo: number | string) {
  return `p-${String(sNo).trim()}`;
}

export function productHash(d: Omit<NormalizedProductDoc, "hash" | "updatedAt">) {
  const s = [
    d.sNo,
    d.category,
    d.name,
    d.description,
    d.material,
    d.design,
    d.finish,
    d.idealFor,
    d.mrp,
    d.image,
    d.image1,
    d.image2,
    d.image3,
    d.dateOfAdd,
    d.slug,
    d.isVisible,
  ].join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function normalizeProductRow(row: RawProductRow): {
  doc: NormalizedProductDoc | null;
  error?: string;
} {
  const sNoRaw = pick(row, "S No", "SNo", "sNo", "sno", "id", "Serial");
  const sNo = Number(String(sNoRaw).trim());
  if (!sNoRaw || !Number.isFinite(sNo) || sNo <= 0) {
    return { doc: null, error: `Invalid S No: ${JSON.stringify(sNoRaw)}` };
  }

  const name = String(pick(row, "Product Name", "name") || "").trim();
  if (!name) return { doc: null, error: `S No ${sNo}: missing Product Name` };

  const category = String(pick(row, "Category", "category") || "").trim();
  const description = String(pick(row, "Description", "description") || "");
  const material = String(pick(row, "Material", "material") || "");
  const design = String(pick(row, "Design", "design") || "");
  const finish = String(pick(row, "Finish", "finish") || "");
  const idealFor = String(pick(row, "IdealFor", "Ideal For", "idealFor") || "");
  const mrpRaw = pick(row, "MRP", "MRP1", "mrp", "Price", "price");
  const mrp = Number(String(mrpRaw ?? "").trim() === "" ? NaN : mrpRaw);
  const image = String(pick(row, "Image", "image") || "").trim();
  const image1 = String(pick(row, "Image1", "image1") || "").trim();
  const image2 = String(pick(row, "Image2", "image2") || "").trim();
  const image3 = String(pick(row, "Image3", "image3") || "").trim();
  const dateOfAdd = String(pick(row, "DATE OF ADD", "Date of Add", "dateOfAdd") || "").trim();

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${sNo}`;

  // Visible only when it has a name, a price > 0 and at least one image.
  // Dashboard can override isVisible manually afterwards.
  const isVisible = mrp > 0 && (image || image1 || image2 || image3 ? true : false);

  const partial = {
    sNo,
    docId: productDocId(sNo),
    category,
    name,
    description,
    material,
    design,
    finish,
    idealFor,
    mrp: Number.isFinite(mrp) ? mrp : 0,
    image,
    image1,
    image2,
    image3,
    dateOfAdd,
    slug,
    isVisible,
  };

  return {
    doc: { ...partial, hash: productHash(partial), updatedAt: Date.now() },
  };
}

export function docToProduct(doc: NormalizedProductDoc): Product {
  const images = [doc.image, doc.image1, doc.image2, doc.image3].filter(
    (img): img is string => typeof img === "string" && img.trim() !== ""
  );
  // Dedupe identical Cloudinary URLs (your sheet repeats Image 4x)
  const deduped = Array.from(new Set(images));
  return {
    id: String(doc.sNo),
    category: doc.category,
    name: doc.name,
    description: doc.description,
    material: doc.material,
    design: doc.design,
    finish: doc.finish,
    idealFor: doc.idealFor,
    price: doc.mrp,
    image: doc.image || deduped[0] || "",
    images: deduped,
    slug: doc.slug,
  };
}
