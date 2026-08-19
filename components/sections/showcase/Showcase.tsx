import { getCategories } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";

/**
 * Showcase — horizontal-scroll category strip.
 * Path: components/sections/showcase/Showcase.tsx
 *
 * Premium Archway aesthetic. Dynamically calculated padding
 * prevents sticking and aligns with the 1280px max-width header.
 */
export default async function Showcase() {
  const categories = await getCategories();

  // Soft warm off-white background to give an editorial feel
  return (
    <section className="w-full bg-[#FCFAFA] pt-16  max-md:pt-10 ">
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-10">
        <div className="flex justify-between items-end flex-wrap gap-4 mb-12 max-md:mb-8 border-b border-black/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[1px] bg-gold/60" />
              <p className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-gold font-sans font-medium">
                Our Collections
              </p>
            </div>
            <h2
              className="text-ink leading-none tracking-tight"
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontFamily: "var(--font-cormorant), Georgia, serif",
              }}
            >
              <span className="italic font-light">Shop by</span> Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="
              group flex items-center gap-2
              text-[10px] tracking-[0.2em] uppercase text-ink
              hover:text-gold transition-colors duration-300 font-sans font-medium
            "
          >
            <span>View All</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* ── Scroll strip ─────────────────────────────────────────────────── */}
      <div
        className="
          w-full overflow-x-auto
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          /* Dynamic left padding: 
            Mobile: 20px (pl-5)
            Tablet: 40px (md:pl-10)
            Desktop: Calculates center offset + 40px padding to perfectly align with header 
          */
          pl-5 md:pl-10 lg:pl-[calc((100vw-1280px)/2+40px)]
          scroll-smooth touch-pan-x
        "
        style={{ scrollSnapType: "x proximity" }}
      >
        {/* Added right padding to ensure the last card breathes */}
        <div className="flex gap-6 md:gap-8 min-w-max pb-8 pr-5 md:pr-10 lg:pr-[calc((100vw-1280px)/2+40px)]">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group shrink-0 flex flex-col items-center no-underline outline-none"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Image Container — Archway Shape */}
              <div
                className="
                relative overflow-hidden
                w-[170px] h-[250px] md:w-[260px] md:h-[380px]
                rounded-t-full rounded-b-[16px]
                shadow-sm group-hover:shadow-xl
                transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                /* Thin border that turns gold on hover */
                border border-black/5 group-hover:border-[#D4AF37]/50
              "
              >
                <Image
                  src={cat.image || "/placeholder-category.jpg"}
                  alt={cat.title}
                  fill
                  sizes="(min-width: 768px) 260px, 170px"
                  className="
                    object-cover
                    transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)]
                    group-hover:scale-110
                  "
                />

                {/* Always-on gradient to anchor the image bottom */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"
                />

                {/* Hover Overlay: Darkens and shows 'View Collection' text */}
                <div
                  className="
                    absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 ease-out pointer-events-none
                    flex items-center justify-center
                  "
                >
                  <span
                    className="
                    text-white text-[9px] md:text-[10px] tracking-[0.25em] uppercase font-sans border border-white/40 px-5 py-2
                    translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
                    transition-all duration-500 delay-100 ease-out backdrop-blur-sm
                  "
                  >
                    View Collection
                  </span>
                </div>
              </div>

              {/* Label */}
              <div className="mt-5 text-center px-2">
                <span
                  className="
                  block
                  text-[11px] md:text-[12px] tracking-[0.25em] uppercase
                  text-ink group-hover:text-gold
                  transition-colors duration-300
                  font-sans font-medium
                "
                >
                  {cat.title}
                </span>

                {/* Decorative dot below text */}
                <div className="w-[3px] h-[3px] rounded-full bg-gold/40 mx-auto mt-2.5 transition-all duration-500 group-hover:scale-150 group-hover:bg-gold" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
