'use client';

import { LoaderCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel(): void;
  onConfirm(): void;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-foreground/20 px-5 backdrop-blur-sm">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirmation-title" className="font-heading text-xl font-semibold">
              {title}
            </h2>

            <p id="confirmation-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={loading}
            onClick={onCancel}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={onCancel} className="cursor-pointer">
            Cancelar
          </Button>

          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={loading}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}

            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
