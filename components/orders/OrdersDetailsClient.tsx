"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  ArrowRight,
  Calendar,
  Check,
  Circle,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

import RefundDialog from "@/components/orders/RefundDialog";

type Props = {
  orderId: string;
};

type Tracking = {
  found: boolean;
  orderNumber?: string;
  status?: string;
  courier?: string;
  awb?: string | number;
};

function getTrackingUrl(courier?: string, awb?: string | number) {
  if (!courier || !awb) return null;

  const code = String(awb);

  switch (courier.toLowerCase()) {
    case "blue dart":
    case "bluedart":
      return `https://www.bluedart.com/tracking?trackingNumber=${code}`;

    case "delhivery":
      return `https://www.delhivery.com/track/package/${code}`;

    case "dtdc":
      return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb&strCnno=${code}`;

    default:
      return null;
  }
}

export default function OrderDetailsClient({ orderId }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      setOrder(snap.data());
    });

    return unsub;
  }, [orderId]);

  useEffect(() => {
    async function loadTracking() {
      try {
        const res = await fetch(`/api/tracking/${orderId}`);
        setTracking(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setTrackingLoading(false);
      }
    }

    loadTracking();
  }, [orderId]);

  if (!order) {
    return (
      <section className="bg-background flex min-h-[60vh] items-center justify-center">
        <p className="text-burgundy/70">Loading order...</p>
      </section>
    );
  }

  const trackingUrl = getTrackingUrl(tracking?.courier, tracking?.awb);

  const firstItem = order.items?.[0];

  const currentStatus = (
    tracking?.status ||
    order.status ||
    "confirmed"
  ).toLowerCase();

  const steps = [
    {
      key: "confirmed",
      label: "Order Confirmed",
      date: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    {
      key: "shipped",
      label: "Shipped",
      date:
        currentStatus === "shipped" || currentStatus === "delivered"
          ? "In Transit"
          : "Pending",
    },
    {
      key: "delivered",
      label: "Delivered",
      date: currentStatus === "delivered" ? "Completed" : "Estimated Soon",
    },
  ];

  const currentIndex =
    currentStatus === "delivered" ? 2 : currentStatus === "shipped" ? 1 : 0;

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
        {/* Header */}

        <div className="mb-10">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Order Details
          </p>

          <h1
            className="text-burgundy mt-3 text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {order.orderNumber}
          </h1>

          <p className="text-burgundy/65 mt-3 text-sm">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>

        {/* Main Card */}

        <section className="border border-border bg-card p-5 md:p-7">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            {/* Product */}

            <div className="relative aspect-square overflow-hidden bg-warm">
              <Image
                src={firstItem?.image || "/placeholder.webp"}
                alt={firstItem?.name || "Product"}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}

            <div className="flex flex-col">
              <div>
                <h2
                  className="text-burgundy text-3xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {firstItem?.name}
                </h2>

                <p className="text-gold mt-2 text-[10px] font-semibold uppercase tracking-[0.25em]">
                  925 Sterling Silver
                </p>

                <p className="text-burgundy mt-5 text-4xl font-light">
                  ₹{order.pricing.total}
                </p>
              </div>

              <div className="border-border my-6 border-t" />

              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2 text-burgundy/80">
                  <Package size={16} />
                  {order.orderNumber}
                </div>

                <div className="flex items-center gap-2 text-burgundy/80">
                  <Calendar size={16} />
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-burgundy" />

                <span className="text-sm font-medium text-burgundy">
                  {tracking?.status || order.status}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-button hover:bg-burgundy-rich flex items-center gap-2 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition"
                  >
                    Track Package
                    <ArrowRight size={15} />
                  </a>
                )}

                <RefundDialog
                  orderId={orderId}
                  customer={
                    order.customer.displayName || order.shippingAddress.fullName
                  }
                  email={order.customer.email}
                  amount={order.pricing.total}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}

          <div className="border-border mt-10 border-t pt-8">
            <div className="grid grid-cols-3 gap-4">
              {steps.map((step, index) => {
                const completed = index <= currentIndex;

                return (
                  <div key={step.key} className="text-center">
                    <div className="flex items-center justify-center">
                      {completed ? (
                        <div className="bg-burgundy flex h-8 w-8 items-center justify-center rounded-full">
                          <Check size={16} className="text-white" />
                        </div>
                      ) : (
                        <Circle size={30} className="text-gold" />
                      )}
                    </div>

                    <p className="text-burgundy mt-3 text-xs font-semibold uppercase tracking-[0.12em]">
                      {step.label}
                    </p>

                    <p className="text-burgundy/60 mt-1 text-[11px]">
                      {step.date}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Details Grid */}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Shipping */}

          <section className="border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="text-gold" size={20} />

              <h3
                className="text-burgundy text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Shipping Address
              </h3>
            </div>

            <div className="space-y-1 text-sm leading-6 text-burgundy/75">
              <p className="font-medium text-burgundy">
                {order.shippingAddress.fullName}
              </p>

              <p>{order.shippingAddress.phone}</p>

              <p>{order.shippingAddress.addressLine1}</p>

              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}

              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>

              <p>{order.shippingAddress.pincode}</p>
            </div>
          </section>

          {/* Order Summary */}

          <section className="border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package className="text-gold" size={20} />

              <h3
                className="text-burgundy text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Order Summary
              </h3>
            </div>

            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div
                  key={`${item.id}-${item.quantity}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-burgundy/80">
                    {item.name} × {item.quantity}
                  </span>

                  <span className="text-burgundy">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}

              <div className="border-border border-t pt-4">
                <div className="flex justify-between text-lg font-semibold text-burgundy">
                  <span>Total</span>

                  <span>₹{order.pricing.total}</span>
                </div>
              </div>

              {!trackingLoading && tracking?.awb && (
                <div className="border-border border-t pt-4 text-sm text-burgundy/75">
                  <div className="mb-2 flex justify-between">
                    <span>Courier</span>

                    <span>{tracking.courier}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>AWB</span>

                    <span>{tracking.awb}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Trust Strip */}

        <section className="border-border mt-10 border-y py-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                icon: Truck,
                title: "Shipping",
                text: "All India delivery",
              },
              {
                icon: ShieldCheck,
                title: "Authentic 925 Silver",
                text: "Hallmarked & certified",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                text: "15-day return policy",
              },
              {
                icon: Package,
                title: "SWAS Care",
                text: "Premium support",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="bg-warm flex h-10 w-10 items-center justify-center rounded-full">
                    <Icon size={18} className="text-gold" />
                  </div>

                  <div>
                    <p className="text-burgundy text-xs font-semibold">
                      {item.title}
                    </p>

                    <p className="text-burgundy/60 text-[11px]">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
