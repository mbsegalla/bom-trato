import { CheckCircle2, MessageSquareText } from 'lucide-react';

import type { Quote } from '@/modules/quotes/types/quote.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

export function QuoteChangeRequestNotice({ quote }: { quote: Quote }) {
  const request = quote.changeRequest;

  if (request === null) {
    return null;
  }

  const handled = quote.version > request.quoteVersion;

  return (
    <section
      className={
        handled
          ? 'mt-5 rounded-2xl border border-border bg-muted/30 p-5'
          : 'mt-5 rounded-2xl border border-info/20 bg-info-surface p-5'
      }
    >
      <div className="flex items-start gap-3">
        {handled ? (
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
        )}

        <div className="min-w-0">
          <p className="font-medium">
            {handled ? 'Solicitação de alteração da versão anterior' : 'Cliente solicitou uma alteração'}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Versão {request.quoteVersion} · {formatDateTime(request.requestedAt)}
          </p>

          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{request.message}</p>

          {handled && (
            <p className="mt-3 text-xs text-muted-foreground">
              O orçamento já possui uma versão mais nova que a versão em que esta solicitação foi feita.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
