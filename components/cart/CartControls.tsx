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
      id: product.slug,
      name: product.name,
      price: product.price,
      image: product.image ?? "",
    });

    toast.success("Added to cart");
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        size="icon"
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
        className="rounded-full bg-button"
      >
        <ShoppingBag size={17} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      className="w-full bg-button rounded-full gap-2"
    >
      <ShoppingBag size={17} />
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
    <div className="flex items-center rounded-md border">
      <Button variant="ghost" size="icon" onClick={() => decrease(id)}>
        <Minus size={16} />
      </Button>

      <span className="w-10 text-center text-sm font-medium">
        {item.quantity}
      </span>

      <Button variant="ghost" size="icon" onClick={() => increase(id)}>
        <Plus size={16} />
      </Button>
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
    toast.success("Item removed");
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleRemove}>
      <Trash2 size={16} />
    </Button>
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
      -top-2
      -right-2
      h-5
      min-w-5
      flex
      items-center
      justify-center
      text-xs
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
