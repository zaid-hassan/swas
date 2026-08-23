"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VIDEO =
  "https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4";

const products = [
  { id: 1, name: "Minimal Silver Ring", price: 1499 },
  { id: 2, name: "Heritage Mangalsutra", price: 3899 },
  { id: 3, name: "Classic Chain", price: 2199 },
  { id: 4, name: "Silver Bracelet", price: 1799 },
  { id: 5, name: "Elegant Earrings", price: 1699 },
];

export default function FeaturedVideoCarousel() {
  const [active, setActive] = useState(2);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === active) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [active]);

  const next = () => {
    setActive((prev) => (prev + 1) % products.length);
  };

  const prev = () => {
    setActive((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <section className="overflow-hidden bg-background py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        {/* Header */}

        <div className="mb-14 text-center">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Featured Collection
          </p>

          <h2
            className="text-burgundy mt-3 text-4xl md:text-5xl font-heading"
          >
            Crafted in Motion
          </h2>

          <p className="text-burgundy/65 mt-4">
            Discover our handcrafted silver pieces through moving stories.
          </p>
        </div>

        {/* Carousel */}

        <div className="relative flex items-center justify-center ">
          <div className="relative h-[500px] w-full md:h-[560px]">
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => {
                const offset = index - active;

                const x =
                  offset === 0
                    ? 0
                    : offset === -1
                    ? -220
                    : offset === 1
                    ? 220
                    : offset < 0
                    ? -420
                    : 420;

                const scale = offset === 0 ? 1 : 0.82;
                const opacity = Math.abs(offset) > 1 ? 0 : 1;
                const zIndex = offset === 0 ? 20 : 10;

                return (
                  <motion.div
                    key={product.id}
                    initial={false}
                    animate={{
                      x,
                      scale,
                      opacity,
                      y: offset === 0 ? -18 : 20,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 24,
                    }}
                    style={{ zIndex }}
                    className="absolute left-1/2 top-0 w-[72vw] max-w-[360px] -translate-x-1/2"
                  >
                    <div className="overflow-hidden border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl">
                      {/* Video */}

                      <div className="relative aspect-[4/5] bg-warm">
                        <video
                          ref={(el) => {
                            videoRefs.current[index] = el;
                          }}
                          src={VIDEO}
                          muted
                          loop
                          playsInline
                          preload={index === active ? "metadata" : "none"}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Info */}

                      <div className="border-t border-border p-4">
                        <h3
                          className="text-burgundy text-lg md:text-xl font-art"
                        >
                          {product.name}
                        </h3>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-burgundy text-base font-cg md:text-lg">
                            ₹{product.price.toLocaleString()}
                          </span>

                          <button className="text-gold hover:text-burgundy text-[10px] font-semibold uppercase tracking-[0.22em] transition">
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}

        <div className="mt-1 flex items-center justify-center gap-6">
          <button
            onClick={prev}
            className="flex h-11 w-11 items-center justify-center border border-gold/30 text-gold transition hover:bg-gold hover:text-burgundy"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setActive(index)}
                className={`transition-all duration-300 ${
                  active === index
                    ? "h-[3px] w-8 bg-gold"
                    : "h-[3px] w-3 bg-gold/30 hover:bg-gold/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex h-11 w-11 items-center justify-center border border-gold/30 text-gold transition hover:bg-gold hover:text-burgundy"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}