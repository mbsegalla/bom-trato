'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlanListResult, PricingInterval } from '@/modules/plans/types/plan.types';

import { TrialOffer } from '../trialOffer';
import { PricingCard } from './components/pricingCard';
import { PricingIntervalToggle } from './components/pricingIntervalToggle';

const billingPeriods: { value: PricingInterval; label: string }[] = [
  { value: 'MONTH', label: 'Mensal' },
  { value: 'YEAR', label: 'Anual' },
];

const pricingGridLayouts: Record<number, string> = {
  1: 'max-w-md',
  2: 'max-w-4xl md:grid-cols-2',
};

function getPricingGridLayout(planCount: number): string {
  return pricingGridLayouts[planCount] ?? 'md:grid-cols-2 lg:grid-cols-3';
}

export function PricingSection({ result }: { result: PlanListResult }) {
  const router = useRouter();

  const [isRefreshing, startTransition] = useTransition();
  const [selectedInterval, setSelectedInterval] = useState<PricingInterval>('MONTH');

  const plans = result.success ? result.plans : [];

  const availablePeriods = billingPeriods.filter((period) =>
    plans.some((plan) => plan.prices.some((price) => price.interval === period.value && price.intervalCount === 1)),
  );

  const activeInterval = availablePeriods.some((period) => period.value === selectedInterval)
    ? selectedInterval
    : (availablePeriods[0]?.value ?? 'MONTH');

  function handleRetry(): void {
    startTransition(() => router.refresh());
  }

  function renderPlans() {
    if (!result.success) {
      return (
        <div aria-busy={isRefreshing} className="mx-auto mt-8 max-w-xl rounded-3xl border bg-card p-8 text-center">
          <p role="status" className="text-muted-foreground">
            {result.message}
          </p>

          <Button type="button" onClick={handleRetry} disabled={isRefreshing} className="mt-5">
            {isRefreshing ? 'Carregando...' : 'Tentar novamente'}
          </Button>
        </div>
      );
    }

    if (plans.length === 0) {
      return (
        <p role="status" className="mt-8 text-center text-muted-foreground">
          Nenhum plano disponível no momento.
        </p>
      );
    }

    return (
      <>
        <PricingIntervalToggle
          periods={availablePeriods}
          activeInterval={activeInterval}
          onChange={setSelectedInterval}
        />

        <p aria-live="polite" className="mt-3 text-center text-sm text-muted-foreground">
          {activeInterval === 'YEAR'
            ? 'Os valores abaixo correspondem ao total cobrado por ano.'
            : 'Os valores abaixo correspondem à cobrança mensal.'}
        </p>

        <div className={cn('mx-auto mt-8 grid gap-6', getPricingGridLayout(plans.length))}>
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} interval={activeInterval} />
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          A avaliação gratuita é individual e independente do plano escolhido. Os limites de usuários e os recursos de
          gestão de equipe do plano são disponibilizados após a confirmação da assinatura.
        </p>
      </>
    );
  }

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24 px-6 py-12 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">PLANOS SEM COMPLICAÇÃO</p>

          <h2
            id="pricing-title"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Experimente primeiro.
            <span className="text-primary"> Escolha depois.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Comece gratuitamente e encontre o plano que acompanha o momento do seu negócio, da primeira proposta à
            rotina de uma equipe.
          </p>
        </div>

        <TrialOffer />

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Continue com o plano ideal para você.
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Contrate somente quando estiver pronto para dar o próximo passo.
          </p>
        </div>

        {renderPlans()}
      </div>
    </section>
  );
}
