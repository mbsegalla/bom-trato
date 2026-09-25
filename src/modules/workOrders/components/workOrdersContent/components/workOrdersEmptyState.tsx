import { ClipboardList } from 'lucide-react';
import Link from 'next/link';

export function WorkOrdersEmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
        <ClipboardList aria-hidden="true" className="size-6" />
      </div>

      <h2 className="mt-5 font-heading text-xl font-semibold">Nenhuma ordem de serviço por aqui</h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Uma ordem de serviço pode ser criada a partir de um orçamento aprovado.
      </p>

      <Link
        href="/quotes"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Ver orçamentos
      </Link>
    </div>
  );
}
