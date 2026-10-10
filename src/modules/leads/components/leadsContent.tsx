'use client';

import { ArrowRight, ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="flex max-w-xl flex-1 gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.currentTarget.value)}
                placeholder="Buscar por nome, contato ou serviço..."
                className="h-11 rounded-xl pl-10"
              />
            </div>

            <Button type="submit" variant="outline" className="cursor-pointer">
              Buscar
            </Button>
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.currentTarget.value as '' | LeadStatus);
              setPage(1);
            }}
            className="h-11 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : !data ? (
          <ListContentSkeleton columns={5} rows={6} label="Carregando oportunidades" />
        ) : data.items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Nenhuma oportunidade encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Novas solicitações feitas pela sua vitrine aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-6 py-3">Contato</th>
                    <th className="px-6 py-3">Serviço</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Recebida em</th>
                    <th className="w-16 px-6 py-3">
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.items.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary hover:underline">
                          {lead.name}
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">{lead.email ?? lead.phone}</p>
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {lead.requestedServiceName ?? 'Não informado'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {statusLabel(lead.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(lead.createdAt)}</td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          aria-label={`Abrir oportunidade de ${lead.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ArrowRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-sm text-muted-foreground">Página {data.page}</p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!data.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                  className="cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
