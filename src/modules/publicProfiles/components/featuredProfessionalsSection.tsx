import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { getPublicProfessionals } from '../services/publicDirectory.service';
import { ProfessionalCard } from './professionalCard';

export async function FeaturedProfessionalsSection() {
  const page = await getPublicProfessionals({
    page: 1,
    limit: 6,
  }).catch(() => null);

  if (!page || page.items.length === 0) {
    return null;
  }

  return (
    <section
      id="professionals"
      className="scroll-mt-24 border-y border-border bg-muted/20 px-6 py-12 sm:py-16 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Além da gestão</p>

            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Seu trabalho também pode ganhar visibilidade.
            </h2>

            <p className="mt-4 leading-relaxed text-muted-foreground">
              A vitrine do Bom Trato ajuda clientes a conhecer profissionais, seus serviços e avaliações verificadas de
              atendimentos realizados pela plataforma.
            </p>
          </div>

          <Link
            href="/profissionais"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Explorar profissionais
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((professional) => (
            <ProfessionalCard key={professional.slug} professional={professional} />
          ))}
        </div>
      </div>
    </section>
  );
}
