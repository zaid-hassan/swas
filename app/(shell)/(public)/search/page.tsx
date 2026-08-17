import { getProducts } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts();

  const query = q?.toLowerCase() || "";

  const filtered = products.filter(
    (product) =>
      product?.name.toLowerCase().includes(query) ||
      (product?.category ?? "").toLowerCase().includes(query) ||
      (product?.material ?? "").toLowerCase().includes(query) ||
      (product?.idealFor ?? "").toLowerCase().includes(query)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-heading font-semibold mb-10">
        Search Results for "{q}"
      </h1>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <ProductCard key={product?.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
