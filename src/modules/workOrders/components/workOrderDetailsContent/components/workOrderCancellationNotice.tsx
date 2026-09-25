export function WorkOrderCancellationNotice({ reason }: { reason: string }) {
  return (
    <section className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
      <h2 className="font-heading text-lg font-semibold text-destructive">Motivo do cancelamento</h2>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{reason}</p>
    </section>
  );
}
