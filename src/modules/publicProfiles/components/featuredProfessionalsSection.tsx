import { ArrowRight, Link } from 'lucide-react';

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

  console.log('asadadsdas', page);

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Profissionais no Bom Trato</p>

            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Encontre quem faz bem feito.
            </h2>

            <p className="mt-4 leading-relaxed text-muted-foreground">
              Conheça profissionais e negócios que usam o Bom Trato para organizar seus serviços.
            </p>
          </div>

          <Link href="/profissionais" className="inline-flex min-h-11 items-center gap-2 font-medium text-primary">
            Ver todos os profissionais
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((professional) => (
            <ProfessionalCard key={professional.slug} professional={professional} />
          ))}
        </div>
      </div>
    </section>
  );
}
