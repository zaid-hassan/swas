import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Playfair_Display,
  Instrument_Sans,
  Montserrat
} from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const monteserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-monteserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SWAS by Swastik",
  description: "Fine handcrafted silver jewellery by SWAS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${playfair.variable} ${instrument.variable}`}
    >
      <body className="antialiased">
        <AuthProvider>
          {children}

          <Toaster
            theme="light"
            richColors
            toastOptions={{
              style: {
                background: "var(--color-card)",
                color: "var(--color-burgundy)",
                border: "1px solid var(--color-border)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}