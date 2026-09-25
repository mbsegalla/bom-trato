import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { rememberPlanChange, syncPlanChange } from '../../../services/billing.service';
import type { PlanChange } from '../../../types/billing.types';

interface PlanChangePaymentFormProps {
  organizationId: string;
  change: PlanChange;
  target: { plan: Plan; price: PlanPrice } | null;
  onChanged(): void;
}

export function PlanChangePaymentForm({ organizationId, change, target, onChanged }: PlanChangePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      rememberPlanChange(organizationId, change.id);
      const returnUrl = new URL('/settings/billing/return', window.location.origin);

      returnUrl.searchParams.set('organizationId', organizationId);
      returnUrl.searchParams.set('operationId', change.id);
      returnUrl.searchParams.set('kind', 'plan-change');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message ?? 'Não foi possível confirmar o pagamento.');

        return;
      }

      for (let attempt = 0; attempt < 15; attempt += 1) {
        const current = await syncPlanChange(organizationId, change.id);

        if (current.status === 'APPLIED' || current.status === 'SCHEDULED') {
          onChanged();
          return;
        }

        if (current.status === 'CANCELED' || current.status === 'EXPIRED') {
          setError('A alteração não pôde ser concluída.');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setError('O pagamento foi enviado, mas a alteração ainda está sendo processada.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a alteração.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-semibold">Confirmar pagamento</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {target?.plan.name ?? 'Novo plano'} · {formatBrlCurrency(change.amountDueNow)} agora
        </p>
      </div>
      <PaymentElement />
      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={!stripe || submitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Pagar e alterar plano
          </>
        )}
      </Button>
    </form>
  );
}
