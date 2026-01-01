"use client";

import { DirectionAwareHover } from "@/components/ui/direction-aware-hover";
import React from "react";

const products = [
  {
    id: 1,
    title: "Gold Ring",
    price: "₹45,000",
    image:
      "https://images.unsplash.com/photo-1713950920412-97799efdf870?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Diamond Necklace",
    price: "₹1,20,000",
    image:
      "https://images.unsplash.com/photo-1689775707172-cceca4ce565a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Bracelet",
    price: "₹32,000",
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Earrings",
    price: "₹28,000",
    image:
      "https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?q=80&w=1200&auto=format&fit=crop",
  },
];

function Showcase() {
  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Featured Collection
          </h2>
          <p className="mt-3 text-muted-foreground">
            Handpicked designs crafted to perfection
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="aspect-3/4 w-full">
              <DirectionAwareHover imageUrl={product.image}>
                <div className="flex flex-col items-start justify-end gap-1">
                  <p className="text-lg font-semibold">{product.title}</p>
                  <p className="text-sm text-white/90">{product.price}</p>
                </div>
              </DirectionAwareHover>
              {/* <div className="h-full w-full bg-black"></div> */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Showcase;
