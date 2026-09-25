import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CatalogServiceStatus } from '@/modules/serviceCatalog/types/catalogService.types';

const statuses: { value: CatalogServiceStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'ARCHIVED', label: 'Arquivados' },
  { value: 'ALL', label: 'Todos' },
];

interface CatalogServicesToolbarProps {
  searchDraft: string;
  search: string;
  status: CatalogServiceStatus;
  onSearchDraftChange: (value: string) => void;
  onSubmitSearch: NonNullable<ComponentProps<'form'>['onSubmit']>;
  onClearSearch: () => void;
  onStatusChange: (status: CatalogServiceStatus) => void;
}

export function CatalogServicesToolbar({
  searchDraft,
  search,
  status,
  onSearchDraftChange,
  onSubmitSearch,
  onClearSearch,
  onStatusChange,
}: CatalogServicesToolbarProps) {
  return (
    <div className="border-b border-border p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <form onSubmit={onSubmitSearch} className="flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Buscar serviço..."
              maxLength={100}
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Button type="submit" variant="outline" className="min-h-11 cursor-pointer rounded-xl px-4">
            Buscar
          </Button>
        </form>

        <div role="group" aria-label="Status dos serviços" className="flex gap-1 rounded-xl bg-muted p-1">
          {statuses.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={status === item.value ? 'default' : 'ghost'}
              aria-pressed={status === item.value}
              onClick={() => onStatusChange(item.value)}
              className="min-h-9 cursor-pointer rounded-lg px-3"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {search && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Resultados para <strong className="font-medium text-foreground">“{search}”</strong>
          </span>
          <Button type="button" variant="link" size="sm" onClick={onClearSearch} className="h-auto cursor-pointer p-0">
            Limpar busca
          </Button>
        </div>
      )}
    </div>
  );
}
