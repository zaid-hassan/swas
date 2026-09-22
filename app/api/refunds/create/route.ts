import { NextResponse } from "next/server";

// POST /api/refunds/create — stores a refund request in Firestore.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, userId, customer, email, amount, reason } = body ?? {};

    if (!orderId || !email || !reason || !Number.isFinite(Number(amount))) {
      return NextResponse.json(
        { success: false, error: "Missing refund fields" },
        { status: 400 }
      );
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const ref = adminDb.collection("refunds").doc();

    await ref.set({
      orderId,
      userId: userId ?? null,
      customer: customer ?? "",
      email,
      amount: Number(amount),
      reason: String(reason).trim(),
      status: "pending",
      coinsAdded: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, refundId: ref.id });
  } catch (err) {
    console.error("refund create failed:", err);
    return NextResponse.json({ success: false, error: "Failed to submit refund" }, { status: 500 });
  }
}
