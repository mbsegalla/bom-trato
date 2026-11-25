import { ArrowDown, ArrowUp, Eye, LockKeyhole, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import type { WorkOrderChecklistItem } from '../../../types/workOrderChecklist.types';

interface WorkOrderChecklistItemRowProps {
  item: WorkOrderChecklistItem;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onToggleCompleted(): void;
  onToggleVisibility(): void;
  onEdit(): void;
  onRemove(): void;
  onMove(direction: -1 | 1): void;
}

export function WorkOrderChecklistItemRow({
  item,
  first,
  last,
  disabled,
  onToggleCompleted,
  onToggleVisibility,
  onEdit,
  onRemove,
  onMove,
}: WorkOrderChecklistItemRowProps) {
  return (
    <li className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={item.completed}
              disabled={disabled}
              onChange={onToggleCompleted}
              aria-label={`${item.completed ? 'Reabrir' : 'Concluir'} item: ${item.title}`}
              className="mt-1 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
            />

            <span
              className={cn(
                'min-w-0 pt-0.5 text-sm leading-relaxed font-medium wrap-break-word',
                item.completed && 'text-muted-foreground line-through',
              )}
            >
              {item.title}
            </span>
          </label>

          <div className="mt-1 ml-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              {item.visibleInPortal ? (
                <Eye aria-hidden="true" className="size-3.5 text-primary" />
              ) : (
                <LockKeyhole aria-hidden="true" className="size-3.5" />
              )}
              {item.visibleInPortal ? 'Visível no portal do cliente' : 'Privado'}
            </span>

            <span>
              {item.completed && item.completedAt
                ? `Concluído em ${formatDateTime(item.completedAt)}`
                : item.completed
                  ? 'Concluído'
                  : 'Pendente'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || first}
            onClick={() => onMove(-1)}
            aria-label={`Mover item para cima: ${item.title}`}
            title="Mover para cima"
            className="size-11 cursor-pointer"
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || last}
            onClick={() => onMove(1)}
            aria-label={`Mover item para baixo: ${item.title}`}
            title="Mover para baixo"
            className="size-11 cursor-pointer"
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={onEdit}
            aria-label={`Editar item: ${item.title}`}
            className="min-h-11 cursor-pointer"
          >
            <Pencil aria-hidden="true" className="size-4" />
            Editar
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remover item: ${item.title}`}
            className="min-h-11 cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Remover
          </Button>
        </div>
      </div>

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={item.visibleInPortal}
          disabled={disabled}
          onChange={onToggleVisibility}
          aria-label={`Exibir no portal do cliente: ${item.title}`}
          className="size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        />
        Exibir no portal do cliente
      </label>
    </li>
  );
}
