import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCachedRefunds, setCachedRefunds } from "@/lib/admin-cache";

// GET /api/admin/refunds — Firestore-backed refund list for the dashboard.
export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const cached = getCachedRefunds();
    if (cached) {
      return NextResponse.json({ success: true, refunds: cached });
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb
      .collection("refunds")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const refunds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCachedRefunds(refunds);

    return NextResponse.json({ success: true, refunds });
  } catch (err) {
    console.error("admin refunds list failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load refunds" }, { status: 500 });
  }
}
