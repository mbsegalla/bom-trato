import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CustomerStatus } from '@/modules/customers/types/customer.types';

const statuses: { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'ARCHIVED', label: 'Arquivados' },
  { value: 'ALL', label: 'Todos' },
];

interface CustomersToolbarProps {
  searchDraft: string;
  search: string;
  status: CustomerStatus;
  onSearchDraftChange: (value: string) => void;
  onSubmitSearch: NonNullable<ComponentProps<'form'>['onSubmit']>;
  onClearSearch: () => void;
  onStatusChange: (status: CustomerStatus) => void;
}

export function CustomersToolbar({
  searchDraft,
  search,
  status,
  onSearchDraftChange,
  onSubmitSearch,
  onClearSearch,
  onStatusChange,
}: CustomersToolbarProps) {
  return (
    <>
      <div className="flex flex-col gap-5 border-y border-border py-4 xl:flex-row xl:items-center xl:justify-between">
        <form onSubmit={onSubmitSearch} className="flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Buscar por nome..."
              maxLength={100}
              className="h-10 pl-9"
            />
          </div>

          <Button type="submit" variant="outline" className="h-10 cursor-pointer">
            Buscar
          </Button>
        </form>

        <div role="group" aria-label="Status dos clientes" className="flex flex-wrap gap-x-5 gap-y-2">
          {statuses.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={status === item.value}
              onClick={() => onStatusChange(item.value)}
              className={cn(
                'cursor-pointer rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-1 hover:bg-transparent',
                status === item.value && 'border-primary text-primary',
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {search && (
        <div className="flex items-center gap-2 border-b border-border py-3 text-sm text-muted-foreground">
          <span>
            Resultados para <strong className="font-medium text-foreground">“{search}”</strong>
          </span>

          <Button type="button" variant="link" size="sm" onClick={onClearSearch} className="h-auto cursor-pointer p-0">
            Limpar busca
          </Button>
        </div>
      )}
    </>
  );
}
