import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-30f2b2e5c76f4e62bc3b3b68a3397dba.r2.dev',
        pathname: '/organizations/**',
      },
    ],
  },
};

export default nextConfig;
