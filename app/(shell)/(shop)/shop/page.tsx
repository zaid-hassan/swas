import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/lib/products";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: {
    page?: string;
  };
};

export default async function AllProducts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  const products = await getProducts();

  const currentPage = Number(page) || 1;
  const productsPerPage = 10;

  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginatedProducts = products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-semibold">All Products</h1>
        <p className="text-muted-foreground mt-2">
          Discover timeless silver craftsmanship
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {paginatedProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-16 flex justify-center gap-2">
        {/* Previous */}
        <Link href={`?page=${currentPage - 1}`}>
          <Button variant="outline" disabled={currentPage === 1}>
            Previous
          </Button>
        </Link>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1;

          return (
            <Link key={page} href={`?page=${page}`}>
              <Button variant={currentPage === page ? "default" : "outline"}>
                {page}
              </Button>
            </Link>
          );
        })}

        {/* Next */}
        <Link href={`?page=${currentPage + 1}`}>
          <Button variant="outline" disabled={currentPage === totalPages}>
            Next
          </Button>
        </Link>
      </div>
    </section>
  );
}
