import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan, PlanPrice, PricingInterval } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { getBillingIntervalLabel } from '../../../constants/billing.constants';

interface PlanSelectionProps {
  plans: Plan[];
  currentPlanPriceId: string;
  memberCount: number;
  selectedInterval: PricingInterval;
  availableIntervals: { value: PricingInterval; label: string }[];
  loadingPriceId: string | null;
  onIntervalChange: (interval: PricingInterval) => void;
  onSelectPrice: (price: PlanPrice) => void;
}

export function PlanSelection({
  plans,
  currentPlanPriceId,
  memberCount,
  selectedInterval,
  availableIntervals,
  loadingPriceId,
  onIntervalChange,
  onSelectPrice,
}: PlanSelectionProps) {
  return (
    <>
      {availableIntervals.length > 1 && (
        <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
          {availableIntervals.map((interval) => (
            <Button
              key={interval.value}
              type="button"
              size="sm"
              variant={selectedInterval === interval.value ? 'default' : 'ghost'}
              onClick={() => onIntervalChange(interval.value)}
              className="flex-1 cursor-pointer rounded-lg"
            >
              {interval.label}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => {
          const price = plan.prices.find(
            (candidate) => candidate.interval === selectedInterval && candidate.intervalCount === 1,
          );

          if (!price) return null;

          const currentPrice = price.id === currentPlanPriceId;
          const memberLimitInvalid = plan.maxUsers < memberCount;

          return (
            <article
              key={plan.id}
              className={cn('rounded-2xl border border-border p-5', currentPrice && 'bg-muted/30')}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                    {currentPrice && (
                      <span className="rounded-full bg-success-surface px-2.5 py-1 text-xs font-medium text-success">
                        Plano atual
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4 text-xl font-semibold">
                    {formatBrlCurrency(price.amountInCents)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      / {getBillingIntervalLabel(price.interval)}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Até {plan.maxUsers} usuários</p>
                  {memberLimitInvalid && (
                    <p className="mt-2 text-xs text-destructive">
                      Sua equipe atual possui mais usuários do que este plano permite.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant={currentPrice ? 'outline' : 'default'}
                  disabled={currentPrice || memberLimitInvalid || loadingPriceId !== null}
                  onClick={() => onSelectPrice(price)}
                  className="cursor-pointer"
                >
                  {loadingPriceId === price.id && <LoaderCircle className="size-4 animate-spin" />}
                  {currentPrice ? 'Atual' : 'Selecionar'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
