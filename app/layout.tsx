import type { Metadata } from "next";
// import { Playfair_Display, Inter } from "next/font/google";
// import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

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
// const headingFont = Cormorant_Garamond({
//   subsets: ["latin"],
//   variable: "--font-heading",
//   weight: ["400", "500", "600", "700"],
//   display: "swap",
// });

// const bodyFont = Manrope({
//   subsets: ["latin"],
//   variable: "--font-body",
//   weight: ["300", "400", "500", "600"],
//   display: "swap",
// });

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
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
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
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
