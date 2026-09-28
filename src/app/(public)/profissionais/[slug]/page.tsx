import { ArrowLeft, MapPin, MessageCircle, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';
import {
  getPublicProfessional,
  getPublicWhatsappUrl,
  PublicDirectoryError,
} from '@/modules/publicProfiles/services/publicDirectory.service';

interface ProfessionalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfessionalPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const professional = await getPublicProfessional(slug);

    return {
      title: professional.name,
      description: professional.headline ?? `Conheça ${professional.name} no Bom Trato.`,
    };
  } catch {
    return {
      title: 'Profissional',
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

  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />

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

              {professional.whatsappAvailable && (
                <a
                  href={getPublicWhatsappUrl(professional.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <MessageCircle className="size-5" />
                  Falar no WhatsApp
                </a>
              )}
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
          </section>
        </div>
      </main>
    </div>
  );
}
