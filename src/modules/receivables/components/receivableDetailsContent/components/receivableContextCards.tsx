import Link from 'next/link';

import type { Receivable } from '@/modules/receivables/types/receivable.types';

export function ReceivableContextCards({ receivable }: { receivable: Receivable }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Origem</h2>

        <Link
          href={`/customers/${receivable.customerId}`}
          className="mt-4 block font-medium hover:text-primary hover:underline"
        >
          {receivable.customerName}
        </Link>

        <Link
          href={`/work-orders/${receivable.workOrderId}`}
          className="mt-3 block text-sm font-medium text-primary hover:underline"
        >
          Abrir ordem de serviço
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Observações</h2>
        <p className="mt-4 text-sm whitespace-pre-wrap text-muted-foreground">
          {receivable.notes ?? 'Nenhuma observação cadastrada.'}
        </p>
      </section>
    </div>
  );
}
