'use client';

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BriefcaseBusiness,
  CircleCheck,
  FileText,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Receipt,
  StickyNote,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { archiveCustomer, getCustomerOverview, restoreCustomer } from '../services/customer.service';
import type { CustomerOverview } from '../types/customer.types';
import { CustomerFormPanel } from './customerFormPanel';

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
        if (!active) {
          return;
        }

        setErrorState(null);

        setOverviewState({
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
    if (changingStatus) {
      return;
    }

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
    if (changingStatus) {
      return;
    }

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

  function handleSaved(): void {
    setRefreshVersion((value) => value + 1);
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

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{customer.name}</h1>

            {customer.archivedAt ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Arquivado
              </span>
            ) : (
              <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">Ativo</span>
            )}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">Cliente desde {formatDate(customer.createdAt)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!customer.archivedAt && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
              className="min-h-11 cursor-pointer rounded-xl px-4"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Button>
          )}

          {customer.archivedAt ? (
            <Button
              type="button"
              variant="outline"
              disabled={changingStatus}
              onClick={() => void handleRestore()}
              className="min-h-11 cursor-pointer rounded-xl px-4"
            >
              {changingStatus ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <ArchiveRestore aria-hidden="true" className="size-4" />
              )}
              Restaurar cliente
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={changingStatus}
              onClick={() => setConfirmArchive(true)}
              className="min-h-11 cursor-pointer rounded-xl px-4"
            >
              <Archive aria-hidden="true" className="size-4" />
              Arquivar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {actionError}
        </p>
      )}

      {confirmArchive && (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Arquivar {customer.name}?</p>

            <p className="mt-1 text-sm text-muted-foreground">
              O histórico será preservado e o cliente poderá ser restaurado depois.
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={changingStatus}
              onClick={() => setConfirmArchive(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={changingStatus}
              onClick={() => void handleArchive()}
              className="cursor-pointer"
            >
              {changingStatus ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Arquivando...
                </>
              ) : (
                'Arquivar cliente'
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <FileText aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Orçamentos</p>
              <p className="mt-1 text-2xl font-semibold">{summary.quoteCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <BriefcaseBusiness aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Ordens de serviço</p>
              <p className="mt-1 text-2xl font-semibold">{summary.workOrderCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
              <CircleCheck aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Serviços concluídos</p>
              <p className="mt-1 text-2xl font-semibold">{summary.completedWorkOrderCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <Receipt aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">A receber</p>

              <p className="mt-1 text-2xl font-semibold text-primary">
                {formatBrlCurrency(summary.pendingAmountInCents)}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-warning-surface text-warning">
              <WalletCards aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Em atraso</p>

              <p className="mt-1 text-2xl font-semibold">{formatBrlCurrency(summary.overdueAmountInCents)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
              <WalletCards aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Recebido</p>

              <p className="mt-1 text-2xl font-semibold text-success">
                {formatBrlCurrency(summary.receivedAmountInCents)}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Contato</h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <Mail aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>

                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="mt-1 block text-sm font-medium hover:text-primary">
                    {customer.email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Não informado</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>

                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="mt-1 block text-sm font-medium hover:text-primary">
                    {customer.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Não informado</p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Última atualização</p>

              <p className="mt-1 text-sm font-medium">{formatDate(customer.updatedAt)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <StickyNote aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Observações</h2>
          </div>

          {customer.notes ? (
            <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{customer.notes}</p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Nenhuma observação cadastrada para este cliente.</p>
          )}
        </section>
      </div>

      <p className="mt-5 text-right text-xs text-muted-foreground">
        Resumo atualizado em {formatDate(overview.generatedAt)}
      </p>

      {editing && (
        <CustomerFormPanel
          organizationId={organizationId}
          customer={customer}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
