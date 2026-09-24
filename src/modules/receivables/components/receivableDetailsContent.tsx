'use client';

import { ArrowLeft, Banknote, CalendarDays, CircleDollarSign, Pencil, Receipt, WalletCards, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { canEditReceivable, canRecordReceivablePayment } from '../constants/receivable.constants';
import { getReceivable } from '../services/receivable.service';
import type { Receivable } from '../types/receivable.types';
import { ReceivableCancelDialog } from './receivableCancelDialog';
import { ReceivableEditPanel } from './receivableEditPanel';
import { ReceivablePaymentPanel } from './ReceivablePaymentPanel';
import { ReceivablePayments } from './receivablePayments';
import { ReceivableDetailsSkeleton } from './receivableSkeletons';
import { ReceivableStatusBadge } from './receivableStatusBadge';

interface ReceivableDetailsContentProps {
  receivableId: string;
}

export function ReceivableDetailsContent({ receivableId }: ReceivableDetailsContentProps) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationReceivableDetails
      key={`${activeOrganization.id}:${receivableId}`}
      organizationId={activeOrganization.id}
      receivableId={receivableId}
    />
  );
}

function OrganizationReceivableDetails({
  organizationId,
  receivableId,
}: {
  organizationId: string;
  receivableId: string;
}) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let active = true;

    void getReceivable(organizationId, receivableId)
      .then((result) => {
        if (active) {
          setError(null);
          setReceivable(result);
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

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o recebível.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, receivableId, refreshVersion, router]);

  function applyReceivable(updated: Receivable): void {
    setReceivable(updated);
    setError(null);
  }

  if (error && !receivable) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link href="/receivables" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowLeft className="size-4" />
          Voltar para recebíveis
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>

          <Button variant="outline" onClick={() => setRefreshVersion((value) => value + 1)} className="mt-5">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!receivable) {
    return <ReceivableDetailsSkeleton />;
  }

  const editable = canEditReceivable(receivable.status);
  const canReceive = canRecordReceivablePayment(receivable.status) && receivable.balanceInCents > 0;

  const canCancel =
    receivable.status !== 'CANCELED' && receivable.status !== 'PAID' && receivable.receivedInCents === 0;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/receivables"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Voltar para recebíveis
      </Link>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{receivable.title}</h1>

            <ReceivableStatusBadge status={receivable.status} overdue={receivable.overdue} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {receivable.customerName} · vencimento {formatDate(receivable.dueAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" onClick={() => setEditing(true)} className="cursor-pointer">
              <Pencil className="size-4" />
              Editar
            </Button>
          )}

          {canReceive && (
            <Button onClick={() => setPaymentOpen(true)} className="cursor-pointer">
              <CircleDollarSign className="size-4" />
              Registrar pagamento
            </Button>
          )}

          {canCancel && (
            <Button variant="destructive" onClick={() => setCancelOpen(true)} className="cursor-pointer">
              <X className="size-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <Receipt className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Valor total</p>
              <p className="mt-1 text-xl font-semibold">{formatBrlCurrency(receivable.amountInCents)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
              <Banknote className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="mt-1 text-xl font-semibold text-success">{formatBrlCurrency(receivable.receivedInCents)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <WalletCards className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatBrlCurrency(receivable.balanceInCents)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <CalendarDays className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Vencimento</p>
              <p className="mt-1 text-xl font-semibold">{formatDate(receivable.dueAt)}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <ReceivablePayments receivable={receivable} onReceivableSaved={applyReceivable} />

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Origem</h2>

            <Link
              href={`/customers/${receivable.customerId}`}
              className="mt-4 block font-medium hover:text-primary hover:underline"
            >
              {receivable.customerName}
            </Link>

            <Link
              href={`/work-orders/${receivable.workOrderId}`}
              className="mt-3 block text-sm font-medium text-primary hover:underline"
            >
              Abrir ordem de serviço
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Observações</h2>

            <p className="mt-4 text-sm whitespace-pre-wrap text-muted-foreground">
              {receivable.notes ?? 'Nenhuma observação cadastrada.'}
            </p>
          </section>
        </div>
      </div>

      {receivable.cancellationReason && (
        <section className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="font-heading text-lg font-semibold text-destructive">Motivo do cancelamento</h2>

          <p className="mt-3 text-sm">{receivable.cancellationReason}</p>
        </section>
      )}

      {editing && (
        <ReceivableEditPanel receivable={receivable} onClose={() => setEditing(false)} onSaved={applyReceivable} />
      )}

      {paymentOpen && (
        <ReceivablePaymentPanel
          receivable={receivable}
          onClose={() => setPaymentOpen(false)}
          onSaved={applyReceivable}
        />
      )}

      {cancelOpen && (
        <ReceivableCancelDialog
          receivable={receivable}
          onClose={() => setCancelOpen(false)}
          onSaved={applyReceivable}
        />
      )}
    </div>
  );
}
