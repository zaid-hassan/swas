import { getProducts } from "@/lib/products";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import { AddToCartButton } from "@/components/cart/CartControls";
import { ShieldCheck, Sparkles, Truck, Award } from "lucide-react";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const products = await getProducts();

  const product = products.find((p: any) => p.slug?.trim() === slug?.trim());

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1
            className="text-burgundy text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Product Not Found
          </h1>

          <p className="text-burgundy/60 mt-4">
            The product you're looking for is unavailable.
          </p>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter((p: any) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <section className="bg-background">
        <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-16">
          {/* Main Layout */}

          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            {/* Image Gallery */}

            <div className="w-full">
              <ProductImageGallery
                images={
                  product.images?.length
                    ? product.images
                    : product.image
                    ? [product.image]
                    : []
                }
                name={product.name}
              />
            </div>

            {/* Product Info */}

            <div className="lg:sticky lg:top-28">
              <p className="text-gold text-[11px] font-medium uppercase tracking-[0.35em]">
                {product.category}
              </p>

              <h1
                className="text-burgundy mt-5 text-[34px] font-cg leading-[1.15] md:text-[48px] font-light"
              >
                {product.name}
              </h1>

              <div className="mt-8">
                <p className="text-burgundy font-cg text-3xl font-medium">
                  ₹{product.price?.toLocaleString()}
                </p>
              </div>

              <div className="mt-8 h-px bg-gold/20" />

              <div className="mt-8">
                <p className="text-burgundy/75 text-[15px] leading-8 md:text-base">
                  {product.description}
                </p>
              </div>

              {/* Feature Pills */}

              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="border border-gold/20 bg-white p-4 text-center">
                  <ShieldCheck className="text-gold mx-auto mb-2" size={22} />
                  <p className="text-burgundy text-xs uppercase tracking-[0.18em]">
                    Hallmarked
                  </p>
                </div>

                <div className="border border-gold/20 bg-white p-4 text-center">
                  <Truck className="text-gold mx-auto mb-2" size={22} />
                  <p className="text-burgundy text-xs uppercase tracking-[0.18em]">
                    Shipping
                  </p>
                </div>

                <div className="border border-gold/20 bg-white p-4 text-center">
                  <Sparkles className="text-gold mx-auto mb-2" size={22} />
                  <p className="text-burgundy text-xs uppercase tracking-[0.18em]">
                    Customisable
                  </p>
                </div>

                <div className="border border-gold/20 bg-white p-4 text-center">
                  <Award className="text-gold mx-auto mb-2" size={22} />
                  <p className="text-burgundy text-xs uppercase tracking-[0.18em]">
                    Premium Finish
                  </p>
                </div>
              </div>

              {/* Specifications */}

              <div className="mt-10 border border-gold/20 bg-white p-6">
                <h3
                  className="text-burgundy text-2xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Product Details
                </h3>

                <div className="mt-6 space-y-4 text-sm">
                  {product.material && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-burgundy/60">Material</span>
                        <span className="text-burgundy font-medium">
                          {product.material}
                        </span>
                      </div>

                      <div className="h-px bg-gold/10" />
                    </>
                  )}

                  {product.finish && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-burgundy/60">Finish</span>
                        <span className="text-burgundy font-medium">
                          {product.finish}
                        </span>
                      </div>

                      <div className="h-px bg-gold/10" />
                    </>
                  )}

                  {product.idealFor && (
                    <div className="flex justify-between">
                      <span className="text-burgundy/60">Ideal For</span>
                      <span className="text-burgundy font-medium">
                        {product.idealFor}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Actions */}

              <div className="mt-10 hidden flex-col gap-3 md:flex">
                <AddToCartButton product={product} variant="button" />

                <Button
                  variant="outline"
                  className="h-12 border-gold/30 text-burgundy hover:bg-gold/10"
                >
                  Contact for Customisation
                </Button>
              </div>
            </div>
          </div>

          {/* Related Products */}

          {relatedProducts.length > 0 && (
            <div className="mt-28 md:mt-40">
              <div className="mb-14 text-center">
                <p className="text-gold text-[10px] uppercase tracking-[0.35em]">
                  More To Explore
                </p>

                <h2
                  className="text-burgundy mt-4 text-3xl font-heading md:text-5xl"
                >
                  You May Also Like
                </h2>

                <p className="text-burgundy/60 mt-4">
                  Discover more handcrafted pieces from this collection.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
                {relatedProducts.map((item: any) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Sticky Add To Cart */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/20 bg-background p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-burgundy text-sm font-medium truncate max-w-[180px]">
              {product.name}
            </p>

            <p className="text-burgundy text-lg font-semibold">
              ₹{product.price?.toLocaleString()}
            </p>
          </div>
        </div>

        <AddToCartButton product={product} variant="button" />
      </div>

      {/* Mobile spacing so content isn't hidden behind sticky bar */}

      <div className="h-24 md:hidden" />
    </>
  );
}
