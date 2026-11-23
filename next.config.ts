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
      {
        // Lien du QR code concours — changer la destination ici pour un futur concours
        source: "/concours",
        destination: "https://www.instagram.com/p/DgDiuv0DDRd/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
