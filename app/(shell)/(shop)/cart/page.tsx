"use client";

import { useCartStore } from "@/lib/store/cart-store";
import Image from "next/image";
import Link from "next/link";

import {
  CartQuantityControls,
  RemoveFromCartButton,
  calculateCartSubtotal,
} from "@/components/cart/CartControls";

import { CheckoutSummary } from "@/components/cart/CheckoutSummary";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = calculateCartSubtotal(items);

  if (!items.length) {
    return (
      <section className="bg-background flex min-h-[75vh] items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <div className="border-gold/30 mx-auto mb-8 flex h-24 w-24 items-center justify-center border">
            <ShoppingBag className="text-gold h-10 w-10" strokeWidth={1.4} />
          </div>

          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            SWAS
          </p>

          <h1
            className="text-burgundy mt-4 text-4xl font-light"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your Cart is Empty
          </h1>

          <p className="text-burgundy/65 mt-5 leading-7">
            Discover handcrafted silver jewellery designed for timeless
            elegance.
          </p>

          <Link href="/shop">
            <Button className="bg-button hover:bg-burgundy-light mt-10 h-12 rounded-none px-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-10 md:py-16">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        {/* Header */}

        <div className="mb-10 border-b border-gold/15 pb-6">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Shopping Cart
          </p>

          <h1
            className="text-burgundy mt-3 text-4xl font-light md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your Selection
          </h1>

          <p className="text-burgundy/65 mt-4 text-sm">
            {items.length} {items.length === 1 ? "piece" : "pieces"} selected
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          {/* Cart Items */}

          <div className="space-y-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="border-border bg-white border p-4 transition-all duration-300 hover:border-gold/30"
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Image */}

                  <div className="relative h-28 w-24 shrink-0 overflow-hidden border border-gold/15 bg-warm md:h-36 md:w-28">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>

                  {/* Content */}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-gold text-[9px] uppercase tracking-[0.28em]">
                          SWAS Jewellery
                        </p>

                        <h3 className="text-burgundy mt-2 text-base leading-6 md:text-lg">
                          {item.name}
                        </h3>
                      </div>

                      <RemoveFromCartButton id={item.id} />
                    </div>

                    <div className="bg-gold/15 my-5 h-px w-full" />

                    <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-burgundy text-xl font-semibold">
                          ₹{item.price.toLocaleString()}
                        </p>

                        <p className="text-burgundy/55 mt-1 text-xs uppercase tracking-[0.14em]">
                          Sterling Silver
                        </p>
                      </div>

                      <CartQuantityControls id={item.id} />
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* Continue Shopping */}

            <div className="border-t border-gold/15 pt-4">
              <Link
                href="/shop"
                className="text-burgundy hover:text-gold inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] transition"
              >
                Continue Shopping
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          {/* Checkout Summary */}

          <div className="lg:sticky lg:top-28 lg:self-start">
            <CheckoutSummary subtotal={subtotal} />
          </div>
        </div>
      </div>
    </section>
  );
}