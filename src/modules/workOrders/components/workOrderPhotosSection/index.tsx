'use client';

import { Camera, Eye, ImagePlus, LoaderCircle, LockKeyhole, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import {
  WORK_ORDER_PHOTO_LIMIT,
  WORK_ORDER_PHOTO_STAGE_LABELS,
  WORK_ORDER_PHOTO_STAGES,
} from '../../constants/workOrderPhoto.constants';
import {
  deleteWorkOrderPhoto,
  listWorkOrderPhotos,
  updateWorkOrderPhoto,
  uploadWorkOrderPhoto,
} from '../../services/workOrderPhoto.service';
import type { WorkOrderPhoto, WorkOrderPhotoInput } from '../../types/workOrderPhoto.types';
import { WorkOrderPhotoImage } from '../workOrderPhotoImage';
import { WorkOrderPhotoForm } from './components/workOrderPhotoForm';

interface WorkOrderPhotosSectionProps {
  organizationId: string;
  workOrderId: string;
}

type PhotosState =
  { kind: 'loading' } | { kind: 'ready'; photos: WorkOrderPhoto[] } | { kind: 'error'; message: string };

type PhotoFormState = { kind: 'upload' } | { kind: 'edit'; photo: WorkOrderPhoto };

export function WorkOrderPhotosSection({ organizationId, workOrderId }: WorkOrderPhotosSectionProps) {
  const router = useRouter();
  const activeRef = useRef(true);
  const pendingRef = useRef(false);
  const [state, setState] = useState<PhotosState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [form, setForm] = useState<PhotoFormState | null>(null);
  const [removal, setRemoval] = useState<WorkOrderPhoto | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void listWorkOrderPhotos(organizationId, workOrderId)
      .then((photos) => {
        if (active) {
          setState({ kind: 'ready', photos });
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
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar as fotos.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function refresh(): void {
    if (pendingRef.current) {
      return;
    }

    setForm(null);
    setRemoval(null);
    setActionError(null);
    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  async function save(input: WorkOrderPhotoInput, file: File | null): Promise<void> {
    if (pendingRef.current || form === null || state.kind !== 'ready') {
      return;
    }

    if (form.kind === 'upload' && file === null) {
      throw new Error('Selecione uma foto para enviar.');
    }

    pendingRef.current = true;
    setPending(true);
    setActionError(null);

    try {
      const photo =
        form.kind === 'upload' && file !== null
          ? await uploadWorkOrderPhoto(organizationId, workOrderId, file, input)
          : form.kind === 'edit'
            ? await updateWorkOrderPhoto(organizationId, workOrderId, form.photo, input)
            : null;

      if (!activeRef.current || photo === null) {
        return;
      }

      setState((current) =>
        current.kind !== 'ready'
          ? current
          : {
              kind: 'ready',
              photos:
                form.kind === 'upload'
                  ? [...current.photos, photo]
                  : current.photos.map((item) => (item.id === photo.id ? photo : item)),
            },
      );
      setForm(null);
      toast.success(form.kind === 'upload' ? 'Foto salva como privada.' : 'Foto atualizada com sucesso.');
    } finally {
      pendingRef.current = false;

      if (activeRef.current) {
        setPending(false);
      }
    }
  }

  async function remove(): Promise<void> {
    if (pendingRef.current || removal === null) {
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setActionError(null);

    try {
      await deleteWorkOrderPhoto(organizationId, workOrderId, removal);

      if (!activeRef.current) {
        return;
      }

      setState((current) =>
        current.kind === 'ready'
          ? { kind: 'ready', photos: current.photos.filter((photo) => photo.id !== removal.id) }
          : current,
      );
      setRemoval(null);
      toast.success('Foto removida com sucesso.');
    } catch (cause: unknown) {
      if (!activeRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setRemoval(null);
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível remover a foto.');
    } finally {
      pendingRef.current = false;

      if (activeRef.current) {
        setPending(false);
      }
    }
  }

  const total = state.kind === 'ready' ? state.photos.length : 0;

  return (
    <section className="border-t border-border pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <Camera aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Fotos do serviço</h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Registre o antes, durante e depois. Escolha quais fotos o cliente poderá acompanhar.
          </p>

          {state.kind === 'ready' && (
            <p className="mt-2 text-xs text-muted-foreground">
              {total} de {WORK_ORDER_PHOTO_LIMIT} fotos
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || state.kind === 'loading'}
            onClick={refresh}
            className="min-h-11 cursor-pointer"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Atualizar fotos
          </Button>

          <Button
            type="button"
            disabled={pending || state.kind !== 'ready' || total >= WORK_ORDER_PHOTO_LIMIT || form !== null}
            onClick={() => setForm({ kind: 'upload' })}
            className="min-h-11 cursor-pointer"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            Adicionar foto
          </Button>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {form && (
        <WorkOrderPhotoForm
          key={form.kind === 'edit' ? `${form.photo.id}:${form.photo.version}` : 'upload'}
          photo={form.kind === 'edit' ? form.photo : null}
          saving={pending}
          onCancel={() => setForm(null)}
          onSave={save}
        />
      )}

      {state.kind === 'loading' ? (
        <div role="status" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-muted/30 p-10">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando fotos...</span>
        </div>
      ) : state.kind === 'error' ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
          <Camera aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhuma foto adicionada</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece registrando as condições e os detalhes do serviço.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {WORK_ORDER_PHOTO_STAGES.map((stage) => {
            const photos = state.photos.filter((photo) => photo.stage === stage);

            if (photos.length === 0) {
              return null;
            }

            return (
              <div key={stage}>
                <h3 className="mb-4 font-heading text-lg font-semibold">{WORK_ORDER_PHOTO_STAGE_LABELS[stage]}</h3>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <article key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      <WorkOrderPhotoImage photo={photo} source={{ kind: 'private', organizationId, workOrderId }} />

                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {photo.visibleInPortal ? (
                            <Eye aria-hidden="true" className="size-4 text-primary" />
                          ) : (
                            <LockKeyhole aria-hidden="true" className="size-4 text-muted-foreground" />
                          )}
                          {photo.visibleInPortal ? 'Visível no portal do cliente' : 'Privada'}
                        </div>

                        {photo.caption && (
                          <p className="mt-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                            {photo.caption}
                          </p>
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                          Adicionada em {formatDateTime(photo.createdAt)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={pending || form !== null}
                            onClick={() => setForm({ kind: 'edit', photo })}
                            className="min-h-11 cursor-pointer"
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            disabled={pending || form !== null}
                            onClick={() => setRemoval(photo)}
                            className="min-h-11 cursor-pointer text-destructive hover:text-destructive"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {removal && (
        <ConfirmationDialog
          title="Remover foto?"
          description="Esta foto será removida da ordem de serviço e deixará de estar disponível no portal do cliente. Esta ação não pode ser desfeita."
          confirmLabel="Remover foto"
          destructive
          loading={pending}
          onCancel={() => setRemoval(null)}
          onConfirm={() => void remove()}
        />
      )}
    </section>
  );
}
