import { StickyNote } from 'lucide-react';

export function CatalogServiceDescription({ description }: { description: string | null | undefined }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <StickyNote aria-hidden="true" className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Descrição</h2>
      </div>

      {description ? (
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{description}</p>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhuma descrição cadastrada para este serviço.</p>
      )}
    </section>
  );
}
