import { Archive, ArchiveRestore, LoaderCircle, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CatalogService } from '@/modules/serviceCatalog/types/catalogService.types';
import { formatDate } from '@/shared/formatters/date.formatter';

interface CatalogServiceDetailsHeaderProps {
  service: CatalogService;
  changingStatus: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function CatalogServiceDetailsHeader({
  service,
  changingStatus,
  onEdit,
  onArchive,
  onRestore,
}: CatalogServiceDetailsHeaderProps) {
  return (
    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{service.name}</h1>
          {service.archivedAt ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Arquivado</span>
          ) : (
            <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">Ativo</span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Serviço cadastrado em {formatDate(service.createdAt)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!service.archivedAt && (
          <Button type="button" variant="outline" onClick={onEdit} className="min-h-11 cursor-pointer rounded-xl px-4">
            <Pencil aria-hidden="true" className="size-4" />
            Editar
          </Button>
        )}

        {service.archivedAt ? (
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
            Restaurar serviço
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
