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

    if (sectionRef.current) {
      io.observe(sectionRef.current);
    }

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
    <section
      ref={sectionRef}
      className="
        relative
        mt-4
        w-full
        overflow-hidden
        bg-background
        px-3
        py-3
        sm:px-5
        sm:py-5
        md:px-8
        md:py-8
      "
    >
      {/* Video frame */}
      <div
        className="
          relative
          mx-auto
          h-[40vh]
          w-full
          overflow-hidden
          rounded-2xl
          bg-burgundy
          sm:h-[50vh]
          sm:rounded-3xl
          md:h-[70vh]
          lg:h-[82vh]
        "
      >
        {/* Rotated video */}
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          className="
            absolute
            left-1/2
            top-1/2
            h-[100vw]
            w-[100vh]
            -translate-x-1/2
            -translate-y-1/2
            -rotate-90
            object-cover
          "
        >
          <source src={video} type="video/mp4" />
        </video>

        {/* Cinematic overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Collection information */}
        <div className="absolute bottom-6 left-6 text-left sm:bottom-8 sm:left-8 md:bottom-12 md:left-12">
          <Link href={href} className="group inline-block">
            <h2
              className="
                font-art
                text-gold
                text-[2.5rem]
                leading-[0.9]
                transition-transform
                duration-500
                group-hover:-translate-y-1
                sm:text-[4rem]
                md:text-[5.5rem]
                lg:text-[7rem]
                xl:text-[8rem]
              "
            >
              {title}
            </h2>

            <p className="mt-3 text-[9px] uppercase tracking-[0.35em] text-cream transition-colors duration-300 group-hover:text-gold-highlight sm:text-[10px]">
              Explore Collection →
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}