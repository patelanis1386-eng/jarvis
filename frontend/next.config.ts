import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    turbo: {
      rules: {
        "*.svg": ["@svgr/webpack"],
      },
    },
  },
  webpack: (config) => {
    config.module?.rules?.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
