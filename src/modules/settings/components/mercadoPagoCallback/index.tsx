'use client';

import { LoaderCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { completeMercadoPagoConnection } from '../../services/mercadoPagoConnection.service';
import type { MercadoPagoCompletionView } from '../../types/mercadoPagoConnection.types';

type CallbackState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; result: MercadoPagoCompletionView };

export function MercadoPagoCallback() {
  const grant = useRef<{ code: string; state: string } | null>(null);
  const initialized = useRef(false);
  const [view, setView] = useState<CallbackState>({ kind: 'loading' });

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get('code') ?? '';
    const state = params.get('state') ?? '';

    window.history.replaceState(window.history.state, '', window.location.pathname);

    if (
      params.has('error') ||
      params.getAll('code').length !== 1 ||
      params.getAll('state').length !== 1 ||
      !/^[\x21-\x7E]{1,2048}$/.test(code) ||
      !/^[A-Za-z0-9_-]{43}$/.test(state)
    ) {
      setView({ kind: 'error', message: 'A autorização não foi concluída. Volte às configurações e tente novamente.' });
      return;
    }

    grant.current = { code, state };
    setView({ kind: 'ready' });
  }, []);

  async function complete(): Promise<void> {
    const input = grant.current;

    if (!input || view.kind !== 'ready') {
      return;
    }

    grant.current = null;
    setView({ kind: 'submitting' });

    try {
      const result = await completeMercadoPagoConnection(input.state, input.code);
      setView({ kind: 'done', result });
    } catch (cause: unknown) {
      setView({
        kind: 'error',
        message: cause instanceof Error ? cause.message : 'Não foi possível concluir a conexão. Consulte o status.',
      });
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <section className="w-full max-w-lg space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <ShieldCheck aria-hidden="true" className="size-8 text-primary" />
        <h1 className="font-heading text-2xl font-semibold">Conectar Mercado Pago</h1>

        {view.kind === 'loading' || view.kind === 'submitting' ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            {view.kind === 'loading' ? 'Verificando autorização...' : 'Concluindo conexão...'}
          </p>
        ) : view.kind === 'ready' ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Confirme a conexão com o negócio e a sessão que iniciaram esta autorização. A conta só será vinculada
              após a validação pelo servidor.
            </p>
            <Button type="button" onClick={() => void complete()} className="w-full cursor-pointer">
              Concluir conexão
            </Button>
          </>
        ) : view.kind === 'error' ? (
          <p role="alert" className="text-sm text-destructive">{view.message}</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Conta vinculada com sucesso.</p>
            <p>Negócio: {view.result.organizationName}</p>
            <p>Conta Mercado Pago: {view.result.accountId}</p>
            <p>Ambiente: {view.result.liveMode ? 'Produção' : 'Testes'}</p>
            <p className="text-muted-foreground">
              A conexão ainda não habilita cobranças automáticas. Selecione o negócio nas configurações para consultar o status.
            </p>
          </div>
        )}

        {view.kind !== 'submitting' && (
          <Link href="/settings?tab=receiving" className="inline-block text-sm font-medium text-primary hover:underline">
            Voltar para Recebimentos
          </Link>
        )}
      </section>
    </main>
  );
}
