'use client';

import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout';
import { loadStripe } from '@stripe/stripe-js';
import { LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getStripeConfig } from '@/config/stripe.config';
import { startCheckout } from '@/modules/billing/services/checkout.service';
import type { SelectedPlan } from '@/modules/plans/helpers/plan.helper';
import { findSelectedPlan } from '@/modules/plans/helpers/plan.helper';
import { listPlans } from '@/modules/plans/services/plan.service';

import { PaymentForm } from './components/paymentForm';
import { PlanSummary } from './components/planSummary';

interface OnboardingPaymentProps {
  organizationId: string;
  planPriceId: string;
}

interface CheckoutLoaderProps extends OnboardingPaymentProps {
  onRetry(): void;
}

const stripePromise = loadStripe(getStripeConfig().publishableKey);

export function OnboardingPayment({ organizationId, planPriceId }: OnboardingPaymentProps) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <CheckoutLoader
      key={`${organizationId}:${planPriceId}:${retryKey}`}
      organizationId={organizationId}
      planPriceId={planPriceId}
      onRetry={() => {
        setRetryKey((value) => value + 1);
      }}
    />
  );
}

function CheckoutLoader({ organizationId, planPriceId, onRetry }: CheckoutLoaderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void startCheckout(organizationId, planPriceId)
      .then((result) => {
        if (!active) {
          return;
        }

        setClientSecret(result.clientSecret);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setCheckoutError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o pagamento.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, planPriceId]);

  useEffect(() => {
    let active = true;

    void listPlans()
      .then((result) => {
        if (!active) {
          return;
        }

        if (!result.success) {
          setPlanError(result.message);
          return;
        }

        const found = findSelectedPlan(result.plans, planPriceId);

        if (!found) {
          setPlanError('Não foi possível identificar os detalhes do plano selecionado.');

          return;
        }

        setSelectedPlan(found);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPlanError('Não foi possível carregar os detalhes do plano.');
      })
      .finally(() => {
        if (active) {
          setPlanLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [planPriceId]);

  if (checkoutError) {
    return (
      <div className="space-y-4">
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {checkoutError}
        </p>

        <Button type="button" variant="outline" onClick={onRetry} className="min-h-12 w-full cursor-pointer rounded-xl">
          <RotateCcw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanSummary selectedPlan={selectedPlan} loading={planLoading} error={planError} />

      {!clientSecret ? (
        <div
          aria-busy="true"
          className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-border"
        >
          <LoaderCircle className="size-6 animate-spin text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">Preparando pagamento...</p>
        </div>
      ) : (
        <CheckoutElementsProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            elementsOptions: {
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#205c49',
                  borderRadius: '10px',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                },
              },
            },
          }}
        >
          <PaymentForm />
        </CheckoutElementsProvider>
      )}
    </div>
  );
}
