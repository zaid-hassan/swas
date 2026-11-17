import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const firstId = typeof body?.firstId === "string" ? body.firstId : "";
    const secondId = typeof body?.secondId === "string" ? body.secondId : "";
    const [{ adminDb }, { reorderCategories }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/categories"),
      import("@/lib/products"),
    ]);
    await reorderCategories(adminDb, firstId, secondId);
    clearProductsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category reorder failed";
    const status = message === "Category not found" ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
