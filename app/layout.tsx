import type { Metadata } from "next";
// import { Playfair_Display, Inter } from "next/font/google";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

// const playfair = Playfair_Display({
//   subsets: ["latin"],
//   variable: "--font-heading",
//   display: "swap",
// });

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-body",
//   display: "swap",
// });
const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "SWAS by Swastik",
  description: "Fine handcrafted jewelry by SWAS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
