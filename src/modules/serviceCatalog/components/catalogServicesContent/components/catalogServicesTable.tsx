import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import type { CatalogServicePage } from '@/modules/serviceCatalog/types/catalogService.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

interface CatalogServicesTableProps {
  data: CatalogServicePage;
  page: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function CatalogServicesTable({ data, page, onPreviousPage, onNextPage }: CatalogServicesTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-210 border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Serviço</th>
              <th className="px-5 py-3">Unidade</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Atualizado em</th>
              <th className="w-14 px-5 py-3">
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((service) => (
              <tr key={service.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/services-catalog/${service.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {service.name}
                  </Link>

                  {service.description && (
                    <p className="mt-1 max-w-md truncate text-sm text-muted-foreground">{service.description}</p>
                  )}
                </td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">{getServiceUnitLabel(service.unit)}</td>

                <td className="px-5 py-3.5 font-medium">{formatBrlCurrency(service.amountInCents)}</td>

                <td className="px-5 py-3.5">
                  {service.archivedAt ? (
                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Arquivado
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">
                      Ativo
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(service.updatedAt)}</td>

                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/services-catalog/${service.id}`}
                    aria-label={`Abrir ${service.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} hasMore={data.hasMore} onPrevious={onPreviousPage} onNext={onNextPage} />
    </>
  );
}
