"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useCartStore } from "@/lib/store/cart-store";
import { auth } from "@/lib/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import CheckoutAddressSection from "@/components/checkout/CheckoutAddressSection";
import { Address } from "@/types/address";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ValidatedItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const cart = useCartStore((s) => s.items);
  const router = useRouter();

  const [items, setItems] = useState<ValidatedItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function loadCheckoutData() {
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

      if (!res.ok) {
        throw new Error(data.error || "Checkout validation failed");
      }

      setItems(data.items ?? []);
      setSubtotal(data.totals?.subtotal ?? 0);
      setShipping(data.totals?.shipping ?? 0);
      setTotal(data.totals?.total ?? 0);
    } catch (err) {
      console.error("Checkout validation failed:", err);

      setItems([]);
      setSubtotal(0);
      setShipping(0);
      setTotal(0);
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
    if (!selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

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
        body: JSON.stringify({ total }),
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

        prefill: {
          name: auth.currentUser?.displayName || selectedAddress.fullName,
          email: auth.currentUser?.email || "",
          contact: selectedAddress.phone,
        },

        theme: {
          color: "#8B1A1A",
        },

        handler: async function (response: any) {
          try {
            const verify = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,

                userId: auth.currentUser?.uid,

                cart,

                customer: {
                  name: selectedAddress.fullName,
                  email: auth.currentUser?.email || "",
                  phone: selectedAddress.phone,
                },

                address: selectedAddress,

                totals: {
                  subtotal,
                  shipping,
                  total,
                },
              }),
            });

            const data = await verify.json();

            if (!data.success) {
              alert("Payment verification failed.");
              `return`;
            }

            useCartStore.getState().clearCart();

            router.push("/checkout/success");
          } catch (err) {
            console.error(err);
            alert("Verification failed.");
          }
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
      loadCheckoutData();
    } else {
      setItems([]);
      setSubtotal(0);
      setShipping(0);
      setTotal(0);
    }
  }, [cart]);

  return (
    <section className="bg-background py-10 md:py-16">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        {/* Header */}

        <div className="mb-10 border-b border-gold/15 pb-6">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Secure Checkout
          </p>

          <h1
            className="text-burgundy mt-3 text-4xl font-light md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Complete Your Order
          </h1>

          <p className="text-burgundy/65 mt-4 text-sm">
            Review your address and order before proceeding to payment.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <CheckoutAddressSection onAddressSelect={setSelectedAddress} />

          {/* Order Summary */}

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Card className="border-gold/20 bg-white">
              <CardHeader className="border-b border-gold/10">
                <CardTitle
                  className="text-burgundy text-3xl font-light"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Order Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-gold/10 pb-4 last:border-0"
                  >
                    <div className="relative h-18 w-16 shrink-0 overflow-hidden border border-gold/15 bg-warm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-burgundy text-sm font-medium leading-5">
                        {item.name}
                      </p>

                      <p className="text-burgundy/60 mt-1 text-xs uppercase tracking-[0.16em]">
                        Qty {item.quantity}
                      </p>

                      <p className="text-burgundy mt-2 font-semibold">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="space-y-3 border-t border-gold/15 pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-burgundy/70">Subtotal</span>
                    <span className="text-burgundy">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-burgundy/70">Shipping</span>
                    <span className="text-gold font-medium">
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gold/15 pt-5">
                  <div className="flex justify-between">
                    <span className="text-burgundy text-lg">Total</span>

                    <span className="text-burgundy text-2xl font-semibold">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Terms */}

                <div className="border-gold/15 bg-warm border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={acceptedTerms}
                      onCheckedChange={(checked) =>
                        setAcceptedTerms(checked === true)
                      }
                      className="border-gold mt-1 data-[state=checked]:bg-gold data-[state=checked]:text-burgundy"
                    />

                    <div className="space-y-2">
                      <p className="text-burgundy text-sm leading-6">
                        I agree to the SWAS Terms, Privacy Policy, Shipping
                        Policy and Refund Policy.
                      </p>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-gold hover:text-burgundy text-sm font-medium transition">
                            Read Policies
                          </button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-gold/20 bg-white">
                          {/* Keep your existing dialog content unchanged */}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-button hover:bg-burgundy-light mt-2 h-12 w-full rounded-none text-[11px] font-semibold uppercase tracking-[0.18em] text-gold"
                  disabled={loading || total <= 0 || !acceptedTerms}
                  onClick={handlePayment}
                >
                  {loading ? "Processing..." : "Continue to Payment"}
                </Button>

                <p className="text-burgundy/45 text-center text-xs">
                  Payments are securely processed through Razorpay.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
