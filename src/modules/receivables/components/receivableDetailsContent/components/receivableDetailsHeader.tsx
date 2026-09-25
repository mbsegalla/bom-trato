import { CircleDollarSign, Pencil, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ReceivableStatusBadge } from '@/modules/receivables/components/receivableStatusBadge';
import type { Receivable } from '@/modules/receivables/types/receivable.types';
import { formatDate } from '@/shared/formatters/date.formatter';

interface ReceivableDetailsHeaderProps {
  receivable: Receivable;
  editable: boolean;
  canReceive: boolean;
  canCancel: boolean;
  onEdit: () => void;
  onReceive: () => void;
  onCancel: () => void;
}

export function ReceivableDetailsHeader({
  receivable,
  editable,
  canReceive,
  canCancel,
  onEdit,
  onReceive,
  onCancel,
}: ReceivableDetailsHeaderProps) {
  return (
    <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{receivable.title}</h1>
          <ReceivableStatusBadge status={receivable.status} overdue={receivable.overdue} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {receivable.customerName} · vencimento {formatDate(receivable.dueAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {editable && (
          <Button variant="outline" onClick={onEdit} className="cursor-pointer">
            <Pencil className="size-4" />
            Editar
          </Button>
        )}

        {canReceive && (
          <Button onClick={onReceive} className="cursor-pointer">
            <CircleDollarSign className="size-4" />
            Registrar pagamento
          </Button>
        )}

        {canCancel && (
          <Button variant="destructive" onClick={onCancel} className="cursor-pointer">
            <X className="size-4" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
