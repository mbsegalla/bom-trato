'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { CatalogServiceFormPanel } from '@/modules/serviceCatalog/components/catalogServiceFormPanel';
import {
  archiveCatalogService,
  getCatalogService,
  restoreCatalogService,
} from '@/modules/serviceCatalog/services/catalogService.service';
import type { CatalogService } from '@/modules/serviceCatalog/types/catalogService.types';

import { CatalogServiceArchiveNotice } from './components/catalogServiceArchiveNotice';
import { CatalogServiceDescription } from './components/catalogServiceDescription';
import { CatalogServiceDetailsHeader } from './components/catalogServiceDetailsHeader';
import { CatalogServiceMetrics } from './components/catalogServiceMetrics';

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
        if (!active) return;

        setErrorState(null);
        setServiceState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

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
    if (changingStatus) return;

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
    if (changingStatus) return;

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

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link
          href="/services-catalog"
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

  if (!service) return <DetailContentSkeleton label="Carregando serviço" />;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/services-catalog"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para o catálogo
      </Link>

      <CatalogServiceDetailsHeader
        service={service}
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
        <CatalogServiceArchiveNotice
          name={service.name}
          changingStatus={changingStatus}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => void handleArchive()}
        />
      )}

      <CatalogServiceMetrics service={service} />

      <CatalogServiceDescription description={service.description} />

      {editing && (
        <CatalogServiceFormPanel
          organizationId={organizationId}
          service={service}
          onClose={() => setEditing(false)}
          onSaved={() => setRefreshVersion((value) => value + 1)}
        />
      )}
    </div>
  );
}
