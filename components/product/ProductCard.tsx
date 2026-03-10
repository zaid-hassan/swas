"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "../cart/CartControls";
import { Product } from "@/types/products";


export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col bg-neutral-100 p-4 rounded-2xl border border-neutral-200">
      {/* Image Section */}
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-neutral-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 100vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No Image
          </div>
        )}

        {/* Wishlist Button */}
        <button
          className="
            absolute right-3 top-3
            rounded-full bg-white/90
            p-2 shadow-sm
            transition
            hover:scale-110 hover:bg-white
          "
          aria-label="Add to wishlist"
        >
          <Heart size={18} className="text-neutral-700" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-base font-medium leading-snug line-clamp-2 min-h-[44px]">
          {product.name}
        </h3>

        <p className="text-sm text-muted-foreground font-medium">
          ₹{product.price}
        </p>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Link href={`/shop/${product.slug}`} className="flex-1">
            <Button
              size="sm"
              className="w-full rounded-full text-xs tracking-wide"
            >
              View Details
            </Button>
          </Link>

          <AddToCartButton product={product} />
          {/* <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            aria-label="Add to bag"
          >
            <ShoppingBag size={16} />
          </Button> */}
        </div>
      </div>
    </div>
  );
}
