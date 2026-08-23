"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import { AddToCartButton } from "../cart/CartControls";
import { Product } from "@/types/products";

/**
 * ProductCard
 * Path: components/product/ProductCard.tsx
 *
 * Luxury card matching SWAS .pcard design system:
 *   • White bg, razor-thin shadow, zero border-radius (jewellery is precise)
 *   • 3 : 4 image with scale-on-hover
 *   • Optional badge (maroon or gold variant)
 *   • Wishlist toggle (invisible → visible on desktop hover; always visible on mobile)
 *   • Slide-up "Add to Bag" bar on desktop hover; static button on mobile
 *   • Category label in gold, name in Cormorant, price in maroon
 *   • Optional oldPrice shows strikethrough
 *
 * Props:
 *   product    — standard Product type
 *   badge      — e.g. "Bestseller" | "New" | "Limited" | "Bridal"
 *   badgeStyle — "maroon" (default) | "gold"
 *   oldPrice   — e.g. "₹5,500"
 *   catLabel   — override category display label, e.g. "Choker Set"
 */

interface ProductCardProps {
  product:     Product;
  badge?:      string;
  badgeStyle?: "maroon" | "gold";
  oldPrice?:   string;
  catLabel?:   string;
}

export default function ProductCard({
  product,
  badge,
  badgeStyle = "maroon",
  oldPrice,
  catLabel = "Silver",
}: ProductCardProps) {
  const [wished, setWished] = useState(false);

  return (
    <article className="group relative bg-white overflow-hidden rounded-[3px] shadow-[0_1px_8px_rgba(26,10,10,0.06)] hover:shadow-[0_6px_28px_rgba(26,10,10,0.11)] transition-shadow duration-300">

      {/* ── IMAGE ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">

        {/* 3:4 aspect container */}
        <div className="relative w-full" style={{ paddingBottom: "133.33%" }}>
          {product?.image ? (
            <Image
              src={product?.image}
              alt={product?.name}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover transition-transform duration-[620ms] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-swas-grey bg-warm">
              No Image
            </div>
          )}
        </div>

        {/* Badge — top-left */}
        {badge && (
          <span
            className={[
              "absolute top-2.5 left-2.5 z-10",
              "text-[8.5px] tracking-[0.18em] uppercase px-2.5 py-[5px]",
              "font-sans font-normal leading-none",
              badgeStyle === "gold"
                ? "bg-gold text-maroon-deep"
                : "bg-maroon text-white",
            ].join(" ")}
          >
            {badge}
          </span>
        )}

        {/* Wishlist — top-right */}
        {/*   Desktop: hidden until hover. Mobile: always visible. */}
        <button
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={[
            "absolute top-2.5 right-2.5 z-10",
            "w-8 h-8 rounded-full border-none cursor-pointer",
            "flex items-center justify-center",
            "bg-white/90 backdrop-blur-[2px]",
            "shadow-[0_1px_6px_rgba(0,0,0,0.10)]",
            "transition-all duration-200",
            /* visibility */
            "max-md:opacity-100",
            wished
              ? "opacity-100 text-maroon"
              : "opacity-0 group-hover:opacity-100 text-swas-grey hover:text-maroon",
          ].join(" ")}
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            fill={wished ? "currentColor" : "none"}
          />
        </button>

        {/* ── Slide-up Add to Bag — desktop only ───────────────────────────
            We render AddToCartButton inside a full-width container and
            override its child button's styles via Tailwind group selectors. */}
        <div
          className="
            absolute bottom-0 left-0 right-0 z-10
            translate-y-full group-hover:translate-y-0
            transition-transform duration-[280ms] ease-out
            hidden md:block
          "
        >
          {/*
            AddToCartButton renders its own <button>. We override styles
            with [&_button] selectors so the cart logic is completely untouched.
          */}
          <div className="[&_button]:w-full [&_button]:rounded-none [&_button]:border-none [&_button]:cursor-pointer [&_button]:py-3 [&_button]:bg-maroon [&_button]:text-white [&_button]:text-[9.5px] [&_button]:tracking-[0.2em] [&_button]:uppercase [&_button]:font-sans [&_button]:font-normal [&_button]:transition-colors [&_button]:duration-150 [&_button:hover]:bg-maroon-dark">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="px-3 pt-3.5 pb-4 max-md:px-2.5 max-md:pt-2.5 max-md:pb-3">

        {/* Category — gold, ultra-small caps */}
        <p className="text-[9.5px] tracking-[0.2em] uppercase text-gold mb-1.5 font-sans font-normal">
          {catLabel}
        </p>

        {/* Name — Cormorant serif */}
        <Link href={`/shop/${product?.slug}`} className="block no-underline">
          <h3
            className="text-ink font-cg hover:text-maroon transition-colors duration-150 mb-2 leading-[1.22]"
          >
            {product?.name}
          </h3>
        </Link>

        {/* Prices */}
        <div className="flex items-baseline gap-2">
          <span className="text-[14.5px] font-cg text-maroon tracking-tight">
            ₹{product?.price}
          </span>
          {oldPrice && (
            <span className="text-[11.5px] text-swas-grey line-through">
              {oldPrice}
            </span>
          )}
        </div>

        {/* Mobile Add to Bag — always visible */}
        <div className="mt-3 md:hidden [&_button]:w-full [&_button]:rounded-none [&_button]:border-none [&_button]:cursor-pointer [&_button]:py-2.5 [&_button]:bg-maroon [&_button]:text-white [&_button]:text-[9.5px] [&_button]:tracking-[0.2em] [&_button]:uppercase [&_button]:font-sans [&_button]:font-normal [&_button]:transition-colors [&_button]:duration-150 [&_button:hover]:bg-maroon-dark">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}