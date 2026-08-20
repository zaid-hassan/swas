"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { Product } from "@/types/products";

/* -------------------------------------------------------------------------- */
/* ADD TO CART                                                                */
/* -------------------------------------------------------------------------- */

type AddToCartButtonProps = {
  product: Product;
  variant?: "icon" | "button";
};

export function AddToCartButton({
  product,
  variant = "icon",
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image ?? "",
      slug: product.slug,
    });

    toast.success("Added to your collection");
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        size="icon"
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
        className="
          h-11 w-11
          border border-burgundy
          bg-button
          text-cream
          shadow-sm
          transition-all duration-300
          hover:bg-burgundy-rich
          hover:border-gold
          active:scale-95
        "
      >
        <ShoppingBag size={18} strokeWidth={1.5} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      className="
        bg-button hover:bg-burgundy-rich
        h-12 w-full
        gap-2
        border border-burgundy
        text-cream
        text-[11px]
        font-semibold
        uppercase
        tracking-[0.18em]
        transition-all duration-300
        hover:border-gold
      "
    >
      <ShoppingBag size={18} strokeWidth={1.5} />
      Add to Cart
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* QUANTITY CONTROLS                                                          */
/* -------------------------------------------------------------------------- */

export function CartQuantityControls({ id }: { id: string }) {
  const items = useCartStore((s) => s.items);
  const increase = useCartStore((s) => s.increase);
  const decrease = useCartStore((s) => s.decrease);

  const item = items.find((i) => i.id === id);

  if (!item) return null;

  return (
    <div className="flex items-center border border-border bg-background">
      <button
        type="button"
        onClick={() => decrease(id)}
        className="
          flex h-9 w-9 items-center justify-center
          text-burgundy
          transition-colors duration-200
          hover:bg-warm
          hover:text-gold
        "
      >
        <Minus size={15} strokeWidth={1.7} />
      </button>

      <span className="text-burgundy w-10 text-center text-sm font-medium">
        {item.quantity}
      </span>

      <button
        type="button"
        onClick={() => increase(id)}
        className="
          flex h-9 w-9 items-center justify-center
          text-burgundy
          transition-colors duration-200
          hover:bg-warm
          hover:text-gold
        "
      >
        <Plus size={15} strokeWidth={1.7} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REMOVE ITEM                                                                */
/* -------------------------------------------------------------------------- */

export function RemoveFromCartButton({ id }: { id: string }) {
  const removeItem = useCartStore((s) => s.removeItem);

  function handleRemove() {
    removeItem(id);
    toast.success("Removed from your collection");
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      className="
        flex h-9 w-9 items-center justify-center
        text-burgundy/55
        transition-all duration-200
        hover:bg-warm
        hover:text-burgundy
      "
      aria-label="Remove item"
    >
      <Trash2 size={17} strokeWidth={1.6} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* CART BADGE                                                                 */
/* -------------------------------------------------------------------------- */

export function CartBadge() {
  const items = useCartStore((s) => s.items);

  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  if (!count) return null;

  return (
    <Badge
      className="
        absolute
        -right-2
        -top-2
        flex
        h-5
        min-w-5
        items-center
        justify-center
        border border-gold
        bg-gold
        px-1.5
        text-[10px]
        font-bold
        text-burgundy
        shadow-sm
      "
    >
      {count}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* CART SUBTOTAL                                                              */
/* -------------------------------------------------------------------------- */

export function calculateCartSubtotal(items: any[]) {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}