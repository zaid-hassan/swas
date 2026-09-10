import { NextResponse } from "next/server";
import { productHash, slugify } from "@/lib/product-rows";

function isAdmin(req: Request) {
  const required = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!required) return true;
  return req.headers.get("x-admin-email") === required;
}

// PATCH /api/admin/products/:id  (id = docId, e.g. p-42)
// Body: partial fields { name?, category?, description?, material?,
// design?, finish?, idealFor?, mrp?, image?, image1?, image2?, image3?,
// dateOfAdd?, isVisible? } — only changed fields are written.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const patch = await req.json();
    // Lazy-load firebase-admin so `next build` doesn't evaluate service
    // account credentials at build time (runtime has real env).
    const [{ adminDb }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/products"),
    ]);
    const ref = adminDb.collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const cur = snap.data() as any;

    const next = { ...cur };
    const allowed = [
      "category",
      "name",
      "description",
      "material",
      "design",
      "finish",
      "idealFor",
      "dateOfAdd",
      "image",
      "image1",
      "image2",
      "image3",
      "isVisible",
    ] as const;
    for (const k of allowed) {
      if (patch[k] !== undefined) next[k] = typeof patch[k] === "string" ? patch[k].trim() : patch[k];
    }
    if (patch.mrp !== undefined) {
      const mrp = Number(patch.mrp);
      if (!Number.isFinite(mrp) || mrp < 0) {
        return NextResponse.json({ success: false, error: "Invalid mrp" }, { status: 400 });
      }
      next.mrp = mrp;
    }
    if (!next.name) {
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    }
    // Keep slug stable unless the name changed (slug includes S No so no collisions)
    if (patch.name && patch.name !== cur.name) {
      next.slug = `${slugify(next.name)}-${next.sNo}`;
    }
    next.hash = productHash(next);
    next.updatedAt = Date.now();

    // Skip write entirely when nothing changed (cost control)
    if (next.hash === cur.hash) {
      return NextResponse.json({ success: true, skipped: true });
    }

    await ref.set(next, { merge: true });
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("products/patch failed:", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
