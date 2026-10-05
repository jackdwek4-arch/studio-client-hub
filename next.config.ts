import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint runs locally; keep Vercel builds focused on compiling.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
