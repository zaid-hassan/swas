import type { RefundStatus } from "@/types/refunds";

export type RefundAction = "approve" | "reject";

export function isRefundAction(value: unknown): value is RefundAction {
  return value === "approve" || value === "reject";
}

// Only pending refunds can be reviewed (idempotency / double-click guard).
export function canReview(status: RefundStatus): boolean {
  return status === "pending";
}

export function actionToStatus(action: RefundAction): RefundStatus {
  return action === "approve" ? "approved" : "rejected";
}

export type RefundReviewPlan = {
  status: RefundStatus;
  reviewedAt: number;
  updatedAt: number;
  creditCoins: boolean;
  coinAmount: number;
  coinsAdded: boolean;
  coinsAddedAt?: number;
};

// Pure: decide the refund update and whether to credit wallet coins.
// Coins are credited at most once and only when the refund is linked to a user.
export function buildRefundReview(
  refund: {
    status: RefundStatus;
    coinsAdded?: boolean;
    amount: number;
    userId?: string | null;
  },
  action: RefundAction,
  now: number = Date.now()
): RefundReviewPlan {
  const status = actionToStatus(action);

  if (action === "reject") {
    return {
      status,
      reviewedAt: now,
      updatedAt: now,
      creditCoins: false,
      coinAmount: 0,
      coinsAdded: refund.coinsAdded ?? false,
    };
  }

  const creditCoins =
    !refund.coinsAdded && !!refund.userId && Number(refund.amount) > 0;

  return {
    status,
    reviewedAt: now,
    updatedAt: now,
    creditCoins,
    coinAmount: Number(refund.amount) || 0,
    coinsAdded: creditCoins ? true : refund.coinsAdded ?? false,
    coinsAddedAt: creditCoins ? now : undefined,
  };
}
