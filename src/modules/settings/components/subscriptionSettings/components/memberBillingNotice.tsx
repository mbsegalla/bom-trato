export function MemberBillingNotice() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Gerenciamento da assinatura</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Somente o administrador do negócio pode alterar plano, cartão, assinatura e consultar faturas.
      </p>
    </section>
  );
}
