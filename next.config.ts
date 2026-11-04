import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product photos are up to 2 MB (lib/product-form.ts), plus the form
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
