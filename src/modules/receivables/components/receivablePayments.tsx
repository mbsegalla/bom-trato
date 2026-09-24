'use client';

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getReceivablePaymentMethodLabel } from '../constants/receivable.constants';
import { listReceivablePayments } from '../services/receivable.service';
import type { Receivable, ReceivablePayment, ReceivablePaymentsPage } from '../types/receivable.types';
import { ReceivableReversePaymentDialog } from './receivableReversePaymentDialog';
import { ReceivablePaymentsSkeleton } from './receivableSkeletons';

interface ReceivablePaymentsProps {
  receivable: Receivable;
  onReceivableSaved(receivable: Receivable): void;
}

interface PaymentState {
  requestKey: string;
  data: ReceivablePaymentsPage;
}

interface PaymentErrorState {
  requestKey: string;
  message: string;
}

export function ReceivablePayments({ receivable, onReceivableSaved }: ReceivablePaymentsProps) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [state, setState] = useState<PaymentState | null>(null);
  const [errorState, setErrorState] = useState<PaymentErrorState | null>(null);
  const [reversingPayment, setReversingPayment] = useState<ReceivablePayment | null>(null);

  const requestKey = `${receivable.id}:${receivable.version}:${page}`;

  useEffect(() => {
    let active = true;

    void listReceivablePayments(receivable.organizationId, receivable.id, receivable.version, page)
      .then((result) => {
        if (!active) {
          return;
        }

        setErrorState(null);

        setState({
          requestKey,
          data: result,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar os pagamentos.',
        });
      });

    return () => {
      active = false;
    };
  }, [page, receivable.id, receivable.organizationId, receivable.version, requestKey, router]);

  const data = state?.requestKey === requestKey ? state.data : null;

  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Pagamentos</h2>

      <p className="mt-1 text-sm text-muted-foreground">Histórico de pagamentos e estornos deste recebível.</p>

      <div className="mt-6">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !data ? (
          <ReceivablePaymentsSkeleton />
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <div className="space-y-5">
            {data.items.map((payment) => {
              const reversed = payment.reversedAt !== null;

              return (
                <div key={payment.id} className="flex items-start justify-between gap-4 border-l-2 border-border pl-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={reversed ? 'font-medium line-through opacity-60' : 'font-medium'}>
                        {formatBrlCurrency(payment.amountInCents)}
                      </p>

                      <span className="text-xs text-muted-foreground">
                        {getReceivablePaymentMethodLabel(payment.method)}
                      </span>

                      {reversed && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                          Estornado
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Recebido em {formatDateTime(payment.receivedAt)}
                    </p>

                    {payment.notes && <p className="mt-2 text-sm text-muted-foreground">{payment.notes}</p>}

                    {payment.reversalReason && (
                      <p className="mt-2 text-sm text-destructive">Motivo do estorno: {payment.reversalReason}</p>
                    )}
                  </div>

                  {!reversed && receivable.status !== 'CANCELED' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReversingPayment(payment)}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="size-4" />
                      Estornar
                    </Button>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={!data.hasMore}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {reversingPayment && (
        <ReceivableReversePaymentDialog
          receivable={receivable}
          payment={reversingPayment}
          onClose={() => setReversingPayment(null)}
          onSaved={onReceivableSaved}
        />
      )}
    </section>
  );
}
