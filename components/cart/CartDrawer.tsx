"use client"

import Link from "next/link"
import Image from "next/image"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { ShoppingBag } from "lucide-react"

import { useCartStore } from "@/lib/store/cart-store"
import { useMounted } from "@/lib/hooks/use-mounted"

import {
  CartBadge,
  CartQuantityControls,
  RemoveFromCartButton,
  calculateCartSubtotal
} from "@/components/cart/CartControls"

export function CartDrawer() {

  const mounted = useMounted()
  const items = useCartStore((s) => s.items)

  if (!mounted) {
    return (
      <button className="relative flex items-center">
        <ShoppingBag size={22} />
      </button>
    )
  }

  const subtotal = calculateCartSubtotal(items)

  return (
    <Sheet>

      <SheetTrigger asChild>
        <button className="relative flex items-center">
          <ShoppingBag size={22} />
          <CartBadge />
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col w-full sm:max-w-md p-4">

        <h2 className="text-lg font-semibold mb-4">
          Your Cart
        </h2>

        <Separator />

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              Your cart is empty
            </p>
          )}

          {items.map((item) => (
            <div key={item.id} className="flex gap-4">

              <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col flex-1 gap-2">

                <div className="flex justify-between">
                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <RemoveFromCartButton id={item.id} />
                </div>

                <p className="text-sm text-muted-foreground">
                  ₹{item.price}
                </p>

                <CartQuantityControls id={item.id} />

              </div>

            </div>
          ))}

        </div>

        <Separator />

        {/* Footer */}
        <div className="space-y-4 pt-4">

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">
              ₹{subtotal}
            </span>
          </div>

          <div className="flex flex-col gap-y-4">

            <Link href="/cart">
              <Button className="w-full" variant="outline">
                View Cart
              </Button>
            </Link>

            <Link href="/checkout">
              <Button className="w-full">
                Checkout
              </Button>
            </Link>

          </div>

        </div>

      </SheetContent>

    </Sheet>
  )
}