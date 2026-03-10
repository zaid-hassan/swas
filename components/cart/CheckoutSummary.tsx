"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function CheckoutSummary({ subtotal }: { subtotal: number }) {

  const shipping = subtotal > 999 ? 0 : 99
  const total = subtotal + shipping

  return (
    <Card className="h-fit">

      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? "Free" : `₹${shipping}`}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>₹{total}</span>
        </div>

        <Link href="/checkout">
          <Button className="w-full mt-4">
            Proceed to Checkout
          </Button>
        </Link>

      </CardContent>

    </Card>
  )
}