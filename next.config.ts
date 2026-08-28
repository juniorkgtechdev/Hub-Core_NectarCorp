import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['itsolution.nectarcorp.ia.br', 'localhost:3000'],
    },
  },
};

export default nextConfig;
