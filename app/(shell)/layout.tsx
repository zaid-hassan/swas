import Footer from "@/components/global/footer/Footer";
import Navbar from "@/components/global/navbar/Navbar";
import { getCategories } from "@/lib/products";
import { StickyBanner } from "@/components/ui/sticky-banner";
import React from "react";

async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  const navCategories = categories.map((category) => ({
    id: category.id,
    title: category.title,
    slug: category.slug,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* <StickyBanner
        className="bg-gold border-b border-gold/40 shadow-sm"
        hideOnScroll
      >
        <p className="mx-auto max-w-[90%] text-center text-sm font-medium tracking-[0.08em] text-burgundy md:text-[15px]">
          Visit Our Store in{" "}
          <a
            href="#"
            className="font-semibold underline-offset-4 transition-colors duration-300 hover:text-burgundy-rich hover:underline"
          >
            Ranchi, Jharkhand
          </a>
        </p>
      </StickyBanner> */}

      <Navbar categories={navCategories} />

      <main>{children}</main>

      <Footer categories={navCategories} />
    </div>
  );
}

export default Layout;