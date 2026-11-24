'use client';

import { ArrowLeft, CreditCard, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getBillingSubscription } from '@/modules/settings/services/billing.service';
import type { BillingSubscription } from '@/modules/settings/types/billing.types';

import type { OnboardingState } from '../types/onboarding.types';
import { BillingRecovery } from './billingRecovery';
import { OnboardingPayment } from './onboardingPayment';
import { OnboardingPlanSelection } from './onboardingPlanSelection';

interface TrialSubscriptionContentProps {
  organizationId: string;
  onStateChange(state: OnboardingState): void;
}

type SubscriptionCheck =
  | { status: 'loading' }
  | { status: 'ready'; subscription: BillingSubscription | null }
  | { status: 'error'; message: string };

function hasOngoingSubscription(subscription: BillingSubscription | null): boolean {
  return subscription !== null && !['CANCELED', 'INCOMPLETE_EXPIRED'].includes(subscription.status);
}

export function TrialSubscriptionContent({ organizationId, onStateChange }: TrialSubscriptionContentProps) {
  const [planPriceId, setPlanPriceId] = useState<string | null>(null);
  const [check, setCheck] = useState<SubscriptionCheck>({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    void getBillingSubscription(organizationId)
      .then((subscription) => {
        if (!active) return;

        setCheck({
          status: 'ready',
          subscription,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setCheck({
          status: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar sua assinatura.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, retryKey]);

  function retry(): void {
    setCheck({ status: 'loading' });
    setRetryKey((value) => value + 1);
  }

  function handleSelected(state: OnboardingState): void {
    setPlanPriceId(state.selectedPlanPriceId);
    onStateChange(state);
  }

  function renderSubscription(): React.ReactNode {
    if (check.status === 'loading') {
      return (
        <div aria-busy="true" className="flex min-h-40 items-center justify-center">
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
        </div>
      );
    }

    if (check.status === 'error') {
      return (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-destructive">
            {check.message}
          </p>

          <Button type="button" variant="outline" onClick={retry} className="cursor-pointer">
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (hasOngoingSubscription(check.subscription)) {
      return (
        <BillingRecovery
          organizationId={organizationId}
          onStateChange={(state) => {
            onStateChange(state);
            retry();
          }}
        />
      );
    }

    if (planPriceId !== null) {
      return (
        <OnboardingPayment organizationId={organizationId} planPriceId={planPriceId} onStateChange={handleSelected} />
      );
    }

    return <OnboardingPlanSelection organizationId={organizationId} onSelected={handleSelected} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para minha avaliação
      </Link>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard aria-hidden="true" className="size-7" />
        </div>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">Escolha seu plano</h1>

        <p className="mt-3 leading-relaxed text-muted-foreground">
          Continue organizando seu negócio com o Bom Trato. A assinatura começa após a confirmação da contratação.
        </p>

        <div className="mt-8">{renderSubscription()}</div>
      </section>
    </div>
  );
}
