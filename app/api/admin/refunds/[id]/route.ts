import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildRefundReview, canReview, isRefundAction } from "@/lib/refunds";
import { clearRefundsCache } from "@/lib/admin-cache";

// PATCH /api/admin/refunds/:id
// Body: { action: "approve" | "reject" }
// Approving credits the customer's wallet exactly once (transaction + guard).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!isRefundAction(body?.action)) {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  try {
    const [{ adminDb }, { FieldValue }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("firebase-admin/firestore"),
    ]);

    const ref = adminDb.collection("refunds").doc(id);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { error: "not_found" } as const;

      const refund = snap.data() as any;
      if (!canReview(refund.status)) return { error: "already_reviewed" } as const;

      const plan = buildRefundReview(refund, body.action);

      const update: any = {
        status: plan.status,
        reviewedAt: plan.reviewedAt,
        updatedAt: plan.updatedAt,
        coinsAdded: plan.coinsAdded,
      };
      if (plan.coinsAddedAt) update.coinsAddedAt = plan.coinsAddedAt;
      tx.set(ref, update, { merge: true });

      if (plan.creditCoins && refund.userId) {
        tx.set(
          adminDb.collection("users").doc(refund.userId),
          { wallet: { coins: FieldValue.increment(plan.coinAmount) } },
          { merge: true }
        );
      }

      return {
        ok: true,
        credited: plan.creditCoins,
        amount: plan.coinAmount,
      } as const;
    });

    if ("error" in result) {
      const notFound = result.error === "not_found";
      return NextResponse.json(
        { success: false, error: notFound ? "Not found" : "Already reviewed" },
        { status: notFound ? 404 : 409 }
      );
    }

    clearRefundsCache();

    return NextResponse.json({
      success: true,
      credited: result.credited,
      amount: result.amount,
    });
  } catch (err) {
    console.error("admin refund review failed:", err);
    return NextResponse.json({ success: false, error: "Review failed" }, { status: 500 });
  }
}
