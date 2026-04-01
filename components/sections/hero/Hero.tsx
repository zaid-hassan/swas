"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/**
 * Hero
 * Path: components/sections/hero/Hero.tsx
 *
 * Full-bleed cinematic slider — 4 slides, auto-advance (4 s), swipe,
 * dot nav, and left/right arrows (desktop only).
 *
 * Replace `image` URLs with your own assets when ready.
 * Fonts: Cormorant Garamond (font-heading) for display, DM Sans for UI.
 */

/* ─── Slide data ─────────────────────────────────────────────────────────── */
const slides = [
  {
    image:         "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=90&w=1600&auto=format&fit=crop",
    eyebrow:       "It's Never Too Late",
    title:         "Timeless Silver\nCraftsmanship",
    offerLabel:    "Flat",
    offerValue:    "50% OFF",
    primaryLabel:  "Shop Collection",
    primaryHref:   "/shop",
    secondaryLabel:"View Best Sellers",
    secondaryHref: "/bestseller",
  },
  {
    image:         "https://images.unsplash.com/photo-1573408301185-9519f94f73f0?q=90&w=1600&auto=format&fit=crop",
    eyebrow:       "Wedding Season 2025",
    title:         "Bridal Silver\nCollection is Here",
    offerLabel:    "Up to",
    offerValue:    "30% OFF",
    primaryLabel:  "Shop Wedding",
    primaryHref:   "/shop",
    secondaryLabel:"Explore Sets",
    secondaryHref: "/shop",
  },
  {
    image:         "https://images.unsplash.com/photo-1561828995-aa79a2db86dd?q=90&w=1600&auto=format&fit=crop",
    eyebrow:       "Exclusively Yours",
    title:         "Custom Orders\nNow Open",
    offerLabel:    "BIS",
    offerValue:    "Hallmarked",
    primaryLabel:  "Get Custom Order",
    primaryHref:   "/shop",
    secondaryLabel:"Know More",
    secondaryHref: "/about",
  },
  {
    image:         "https://images.unsplash.com/photo-1689775707172-cceca4ce565a?q=90&w=1600&auto=format&fit=crop",
    eyebrow:       "New Collection",
    title:         "Choker Sets\nfor Every Bride",
    offerLabel:    "Save",
    offerValue:    "₹1,500",
    primaryLabel:  "Shop Chokers",
    primaryHref:   "/shop",
    secondaryLabel:"All Collections",
    secondaryHref: "/shop",
  },
] as const;

const TOTAL = slides.length;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Hero() {
  const [current, setCurrent]   = useState(0);
  const pointerStart             = useRef(0);
  const isDragging               = useRef(false);

  const go = useCallback((i: number) => setCurrent(((i % TOTAL) + TOTAL) % TOTAL), []);
  const advance = useCallback((dir: 1 | -1) => go(current + dir), [current, go]);

  /* Auto-advance */
  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % TOTAL), 4000);
    return () => clearInterval(id);
  }, []);

  /* Swipe handlers */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointerStart.current = e.clientX;
    isDragging.current   = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = pointerStart.current - e.clientX;
    if (Math.abs(delta) > 44) advance(delta > 0 ? 1 : -1);
  }

  return (
    <div
      className="relative overflow-hidden select-none bg-maroon-deep"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { isDragging.current = false; }}
    >
      {/* ── SLIDES ────────────────────────────────────────────────────────── */}
      <div
        className="flex"
        style={{
          transform:  `translateX(-${current * 100}%)`,
          transition: "transform 0.52s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="relative min-w-full shrink-0 overflow-hidden h-[480px] max-md:h-[240px] max-[430px]:h-[210px]"
          >
            {/* Background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Directional gradient — left-heavy dark overlay */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: "linear-gradient(105deg, rgba(42,8,8,0.82) 0%, rgba(42,8,8,0.38) 52%, rgba(42,8,8,0.08) 100%)",
              }}
            />

            {/* Slide content */}
            <div className="absolute inset-0 flex flex-col justify-center px-16 max-md:px-6 max-[430px]:px-5">

              {/* Eyebrow */}
              <p className="mb-3.5 text-[10.5px] tracking-[0.32em] uppercase text-white/55 font-sans font-light max-md:text-[9px] max-md:mb-2">
                {slide.eyebrow}
              </p>

              {/* Headline — Cormorant, generous line-height */}
              <h1
                className="font-heading font-light italic text-cream leading-[1.08] mb-5 max-md:mb-4 max-[430px]:mb-3"
                style={{ fontSize: "clamp(34px, 5.5vw, 64px)", fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {slide.title.split("\n").map((line, li) => (
                  <span key={li} className="block">{line}</span>
                ))}
              </h1>

              {/* Offer badge */}
              <div className="inline-flex items-baseline gap-2 bg-gold/85 px-4 py-1.5 mb-7 w-fit max-md:mb-5 max-md:px-3 max-md:py-1">
                <span className="text-[10px] tracking-[0.18em] uppercase text-white/80 font-sans">
                  {slide.offerLabel}
                </span>
                <span className="text-[21px] font-medium text-white leading-none max-md:text-[17px]">
                  {slide.offerValue}
                </span>
              </div>

              {/* CTA pair */}
              <div className="flex items-center gap-3 flex-wrap max-md:gap-2">
                <Link
                  href={slide.primaryHref}
                  className="
                    inline-block px-7 py-3 max-md:px-5 max-md:py-2.5
                    bg-cream text-maroon-dark
                    text-[10.5px] tracking-[0.2em] uppercase font-sans font-medium
                    transition-all duration-250
                    hover:bg-gold hover:text-white
                  "
                >
                  {slide.primaryLabel}
                </Link>
                <Link
                  href={slide.secondaryHref}
                  className="
                    inline-block px-7 py-3 max-md:px-5 max-md:py-2.5
                    bg-transparent text-cream/90
                    border border-white/35
                    text-[10.5px] tracking-[0.2em] uppercase font-sans font-light
                    transition-all duration-250
                    hover:border-gold-light hover:text-gold-light
                  "
                >
                  {slide.secondaryLabel}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DOTS ──────────────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
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
            className={[
              "h-[5px] p-0 border-none cursor-pointer rounded-full transition-all duration-350",
              i === current
                ? "w-[22px] bg-white"
                : "w-[5px] bg-white/35 hover:bg-white/60",
            ].join(" ")}
          />
        ))}
      </div>

      {/* ── ARROWS — desktop only ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-y-0 w-full flex items-center justify-between px-4 pointer-events-none max-md:hidden"
      >
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => advance(dir)}
            className="
              pointer-events-auto
              w-11 h-11 flex items-center justify-center
              border border-white/25 bg-black/18
              text-white text-[15px]
              backdrop-blur-[3px]
              transition-all duration-200
              hover:bg-gold/65 hover:border-gold
              cursor-pointer
            "
          >
            {dir === -1 ? "←" : "→"}
          </button>
        ))}
      </div>
    </div>
  );
}