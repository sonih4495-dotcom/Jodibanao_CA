import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#C2185B",
};

export const metadata: Metadata = {
  title: "Jodibanao - Your Perfect Match Awaits",
  description: "A trusted matchmaking platform for South Asian users to find life partners based on compatibility, values, religion, and family background.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Jodibanao - Your Perfect Match Awaits",
    description: "A trusted matchmaking platform for South Asian families.",
    type: "website",
    siteName: "Jodibanao",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen flex flex-col">
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
