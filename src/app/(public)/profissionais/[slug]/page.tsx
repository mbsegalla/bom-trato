import { ArrowLeft, MapPin, MessageCircle, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/jsonLd';
import { siteConfig } from '@/config/site.config';
import { PublicLeadRequest } from '@/modules/leads/components/publicLeadRequest';
import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';
import {
  getPublicProfessional,
  getPublicWhatsappUrl,
  PublicDirectoryError,
} from '@/modules/publicProfiles/services/publicDirectory.service';
import type { PublicProfessional } from '@/modules/publicProfiles/types/publicProfile.types';
import { RatingSummary } from '@/modules/reviews/components/ratingSummary';
import { ReviewCard } from '@/modules/reviews/components/reviewCard';

interface ProfessionalPageProps {
  params: Promise<{ slug: string }>;
}

function professionalDescription(professional: PublicProfessional): string {
  if (professional.headline) {
    return `${professional.headline} — ${professional.name} em ${professional.city}/${professional.state}.`;
  }

  const services = professional.services
    .slice(0, 3)
    .map((service) => service.name)
    .join(', ');

  if (services) {
    return `${professional.name} em ${professional.city}/${professional.state}. Serviços: ${services}. Veja avaliações e solicite orçamento pelo Bom Trato.`;
  }

  return `Conheça ${professional.name} em ${professional.city}/${professional.state} e solicite orçamento pelo Bom Trato.`;
}

export async function generateMetadata({ params }: ProfessionalPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const professional = await getPublicProfessional(slug);
    const description = professionalDescription(professional);
    const canonical = `/profissionais/${professional.slug}`;

    return {
      title: `${professional.name} em ${professional.city}`,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        type: 'website',
        locale: siteConfig.locale,
        url: canonical,
        siteName: siteConfig.name,
        title: `${professional.name} em ${professional.city} | Bom Trato`,
        description,
      },
    };
  } catch {
    return {
      title: 'Profissional não encontrado',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function ProfessionalPage({ params }: ProfessionalPageProps) {
  const { slug } = await params;

  let professional;

  try {
    professional = await getPublicProfessional(slug);
  } catch (error: unknown) {
    if (error instanceof PublicDirectoryError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const professionalUrl = new URL(`/profissionais/${professional.slug}`, siteConfig.url).toString();

  const professionalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: professional.name,
    url: professionalUrl,
    description: professionalDescription(professional),
    image: professional.logoUrl ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: professional.city,
      addressRegion: professional.state,
      addressCountry: 'BR',
    },
    areaServed: {
      '@type': 'City',
      name: professional.city,
    },
    makesOffer:
      professional.services.length > 0
        ? professional.services.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              description: service.description ?? undefined,
            },
          }))
        : undefined,
    aggregateRating:
      professional.ratingAverage !== null && professional.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: professional.ratingAverage,
            ratingCount: professional.ratingCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Bom Trato',
        item: siteConfig.url.toString(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Profissionais',
        item: new URL('/profissionais', siteConfig.url).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: professional.name,
        item: professionalUrl,
      },
    ],
  };

  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />

      <JsonLd data={[professionalJsonLd, breadcrumbJsonLd]} />

      <main className="px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/profissionais"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar para profissionais
          </Link>

          <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <OrganizationLogo
                name={professional.name}
                logoUrl={professional.logoUrl}
                className="size-24 rounded-3xl"
              />

              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{professional.name}</h1>

                {professional.headline && <p className="mt-3 text-lg text-muted-foreground">{professional.headline}</p>}

                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {professional.city} - {professional.state}
                </p>
              </div>

              <div className="mt-4">
                <RatingSummary average={professional.ratingAverage} count={professional.ratingCount} />
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <PublicLeadRequest
                  slug={professional.slug}
                  professionalName={professional.name}
                  services={professional.services.map((service) => ({
                    id: service.id,
                    name: service.name,
                  }))}
                />

                {professional.whatsappAvailable && (
                  <a
                    href={getPublicWhatsappUrl(professional.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 font-medium transition-colors hover:bg-muted"
                  >
                    <MessageCircle className="size-5" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {professional.description && (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="text-xl font-semibold">Sobre</h2>

                <p className="mt-4 leading-relaxed whitespace-pre-line text-muted-foreground">
                  {professional.description}
                </p>
              </div>
            )}

            {professional.services.length > 0 && (
              <div className="mt-10 border-t border-border pt-8">
                <div className="flex items-center gap-2">
                  <Wrench className="size-5 text-primary" />

                  <h2 className="text-xl font-semibold">Serviços</h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {professional.services.map((service) => (
                    <article key={service.id} className="rounded-2xl bg-muted/40 p-5">
                      <h3 className="font-semibold">{service.name}</h3>

                      {service.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 border-t border-border pt-8">
              <div>
                <h2 className="text-xl font-semibold">Avaliações</h2>

                <div className="mt-2">
                  <RatingSummary average={professional.ratingAverage} count={professional.ratingCount} />
                </div>
              </div>

              {professional.reviews.length === 0 ? (
                <p className="mt-6 rounded-2xl bg-muted/40 p-5 text-sm text-muted-foreground">
                  Este profissional ainda não recebeu avaliações verificadas.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {professional.reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      reviewerDisplayName={review.reviewerDisplayName}
                      rating={review.rating}
                      comment={review.comment}
                      createdAt={review.createdAt}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
