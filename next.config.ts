import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-dd9e0f3b08484e16a1de78204af5bdb6.r2.dev',
        pathname: '/organizations/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-889c50cfeb1f4ae4a5351b90c072dd79.r2.dev',
        pathname: '/organizations/**',
      },
    ],
  },
};

export default nextConfig;
