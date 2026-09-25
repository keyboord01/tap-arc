import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { logoMarkDataUri, siteTitle } from "@/lib/brand";

export const alt = siteTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori needs static font files (not variable or woff2), so these come from Fontsource.
const font = (pkg: string, file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

export default async function OpenGraphImage() {
  const [display, body] = await Promise.all([
    font("bricolage-grotesque", "bricolage-grotesque-latin-700-normal.woff"),
    font("hanken-grotesk", "hanken-grotesk-latin-500-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0B2A2A",
          color: "#F3F7F5",
          fontFamily: "Hanken Grotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoMarkDataUri} width={64} height={64} alt="" />
          <span style={{ fontFamily: "Bricolage Grotesque", fontSize: 46, letterSpacing: "-0.02em" }}>Tap</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontFamily: "Bricolage Grotesque",
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              maxWidth: 900,
            }}
          >
            Spending limits for USDC, enforced by the chain.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#B5CEC8" }}>
            <div
              style={{ display: "flex", padding: "10px 20px", borderRadius: 14, background: "#123C3B", color: "#F3F7F5" }}
            >
              20 USDC every 7 days
            </div>
            <span>Built on Arc</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: display, weight: 700, style: "normal" },
        { name: "Hanken Grotesk", data: body, weight: 500, style: "normal" },
      ],
    },
  );
}
