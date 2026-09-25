import { StickyNote } from 'lucide-react';

interface CustomerNotesCardProps {
  notes: string | null | undefined;
}

export function CustomerNotesCard({ notes }: CustomerNotesCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <StickyNote aria-hidden="true" className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Observações</h2>
      </div>

      {notes ? (
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{notes}</p>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhuma observação cadastrada para este cliente.</p>
      )}
    </section>
  );
}
