import { Plus } from 'lucide-react';
import Link from 'next/link';

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Seu dia, mais organizado.</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe os serviços e cuide dos próximos passos.</p>
      </div>

      <Link
        href="/quotes"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus aria-hidden="true" className="size-5" />
        Novo orçamento
      </Link>
    </div>
  );
}
