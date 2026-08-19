"use client";

import { useMemo, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
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
    <article className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-2xl">
      <Link href={`/shop/${item.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          <img
            src={item.image || "/placeholder.webp"}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Luxury image fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-[#8B7355] sm:text-xs">
            {item.category}
          </p>

          <h3 className="min-h-[44px] text-center text-sm font-medium leading-6 text-neutral-900 sm:min-h-[52px] sm:text-base">
            {item.name}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
              {item.price ? `₹${item.price}` : "Price on Request"}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex w-full items-center justify-center gap-2 rounded-full bg-button px-4 py-3 text-sm font-medium text-white transition-all duration-300 group-hover:bg-black active:scale-[0.98] sm:py-3.5">
              <ShoppingBag size={18} />
              <span className="whitespace-nowrap">View Product</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function CatalogueClient({ products }: { products: Product[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Automatically create filters from product categories
  const filters = useMemo(() => {
    const categories = Array.from(new Set(products.map((p) => p.category)));

    return ["All", ...categories];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (activeFilter === "All") return products;

    return products.filter((product) => product?.category === activeFilter);
  }, [products, activeFilter]);

  const visibleProducts = useMemo(() => {
    const filtered =
      activeFilter === "All"
        ? products
        : products.filter((product) => product?.category === activeFilter);

    return filtered.filter((product) => product?.image?.trim());
  }, [products, activeFilter]);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-semibold md:text-4xl">
            Top Styles
          </h2>

          <p className="mt-3 text-muted-foreground">
            Explore our most loved collections
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-5 py-2 text-sm transition-all duration-300
                ${
                  activeFilter === filter
                    ? "bg-button text-white"
                    : "bg-white hover:bg-neutral-100"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Products */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {visibleProducts.map((product) => (
              <CatalogCard key={product?.id} item={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            No products found in this category.
          </div>
        )}
      </div>
    </section>
  );
}
