import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Plan, PricingInterval } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { MarketingLink } from '../../marketingLink';
import { getPlanFeatures } from '../helpers/pricingSection.helper';

export function PricingCard({ plan, interval }: { plan: Plan; interval: PricingInterval }) {
  const price = plan.prices.find((item) => item.interval === interval && item.intervalCount === 1);
  const featured = plan.code === 'TEAM';

  return (
    <article
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
            <span className="text-4xl font-semibold tracking-tight">{formatBrlCurrency(price.amountInCents)}</span>
            <span className="ml-2 text-sm text-muted-foreground">/ {interval === 'YEAR' ? 'ano' : 'mês'}</span>
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
            href={{ pathname: '/register', query: { planPriceId: price.id } }}
            variant={featured ? 'primary' : 'outline'}
            className="w-full"
          >
            Escolher plano
            <ArrowRight aria-hidden="true" className="size-4" />
          </MarketingLink>
        ) : (
          <Button type="button" variant="outline" disabled className="min-h-12 w-full rounded-xl">
            Sem opção {interval === 'YEAR' ? 'anual' : 'mensal'}
          </Button>
        )}
      </div>
    </article>
  );
}
