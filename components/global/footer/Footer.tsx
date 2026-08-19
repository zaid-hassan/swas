"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-muted/40 border-t mt-20">

      <div className="max-w-7xl mx-auto px-4 py-14">

        {/* TOP GRID */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">

          {/* BRAND */}
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-semibold">
              SWAS
            </h2>
            <p className="text-sm text-muted-foreground">
              Timeless handcrafted silver jewellery designed for elegance,
              tradition, and everyday luxury.
            </p>

            {/* SOCIAL */}
            <div className="flex gap-3 pt-2">
              <Instagram size={18} className="cursor-pointer hover:text-black transition" />
              <Facebook size={18} className="cursor-pointer hover:text-black transition" />
              <Twitter size={18} className="cursor-pointer hover:text-black transition" />
            </div>
          </div>

          {/* SHOP */}
          <div>
            <h3 className="font-medium mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop">All Products</Link></li>
              <li><Link href="/category/mangalsutra">Mangalsutra</Link></li>
              <li><Link href="/category/earrings">Earrings</Link></li>
              <li><Link href="/category/ring">Rings</Link></li>
              <li><Link href="/bestseller">Best Sellers</Link></li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="font-medium mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact">Contact Us</Link></li>
              {/* <li><Link href="/faq">FAQs</Link></li> */}
              <li><Link href="/shipping">Shipping Policy</Link></li>
              <li><Link href="/returns">Return Policy</Link></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-4">
            <h3 className="font-medium">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get updates on new collections and exclusive offers.
            </p>

            <div className="flex gap-2">
              <Input placeholder="Your email" />
              <Button>Join</Button>
            </div>

            {/* CONTACT */}
            <div className="space-y-2 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <Mail size={14} /> silverswas@gmail.com
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> +91 98765 43210
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} /> India
              </div>
            </div>

          </div>

        </div>

        <Separator className="my-10" />

        {/* BOTTOM BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">

          <p>© {new Date().getFullYear()} SWAS. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/returns">Returns</Link>
          </div>

        </div>

      </div>
    </footer>
  )
}