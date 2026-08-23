"use client";

import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) return;

    setSubmitted(true);
    setEmail("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-burgundy">
      {/* ─────────────────────────────────────────────
          Decorative background
      ───────────────────────────────────────────── */}

      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-gold/20"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full border border-gold/15"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full border border-gold/15"
      />

      {/* Fine editorial lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-0 h-full w-px bg-gold/10"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-0 h-full w-px bg-gold/10"
      />

      {/* ─────────────────────────────────────────────
          Header
      ───────────────────────────────────────────── */}

      <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-8 md:px-12 lg:px-16">
        <Link
          href="/"
          className="font-logo-family text-[28px] tracking-[0.2em] text-gold transition-colors duration-300 hover:text-gold-highlight sm:text-[32px]"
        >
          SWAS
        </Link>

        <div className="flex items-center gap-5">
          <span className="hidden text-[9px] font-medium uppercase tracking-[0.3em] text-burgundy/50 sm:block">
            Est. 2026
          </span>

          <span className="h-px w-8 bg-gold/40" />
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          Main
      ───────────────────────────────────────────── */}

      <section className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-5 pb-12 pt-10 sm:px-8 md:px-12 lg:px-20">
        <div className="w-full max-w-[1180px]">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            {/* LEFT — Editorial message */}

            <div className="max-w-2xl">
              <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-10 bg-gold" />

                <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-gold">
                  Something beautiful is coming
                </p>
              </div>

              <h1
                className="
                  font-logo-family
                  text-[4.5rem]
                  font-normal
                  leading-[0.82]
                  tracking-[-0.04em]
                  text-burgundy
                  sm:text-[6rem]
                  md:text-[7rem]
                  lg:text-[8rem]
                  xl:text-[9rem]
                "
              >
                Coming
                <br />
                <span className="ml-[8%] italic text-gold">
                  Soon
                </span>
              </h1>

              <div className="mt-9 max-w-md">
                <p className="font-heading-family text-xl leading-relaxed text-burgundy/80 sm:text-2xl">
                  A new expression of timeless jewellery is almost here.
                </p>

                <p className="mt-4 max-w-sm text-sm leading-7 text-burgundy/55">
                  We are carefully preparing something special for you.
                  Discover handcrafted pieces, refined details and the
                  timeless spirit of SWAS.
                </p>
              </div>

              {/* Newsletter */}

              <div className="mt-9 max-w-md">
                {!submitted ? (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <div className="flex h-12 flex-1 items-center border border-burgundy/20 bg-white/60 px-4 transition-colors duration-300 focus-within:border-gold">
                      <Mail
                        size={16}
                        strokeWidth={1.4}
                        className="mr-3 shrink-0 text-gold"
                      />

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        className="
                          w-full
                          py-2
                          md:py-0
                          bg-transparent
                          text-sm
                          text-burgundy
                          outline-none
                          placeholder:text-burgundy/40
                        "
                      />
                    </div>

                    <button
                      type="submit"
                      className="
                        group
                        flex
                        h-12
                        items-center
                        justify-center
                        gap-2
                        bg-burgundy
                        px-6
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.2em]
                        text-cream
                        transition-all
                        duration-300
                        hover:bg-burgundy-rich
                        active:scale-[0.98]
                      "
                    >
                      Notify Me
                      <ArrowUpRight
                        size={15}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  </form>
                ) : (
                  <div className="border border-gold/30 bg-gold/10 px-5 py-4">
                    <p className="text-sm font-medium text-burgundy">
                      You&apos;re on the list.
                    </p>

                    <p className="mt-1 text-xs text-burgundy/60">
                      We&apos;ll let you know when SWAS is ready.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Jewellery-inspired visual */}

            <div className="relative mx-auto w-full max-w-[440px]">
              <div className="relative aspect-[4/5]">
                {/* Outer frame */}

                <div className="absolute inset-0 border border-gold/30" />

                <div className="absolute inset-[10px] border border-gold/10" />

                {/* Arch */}

                <div
                  className="
                    absolute
                    left-[14%]
                    right-[14%]
                    top-[7%]
                    bottom-[7%]
                    overflow-hidden
                    rounded-t-[999px]
                    border
                    border-gold/25
                    bg-warm
                  "
                >
                  {/* Abstract jewellery-style composition */}

                  <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-burgundy/10" />

                  <div
                    className="
                      absolute
                      left-1/2
                      top-[40%]
                      h-44
                      w-44
                      -translate-x-1/2
                      -translate-y-1/2
                      rounded-full
                      border
                      border-gold/50
                    "
                  />

                  <div
                    className="
                      absolute
                      left-1/2
                      top-[40%]
                      h-32
                      w-32
                      -translate-x-1/2
                      -translate-y-1/2
                      rounded-full
                      border
                      border-gold/30
                    "
                  />

                  <div
                    className="
                      absolute
                      left-1/2
                      top-[40%]
                      h-20
                      w-20
                      -translate-x-1/2
                      -translate-y-1/2
                      rotate-45
                      border
                      border-gold/60
                    "
                  />

                  {/* Center stone */}

                  <div
                    className="
                      absolute
                      left-1/2
                      top-[40%]
                      h-4
                      w-4
                      -translate-x-1/2
                      -translate-y-1/2
                      rotate-45
                      bg-gold
                      shadow-[0_0_35px_rgba(216,174,94,0.45)]
                    "
                  />

                  {/* Decorative line */}

                  <div className="absolute bottom-[18%] left-1/2 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-gold/60 to-transparent" />

                  <p className="absolute bottom-[12%] left-0 right-0 text-center font-heading-family text-lg italic text-burgundy/60">
                    crafted with intention
                  </p>
                </div>

                {/* Corner details */}

                <span className="absolute left-[-3px] top-[-3px] h-8 w-8 border-l border-t border-gold" />
                <span className="absolute right-[-3px] top-[-3px] h-8 w-8 border-r border-t border-gold" />
                <span className="absolute bottom-[-3px] left-[-3px] h-8 w-8 border-b border-l border-gold" />
                <span className="absolute bottom-[-3px] right-[-3px] h-8 w-8 border-b border-r border-gold" />
              </div>

              {/* Vertical label */}

              <div className="absolute -right-8 top-1/2 hidden -translate-y-1/2 rotate-90 lg:block">
                <span className="text-[9px] font-medium uppercase tracking-[0.45em] text-burgundy/35">
                  SWAS · JEWELLERY · INDIA
                </span>
              </div>
            </div>
          </div>

          {/* Bottom details */}

          <div className="mt-16 flex flex-col gap-5 border-t border-gold/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] uppercase tracking-[0.28em] text-burgundy/40">
              Handcrafted · Timeless · SWAS
            </p>

            <div className="flex items-center gap-5">
              <a
                href="#"
                aria-label="Instagram"
                className="text-burgundy/50 transition-colors duration-300 hover:text-gold"
              >
                <Instagram size={16} strokeWidth={1.5} />
              </a>

              <span className="h-px w-8 bg-gold/30" />

              <p className="text-[9px] uppercase tracking-[0.25em] text-burgundy/40">
                Follow the journey
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}