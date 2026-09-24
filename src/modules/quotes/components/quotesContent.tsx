'use client';

import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { quoteStatusOptions } from '../constants/quote.constants';
import { listQuotes } from '../services/quote.service';
import type { QuoteListStatus, QuotePage } from '../types/quote.types';
import { QuoteCreatePanel } from './quoteCreatePanel';
import { QuoteStatusBadge } from './quoteStatusBadge';

interface QuoteListState {
  requestKey: string;
  data: QuotePage;
}

export function QuotesContent() {
  const { activeOrganization } = useApp();

  return <OrganizationQuotesContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationQuotesContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<QuoteListStatus>('ALL');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [createOpen, setCreateOpen] = useState(() => searchParams.get('new') === '1');
  const [state, setState] = useState<QuoteListState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${page}:${status}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void listQuotes(organizationId, {
      page,
      status,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setError(null);

        setState({
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

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os orçamentos.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, refreshVersion, requestKey, router, status]);

  const data = state?.requestKey === requestKey ? state.data : null;

  function changeStatus(nextStatus: QuoteListStatus): void {
    setPage(1);
    setStatus(nextStatus);
  }

  function closeCreate(): void {
    setCreateOpen(false);

    if (searchParams.get('new') === '1') {
      router.replace('/quotes');
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Orçamentos</h1>

          <p className="mt-2 text-muted-foreground">
            Crie propostas, acompanhe respostas e transforme aprovações em trabalho.
          </p>
        </div>

        <Button type="button" onClick={() => setCreateOpen(true)} className="min-h-12 cursor-pointer rounded-xl px-5">
          <Plus aria-hidden="true" className="size-5" />
          Novo orçamento
        </Button>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-border p-5">
          {quoteStatusOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={status === option.value ? 'default' : 'ghost'}
              onClick={() => changeStatus(option.value)}
              className="cursor-pointer rounded-lg"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-5 cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data ? (
          <ListContentSkeleton columns={6} rows={6} label="Carregando orçamentos" />
        ) : data.items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
              <FileText aria-hidden="true" className="size-6" />
            </div>

            <h2 className="mt-5 font-heading text-xl font-semibold">Nenhum orçamento por aqui</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Crie um orçamento para um cliente e adicione os serviços que serão realizados.
            </p>

            <Button type="button" onClick={() => setCreateOpen(true)} className="mt-6 cursor-pointer">
              <Plus aria-hidden="true" className="size-4" />
              Criar orçamento
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-220 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3">Orçamento</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Validade</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Atualizado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.items.map((quote) => (
                    <tr key={quote.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Link href={`/quotes/${quote.id}`} className="font-medium hover:text-primary hover:underline">
                          {quote.title}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-sm">{quote.customerName}</td>

                      <td className="px-6 py-4">
                        <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(quote.validUntil)}</td>

                      <td className="px-6 py-4 font-medium">{formatBrlCurrency(quote.totalInCents)}</td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(quote.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-sm text-muted-foreground">Página {data.page}</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!data.hasMore}
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

      {createOpen && (
        <QuoteCreatePanel
          organizationId={organizationId}
          onClose={closeCreate}
          onCreated={(quote) => router.push(`/quotes/${quote.id}`)}
        />
      )}
    </div>
  );
}
