'use client';

import { Check, Download, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import { decidePublicQuote, downloadPublicQuotePdf, resolvePublicQuote } from '../services/quote.service';
import type { PublicQuote } from '../types/quote.types';
import { QuoteStatusBadge } from './quoteStatusBadge';

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
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
            bt
          </div>

          <h1 className="mt-6 font-heading text-2xl font-semibold">Este orçamento não está disponível</h1>

          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background">
        <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-primary" />

        <p className="mt-4 text-sm text-muted-foreground">Carregando orçamento...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
              bt
            </span>

            <span className="text-xl font-bold tracking-tight">bom trato.</span>
          </div>

          <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
        </header>

        <article className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6 sm:p-8">
            <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">{quote.organizationName}</p>

            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">{quote.title}</h1>

            <p className="mt-3 text-muted-foreground">Preparado para {quote.customerName}</p>

            {quote.validUntil && (
              <p className="mt-2 text-sm text-muted-foreground">Válido até {formatDateTime(quote.validUntil)}</p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="divide-y divide-border rounded-2xl border border-border">
              {quote.items.map((item, index) => (
                <div key={`${item.name}:${index}`} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.name}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                        {' · '}
                        {formatBrlCurrency(item.unitAmountInCents)}
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    <p className="shrink-0 font-semibold">{formatBrlCurrency(item.totalInCents)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 ml-auto max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBrlCurrency(quote.subtotalInCents)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span>- {formatBrlCurrency(quote.discountInCents)}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatBrlCurrency(quote.totalInCents)}</span>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-8 rounded-2xl bg-muted/40 p-5">
                <p className="text-sm font-medium">Observações</p>

                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{quote.notes}</p>
              </div>
            )}

            {error && (
              <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={downloading}
                onClick={() => void handlePdf()}
                className="min-h-11 cursor-pointer"
              >
                {downloading ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Download aria-hidden="true" className="size-4" />
                )}
                Baixar PDF
              </Button>

              {quote.canDecide && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deciding !== null}
                    onClick={() => void handleDecision('decline')}
                    className="min-h-11 cursor-pointer"
                  >
                    {deciding === 'decline' ? (
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <X aria-hidden="true" className="size-4" />
                    )}
                    Recusar orçamento
                  </Button>

                  <Button
                    type="button"
                    disabled={deciding !== null}
                    onClick={() => void handleDecision('approve')}
                    className="min-h-11 cursor-pointer"
                  >
                    {deciding === 'approve' ? (
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Check aria-hidden="true" className="size-4" />
                    )}
                    Aprovar orçamento
                  </Button>
                </div>
              )}
            </div>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Link válido até {formatDateTime(quote.expiresAt)}
        </p>
      </div>
    </main>
  );
}
