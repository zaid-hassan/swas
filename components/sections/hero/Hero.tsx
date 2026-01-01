import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          {/* VIDEO */}
          <div className="relative aspect-auto max-h-screen w-full overflow-hidden rounded-xl bg-black">
            <video
              className="h-full w-full object-cover"
              src="/herovideo.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>

          {/* TEXT / CTA */}
          <div className="flex flex-col gap-6 text-center md:text-left">
            <h1 className="text-3xl font-heading font-semibold leading-tight md:text-5xl">
              Handcrafted Jewelry <br className="hidden md:block" />
              Made to Shine
            </h1>

            <p className="max-w-xl text-muted-foreground font-light">
              Discover timeless designs crafted with precision and care. Each
              piece tells a story of elegance, beauty, and tradition.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
              <a href="/shop">
                <Button size="lg" className="px-8">
                  Shop Collection
                </Button>
              </a>

              <a href="/bestseller">
                <Button variant="outline" size="lg" className="px-8">
                  View Best Sellers
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
