import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingHeader } from '@/modules/marketing/components/marketingHeader';
import { ProfessionalCard } from '@/modules/publicProfiles/components/professionalCard';
import { getPublicProfessionals } from '@/modules/publicProfiles/services/publicDirectory.service';

export const metadata: Metadata = {
  title: 'Profissionais',
  description: 'Encontre profissionais e prestadores de serviços no Bom Trato.',
};

interface ProfessionalsPageProps {
  searchParams: Promise<{
    search?: string | string[];
    city?: string | string[];
    page?: string | string[];
  }>;
}

function single(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

function href(page: number, search: string, city: string): string {
  const query = new URLSearchParams();

  if (search) {
    query.set('search', search);
  }

  if (city) {
    query.set('city', city);
  }

  query.set('page', String(page));

  return `/profissionais?${query.toString()}`;
}

export default async function ProfessionalsPage({ searchParams }: ProfessionalsPageProps) {
  const params = await searchParams;

  const search = single(params.search).trim();
  const city = single(params.city).trim();

  const page = Math.max(1, Number(single(params.page)) || 1);

  const result = await getPublicProfessionals({
    page,
    limit: 12,
    search,
    city,
  });

  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />

      <main className="px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Vitrine Bom Trato</p>

            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">Encontre um profissional</h1>

            <p className="mt-4 leading-relaxed text-muted-foreground">
              Busque pelo serviço que precisa ou pela cidade onde deseja atendimento.
            </p>
          </div>

          <form
            action="/profissionais"
            method="get"
            className="mt-10 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_0.6fr_auto]"
          >
            <label className="relative">
              <span className="sr-only">Serviço ou profissional</span>

              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <input
                name="search"
                defaultValue={search}
                placeholder="Eletricista, pintura, limpeza..."
                className="h-12 w-full rounded-xl border border-input bg-background pr-4 pl-11 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>

            <input
              name="city"
              defaultValue={city}
              placeholder="Cidade"
              className="h-12 rounded-xl border border-input bg-background px-4 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />

            <button
              type="submit"
              className="h-12 cursor-pointer rounded-xl bg-primary px-6 font-medium text-primary-foreground"
            >
              Buscar
            </button>
          </form>

          {result.items.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center">
              <h2 className="text-lg font-semibold">Nenhum profissional encontrado</h2>

              <p className="mt-2 text-sm text-muted-foreground">Tente outro serviço ou outra cidade.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((professional) => (
                <ProfessionalCard key={professional.slug} professional={professional} />
              ))}
            </div>
          )}

          <nav className="mt-10 flex items-center justify-between">
            {page > 1 ? (
              <Link
                href={href(page - 1, search, city)}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              >
                <ArrowLeft className="size-4" />
                Anterior
              </Link>
            ) : (
              <span />
            )}

            {result.hasMore && (
              <Link
                href={href(page + 1, search, city)}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              >
                Próxima
                <ArrowRight className="size-4" />
              </Link>
            )}
          </nav>
        </div>
      </main>
    </div>
  );
}
