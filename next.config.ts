import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/stencil-vault",
        destination: "/stencil-vault/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
