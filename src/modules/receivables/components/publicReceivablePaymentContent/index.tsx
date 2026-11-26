'use client';

import { Clipboard, LoaderCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { createReceivablePixQrCode, type ReceivablePixQrCode } from '../../helpers/receivablePixQrCode.helper';
import { resolveReceivablePaymentLink } from '../../services/receivablePaymentLink.service';
import type { PublicReceivablePaymentLink } from '../../types/receivablePaymentLink.types';

type PaymentState =
  | { kind: 'ready'; payment: PublicReceivablePaymentLink; qr: ReceivablePixQrCode }
  | { kind: 'error'; message: string };

export function PublicReceivablePaymentContent() {
  const [state, setState] = useState<PaymentState | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';

    void resolveReceivablePaymentLink(token)
      .then((payment) => {
        if (!active) {
          return;
        }

        const qr = createReceivablePixQrCode(payment.copyAndPaste);

        setState({ kind: 'ready', payment, qr });
        expiryTimer = setTimeout(
          () => setState({ kind: 'error', message: 'Link expirado. Solicite um novo link ao profissional.' }),
          Math.max(0, payment.expiresAt.getTime() - Date.now()),
        );
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            kind: 'error',
            message: cause instanceof Error ? cause.message : 'Não foi possível abrir o link.',
          });
        }
      });

    return () => {
      active = false;
      clearTimeout(expiryTimer);
    };
  }, [requestVersion]);

  useEffect(() => {
    function handleHashChange(): void {
      setState(null);
      setRequestVersion((value) => value + 1);
    }

    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function refresh(): void {
    setState(null);
    setRequestVersion((value) => value + 1);
  }

  async function copy(): Promise<void> {
    if (state?.kind !== 'ready') {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.payment.copyAndPaste);
      toast.success('Pix Copia e Cola copiado.');
    } catch {
      toast.error('Selecione e copie o código manualmente.');
    }
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-10">
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-primary">Bom Trato</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold">Pagamento Pix</h1>

        {state === null ? (
          <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Consultando cobrança...
          </p>
        ) : state.kind === 'error' ? (
          <p role="alert" className="mt-6 text-sm text-muted-foreground">
            {state.message}
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted-foreground">{state.payment.organizationName}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {formatBrlCurrency(state.payment.amountInCents)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Recebedor informado: {state.payment.merchantName}</p>

            <svg
              role="img"
              aria-label="QR Code Pix"
              viewBox={`0 0 ${state.qr.size} ${state.qr.size}`}
              shapeRendering="crispEdges"
              className="mx-auto mt-6 size-56 max-w-full bg-white"
            >
              <rect width={state.qr.size} height={state.qr.size} fill="#fff" />
              <path d={state.qr.path} fill="#000" />
            </svg>

            <label htmlFor="public-pix-copy" className="mt-5 block text-sm font-medium">
              Pix Copia e Cola
            </label>
            <Textarea
              id="public-pix-copy"
              readOnly
              spellCheck={false}
              value={state.payment.copyAndPaste}
              className="mt-2 min-h-24 font-mono text-xs break-all"
            />

            <Button type="button" onClick={() => void copy()} className="mt-3 w-full cursor-pointer">
              <Clipboard aria-hidden="true" className="size-4" />
              Copiar código Pix
            </Button>

            <p className="mt-4 text-xs text-muted-foreground">
              Link válido até {formatDateTime(state.payment.expiresAt)}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Atualize a cobrança antes de pagar. Confira o valor e o recebedor no aplicativo do banco. Se já pagou,
              confirme com o profissional e não pague novamente. O Bom Trato não confirma este pagamento
              automaticamente.
            </p>
          </>
        )}

        <Button type="button" variant="outline" onClick={refresh} className="mt-5 w-full cursor-pointer">
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar cobrança
        </Button>
      </div>
    </main>
  );
}
