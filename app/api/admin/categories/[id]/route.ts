import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const [{ adminDb }, { updateCategory }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/categories"),
      import("@/lib/products"),
    ]);
    await updateCategory(adminDb, id, body ?? {});
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category update failed";
    const status = message === "Category not found" ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const [{ adminDb }, { deleteCategory }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/categories"),
      import("@/lib/products"),
    ]);
    await deleteCategory(adminDb, id);
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category deletion failed";
    const status = message === "Category not found" ? 404 : message.includes("products before deleting") ? 409 : 500;
    if (status === 500) console.error("admin/category delete failed:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
