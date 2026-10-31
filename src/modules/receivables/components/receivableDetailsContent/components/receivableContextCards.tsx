import Link from 'next/link';

import type { Receivable } from '@/modules/receivables/types/receivable.types';

export function ReceivableContextCards({ receivable }: { receivable: Receivable }) {
  return (
    <aside className="rounded-xl bg-muted/40 p-5 ring-1 ring-border/60">
      <section>
        <h2 className="font-heading text-lg font-semibold">Origem</h2>

        <p className="mt-4 text-xs text-muted-foreground">Cliente</p>

        <Link href={`/customers/${receivable.customerId}`} className="mt-1 block font-medium hover:text-primary">
          {receivable.customerName}
        </Link>

        <p className="mt-5 text-xs text-muted-foreground">Ordem de serviço</p>

        <Link href={`/work-orders/${receivable.workOrderId}`} className="mt-1 block text-sm font-medium text-primary">
          Abrir ordem de serviço
        </Link>
      </section>

      <section className="mt-6 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">Observações</h2>

        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {receivable.notes ?? 'Nenhuma observação cadastrada.'}
        </p>
      </section>
    </aside>
  );
}
