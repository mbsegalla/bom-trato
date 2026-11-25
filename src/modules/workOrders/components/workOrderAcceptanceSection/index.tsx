'use client';

import { CircleCheck, ClipboardCheck, LoaderCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getWorkOrderAcceptance } from '../../services/workOrderAcceptance.service';
import type { WorkOrderStatus } from '../../types/workOrder.types';
import type { WorkOrderAcceptanceReceipt } from '../../types/workOrderAcceptance.types';
import { WorkOrderAcceptanceSnapshot } from './components/workOrderAcceptanceSnapshot';

interface WorkOrderAcceptanceSectionProps {
  organizationId: string;
  workOrderId: string;
  status: WorkOrderStatus;
}

type AcceptanceState =
  | { kind: 'loading' }
  | { kind: 'ready'; receipt: WorkOrderAcceptanceReceipt | null }
  | { kind: 'error'; message: string };

export function WorkOrderAcceptanceSection({ organizationId, workOrderId, status }: WorkOrderAcceptanceSectionProps) {
  const router = useRouter();
  const [state, setState] = useState<AcceptanceState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;

    void getWorkOrderAcceptance(organizationId, workOrderId)
      .then(({ receipt }) => {
        if (active) {
          setState({ kind: 'ready', receipt });
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setState({
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar o aceite da conclusão.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function refresh(): void {
    if (state.kind === 'loading') {
      return;
    }

    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  return (
    <section className="min-w-0 border-t border-border pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Aceite da conclusão</h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Consulte a confirmação registrada pelo cliente no portal de acompanhamento.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={state.kind === 'loading'}
          onClick={refresh}
          className="min-h-11 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar aceite
        </Button>
      </div>

      {state.kind === 'loading' && (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando aceite da conclusão...
        </p>
      )}

      {state.kind === 'error' && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      {state.kind === 'ready' &&
        (state.receipt === null ? (
          <p className="mt-5 rounded-xl bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
            {status === 'COMPLETED'
              ? 'Aguardando o aceite do cliente. Compartilhe o portal de acompanhamento para que ele confira os serviços e confirme a conclusão.'
              : status === 'CANCELED'
                ? 'Este atendimento foi cancelado. Não há aceite da conclusão.'
                : 'O cliente poderá registrar o aceite no portal de acompanhamento após a conclusão deste atendimento.'}
          </p>
        ) : (
          <div className="mt-5 min-w-0 rounded-xl border border-success/20 bg-success-surface/30 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
              Aceite registrado pelo cliente
            </p>

            <dl className="mt-5 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Nome informado pelo cliente</dt>
                <dd className="mt-1 font-medium wrap-break-word">{state.receipt.signerName}</dd>
              </div>

              <div className="min-w-0">
                <dt className="text-muted-foreground">Data do aceite</dt>
                <dd className="mt-1 font-medium">
                  <time dateTime={state.receipt.acceptedAt.toISOString()}>
                    {formatDateTime(state.receipt.acceptedAt)}
                  </time>
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-sm font-medium">Declaração confirmada</p>

            <blockquote className="mt-2 border-l-2 border-success/30 pl-4 text-sm leading-relaxed text-muted-foreground">
              {state.receipt.consentText}
            </blockquote>

            <WorkOrderAcceptanceSnapshot snapshot={state.receipt.snapshot} />
          </div>
        ))}
    </section>
  );
}
