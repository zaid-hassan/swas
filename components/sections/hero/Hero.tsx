import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search/SearchBar";

export default function Hero() {
  return (
    <section className="w-full">
      <div className="p-4">
        <SearchBar />
      </div>
      {/* FULL WIDTH POSTER */}
      <div className="relative w-full">
        <Image
          src="/heroposter.webp"
          alt="SWAS handcrafted silver jewellery"
          width={1920}
          height={1080}
          priority
          sizes="100vw"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* TEXT BELOW (CONTAINED) */}
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-heading font-semibold leading-tight">
          Timeless Silver Craftsmanship
        </h1>

        <p className="mt-6 text-muted-foreground font-light max-w-2xl mx-auto text-sm md:text-lg">
          Discover handcrafted jewellery designed to celebrate elegance,
          tradition, and modern sophistication.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button size="lg" className="px-8 rounded-full">
              Shop Collection
            </Button>
          </Link>

          <Link href="/bestseller">
            <Button variant="outline" size="lg" className="px-8 rounded-full">
              View Best Sellers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
