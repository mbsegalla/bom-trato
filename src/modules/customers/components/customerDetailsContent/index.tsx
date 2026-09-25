'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { CustomerFormPanel } from '@/modules/customers/components/customerFormPanel';
import { archiveCustomer, getCustomerOverview, restoreCustomer } from '@/modules/customers/services/customer.service';
import type { CustomerOverview } from '@/modules/customers/types/customer.types';
import { formatDate } from '@/shared/formatters/date.formatter';

import { CustomerArchivedNotice } from './components/customerArchivedNotice';
import { CustomerContactCard } from './components/customerContactCard';
import { CustomerDetailsHeader } from './components/customerDetailsHeader';
import { CustomerMetrics } from './components/customerMetrics';
import { CustomerNotesCard } from './components/customerNotesCard';

interface CustomerDetailsContentProps {
  customerId: string;
}

interface CustomerOverviewState {
  requestKey: string;
  data: CustomerOverview;
}

interface CustomerOverviewErrorState {
  requestKey: string;
  message: string;
}

export function CustomerDetailsContent({ customerId }: CustomerDetailsContentProps) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationCustomerDetails
      key={`${activeOrganization.id}:${customerId}`}
      organizationId={activeOrganization.id}
      customerId={customerId}
    />
  );
}

function OrganizationCustomerDetails({ organizationId, customerId }: { organizationId: string; customerId: string }) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [overviewState, setOverviewState] = useState<CustomerOverviewState | null>(null);
  const [errorState, setErrorState] = useState<CustomerOverviewErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${customerId}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void getCustomerOverview(organizationId, customerId)
      .then((result) => {
        if (!active) return;

        setErrorState(null);
        setOverviewState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar o cliente.',
        });
      });

    return () => {
      active = false;
    };
  }, [customerId, organizationId, refreshVersion, requestKey, router]);

  const overview = overviewState?.requestKey === requestKey ? overviewState.data : null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  async function handleRestore(): Promise<void> {
    if (changingStatus) return;

    setChangingStatus(true);
    setActionError(null);

    try {
      await restoreCustomer(organizationId, customerId);

      setRefreshVersion((value) => value + 1);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível restaurar o cliente.');
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleArchive(): Promise<void> {
    if (changingStatus) return;

    setChangingStatus(true);
    setActionError(null);

    try {
      await archiveCustomer(organizationId, customerId);
      setConfirmArchive(false);
      setRefreshVersion((value) => value + 1);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível arquivar o cliente.');
    } finally {
      setChangingStatus(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para clientes
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshVersion((value) => value + 1)}
            className="mt-5 min-h-11 cursor-pointer rounded-xl"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!overview || !overview.customer) {
    return <DetailContentSkeleton label="Carregando cliente" />;
  }

  const { customer, summary } = overview;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para clientes
      </Link>

      <CustomerDetailsHeader
        customer={customer}
        changingStatus={changingStatus}
        onEdit={() => setEditing(true)}
        onArchive={() => setConfirmArchive(true)}
        onRestore={() => void handleRestore()}
      />

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {actionError}
        </p>
      )}

      {confirmArchive && (
        <CustomerArchivedNotice
          customerName={customer.name}
          changingStatus={changingStatus}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => void handleArchive()}
        />
      )}

      <CustomerMetrics summary={summary} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <CustomerContactCard customer={customer} />
        <CustomerNotesCard notes={customer.notes} />
      </div>

      <p className="mt-5 text-right text-xs text-muted-foreground">
        Resumo atualizado em {formatDate(overview.generatedAt)}
      </p>

      {editing && (
        <CustomerFormPanel
          organizationId={organizationId}
          customer={customer}
          onClose={() => setEditing(false)}
          onSaved={() => setRefreshVersion((value) => value + 1)}
        />
      )}
    </div>
  );
}
