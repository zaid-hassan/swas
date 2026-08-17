import { getProducts } from "@/lib/products";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { AddToCartButton } from "@/components/cart/CartControls";
import ProductImageGallery from "@/components/product/ProductImageGallery";

type Props = {
  params: {
    slug: string;
  };
};

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const products = await getProducts();

  const product = products.find((p: any) => p.slug?.trim() === slug?.trim());

  if (!product) {
    return <div className="p-10 text-center">Product not found</div>;
  }
  // Related products (same category, exclude current)
  const relatedProducts = products
    .filter((p: any) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  return (
    <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
      {/* Top Section */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Image Column */}
        <div className="w-full max-w-md mx-auto md:max-w-lg">
          <ProductImageGallery
            images={
              product?.images?.length
                ? product?.images
                : product?.image
                ? [product?.image]
                : []
            }
            name={product?.name}
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col space-y-6">
          {/* Category */}
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {product?.category}
          </p>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-heading font-semibold leading-snug">
            {product?.name}
          </h1>

          {/* Price */}
          <p className="text-xl font-semibold">₹{product?.price}</p>

          {/* Divider */}
          <div className="h-px bg-neutral-200 w-full" />

          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product?.description}
          </p>

          {/* Specifications Box */}
          <div className="bg-neutral-50 rounded-xl p-5 space-y-3 text-sm">
            {product?.material && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material</span>
                <span className="font-medium">{product?.material}</span>
              </div>
            )}

            {product?.finish && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Finish</span>
                <span className="font-medium">{product?.finish}</span>
              </div>
            )}

            {product?.idealFor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ideal For</span>
                <span className="font-medium">{product?.idealFor}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {/* <Button className="flex-1 rounded-full h-11 text-sm bg-button">
          <ShoppingBag size={16} className="mr-2" />
          Add to Bag
        </Button> */}

            <AddToCartButton product={product} variant="button" />

            {/* <Button
              variant="outline"
              size="icon"
              className="rounded-full h-11 w-11"
            >
              <Heart size={16} />
            </Button> */}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 md:mt-28">
          <div className="mb-10 text-center">
            <h2 className="text-xl md:text-2xl font-heading font-semibold">
              You May Also Like
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              More from this collection
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item: any) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
