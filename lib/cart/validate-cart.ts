import { getProducts } from "@/lib/products";
import type { Product } from "@/types/products";

export type ValidatedCartItem = {
  id: string;      // Product S No
  slug: string;    // URL slug
  name: string;
  image: string;
  quantity: number;
  price: number;
};

export function validateCartItems(cartItems: unknown, products: Product[]): ValidatedCartItem[] {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return [];
  const validated = cartItems.map((entry) => {
    if (typeof entry !== "object" || entry === null) return null;
    const item = entry as Record<string, unknown>;
    const product = products.find((p) => p.id === item.id || p.slug === item.slug || p.slug === item.id);
    if (!product || product.stockStatus === "out_of_stock") return null;
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) return null;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image ?? "",
      quantity,
      price: product.price,
    };
  });

  // Never silently drop unavailable items from a mixed cart at checkout.
  if (validated.some((item) => item === null)) return [];
  return validated as ValidatedCartItem[];
}

export async function validateCart(cartItems: unknown): Promise<ValidatedCartItem[]> {
  return validateCartItems(cartItems, await getProducts({ fresh: true }));
}