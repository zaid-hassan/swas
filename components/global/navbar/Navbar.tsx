"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleUser, Heart, Menu, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "@/components/search/SearchBar";
import { CartDrawer } from "@/components/cart/CartDrawer";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─── Data ───────────────────────────────────────────────────────────────── */
const megaMenu = {
  Shop: {
    columns: [
      {
        heading: "Jewellery",
        items: [
          "Anklets",
          "Earrings",
          "Bracelets",
          "Rings",
          "Chains",
          "Toe Rings",
          "Nose Pins",
        ],
      },
      {
        heading: "Sets & Special",
        items: [
          "Jewellery Sets",
          "Waist Chains",
          "Mangalsutra",
          "Pola Bangles",
        ],
      },
      {
        heading: "Home & Accessories",
        items: [
          "Accessories",
          "Utensils",
          "Murtis & Decor",
          "Sindoor Box",
          "Paan Patta Supari",
        ],
      },
    ],
  },
  Wedding: {
    columns: [
      {
        heading: "Wedding Jewellery",
        items: ["Mangalsutra", "Jewellery Sets", "Pola Bangles"],
      },
      {
        heading: "Ritual Essentials",
        items: ["Sindoor Box", "Paan Patta Supari"],
      },
    ],
  },
  Men: {
    columns: [
      { heading: "Men's Collection", items: ["Rings", "Bracelets", "Chains"] },
    ],
  },
  Custom: {
    columns: [
      {
        heading: "Custom Orders",
        items: ["Custom Jewellery", "Custom Pendants"],
      },
    ],
  },
};

const quickLinks = [
  { label: "Best Sellers", href: "/bestseller" },
  { label: "New Arrivals", href: "/newarrivals" },
  { label: "All Products", href: "/shop" },
];

const categoryLinks: Record<string, string> = {
  // Jewellery
  Anklets: "/shop?category=anklet",
  Earrings: "/shop?category=earrings",
  Bracelets: "/shop?category=bracelet",
  Rings: "/shop?category=ring",
  Chains: "/shop?category=chain",
  "Toe Rings": "/shop?category=toe-ring",
  "Nose Pins": "/shop?category=nose-pin",

  // Sets & Wedding
  Mangalsutra: "/shop?category=mangalsutra",
  "Jewellery Sets": "/shop?category=jewellery-set",
  "Waist Chains": "/shop?category=waist-chain",
  "Pola Bangles": "/shop?category=pola-bangles",
  "Sindoor Box": "/shop?category=sindoor-box",
  "Paan Patta Supari": "/shop?category=paan-patta-supari",

  // Home
  Accessories: "/shop?category=accessories",
  Utensils: "/shop?category=utensils",
  "Murtis & Decor": "/shop?category=murtis-decor",

  // Men
  "Men's Rings": "/shop?category=ring",
  "Men's Bracelets": "/shop?category=bracelet",
  "Men's Chains": "/shop?category=chain",

  // Custom
  "Custom Jewellery": "/contact",
  "Custom Pendants": "/contact",
};

