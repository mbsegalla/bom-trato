'use client';

import { Check, Download, LoaderCircle, MessageSquareText, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { publicQuoteChangeRequestFormSchema } from '@/modules/quotes/schemas/quote.schema';
import type { PublicQuote } from '@/modules/quotes/types/quote.types';

interface PublicQuoteActionsProps {
  quote: PublicQuote;
  deciding: 'approve' | 'decline' | null;
  requestingChange: boolean;
  downloading: boolean;
  onDownload(): void;
  onDecision(decision: 'approve' | 'decline'): void;
  onChangeRequest(message: string): void;
}

export function PublicQuoteActions({
  quote,
  deciding,
  requestingChange,
  downloading,
  onDownload,
  onDecision,
  onChangeRequest,
}: PublicQuoteActionsProps) {
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();

    const parsed = publicQuoteChangeRequestFormSchema.safeParse({
      message,
    });

    if (!parsed.success) {
      setMessageError(parsed.error.issues[0]?.message ?? 'Confira a solicitação.');
      return;
    }

    setMessageError(null);

    onChangeRequest(parsed.data.message);
  };

  if (quote.changeRequestedAt !== null) {
    return (
      <div className="mt-8 rounded-2xl border border-info/20 bg-info-surface p-5">
        <div className="flex items-start gap-3">
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />

          <div>
            <p className="font-medium">Alteração solicitada</p>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              O prestador já foi avisado. Aguarde uma nova versão do orçamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {changeRequestOpen && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-2xl border border-border bg-muted/30 p-5">
          <p className="font-medium">O que você gostaria de alterar?</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Explique ao prestador o ajuste necessário antes de aprovar.
          </p>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            maxLength={2000}
            placeholder="Ex.: Gostaria de retirar o segundo item do orçamento."
            className="mt-4 min-h-28 rounded-xl"
          />

          {messageError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {messageError}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={requestingChange}
              onClick={() => setChangeRequestOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={requestingChange} className="cursor-pointer">
              {requestingChange && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              Enviar solicitação
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
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
            {quote.canRequestChange && (
              <Button
                type="button"
                variant="outline"
                disabled={deciding !== null || requestingChange}
                onClick={() => setChangeRequestOpen((value) => !value)}
                className="min-h-11 cursor-pointer"
              >
                <MessageSquareText aria-hidden="true" className="size-4" />
                Solicitar alteração
              </Button>
            )}

            <Button
              type="button"
              variant="destructive"
              disabled={deciding !== null || requestingChange}
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
              disabled={deciding !== null || requestingChange}
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
    </div>
  );
}
