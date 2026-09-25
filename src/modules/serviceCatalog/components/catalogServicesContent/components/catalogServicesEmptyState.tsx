import { Archive, Plus, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CatalogServiceStatus } from '@/modules/serviceCatalog/types/catalogService.types';

interface CatalogServicesEmptyStateProps {
  search: string;
  status: CatalogServiceStatus;
  onCreate: () => void;
}

export function CatalogServicesEmptyState({ search, status, onCreate }: CatalogServicesEmptyStateProps) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
        {status === 'ARCHIVED' ? (
          <Archive aria-hidden="true" className="size-6" />
        ) : (
          <Wrench aria-hidden="true" className="size-6" />
        )}
      </div>

      <h2 className="mt-5 font-heading text-xl font-semibold">
        {search
          ? 'Nenhum serviço encontrado'
          : status === 'ARCHIVED'
            ? 'Nenhum serviço arquivado'
            : 'Seu catálogo ainda está vazio'}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {search
          ? 'Tente outro termo ou limpe a busca para visualizar seus serviços.'
          : status === 'ARCHIVED'
            ? 'Serviços arquivados aparecerão aqui e poderão ser restaurados quando necessário.'
            : 'Cadastre os serviços que você oferece para reutilizá-los ao criar novos orçamentos.'}
      </p>

      {!search && status === 'ACTIVE' && (
        <Button type="button" onClick={onCreate} className="mt-6 min-h-11 cursor-pointer rounded-xl px-5">
          <Plus aria-hidden="true" className="size-4" />
          Cadastrar serviço
        </Button>
      )}
    </div>
  );
}
