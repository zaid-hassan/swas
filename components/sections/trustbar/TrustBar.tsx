/**
 * TrustBar
 * Path: components/sections/TrustBar.tsx  (new file — add after <Hero /> in your page)
 *
 * 5 trust badges in a white strip below the hero, matching the HTML .trust-bar.
 * Server component — no interactivity needed.
 */

const badges = [
  { icon: "◈", label: "BIS Hallmarked"    },
  { icon: "◈", label: "92.5 Pure Silver"  },
  { icon: "◈", label: "Easy Returns"      },
  { icon: "◈", label: "COD Available"     },
  { icon: "◈", label: "Shipping ₹999+" },
] as const;

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-swas-border">
      <div className="max-w-[1280px] mx-auto flex">
        {badges.map((b, i) => (
          <div
            key={i}
            className={[
              "flex-1 flex items-center justify-center gap-2.5 py-4 px-3",
              "max-md:py-3",
              i < badges.length - 1 ? "border-r border-swas-border" : "",
            ].join(" ")}
          >
            <span className="text-gold text-[17px] leading-none">{b.icon}</span>
            <span className="text-[10.5px] tracking-[0.12em] uppercase text-swas-grey font-sans font-light max-md:hidden">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}