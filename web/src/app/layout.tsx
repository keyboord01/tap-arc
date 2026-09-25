import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import { siteDescription, siteTitle } from "@/lib/brand";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], axes: ["opsz"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Absolute URLs for Open Graph images: the production domain on Vercel, localhost otherwise.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s · Tap" },
  description: siteDescription,
  openGraph: { type: "website", siteName: "Tap", title: siteTitle, description: siteDescription, url: "/" },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b2a2a" },
    { media: "(prefers-color-scheme: light)", color: "#f6f9f7" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Font variables sit on <html> so theme variables declared on :root can resolve them.
    <html
      lang="en"
      className={`${bricolage.variable} ${hanken.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
