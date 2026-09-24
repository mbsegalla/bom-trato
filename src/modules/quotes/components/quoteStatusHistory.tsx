'use client';

import { History, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getQuoteStatusLabel } from '../constants/quote.constants';
import { getQuoteStatusHistory } from '../services/quote.service';
import type { QuoteStatusHistory as QuoteStatusHistoryItem } from '../types/quote.types';

interface QuoteStatusHistoryProps {
  organizationId: string;
  quoteId: string;
  quoteVersion: number;
}

interface HistoryState {
  requestKey: string;
  data: QuoteStatusHistoryItem[];
}

export function QuoteStatusHistory({ organizationId, quoteId, quoteVersion }: QuoteStatusHistoryProps) {
  const router = useRouter();

  const [state, setState] = useState<HistoryState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${quoteId}:${quoteVersion}`;

  useEffect(() => {
    let active = true;

    void getQuoteStatusHistory(organizationId, quoteId, quoteVersion)
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

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, quoteId, quoteVersion, requestKey, router]);

  const history = state?.requestKey === requestKey ? state.data : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <History aria-hidden="true" className="size-5 text-primary" />

        <h2 className="font-heading text-lg font-semibold">Histórico</h2>
      </div>

      {error ? (
        <p className="mt-5 text-sm text-destructive">{error}</p>
      ) : !history ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Carregando histórico...
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="border-l-2 border-border pl-4">
              <p className="text-sm font-medium">
                {entry.fromStatus === null
                  ? `Criado como ${getQuoteStatusLabel(entry.toStatus)}`
                  : `${getQuoteStatusLabel(entry.fromStatus)} → ${getQuoteStatusLabel(entry.toStatus)}`}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt)} · versão {entry.version}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
