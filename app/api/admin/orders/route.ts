import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCachedOrders, setCachedOrders } from "@/lib/admin-cache";

// GET /api/admin/orders — Firestore-backed order list for the dashboard.
export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const cached = getCachedOrders();
    if (cached) {
      return NextResponse.json({ success: true, orders: cached });
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCachedOrders(orders);

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("admin orders list failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load orders" }, { status: 500 });
  }
}
