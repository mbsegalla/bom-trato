import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SelectedPlan } from '@/modules/plans/helpers/plan.helper';
import { getPricePeriodLabel, getRecurringBillingLabel } from '@/modules/plans/helpers/planPrice.helper';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { PlanSummarySkeleton } from './planSummarySkeleton';

interface PlanSummaryProps {
  selectedPlan: SelectedPlan | null;
  loading: boolean;
  error: string | null;
  onChangePlan(): void;
}

export function PlanSummary({ selectedPlan, loading, error, onChangePlan }: PlanSummaryProps) {
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Plano selecionado</p>

        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onChangePlan}
          className="h-auto cursor-pointer p-0 font-semibold"
        >
          Alterar plano
        </Button>
      </div>

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
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />

            <span>
              Até {plan.maxUsers} {plan.maxUsers === 1 ? 'usuário' : 'usuários'}
            </span>
          </li>

          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />

            <span>Clientes, orçamentos e serviços organizados</span>
          </li>

          {plan.teamManagementEnabled && (
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />

              <span>Gestão de equipe</span>
            </li>
          )}
        </ul>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{getRecurringBillingLabel(price)}</p>
    </section>
  );
}
