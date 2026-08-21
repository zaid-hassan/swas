"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  name: string;
};

export default function ProductImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  const hasMultiple = images.length > 1;

  const next = () => {
    setActive((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setActive((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-5">
      {/* Main Image */}

      <div className="group relative aspect-[4/5] overflow-hidden border border-gold/20 bg-white">
        <Image
          key={images[active]}
          src={images[active]}
          alt={name}
          fill
          priority={active === 0}
          sizes="(max-width:768px) 100vw, 55vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Image Counter */}

        {hasMultiple && (
          <div className="absolute right-4 top-4 bg-burgundy/80 border border-gold/30 px-3 py-1 backdrop-blur-sm">
            <span className="text-gold text-[11px] font-medium tracking-[0.18em]">
              {active + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Mobile Arrows */}

        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-gold/30 bg-burgundy/70 text-gold backdrop-blur-sm transition hover:bg-burgundy md:hidden"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={next}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-gold/30 bg-burgundy/70 text-gold backdrop-blur-sm transition hover:bg-burgundy md:hidden"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}

      {hasMultiple && (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {images.map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                className={`
                  group relative shrink-0 overflow-hidden border transition-all duration-300
                  h-16 w-16 md:h-22 md:w-22
                  ${
                    active === index
                      ? "border-gold shadow-[0_0_12px_rgba(200,149,42,0.18)]"
                      : "border-border hover:border-gold/50"
                  }
                `}
              >
                <Image
                  src={img}
                  alt={`${name} ${index + 1}`}
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="88px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Active Overlay */}

                {active === index && (
                  <div className="absolute inset-0 border border-gold" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}

      {hasMultiple && (
        <div className="hidden items-center justify-between border-t border-gold/10 pt-4 md:flex">
          <button
            onClick={prev}
            className="group flex items-center gap-2 text-burgundy transition hover:text-gold"
          >
            <ChevronLeft size={18} />
            <span className="text-[11px] uppercase tracking-[0.25em]">
              Previous
            </span>
          </button>

          <div className="flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActive(index)}
                className={`transition-all duration-300 ${
                  active === index
                    ? "h-[2px] w-8 bg-gold"
                    : "h-[2px] w-3 bg-gold/30 hover:bg-gold/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="group flex items-center gap-2 text-burgundy transition hover:text-gold"
          >
            <span className="text-[11px] uppercase tracking-[0.25em]">
              Next
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}