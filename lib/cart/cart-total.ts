import { ValidatedCartItem } from "./validate-cart"

export function calculateCartTotal(items: ValidatedCartItem[]) {

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  const shipping = subtotal > 999 ? 0 : 99

  const total = subtotal + shipping

  return {
    subtotal,
    shipping,
    total
  }
}