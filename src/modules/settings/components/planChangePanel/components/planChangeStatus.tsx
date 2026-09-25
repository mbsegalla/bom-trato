import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getPlanChangeStatusLabel } from '../../../constants/billing.constants';
import type { PlanChange } from '../../../types/billing.types';

interface PlanChangeStatusProps {
  change: PlanChange;
  target: { plan: Plan; price: PlanPrice } | null;
  confirming: boolean;
  canceling: boolean;
  error: string | null;
  onRefresh(): void;
  onCancel(): void;
}

export function PlanChangeStatus({
  change,
  target,
  confirming,
  canceling,
  error,
  onRefresh,
  onCancel,
}: PlanChangeStatusProps) {
  return (
    <div>
      <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-primary">
        {getPlanChangeStatusLabel(change.status)}
      </span>
      <h3 className="mt-5 font-heading text-xl font-semibold">{target?.plan.name ?? 'Alteração de plano'}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {change.status === 'SCHEDULED' && change.effectiveAt
          ? `A mudança está programada para ${formatDateTime(change.effectiveAt)}.`
          : change.status === 'PROCESSING'
            ? 'A alteração está sendo processada pela Stripe.'
            : change.status === 'PENDING_PAYMENT'
              ? 'A alteração está aguardando a confirmação do pagamento.'
              : 'Estamos acompanhando o estado da alteração.'}
      </p>

      {error && (
        <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {change.status !== 'SCHEDULED' && (
          <Button type="button" disabled={confirming} onClick={onRefresh} className="cursor-pointer">
            {confirming && <LoaderCircle className="size-4 animate-spin" />}
            Atualizar status
          </Button>
        )}
        {['PROCESSING', 'PENDING_PAYMENT', 'SCHEDULED'].includes(change.status) && (
          <Button
            type="button"
            variant="destructive"
            disabled={canceling}
            onClick={onCancel}
            className="cursor-pointer"
          >
            {canceling && <LoaderCircle className="size-4 animate-spin" />}
            Cancelar alteração
          </Button>
        )}
      </div>
    </div>
  );
}
