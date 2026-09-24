'use client';

import { Archive, ArrowRight, ChevronLeft, ChevronRight, Mail, Phone, Plus, Search, Users } from 'lucide-react';
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

import { listCustomers } from '../services/customer.service';
import type { CustomerPage, CustomerStatus } from '../types/customer.types';
import { CustomerFormPanel } from './customerFormPanel';

interface CustomerListState {
  requestKey: string;
  data: CustomerPage;
}

interface CustomerListErrorState {
  requestKey: string;
  message: string;
}

const statuses: {
  value: CustomerStatus;
  label: string;
}[] = [
  {
    value: 'ACTIVE',
    label: 'Ativos',
  },
  {
    value: 'ARCHIVED',
    label: 'Arquivados',
  },
  {
    value: 'ALL',
    label: 'Todos',
  },
];

export function CustomersContent() {
  const { activeOrganization } = useApp();

  return <OrganizationCustomersContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationCustomersContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('ACTIVE');
  const [page, setPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const [listState, setListState] = useState<CustomerListState | null>(null);
  const [errorState, setErrorState] = useState<CustomerListErrorState | null>(null);

  const requestKey = `${organizationId}:${page}:${status}:${search}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void listCustomers(organizationId, {
      page,
      status,
      search,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setErrorState(null);

        setListState({
          requestKey,
          data: result,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar seus clientes.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, requestKey, router, search, status, refreshVersion]);

  const data = listState?.requestKey === requestKey ? listState.data : null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  const handleSearch: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchDraft.trim());
  };

  function changeStatus(nextStatus: CustomerStatus): void {
    if (status === nextStatus) {
      return;
    }

    setPage(1);
    setStatus(nextStatus);
  }

  function handleSaved(): void {
    setPage(1);
    setRefreshVersion((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Clientes</h1>

          <p className="mt-2 text-muted-foreground">
            Organize seus clientes e mantenha contatos, observações e histórico sempre por perto.
          </p>
        </div>

        <Button type="button" onClick={() => setFormOpen(true)} className="min-h-12 cursor-pointer rounded-xl px-5">
          <Plus aria-hidden="true" className="size-5" />
          Novo cliente
        </Button>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                  type="search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Buscar por nome..."
                  maxLength={100}
                  className="h-11 rounded-xl pl-10"
                />
              </div>

              <Button type="submit" variant="outline" className="min-h-11 cursor-pointer rounded-xl px-4">
                Buscar
              </Button>
            </form>

            <div role="group" aria-label="Status dos clientes" className="flex gap-1 rounded-xl bg-muted p-1">
              {statuses.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={status === item.value ? 'default' : 'ghost'}
                  aria-pressed={status === item.value}
                  onClick={() => changeStatus(item.value)}
                  className="min-h-9 cursor-pointer rounded-lg px-3"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {search && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
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
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-5 min-h-11 cursor-pointer rounded-xl"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data ? (
          <ListContentSkeleton columns={5} rows={6} label="Carregando clientes" />
        ) : data.items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
              {status === 'ARCHIVED' ? (
                <Archive aria-hidden="true" className="size-6" />
              ) : (
                <Users aria-hidden="true" className="size-6" />
              )}
            </div>

            <h2 className="mt-5 font-heading text-xl font-semibold">
              {search
                ? 'Nenhum cliente encontrado'
                : status === 'ARCHIVED'
                  ? 'Nenhum cliente arquivado'
                  : 'Ainda não há clientes por aqui'}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {search
                ? 'Tente outro nome ou limpe a busca para visualizar seus clientes.'
                : status === 'ARCHIVED'
                  ? 'Clientes arquivados aparecerão aqui e poderão ser restaurados quando necessário.'
                  : 'Cadastre seu primeiro cliente para começar a criar orçamentos e organizar os atendimentos.'}
            </p>

            {!search && status === 'ACTIVE' && (
              <Button
                type="button"
                onClick={() => setFormOpen(true)}
                className="mt-6 min-h-11 cursor-pointer rounded-xl px-5"
              >
                <Plus aria-hidden="true" className="size-4" />
                Cadastrar cliente
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Contato</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Criado em</th>
                    <th className="w-16 px-6 py-3">
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.items.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {customer.name}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail aria-hidden="true" className="size-3.5" />
                              <span className="max-w-64 truncate">{customer.email}</span>
                            </div>
                          )}

                          {customer.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone aria-hidden="true" className="size-3.5" />
                              <span>{customer.phone}</span>
                            </div>
                          )}

                          {!customer.email && !customer.phone && (
                            <span className="text-muted-foreground">Sem contato</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {customer.archivedAt ? (
                          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            Arquivado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(customer.createdAt)}</td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/customers/${customer.id}`}
                          aria-label={`Abrir ${customer.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6">
              <p className="text-sm text-muted-foreground">Página {data.page}</p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  aria-label="Página anterior"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!data.hasMore}
                  aria-label="Próxima página"
                  onClick={() => setPage((value) => value + 1)}
                  className="cursor-pointer"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      {formOpen && (
        <CustomerFormPanel organizationId={organizationId} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
