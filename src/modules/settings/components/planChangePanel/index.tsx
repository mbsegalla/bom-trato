'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getStripeConfig } from '@/config/stripe.config';
import type { Plan, PlanPrice, PricingInterval } from '@/modules/plans/types/plan.types';

import { cancelPlanChange, confirmPlanChange, previewPlanChange, syncPlanChange } from '../../services/billing.service';
import type { BillingSubscription, PlanChange } from '../../types/billing.types';
import { PlanChangePaymentForm } from './components/planChangePaymentForm';
import { PlanChangePreview } from './components/planChangePreview';
import { PlanChangeStatus } from './components/planChangeStatus';
import { PlanSelection } from './components/planSelection';
import { findPlanPrice } from './helpers/planChange.helper';

const stripePromise = loadStripe(getStripeConfig().publishableKey);
const intervals: { value: PricingInterval; label: string }[] = [
  { value: 'MONTH', label: 'Mensal' },
  { value: 'YEAR', label: 'Anual' },
];

interface PlanChangePanelProps {
  organizationId: string;
  subscription: BillingSubscription;
  plans: Plan[];
  memberCount: number;
  initialChange?: PlanChange | null;
  onClose(): void;
  onChanged(): void;
}

export function PlanChangePanel({
  organizationId,
  subscription,
  plans,
  memberCount,
  initialChange = null,
  onClose,
  onChanged,
}: PlanChangePanelProps) {
  const current = useMemo(() => findPlanPrice(plans, subscription.planPriceId), [plans, subscription.planPriceId]);

  const availableIntervals = intervals.filter((interval) =>
    plans.some((plan) => plan.prices.some((price) => price.interval === interval.value && price.intervalCount === 1)),
  );

  const [selectedInterval, setSelectedInterval] = useState<PricingInterval>(
    current?.price.interval ?? availableIntervals[0]?.value ?? 'MONTH',
  );

  const [change, setChange] = useState<PlanChange | null>(initialChange);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = change ? findPlanPrice(plans, change.targetPlanPriceId) : null;

  async function selectPrice(price: PlanPrice): Promise<void> {
    if (loadingPriceId) return;

    setLoadingPriceId(price.id);
    setError(null);
    try {
      setChange(await previewPlanChange(organizationId, price.id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível calcular a alteração.');
    } finally {
      setLoadingPriceId(null);
    }
  }

  async function confirm(): Promise<void> {
    if (!change || confirming) return;

    setConfirming(true);
    setError(null);
    try {
      const result = await confirmPlanChange(organizationId, change.id);

      setChange(result);

      if (result.status === 'APPLIED' || result.status === 'SCHEDULED') {
        onChanged();
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar a alteração.');
    } finally {
      setConfirming(false);
    }
  }

  async function refreshChange(): Promise<void> {
    if (!change || confirming) return;

    setConfirming(true);
    setError(null);
    try {
      const result = await syncPlanChange(organizationId, change.id);

      setChange(result);

      if (result.status === 'APPLIED' || result.status === 'SCHEDULED') {
        onChanged();
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a alteração.');
    } finally {
      setConfirming(false);
    }
  }

  async function cancel(): Promise<void> {
    if (!change || canceling) return;

    setCanceling(true);
    setError(null);
    try {
      await cancelPlanChange(organizationId, change.id);

      onChanged();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar a alteração.');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Alterar plano</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o plano que melhor acompanha o momento do seu negócio.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <X className="size-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!change ? (
            <PlanSelection
              plans={plans}
              currentPlanPriceId={subscription.planPriceId}
              memberCount={memberCount}
              selectedInterval={selectedInterval}
              availableIntervals={availableIntervals}
              loadingPriceId={loadingPriceId}
              onIntervalChange={setSelectedInterval}
              onSelectPrice={(price) => void selectPrice(price)}
            />
          ) : change.status === 'QUOTED' ? (
            <PlanChangePreview
              change={change}
              target={target}
              confirming={confirming}
              error={error}
              onBack={() => setChange(null)}
              onConfirm={() => void confirm()}
            />
          ) : change.status === 'PENDING_PAYMENT' && change.clientSecret ? (
            <Elements
              key={change.clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret: change.clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#205c49',
                    borderRadius: '10px',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                  },
                },
              }}
            >
              <PlanChangePaymentForm
                organizationId={organizationId}
                change={change}
                target={target}
                onChanged={onChanged}
              />
            </Elements>
          ) : (
            <PlanChangeStatus
              change={change}
              target={target}
              confirming={confirming}
              canceling={canceling}
              error={error}
              onRefresh={() => void refreshChange()}
              onCancel={() => void cancel()}
            />
          )}
        </div>
      </section>
    </div>
  );
}
