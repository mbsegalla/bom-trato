'use client';

import { ImageIcon, LoaderCircle, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { SessionError } from '@/modules/auth/services/session.service';

import { removeBusinessLogo, uploadBusinessLogo } from '../../../services/business.service';
import type { BusinessProfile } from '../../../types/business.types';

interface BusinessLogoFieldProps {
  profile: BusinessProfile;
  owner: boolean;
  disabled?: boolean;
  onChanged(profile: BusinessProfile): void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function BusinessLogoField({ profile, owner, disabled = false, onChanged }: BusinessLogoFieldProps) {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmation, setRemoveConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const logoUrl = previewUrl ?? profile.logoUrl;

  function selectFile(file: File | undefined): void {
    setError(null);

    if (!file) {
      return;
    }

    if (!allowedMimeTypes.has(file.type)) {
      setError('Use uma imagem PNG, JPEG ou WEBP.');

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('A imagem deve ter no máximo 2 MB.');

      return;
    }

    setSelectedFile(file);
  }

  async function upload(): Promise<void> {
    if (!selectedFile || uploading || disabled) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const updated = await uploadBusinessLogo(profile.id, selectedFile);

      setSelectedFile(null);

      onChanged(updated);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a logo.');
    } finally {
      setUploading(false);
    }
  }

  async function remove(): Promise<void> {
    if (removing || disabled) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      const updated = await removeBusinessLogo(profile.id);

      setRemoveConfirmation(false);

      onChanged(updated);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível remover a logo.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/30">
            {logoUrl ? (
              <Image src={logoUrl} alt={`Logo de ${profile.name}`} className="h-full w-full object-contain p-2" />
            ) : (
              <ImageIcon aria-hidden="true" className="size-9 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-semibold">Logo do negócio</h3>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use PNG, JPEG ou WEBP de até 2 MB. A imagem será otimizada automaticamente.
            </p>

            {selectedFile && <p className="mt-2 truncate text-sm font-medium">{selectedFile.name}</p>}

            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {owner && (
              <div className="mt-4 flex flex-wrap gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    selectFile(event.currentTarget.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || uploading || removing}
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer"
                >
                  <Upload aria-hidden="true" className="size-4" />

                  {profile.logoUrl || selectedFile ? 'Escolher outra' : 'Selecionar logo'}
                </Button>

                {selectedFile && (
                  <>
                    <Button
                      type="button"
                      disabled={disabled || uploading}
                      onClick={() => void upload()}
                      className="cursor-pointer"
                    >
                      {uploading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                      Salvar logo
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      disabled={uploading}
                      onClick={() => setSelectedFile(null)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                  </>
                )}

                {!selectedFile && profile.logoUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={disabled || removing}
                    onClick={() => setRemoveConfirmation(true)}
                    className="cursor-pointer"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Remover
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {removeConfirmation && (
        <ConfirmationDialog
          title="Remover logo?"
          description="A logo deixará de aparecer nas informações do negócio e poderá ser adicionada novamente depois."
          confirmLabel="Remover logo"
          destructive
          loading={removing}
          onCancel={() => setRemoveConfirmation(false)}
          onConfirm={() => void remove()}
        />
      )}
    </>
  );
}
