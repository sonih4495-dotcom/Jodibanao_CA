"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, User, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/profile/edit", label: "Profile", icon: User },
];


export function MobileBottomNav() {
  const pathname = usePathname();

  // Only show on interior pages (not on homepage)
  const isPublic = pathname === "/" || pathname === "/login" || pathname === "/register";
  if (isPublic) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>{label}</span>
              {isActive && (
                <span className="absolute -top-0 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
