import { getCategories, getProducts } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((item) => item.slug === slug || item.id === slug);
  if (!category) notFound();
  const filtered = products.filter((product) => product.categoryId === category.id);

  if (filtered.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight">
          {category.title}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product?.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug || item.id === slug);
  if (!category) return {};

  return {
    title: `${category.title} | SWAS Silver Jewellery`,
    description: `Explore premium handcrafted silver ${category.title} at SWAS.`,
  };
}