'use client';

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Banknote,
  CalendarDays,
  LoaderCircle,
  Pencil,
  Ruler,
  StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { getServiceUnitLabel } from '../constants/catalogService.constants';
import { archiveCatalogService, getCatalogService, restoreCatalogService } from '../services/catalogService.service';
import type { CatalogService } from '../types/catalogService.types';
import { CatalogServiceFormPanel } from './catalogServiceFormPanel';

interface CatalogServiceDetailsContentProps {
  serviceId: string;
}

interface CatalogServiceState {
  requestKey: string;
  data: CatalogService;
}

interface CatalogServiceErrorState {
  requestKey: string;
  message: string;
}

export function CatalogServiceDetailsContent({ serviceId }: CatalogServiceDetailsContentProps) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationCatalogServiceDetails
      key={`${activeOrganization.id}:${serviceId}`}
      organizationId={activeOrganization.id}
      serviceId={serviceId}
    />
  );
}

function OrganizationCatalogServiceDetails({
  organizationId,
  serviceId,
}: {
  organizationId: string;
  serviceId: string;
}) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [serviceState, setServiceState] = useState<CatalogServiceState | null>(null);
  const [errorState, setErrorState] = useState<CatalogServiceErrorState | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${serviceId}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void getCatalogService(organizationId, serviceId)
      .then((result) => {
        if (!active) {
          return;
        }

        setErrorState(null);

        setServiceState({
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
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar o serviço.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, requestKey, router, serviceId]);

  const service = serviceState?.requestKey === requestKey ? serviceState.data : null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  async function handleRestore(): Promise<void> {
    if (changingStatus) {
      return;
    }

    setChangingStatus(true);
    setActionError(null);

    try {
      await restoreCatalogService(organizationId, serviceId);

      setRefreshVersion((value) => value + 1);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível restaurar o serviço.');
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
      await archiveCatalogService(organizationId, serviceId);

      setConfirmArchive(false);
      setRefreshVersion((value) => value + 1);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível arquivar o serviço.');
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
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para o catálogo
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

  if (!service) {
    return (
      <div aria-busy="true" className="flex min-h-[55vh] flex-col items-center justify-center">
        <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-primary" />

        <p className="mt-4 text-sm text-muted-foreground">Carregando serviço...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para o catálogo
      </Link>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{service.name}</h1>

            {service.archivedAt ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Arquivado
              </span>
            ) : (
              <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">Ativo</span>
            )}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">Serviço cadastrado em {formatDate(service.createdAt)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!service.archivedAt && (
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

          {service.archivedAt ? (
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
              Restaurar serviço
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
            <p className="font-medium">Arquivar {service.name}?</p>

            <p className="mt-1 text-sm text-muted-foreground">
              O serviço deixará de aparecer entre os itens ativos, mas poderá ser restaurado depois.
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
                'Arquivar serviço'
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <Banknote aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Valor base</p>

              <p className="mt-1 text-2xl font-semibold text-primary">{formatBrlCurrency(service.amountInCents)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <Ruler aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Unidade</p>

              <p className="mt-1 text-lg font-semibold">{getServiceUnitLabel(service.unit)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <CalendarDays aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Última atualização</p>

              <p className="mt-1 text-lg font-semibold">{formatDate(service.updatedAt)}</p>
            </div>
          </div>
        </article>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <StickyNote aria-hidden="true" className="size-5 text-primary" />

          <h2 className="font-heading text-lg font-semibold">Descrição</h2>
        </div>

        {service.description ? (
          <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {service.description}
          </p>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Nenhuma descrição cadastrada para este serviço.</p>
        )}
      </section>

      {editing && (
        <CatalogServiceFormPanel
          organizationId={organizationId}
          service={service}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
