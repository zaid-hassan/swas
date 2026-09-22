export const REFUND_STATUSES = ["pending", "approved", "rejected"] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export type Refund = {
  id: string;
  orderId: string;
  userId?: string | null;
  customer: string;
  email: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  coinsAdded: boolean;
  coinsAddedAt?: number;
  reviewedAt?: number;
  createdAt: number;
  updatedAt: number;
};
