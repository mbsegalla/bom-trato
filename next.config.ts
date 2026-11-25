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

  async headers() {
    return [
      {
        source: '/acompanhar',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
