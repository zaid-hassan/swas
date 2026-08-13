"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useCartStore } from "@/lib/store/cart-store";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import CheckoutAddressSection from "@/components/checkout/CheckoutAddressSection";

type ValidatedItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const cart = useCartStore((s) => s.items);

  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function validateCart() {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      });

      const data = await res.json();

      setItems(data.items);
      setSubtotal(data.totals.subtotal);
      setShipping(data.totals.shipping);
      setTotal(data.totals.total);
    } finally {
      setLoading(false);
    }
  }

  function loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
      const existing = document.getElementById("razorpay-sdk");

      if (existing) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    setLoading(true);

    try {
      const sdkLoaded = await loadRazorpayScript();

      if (!sdkLoaded) {
        alert("Failed to load Razorpay.");
        return;
      }

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create order.");
      }

      const order = await res.json();

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency,

        order_id: order.id,

        name: "SWAS",

        description: "Handcrafted Silver Jewellery",

        image: "/logo.png",

        handler(response: any) {
          console.log("Payment Successful", response);

          alert("Payment Successful (Verification comes next)");
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#8B1A1A",
        },
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      alert("Unable to start payment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cart.length) {
      validateCart();
    }
  }, [cart]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
      <h1 className="text-2xl md:text-3xl font-semibold mb-10">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-[1fr_420px] gap-10">
        <CheckoutAddressSection />

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col flex-1">
                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Shipping</span>

              <span>
                {shipping === 0
                  ? "Free"
                  : `₹${shipping}`}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Button
              className="w-full mt-4 bg-button"
              disabled={loading || total <= 0}
              onClick={handlePayment}
            >
              {loading
                ? "Processing..."
                : "Continue to Payment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}