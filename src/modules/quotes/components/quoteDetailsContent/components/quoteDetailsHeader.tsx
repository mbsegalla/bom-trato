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
  onPdf,
  onEdit,
  onSend,
  onApprove,
  onDecline,
  onCancel,
}: QuoteDetailsHeaderProps) {
  return (
    <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{quote.title}</h1>
          <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {quote.customerName} · versão {quote.version}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={downloadingPdf} onClick={onPdf} className="cursor-pointer">
          {downloadingPdf ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          PDF
        </Button>

        {approved && <QuoteWorkOrderAction organizationId={organizationId} quoteId={quote.id} />}

        {draft && (
          <>
            <Button type="button" variant="outline" onClick={onEdit} className="cursor-pointer">
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Button>
            <Button type="button" disabled={quote.items.length === 0} onClick={onSend} className="cursor-pointer">
              <Send aria-hidden="true" className="size-4" />
              Marcar como enviado
            </Button>
          </>
        )}

        {sent && !expired && (
          <>
            <Button type="button" variant="outline" onClick={onApprove} className="cursor-pointer">
              <Check aria-hidden="true" className="size-4" />
              Registrar aprovação
            </Button>
            <Button type="button" variant="outline" onClick={onDecline} className="cursor-pointer">
              <X aria-hidden="true" className="size-4" />
              Registrar recusa
            </Button>
          </>
        )}

        {(draft || sent) && (
          <Button type="button" variant="destructive" onClick={onCancel} className="cursor-pointer">
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
