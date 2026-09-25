import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function QuotesHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Orçamentos</h1>
        <p className="mt-2 text-muted-foreground">
          Crie propostas, acompanhe respostas e transforme aprovações em trabalho.
        </p>
      </div>

      <Button type="button" onClick={onCreate} className="min-h-12 cursor-pointer rounded-xl px-5">
        <Plus aria-hidden="true" className="size-5" />
        Novo orçamento
      </Button>
    </div>
  );
}
