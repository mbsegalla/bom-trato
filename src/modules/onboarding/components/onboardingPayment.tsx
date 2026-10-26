'use client';

import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout';
import { loadStripe } from '@stripe/stripe-js';
import { Check, LoaderCircle, LockKeyhole, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getStripeConfig } from '@/config/stripe.config';
import { startCheckout } from '@/modules/billing/services/checkout.service';
import { listPlans } from '@/modules/plans/services/plan.service';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface OnboardingPaymentProps {
  organizationId: string;
  planPriceId: string;
}

interface CheckoutLoaderProps extends OnboardingPaymentProps {
  onRetry(): void;
}

interface SelectedPlan {
  plan: Plan;
  price: PlanPrice;
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
          <RotateCcw aria-hidden="true" className="size-4" />
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
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />

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

function PlanSummary({
  selectedPlan,
  loading,
  error,
}: {
  selectedPlan: SelectedPlan | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <PlanSummarySkeleton />;
  }

  if (error || !selectedPlan) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          {error ?? 'Não foi possível carregar os detalhes do plano selecionado.'}
        </p>
      </div>
    );
  }

  const { plan, price } = selectedPlan;

  return (
    <section className="rounded-2xl border border-border bg-muted/20 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Plano selecionado</p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold tracking-tight">{plan.name}</h2>

          {plan.description && (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-2xl font-semibold tracking-tight">{formatBrlCurrency(price.amountInCents)}</p>

          <p className="mt-1 text-xs text-muted-foreground">{getPricePeriodLabel(price)}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

            <span>
              Até {plan.maxUsers} {plan.maxUsers === 1 ? 'usuário' : 'usuários'}
            </span>
          </li>

          <li className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

            <span>Clientes, orçamentos e serviços organizados</span>
          </li>

          {plan.teamManagementEnabled && (
            <li className="flex items-start gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

              <span>Gestão de equipe</span>
            </li>
          )}
        </ul>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{getRecurringBillingLabel(price)}</p>
    </section>
  );
}

function PlanSummarySkeleton() {
  return (
    <div aria-busy="true" className="rounded-2xl border border-border bg-muted/20 p-5">
      <Skeleton className="h-3 w-28 rounded" />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-full max-w-sm rounded" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="ml-auto h-3 w-14 rounded" />
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-4 w-64 max-w-full rounded" />
      </div>
    </div>
  );
}

function PaymentForm() {
  const checkoutResult = useCheckoutElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (checkoutResult.type !== 'success' || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const validationResult = await checkoutResult.checkout.validateElements();

      if (validationResult.type === 'error') {
        setError(validationResult.error.message || 'Revise os dados do pagamento.');

        return;
      }

      const result = await checkoutResult.checkout.confirm();

      if (result.type === 'error') {
        console.error('Stripe checkout confirmation error:', result.error);

        setError(result.error.message ?? 'Não foi possível confirmar o pagamento.');
      }
    } catch (cause: unknown) {
      console.error('Stripe checkout confirmation failed:', cause);

      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar o pagamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutResult.type === 'loading') {
    return (
      <div aria-busy="true" className="flex min-h-40 flex-col items-center justify-center">
        <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  if (checkoutResult.type === 'error') {
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
      >
        {checkoutResult.error.message || 'Não foi possível carregar o formulário de pagamento.'}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <LockKeyhole aria-hidden="true" className="size-4" />
            Concluir assinatura
          </>
        )}
      </Button>

      <div className="flex flex-col items-center gap-3">
        <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="size-3.5" />
          Pagamento processado com segurança pela Stripe.
        </p>

        <a
          href="https://stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Saiba mais sobre a Stripe"
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Image
            src="/stripe/powered-by-stripe.svg"
            alt="Powered by Stripe"
            width={104}
            height={24}
            className="h-6 w-auto"
          />
        </a>
      </div>
    </form>
  );
}

function findSelectedPlan(plans: Plan[], planPriceId: string): SelectedPlan | null {
  for (const plan of plans) {
    const price = plan.prices.find((item) => item.id === planPriceId);

    if (price) {
      return {
        plan,
        price,
      };
    }
  }

  return null;
}

function getPricePeriodLabel(price: PlanPrice): string {
  if (price.interval === 'MONTH' && price.intervalCount === 1) {
    return '/ mês';
  }

  if (price.interval === 'YEAR' && price.intervalCount === 1) {
    return '/ ano';
  }

  if (price.interval === 'MONTH') {
    return `/ ${price.intervalCount} meses`;
  }

  return `/ ${price.intervalCount} anos`;
}

function getRecurringBillingLabel(price: PlanPrice): string {
  if (price.interval === 'MONTH' && price.intervalCount === 1) {
    return 'Cobrança recorrente mensal. Você pode cancelar a renovação quando quiser.';
  }

  if (price.interval === 'YEAR' && price.intervalCount === 1) {
    return 'Cobrança recorrente anual. Você pode cancelar a renovação quando quiser.';
  }

  if (price.interval === 'MONTH') {
    return `Cobrança recorrente a cada ${price.intervalCount} meses. Você pode cancelar a renovação quando quiser.`;
  }

  return `Cobrança recorrente a cada ${price.intervalCount} anos. Você pode cancelar a renovação quando quiser.`;
}
