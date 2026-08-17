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
  const [wished, setWished] = useState(false);
  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/shop/${item.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          <img
            src={item.image || "/placeholder.webp"}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <button
            onClick={(e) => {
              e.preventDefault();
              setWished(!wished);
            }}
            className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md transition hover:scale-110"
          >
            <Heart
              size={18}
              className={
                wished ? "fill-red-500 text-red-500" : "text-neutral-700"
              }
            />
          </button>
        </div>
      </Link>

      <div className="space-y-3 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {item.category}
        </p>

        <h3 className="line-clamp-2 min-h-[48px] text-sm font-medium md:text-base">
          {item.name}
        </h3>

        <p className="text-lg font-semibold">
          {item.price ? `₹${item.price}` : "Price on Request"}
        </p>

        <Link href={`/shop/${item.slug}`}>
          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-button px-4 py-3 text-sm text-white transition hover:opacity-90">
            <ShoppingBag size={16} />
            View Product
          </button>
        </Link>
      </div>
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
