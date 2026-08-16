"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    const unsubscribe = onSnapshot(doc(db, "orders", orderId), (snap) => {
      setOrder(snap.data());
    });

    return unsubscribe;
  }, [orderId]);

  useEffect(() => {
    async function loadTracking() {
      try {
        const res = await fetch(`/api/tracking/${orderId}`);

        const data = await res.json();
        console.log(data)
        setTracking(data);
      } catch (err) {
        console.error("Tracking fetch failed:", err);
      } finally {
        setTrackingLoading(false);
      }
    }

    loadTracking();
  }, [orderId]);

  if (!order) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-12 text-center">
        Loading order...
      </section>
    );
  }

  const trackingUrl = getTrackingUrl(tracking?.courier, tracking?.awb);

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{order.orderNumber}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <span>Status</span>
            <Badge>{tracking?.status || order.status}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Total</span>
            <span>₹{order.pricing.total}</span>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Items</h3>

            <div className="space-y-2">
              {order.items.map((item: any) => (
                <div
                  key={`${item.id}-${item.quantity}`}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Shipping Address</h3>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>{order.shippingAddress.fullName}</p>

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
          </div>

          {!trackingLoading && tracking?.awb ? (
            <>
              <div className="flex justify-between">
                <span>Courier</span>
                <span>{tracking.courier}</span>
              </div>

              <div className="flex justify-between">
                <span>AWB Number</span>
                <span>{tracking.awb}</span>
              </div>

              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">Track Package</Button>
                </a>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-sm">
              Your order has been confirmed. Tracking details will appear here
              once the parcel is dispatched.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}