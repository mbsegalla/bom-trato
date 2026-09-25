import { CalendarDays, CircleCheck, Clock3, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';
import { formatUserUsage } from '@/shared/formatters/userLimit.formatter';

import { getBillingIntervalLabel, getSubscriptionStatusLabel } from '../constants/billing.constants';
import type { BillingEntitlements, BillingSubscription, PlanChange } from '../types/billing.types';

interface SubscriptionOverviewProps {
  subscription: BillingSubscription;
  plan: Plan | null;
  price: PlanPrice | null;
  entitlements: BillingEntitlements;
  owner: boolean;
  activePlanChange: PlanChange | null;
  onChangePlan(): void;
  onCancel(): void;
  onResume(): void;
}

export function SubscriptionOverview({
  subscription,
  plan,
  price,
  entitlements,
  owner,
  activePlanChange,
  onChangePlan,
  onCancel,
  onResume,
}: SubscriptionOverviewProps) {
  const canChangePlan = owner && subscription.hasAccess && !subscription.cancelAtPeriodEnd && activePlanChange === null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-xl font-semibold">{plan?.name ?? 'Sua assinatura'}</h2>

            <span
              className={
                subscription.hasAccess
                  ? 'rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success'
                  : 'rounded-full bg-warning-surface px-3 py-1 text-xs font-medium text-warning'
              }
            >
              {getSubscriptionStatusLabel(subscription.status)}
            </span>
          </div>

          {plan?.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{plan.description}</p>}

          {price && (
            <p className="mt-4 text-2xl font-semibold">
              {formatBrlCurrency(price.amountInCents)}

              <span className="ml-2 text-sm font-normal text-muted-foreground">
                / {getBillingIntervalLabel(price.interval)}
              </span>
            </p>
          )}
        </div>

        {owner && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canChangePlan}
              onClick={onChangePlan}
              className="cursor-pointer"
            >
              Alterar plano
            </Button>

            {subscription.cancelAtPeriodEnd ? (
              <Button type="button" onClick={onResume} className="cursor-pointer">
                Retomar assinatura
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={activePlanChange !== null}
                onClick={onCancel}
                className="cursor-pointer"
              >
                Cancelar renovação
              </Button>
            )}
          </div>
        )}
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="mt-6 rounded-xl bg-warning-surface p-4 text-sm text-warning">
          A assinatura está programada para terminar em <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
          Você pode retomá-la antes dessa data.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />

            {subscription.cancelAtPeriodEnd ? 'Acesso até' : 'Próxima renovação'}
          </div>

          <p className="mt-2 font-semibold">{formatDate(subscription.currentPeriodEnd)}</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" />
            Início do período
          </div>

          <p className="mt-2 font-semibold">{formatDate(subscription.currentPeriodStart)}</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            Usuários
          </div>

          <p className="mt-2 font-semibold">{formatUserUsage(entitlements.memberCount, entitlements.maxUsers)}</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4" />
            Acesso
          </div>

          <p className="mt-2 font-semibold">{entitlements.hasAccess ? 'Liberado' : 'Restrito'}</p>
        </div>
      </div>
    </section>
  );
}
