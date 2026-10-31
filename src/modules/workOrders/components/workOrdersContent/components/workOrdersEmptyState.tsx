import Link from 'next/link';

export function WorkOrdersEmptyState() {
  return (
    <div className="border-b border-border py-10">
      <h2 className="font-heading text-lg font-semibold">Nenhuma ordem de serviço por aqui</h2>

      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
        As ordens de serviço são criadas automaticamente a partir dos orçamentos aprovados.
      </p>

      <Link
        href="/quotes"
        className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Ver orçamentos
      </Link>
    </div>
  );
}
