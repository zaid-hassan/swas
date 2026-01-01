"use client";

import React, { useState } from "react";
import { Menu, X, CircleUser, Heart, ShoppingBag } from "lucide-react";

const links = [
  { name: "Shop", href: "/shop" },
  { name: "Best Seller", href: "/bestseller" },
  { name: "New Arrivals", href: "/newarrivals" },
];

const buttons = [
  { name: "Account", href: "/account", icon: <CircleUser size={22} /> },
  { name: "Wishlist", href: "/wish", icon: <Heart size={22} /> },
  { name: "Cart", href: "/cart", icon: <ShoppingBag size={22} /> },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 md:px-8">

        {/* LEFT: Hamburger (mobile) / Logo (desktop) */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>

          <a href="/" className="text-lg font-heading font-bold md:text-xl">
            <h1>SWAS</h1>
          </a>
        </div>

        {/* CENTER: LINKS (desktop only) */}
        <nav className="hidden md:flex gap-8">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-body font-light hover:text-yellow-500 transition"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* RIGHT: ICONS */}
        <div className="flex items-center gap-4">
          {buttons.map((button) => (
            <a
              key={button.name}
              href={button.href}
              className="hover:text-yellow-500 transition"
              aria-label={button.name}
            >
              {button.icon}
            </a>
          ))}
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* BACKDROP */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* SLIDE PANEL */}
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-white p-5 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            className="mb-6"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={26} />
          </button>

          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-body font-light hover:text-yellow-500"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </div>

          <hr className="my-6" />

          <div className="flex flex-col gap-4">
            {buttons.map((button) => (
              <a
                key={button.name}
                href={button.href}
                className="flex items-center gap-3 text-sm hover:text-yellow-500"
                onClick={() => setOpen(false)}
              >
                {button.icon}
                {button.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
