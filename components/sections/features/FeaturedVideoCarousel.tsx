"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

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

  /* ------------------------------------------------------------ */
  /* Video control                                                */
  /* ------------------------------------------------------------ */

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === active) {
        video
          .play()
          .catch(() => {
            // Browser may block autoplay.
          });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [active]);

  /* ------------------------------------------------------------ */
  /* Navigation                                                   */
  /* ------------------------------------------------------------ */

  const next = () => {
    setActive((prev) => (prev + 1) % products.length);
  };

  const prev = () => {
    setActive(
      (prev) => (prev - 1 + products.length) % products.length
    );
  };

  /* ------------------------------------------------------------ */
  /* Swipe handling                                               */
  /* ------------------------------------------------------------ */

  const handleSwipe = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeDistance = info.offset.x;
    const swipeVelocity = info.velocity.x;

    /*
     * Require either:
     * - a reasonably long swipe
     * - or a fast flick
     *
     * This prevents accidental navigation when simply
     * touching / dragging the card.
     */

    const distanceThreshold = 60;
    const velocityThreshold = 400;

    if (
      swipeDistance < -distanceThreshold ||
      swipeVelocity < -velocityThreshold
    ) {
      next();
      return;
    }

    if (
      swipeDistance > distanceThreshold ||
      swipeVelocity > velocityThreshold
    ) {
      prev();
    }
  };

  return (
    <section className="overflow-hidden bg-background py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">

        {/* ------------------------------------------------------ */}
        {/* Header                                                 */}
        {/* ------------------------------------------------------ */}

        <div className="mb-14 text-center">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Featured Collection
          </p>

          <h2 className="text-burgundy mt-3 text-4xl font-heading md:text-5xl">
            Crafted in Motion
          </h2>

          <p className="text-burgundy/65 mt-4 text-sm md:text-base">
            Discover our handcrafted silver pieces through moving stories.
          </p>
        </div>

        {/* ------------------------------------------------------ */}
        {/* Carousel                                               */}
        {/* ------------------------------------------------------ */}

        <div className="relative flex items-center justify-center">
          <div
            className="
              relative
              h-[500px]
              w-full
              touch-pan-y
              select-none
              md:h-[560px]
            "
          >
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

                const opacity =
                  Math.abs(offset) > 1 ? 0 : 1;

                const zIndex =
                  offset === 0 ? 20 : 10;

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
                    className="
                      absolute
                      left-1/2
                      top-0
                      w-[72vw]
                      max-w-[360px]
                      -translate-x-1/2
                      cursor-grab
                      active:cursor-grabbing
                    "
                    drag="x"
                    dragConstraints={{
                      left: 0,
                      right: 0,
                    }}
                    dragElastic={0.18}
                    onDragEnd={handleSwipe}
                  >
                    <div
                      className="
                        overflow-hidden
                        border
                        border-border
                        bg-card
                        shadow-sm
                        transition-shadow
                        duration-300
                        hover:shadow-xl
                      "
                    >
                      {/* Video */}

                      <div className="relative aspect-[4/5] bg-warm">
                        <video
                          ref={(el) => {
                            videoRefs.current[index] = el;
                          }}
                          src={VIDEO}
                          muted
                          autoPlay={index === active}
                          loop
                          playsInline
                          preload={
                            index === active
                              ? "metadata"
                              : "none"
                          }
                          draggable={false}
                          className="
                            pointer-events-none
                            h-full
                            w-full
                            object-cover
                          "
                        />

                        {/* Center play indicator */}
                        {index === active && (
                          <div
                            className="
                              pointer-events-none
                              absolute
                              bottom-4
                              right-4
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-white/40
                              bg-black/20
                              backdrop-blur-sm
                            "
                          >
                            <span className="ml-[1px] h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-white" />
                          </div>
                        )}
                      </div>

                      {/* Product info */}

                      <div className="border-t border-border p-4">
                        <h3 className="text-burgundy text-lg font-art md:text-xl">
                          {product.name}
                        </h3>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-burgundy text-base font-cg md:text-lg">
                            ₹{product.price.toLocaleString()}
                          </span>

                          <button
                            type="button"
                            className="
                              text-gold
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-[0.22em]
                              transition
                              hover:text-burgundy
                            "
                          >
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

        {/* ------------------------------------------------------ */}
        {/* Swipe indicator                                        */}
        {/* ------------------------------------------------------ */}

        <div className="mt-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {products.map((product, index) => (
              <button
                key={product.id}
                type="button"
                aria-label={`Show ${product.name}`}
                onClick={() => setActive(index)}
                className={`
                  h-[3px]
                  transition-all
                  duration-300
                  ${
                    active === index
                      ? "w-8 bg-gold"
                      : "w-3 bg-gold/30 hover:bg-gold/60"
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Mobile swipe hint */}

        <p className="mt-5 text-center text-[9px] uppercase tracking-[0.3em] text-burgundy/40 md:hidden">
          Swipe to explore
        </p>
      </div>
    </section>
  );
}