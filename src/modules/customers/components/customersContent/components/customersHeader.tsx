import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CustomersHeaderProps {
  onCreate: () => void;
}

export function CustomersHeader({ onCreate }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Clientes</h1>

        <p className="mt-2 text-muted-foreground">
          Organize seus clientes e mantenha contatos, observações e histórico sempre por perto.
        </p>
      </div>

      <Button type="button" onClick={onCreate} className="min-h-12 cursor-pointer rounded-xl px-5">
        <Plus aria-hidden="true" className="size-5" />
        Novo cliente
      </Button>
    </div>
  );
}
