import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site.config';
import { getPublicProfessionals } from '@/modules/publicProfiles/services/publicDirectory.service';

const PROFESSIONALS_PAGE_SIZE = 100;

async function listPublicProfessionalSlugs(): Promise<string[]> {
  const slugs: string[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getPublicProfessionals({
      page,
      limit: PROFESSIONALS_PAGE_SIZE,
    });

    slugs.push(...result.items.map((professional) => professional.slug));

    hasMore = result.hasMore;
    page += 1;
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: new URL('/', siteConfig.url).toString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: new URL('/profissionais', siteConfig.url).toString(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: new URL('/termos', siteConfig.url).toString(),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    {
      url: new URL('/privacidade', siteConfig.url).toString(),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ];

  try {
    const slugs = await listPublicProfessionalSlugs();

    const professionalPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: new URL(`/profissionais/${slug}`, siteConfig.url).toString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...professionalPages];
  } catch {
    return staticPages;
  }
}
