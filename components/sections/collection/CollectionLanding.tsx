import ProductCard from "@/components/product/ProductCard";
import type { CollectionRecord } from "@/lib/collections";
import type { Product } from "@/types/products";

type Props = { collection: CollectionRecord; products: Product[] };

export default function CollectionLanding({ collection, products }: Props) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="relative mb-10 h-[32vh] min-h-64 overflow-hidden rounded-2xl bg-burgundy sm:h-[45vh] md:h-[55vh]">
        {collection.bannerUrl && (
          <video
            src={collection.bannerUrl}
            aria-label={`${collection.name} collection banner video`}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-6 left-6 text-left sm:bottom-9 sm:left-9 md:bottom-12 md:left-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Collection</p>
          <h1 className="mt-2 font-art text-4xl text-cream sm:text-6xl md:text-7xl">{collection.name}</h1>
        </div>
      </section>

      {products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">No products are currently available in this collection.</p>
      )}
    </main>
  );
}
