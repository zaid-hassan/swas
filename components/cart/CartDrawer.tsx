"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Diamond,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useCartStore } from "@/lib/store/cart-store";
import { useMounted } from "@/lib/hooks/use-mounted";

import {
  CartBadge,
  CartQuantityControls,
  RemoveFromCartButton,
  calculateCartSubtotal,
} from "@/components/cart/CartControls";

/* ─────────────────────────────────────────────────────────────
   Empty Cart Illustration
───────────────────────────────────────────────────────────── */

function EmptyCartIllustration() {
  return (
    <div
      aria-hidden="true"
      className="
        relative flex h-[150px] w-[180px]
        items-center justify-center
      "
    >
      {/* Very subtle editorial backdrop */}
      <div className="absolute h-[110px] w-[130px] rounded-full bg-gold/5" />

      {/* Shopping bag */}
      <div className="relative z-10">
        <ShoppingBag
          size={76}
          strokeWidth={0.85}
          className="text-gold-soft"
        />

        {/* Diamond sitting above the bag */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <Diamond
            size={30}
            strokeWidth={1}
            className="text-gold"
          />
        </div>

        {/* Small sparkle */}
        <div className="absolute -left-6 top-4 text-gold/70">
          <span className="text-xl font-light">✦</span>
        </div>

        {/* Small sparkle */}
        <div className="absolute -right-5 bottom-4 text-gold/50">
          <span className="text-sm font-light">✦</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trust Features
───────────────────────────────────────────────────────────── */

function TrustFeatures() {
  return (
    <div className="grid grid-cols-3 border-t border-gold-soft/25 pt-5">
      <div className="flex flex-col items-center px-2 text-center">
        <ShieldCheck
          size={21}
          strokeWidth={1.2}
          className="mb-2 text-burgundy/80"
        />

        <p className="text-[9px] font-medium leading-4 text-burgundy/75 sm:text-[10px]">
          Secure
          <br />
          Checkout
        </p>
      </div>

      <div className="flex flex-col items-center border-x border-gold-soft/25 px-2 text-center">
        <Truck
          size={21}
          strokeWidth={1.2}
          className="mb-2 text-burgundy/80"
        />

        <p className="text-[9px] font-medium leading-4 text-burgundy/75 sm:text-[10px]">
          Free Shipping
          <br />
          All India
        </p>
      </div>

      <div className="flex flex-col items-center px-2 text-center">
        <BadgeCheck
          size={21}
          strokeWidth={1.2}
          className="mb-2 text-burgundy/80"
        />

        <p className="text-[9px] font-medium leading-4 text-burgundy/75 sm:text-[10px]">
          925 Silver
          <br />
          Hallmarked
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Cart Drawer
───────────────────────────────────────────────────────────── */

export function CartDrawer() {
  const mounted = useMounted();
  const router = useRouter();

  const items = useCartStore((s) => s.items);

  const [open, setOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Open cart"
        className="
          text-cream
          hover:text-gold
          relative flex h-10 w-10
          items-center justify-center
          transition-colors
        "
      >
        <ShoppingBag size={22} strokeWidth={1.4} />
      </button>
    );
  }

  const subtotal = calculateCartSubtotal(items);

  function navigateFromCart(path: string) {
    if (isNavigating) return;

    setIsNavigating(true);
    setOpen(false);

    window.setTimeout(() => {
      router.push(path);
      setIsNavigating(false);
    }, 250);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open cart"
          className="
            text-cream
            hover:bg-gold/10
            hover:text-gold
            relative flex h-10 w-10
            items-center justify-center
            transition-all
          "
        >
          <ShoppingBag size={22} strokeWidth={1.4} />
          <CartBadge />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="
          flex h-full w-full flex-col
          border-l border-gold-soft/25
          bg-cream p-0
          text-burgundy
          shadow-2xl
          sm:max-w-[480px]
        "
      >
        {/* Header */}
        <SheetHeader
          className="
            shrink-0
            border-b border-gold-soft/30
            px-7 py-7
            sm:px-8
          "
        >
          <div className="flex items-center justify-between pr-7">
            <SheetTitle
              className="
                text-burgundy
                text-[23px]
                font-medium
                uppercase
                tracking-[0.08em]
              "
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Cart
            </SheetTitle>

            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-burgundy/60">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* ───────────────── EMPTY CART ───────────────── */
            <div className="flex min-h-full flex-col px-7 py-10 sm:px-8 sm:py-12">
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                {/* Illustration */}
                <EmptyCartIllustration />

                {/* Heading */}
                <h2
                  className="
                    mt-4
                    text-[30px]
                    font-medium
                    leading-tight
                    text-burgundy
                    sm:text-[32px]
                  "
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Your cart is empty
                </h2>

                {/* Description */}
                <p className="mt-3 max-w-[250px] text-[14px] leading-6 text-burgundy/70">
                  Discover something beautiful and make it yours.
                </p>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => navigateFromCart("/shop")}
                  disabled={isNavigating}
                  className="
                    group
                    mt-7
                    flex items-center gap-2
                    border-b border-gold
                    pb-2
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-burgundy
                    transition-colors duration-300
                    hover:text-gold-soft
                    disabled:opacity-50
                  "
                >
                  Explore Jewellery

                  <ArrowRight
                    size={15}
                    strokeWidth={1.5}
                    className="
                      transition-transform duration-300
                      group-hover:translate-x-1
                    "
                  />
                </button>
              </div>

              {/* Trust Features */}
              <TrustFeatures />
            </div>
          ) : (
            /* ───────────────── FILLED CART ───────────────── */
            <div className="px-7 py-6 sm:px-8">
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="
                      flex gap-4
                      border-b border-gold-soft/20
                      pb-6
                    "
                  >
                    <div className="relative h-[100px] w-[82px] shrink-0 overflow-hidden bg-warm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="82px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[14px] font-medium leading-5 text-burgundy">
                            {item.name}
                          </p>

                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold-soft">
                            Jewellery
                          </p>
                        </div>

                        <RemoveFromCartButton id={item.id} />
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <CartQuantityControls id={item.id} />

                        <p className="text-sm font-semibold text-burgundy">
                          ₹{item.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="
              shrink-0
              border-t border-gold-soft/25
              bg-cream
              px-7 py-6
              sm:px-8
            "
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-burgundy/75">
                Subtotal
              </span>

              <span className="text-[15px] font-semibold text-burgundy">
                ₹{subtotal}
              </span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigateFromCart("/cart")}
                disabled={isNavigating}
                className="
                  group
                  flex w-full items-center justify-center gap-3
                  border border-burgundy
                  bg-transparent
                  px-5 py-3.5
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-burgundy
                  transition-all duration-300
                  hover:bg-burgundy
                  hover:text-cream
                  disabled:opacity-50
                "
              >
                View Cart

                <ChevronRight
                  size={17}
                  strokeWidth={1.4}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={() => navigateFromCart("/checkout")}
                disabled={isNavigating}
                className="
                  group
                  flex w-full items-center justify-center gap-3
                  bg-button
                  px-5 py-3.5
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-white
                  transition-all duration-300
                  hover:bg-burgundy-rich
                  disabled:opacity-50
                "
              >
                Checkout

                <ArrowRight
                  size={16}
                  strokeWidth={1.4}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </div>

            <div className="mt-6">
              <TrustFeatures />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}