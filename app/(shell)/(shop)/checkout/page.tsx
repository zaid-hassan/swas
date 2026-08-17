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
              return;
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
    <section className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
      <h1 className="text-2xl md:text-3xl font-semibold mb-10">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_420px] gap-10">
        <CheckoutAddressSection onAddressSelect={setSelectedAddress} />

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
                  <p className="text-sm font-medium">{item.name}</p>

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
              <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            {/* Terms & Conditions */}

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(checked === true)
                  }
                  className="mt-1"
                />

                <div className="space-y-1">
                  <p className="text-sm leading-5">
                    I have read and agree to the SWAS Terms & Conditions,
                    Privacy Policy, Shipping Policy, and Refund & Cancellation
                    Policy.
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Learn more
                      </button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>SWAS Terms & Policies</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6 text-sm leading-6">
                        <section>
                          <h3 className="font-semibold mb-2">
                            Terms & Conditions
                          </h3>

                          <p>
                            By placing an order with SWAS, you confirm that the
                            information provided is accurate and agree to our
                            Terms & Conditions. Product images are for
                            representation, and slight variations may occur due
                            to handcrafted finishes, lighting, or display
                            settings.
                          </p>

                          <p className="mt-2">
                            Prices displayed at checkout are final at the time
                            of purchase. Orders may be cancelled by SWAS in
                            cases such as payment failure, suspected fraud,
                            product unavailability, or technical errors.
                          </p>
                        </section>

                        <section>
                          <h3 className="font-semibold mb-2">
                            Shipping Policy
                          </h3>

                          <ul className="list-disc pl-5 space-y-1">
                            <li>Orders are shipped within India only.</li>
                            <li>
                              Estimated delivery: 3–5 business days after
                              dispatch.
                            </li>
                            <li>Tracking details are shared after dispatch.</li>
                            <li>
                              Delivery timelines may vary due to courier or
                              operational factors.
                            </li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold mb-2">
                            Refund & Cancellation
                          </h3>

                          <ul className="list-disc pl-5 space-y-1">
                            <li>Orders can be cancelled before dispatch.</li>
                            <li>
                              Eligible returns are accepted within 7 days of
                              delivery.
                            </li>
                            <li>
                              Returned products must be unused, unworn, and in
                              original packaging.
                            </li>
                            <li>
                              Eligible standard returns are credited to your
                              SWAS Wallet after inspection.
                            </li>
                            <li>
                              Damaged, defective, or incorrect products are
                              reviewed for replacement or refund.
                            </li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold mb-2">SWAS Wallet</h3>

                          <p>
                            Approved eligible returns are credited as SWAS
                            Wallet Credit, which can be used for future
                            purchases on the SWAS website. Wallet Credit is
                            non-withdrawable except where required by law.
                          </p>
                        </section>

                        <section>
                          <h3 className="font-semibold mb-2">Privacy</h3>

                          <p>
                            SWAS collects only the information required to
                            process orders, deliver products, provide customer
                            support, and improve services. Payments are securely
                            processed through authorized payment partners, and
                            SWAS does not intentionally store complete card or
                            banking credentials.
                          </p>
                        </section>

                        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                          This summary is provided for convenience. Your
                          purchase remains subject to the complete SWAS Terms &
                          Policies available on our website.
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-button"
              disabled={loading || total <= 0 || !acceptedTerms}
              onClick={handlePayment}
            >
              {loading ? "Processing..." : "Continue to Payment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
