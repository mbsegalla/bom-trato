import { Check, Download, LoaderCircle, Pencil, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QuoteStatusBadge } from '@/modules/quotes/components/quoteStatusBadge';
import type { Quote } from '@/modules/quotes/types/quote.types';
import { QuoteWorkOrderAction } from '@/modules/workOrders/components/quoteWorkOrderAction';

interface QuoteDetailsHeaderProps {
  quote: Quote;
  organizationId: string;
  draft: boolean;
  sent: boolean;
  approved: boolean;
  expired: boolean;
  downloadingPdf: boolean;
  sending: boolean;
  onPdf: () => void;
  onEdit: () => void;
  onSend: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

export function QuoteDetailsHeader({
  quote,
  organizationId,
  draft,
  sent,
  approved,
  expired,
  downloadingPdf,
  sending,
  onPdf,
  onEdit,
  onSend,
  onApprove,
  onDecline,
  onCancel,
}: QuoteDetailsHeaderProps) {
  const hasSecondaryActions = draft || sent;

  return (
    <header className="mt-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{quote.title}</h1>
            <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {quote.customerName} · versão {quote.version}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {approved && <QuoteWorkOrderAction organizationId={organizationId} quoteId={quote.id} />}

          {draft && (
            <Button
              type="button"
              disabled={quote.items.length === 0 || sending}
              onClick={onSend}
              className="cursor-pointer"
            >
              {sending ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}

              {sending ? 'Preparando...' : 'Enviar orçamento'}
            </Button>
          )}

          {sent && !expired && (
            <Button type="button" onClick={onApprove} className="cursor-pointer">
              <Check aria-hidden="true" className="size-4" />
              Registrar aprovação
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1 border-y border-border py-2">
        <Button type="button" variant="ghost" disabled={downloadingPdf} onClick={onPdf} className="cursor-pointer">
          {downloadingPdf ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          PDF
        </Button>

        {draft && (
          <Button type="button" variant="ghost" onClick={onEdit} className="cursor-pointer">
            <Pencil aria-hidden="true" className="size-4" />
            Editar
          </Button>
        )}

        {sent && !expired && (
          <Button type="button" variant="ghost" onClick={onDecline} className="cursor-pointer">
            <X aria-hidden="true" className="size-4" />
            Registrar recusa
          </Button>
        )}

        {hasSecondaryActions && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="ml-auto cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Cancelar orçamento
          </Button>
        )}
      </div>
    </header>
  );
}
