import { FileText, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function QuotesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
        <FileText aria-hidden="true" className="size-6" />
      </div>

      <h2 className="mt-5 font-heading text-xl font-semibold">Nenhum orçamento por aqui</h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Crie um orçamento para um cliente e adicione os serviços que serão realizados.
      </p>

      <Button type="button" onClick={onCreate} className="mt-6 cursor-pointer">
        <Plus aria-hidden="true" className="size-4" />
        Criar orçamento
      </Button>
    </div>
  );
}
