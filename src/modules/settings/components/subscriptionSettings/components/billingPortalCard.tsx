import { ExternalLink, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BillingPortalCardProps {
  loading: boolean;
  onOpen(): void;
}

export function BillingPortalCard({ loading, onOpen }: BillingPortalCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Portal de cobrança</h2>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Consulte documentos e detalhes de cobrança diretamente no portal seguro da Stripe.
      </p>

      <Button type="button" variant="outline" disabled={loading} onClick={onOpen} className="mt-6 cursor-pointer">
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
        Acessar portal da Stripe
      </Button>
    </section>
  );
}
