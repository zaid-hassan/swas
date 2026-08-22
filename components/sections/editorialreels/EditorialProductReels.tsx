"use client";

import { useEffect, useRef, useState } from "react";

const products = [
  {
    name: "Minimal Silver Ring",
    price: "₹1,499",
    video:
      "https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4",
  },
  {
    name: "Heritage Mangalsutra",
    price: "₹3,899",
    video:
      "https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4",
  },
];

function Reel({ src, play }: { src: string; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (play) ref.current.play().catch(() => {});
    else ref.current.pause();
  }, [play]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
    />
  );
}

export default function EditorialProductReels() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );

    if (sectionRef.current) io.observe(sectionRef.current);

    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-background py-20 md:py-32 overflow-hidden"
    >
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        {/* subtle diagonal guide */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="6"
              y1="86"
              x2="94"
              y2="12"
              stroke="rgba(216,174,94,.45)"
              strokeWidth="0.18"
            />
          </svg>
        </div>

        {/* ---------------- DESKTOP ---------------- */}
        <div className="relative hidden h-[560px] md:block">
          <h2
            className="text-foreground text-[32px] font-light leading-none tracking-tight sm:text-[38px] md:text-[46px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="italic">Taruni Collection</span>
          </h2>
          {/* LEFT REEL */}
          <div className="absolute left-0 top-0 w-[240px]">
            <div className="overflow-hidden rounded-[26px] shadow-[0_30px_80px_rgba(41,7,7,.12)] aspect-[9/14]">
              <Reel src={products[0].video} play={visible} />
            </div>
          </div>

          {/* LEFT TEXT */}
          <div className="absolute left-[285px] top-[55px] max-w-[260px]">
            <p className="text-gold text-[10px] uppercase tracking-[0.35em]">
              Featured
            </p>

            <h3
              className="mt-3 text-4xl text-burgundy leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {products[0].name}
            </h3>

            <p className="mt-3 text-burgundy/65 text-lg">{products[0].price}</p>
          </div>

          {/* RIGHT REEL */}
          <div className="absolute bottom-0 right-0 w-[240px]">
            <div className="overflow-hidden rounded-[26px] shadow-[0_30px_80px_rgba(41,7,7,.12)] aspect-[9/14]">
              <Reel src={products[1].video} play={visible} />
            </div>
          </div>

          {/* RIGHT TEXT */}
          <div className="absolute bottom-[70px] right-[285px] max-w-[270px] text-right">
            <p className="text-gold text-[10px] uppercase tracking-[0.35em]">
              Featured
            </p>

            <h3
              className="mt-3 text-4xl text-burgundy leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {products[1].name}
            </h3>

            <p className="mt-3 text-burgundy/65 text-lg">{products[1].price}</p>
          </div>
        </div>

        {/* ---------------- MOBILE ---------------- */}
        <div className="space-y-14 md:hidden">
          <h2
            className="text-foreground text-[32px] font-light leading-none tracking-tight sm:text-[38px] md:text-[46px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="italic">Taruni Collection</span>
          </h2>

          {/* Top composition */}
          <div className="flex items-start gap-5">
            <div className="w-[46%] overflow-hidden rounded-[22px] shadow-[0_18px_45px_rgba(41,7,7,.12)] aspect-[9/14]">
              <Reel src={products[0].video} play={visible} />
            </div>

            <div className="flex-1 pt-6">
              <p className="text-gold text-[10px] uppercase tracking-[0.32em]">
                Featured
              </p>

              <h3
                className="mt-3 text-2xl text-burgundy leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {products[0].name}
              </h3>

              <p className="mt-2 text-burgundy/65">{products[0].price}</p>
            </div>
          </div>

          {/* Bottom composition */}
          <div className="flex items-end gap-5 flex-row-reverse">
            <div className="w-[46%] overflow-hidden rounded-[22px] shadow-[0_18px_45px_rgba(41,7,7,.12)] aspect-[9/14]">
              <Reel src={products[1].video} play={visible} />
            </div>

            <div className="flex-1 pb-6 text-right">
              <p className="text-gold text-[10px] uppercase tracking-[0.32em]">
                Featured
              </p>

              <h3
                className="mt-3 text-2xl text-burgundy leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {products[1].name}
              </h3>

              <p className="mt-2 text-burgundy/65">{products[1].price}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
