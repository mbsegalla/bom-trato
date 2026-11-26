'use client';

import { Camera, CheckCircle2, Eye, EyeOff, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { SessionError } from '@/modules/auth/services/session.service';

import { WORK_ORDER_PHOTO_STAGE_LABELS } from '../../constants/workOrderPhoto.constants';
import { listWorkOrderPhotos } from '../../services/workOrderPhoto.service';
import {
  getManagementPortfolio,
  publishPortfolioPhoto,
  revokeManagementPortfolioConsent,
} from '../../services/workOrderPortfolio.service';
import type { WorkOrderPhoto } from '../../types/workOrderPhoto.types';
import type { ManagementPortfolioStatus } from '../../types/workOrderPortfolio.types';
import { WorkOrderPhotoImage } from '../workOrderPhotoImage';

interface WorkOrderPortfolioSectionProps {
  organizationId: string;
  workOrderId: string;
  status: string;
}

type PortfolioState =
  | { kind: 'loading' }
  | { kind: 'ready'; photos: WorkOrderPhoto[]; management: ManagementPortfolioStatus }
  | { kind: 'error'; message: string };

export function WorkOrderPortfolioSection({ organizationId, workOrderId, status }: WorkOrderPortfolioSectionProps) {
  const router = useRouter();
  const [state, setState] = useState<PortfolioState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [revocation, setRevocation] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      listWorkOrderPhotos(organizationId, workOrderId),
      getManagementPortfolio(organizationId, workOrderId),
    ])
      .then(([photos, management]) => {
        if (active) {
          setState({ kind: 'ready', photos, management });
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
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar o portfólio.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function refresh(): void {
    if (pending !== null) {
      return;
    }

    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  async function publish(photoId: string, visible: boolean): Promise<void> {
    if (state.kind !== 'ready' || pending !== null) {
      return;
    }

    setPending(photoId);

    try {
      const management = await publishPortfolioPhoto(organizationId, workOrderId, photoId, visible);
      setState((current) => (current.kind === 'ready' ? { ...current, management } : current));
      toast.success(visible ? 'Foto incluída no portfólio público.' : 'Foto retirada do portfólio público.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível atualizar o portfólio.');
      setRefreshVersion((version) => version + 1);
      setState({ kind: 'loading' });
    } finally {
      setPending(null);
    }
  }

  async function revokeConsent(photoId: string): Promise<void> {
    if (state.kind !== 'ready' || pending !== null) {
      return;
    }

    setPending(photoId);

    try {
      const management = await revokeManagementPortfolioConsent(organizationId, workOrderId, photoId);
      setState((current) => (current.kind === 'ready' ? { ...current, management } : current));
      toast.success('Autorização retirada. A foto não poderá mais ser publicada.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível retirar a autorização.');
      setState({ kind: 'loading' });
      setRefreshVersion((version) => version + 1);
    } finally {
      setPending(null);
      setRevocation(null);
    }
  }

  const candidates =
    state.kind === 'ready' ? state.photos.filter((photo) => photo.stage === 'BEFORE' || photo.stage === 'AFTER') : [];

  const statuses =
    state.kind === 'ready'
      ? new Map(state.management.photos.map((photo) => [photo.id, photo]))
      : new Map<string, ManagementPortfolioStatus['photos'][number]>();

  return (
    <section className="min-w-0 border-t border-border pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Camera aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Portfólio público</h2>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Selecione fotos reais do antes e depois para a vitrine da empresa. Cada foto exige a autorização explícita
            do cliente pelo portal, seguida da sua decisão de publicar.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={pending !== null || state.kind === 'loading'}
          onClick={refresh}
          className="min-h-11 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar portfólio
        </Button>
      </div>

      {state.kind === 'loading' && (
        <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando as autorizações...
        </p>
      )}

      {state.kind === 'error' && (
        <p role="alert" className="mt-6 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {state.kind === 'ready' && candidates.length === 0 && (
        <p className="mt-5 rounded-xl bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
          Nenhuma foto de antes ou depois foi registrada nesta ordem. Adicione fotos e permita a exibição no Portal do
          Cliente para solicitar autorização de publicação.
        </p>
      )}

      {state.kind === 'ready' && candidates.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((photo) => {
            const item = statuses.get(photo.id);
            const published = item?.published ?? false;
            const consented = item?.consented ?? false;
            const eligible = status === 'COMPLETED' && photo.visibleInPortal && consented;

            return (
              <article key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <WorkOrderPhotoImage photo={photo} source={{ kind: 'private', organizationId, workOrderId }} />

                <div className="space-y-3 p-4">
                  <p className="font-medium">{WORK_ORDER_PHOTO_STAGE_LABELS[photo.stage]} do serviço</p>

                  {consented ? (
                    <p className="flex items-center gap-2 text-xs text-success">
                      <ShieldCheck aria-hidden="true" className="size-4" />
                      Autorização registrada pelo cliente
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aguardando autorização do cliente</p>
                  )}

                  {!photo.visibleInPortal && (
                    <p className="text-xs text-muted-foreground">
                      Disponibilize a foto no portal para solicitar autorização.
                    </p>
                  )}

                  <Button
                    type="button"
                    variant={published ? 'outline' : 'default'}
                    disabled={pending !== null || (!published && !eligible)}
                    onClick={() => void publish(photo.id, !published)}
                    className="min-h-11 w-full cursor-pointer"
                  >
                    {pending === photo.id ? (
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    ) : published ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                    {published ? 'Retirar da vitrine' : 'Publicar na vitrine'}
                  </Button>

                  {consented && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pending !== null}
                      onClick={() => setRevocation(photo.id)}
                      className="min-h-10 w-full cursor-pointer text-destructive hover:text-destructive"
                    >
                      Revogar autorização do cliente
                    </Button>
                  )}

                  {published && (
                    <p className="flex items-center gap-2 text-xs text-primary">
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      Exibição pública habilitada
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {revocation !== null && (
        <ConfirmationDialog
          title="Revogar autorização de publicação?"
          description="A foto deixará de aparecer no portfólio público e não poderá ser republicada sem nova autorização do cliente."
          confirmLabel="Revogar autorização"
          destructive
          loading={pending !== null}
          onCancel={() => setRevocation(null)}
          onConfirm={() => void revokeConsent(revocation)}
        />
      )}
    </section>
  );
}
