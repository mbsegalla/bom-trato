'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { ReceivableCancelDialog } from '@/modules/receivables/components/receivableCancelDialog';
import { ReceivableEditPanel } from '@/modules/receivables/components/receivableEditPanel';
import { ReceivablePaymentPanel } from '@/modules/receivables/components/ReceivablePaymentPanel';
import { ReceivablePayments } from '@/modules/receivables/components/receivablePayments';
import { ReceivableDetailsSkeleton } from '@/modules/receivables/components/receivableSkeletons';
import { canEditReceivable, canRecordReceivablePayment } from '@/modules/receivables/constants/receivable.constants';
import { getReceivable } from '@/modules/receivables/services/receivable.service';
import type { Receivable } from '@/modules/receivables/types/receivable.types';

import { ReceivableContextCards } from './components/receivableContextCards';
import { ReceivableDetailsHeader } from './components/receivableDetailsHeader';
import { ReceivableMetrics } from './components/receivableMetrics';

interface OrganizationReceivableDetailsProps {
  organizationId: string;
  receivableId: string;
}

export function ReceivableDetailsContent({ receivableId }: { receivableId: string }) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationReceivableDetails
      key={`${activeOrganization.id}:${receivableId}`}
      organizationId={activeOrganization.id}
      receivableId={receivableId}
    />
  );
}

function OrganizationReceivableDetails({ organizationId, receivableId }: OrganizationReceivableDetailsProps) {
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
        if (!active) return;

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
        <Link
          href="/receivables"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para recebíveis
        </Link>

        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>

          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshVersion((value) => value + 1)}
            className="mt-5 cursor-pointer"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!receivable) return <ReceivableDetailsSkeleton />;

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
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para recebíveis
      </Link>

      <ReceivableDetailsHeader
        receivable={receivable}
        editable={editable}
        canReceive={canReceive}
        canCancel={canCancel}
        onEdit={() => setEditing(true)}
        onReceive={() => setPaymentOpen(true)}
        onCancel={() => setCancelOpen(true)}
      />

      {error && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <ReceivableMetrics receivable={receivable} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ReceivablePayments receivable={receivable} onReceivableSaved={applyReceivable} />
        <ReceivableContextCards receivable={receivable} />
      </div>

      {receivable.cancellationReason && (
        <section className="mt-8 border-l-2 border-destructive bg-destructive/5 px-4 py-3">
          <h2 className="font-heading font-semibold text-destructive">Motivo do cancelamento</h2>
          <p className="mt-2 text-sm leading-relaxed">{receivable.cancellationReason}</p>
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
