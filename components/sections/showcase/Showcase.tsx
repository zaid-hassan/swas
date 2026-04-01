import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/products";

/**
 * Showcase — horizontal-scroll category strip.
 * Path: components/sections/showcase/Showcase.tsx
 *
 * Server component. Data fetched via getCategories().
 * Portrait cards (160 × 200 px) with bottom fade overlay and label below.
 * Scrollbar hidden on all browsers; first/last card flush with the container edge.
 */
export default async function Showcase() {
  const categories = await getCategories();

  return (
    <section className="w-full">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-10 max-md:px-4">
        <div className="flex justify-between items-end flex-wrap gap-3 pt-12 pb-7 max-md:pt-9 max-md:pb-5">
          <div>
            <p className="text-[10px] tracking-[0.32em] uppercase text-gold mb-2.5 font-sans font-light">
              Explore
            </p>
            <h2
              className="font-heading font-normal italic text-ink leading-none"
              style={{
                fontSize: "clamp(22px, 3vw, 36px)",
                fontFamily: "var(--font-cormorant), Georgia, serif",
              }}
            >
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="
              text-[11px] tracking-[0.16em] uppercase text-maroon
              border-b border-b-maroon pb-px
              hover:text-gold hover:border-b-gold
              transition-colors duration-200 font-sans font-light
            "
          >
            View All →
          </Link>
        </div>
      </div>

      {/* ── Scroll strip ─────────────────────────────────────────────────── */}
      {/*
        Horizontal overflow. Padding mirrors the container so cards
        align with the section header text above.
        Scroll-snapping makes touch navigation feel native.
      */}
      <div
        className="
          overflow-x-auto
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          px-10 pb-12 max-md:px-4 max-md:pb-9
          scroll-smooth
        "
        style={{ scrollSnapType: "x proximity" }}
      >
        <div className="flex gap-4 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group shrink-0 w-[160px] no-underline"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Portrait image */}
              <div className="relative w-[160px] h-[200px] overflow-hidden">
                <Image
                  src={cat.image === "" ? "/placeholder-category.jpg" : cat.image}
                  alt={cat.title}
                  fill
                  sizes="160px"
                  className="
                    object-cover
                    transition-[transform,filter] duration-[560ms] ease-out
                    group-hover:scale-[1.07] group-hover:brightness-[0.93]
                  "
                />
                {/* Bottom vignette */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, transparent 48%, rgba(42,8,8,0.52))",
                  }}
                />
              </div>

              {/* Label */}
              <span className="
                mt-2.5 block
                text-[10.5px] tracking-[0.18em] uppercase
                text-swas-grey
                group-hover:text-maroon
                transition-colors duration-200
                font-sans font-light
              ">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}