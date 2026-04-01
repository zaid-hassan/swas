"use client";

import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";

/**
 * Catalogue (TopStyles)
 * Path: components/sections/catalogue/Catalogue.tsx
 *
 * Redesigned to match SWAS HTML design system precisely:
 *   • Pill filter tabs with maroon active state
 *   • 4-col responsive product grid (→ 2-col mobile)
 *   • Cards: white, shadow, 3:4 image, badge, wishlist, slide-up bag button
 *   • "View All Products" outlined CTA at bottom
 *
 * Note: This section uses local demo data (as in the original).
 * Wire up to a real data source (getProducts) when needed.
 */

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Filter = "all" | "necklace" | "bracelet" | "ring" | "earrings" | "anklet";

interface Item {
  id:          number;
  name:        string;
  price:       string;
  oldPrice?:   string;
  category:    Filter;
  catLabel:    string;
  image:       string;
  badge?:      string;
  badgeStyle?: "maroon" | "gold";
}

/* ─── Demo data ──────────────────────────────────────────────────────────── */
const ITEMS: Item[] = [
  {
    id: 1, name: "Lumina Choker",     price: "₹4,200", oldPrice: "₹5,500",
    category: "necklace", catLabel: "Choker Set",  badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1689775707172-cceca4ce565a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2, name: "Vine Bracelet",     price: "₹2,800", oldPrice: "₹3,400",
    category: "bracelet", catLabel: "Bracelet",    badge: "New", badgeStyle: "gold",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3, name: "Crescent Band Ring",price: "₹1,650", oldPrice: "₹2,100",
    category: "ring",     catLabel: "Ring",        badge: "Limited",
    image: "https://images.unsplash.com/photo-1713950920412-97799efdf870?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4, name: "Asha Bridal Set",   price: "₹8,900", oldPrice: "₹11,000",
    category: "necklace", catLabel: "Necklace Set",badge: "Bridal", badgeStyle: "gold",
    image: "https://images.unsplash.com/photo-1722510825242-0d8f2064c2e2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5, name: "Dew Drop Earrings", price: "₹1,200", oldPrice: "₹1,600",
    category: "earrings", catLabel: "Earrings",
    image: "https://images.unsplash.com/photo-1605100804567-1ffe942b5cd6?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6, name: "Suhaag Mangalsutra",price: "₹5,600", oldPrice: "₹7,000",
    category: "necklace", catLabel: "Mangalsutra", badge: "Bridal", badgeStyle: "gold",
    image: "https://images.unsplash.com/photo-1629224316810-9d8805b95e76?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7, name: "Payal Classic",     price: "₹1,950", oldPrice: "₹2,400",
    category: "anklet",   catLabel: "Anklet",      badge: "Trending",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8, name: "Bindiya Nose Pin",  price: "₹650",   oldPrice: "₹900",
    category: "earrings", catLabel: "Nose Pin",
    image: "https://images.unsplash.com/photo-1561828995-aa79a2db86dd?q=80&w=800&auto=format&fit=crop",
  },
];

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All",       value: "all"      },
  { label: "Necklace",  value: "necklace" },
  { label: "Bracelet",  value: "bracelet" },
  { label: "Ring",      value: "ring"     },
  { label: "Earrings",  value: "earrings" },
  { label: "Anklet",    value: "anklet"   },
];

