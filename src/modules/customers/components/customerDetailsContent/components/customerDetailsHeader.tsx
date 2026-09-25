import { Archive, ArchiveRestore, LoaderCircle, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CustomerOverview } from '@/modules/customers/types/customer.types';
import { formatDate } from '@/shared/formatters/date.formatter';

interface CustomerDetailsHeaderProps {
  customer: NonNullable<CustomerOverview['customer']>;
  changingStatus: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function CustomerDetailsHeader({
  customer,
  changingStatus,
  onEdit,
  onArchive,
  onRestore,
}: CustomerDetailsHeaderProps) {
  return (
    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{customer.name}</h1>

          {customer.archivedAt ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Arquivado</span>
          ) : (
            <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">Ativo</span>
          )}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">Cliente desde {formatDate(customer.createdAt)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!customer.archivedAt && (
          <Button type="button" variant="outline" onClick={onEdit} className="min-h-11 cursor-pointer rounded-xl px-4">
            <Pencil aria-hidden="true" className="size-4" />
            Editar
          </Button>
        )}

        {customer.archivedAt ? (
          <Button
            type="button"
            variant="outline"
            disabled={changingStatus}
            onClick={onRestore}
            className="min-h-11 cursor-pointer rounded-xl px-4"
          >
            {changingStatus ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ArchiveRestore aria-hidden="true" className="size-4" />
            )}
            Restaurar cliente
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={changingStatus}
            onClick={onArchive}
            className="min-h-11 cursor-pointer rounded-xl px-4"
          >
            <Archive aria-hidden="true" className="size-4" />
            Arquivar
          </Button>
        )}
      </div>
    </div>
  );
}
