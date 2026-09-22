'use client';

import { ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan, PlanListResult, PlanPrice, PricingInterval } from '@/modules/plans/types/plan.types';

import { MarketingLink } from './marketingLink';

interface PricingSectionProps {
  result: PlanListResult;
}

const billingPeriods: {
  value: PricingInterval;
  label: string;
}[] = [
  { value: 'MONTH', label: 'Mensal' },
  { value: 'YEAR', label: 'Anual' },
];

function formatPrice(price: PlanPrice): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: price.currency.toUpperCase(),
  }).format(price.amountInCents / 100);
}

function getPlanFeatures(plan: Plan): string[] {
  return [
    plan.maxUsers === 1
      ? '1 usuário'
      : plan.maxUsers > 999
        ? 'Usuários ilimitados'
        : `${plan.maxUsers.toLocaleString('pt-BR')} usuários`,
    'Clientes, orçamentos e ordens de serviço',
    'Agenda de atendimentos',
    ...(plan.teamManagementEnabled ? ['Gestão de equipe habilitada'] : []),
  ];
}

export function PricingSection({ result }: PricingSectionProps) {
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

  function handleRetry() {
    startTransition(() => {
      router.refresh();
    });
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
            {availablePeriods.length > 1 && (
              <div className="mt-8 flex justify-center">
                <div
                  role="group"
                  aria-label="Período de cobrança"
                  className="inline-flex gap-1 rounded-xl border bg-card p-1"
                >
                  {availablePeriods.map((period) => (
                    <Button
                      key={period.value}
                      type="button"
                      variant={activeInterval === period.value ? 'default' : 'ghost'}
                      aria-pressed={activeInterval === period.value}
                      onClick={() => setSelectedInterval(period.value)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
              {plans.map((plan) => {
                const price = plan.prices.find((item) => item.interval === activeInterval && item.intervalCount === 1);

                const featured = plan.code === 'TEAM';

                return (
                  <article
                    key={plan.id}
                    className={cn(
                      'flex flex-col rounded-3xl border bg-card p-7 text-card-foreground sm:p-8',
                      featured && 'border-primary shadow-lg shadow-primary/10',
                    )}
                  >
                    <div className="min-h-7">
                      {featured && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Para trabalhar em equipe
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 font-heading text-xl font-semibold">{plan.name}</h3>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                    <div className="mt-7">
                      {price ? (
                        <p>
                          <span className="text-4xl font-semibold tracking-tight">{formatPrice(price)}</span>

                          <span className="ml-2 text-sm text-muted-foreground">
                            / {activeInterval === 'YEAR' ? 'ano' : 'mês'}
                          </span>
                        </p>
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">Indisponível neste período</p>
                      )}
                    </div>

                    <ul className="my-8 space-y-3">
                      {getPlanFeatures(plan).map((feature) => (
                        <li key={feature} className="flex gap-3 text-sm">
                          <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {price ? (
                        <MarketingLink
                          href={{
                            pathname: '/cadastro',
                            query: {
                              planPriceId: price.id,
                            },
                          }}
                          variant={featured ? 'primary' : 'outline'}
                          className="w-full"
                        >
                          Escolher plano
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </MarketingLink>
                      ) : (
                        <Button type="button" variant="outline" disabled className="min-h-12 w-full rounded-xl">
                          Sem opção {activeInterval === 'YEAR' ? 'anual' : 'mensal'}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
