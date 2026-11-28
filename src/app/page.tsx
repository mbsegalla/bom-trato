import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JsonLd } from '@/components/jsonLd';
import { siteConfig } from '@/config/site.config';
import { MarketingAutomations } from '@/modules/marketing/components/marketingAutomations';
import { MarketingCallToAction } from '@/modules/marketing/components/marketingCallToAction';
import { MarketingFaq } from '@/modules/marketing/components/marketingFaq';
import { MarketingFeatures } from '@/modules/marketing/components/marketingFeatures';
import { MarketingFooter } from '@/modules/marketing/components/marketingFooter';
import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { MarketingHero } from '@/modules/marketing/components/marketingHero';
import { MarketingWorkflow } from '@/modules/marketing/components/marketingWorkflow';
import { PricingSectionSkeleton } from '@/modules/marketing/components/pricingSectionSkeleton';
import { ProductTour } from '@/modules/marketing/components/productTour';
import { PublicPricingSection } from '@/modules/marketing/components/publicPricingSection';
import { FeaturedProfessionalsSection } from '@/modules/publicProfiles/components/featuredProfessionalsSection';

const homeTitle = 'Bom Trato | Gestão para prestadores de serviços';

const homeDescription =
  'Gestão de clientes, orçamentos, ordens de serviço, agenda, recorrência e recebimentos. Experimente o Bom Trato por 14 dias grátis, sem cartão.';

export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: '/',
    siteName: siteConfig.name,
    title: homeTitle,
    description: homeDescription,
  },
};

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url.toString(),
    description: homeDescription,
    inLanguage: siteConfig.language,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    url: siteConfig.url.toString(),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: homeDescription,
    inLanguage: siteConfig.language,
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-60 rounded-lg bg-primary p-4 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Ir para o conteúdo
      </a>

      <MarketingHeader />

      <JsonLd data={homeJsonLd} />

      <main id="main-content" tabIndex={-1}>
        <MarketingHero />

        <MarketingFeatures />

        <MarketingWorkflow />

        <MarketingAutomations />

        <ProductTour />

        <Suspense fallback={null}>
          <FeaturedProfessionalsSection />
        </Suspense>

        <Suspense fallback={<PricingSectionSkeleton />}>
          <PublicPricingSection />
        </Suspense>

        <MarketingFaq />

        <MarketingCallToAction />
      </main>

      <MarketingFooter />
    </div>
  );
}
