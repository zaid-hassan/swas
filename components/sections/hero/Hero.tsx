"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* Video */}
      <div className="relative h-[72svh] min-h-[520px] max-h-[900px] w-full md:h-[88svh]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero-poster.webp"
        >
          <source src="https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4" type="video/mp4" />
        </video>

        {/* Luxury Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/55" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-6">
          <div className="text-center text-white">
            <h1
              className="flex flex-col items-center leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="text-lg font-art tracking-[0.15em] sm:text-2xl md:text-3xl">
                Heritage
              </span>

              <span className="my-2 text-4xl font-art tracking-[0.08em] text-gold sm:text-5xl md:text-6xl">
                Timeless
              </span>

              <span className="text-lg font-art tracking-[0.15em] sm:text-2xl md:text-3xl">
                Elegance
              </span>
            </h1>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">
              Scroll
            </span>
            <div className="h-8 w-[1px] bg-gradient-to-b from-white/80 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
