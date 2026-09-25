'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { QuoteCreatePanel } from '@/modules/quotes/components/quoteCreatePanel';
import { listQuotes } from '@/modules/quotes/services/quote.service';
import type { QuoteListStatus, QuotePage } from '@/modules/quotes/types/quote.types';

import { QuotesEmptyState } from './components/quotesEmptyState';
import { QuotesFilters } from './components/quotesFilters';
import { QuotesHeader } from './components/quotesHeader';
import { QuotesTable } from './components/quotesTable';

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

    void listQuotes(organizationId, { page, status })
      .then((result) => {
        if (!active) return;

        setError(null);
        setState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

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
    if (searchParams.get('new') === '1') router.replace('/quotes');
  }

  return (
    <div className="mx-auto max-w-7xl">
      <QuotesHeader onCreate={() => setCreateOpen(true)} />

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <QuotesFilters status={status} onChange={changeStatus} />
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
          <QuotesEmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <QuotesTable
            data={data}
            page={page}
            onPrevious={() => setPage((value) => Math.max(1, value - 1))}
            onNext={() => setPage((value) => value + 1)}
          />
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
