'use client';

import { LoaderCircle, LockKeyhole, Plus, RotateCcw, Save } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WORK_ORDER_CHECKLIST_TITLE_LIMIT } from '../../../constants/workOrderChecklist.constants';
import { workOrderChecklistFormSchema } from '../../../schemas/workOrderChecklist.schema';
import type { WorkOrderChecklistInput, WorkOrderChecklistItem } from '../../../types/workOrderChecklist.types';

interface WorkOrderChecklistFormProps {
  item: WorkOrderChecklistItem | null;
  saving: boolean;
  onCancel(): void;
  onSave(input: WorkOrderChecklistInput): Promise<void>;
}

export function WorkOrderChecklistForm({ item, saving, onCancel, onSave }: WorkOrderChecklistFormProps) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (saving || submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const parsed = workOrderChecklistFormSchema.safeParse({ title: String(data.get('title') ?? '') });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira o título do item.');

      return;
    }

    submittingRef.current = true;
    setError(null);

    try {
      await onSave(parsed.data);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <h3 className="font-heading text-lg font-semibold">{item ? 'Editar item' : 'Adicionar item ao checklist'}</h3>

      <fieldset disabled={saving} className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`${id}-title`}>Título do item *</Label>

          <Input
            ref={titleRef}
            id={`${id}-title`}
            name="title"
            defaultValue={item?.title ?? ''}
            maxLength={WORK_ORDER_CHECKLIST_TITLE_LIMIT}
            placeholder="Ex.: Conferir o funcionamento após o serviço"
            aria-invalid={error !== null}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-12"
          />

          {error && (
            <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {item === null ? (
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />O item será salvo como privado e
            pendente. Depois de revisar, você poderá exibi-lo no portal do cliente.
          </p>
        ) : item.completed ? (
          <p className="flex items-start gap-2 rounded-xl bg-warning-surface p-4 text-sm leading-relaxed text-warning">
            <RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Ao alterar o título, este item será reaberto. Confira a nova descrição antes de marcá-lo como concluído
            novamente.
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-11 cursor-pointer">
            Cancelar
          </Button>

          <Button type="submit" className="min-h-11 cursor-pointer">
            {saving ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : item ? (
              <Save aria-hidden="true" className="size-4" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            {item ? 'Salvar alterações' : 'Adicionar item'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
