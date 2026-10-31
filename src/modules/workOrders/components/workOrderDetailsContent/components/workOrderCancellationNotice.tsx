export function WorkOrderCancellationNotice({ reason }: { reason: string }) {
  return (
    <section className="mt-8 border-l-2 border-destructive bg-destructive/5 px-4 py-3">
      <h2 className="font-heading font-semibold text-destructive">Motivo do cancelamento</h2>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{reason}</p>
    </section>
  );
}
