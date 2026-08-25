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
  const sectionRef = useRef<HTMLElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  /* ---------------------------------------------------------- */
  /* Detect when video enters/leaves viewport                    */
  /* ---------------------------------------------------------- */

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------- */
  /* Play / pause                                                */
  /* ---------------------------------------------------------- */

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    // Required for mobile autoplay
    videoElement.muted = true;
    videoElement.playsInline = true;

    if (!isVisible) {
      videoElement.pause();
      return;
    }

    let cancelled = false;

    const play = async () => {
      if (cancelled) return;

      try {
        await videoElement.play();
      } catch {
        /*
         * Autoplay can still be rejected by the browser.
         * This is not a React/TypeScript error.
         *
         * The video remains muted and inline, so browsers
         * that allow muted autoplay will start normally.
         */
      }
    };

    if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void play();
    } else {
      const handleCanPlay = () => {
        void play();
      };

      videoElement.addEventListener("canplay", handleCanPlay, {
        once: true,
      });

      return () => {
        cancelled = true;
        videoElement.removeEventListener("canplay", handleCanPlay);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [isVisible]);

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
        <video
          ref={videoRef}
          src={video}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          className="
      absolute
      inset-0
      h-full
      w-full
      object-cover
    "
        />

        {/* Overlay */}
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
