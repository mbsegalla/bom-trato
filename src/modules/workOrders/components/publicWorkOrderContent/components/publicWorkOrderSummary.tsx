import { ReceiptText, Wallet } from 'lucide-react';

import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import type {
  PublicWorkOrder,
  PublicWorkOrderDetails,
  PublicWorkOrderFinancial,
} from '../../../types/workOrderPortal.types';

interface PublicWorkOrderSummaryProps {
  portal: PublicWorkOrder;
}

export function PublicWorkOrderSummary({ portal }: PublicWorkOrderSummaryProps) {
  return (
    <div className="space-y-4">
      <PublicWorkOrderItems workOrder={portal.workOrder} />

      <PublicWorkOrderFinancialSummary workOrder={portal.workOrder} financial={portal.financial} />
    </div>
  );
}

function PublicWorkOrderItems({ workOrder }: { workOrder: PublicWorkOrderDetails }) {
  const items = [...workOrder.items].sort((left, right) => left.position - right.position);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-center gap-3">
        <ReceiptText aria-hidden="true" className="size-5 shrink-0 text-primary" />

        <h2 className="font-heading text-lg font-semibold">Serviços contratados</h2>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">Itens do orçamento aprovado.</p>

      {items.length === 0 && <p className="mt-5 text-sm text-muted-foreground">Nenhum item disponível.</p>}

      <ul className="mt-4 divide-y divide-border">
        {items.map((item, index) => (
          <li key={`${item.position}:${index}`} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium wrap-break-word">{item.name}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBrlCurrency(item.unitAmountInCents)} / unidade
                </p>
              </div>

              <p className="shrink-0 text-sm font-semibold tabular-nums">{formatBrlCurrency(item.totalInCents)}</p>
            </div>

            {item.description && (
              <p className="mt-2 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
                {item.description}
              </p>
            )}
          </li>
        ))}
      </ul>

      <dl className="space-y-3 border-t border-border pt-4 text-sm">
        <FinancialRow label="Subtotal" value={formatBrlCurrency(workOrder.subtotalInCents)} />

        {workOrder.discountInCents > 0 && (
          <FinancialRow label="Desconto" value={`- ${formatBrlCurrency(workOrder.discountInCents)}`} />
        )}

        <FinancialRow label="Valor contratado" value={formatBrlCurrency(workOrder.totalInCents)} />
      </dl>
    </section>
  );
}

interface PublicWorkOrderFinancialSummaryProps {
  workOrder: PublicWorkOrderDetails;
  financial: PublicWorkOrderFinancial | null;
}

function PublicWorkOrderFinancialSummary({ workOrder, financial }: PublicWorkOrderFinancialSummaryProps) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-center gap-3">
        <Wallet aria-hidden="true" className="size-5 shrink-0 text-primary" />

        <h2 className="font-heading text-lg font-semibold">Resumo financeiro</h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Valores registrados pelo profissional.</p>

      <div className="mt-6 rounded-2xl bg-muted/40 p-5">
        <p className="text-xs text-muted-foreground">Valor contratado</p>

        <p className="mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums">
          {formatBrlCurrency(workOrder.totalInCents)}
        </p>
      </div>

      {financial === null ? (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          O resumo dos pagamentos está indisponível. Consulte o profissional para confirmar os valores.
        </p>
      ) : (
        <PublicWorkOrderPaymentSummary financial={financial} totalInCents={workOrder.totalInCents} />
      )}

      {workOrder.status === 'CANCELED' && (
        <p className="mt-5 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          Este atendimento foi cancelado. Confirme eventuais valores em aberto diretamente com o profissional.
        </p>
      )}
    </section>
  );
}

function PublicWorkOrderPaymentSummary({
  financial,
  totalInCents,
}: {
  financial: PublicWorkOrderFinancial;
  totalInCents: number;
}) {
  const hasContractBalance = financial.remainingContractInCents !== null;

  const paidPercentage = totalInCents > 0 ? Math.min(100, (financial.receivedInCents / totalInCents) * 100) : 0;

  return (
    <div className="mt-6">
      <dl className="space-y-4 text-sm">
        <FinancialRow label="Pagamentos registrados" value={formatBrlCurrency(financial.receivedInCents)} />

        <FinancialRow label="Recebíveis em aberto" value={formatBrlCurrency(financial.outstandingReceivablesInCents)} />
      </dl>

      {hasContractBalance && totalInCents > 0 && (
        <div className="mt-5">
          <progress
            aria-label="Percentual do valor contratado registrado como recebido"
            value={paidPercentage}
            max={100}
            className="block h-2 w-full overflow-hidden rounded-full accent-primary"
          />

          <p className="mt-2 text-xs text-muted-foreground">
            {Math.round(paidPercentage)}% do valor contratado registrado como recebido
          </p>
        </div>
      )}

      {financial.remainingContractInCents !== null && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">Saldo do contrato</p>

          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-primary tabular-nums">
            {formatBrlCurrency(financial.remainingContractInCents)}
          </p>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            O saldo contratual pode incluir valores ainda não lançados para cobrança. Ele não representa necessariamente
            uma dívida vencida.
          </p>
        </div>
      )}
    </div>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>

      <dd className="shrink-0 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