/* ─── Card ───────────────────────────────────────────────────────────────── */
function CatalogCard({ item }: { item: Item }) {
  const [wished, setWished] = useState(false);

  return (
    <article className="group relative bg-white overflow-hidden rounded-[3px] shadow-[0_1px_8px_rgba(26,10,10,0.06)] hover:shadow-[0_6px_28px_rgba(26,10,10,0.11)] transition-shadow duration-300">

      {/* Image */}
      <div className="relative overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: "133.33%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[620ms] ease-out group-hover:scale-[1.05]"
          />
        </div>

        {/* Badge */}
        {item.badge && (
          <span
            className={[
              "absolute top-2.5 left-2.5 z-10",
              "text-[8.5px] tracking-[0.18em] uppercase px-2.5 py-[5px]",
              "font-sans font-normal leading-none",
              item.badgeStyle === "gold"
                ? "bg-gold text-maroon-deep"
                : "bg-maroon text-rose-900",
            ].join(" ")}
          >
            {item.badge}
          </span>
        )}

        {/* Wishlist */}
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
            "max-md:opacity-100",
            wished
              ? "opacity-100 text-maroon"
              : "opacity-0 group-hover:opacity-100 text-swas-grey hover:text-maroon",
          ].join(" ")}
        >
          <Heart size={14} strokeWidth={1.5} fill={wished ? "currentColor" : "none"} />
        </button>

        {/* Slide-up Add to Bag — desktop */}
        <button
          className="
            absolute bottom-0 left-0 right-0 z-10
            hidden md:flex items-center justify-center gap-2
            py-3 border-none cursor-pointer
            bg-maroon hover:bg-maroon-dark text-rose-900
            text-[9.5px] tracking-[0.2em] uppercase
            font-sans font-normal
            transition-all duration-[280ms] ease-out
            translate-y-full group-hover:translate-y-0
          "
        >
          <ShoppingBag size={13} strokeWidth={1.5} />
          Add to Bag
        </button>
      </div>

      {/* Body */}
      <div className="px-3 pt-3.5 pb-4 max-md:px-2.5 max-md:pt-2.5 max-md:pb-3">
        <p className="text-[9.5px] tracking-[0.2em] uppercase text-gold mb-1.5 font-sans font-normal">
          {item.catLabel}
        </p>
        <h3
          className="text-ink mb-2 leading-[1.22]"
          style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontWeight: 400,
          }}
        >
          {item.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[14.5px] font-medium text-maroon tracking-tight">
            {item.price}
          </span>
          {item.oldPrice && (
            <span className="text-[11.5px] text-swas-grey line-through">
              {item.oldPrice}
            </span>
          )}
        </div>

        {/* Mobile Add to Bag */}
        <button
          className="
            mt-3 w-full md:hidden
            flex items-center justify-center gap-2
            py-2.5 border-none cursor-pointer
            bg-maroon hover:bg-maroon-dark text-rose-900
            text-[9.5px] tracking-[0.2em] uppercase
            font-sans font-normal transition-colors duration-150
          "
        >
          <ShoppingBag size={13} strokeWidth={1.5} />
          Add to Bag
        </button>
      </div>
    </article>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
export default function TopStyles() {
  const [active, setActive] = useState<Filter>("all");
  const visible = ITEMS.filter((p) => active === "all" || p.category === active);

  return (
    <section className="w-full">
      <div className="max-w-[1280px] mx-auto px-10 max-md:px-4">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex justify-between items-end flex-wrap gap-3 pt-12 pb-7 max-md:pt-9 max-md:pb-5">
          <div>
            <p className="text-[10px] tracking-[0.32em] uppercase text-gold mb-2.5 font-sans font-light">
              Curated for You
            </p>
            <h2
              className="font-heading italic text-ink leading-none"
              style={{
                fontSize: "clamp(22px, 3vw, 36px)",
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontWeight: 400,
              }}
            >
              Top Styles
            </h2>
            <p className="mt-1.5 text-[13px] text-swas-grey font-sans font-light">
              Explore our most loved designs
            </p>
          </div>
          <a
            href="/shop"
            className="text-[11px] tracking-[0.16em] uppercase text-maroon border-b border-b-maroon pb-px hover:text-gold hover:border-b-gold transition-colors duration-200 font-sans font-light"
          >
            All Products →
          </a>
        </div>

        {/* ── Filter pills ─────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5">
          {FILTERS.map((f) => {
            const isOn = active === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActive(f.value)}
                className={[
                  "shrink-0 px-5 py-[7px] rounded-[20px] text-[11.5px] cursor-pointer font-sans font-light whitespace-nowrap",
                  "transition-all duration-200 border",
                  isOn
                    ? "bg-maroon border-maroon text-rose-900"
                    : "bg-transparent border-swas-border text-swas-grey hover:border-maroon/50 hover:text-maroon",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-md:gap-2.5 max-[430px]:gap-2">
          {visible.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>

        {/* ── View all CTA ──────────────────────────────────────────────── */}
        <div className="text-center pt-6 pb-14 max-md:pb-10">
          <a
            href="/shop"
            className="
              inline-block px-12 py-3.5
              bg-transparent text-maroon border border-maroon
              text-[10.5px] tracking-[0.22em] uppercase font-sans font-light
              transition-all duration-200
              hover:bg-maroon hover:text-rose-900
            "
          >
            View All Products
          </a>
        </div>
      </div>
    </section>
  );
}