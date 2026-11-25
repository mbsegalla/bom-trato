'use client';

import { ImageOff, LoaderCircle, RotateCcw, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { WORK_ORDER_PHOTO_STAGE_LABELS } from '../constants/workOrderPhoto.constants';
import { getPublicWorkOrderPhotoContent, getWorkOrderPhotoContent } from '../services/workOrderPhoto.service';
import { PublicWorkOrderError } from '../services/workOrderPortal.service';
import type { PublicWorkOrderPhoto, WorkOrderPhotoSource } from '../types/workOrderPhoto.types';

interface WorkOrderPhotoImageProps {
  photo: PublicWorkOrderPhoto;
  source: WorkOrderPhotoSource;
}

type PhotoImageState =
  | { kind: 'loading' }
  | { kind: 'ready'; url: string; scope: string }
  | { kind: 'error'; message: string; retryable: boolean };

export function WorkOrderPhotoImage({ photo, source }: WorkOrderPhotoImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, setState] = useState<PhotoImageState>({ kind: 'loading' });
  const [retry, setRetry] = useState(0);

  const organizationId = source.kind === 'private' ? source.organizationId : '';
  const workOrderId = source.kind === 'private' ? source.workOrderId : '';
  const token = source.kind === 'public' ? source.token : '';
  const publicPhoto = source.kind === 'public';
  const scope = `${organizationId}:${workOrderId}:${token}:${photo.id}`;
  const stageTitle =
    photo.stage === 'DURING' ? 'Durante o serviço' : `${WORK_ORDER_PHOTO_STAGE_LABELS[photo.stage]} do serviço`;
  const alt = photo.caption ?? `Foto ${stageTitle.toLocaleLowerCase('pt-BR')}`;

  useEffect(() => {
    let active = true;
    let started = false;
    let objectUrl: string | null = null;

    function load(): void {
      if (started || !active) {
        return;
      }

      started = true;

      const request = publicPhoto
        ? getPublicWorkOrderPhotoContent(token, photo.id)
        : getWorkOrderPhotoContent(organizationId, workOrderId, photo.id);

      void request
        .then((blob) => {
          if (!active) {
            return;
          }

          objectUrl = URL.createObjectURL(blob);

          setState({ kind: 'ready', url: objectUrl, scope });
        })
        .catch((cause: unknown) => {
          if (!active) {
            return;
          }

          setState({
            kind: 'error',
            message: cause instanceof Error ? cause.message : 'Não foi possível carregar esta foto.',
            retryable: !(cause instanceof PublicWorkOrderError) || cause.retryable,
          });
        });
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                load();
                observer?.disconnect();
              }
            },
            { rootMargin: '200px' },
          );

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    } else {
      load();
    }

    return () => {
      active = false;
      observer?.disconnect();

      if (objectUrl !== null) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [organizationId, photo.id, publicPhoto, retry, scope, token, workOrderId]);

  const ready = state.kind === 'ready' && state.scope === scope;

  return (
    <div ref={containerRef}>
      {ready ? (
        <>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            aria-label={`Ampliar foto: ${alt}`}
            className="group relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <Image
              src={state.url}
              alt={alt}
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform group-hover:scale-105"
              onError={() =>
                setState({ kind: 'error', message: 'Não foi possível exibir esta foto.', retryable: true })
              }
            />

            <span className="absolute right-3 bottom-3 rounded-full bg-background/90 p-2 text-foreground shadow-sm">
              <ZoomIn aria-hidden="true" className="size-4" />
            </span>
          </button>

          <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-auto rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl backdrop:bg-foreground/60 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 id={titleId} className="font-heading text-lg font-semibold">
                {stageTitle}
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => dialogRef.current?.close()}
                aria-label="Fechar foto"
                className="cursor-pointer"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>

            <Image
              src={state.url}
              alt={alt}
              width={photo.width}
              height={photo.height}
              unoptimized
              className="max-h-[65dvh] w-full rounded-lg object-contain"
            />

            {photo.caption && (
              <p className="mt-4 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{photo.caption}</p>
            )}
          </dialog>
        </>
      ) : state.kind === 'error' ? (
        <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 bg-muted/30 px-5 text-center">
          <ImageOff aria-hidden="true" className="size-7 text-muted-foreground" />
          <p role="status" className="text-xs text-muted-foreground">
            {state.message}
          </p>

          {state.retryable && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setState({ kind: 'loading' });
                setRetry((value) => value + 1);
              }}
              className="min-h-11 cursor-pointer"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Recarregar foto
            </Button>
          )}
        </div>
      ) : (
        <div role="status" className="flex aspect-4/3 items-center justify-center gap-2 bg-muted/30">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Carregando foto</span>
        </div>
      )}
    </div>
  );
}
