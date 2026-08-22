"use client";

import Link from "next/link";
import { CircleUser, Menu } from "lucide-react";
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

/* ───────────────────────────────────────────────────────────── */

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
      {
        heading: "Men's Collection",
        items: ["Rings", "Bracelets", "Chains"],
      },
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
  Anklets: "/shop?category=anklet",
  Earrings: "/shop?category=earrings",
  Bracelets: "/shop?category=bracelet",
  Rings: "/shop?category=ring",
  Chains: "/shop?category=chain",
  "Toe Rings": "/shop?category=toe-ring",
  "Nose Pins": "/shop?category=nose-pin",

  Mangalsutra: "/shop?category=mangalsutra",
  "Jewellery Sets": "/shop?category=jewellery-set",
  "Waist Chains": "/shop?category=waist-chain",
  "Pola Bangles": "/shop?category=pola-bangles",

  Accessories: "/shop?category=accessories",
  Utensils: "/shop?category=utensils",
  "Murtis & Decor": "/shop?category=murtis-decor",
  "Sindoor Box": "/shop?category=sindoor-box",
  "Paan Patta Supari": "/shop?category=paan-patta-supari",

  "Custom Jewellery": "/contact",
  "Custom Pendants": "/contact",
};

const H: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
};

/* ───────────────────────────────────────────────────────────── */

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <div className="sticky top-0 z-40 border-b border-gold/15 bg-burgundy backdrop-blur-xl">
      {/* DESKTOP + MOBILE NAV */}
      <nav className="bg-burgundy">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-6 px-5 md:h-[78px] md:px-10">
          {/* LEFT */}
          <div className="flex items-center gap-5 md:gap-10">
            {/* MOBILE MENU */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-cream hover:text-gold flex h-9 w-9 items-center justify-center transition-colors md:hidden">
                  <Menu size={26} strokeWidth={1.6} />
                </button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="border-r border-gold/20 bg-burgundy px-8 pt-16 pb-10 overflow-y-auto"
              >
                <SheetHeader className="mb-10 text-left">
                  <SheetTitle
                    style={H}
                    className="text-gold text-[34px] font-semibold tracking-[0.22em]"
                  >
                    SWAS
                  </SheetTitle>

                  <SheetDescription className="text-gold-soft/60 text-[10px] uppercase tracking-[0.28em]">
                    By Swastika
                  </SheetDescription>
                </SheetHeader>

                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(megaMenu).map(([title, menu]) => (
                    <AccordionItem
                      key={title}
                      value={title}
                      className="border-b border-gold/10"
                    >
                      <AccordionTrigger
                        style={H}
                        className="text-cream hover:text-gold py-4 text-[24px] font-normal italic hover:no-underline"
                      >
                        {title}
                      </AccordionTrigger>

                      <AccordionContent className="pb-5">
                        <div className="mt-2 flex flex-col gap-5 pl-2">
                          {menu.columns.map((col, i) => (
                            <div key={i}>
                              <p className="text-gold-soft font-bold mb-2 text-md uppercase tracking-[0.25em]">
                                {col.heading}
                              </p>

                              <div className="flex flex-col gap-2">
                                {col.items.map((item) => (
                                  <Link
                                    key={item}
                                    href={categoryLinks[item] || "/shop"}
                                    className="text-cream/70 hover:text-gold text-[14px] transition-colors"
                                  >
                                    {item}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-8 flex flex-col gap-4">
                  <p className="text-gold-soft text-[9px] uppercase tracking-[0.25em]">
                    Explore
                  </p>

                  {quickLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-cream/80 hover:text-gold flex justify-between text-[15px] transition-colors"
                    >
                      {link.label}
                      <span>→</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto pt-10">
                  <a
                    href="https://wa.me/"
                    className="bg-gold text-burgundy hover:bg-gold-highlight block w-full rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.25em] transition-all"
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
              className="text-gold hover:text-gold-highlight text-[30px] font-semibold tracking-[0.22em] transition-colors md:text-[34px]"
            >
              SWAS
            </Link>

            {/* DESKTOP MENU */}
            <NavigationMenu className="ml-4 hidden md:flex">
              <NavigationMenuList className="gap-1">
                {Object.entries(megaMenu).map(([title, menu]) => (
                  <NavigationMenuItem key={title}>
                    <NavigationMenuTrigger className="text-cream/80 hover:text-gold data-[state=open]:text-gold bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.22em] hover:bg-transparent data-[state=open]:bg-transparent">
                      {title}
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <div
                        className="border-gold/15 bg-burgundy border p-10 shadow-2xl"
                        style={{
                          width: `${Math.max(menu.columns.length, 2) * 240}px`,
                          display: "grid",
                          gridTemplateColumns: `repeat(${menu.columns.length},1fr)`,
                          gap: "3rem",
                        }}
                      >
                        {menu.columns.map((col, i) => (
                          <div key={i}>
                            <p className="text-gold mb-5 text-sm font-bold uppercase tracking-[0.25em]">
                              {col.heading}
                            </p>

                            <ul className="space-y-3">
                              {col.items.map((item) => (
                                <li key={item}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={categoryLinks[item] || "/shop"}
                                      className="text-cream/70 hover:text-gold text-[13px] transition-colors"
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

          {/* SEARCH */}
          <div className="hidden max-w-[320px] flex-1 md:block">
            <div className="rounded-full border border-gold/70 bg-burgundy-rich px-2 py-0.5">
              <SearchBar />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/account"
              className="
    flex h-11 w-11 items-center justify-center
    rounded-full
    border border-gold/50
    text-cream
    transition-all duration-300
    hover:border-gold
    hover:bg-gold/10
    hover:text-gold
    hover:shadow-[0_0_12px_rgba(200,149,42,0.25)]
  "
            >
              {loading ? (
                <div className="h-6 w-6 animate-pulse rounded-full bg-gold/20" />
              ) : user ? (
                <Avatar className="h-7 w-7 border border-gold/30">
                  {user.photoURL && (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayName ?? ""}
                    />
                  )}

                  <AvatarFallback className="bg-gold text-burgundy text-[10px] font-semibold">
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
                <CircleUser size={22} strokeWidth={1.4} />
              )}
            </Link>

            <div className="text-cream hover:bg-gold/10 hover:text-gold flex h-10 w-10 items-center justify-center rounded-full transition-all">
              <CartDrawer />
            </div>

            <Link
              href="/shop"
              className="bg-gold text-burgundy hover:bg-gold-highlight ml-2 hidden rounded-full px-7 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 hover:scale-[1.02] lg:inline-flex"
            >
              Shop
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE SEARCH */}
      <div className="border-gold/10 bg-burgundy border-t px-5 py-3 md:hidden">
        <div className="rounded-full border border-gold/70 bg-burgundy-rich px-2 py-0.5">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
