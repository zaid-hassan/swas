import { getProducts } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProducts();

  const filtered = products.filter((product) => {
    const categorySlug = product.category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return categorySlug === slug;
  });

  if (filtered.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight">
          {filtered[0].category}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const products = await getProducts();

  const match = products.find((product) => {
    const categorySlug = product.category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return categorySlug === slug;
  });

  if (!match) {
    return {};
  }

  return {
    title: `${match.category} | SWAS Silver Jewellery`,
    description: `Explore premium handcrafted silver ${match.category} at SWAS.`,
  };
}