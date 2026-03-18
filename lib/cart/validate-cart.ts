import { getProducts } from "@/lib/products"

export type ValidatedCartItem = {
  id: string
  name: string
  image: string
  quantity: number
  price: number
}

export async function validateCart(cartItems: any[]): Promise<ValidatedCartItem[]> {

  const products = await getProducts()

  const validated = cartItems
    .map((item) => {

      const product = products.find(
        (p) => p.slug === item.id
      )

      if (!product) return null

      return {
        id: product.slug,
        name: product.name,
        image: product.image,
        quantity: item.quantity,
        price: product.price
      }
    })
    .filter(Boolean)

  return validated as ValidatedCartItem[]
}