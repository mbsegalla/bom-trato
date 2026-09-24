'use client';

import { Check, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { listPlans } from '@/modules/plans/services/plan.service';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { selectOnboardingPlan } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';

interface OnboardingPlanSelectionProps {
  organizationId: string;
  onSelected(state: OnboardingState): void;
}

function getPreferredPrice(plan: Plan): PlanPrice | undefined {
  return (
    plan.prices.find((price) => price.interval === 'MONTH' && price.intervalCount === 1) ??
    plan.prices.find((price) => price.intervalCount === 1)
  );
}

export function OnboardingPlanSelection({ organizationId, onSelected }: OnboardingPlanSelectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
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
  }, []);

  async function select(priceId: string): Promise<void> {
    if (selectingPriceId !== null) {
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
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const price = getPreferredPrice(plan);

          if (!price) {
            return null;
          }

          return (
            <article key={plan.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

              <p className="mt-5">
                <span className="text-3xl font-semibold tracking-tight">{formatBrlCurrency(price.amountInCents)}</span>

                <span className="ml-2 text-sm text-muted-foreground">
                  / {price.interval === 'YEAR' ? 'ano' : 'mês'}
                </span>
              </p>

              <ul className="mt-5 space-y-2 text-sm">
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

              <Button
                type="button"
                disabled={selectingPriceId !== null}
                onClick={() => void select(price.id)}
                className="mt-6 min-h-12 w-full rounded-xl"
              >
                {selectingPriceId === price.id ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    Selecionando...
                  </>
                ) : (
                  'Escolher plano'
                )}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
