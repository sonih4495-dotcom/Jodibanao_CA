import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "sonner";

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  themeColor: "#7B1C3C",
};

export const metadata: Metadata = {
  title: "JodiBanao — CA & CS Matrimonial",
  description: "The only matrimonial platform built exclusively for Chartered Accountants, Company Secretaries, and ICAI/ICSI students. Find your life partner in the CA & CS community.",
  manifest: "/manifest.json",
  openGraph: {
    title: "JodiBanao — CA & CS Matrimonial",
    description: "Find your life partner in the CA & CS professional community.",
    type: "website",
    siteName: "JodiBanao",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <Header />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
