import { Banknote, CalendarDays, Ruler } from 'lucide-react';

import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import type { CatalogService } from '@/modules/serviceCatalog/types/catalogService.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

export function CatalogServiceMetrics({ service }: { service: CatalogService }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Banknote aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor base</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{formatBrlCurrency(service.amountInCents)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Ruler aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unidade</p>
            <p className="mt-1 text-lg font-semibold">{getServiceUnitLabel(service.unit)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <CalendarDays aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última atualização</p>
            <p className="mt-1 text-lg font-semibold">{formatDate(service.updatedAt)}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
