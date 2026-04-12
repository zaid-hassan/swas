"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/**
 * Hero Slider — Cinematic Peekaboo Layout
 */

/* ─── Slide data ─────────────────────────────────────────────────────────── */
const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=90&w=1600&auto=format&fit=crop",
    titleLine1: "PARIS",
    titleLine2: "COUTURE",
    titleLine3: "WEEK",
    titleLine4: "2026",
    brandLogo: "T",
    brandName: "Tanishq",
    collabTop: "DESERT",
    collabMid: "DIAMONDS",
    collabBot: "RAHUL MISHRA",
    footerLogos: "Tanishq × De Beers Group · For Natural Diamonds",
    ctaLabel: "KNOW MORE",
    ctaHref: "/shop",
  },
  {
    image:
      "https://images.unsplash.com/photo-1573408301185-9519f94f73f0?q=90&w=1600&auto=format&fit=crop",
    titleLine1: "BRIDAL",
    titleLine2: "COLLECTION",
    titleLine3: "AUTUMN",
    titleLine4: "2025",
    brandLogo: "T",
    brandName: "Tanishq",
    collabTop: "WEDDING",
    collabMid: "EDITION",
    collabBot: "EXCLUSIVE",
    footerLogos: "BIS Hallmarked · Crafted in India",
    ctaLabel: "SHOP WEDDING",
    ctaHref: "/shop",
  },
  {
    image:
      "https://images.unsplash.com/photo-1561828995-aa79a2db86dd?q=90&w=1600&auto=format&fit=crop",
    titleLine1: "CUSTOM",
    titleLine2: "ORDERS",
    titleLine3: "NOW",
    titleLine4: "OPEN",
    brandLogo: "T",
    brandName: "Tanishq",
    collabTop: "BESPOKE",
    collabMid: "JEWELLERY",
    collabBot: "YOUR VISION",
    footerLogos: "Made to Order · 925 Sterling Silver",
    ctaLabel: "GET CUSTOM ORDER",
    ctaHref: "/shop",
  },
] as const;

