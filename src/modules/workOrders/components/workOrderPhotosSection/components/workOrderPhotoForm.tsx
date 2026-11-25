'use client';

import { ImagePlus, LoaderCircle, LockKeyhole, Save, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionError } from '@/modules/auth/services/session.service';

import {
  WORK_ORDER_PHOTO_CAPTION_LIMIT,
  WORK_ORDER_PHOTO_MIME_TYPES,
  WORK_ORDER_PHOTO_STAGE_LABELS,
  WORK_ORDER_PHOTO_STAGES,
} from '../../../constants/workOrderPhoto.constants';
import { workOrderPhotoFormSchema, workOrderPhotoStageSchema } from '../../../schemas/workOrderPhoto.schema';
import { validateWorkOrderPhotoFile } from '../../../services/workOrderPhoto.service';
import type { WorkOrderPhoto, WorkOrderPhotoInput, WorkOrderPhotoStage } from '../../../types/workOrderPhoto.types';

interface WorkOrderPhotoFormProps {
  photo: WorkOrderPhoto | null;
  saving: boolean;
  onCancel(): void;
  onSave(input: WorkOrderPhotoInput, file: File | null): Promise<void>;
}

export function WorkOrderPhotoForm({ photo, saving, onCancel, onSave }: WorkOrderPhotoFormProps) {
  const router = useRouter();
  const id = useId();
  const activeRef = useRef(true);
  const submittingRef = useRef(false);
  const [stage, setStage] = useState<WorkOrderPhotoStage>(photo?.stage ?? 'BEFORE');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectFile(input: HTMLInputElement): void {
    const selected = input.files?.[0];

    input.value = '';
    setError(null);

    if (!selected) {
      return;
    }

    const validationError = validateWorkOrderPhotoFile(selected);

    if (validationError !== null) {
      setFile(null);
      setPreviewUrl(null);
      setError(validationError);

      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (saving || submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const parsed = workOrderPhotoFormSchema.safeParse({
      stage,
      caption: String(data.get('caption') ?? ''),
      visibleInPortal: photo !== null && data.get('visibleInPortal') === 'on',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados da foto.');

      return;
    }

    if (photo === null && file === null) {
      setError('Selecione uma foto para enviar.');

      return;
    }

    submittingRef.current = true;
    setError(null);

    try {
      await onSave(parsed.data, file);
    } catch (cause: unknown) {
      if (!activeRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a foto.');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <h3 className="font-heading text-lg font-semibold">{photo ? 'Editar foto' : 'Adicionar foto'}</h3>

      <fieldset disabled={saving} className="mt-5 space-y-5">
        {photo === null && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative flex aspect-4/3 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 sm:w-40">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Prévia da foto selecionada"
                  fill
                  unoptimized
                  sizes="(min-width: 640px) 160px, 100vw"
                  className="object-contain"
                />
              ) : (
                <ImagePlus aria-hidden="true" className="size-8 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor={`${id}-file`}>Foto *</Label>
              <Input
                id={`${id}-file`}
                type="file"
                accept={WORK_ORDER_PHOTO_MIME_TYPES.join(',')}
                aria-describedby={`${id}-file-help`}
                onChange={(event) => selectFile(event.currentTarget)}
                className="h-12 cursor-pointer py-2.5"
              />

              <p id={`${id}-file-help`} className="text-xs leading-relaxed text-muted-foreground">
                JPEG, PNG ou WebP de até 10 MB. Envie uma foto por vez.
              </p>

              {file && <p className="truncate text-sm font-medium">{file.name}</p>}
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor={`${id}-stage`}>Etapa *</Label>
            <Select
              value={stage}
              onValueChange={(value) => {
                const parsed = workOrderPhotoStageSchema.safeParse(value);

                if (parsed.success) {
                  setStage(parsed.data);
                }
              }}
            >
              <SelectTrigger id={`${id}-stage`} className="h-12 cursor-pointer">
                <SelectValue>{WORK_ORDER_PHOTO_STAGE_LABELS[stage]}</SelectValue>
              </SelectTrigger>

              <SelectContent>
                {WORK_ORDER_PHOTO_STAGES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {WORK_ORDER_PHOTO_STAGE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-caption`}>Legenda</Label>
            <Input
              id={`${id}-caption`}
              name="caption"
              defaultValue={photo?.caption ?? ''}
              maxLength={WORK_ORDER_PHOTO_CAPTION_LIMIT}
              placeholder="Descreva o que esta foto registra"
              className="h-12"
            />
          </div>
        </div>

        {photo ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
            <input
              type="checkbox"
              name="visibleInPortal"
              defaultChecked={photo.visibleInPortal}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
            />

            <span>
              <span className="block text-sm font-medium">Exibir no portal do cliente</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                A foto e a legenda poderão ser vistas por quem tiver um link de acompanhamento válido.
              </span>
            </span>
          </label>
        ) : (
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />A foto será salva como privada. Depois
            de revisar, você poderá exibi-la no portal do cliente.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-11 cursor-pointer">
            Cancelar
          </Button>

          <Button type="submit" className="min-h-11 cursor-pointer">
            {saving ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : photo ? (
              <Save aria-hidden="true" className="size-4" />
            ) : (
              <Upload aria-hidden="true" className="size-4" />
            )}
            {photo ? 'Salvar alterações' : 'Enviar foto'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
