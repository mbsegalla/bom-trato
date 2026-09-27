'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DashboardFinancialTrend } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency, formatCompactBrlCurrency } from '@/shared/formatters/currency.formatter';

interface FinancialTrendChartProps {
  trend: DashboardFinancialTrend;
}

interface ChartItem {
  label: string;
  amountInCents: number;
  count: number;
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
});

function formatPeriodLabel(periodStart: Date): string {
  const month = monthFormatter.format(periodStart).replace('.', '');

  const year = String(periodStart.getFullYear()).slice(-2);

  return `${month}/${year}`;
}

export function FinancialTrendChart({ trend }: FinancialTrendChartProps) {
  const data: ChartItem[] = trend.items.map((item) => ({
    label: formatPeriodLabel(item.periodStart),
    amountInCents: item.amountInCents,
    count: item.count,
  }));

  const totalInCents = data.reduce((total, item) => total + item.amountInCents, 0);

  const hasReceipts = data.some((item) => item.amountInCents > 0);

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-surface text-success">
            <TrendingUp aria-hidden="true" className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold">Recebimentos nos últimos 6 meses</h2>

            <p className="mt-1 text-sm text-muted-foreground">Evolução dos pagamentos recebidos e não estornados.</p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Total no período</p>

          <p className="mt-1 text-lg font-semibold text-primary">{formatBrlCurrency(totalInCents)}</p>
        </div>
      </div>

      {hasReceipts ? (
        <div role="img" aria-label="Gráfico de recebimentos dos últimos 6 meses" className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 8,
                right: 8,
                bottom: 0,
                left: 8,
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: 12,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={72}
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: 12,
                }}
                tickFormatter={(value: number) => formatCompactBrlCurrency(value)}
              />

              <Tooltip
                cursor={{
                  fill: 'var(--muted)',
                  opacity: 0.45,
                }}
                formatter={(value) => [formatBrlCurrency(Number(value)), 'Recebido']}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{
                  color: 'var(--popover-foreground)',
                  fontWeight: 600,
                }}
              />

              <Bar dataKey="amountInCents" fill="var(--primary)" maxBarSize={56} radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-72 items-center justify-center rounded-xl bg-muted/30 px-6 text-center">
          <div>
            <p className="text-sm font-medium">Ainda não há recebimentos neste período</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Os pagamentos registrados aparecerão aqui conforme o histórico for crescendo.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