const TOTAL = slides.length;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Hero() {
  const [current, setCurrent] = useState(0);
  const pointerStart = useRef(0);
  const isDragging = useRef(false);

  const go = useCallback(
    (i: number) => setCurrent(((i % TOTAL) + TOTAL) % TOTAL),
    []
  );
  const advance = useCallback((dir: 1 | -1) => go(current + dir), [
    current,
    go,
  ]);

  /* Auto-advance */
  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % TOTAL), 6000);
    return () => clearInterval(id);
  }, []);

  /* Swipe Handlers */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointerStart.current = e.clientX;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = pointerStart.current - e.clientX;
    if (Math.abs(delta) > 44) advance(delta > 0 ? 1 : -1);
  }

  return (
    <section className="relative w-full select-none overflow-hidden bg-white pb-6 pt-4">
      {/* CSS Variables for Peekaboo calculation */}
      <style>{`
        :root {
          --hero-peek: 24px;
          --hero-gap: 16px;
        }
        @media (min-width: 768px) {
          :root {
            --hero-peek: 120px;
            --hero-gap: 24px;
          }
        }
        .hero-track {
          width: calc(100% - var(--hero-peek) * 2);
          margin: 0 auto;
        }
        .hero-slider {
          display: flex;
          gap: var(--hero-gap);
          transform: translateX(calc(-1 * var(--current, 0) * (100% + var(--hero-gap))));
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          will-change: transform;
        }
      `}</style>

      {/* ── TRACK ──────────────────────────────────────────────────────────── */}
      <div className="relative w-full mx-auto max-w-[100vw]">
        <div
          className="hero-track touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            isDragging.current = false;
          }}
          style={{ "--current": current } as React.CSSProperties}
        >
          <div className="hero-slider cursor-grab active:cursor-grabbing">
            {slides.map((slide, i) => (
              <SlideCard key={i} slide={slide} />
            ))}
          </div>
        </div>

        {/* ── PEEK ARROWS (Desktop ghost clickable zones) ──────────────────── */}
        <button
          aria-label="Previous slide"
          onClick={() => advance(-1)}
          className="absolute left-0 top-0 h-full flex items-center justify-center max-md:hidden cursor-pointer z-10 group"
          style={{ width: "var(--hero-peek)" }}
        >
          <span className="text-black/30 text-5xl font-light group-hover:text-black transition-colors duration-300">
            ‹
          </span>
        </button>

        <button
          aria-label="Next slide"
          onClick={() => advance(1)}
          className="absolute right-0 top-0 h-full flex items-center justify-center max-md:hidden cursor-pointer z-10 group"
          style={{ width: "var(--hero-peek)" }}
        >
          <span className="text-black/30 text-5xl font-light group-hover:text-black transition-colors duration-300">
            ›
          </span>
        </button>
      </div>

      {/* ── DIAMOND DOTS ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-3 pt-6"
        role="tablist"
        aria-label="Slides"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => go(i)}
            className="transition-all duration-300"
            style={{
              width: i === current ? 8 : 6,
              height: i === current ? 8 : 6,
              transform: "rotate(45deg)",
              backgroundColor: i === current ? "#8B1A1A" : "#D1D1D1",
            }}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── SlideCard ─────────────────────────────────────────────────────────── */
function SlideCard({ slide }: { slide: typeof slides[number] }) {
  return (
    <div className="relative min-w-full shrink-0 overflow-hidden rounded-[20px] h-[550px] max-md:h-[480px]">
      {/* Background Image */}
      <img
        src={slide.image}
        alt={slide.titleLine1}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Warm Vignette Gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 30%, rgba(20,10,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* ── CONTENT OVERLAYS ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        
        {/* Top Left: A SWAS PRODUCT */}
        <div className="absolute top-6 left-6 md:top-8 md:left-10">
          <span className="text-white text-[8px] md:text-[9px] tracking-[0.25em] font-bold uppercase drop-shadow-md">
            A SWAS PRODUCT
          </span>
        </div>

        {/* --- DESKTOP LAYOUT --- */}
        {/* Center Left: Main Title */}
        <div className="absolute top-1/2 -translate-y-1/2 left-12 flex flex-col items-center max-md:hidden">
          <h2
            className="text-white text-center leading-[1.1] drop-shadow-lg"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            <span className="block text-[40px] tracking-wide">{slide.titleLine1}</span>
            <span className="block text-[44px] tracking-wide">{slide.titleLine2}</span>
            <span className="block text-[40px] tracking-wide">{slide.titleLine3}</span>
            <span className="block text-[36px] tracking-wide">{slide.titleLine4}</span>
          </h2>
        </div>

        {/* Center Right: Collab & Brand */}
        <div className="absolute top-1/2 -translate-y-1/2 right-12 flex flex-col items-center gap-6 max-md:hidden drop-shadow-lg">
          {/* Brand */}
          <div className="flex flex-col items-center text-white">
            <span className="text-3xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {slide.brandLogo}
            </span>
            <span className="text-2xl tracking-wide mt-1" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {slide.brandName}
            </span>
          </div>
          
          {/* Diamonds Icon Placeholder */}
          <div className="grid grid-cols-3 gap-1 w-6 h-6 opacity-80">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 bg-[#D4AF37] rotate-45 ${i === 2 ? 'col-start-2' : ''}`} />
            ))}
          </div>

          {/* Collab Info */}
          <div className="flex flex-col items-center text-white/90 text-center gap-2">
            <div className="text-[10px] tracking-[0.3em] uppercase leading-tight">
              {slide.collabTop} <br /> {slide.collabMid}
            </div>
            <span className="text-sm italic font-serif">x</span>
            <div className="text-sm tracking-[0.2em] uppercase">
              {slide.collabBot}
            </div>
          </div>
        </div>

        {/* --- MOBILE LAYOUT --- */}
        {/* Mobile Right: Title & Brand stacked */}
        <div className="absolute top-14 right-5 md:hidden flex flex-col items-end text-right drop-shadow-lg max-w-[65%]">
          <h2
            className="text-white leading-[1.1] mb-5"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            <span className="block text-xl">{slide.titleLine1}</span>
            <span className="block text-2xl">{slide.titleLine2}</span>
            <span className="block text-xl">{slide.titleLine3}</span>
            <span className="block text-lg">{slide.titleLine4}</span>
          </h2>
          
          <div className="flex flex-col items-end text-white mb-4">
            <span className="text-xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {slide.brandLogo}
            </span>
            <span className="text-lg tracking-wide" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {slide.brandName}
            </span>
          </div>

          <div className="text-white/90 text-[9px] tracking-[0.2em] uppercase leading-tight mb-1">
            {slide.collabTop} {slide.collabMid}
          </div>
          <span className="text-white/90 text-xs italic font-serif mb-1">x</span>
          <div className="text-white text-[10px] tracking-[0.15em] uppercase">
            {slide.collabBot}
          </div>
        </div>

        {/* --- BOTTOM ROW (Shared) --- */}
        <div className="absolute bottom-5 md:bottom-8 left-0 w-full px-5 md:px-10 flex flex-col-reverse md:flex-row md:items-end md:justify-between items-center gap-4 pointer-events-auto">
          
          {/* Bottom Left: Footer Logos */}
          <div className="text-white/60 text-[8px] md:text-[9px] tracking-[0.15em] uppercase text-center md:text-left max-w-[90%] md:max-w-[200px] leading-relaxed">
            {slide.footerLogos}
          </div>

          {/* Bottom Center: CTA */}
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 shrink-0">
            <Link
              href={slide.ctaHref}
              className="inline-block bg-white text-black px-8 py-2.5 md:px-10 md:py-3 text-[9px] md:text-[10px] tracking-[0.25em] font-semibold uppercase whitespace-nowrap transition-all duration-300 hover:bg-black hover:text-white"
            >
              {slide.ctaLabel}
            </Link>
          </div>

          {/* Spacer to balance flex layout on desktop */}
          <div className="hidden md:block w-[200px]" />
        </div>
      </div>
    </div>
  );
}