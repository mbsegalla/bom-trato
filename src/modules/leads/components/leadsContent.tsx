'use client';

import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';

import { ListPagination } from '@/components/listPagination';
import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDate } from '@/shared/formatters/date.formatter';

import { listLeads } from '../services/lead.service';
import type { LeadPage, LeadStatus } from '../types/lead.types';

const statuses: Array<{ value: '' | LeadStatus; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'NEW', label: 'Novas' },
  { value: 'CONTACTED', label: 'Contatadas' },
  { value: 'CONVERTED', label: 'Convertidas' },
  { value: 'ARCHIVED', label: 'Arquivadas' },
];

function statusLabel(status: LeadStatus): string {
  switch (status) {
    case 'NEW':
      return 'Nova';
    case 'CONTACTED':
      return 'Contatada';
    case 'CONVERTED':
      return 'Convertida';
    case 'ARCHIVED':
      return 'Arquivada';
  }
}

function statusClassName(status: LeadStatus): string {
  switch (status) {
    case 'NEW':
      return 'bg-brand-muted text-primary';
    case 'CONTACTED':
      return 'bg-info-surface text-info';
    case 'CONVERTED':
      return 'bg-success-surface text-success';
    case 'ARCHIVED':
      return 'bg-muted text-muted-foreground';
  }
}

export function LeadsContent() {
  const { activeOrganization } = useApp();

  return <OrganizationLeadsContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationLeadsContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | LeadStatus>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeadPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listLeads(organizationId, {
      page,
      status: status || undefined,
      search,
    })
      .then((result) => {
        if (!active) return;

        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as oportunidades.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, router, search, status]);

  const handleSearch: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-medium text-primary">Vitrine</p>

        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Oportunidades</h1>

        <p className="mt-2 text-muted-foreground">
          Acompanhe pessoas que solicitaram orçamento através da sua vitrine.
        </p>
      </div>

      <section className="mt-8">
        <div className="flex flex-col gap-5 border-y border-border py-4 xl:flex-row xl:items-center xl:justify-between">
          <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.currentTarget.value)}
                placeholder="Buscar por nome, contato ou serviço..."
                className="h-10 pl-9"
              />
            </div>

            <Button type="submit" variant="outline" className="h-10 cursor-pointer">
              Buscar
            </Button>
          </form>

          <div role="group" aria-label="Status das oportunidades" className="flex flex-wrap gap-x-5 gap-y-2">
            {statuses.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={status === item.value}
                onClick={() => {
                  setStatus(item.value);
                  setPage(1);
                }}
                className={cn(
                  'cursor-pointer rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-1 hover:bg-transparent',
                  status === item.value && 'border-primary text-primary',
                )}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {search && (
          <div className="flex items-center gap-2 border-b border-border py-3 text-sm text-muted-foreground">
            <span>
              Resultados para <strong className="font-medium text-foreground">“{search}”</strong>
            </span>

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setSearchDraft('');
                setSearch('');
                setPage(1);
              }}
              className="h-auto cursor-pointer p-0"
            >
              Limpar busca
            </Button>
          </div>
        )}

        {error ? (
          <div className="border-b border-border py-10 text-center">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          </div>
        ) : !data ? (
          <ListContentSkeleton columns={5} rows={6} label="Carregando oportunidades" />
        ) : data.items.length === 0 ? (
          <div className="border-b border-border py-10">
            <h2 className="font-heading text-lg font-semibold">Nenhuma oportunidade encontrada</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? 'Tente outro termo ou limpe a busca.'
                : 'Novas solicitações feitas pela sua vitrine aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-5 py-3">Contato</th>
                    <th className="px-5 py-3">Serviço</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Recebida em</th>
                    <th className="w-14 px-5 py-3">
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.items.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary hover:underline">
                          {lead.name}
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">{lead.email ?? lead.phone}</p>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {lead.requestedServiceName ?? 'Não informado'}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                            statusClassName(lead.status),
                          )}
                        >
                          {statusLabel(lead.status)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(lead.createdAt)}</td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          aria-label={`Abrir oportunidade de ${lead.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPagination
              page={data.page}
              hasMore={data.hasMore}
              onPrevious={() => setPage((value) => Math.max(1, value - 1))}
              onNext={() => setPage((value) => value + 1)}
            />
          </>
        )}
      </section>
    </div>
  );
}
