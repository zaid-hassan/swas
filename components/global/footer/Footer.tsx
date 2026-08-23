"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gold/20 bg-burgundy text-cream">
      <div className="mx-auto max-w-[1280px] px-5 py-14 md:px-10">
        {/* TOP GRID */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* BRAND */}
          <div className="space-y-5">
            <h2
              className="text-gold font-art text-4xl tracking-[0.08em]"
            >
              SWAS
            </h2>

            <p className="text-sm leading-7 text-cream/75">
              Timeless handcrafted silver jewellery designed for elegance,
              tradition, and everyday luxury.
            </p>

            {/* SOCIAL */}
            <div className="flex gap-4 pt-2">
              {[
                { Icon: Instagram, href: "#" },
                { Icon: Facebook, href: "#" },
                { Icon: Twitter, href: "#" },
              ].map(({ Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="text-cream/70 transition hover:text-gold"
                >
                  <Icon size={19} strokeWidth={1.7} />
                </Link>
              ))}
            </div>
          </div>

          {/* SHOP */}
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Shop
            </h3>

            <ul className="space-y-3 text-sm text-cream/70">
              <li>
                <Link href="/shop" className="hover:text-gold transition">
                  All Products
                </Link>
              </li>

              <li>
                <Link
                  href="/category/mangalsutra"
                  className="hover:text-gold transition"
                >
                  Mangalsutra
                </Link>
              </li>

              <li>
                <Link
                  href="/category/earrings"
                  className="hover:text-gold transition"
                >
                  Earrings
                </Link>
              </li>

              <li>
                <Link
                  href="/category/ring"
                  className="hover:text-gold transition"
                >
                  Rings
                </Link>
              </li>

              <li>
                <Link
                  href="/bestseller"
                  className="hover:text-gold transition"
                >
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Support
            </h3>

            <ul className="space-y-3 text-sm text-cream/70">
              <li>
                <Link href="/contact" className="hover:text-gold transition">
                  Contact Us
                </Link>
              </li>

              <li>
                <Link href="/shipping" className="hover:text-gold transition">
                  Shipping Policy
                </Link>
              </li>

              <li>
                <Link href="/returns" className="hover:text-gold transition">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Company
            </h3>

            <ul className="space-y-3 text-sm text-cream/70">
              <li>
                <Link href="/about" className="hover:text-gold transition">
                  About Us
                </Link>
              </li>

              <li>
                <Link href="/privacy" className="hover:text-gold transition">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link href="/terms" className="hover:text-gold transition">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-5">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                Stay Updated
              </h3>

              <p className="mt-3 text-sm leading-7 text-cream/70">
                Get updates on new collections and exclusive offers.
              </p>
            </div>

            <form className="flex gap-2">
              <Input
                placeholder="Your email"
                className="
                  border-gold/25
                  bg-burgundy-light
                  text-cream
                  placeholder:text-cream/40
                  focus:border-gold
                  focus:ring-0
                "
              />

              <button
                type="submit"
                className="
                  bg-gold hover:bg-gold-light
                  px-5
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-burgundy
                  transition
                "
              >
                Join
              </button>
            </form>

            {/* CONTACT */}
            <div className="space-y-3 pt-2 text-sm text-cream/70">
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-gold" />
                <span>silverswas@gmail.com</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={15} className="text-gold" />
                <span>+91 98765 43210</span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={15} className="text-gold" />
                <span>Ranchi, Jharkhand, India</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-gold/20" />

        {/* BOTTOM BAR */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <p className="text-cream/60">
            © {new Date().getFullYear()} SWAS. All rights reserved.
          </p>

          <div className="flex gap-6 text-cream/70">
            <Link href="/privacy" className="hover:text-gold transition">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-gold transition">
              Terms
            </Link>

            <Link href="/returns" className="hover:text-gold transition">
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}