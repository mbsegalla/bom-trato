import { ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import { OrganizationLogo } from '@/modules/organizations/components/organizationLogo';
import { RatingSummary } from '@/modules/reviews/components/ratingSummary';

import { getPublicWhatsappUrl } from '../services/publicDirectory.service';
import type { PublicProfessionalCard as Professional } from '../types/publicProfile.types';

interface ProfessionalCardProps {
  professional: Professional;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <OrganizationLogo name={professional.name} logoUrl={professional.logoUrl} className="size-14 rounded-2xl" />

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{professional.name}</h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5" />
            {professional.city} - {professional.state}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <RatingSummary average={professional.ratingAverage} count={professional.ratingCount} compact />
      </div>

      <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-relaxed text-muted-foreground">
        {professional.headline ?? 'Profissional disponível no Bom Trato.'}
      </p>

      {professional.services.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {professional.services.map((service) => (
            <span key={service.id} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
              {service.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <Link
          href={`/profissionais/${professional.slug}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Ver perfil
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>

        {professional.whatsappAvailable && (
          <a
            href={getPublicWhatsappUrl(professional.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
