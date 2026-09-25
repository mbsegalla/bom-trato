import { Archive, Plus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CustomerStatus } from '@/modules/customers/types/customer.types';

interface CustomersEmptyStateProps {
  search: string;
  status: CustomerStatus;
  onCreate: () => void;
}

export function CustomersEmptyState({ search, status, onCreate }: CustomersEmptyStateProps) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
        {status === 'ARCHIVED' ? (
          <Archive aria-hidden="true" className="size-6" />
        ) : (
          <Users aria-hidden="true" className="size-6" />
        )}
      </div>

      <h2 className="mt-5 font-heading text-xl font-semibold">
        {search
          ? 'Nenhum cliente encontrado'
          : status === 'ARCHIVED'
            ? 'Nenhum cliente arquivado'
            : 'Ainda não há clientes por aqui'}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {search
          ? 'Tente outro nome ou limpe a busca para visualizar seus clientes.'
          : status === 'ARCHIVED'
            ? 'Clientes arquivados aparecerão aqui e poderão ser restaurados quando necessário.'
            : 'Cadastre seu primeiro cliente para começar a criar orçamentos e organizar os atendimentos.'}
      </p>

      {!search && status === 'ACTIVE' && (
        <Button type="button" onClick={onCreate} className="mt-6 min-h-11 cursor-pointer rounded-xl px-5">
          <Plus aria-hidden="true" className="size-4" />
          Cadastrar cliente
        </Button>
      )}
    </div>
  );
}
