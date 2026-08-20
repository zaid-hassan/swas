import { getCategories } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";

/**
 * Showcase — SWAS Collections
 *
 * Editorial horizontal category strip with:
 * - SWAS burgundy / gold palette
 * - Jharokha-inspired arch proportions
 * - Minimal typography
 * - Responsive horizontal scrolling
 * - Full-bleed editorial photography
 */

export default async function Showcase() {
  const categories = await getCategories();

  return (
    <section className="w-full overflow-hidden bg-background py-16 md:py-20">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-6 md:mb-12">
          <div>
            {/* Eyebrow */}
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-7 bg-gold/70" />

              <p className="text-gold text-xs font-medium uppercase tracking-[0.35em] md:text-[15px]">
                Our Collections
              </p>
            </div>

            {/* Heading */}
            <h2
              className="text-foreground text-[32px] font-light leading-none tracking-tight sm:text-[38px] md:text-[46px]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="italic">Shop by</span>{" "}
              <span className="font-medium">Category</span>
            </h2>
          </div>

          {/* View All */}
          <Link
            href="/shop"
            className="text-foreground hover:text-gold group flex shrink-0 items-center gap-2 pb-1 text-[9px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 md:text-[10px]"
          >
            <span>View All</span>

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* ── Horizontal Collection Strip ────────────────────────────────── */}
      <div
        className="
          w-full overflow-x-auto
          scroll-smooth touch-pan-x
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          pl-5 md:pl-10
          lg:pl-[calc((100vw-1280px)/2+40px)]
        "
        style={{ scrollSnapType: "x proximity" }}
      >
        <div
          className="
            flex min-w-max items-start
            gap-6 pb-6 pr-5
            md:gap-8 md:pr-10
            lg:pr-[calc((100vw-1280px)/2+40px)]
          "
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex shrink-0 flex-col items-center outline-none"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* ── Jharokha / Arch Frame ───────────────────────────── */}
              <div className="relative p-[9px] md:p-3">
                {/* Outer Gold Ornament */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 240 350"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="
                    pointer-events-none
                    absolute inset-0
                    h-full w-full
                    text-gold
                    transition-all duration-700
                    group-hover:text-gold-warm
                  "
                >
                  {/* Main outer arch */}
                  <path
                    d="
                      M24 337
                      V96
                      C24 45 70 15 120 15
                      C170 15 216 45 216 96
                      V337
                    "
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />

                  {/* Inner architectural line */}
                  <path
                    d="
                      M34 327
                      V100
                      C34 56 74 28 120 28
                      C166 28 206 56 206 100
                      V327
                    "
                    stroke="currentColor"
                    strokeWidth="0.45"
                    opacity="0.55"
                  />

                  {/* Crown diamond */}
                  <path
                    d="M120 7 L128 17 L120 27 L112 17 Z"
                    fill="currentColor"
                  />

                  {/* Crown side details */}
                  <path
                    d="M103 17 L108 12 L113 17 L108 22 Z"
                    fill="currentColor"
                    opacity="0.65"
                  />

                  <path
                    d="M127 17 L132 12 L137 17 L132 22 Z"
                    fill="currentColor"
                    opacity="0.65"
                  />

                  {/* Side ornaments */}
                  <path
                    d="M43 88 L49 82 L55 88 L49 94 Z"
                    fill="currentColor"
                    opacity="0.7"
                  />

                  <path
                    d="M185 88 L191 82 L197 88 L191 94 Z"
                    fill="currentColor"
                    opacity="0.7"
                  />

                  {/* Bottom architectural flourish */}
                  <path
                    d="
                      M57 319
                      C76 306 99 301 120 301
                      C141 301 164 306 183 319
                    "
                    stroke="currentColor"
                    strokeWidth="0.55"
                    opacity="0.5"
                  />
                </svg>

                {/* ── Image ─────────────────────────────────────────── */}
                <div
                  className="
                    relative
                    h-[215px] w-[148px]
                    overflow-hidden
                    rounded-t-full rounded-b-[10px]
                    bg-muted
                    shadow-sm
                    transition-all duration-700
                    group-hover:shadow-xl
                    sm:h-[235px] sm:w-[162px]
                    md:h-[315px] md:w-[215px]
                    lg:h-[330px] lg:w-[225px]
                  "
                >
                  <Image
                    src={cat.image || "/placeholder-category.jpg"}
                    alt={cat.title}
                    fill
                    sizes="
                      (min-width:1024px) 225px,
                      (min-width:768px) 215px,
                      (min-width:640px) 162px,
                      148px
                    "
                    className="
                      object-cover
                      transition-transform
                      duration-[1200ms]
                      ease-[cubic-bezier(0.25,1,0.5,1)]
                      group-hover:scale-[1.045]
                    "
                  />

                  {/* Image vignette */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute inset-0
                      bg-gradient-to-t
                      from-burgundy/30
                      via-transparent
                      to-transparent
                    "
                  />

                  {/* Subtle hover wash */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute inset-0
                      bg-burgundy/10
                      opacity-0
                      transition-opacity duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* View Collection */}
                  <div
                    className="
                      absolute inset-0
                      flex items-center justify-center
                      bg-burgundy/15
                      opacity-0
                      transition-opacity duration-500
                      group-hover:opacity-100
                    "
                  >
                    <span
                      className="
                        border border-gold/70
                        bg-burgundy/60
                        px-4 py-2
                        text-[8px]
                        font-medium
                        uppercase
                        tracking-[0.25em]
                        text-gold-highlight
                        backdrop-blur-sm
                        translate-y-2
                        opacity-0
                        transition-all duration-500
                        group-hover:translate-y-0
                        group-hover:opacity-100
                        md:px-5 md:py-2.5
                        md:text-[9px]
                      "
                    >
                      View Collection
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Category Label ─────────────────────────────────── */}
              <div className="mt-4 text-center md:mt-5">
                <span
                  className="
                    text-foreground
                    group-hover:text-gold
                    block
                    text-xs
                    md:text-md
                    font-medium
                    uppercase
                    tracking-[0.25em]
                    transition-colors duration-300
                  "
                >
                  {cat.title}
                </span>

                {/* Gold marker */}
                <span
                  aria-hidden="true"
                  className="
                    mx-auto mt-2.5
                    block
                    h-[3px] w-[3px]
                    rounded-full
                    bg-gold/40
                    transition-all duration-500
                    group-hover:scale-150
                    group-hover:bg-gold
                  "
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}