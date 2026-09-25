import { CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { getCardBrandLabel } from '../constants/billing.constants';
import type { BillingCard } from '../types/billing.types';

interface PaymentMethodCardProps {
  card: BillingCard | null;
  onChange(): void;
}

export function PaymentMethodCard({ card, onChange }: PaymentMethodCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
          <CreditCard className="size-5" />
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">Método de pagamento</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Cartão utilizado nas cobranças recorrentes da sua assinatura.
          </p>
        </div>
      </div>

      {card ? (
        <div className="mt-6">
          <p className="font-semibold">
            {getCardBrandLabel(card.brand)} •••• {card.last4}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Expira em {String(card.expMonth).padStart(2, '0')}/{card.expYear}
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum cartão padrão foi encontrado.</p>
      )}

      <Button type="button" variant="outline" onClick={onChange} className="mt-6 cursor-pointer">
        Alterar cartão
      </Button>
    </section>
  );
}
