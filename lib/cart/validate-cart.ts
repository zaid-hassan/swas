import { getProducts } from "@/lib/products";

export type ValidatedCartItem = {
  id: string;      // Product S No
  slug: string;    // URL slug
  name: string;
  image: string;
  quantity: number;
  price: number;
};

export async function validateCart(
  cartItems: any[]
): Promise<ValidatedCartItem[]> {

  const products = await getProducts();

  const validated = cartItems
    .map((item) => {
      // Support both old carts (slug as id) and new carts (S No + slug)
      const product = products.find(
        (p) => p.id === item.id || p.slug === item.slug || p.slug === item.id
      );

      if (!product) {
        console.warn("Product not found:", item);
        return null;
      }

      return {
        id: product.id,         // Keep S No
        slug: product.slug,     // Keep URL slug
        name: product.name,
        image: product.image ?? "",
        quantity: item.quantity,
        price: product.price,
      };
    })
    .filter(Boolean);

  return validated as ValidatedCartItem[];
}