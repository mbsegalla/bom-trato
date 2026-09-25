'use client';

import { Download, ExternalLink, LoaderCircle, Receipt } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { getInvoiceStatusLabel } from '../constants/billing.constants';
import { listBillingInvoices } from '../services/billing.service';
import type { BillingInvoice, BillingInvoicePage } from '../types/billing.types';

interface InvoiceListProps {
  organizationId: string;
  initialPage: BillingInvoicePage;
}

export function InvoiceList({ organizationId, initialPage }: InvoiceListProps) {
  const [items, setItems] = useState<BillingInvoice[]>(initialPage.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore(): Promise<void> {
    if (!nextCursor || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await listBillingInvoices(organizationId, nextCursor);

      setItems((current) => [
        ...current,
        ...result.items.filter((invoice) => !current.some((existing) => existing.id === invoice.id)),
      ]);

      setNextCursor(result.nextCursor);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar mais faturas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Receipt className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold">Faturas</h2>

            <p className="mt-1 text-sm text-muted-foreground">Histórico de cobranças da sua assinatura.</p>
          </div>
        </div>
      </header>

      {error && (
        <p className="m-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Receipt className="mx-auto size-7 text-muted-foreground" />

          <p className="mt-3 text-sm text-muted-foreground">Nenhuma fatura disponível.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((invoice) => (
            <div key={invoice.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium">{invoice.number ? `Fatura ${invoice.number}` : 'Fatura'}</p>

                  <span
                    className={
                      invoice.status.toLowerCase() === 'paid'
                        ? 'rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success'
                        : 'rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'
                    }
                  >
                    {getInvoiceStatusLabel(invoice)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(invoice.stripeCreatedAt)}
                  {' · '}
                  {formatBrlCurrency(invoice.amountPaid)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {invoice.hostedInvoiceUrl && (
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                  >
                    <ExternalLink className="size-4" />
                    Abrir
                  </a>
                )}

                {invoice.invoicePdf && (
                  <a
                    href={invoice.invoicePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                  >
                    <Download className="size-4" />
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <footer className="border-t border-border p-5 text-center">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void loadMore()}
            className="cursor-pointer"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" />}
            Carregar mais
          </Button>
        </footer>
      )}
    </section>
  );
}
