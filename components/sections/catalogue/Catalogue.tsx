"use client";

import * as React from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Product = {
  id: number;
  name: string;
  price: string;
  category: "all" | "necklace" | "bracelet" | "ring";
  image: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Diamond Necklace",
    price: "₹1,20,000",
    category: "necklace",
    image:
      "https://images.unsplash.com/photo-1689775707172-cceca4ce565a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Gold Bracelet",
    price: "₹32,000",
    category: "bracelet",
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Elegant Ring",
    price: "₹45,000",
    category: "ring",
    image:
      "https://images.unsplash.com/photo-1713950920412-97799efdf870?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Pearl Necklace",
    price: "₹68,000",
    category: "necklace",
    image:
      "https://images.unsplash.com/photo-1722510825242-0d8f2064c2e2?q=80&w=1200&auto=format&fit=crop",
  },
];

const categories = [
  { label: "All", value: "all" },
  { label: "Necklace", value: "necklace" },
  { label: "Bracelet", value: "bracelet" },
  { label: "Ring", value: "ring" },
];

export default function TopStyles() {
  return (
    <section className="w-full bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-heading font-semibold md:text-4xl">
            Top Styles
          </h2>
          <p className="mt-3 text-muted-foreground font-light">
            Explore our most loved designs
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          {/* Filters */}
          <div className="mb-10 flex justify-center">
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content */}
          {categories.map((cat) => (
            <TabsContent key={cat.value} value={cat.value}>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {products
                  .filter(
                    (p) => cat.value === "all" || p.category === cat.value
                  )
                  .map((product) => (
                    <Card key={product.id} className="border-none shadow-none">
                      <CardContent className="p-0">
                        {/* Image + Wishlist */}
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />

                          {/* Wishlist Button */}
                          <button
                            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                            aria-label="Add to wishlist"
                          >
                            <Heart size={18} className="text-gray-700" />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="mt-4 flex flex-col gap-2">
                          <h3 className="text-base font-medium">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {product.price}
                          </p>

                          {/* Add to Bag */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 flex items-center gap-2"
                          >
                            <ShoppingBag size={16} />
                            Add to Bag
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
