import { getCategories } from "@/lib/products";
import {
  BadgeCheck,
  Gem,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const benefits = [
  {
    title: "925 Fine Silver",
    icon: Gem,
  },
  {
    title: "6-Month Warranty",
    icon: ShieldCheck,
  },
  {
    title: "Lifetime Plating",
    icon: Sparkles,
  },
  {
    title: "Easy 15 Days Return",
    icon: RotateCcw,
  },
];

export default async function Showcase() {
  const categories = await getCategories();

  return (
    <section className="w-full overflow-hidden bg-background">
      {/* ────────────────────────────────────────────────────────────────
          CATEGORY SECTION
      ──────────────────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        {/* Header */}
        <div className="mx-auto max-w-[1280px] px-5 md:px-10">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-border pb-5 md:mb-9 md:pb-6">
            <div>
              {/* Eyebrow */}
              <div className="mb-2.5 flex items-center gap-3">
                <span className="h-px w-6 bg-gold/70 md:w-8" />

                <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-gold md:text-[11px]">
                  Our Collections
                </p>
              </div>

              {/* Heading */}
              <h2 className="font-didot text-[30px] leading-none tracking-tight text-foreground sm:text-[34px] md:text-[44px]">
                Shop by Category
              </h2>
            </div>

            <Link
              href="/shop"
              className="group flex shrink-0 items-center gap-1.5 pb-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-foreground transition-colors duration-300 hover:text-gold md:text-[10px]"
            >
              <span>View All</span>

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Category Cards */}
        <div
          className="
    w-full
    overflow-x-auto
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden
    touch-pan-x
  "
        >
          <div
            className="
      grid
      grid-flow-col
      grid-rows-2
      auto-cols-[82px]
      gap-x-5
      gap-y-6
      w-max
      px-5
      pb-2

      sm:auto-cols-[100px]
      sm:gap-x-6
      sm:gap-y-7

      md:mx-auto
      md:w-fit
      md:auto-cols-auto
      md:grid-flow-row
      md:grid-rows-none
      md:grid-cols-6
      md:gap-x-7
      md:gap-y-8
      md:px-10

      lg:grid-cols-7
      lg:gap-x-9
    "
          >
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="
          group
          flex
          w-[82px]
          flex-col
          items-center
          sm:w-[100px]
          md:w-[135px]
          lg:w-[145px]
        "
              >
                {/* Category Image */}
                <div
                  className="
            relative
            aspect-square
            w-full
            overflow-hidden
            rounded-[18px]
            bg-muted
            shadow-sm
            ring-1
            ring-border/60
            transition-all
            duration-500
            group-hover:-translate-y-1
            group-hover:shadow-lg
            group-hover:ring-gold/50
            sm:rounded-[20px]
            md:rounded-[26px]
          "
                >
                  <Image
                    src={cat.image || "/placeholder-category.jpg"}
                    alt={cat.title}
                    fill
                    sizes="
              (min-width: 1024px) 145px,
              (min-width: 768px) 135px,
              (min-width: 640px) 100px,
              82px
            "
                    className="
              object-cover
              transition-transform
              duration-700
              ease-out
              group-hover:scale-[1.05]
            "
                  />

                  {/* Hover overlay */}
                  <div
                    aria-hidden="true"
                    className="
              pointer-events-none
              absolute inset-0
              bg-burgundy/10
              opacity-0
              transition-opacity
              duration-500
              group-hover:opacity-100
            "
                  />

                  {/* Gold border */}
                  <div
                    aria-hidden="true"
                    className="
              pointer-events-none
              absolute inset-0
              rounded-[18px]
              border
              border-transparent
              transition-colors
              duration-500
              group-hover:border-gold/70
              sm:rounded-[20px]
              md:rounded-[26px]
            "
                  />
                </div>

                {/* Category Name */}
                <div className="mt-2.5 text-center md:mt-3.5">
                  <span
                    className="
              block
              text-[9px]
              font-medium
              uppercase
              leading-tight
              tracking-[0.08em]
              text-foreground
              transition-colors
              duration-300
              group-hover:text-gold
              sm:text-[10px]
              md:text-[12px]
              md:tracking-[0.15em]
            "
                  >
                    {cat.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          TRUST / BENEFITS SECTION
      ──────────────────────────────────────────────────────────────── */}
      <div className="w-full bg-gold/15">
        <div className="mx-auto grid max-w-[1280px] grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className={`
                  flex
                  min-h-[150px]
                  flex-col
                  items-center
                  justify-center
                  px-4
                  py-7
                  text-center
                  md:min-h-[180px]
                  md:px-6
                  md:py-9
                  ${index < 2
                    ? "border-b border-gold/20"
                    : "border-b border-gold/20"
                  }
                  ${index % 2 === 0
                    ? "border-r border-gold/20"
                    : ""
                  }
                  md:border-b-0
                  md:border-r
                  md:last:border-r-0
                `}
              >
                {/* Icon Circle */}
                <div
                  className="
                    mb-3.5
                    flex
                    h-[58px]
                    w-[58px]
                    items-center
                    justify-center
                    rounded-full
                    bg-background
                    shadow-sm
                    ring-1
                    ring-gold/15
                    transition-transform
                    duration-500
                    hover:scale-105
                    md:mb-4
                    md:h-[70px]
                    md:w-[70px]
                  "
                >
                  <Icon
                    strokeWidth={1.5}
                    className="
                      h-7
                      w-7
                      text-burgundy
                      md:h-8
                      md:w-8
                    "
                  />
                </div>

                {/* Benefit Title */}
                <p
                  className="
                    max-w-[130px]
                    text-[11px]
                    font-semibold
                    leading-[1.35]
                    tracking-[0.02em]
                    text-foreground
                    sm:text-xs
                    md:max-w-none
                    md:text-sm
                  "
                >
                  {benefit.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}