import { Button } from '@/components/ui/button';
import type { PricingInterval } from '@/modules/plans/types/plan.types';

interface PricingIntervalToggleProps {
  periods: { value: PricingInterval; label: string }[];
  activeInterval: PricingInterval;
  onChange(interval: PricingInterval): void;
}

export function PricingIntervalToggle({ periods, activeInterval, onChange }: PricingIntervalToggleProps) {
  if (periods.length <= 1) return null;
  return (
    <div className="mt-8 flex justify-center">
      <div role="group" aria-label="Período de cobrança" className="inline-flex gap-1 rounded-xl border bg-card p-1">
        {periods.map((period) => (
          <Button
            key={period.value}
            type="button"
            variant={activeInterval === period.value ? 'default' : 'ghost'}
            aria-pressed={activeInterval === period.value}
            className="cursor-pointer"
            onClick={() => onChange(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