/* ─── Serif CSS var shorthand ────────────────────────────────────────────── */
const H: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), Georgia, serif",
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    // Changed z-[300] to z-40 so the Sheet overlay (z-50) covers it properly
    <div className="sticky top-0 z-40 bg-white shadow-sm">
      {/* ── MAIN NAV BAR ─────────────────────────────────────────────────── */}
      <nav className="border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 h-[64px] md:h-[72px] flex items-center justify-between gap-8">
          {/* LEFT: hamburger · logo · desktop mega-nav */}
          <div className="flex items-center gap-6 md:gap-10">
            {/* MOBILE HAMBURGER */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex md:hidden flex-col justify-center gap-[5px] w-8 h-8 bg-transparent border-none cursor-pointer shrink-0 text-ink"
                >
                  <Menu strokeWidth={1.5} size={26} />
                </button>
              </SheetTrigger>

              {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
              <SheetContent
                side="left"
                className="
                  w-[85%] max-w-[340px]
                  bg-button border-none
                  px-8 pt-16 pb-10 overflow-y-auto
                  [&>button]:text-white/50 [&>button]:hover:text-white
                  z-[500] flex flex-col
                "
              >
                <SheetHeader className="mb-10 text-left">
                  <SheetTitle
                    className="text-[32px] text-[#D4AF37] tracking-[0.15em] font-medium leading-none"
                    style={H}
                  >
                    SWAS
                  </SheetTitle>
                  <SheetDescription className="text-[10px] tracking-[0.25em] uppercase text-white/40 mt-2 font-sans">
                    By Swastika · Ranchi
                  </SheetDescription>
                </SheetHeader>

                {/* Accordion mega categories */}
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(megaMenu).map(([title, menu]) => (
                    <AccordionItem
                      key={title}
                      value={title}
                      className="border-b border-white/10"
                    >
                      <AccordionTrigger
                        style={H}
                        className="
                          py-4 text-[24px] font-normal italic
                          text-white/90 hover:text-[#D4AF37] hover:no-underline
                          [&>svg]:text-[#D4AF37] [&>svg]:opacity-50
                          transition-colors
                        "
                      >
                        {title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5">
                        <div className="pl-2 flex flex-col gap-5 mt-2">
                          {menu.columns.map((col, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              <span className="text-[9px] tracking-[0.2em] uppercase text-[#D4AF37]/70 font-sans mb-1">
                                {col.heading}
                              </span>
                              {col.items.map((item) => (
                                <Link
                                  key={item}
                                  href={categoryLinks[item] || "/shop"}
                                  className="
    text-[14px]
    text-white/60
    hover:text-white
    transition-colors
    py-0.5
  "
                                >
                                  {item}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Quick links */}
                <div className="mt-8 flex flex-col gap-4">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-[#D4AF37]/70 font-sans mb-1">
                    Explore
                  </span>
                  {quickLinks.map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="text-[15px] text-white/80 hover:text-white transition-colors flex justify-between items-center"
                    >
                      {label}
                      <span className="text-[12px] text-[#D4AF37]/50">→</span>
                    </Link>
                  ))}
                </div>

                {/* Bottom WhatsApp CTA */}
                <div className="mt-auto pt-10">
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex items-center justify-center gap-2
                      w-full py-3.5 bg-white/5 border border-white/10
                      text-[11px] tracking-[0.2em] uppercase text-[#D4AF37]
                      hover:bg-[#D4AF37] hover:text-[#8B1A1A] hover:border-[#D4AF37]
                      transition-all duration-300 font-sans font-medium
                    "
                  >
                    WhatsApp Us
                  </a>
                </div>
              </SheetContent>
            </Sheet>

            {/* LOGO */}
            <Link
              href="/"
              style={H}
              className="text-[28px] md:text-[32px] tracking-[0.2em] text-ink font-semibold leading-none shrink-0 hover:text-maroon transition-colors duration-300"
            >
              SWAS
            </Link>

            {/* DESKTOP MEGA NAV (Cleaned up: Only main categories) */}
            <NavigationMenu className="hidden md:flex ml-4">
              <NavigationMenuList className="gap-2">
                {Object.entries(megaMenu).map(([title, menu]) => (
                  <NavigationMenuItem key={title}>
                    <NavigationMenuTrigger
                      className="
                        px-3 py-2
                        text-[11px] font-medium tracking-[0.18em] uppercase
                        text-ink/80 hover:text-maroon
                        bg-transparent hover:bg-transparent
                        data-[state=open]:bg-transparent data-[state=open]:text-maroon
                        transition-colors duration-300
                      "
                    >
                      {title}
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <div
                        className="p-10 bg-white border border-black/5 shadow-2xl"
                        style={{
                          width: `${Math.max(menu.columns.length, 2) * 240}px`,
                          display: "grid",
                          gridTemplateColumns: `repeat(${menu.columns.length}, 1fr)`,
                          gap: "3rem",
                        }}
                      >
                        {menu.columns.map((col, idx) => (
                          <div key={idx}>
                            <p className="mb-5 text-[10px] tracking-[0.25em] uppercase text-gold font-semibold">
                              {col.heading}
                            </p>
                            <ul className="space-y-3">
                              {col.items.map((item) => (
                                <li key={item}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={categoryLinks[item] || "/shop"}
                                      className="
    text-[13px]
    text-ink/70
    hover:text-maroon
    transition-colors
    duration-200
  "
                                    >
                                      {item}
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CENTER: search — desktop only */}
          <div className="hidden md:block flex-1 max-w-[320px]">
            <SearchBar />
          </div>

          {/* RIGHT: icons + CTA */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/account"
              aria-label="Account"
              className="w-10 h-10 flex items-center justify-center text-ink rounded-full hover:bg-black/5 transition-colors duration-300"
            >
              {loading ? (
                <div className="h-6 w-6 animate-pulse rounded-full bg-black/10" />
              ) : user ? (
                <Avatar className="h-6 w-6">
                  {user.photoURL && (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayName ?? "User"}
                    />
                  )}
                  <AvatarFallback className="text-[10px] bg-maroon text-white">
                    {user.displayName
                      ? user.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <CircleUser size={22} strokeWidth={1.2} />
              )}
            </Link>

            {/* <Link
              href="/wish"
              aria-label="Wishlist"
              className="w-10 h-10 flex items-center justify-center text-ink rounded-full hover:bg-black/5 transition-colors duration-300"
            >
              <Heart size={22} strokeWidth={1.2} />
            </Link> */}

            <div className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors duration-300">
              <CartDrawer />
            </div>

            {/* Desktop CTA (Fixed colors & border issue) */}
            <Link
              href="/shop"
              className="
                hidden lg:inline-flex ml-2
                px-6 py-2.5
                bg-button hover:bg-black
                text-white text-[10px] tracking-[0.2em] uppercase font-semibold
                transition-all duration-300 whitespace-nowrap
              "
            >
             Shop
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE SEARCH ROW ────────────────────────────────────────────── */}
      <div className="md:hidden bg-[#FCFAFA] border-b border-black/5 px-5 py-3">
        <SearchBar />
      </div>
    </div>
  );
}
