import type { CartItem } from "@/lib/store/cart-store";

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

export type OrderAddress = {
  id?: string;
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  landmark?: string;
};

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type OrderPricing = {
  subtotal: number;
  shipping: number;
  total: number;
};

export type OrderPayment = {
  provider: "razorpay";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

export type OrderInvoice = {
  invoiceNumber: string;
  generated: boolean;
};

export type OrderNotifications = {
  customerEmail: "pending" | "sent" | "failed";
  ownerEmail: "pending" | "sent" | "failed";
};

export type OrderGoogleSheet = {
  synced: boolean;
};

export type Order = {
  userId: string;

  /**
   * Human-readable order number.
   * Example: SWAS-2026-000001
   */
  orderNumber: string;

  /**
   * Snapshot of the cart at the time of purchase.
   * We deliberately store the items here rather than
   * referencing the current product catalogue.
   */
  items: CartItem[];

  customer: OrderCustomer;

  /**
   * Snapshot of the delivery address.
   * This must not depend on the user's current saved address.
   */
  shippingAddress: OrderAddress;

  pricing: OrderPricing;

  payment: OrderPayment;

  status: OrderStatus;

  invoice: OrderInvoice;

  notifications: OrderNotifications;

  googleSheet: OrderGoogleSheet;

  createdAt: number;

  updatedAt: number;
};