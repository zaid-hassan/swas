"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  title: string;
  href?: string;
  video: string;
};

export default function CollectionFilm({
  title,
  href = "/shop",
  video,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );

    if (sectionRef.current) io.observe(sectionRef.current);

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (visible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [visible]);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={video}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Luxury overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      {/* Bottom-left editorial text */}
      <div className="absolute bottom-8 left-5 md:bottom-12 md:left-10 text-left">
        <Link href={href} className="group inline-block">
          <h2
            className="
              text-cream leading-[0.9]
              text-[3rem]
              sm:text-[4rem]
              md:text-[5.5rem]
              lg:text-[7rem]
              xl:text-[8rem]
              transition-transform duration-500 group-hover:-translate-y-1
              font-art
            "
            // style={{ fontFamily: "var(--font-bodoni)" }}
          >
            {title}
          </h2>

          <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-gold transition-colors duration-300 group-hover:text-gold-highlight">
            Explore Collection →
          </p>
        </Link>
      </div>
    </section>
  );
}