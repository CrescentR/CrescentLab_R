import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://localhost:8091/api/:path*",
        },
        {
          source: "/f/:path*",
          destination: "http://localhost:8091/f/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
