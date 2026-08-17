import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/lib/products";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AllProducts({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}) {
  const { page, category } = await searchParams;

  const products = await getProducts();

  let filteredProducts = products;

  if (category) {
    filteredProducts = products.filter((product: any) =>
      product?.category?.toLowerCase().includes(category.toLowerCase())
    );
  }

  const currentPage = Number(page) || 1;
  const productsPerPage = 12;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold">
          All Products
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground">
          Discover timeless silver craftsmanship
        </p>

        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {paginatedProducts.length} of {filteredProducts.length}{" "}
          products
        </p>
      </div>

      {/* Products Grid */}
      <div
        className="
        grid
        grid-cols-2
        gap-4
        sm:gap-6
        md:grid-cols-3
        lg:grid-cols-4
        "
      >
        {paginatedProducts.map((product: any) => (
          <ProductCard key={product?.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-2">
        {/* Previous */}
        <Link
          href={`?page=${currentPage - 1}${
            category ? `&category=${encodeURIComponent(category)}` : ""
          }`}
        >
          <Button variant="outline" size="sm" disabled={currentPage === 1}>
            Prev
          </Button>
        </Link>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNum = index + 1;

          return (
            <Link
              key={pageNum}
              href={`?page=${pageNum}${
                category ? `&category=${encodeURIComponent(category)}` : ""
              }`}
            >
              <Button
                size="sm"
                variant={currentPage === pageNum ? "default" : "outline"}
              >
                {pageNum}
              </Button>
            </Link>
          );
        })}

        {/* Next */}
        <Link
          href={`?page=${currentPage + 1}${
            category ? `&category=${encodeURIComponent(category)}` : ""
          }`}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </Link>
      </div>
    </section>
  );
}
