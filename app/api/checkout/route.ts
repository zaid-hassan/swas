import { NextResponse } from "next/server"
import { validateCart } from "@/lib/cart/validate-cart"
import { calculateCartTotal } from "@/lib/cart/cart-total"

export async function POST(req: Request) {

  const { cart } = await req.json()

  const validated = await validateCart(cart)

  if (validated.length === 0) {
    return NextResponse.json(
      { error: "Cart invalid" },
      { status: 400 }
    )
  }

  const totals = calculateCartTotal(validated)

  return NextResponse.json({
    items: validated,
    totals
  })
}