"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, SendIcon, VaultIcon } from "lucide-react";

import { ConnectButton } from "@/components/connect-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { network } from "@/lib/config";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/", label: "My vault", icon: VaultIcon },
  { href: "/spend", label: "Spend", icon: SendIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">T</span>
          Tap
        </Link>
        {network !== "mainnet" && (
          <Badge variant="warning" className="hidden sm:inline-flex">
            {network === "local" ? "Local" : "Testnet"}
          </Badge>
        )}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(pathname, item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on small screens. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs transition-colors",
              isActive(pathname, href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
