import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard',
        '/customers',
        '/leads',
        '/services-catalog',
        '/quotes',
        '/work-orders',
        '/schedule',
        '/receivables',
        '/settings',
        '/onboarding',
        '/billing/return',
        '/organization-invitations',
      ],
    },
    sitemap: new URL('/sitemap.xml', siteConfig.url).toString(),
    host: siteConfig.url.origin,
  };
}
