import { ImageResponse } from "next/og";

import { logoMarkDataUri } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <img src={logoMarkDataUri} width={180} height={180} alt="" />
    ),
    size,
  );
}
