import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { NotConfigured } from "@/components/not-configured";
import { Providers } from "@/components/providers";
import { MobileNav, SiteHeader } from "@/components/site-header";
import { chain, tapAddress } from "@/lib/config";
import { wagmiConfig } from "@/lib/wagmi";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tap — programmable USDC allowances", template: "%s · Tap" },
  description:
    "Lock USDC in a vault and give family, freelancers or AI agents spending allowances with rules the contract enforces. Built on Arc.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16181c" },
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}>
        <Providers initialState={initialState}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-12">
            {tapAddress ? children : <NotConfigured />}
          </main>
          <footer className="hidden border-t py-6 text-center text-xs text-muted-foreground md:block">
            Tap on {chain.name}
            {tapAddress && (
              <>
                {" · "}
                <span className="font-mono">{tapAddress}</span>
              </>
            )}
          </footer>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
