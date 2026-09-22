import type { Fulfillment, OrderStatus } from "@/types/orders";
import { isOrderStatus } from "@/types/orders";

export type { OrderStatus } from "@/types/orders";
export { isOrderStatus } from "@/types/orders";

export type FulfillmentInput = {
  status?: string;
  courier?: string;
  awb?: string;
  trackingUrl?: string;
};

export type FulfillmentPatch = {
  status?: OrderStatus;
  fulfillment: Fulfillment;
};

// Pure: merge an admin fulfillment edit into the current order state.
// Sets shippedAt/deliveredAt timestamps once, on first transition.
export function buildFulfillmentPatch(
  current: { status?: string; fulfillment?: Fulfillment },
  input: FulfillmentInput,
  now: number = Date.now()
): FulfillmentPatch {
  const fulfillment: Fulfillment = { ...(current.fulfillment ?? {}) };

  if (typeof input.courier === "string") fulfillment.courier = input.courier.trim();
  if (typeof input.awb === "string") fulfillment.awb = input.awb.trim();
  if (typeof input.trackingUrl === "string") fulfillment.trackingUrl = input.trackingUrl.trim();

  const patch: FulfillmentPatch = { fulfillment };

  if (input.status && isOrderStatus(input.status)) {
    patch.status = input.status;

    if (input.status === "shipped" && !fulfillment.shippedAt) {
      fulfillment.shippedAt = now;
    }
    if (input.status === "delivered") {
      if (!fulfillment.shippedAt) fulfillment.shippedAt = now;
      if (!fulfillment.deliveredAt) fulfillment.deliveredAt = now;
    }
  }

  return patch;
}
