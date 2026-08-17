"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  name: string;
};

export default function ProductImageGallery({
  images,
  name,
}: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}

      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 shadow-sm">
        <Image
          key={images[active]}
          src={images[active]}
          alt={name}
          fill
          priority={active === 0}
          sizes="(max-width:768px) 100vw, 40vw"
          className="object-cover transition-opacity duration-300"
        />
      </div>

      {/* Thumbnail Slider */}

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                active === index
                  ? "border-black scale-105"
                  : "border-transparent hover:border-neutral-300"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${index + 1}`}
                fill
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}