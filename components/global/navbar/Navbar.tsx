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
        items: ["Anklets","Earrings","Bracelets","Rings","Chains","Toe Rings","Nose Pins"],
      },
      {
        heading: "Sets & Special",
        items: ["Jewellery Sets","Waist Chains","Mangalsutra","Pola Bangles"],
      },
      {
        heading: "Home & Accessories",
        items: ["Accessories","Utensils","Murtis & Decor","Sindoor Box","Paan Patta Supari"],
      },
    ],
  },
  Wedding: {
    columns: [
      { heading: "Wedding Jewellery", items: ["Mangalsutra","Jewellery Sets","Pola Bangles"] },
      { heading: "Ritual Essentials", items: ["Sindoor Box","Paan Patta Supari"] },
    ],
  },
  Men: {
    columns: [
      { heading: "Men's Collection", items: ["Rings","Bracelets","Chains"] },
    ],
  },
  Custom: {
    columns: [
      { heading: "Custom Orders", items: ["Custom Jewellery","Custom Pendants"] },
    ],
  },
};

const quickLinks = [
  { label: "Best Sellers",  href: "/bestseller"  },
  { label: "New Arrivals",  href: "/newarrivals"  },
  { label: "All Products",  href: "/shop"         },
];

/* ─── Serif CSS var shorthand ────────────────────────────────────────────── */
const H: React.CSSProperties = { fontFamily: "var(--font-cormorant), Georgia, serif" };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { user, loading } = useAuth();
  const [announceDismissed, setAnnounceDismissed] = useState(false);

  return (
    <div className="sticky top-0 z-[300]">
      {/* ── MAIN NAV BAR ─────────────────────────────────────────────────── */}
      <nav className="bg border-b border-swas-border">
        <div className="max-w-[1280px] mx-auto px-10 max-md:px-4 h-[68px] max-md:h-[54px] flex items-center justify-between gap-6">

          {/* LEFT: hamburger · logo · desktop mega-nav */}
          <div className="flex items-center gap-8">

            {/* MOBILE HAMBURGER */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex md:hidden flex-col justify-center gap-[5px] w-8 h-8 bg-transparent border-none cursor-pointer shrink-0"
                >
                  {/* <span className="block w-[22px] h-[1.5px] bg-black transition-all duration-300" />
                  <span className="block w-[22px] h-[1.5px] bg-black transition-all duration-300" />
                  <span className="block w-[22px] h-[1.5px] bg-black transition-all duration-300" /> */}
                  <Menu />
                </button>
              </SheetTrigger>

              {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
              <SheetContent
                side="left"
                className="
                  w-[78%] max-w-[300px]
                  bg-[#8B1A1A] border-none
                  px-7 pt-14 pb-9 overflow-y-auto
                  [&>button]:text-white/35 [&>button]:hover:text-white/80
                  [&>button]:transition-colors
                  z-[500]
                "
              >
                <SheetHeader className="mb-8 space-y-0.5 text-left">
                  <SheetTitle
                    className="text-[30px] text-gold-light tracking-[0.18em] font-semibold leading-none"
                    style={H}
                  >
                    SWAS
                  </SheetTitle>
                  <SheetDescription className="text-[9px] tracking-[0.22em] uppercase text-white/25 font-light mt-1">
                    By Swastika · Ranchi
                  </SheetDescription>
                </SheetHeader>

                {/* Accordion mega categories */}
                <Accordion type="single" collapsible>
                  {Object.entries(megaMenu).map(([title, menu]) => (
                    <AccordionItem
                      key={title}
                      value={title}
                      className="border-b-0 border-t border-t-white/[0.06]"
                    >
                      <AccordionTrigger
                        style={H}
                        className="
                          py-[14px] text-[22px] font-normal italic
                          text-white/70 hover:text-gold-light hover:no-underline
                          [&>svg]:text-gold [&>svg]:opacity-40 [&>svg]:transition-opacity
                          hover:[&>svg]:opacity-70 transition-colors
                        "
                      >
                        {title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="pl-1 flex flex-col gap-1.5">
                          {menu.columns.flatMap((col) =>
                            col.items.map((item) => (
                              <Link
                                key={item}
                                href="#"
                                className="text-[13px] text-white/40 hover:text-gold-light transition-colors py-0.5"
                              >
                                {item}
                              </Link>
                            ))
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Quick links */}
                <div className="border-t border-white/[0.06]">
                  {quickLinks.map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      style={H}
                      className="
                        flex justify-between items-center py-[14px]
                        border-b border-white/[0.06]
                        text-[22px] italic text-white/70 hover:text-gold-light transition-colors
                      "
                    >
                      {label}
                      <span className="text-[13px] not-italic text-gold/60 font-sans">→</span>
                    </Link>
                  ))}
                </div>

                {/* Bottom WhatsApp CTA */}
                <div className="mt-8 pt-6 border-t border-white/[0.06]">
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex items-center justify-center gap-2
                      w-full py-3 bg-gold/10 border border-gold/25
                      text-[11px] tracking-[0.18em] uppercase text-gold-light
                      hover:bg-gold hover:text-maroon-deep hover:border-gold
                      transition-all duration-200 font-sans
                    "
                  >
                    WhatsApp Us →
                  </a>
                </div>
              </SheetContent>
            </Sheet>

            {/* LOGO */}
            <Link
              href="/"
              style={H}
              className="text-[26px] tracking-[0.22em] text-ink font-semibold leading-none shrink-0 hover:text-maroon transition-colors duration-200"
            >
              SWAS
            </Link>

            {/* DESKTOP MEGA NAV */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-0">
                {Object.entries(megaMenu).map(([title, menu]) => (
                  <NavigationMenuItem key={title}>
                    <NavigationMenuTrigger
                      className="
                        h-auto px-3 py-2
                        text-[11.5px] font-normal tracking-[0.14em] uppercase
                        text-swas-grey hover:text-maroon
                        bg-transparent hover:bg-transparent
                        data-[state=open]:bg-transparent data-[state=open]:text-maroon
                        data-[active]:bg-transparent
                        focus:bg-transparent
                        transition-colors duration-150
                      "
                    >
                      {title}
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <div
                        className="p-8 bg-white border border-swas-border shadow-[0_24px_64px_-12px_rgba(26,10,10,0.12)]"
                        style={{
                          width: `${Math.max(menu.columns.length, 2) * 220}px`,
                          display: "grid",
                          gridTemplateColumns: `repeat(${menu.columns.length}, 1fr)`,
                          gap: "2.5rem",
                        }}
                      >
                        {menu.columns.map((col, idx) => (
                          <div key={idx}>
                            <p className="mb-4 text-[9.5px] tracking-[0.28em] uppercase text-gold font-normal">
                              {col.heading}
                            </p>
                            <ul className="space-y-2">
                              {col.items.map((item) => (
                                <li key={item}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href="#"
                                      className="text-[13px] text-swas-grey hover:text-maroon transition-colors duration-150"
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

                {/* Flat quick links */}
                {quickLinks.map(({ label, href }) => (
                  <NavigationMenuItem key={label}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={href}
                        className="px-3 py-2 text-[11.5px] tracking-[0.14em] uppercase text-swas-grey hover:text-maroon transition-colors duration-150"
                      >
                        {label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CENTER: search — desktop only */}
          <div className="hidden md:block flex-1 max-w-[380px]">
            <SearchBar />
          </div>

          {/* RIGHT: icons + CTA */}
          <div className="flex items-center gap-0.5">

            {/* Account */}
            <Link
              href="/account"
              aria-label="Account"
              className="w-10 h-10 flex items-center justify-center text-ink rounded hover:bg-warm transition-colors duration-150"
            >
              {loading ? (
                <div className="h-[26px] w-[26px] animate-pulse rounded-full bg-swas-border" />
              ) : user ? (
                <Avatar className="h-[26px] w-[26px]">
                  {user.photoURL && (
                    <AvatarImage src={user.photoURL} alt={user.displayName ?? "User"} />
                  )}
                  <AvatarFallback className="text-[10px] bg-maroon text-white">
                    {user.displayName
                      ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <CircleUser size={19} strokeWidth={1.4} />
              )}
            </Link>

            {/* Wishlist */}
            <Link
              href="/wish"
              aria-label="Wishlist"
              className="w-10 h-10 flex items-center justify-center text-ink rounded hover:bg-warm transition-colors duration-150"
            >
              <Heart size={19} strokeWidth={1.4} />
            </Link>

            {/* Cart */}
            <div className="relative w-10 h-10 flex items-center justify-center rounded hover:bg-warm transition-colors duration-150">
              <CartDrawer />
            </div>

            {/* Desktop CTA */}
            <Link
              href="/newarrivals"
              className="
                hidden md:inline-flex ml-3
                px-5 py-2.5
                bg-maroon hover:bg-maroon-dark
                text-black text-[10.5px] tracking-[0.18em] uppercase
                rounded-[2px] whitespace-nowrap
                transition-colors duration-200 font-sans font-normal
                border hover:border-maroon-dark hover:border-2            A
              "
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE SEARCH ROW ────────────────────────────────────────────── */}
      <div className="md:hidden bg-white border-b border-swas-border px-4 py-2.5">
        <SearchBar />
      </div>
    </div>
  );
}