import { CircleAlert } from 'lucide-react';

export function MissingSubscriptionNotice() {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <CircleAlert className="mx-auto size-8 text-warning" />

      <h2 className="mt-5 font-heading text-xl font-semibold">Nenhuma assinatura encontrada</h2>

      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        Não encontramos uma assinatura associada a este negócio.
      </p>
    </section>
  );
}
