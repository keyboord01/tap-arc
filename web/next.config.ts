import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app moved under /app when the landing page took "/". Keep old links, including shared allowance links, working.
  async redirects() {
    return [
      { source: "/spend", destination: "/app/spend", permanent: true },
      { source: "/activity", destination: "/app/activity", permanent: true },
      { source: "/a/:id", destination: "/app/a/:id", permanent: true },
    ];
  },
};

export default nextConfig;
