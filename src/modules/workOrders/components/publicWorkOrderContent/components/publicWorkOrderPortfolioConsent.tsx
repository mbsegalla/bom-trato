'use client';

import { Camera, CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { WORK_ORDER_PHOTO_STAGE_LABELS } from '../../../constants/workOrderPhoto.constants';
import {
  consentPortfolioPhotos,
  getPortalPortfolioStatus,
  revokePortfolioPhoto,
} from '../../../services/workOrderPortfolio.service';
import type { PortalPortfolioStatus } from '../../../types/workOrderPortfolio.types';
import type { PublicWorkOrderPhoto } from '../../../types/workOrderPhoto.types';
import { WorkOrderPhotoImage } from '../../workOrderPhotoImage';

interface PublicWorkOrderPortfolioConsentProps {
  photos: PublicWorkOrderPhoto[];
  token: string;
  completed: boolean;
}

type ConsentState =
  | { kind: 'loading' }
  | { kind: 'ready'; status: PortalPortfolioStatus }
  | { kind: 'error'; message: string };

export function PublicWorkOrderPortfolioConsent({ photos, token, completed }: PublicWorkOrderPortfolioConsentProps) {
  const [state, setState] = useState<ConsentState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [signerName, setSignerName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!completed || photos.length === 0) {
      return;
    }

    let active = true;

    void getPortalPortfolioStatus(token)
      .then((status) => {
        if (active) {
          setState({ kind: 'ready', status });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            kind: 'error',
            message: cause instanceof Error ? cause.message : 'Não foi possível consultar as autorizações.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [completed, photos.length, refreshVersion, token]);

  if (!completed) {
    return null;
  }

  const available = photos.filter((photo) => photo.stage === 'BEFORE' || photo.stage === 'AFTER');

  if (available.length === 0) {
    return null;
  }

  function refresh(): void {
    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  function toggle(id: string, checked: boolean): void {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((photoId) => photoId !== id),
    );
  }

  async function authorize(): Promise<void> {
    if (pending || state.kind !== 'ready' || !state.status.canAuthorize || !confirmed) {
      return;
    }

    setPending(true);

    try {
      const status = await consentPortfolioPhotos(token, {
        photoIds: selectedIds,
        signerName,
        consent: true,
      });

      setState({ kind: 'ready', status });
      setSelectedIds([]);
      setSignerName('');
      setConfirmed(false);
      toast.success('Autorização de publicação registrada.');
    } catch (cause: unknown) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível registrar a autorização.');
    } finally {
      setPending(false);
    }
  }

  async function revoke(photoId: string): Promise<void> {
    if (pending || state.kind !== 'ready') {
      return;
    }

    setPending(true);

    try {
      const status = await revokePortfolioPhoto(token, photoId);
      setState({ kind: 'ready', status });
      setSelectedIds((current) => current.filter((id) => id !== photoId));
      toast.success('Autorização retirada. A foto não pode mais ser publicada.');
    } catch (cause: unknown) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível retirar a autorização.');
    } finally {
      setPending(false);
    }
  }

  const statuses = state.kind === 'ready' ? new Map(state.status.photos.map((photo) => [photo.id, photo])) : null;
  const unauthorized = available.filter((photo) => !statuses?.get(photo.id)?.consented);

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Camera aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-heading text-xl font-semibold">Autorizar fotos para o portfólio</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        A empresa só poderá mostrar fotos do seu atendimento em sua vitrine pública com sua autorização expressa.
        O link do atendimento continua privado; apenas as imagens escolhidas poderão ser publicadas.
      </p>

      {state.kind === 'loading' && (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando autorizações...
        </p>
      )}

      {state.kind === 'error' && (
        <div className="mt-5 space-y-3">
          <p role="alert" className="text-sm text-destructive">{state.message}</p>
          <Button type="button" variant="outline" onClick={refresh}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {state.kind === 'ready' && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((photo, index) => {
              const consented = statuses?.get(photo.id)?.consented ?? false;

              return (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-border">
                  <WorkOrderPhotoImage photo={photo} source={{ kind: 'public', token }} />

                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium">
                      Foto {index + 1} · {WORK_ORDER_PHOTO_STAGE_LABELS[photo.stage]}
                    </p>

                    {consented ? (
                      <>
                        <p className="flex items-center gap-2 text-xs text-success">
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          Autorizada para publicação
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pending}
                          onClick={() => void revoke(photo.id)}
                          className="min-h-10 w-full cursor-pointer"
                        >
                          Retirar autorização
                        </Button>
                      </>
                    ) : (
                      <label className="flex min-h-10 items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(photo.id)}
                          disabled={pending || !state.status.canAuthorize}
                          onChange={(event) => toggle(photo.id, event.target.checked)}
                          className="size-4 accent-primary"
                        />
                        Autorizo a publicação desta foto
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {unauthorized.length > 0 && state.status.canAuthorize && (
            <div className="mt-6 space-y-4 border-t border-border pt-5">
              <div>
                <label htmlFor="portfolio-signer-name" className="text-sm font-medium">
                  Seu nome para o registro da autorização
                </label>
                <Input
                  id="portfolio-signer-name"
                  value={signerName}
                  maxLength={100}
                  autoComplete="name"
                  disabled={pending}
                  onChange={(event) => setSignerName(event.target.value)}
                  className="mt-2"
                />
              </div>

              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={pending}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <span>
                  Autorizo expressamente a divulgação pública das fotografias selecionadas do meu atendimento no
                  portfólio da empresa, sem informações pessoais. Sei que posso retirar esta autorização.
                </span>
              </label>

              <Button
                type="button"
                disabled={pending || selectedIds.length === 0 || !confirmed || signerName.trim().length < 2}
                onClick={() => void authorize()}
                className="min-h-11 cursor-pointer"
              >
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck aria-hidden="true" className="size-4" />
                )}
                Registrar autorização
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Este registro é feito pelo portador do link privado. Para retirar a autorização depois que o link
                expirar, solicite à empresa a remoção da fotografia.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
