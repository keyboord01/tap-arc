import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], axes: ["opsz"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tap — programmable USDC allowances", template: "%s · Tap" },
  description:
    "Lock USDC in a vault and give family, freelancers or AI agents spending allowances with rules the contract enforces. Built on Arc.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b2a2a" },
    { media: "(prefers-color-scheme: light)", color: "#f6f9f7" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${bricolage.variable} ${hanken.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
