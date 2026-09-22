import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildFulfillmentPatch, isOrderStatus } from "@/lib/orders";
import { clearOrdersCache } from "@/lib/admin-cache";

// PATCH /api/admin/orders/:id
// Body: { status?, courier?, awb?, trackingUrl? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.status !== undefined && !isOrderStatus(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const ref = adminDb.collection("orders").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const cur = snap.data() as any;
    const patch = buildFulfillmentPatch(
      { status: cur.status, fulfillment: cur.fulfillment },
      body
    );

    await ref.set({ ...patch, updatedAt: Date.now() }, { merge: true });
    clearOrdersCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin order update failed:", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
