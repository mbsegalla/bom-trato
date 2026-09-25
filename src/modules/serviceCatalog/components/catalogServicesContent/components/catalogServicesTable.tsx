import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
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
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Serviço</th>
              <th className="px-6 py-3">Unidade</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Atualizado em</th>
              <th className="w-16 px-6 py-3">
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((service) => (
              <tr key={service.id} className="transition-colors hover:bg-muted/30">
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 text-sm text-muted-foreground">{getServiceUnitLabel(service.unit)}</td>
                <td className="px-6 py-4 font-medium">{formatBrlCurrency(service.amountInCents)}</td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(service.updatedAt)}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/services-catalog/${service.id}`}
                    aria-label={`Abrir ${service.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6">
        <p className="text-sm text-muted-foreground">Página {data.page}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page <= 1}
            aria-label="Página anterior"
            onClick={onPreviousPage}
            className="cursor-pointer"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!data.hasMore}
            aria-label="Próxima página"
            onClick={onNextPage}
            className="cursor-pointer"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </footer>
    </>
  );
}
