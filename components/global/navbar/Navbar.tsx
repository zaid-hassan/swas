"use client";

import Link from "next/link";
import { CircleUser, Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

import { Button } from "@/components/ui/button";

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

export default function Navbar() {
  const { user, loading } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          {/* MOBILE MENU */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <span className="sr-only">Open Menu</span>☰
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="
    w-[85%]
    max-w-95
    bg-white
    px-8
    py-10
    overflow-y-auto
    border-r border-neutral-100
    shadow-[20px_0_60px_-20px_rgba(0,0,0,0.25)]
  "
            >
              <SheetHeader className="space-y-2">
                <SheetTitle className="font-heading text-xl tracking-wide">
                  SWAS
                </SheetTitle>
                <SheetDescription className="text-sm text-neutral-500">
                  Explore timeless collections
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6">
                <Accordion type="single" collapsible className="mt-8 space-y-6">
                  {Object.entries(megaMenu).map(([title, menu]) => (
                    <AccordionItem
                      key={title}
                      value={title}
                      className="border-b border-neutral-100"
                    >
                      <AccordionTrigger
                        className="
          text-base
          font-medium
          tracking-wide
          hover:no-underline
        "
                      >
                        {title}
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="mt-4 space-y-3 pl-2 text-sm text-neutral-600">
                          {menu.columns.map((col) =>
                            col.items.map((item) => (
                              <Link
                                key={item}
                                href="#"
                                className="
                  block
                  py-1
                  transition
                  hover:text-black
                "
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

                <div className="mt-6 space-y-3 border-t pt-6">
                  <Link href="/bestseller" className="block font-medium">
                    Best Seller
                  </Link>
                  <Link href="/newarrivals" className="block font-medium">
                    New Arrivals
                  </Link>
                  <Link href="/shop" className="block font-medium">
                    All Products
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* LOGO */}
          <Link href="/" className="text-xl font-heading font-bold">
            SWAS
          </Link>
        </div>

        {/* DESKTOP MEGA NAV */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {Object.entries(megaMenu).map(([title, menu]) => (
              <NavigationMenuItem key={title}>
                <NavigationMenuTrigger className="font-body font-light">
                  {title}
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <div
                    className="
      w-[900px]
      p-10
      grid grid-cols-3 gap-12
      bg-white
      rounded-2xl
      shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]
      border border-neutral-100
      animate-in fade-in-0 zoom-in-95
      duration-200
  "
                  >
                    {menu.columns.map((col, idx) => (
                      <div key={idx}>
                        <h4
                          className="
          mb-6
          text-sm
          tracking-wider
          uppercase
          text-neutral-500
        "
                        >
                          {col.heading}
                        </h4>

                        <ul className="space-y-3 text-sm">
                          {col.items.map((item) => (
                            <li key={item}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href="#"
                                  className="
                    relative
                    text-neutral-700
                    transition
                    hover:text-black
                    after:absolute
                    after:left-0
                    after:-bottom-1
                    after:h-[1px]
                    after:w-0
                    after:bg-black
                    after:transition-all
                    hover:after:w-full
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

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/bestseller"
                  className="px-4 py-2 text-sm font-body font-light"
                >
                  Best Seller
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/newarrivals"
                  className="px-4 py-2 text-sm font-body font-light"
                >
                  New Arrivals
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/shop"
                  className="px-4 py-2 text-sm font-body font-light"
                >
                  All Products
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-4">
          <Link href="/account" className="flex items-center">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <Avatar className="h-8 w-8">
                {user.photoURL ? (
                  <AvatarImage
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                  />
                ) : null}
                <AvatarFallback>
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
              <CircleUser size={22} />
            )}
          </Link>
          <Link href="/wish">
            <Heart size={22} />
          </Link>
          <Link href="/cart">
            <ShoppingBag size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
