import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CustomerStatus } from '@/modules/customers/types/customer.types';

interface CustomersEmptyStateProps {
  search: string;
  status: CustomerStatus;
  onCreate: () => void;
}

export function CustomersEmptyState({ search, status, onCreate }: CustomersEmptyStateProps) {
  return (
    <div className="border-b border-border py-10">
      <h2 className="font-heading text-lg font-semibold">
        {search
          ? 'Nenhum cliente encontrado'
          : status === 'ARCHIVED'
            ? 'Nenhum cliente arquivado'
            : 'Ainda não há clientes por aqui'}
      </h2>

      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {search
          ? 'Tente outro nome ou limpe a busca para visualizar seus clientes.'
          : status === 'ARCHIVED'
            ? 'Clientes arquivados aparecerão aqui e poderão ser restaurados quando necessário.'
            : 'Cadastre seu primeiro cliente para começar a criar orçamentos e organizar os atendimentos.'}
      </p>

      {!search && status === 'ACTIVE' && (
        <Button type="button" onClick={onCreate} className="mt-5 cursor-pointer">
          <Plus aria-hidden="true" className="size-4" />
          Cadastrar cliente
        </Button>
      )}
    </div>
  );
}
