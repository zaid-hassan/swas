"use client"

import { useCartStore } from "@/lib/store/cart-store"
import Image from "next/image"
import Link from "next/link"

import {
  CartQuantityControls,
  RemoveFromCartButton,
  calculateCartSubtotal
} from "@/components/cart/CartControls"

import { CheckoutSummary } from "@/components/cart/CheckoutSummary"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = calculateCartSubtotal(items)

  if (items.length === 0) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">

        <h1 className="text-2xl font-semibold mb-4">
          Your Cart is Empty
        </h1>

        <p className="text-muted-foreground mb-6">
          Looks like you haven't added anything yet.
        </p>

        <Link href="/shop">
          <Button className="bg-button">Continue Shopping</Button>
        </Link>

      </section>
    )
  }


  return (
    <section className="max-w-7xl mx-auto px-4 py-10 lg:py-16">

      <h1 className="text-2xl md:text-3xl font-semibold mb-8">
        Shopping Cart
      </h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">

        {/* Cart Items */}
        <div className="space-y-6">

          {items.map((item) => (
            <div
              key={item.id}
              className="
              flex gap-4
              border rounded-lg
              p-4
              bg-card
              "
            >

              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden border">
                <Image
                  src={item?.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col flex-1 gap-2">

                <div className="flex justify-between">

                  <h3 className="font-medium text-sm md:text-base">
                    {item.name}
                  </h3>

                  <RemoveFromCartButton id={item.id} />

                </div>

                <p className="text-muted-foreground text-sm">
                  ₹{item.price}
                </p>

                <CartQuantityControls id={item.id} />

              </div>

            </div>
          ))}

        </div>

        {/* Checkout */}
        <CheckoutSummary subtotal={subtotal} />

      </div>

    </section>
  )
}