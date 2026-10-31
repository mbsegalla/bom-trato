interface CustomerNotesCardProps {
  notes: string | null | undefined;
}

export function CustomerNotesCard({ notes }: CustomerNotesCardProps) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">Observações</h2>

      {notes ? (
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{notes}</p>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhuma observação cadastrada para este cliente.</p>
      )}
    </section>
  );
}
