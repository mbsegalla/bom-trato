import { Check, Download, LoaderCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicQuote } from '@/modules/quotes/types/quote.types';

interface PublicQuoteActionsProps {
  quote: PublicQuote;
  deciding: 'approve' | 'decline' | null;
  downloading: boolean;
  onDownload(): void;
  onDecision(decision: 'approve' | 'decline'): void;
}

export function PublicQuoteActions({ quote, deciding, downloading, onDownload, onDecision }: PublicQuoteActionsProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
      <Button
        type="button"
        variant="outline"
        disabled={downloading}
        onClick={onDownload}
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
            onClick={() => onDecision('decline')}
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
            onClick={() => onDecision('approve')}
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
  );
}
