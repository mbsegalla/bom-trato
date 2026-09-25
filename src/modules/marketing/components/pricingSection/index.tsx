'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlanListResult, PricingInterval } from '@/modules/plans/types/plan.types';

import { PricingCard } from './components/pricingCard';
import { PricingIntervalToggle } from './components/pricingIntervalToggle';

const billingPeriods: { value: PricingInterval; label: string }[] = [
  { value: 'MONTH', label: 'Mensal' },
  { value: 'YEAR', label: 'Anual' },
];

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

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24 px-6 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">PLANOS</p>
          <h2 id="pricing-title" className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Um plano para o seu momento.
          </h2>
          <p className="mt-4 text-muted-foreground">Da primeira proposta à rotina de uma equipe.</p>
        </div>

        {!result.success ? (
          <div aria-busy={isRefreshing} className="mx-auto mt-10 max-w-xl rounded-3xl border bg-card p-8 text-center">
            <p role="status" className="text-muted-foreground">
              {result.message}
            </p>
            <Button type="button" onClick={handleRetry} disabled={isRefreshing} className="mt-5">
              {isRefreshing ? 'Carregando...' : 'Tentar novamente'}
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <p role="status" className="mt-10 text-center text-muted-foreground">
            Nenhum plano disponível no momento.
          </p>
        ) : (
          <>
            <PricingIntervalToggle
              periods={availablePeriods}
              activeInterval={activeInterval}
              onChange={setSelectedInterval}
            />
            <p aria-live="polite" className="mt-4 text-center text-sm text-muted-foreground">
              {activeInterval === 'YEAR'
                ? 'Os valores abaixo correspondem ao total cobrado por ano.'
                : 'Os valores abaixo correspondem à cobrança mensal.'}
            </p>
            <div
              className={cn(
                'mx-auto mt-10 grid gap-6',
                plans.length === 1
                  ? 'max-w-md'
                  : plans.length === 2
                    ? 'max-w-4xl md:grid-cols-2'
                    : 'md:grid-cols-2 lg:grid-cols-3',
              )}
            >
              {plans.map((plan) => (
                <PricingCard key={plan.id} plan={plan} interval={activeInterval} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
