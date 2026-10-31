import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function QuotesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-b border-border py-10">
      <h2 className="font-heading text-lg font-semibold">Nenhum orçamento por aqui</h2>

      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Crie um orçamento para um cliente e adicione os serviços que serão realizados.
      </p>

      <Button type="button" onClick={onCreate} className="mt-5 cursor-pointer">
        <Plus aria-hidden="true" className="size-4" />
        Criar orçamento
      </Button>
    </div>
  );
}
