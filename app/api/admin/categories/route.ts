import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const [{ adminDb }, { listCategories }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/categories"),
    ]);
    const categories = await listCategories(adminDb);
    return NextResponse.json({ success: true, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("admin/categories list failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const [{ adminDb }, { createCategory, validateCategoryInput }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/categories"),
    ]);
    const validation = validateCategoryInput({
      name: body?.name,
      description: body?.description,
      imageUrl: body?.imageUrl,
      expiresAt: body?.expiresAt,
    });
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }
    const category = await createCategory(adminDb, validation);
    const { clearProductsCache } = await import("@/lib/products");
    clearProductsCache();
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category creation failed";
    const status = message.includes("maximum category limit") ? 409 : message.includes("does not exist") || message.includes("expired") ? 400 : 500;
    if (status === 500) console.error("admin/categories create failed:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
