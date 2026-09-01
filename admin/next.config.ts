import type { NextConfig } from "next";

const backendURL = process.env.BACKEND_URL ?? "http://localhost:8091";

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
          destination: `${backendURL}/api/:path*`,
        },
        {
          source: "/f/:path*",
          destination: `${backendURL}/f/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
