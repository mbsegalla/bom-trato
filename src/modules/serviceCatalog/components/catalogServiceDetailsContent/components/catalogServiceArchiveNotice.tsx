import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CatalogServiceArchiveNoticeProps {
  name: string;
  changingStatus: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CatalogServiceArchiveNotice({
  name,
  changingStatus,
  onCancel,
  onConfirm,
}: CatalogServiceArchiveNoticeProps) {
  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">Arquivar {name}?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O serviço deixará de aparecer entre os itens ativos, mas poderá ser restaurado depois.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="ghost" disabled={changingStatus} onClick={onCancel} className="cursor-pointer">
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={changingStatus}
          onClick={onConfirm}
          className="cursor-pointer"
        >
          {changingStatus ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Arquivando...
            </>
          ) : (
            'Arquivar serviço'
          )}
        </Button>
      </div>
    </div>
  );
}
