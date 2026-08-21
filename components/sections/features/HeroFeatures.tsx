"use client";

import {
  ShieldCheck,
  Truck,
  Sparkles,
  Ruler,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Hallmarked 925 Silver",
    subtitle: "Authentic craftsmanship",
  },
  {
    icon: Truck,
    title: "Shipping",
    subtitle: "Across India",
  },
  {
    icon: Sparkles,
    title: "Custom Jewellery",
    subtitle: "Made for you",
  },
  {
    icon: Ruler,
    title: "Size Inclusive",
    subtitle: "Perfect fit for everyone",
  },
];

export default function HeroFeatures() {
  return (
    <section className="border-y border-gold/15 bg-background">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={`group flex flex-col items-center justify-center px-4 py-8 text-center transition-colors duration-300 hover:bg-warm ${
                  index !== 0 ? "md:border-l border-gold/10" : ""
                }`}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-warm transition-all duration-300 group-hover:border-gold/40 group-hover:bg-gold/5">
                  <Icon
                    size={28}
                    strokeWidth={1.5}
                    className="text-burgundy transition-colors duration-300 group-hover:text-gold"
                  />
                </div>

                <h3 className="text-burgundy text-xs font-semibold uppercase tracking-[0.18em] md:text-[13px]">
                  {feature.title}
                </h3>

                <p className="mt-2 text-[11px] leading-relaxed text-burgundy/60 md:text-xs">
                  {feature.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
