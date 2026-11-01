'use client';

import { Check, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { findSelectedPlan, getPlanUserLimitLabel } from '@/modules/plans/helpers/plan.helper';
import {
  getAnnualSavingsPercentage,
  getMonthlyEquivalentAmount,
  getPlanPriceByInterval,
  getPricePeriodLabel,
} from '@/modules/plans/helpers/planPrice.helper';
import { listPlans } from '@/modules/plans/services/plan.service';
import type { Plan, PricingInterval } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { selectOnboardingPlan } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';

interface OnboardingPlanSelectionProps {
  organizationId: string;
  selectedPlanPriceId?: string;
  onSelected(state: OnboardingState): void;
}

export function OnboardingPlanSelection({
  organizationId,
  selectedPlanPriceId,
  onSelected,
}: OnboardingPlanSelectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInterval, setBillingInterval] = useState<PricingInterval>('MONTH');
  const [loading, setLoading] = useState(true);
  const [selectingPriceId, setSelectingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listPlans()
      .then((result) => {
        if (!active) {
          return;
        }

        if (!result.success) {
          setError(result.message);

          return;
        }

        setPlans(result.plans);

        if (selectedPlanPriceId) {
          const selected = findSelectedPlan(result.plans, selectedPlanPriceId);

          if (selected) {
            setBillingInterval(selected.price.interval);
          }
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar os planos.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedPlanPriceId]);

  const selectedPlan = useMemo(
    () => (selectedPlanPriceId ? findSelectedPlan(plans, selectedPlanPriceId) : null),
    [plans, selectedPlanPriceId],
  );

  const hasMonthlyPrices = useMemo(
    () => plans.some((plan) => getPlanPriceByInterval(plan, 'MONTH') !== undefined),
    [plans],
  );

  const hasYearlyPrices = useMemo(
    () => plans.some((plan) => getPlanPriceByInterval(plan, 'YEAR') !== undefined),
    [plans],
  );

  async function select(priceId: string): Promise<void> {
    if (selectingPriceId !== null || priceId === selectedPlanPriceId) {
      return;
    }

    setSelectingPriceId(priceId);
    setError(null);

    try {
      const state = await selectOnboardingPlan(organizationId, priceId);

      onSelected(state);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível selecionar o plano.');
    } finally {
      setSelectingPriceId(null);
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" className="flex min-h-40 items-center justify-center">
        <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0 && !error) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Nenhum plano está disponível no momento.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex border-b border-border">
        <button
          type="button"
          disabled={!hasMonthlyPrices || selectingPriceId !== null}
          onClick={() => setBillingInterval('MONTH')}
          className={
            billingInterval === 'MONTH'
              ? '-mb-px cursor-pointer border-b-2 border-primary px-4 py-3 text-sm font-semibold text-foreground'
              : '-mb-px cursor-pointer border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          Mensal
        </button>

        <button
          type="button"
          disabled={!hasYearlyPrices || selectingPriceId !== null}
          onClick={() => setBillingInterval('YEAR')}
          className={
            billingInterval === 'YEAR'
              ? '-mb-px cursor-pointer border-b-2 border-primary px-4 py-3 text-sm font-semibold text-foreground'
              : '-mb-px cursor-pointer border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          Anual
        </button>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = getPlanPriceByInterval(plan, billingInterval);

          const current = price?.id === selectedPlanPriceId;

          const samePlan = selectedPlan?.plan.id === plan.id;

          const annualSavings = billingInterval === 'YEAR' ? getAnnualSavingsPercentage(plan) : null;

          const monthlyEquivalent = price ? getMonthlyEquivalentAmount(price) : null;

          return (
            <article
              key={plan.id}
              className={
                current
                  ? 'flex h-full flex-col rounded-2xl border border-primary/40 bg-primary/5 p-6'
                  : 'flex h-full flex-col rounded-2xl border border-border bg-card p-6'
              }
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>

                {current && <span className="shrink-0 text-xs font-semibold text-primary">Selecionado</span>}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

              {price ? (
                <>
                  <div className="mt-5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-3xl font-semibold tracking-tight whitespace-nowrap">
                        {formatBrlCurrency(price.amountInCents)}
                      </span>

                      <span className="text-sm whitespace-nowrap text-muted-foreground">
                        {getPricePeriodLabel(price)}
                      </span>
                    </div>

                    {monthlyEquivalent !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Equivale a {formatBrlCurrency(monthlyEquivalent)} por mês
                      </p>
                    )}

                    {annualSavings !== null && (
                      <p className="mt-2 text-xs font-semibold text-primary">Economize {annualSavings}% no anual</p>
                    )}
                  </div>

                  <ul className="mt-5 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />

                      <span>{getPlanUserLimitLabel(plan)}</span>
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

                  <div className="mt-auto pt-6">
                    <Button
                      type="button"
                      variant={current ? 'outline' : 'default'}
                      disabled={selectingPriceId !== null || current}
                      onClick={() => void select(price.id)}
                      className="min-h-12 w-full cursor-pointer rounded-xl"
                    >
                      {current ? (
                        'Plano atual'
                      ) : selectingPriceId === price.id ? (
                        <>
                          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                          Alterando...
                        </>
                      ) : samePlan ? (
                        billingInterval === 'YEAR' ? (
                          'Mudar para o anual'
                        ) : (
                          'Mudar para o mensal'
                        )
                      ) : selectedPlanPriceId ? (
                        'Mudar para este plano'
                      ) : (
                        'Escolher plano'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-5 text-sm font-medium text-muted-foreground">
                    {billingInterval === 'YEAR'
                      ? 'Preço anual indisponível para este plano.'
                      : 'Preço mensal indisponível para este plano.'}
                  </p>

                  <div className="mt-auto pt-6">
                    <Button type="button" variant="outline" disabled className="min-h-12 w-full rounded-xl">
                      Indisponível
                    </Button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
