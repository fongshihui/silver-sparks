import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Prevent Turbopack from inferring the monorepo root (multiple lockfiles),
  // which can cause excessive scanning/memory usage.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
