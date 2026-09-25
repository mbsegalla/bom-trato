'use client';

import { useEffect, useRef, useState } from 'react';

import { decidePublicQuote, downloadPublicQuotePdf, resolvePublicQuote } from '@/modules/quotes/services/quote.service';
import type { PublicQuote } from '@/modules/quotes/types/quote.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { PublicQuoteSkeleton } from '../publicQuoteSkeleton';
import { PublicQuoteActions } from './components/publicQuoteActions';
import { PublicQuoteHeader } from './components/publicQuoteHeader';
import { PublicQuoteIntro } from './components/publicQuoteIntro';
import { PublicQuoteItems } from './components/publicQuoteItems';
import { PublicQuoteSummary } from './components/publicQuoteSummary';
import { PublicQuoteUnavailable } from './components/publicQuoteUnavailable';

export function PublicQuoteContent() {
  const tokenRef = useRef<string | null>(null);

  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<'approve' | 'decline' | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';

    tokenRef.current = token;

    void resolvePublicQuote(token)
      .then((result) => {
        if (active) {
          setQuote(result);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o orçamento.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleDecision(decision: 'approve' | 'decline'): Promise<void> {
    const token = tokenRef.current;

    if (!token || !quote || deciding) {
      return;
    }

    setDeciding(decision);
    setError(null);

    try {
      const result = await decidePublicQuote(token, quote.sharedVersion, decision);

      setQuote({
        ...quote,
        status: result.status,
        version: result.version,
        canDecide: false,
      });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar sua resposta.');
    } finally {
      setDeciding(null);
    }
  }

  async function handlePdf(): Promise<void> {
    const token = tokenRef.current;

    if (!token || downloading) {
      return;
    }

    setDownloading(true);

    try {
      const file = await downloadPublicQuotePdf(token);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível baixar o PDF.');
    } finally {
      setDownloading(false);
    }
  }

  if (error && !quote) {
    return <PublicQuoteUnavailable message={error} />;
  }

  if (!quote) {
    return <PublicQuoteSkeleton />;
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <PublicQuoteHeader quote={quote} />

        <article className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <PublicQuoteIntro quote={quote} />

          <div className="p-6 sm:p-8">
            <PublicQuoteItems items={quote.items} />
            <PublicQuoteSummary quote={quote} />

            {error && (
              <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </p>
            )}

            <PublicQuoteActions
              quote={quote}
              deciding={deciding}
              downloading={downloading}
              onDownload={() => void handlePdf()}
              onDecision={(decision) => void handleDecision(decision)}
            />
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Link válido até {formatDateTime(quote.expiresAt)}
        </p>
      </div>
    </main>
  );
}
