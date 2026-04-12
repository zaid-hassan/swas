"use client";

import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

/**
 * Catalogue (TopStyles)
 * Path: components/sections/catalogue/Catalogue.tsx
 *
 * Premium Redesign:
 * • Architectural rounded cards with subtle borders
 * • Cinematic slow-zoom image hovers
 * • Elegant centered typography for the product info
 * • Slide-up "Add to Bag" matched to the global CTA style
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
    <article className="group relative bg-white overflow-hidden rounded-[12px] md:rounded-[16px] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">

      {/* Image Container */}
      <div className="relative overflow-hidden w-full aspect-[3/4] bg-[#FCFAFA]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
        />

        {/* Dark Vignette to make buttons pop */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

        {/* Badge */}
        {item.badge && (
          <span
            className={[
              "absolute top-3 left-3 md:top-4 md:left-4 z-10",
              "text-[8px] tracking-[0.25em] uppercase px-3 py-1.5 shadow-sm",
              "font-sans font-semibold leading-none rounded-full",
              item.badgeStyle === "gold"
                ? "bg-[#D4AF37] text-white"
                : "bg-[#8B1A1A] text-white",
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
            "absolute top-3 right-3 md:top-4 md:right-4 z-10",
            "w-8 h-8 rounded-full border border-black/5 cursor-pointer",
            "flex items-center justify-center",
            "bg-white shadow-md",
            "transition-all duration-300",
            "max-md:opacity-100",
            wished
              ? "opacity-100 text-[#8B1A1A] border-[#8B1A1A]"
              : "opacity-0 group-hover:opacity-100 text-ink/40 hover:text-[#8B1A1A]",
          ].join(" ")}
        >
          <Heart size={14} strokeWidth={1.5} fill={wished ? "currentColor" : "none"} />
        </button>

        {/* Slide-up Add to Bag — Desktop */}
        <button
          className="
            absolute bottom-0 left-0 right-0 z-10
            hidden md:flex items-center justify-center gap-2
            py-4 border-none cursor-pointer
            bg-[#8B1A1A] hover:bg-black text-white
            text-[9px] tracking-[0.25em] uppercase font-semibold
            transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)]
            translate-y-full group-hover:translate-y-0
          "
        >
          <ShoppingBag size={14} strokeWidth={1.5} />
          Add to Bag
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center text-center p-4 md:p-6 bg-white z-20">
        <p className="text-[9px] tracking-[0.25em] uppercase text-[#D4AF37] mb-2 font-sans font-medium">
          {item.catLabel}
        </p>
        <h3
          className="text-ink mb-3 leading-[1.2] tracking-wide"
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            fontFamily: "var(--font-cormorant), Georgia, serif",
          }}
        >
          {item.name}
        </h3>
        
        <div className="mt-auto flex items-baseline justify-center gap-2.5">
          <span className="text-[14px] md:text-[15px] font-medium text-[#8B1A1A] tracking-wider">
            {item.price}
          </span>
          {item.oldPrice && (
            <span className="text-[11px] md:text-[12px] text-ink/40 line-through tracking-wider">
              {item.oldPrice}
            </span>
          )}
        </div>

        {/* Mobile Add to Bag */}
        <button
          className="
            mt-4 w-full md:hidden
            flex items-center justify-center gap-2
            py-3 border border-[#8B1A1A]/20 cursor-pointer rounded-full
            bg-transparent hover:bg-[#8B1A1A] text-[#8B1A1A] hover:text-white
            text-[9px] tracking-[0.2em] uppercase font-semibold
            transition-colors duration-300
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
    <section className="w-full bg-white pt-16 pb-20 max-md:pt-10 max-md:pb-14">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-4 mb-10 max-md:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[1px] bg-[#D4AF37]/60" />
              <p className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#D4AF37] font-sans font-medium">
                Curated for You
              </p>
            </div>
            <h2
              className="text-ink leading-none tracking-tight"
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontFamily: "var(--font-cormorant), Georgia, serif",
              }}
            >
              <span className="italic font-light">Top</span> Styles
            </h2>
          </div>
          
          <Link
            href="/shop"
            className="
              group flex items-center gap-2
              text-[10px] tracking-[0.2em] uppercase text-ink
              hover:text-[#D4AF37] transition-colors duration-300 font-sans font-medium
              md:pb-2
            "
          >
            <span>All Products</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>

        {/* ── Filter pills ─────────────────────────────────────────────── */}
        <div className="flex gap-3 md:gap-4 mb-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 -mx-5 px-5 md:mx-0 md:px-0">
          {FILTERS.map((f) => {
            const isOn = active === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActive(f.value)}
                className={[
                  "shrink-0 px-6 py-2.5 rounded-full text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 border whitespace-nowrap",
                  isOn
                    ? "bg-[#8B1A1A] border-[#8B1A1A] text-white shadow-md"
                    : "bg-white border-black/10 text-ink/60 hover:border-[#D4AF37] hover:text-[#D4AF37]",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12">
          {visible.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>

        {/* ── View all CTA ──────────────────────────────────────────────── */}
        <div className="flex justify-center mt-8">
          <Link
            href="/shop"
            className="
              inline-flex items-center justify-center
              px-10 py-3.5 md:px-12 md:py-4
              bg-transparent text-ink border border-ink/20
              text-[10px] tracking-[0.25em] uppercase font-semibold
              transition-all duration-300
              hover:bg-ink hover:text-white hover:border-ink
            "
          >
            Explore Complete Collection
          </Link>
        </div>
      </div>
    </section>
  );
}