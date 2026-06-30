"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { useCartStore } from "@/lib/store/cart-store"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import CheckoutAddressSection from "@/components/checkout/CheckoutAddressSection"

type ValidatedItem = {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

export default function CheckoutPage() {

  const cart = useCartStore((s) => s.items)

  const [items, setItems] = useState<ValidatedItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  async function validateCart() {

    setLoading(true)

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cart })
    })

    const data = await res.json()

    setItems(data.items)
    setSubtotal(data.totals.subtotal)
    setShipping(data.totals.shipping)
    setTotal(data.totals.total)

    setLoading(false)
  }

  useEffect(() => {
    if (cart.length) validateCart()
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 lg:py-16">

      <h1 className="text-2xl md:text-3xl font-semibold mb-10">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-[1fr_420px] gap-10">

        {/* Shipping Form */}
        <CheckoutAddressSection />

        {/* Order Summary */}
        <Card className="h-fit">

          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

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

                <div className="flex flex-col flex-1">

                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    ₹{item.price} × {item.quantity}
                  </p>

                </div>

              </div>

            ))}

            <Separator />

            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Button
              className="w-full mt-4"
              disabled={loading}
            >
              Continue to Payment
            </Button>

          </CardContent>

        </Card>

      </div>

    </section>
  )
}