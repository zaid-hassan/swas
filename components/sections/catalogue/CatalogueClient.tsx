"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  slug: string;
};

function CatalogCard({ item }: { item: Product }) {
  return (
    <article className="group bg-background">
      <Link href={`/shop/${item.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted md:aspect-[3/4]">
          <img
            src={item.image || "/placeholder.webp"}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />

          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Gold frame on hover */}
          <div className="absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-gold/60" />
        </div>

        {/* Content */}
        <div className="border-x border-b border-border px-2.5 py-3 md:px-4 md:py-4">
          <p className="text-gold text-[8px] uppercase tracking-[0.28em] md:text-[10px]">
            {item.category}
          </p>

          <h3 className="text-foreground mt-1.5 min-h-[38px] text-[13px] leading-5 md:mt-2 md:min-h-[42px] md:text-base">
            {item.name}
          </h3>

          <div className="mt-2.5 flex items-center justify-between md:mt-3">
            <span className="text-foreground text-[15px] font-medium md:text-lg">
              {item.price ? `₹${item.price}` : "Price on Request"}
            </span>

            <div className="text-foreground transition-colors duration-300 group-hover:text-gold">
              <ArrowUpRight size={16} className="md:h-[18px] md:w-[18px]" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function CatalogueClient({ products }: { products: Product[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = useMemo(() => {
    const categories = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...categories];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const filtered =
      activeFilter === "All"
        ? products
        : products.filter((p) => p.category === activeFilter);

    return filtered.filter((p) => p.image?.trim());
  }, [products, activeFilter]);

  return (
    <section className="bg-background py-16 md:py-20">
      {/* Header */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-10 border-b border-border pb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold/60" />
            <p className="text-gold text-[10px] uppercase tracking-[0.35em]">
              Featured
            </p>
            <div className="h-px w-8 bg-gold/60" />
          </div>

          <h2
            className="text-foreground leading-none tracking-tight"
            style={{
              fontSize: "clamp(30px,4vw,48px)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Top Styles
          </h2>

          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            Explore our most loved collections.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 md:px-5 ${
                activeFilter === filter
                  ? "border-button bg-button text-white"
                  : "border-border text-foreground hover:border-gold hover:text-gold"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Full-bleed Product Grid */}
      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 px-3 md:grid-cols-4 md:gap-6 md:px-4">
          {visibleProducts.map((product) => (
            <CatalogCard key={product.id} item={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No products found in this category.
        </div>
      )}
    </section>
  );
}
