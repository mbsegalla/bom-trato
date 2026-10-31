import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CatalogServiceStatus } from '@/modules/serviceCatalog/types/catalogService.types';

interface CatalogServicesEmptyStateProps {
  search: string;
  status: CatalogServiceStatus;
  onCreate: () => void;
}

export function CatalogServicesEmptyState({ search, status, onCreate }: CatalogServicesEmptyStateProps) {
  return (
    <div className="border-b border-border py-10">
      <h2 className="font-heading text-lg font-semibold">
        {search
          ? 'Nenhum serviço encontrado'
          : status === 'ARCHIVED'
            ? 'Nenhum serviço arquivado'
            : 'Seu catálogo ainda está vazio'}
      </h2>

      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {search
          ? 'Tente outro termo ou limpe a busca para visualizar seus serviços.'
          : status === 'ARCHIVED'
            ? 'Serviços arquivados aparecerão aqui e poderão ser restaurados quando necessário.'
            : 'Cadastre os serviços que você oferece para reutilizá-los ao criar novos orçamentos.'}
      </p>

      {!search && status === 'ACTIVE' && (
        <Button type="button" onClick={onCreate} className="mt-5 cursor-pointer">
          <Plus aria-hidden="true" className="size-4" />
          Cadastrar serviço
        </Button>
      )}
    </div>
  );
}
