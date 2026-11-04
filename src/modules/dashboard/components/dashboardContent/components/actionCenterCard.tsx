import { ArrowRight, BriefcaseBusiness, CircleCheck, FileClock, FileWarning, ReceiptText } from 'lucide-react';
import Link from 'next/link';

import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface DashboardActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof FileClock;
}

function buildActions(data: DashboardData): DashboardActionItem[] {
  const actions: DashboardActionItem[] = [];

  if (data.financial.currentReceivables.overdueCount > 0) {
    actions.push({
      id: 'overdue-receivables',
      title:
        data.financial.currentReceivables.overdueCount === 1
          ? '1 recebimento está em atraso'
          : `${data.financial.currentReceivables.overdueCount} recebimentos estão em atraso`,
      description: `${formatBrlCurrency(data.financial.currentReceivables.overdueAmountInCents)} ainda aguardando recebimento.`,
      href: '/receivables',
      icon: ReceiptText,
    });
  }

  if (data.summary.quotes.awaitingApproval > 0) {
    actions.push({
      id: 'awaiting-quotes',
      title:
        data.summary.quotes.awaitingApproval === 1
          ? '1 orçamento aguarda resposta'
          : `${data.summary.quotes.awaitingApproval} orçamentos aguardam resposta`,
      description: 'Acompanhe os clientes que ainda não decidiram sobre seus orçamentos.',
      href: '/quotes',
      icon: FileClock,
    });
  }

  if (data.summary.quotes.expiredSent > 0) {
    actions.push({
      id: 'expired-quotes',
      title:
        data.summary.quotes.expiredSent === 1
          ? '1 orçamento enviado expirou'
          : `${data.summary.quotes.expiredSent} orçamentos enviados expiraram`,
      description: 'Revise os orçamentos vencidos e decida se vale gerar uma nova proposta.',
      href: '/quotes',
      icon: FileWarning,
    });
  }

  if (data.summary.workOrders.open > 0) {
    actions.push({
      id: 'open-work-orders',
      title:
        data.summary.workOrders.open === 1
          ? '1 ordem de serviço aguarda planejamento'
          : `${data.summary.workOrders.open} ordens de serviço aguardam planejamento`,
      description: 'Defina responsável, endereço e agendamento dos próximos serviços.',
      href: '/work-orders',
      icon: BriefcaseBusiness,
    });
  }

  return actions;
}

export function ActionCenterCard({ data }: { data: DashboardData }) {
  const actions = buildActions(data);

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="border-b border-border pb-4">
        <h2 className="font-heading text-lg font-semibold">O que precisa acontecer agora</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Ações que ajudam sua operação e seu caixa a continuarem andando.
        </p>
      </div>

      {actions.length === 0 ? (
        <div className="py-8 text-center">
          <CircleCheck aria-hidden="true" className="mx-auto size-6 text-success" />

          <p className="mt-3 text-sm font-medium">Tudo em ordem por aqui.</p>

          <p className="mt-1 text-xs text-muted-foreground">Nenhuma pendência operacional importante neste momento.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link key={action.id} href={action.href} className="group flex items-start gap-3 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">{action.title}</p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
                </div>

                <ArrowRight
                  aria-hidden="true"
                  className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
