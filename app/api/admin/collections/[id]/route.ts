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
    const [{ adminDb }, { updateCollection, setCollectionActive }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/collections"),
      import("@/lib/products"),
    ]);
    if (Object.keys(body ?? {}).length === 1 && typeof body?.isActive === "boolean") {
      await setCollectionActive(adminDb, id, body.isActive);
    } else {
      await updateCollection(adminDb, id, body ?? {});
    }
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection update failed";
    const status = message === "Collection not found" ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const [{ adminDb }, { deleteCollection }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/collections"),
      import("@/lib/products"),
    ]);
    await deleteCollection(adminDb, id);
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection deletion failed";
    const status = message === "Collection not found" ? 404 : message.includes("before deleting") ? 409 : 500;
    if (status === 500) console.error("admin/collection delete failed:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
