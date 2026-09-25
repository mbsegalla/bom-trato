import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getBillingIntervalLabel, getPlanChangeModeLabel } from '../../../constants/billing.constants';
import type { PlanChange } from '../../../types/billing.types';

interface PlanChangePreviewProps {
  change: PlanChange;
  target: { plan: Plan; price: PlanPrice } | null;
  confirming: boolean;
  error: string | null;
  onBack(): void;
  onConfirm(): void;
}

export function PlanChangePreview({ change, target, confirming, error, onBack, onConfirm }: PlanChangePreviewProps) {
  return (
    <div>
      <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-primary">
        {getPlanChangeModeLabel(change.mode)}
      </span>
      <h3 className="mt-5 font-heading text-xl font-semibold">Confirmar alteração</h3>

      <div className="mt-6 rounded-2xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Novo plano</p>
        <p className="mt-1 text-lg font-semibold">{target?.plan.name ?? 'Plano selecionado'}</p>
        <p className="mt-2">
          {formatBrlCurrency(change.targetAmountInCents)} / {getBillingIntervalLabel(change.targetInterval)}
        </p>

        {change.mode === 'IMMEDIATE' ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Valor adicional agora</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{formatBrlCurrency(change.amountDueNow)}</p>
          </div>
        ) : (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Alteração efetiva em</p>
            <p className="mt-1 font-semibold">
              {change.effectiveAt ? formatDateTime(change.effectiveAt) : 'Próximo ciclo'}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Esta prévia é válida até {formatDateTime(change.quoteExpiresAt)}.
      </p>
      {error && (
        <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button type="button" variant="outline" disabled={confirming} onClick={onBack} className="cursor-pointer">
          Voltar
        </Button>
        <Button type="button" disabled={confirming} onClick={onConfirm} className="cursor-pointer">
          {confirming && <LoaderCircle className="size-4 animate-spin" />}
          Confirmar alteração
        </Button>
      </div>
    </div>
  );
}
