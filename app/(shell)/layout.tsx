import Footer from "@/components/global/footer/Footer";
import Navbar from "@/components/global/navbar/Navbar";
import { StickyBanner } from "@/components/ui/sticky-banner";
import React from "react";

function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <StickyBanner className="bg-linear-to-b from-yellow-500 to-yellow-600" hideOnScroll={true}>
        {/* Add content here if needed */}
        <p className="mx-0 max-w-[90%] text-white drop-shadow-md">
          Visit Our Store at.{" "}
          <a href="#" className="transition duration-200 hover:underline">
            Ranchi Jharkhand
          </a>
        </p>
      </StickyBanner>
      <div className="">
        <Navbar />
      </div>
      {children}
      <div className="">
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
