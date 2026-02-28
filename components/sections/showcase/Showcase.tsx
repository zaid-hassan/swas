import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/products";

export default async function Showcase() {
  const categories = await getCategories();

  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">

        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight">
            Shop by Category
          </h2>
          <p className="mt-3 text-muted-foreground font-light">
            Explore our handcrafted silver collections
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">

                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />

                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-medium text-lg">
                    {category.title}
                  </h3>
                </div>

              </div>
            </Link>
          ))}

        </div>
      </div>
    </section>
  );
}