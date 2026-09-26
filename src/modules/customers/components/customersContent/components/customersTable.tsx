import { ArrowRight, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { CustomerPage } from '@/modules/customers/types/customer.types';
import { formatDate } from '@/shared/formatters/date.formatter';
import { formatBrazilianPhone } from '@/shared/formatters/phone.formatter';

interface CustomersTableProps {
  data: CustomerPage;
  page: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function CustomersTable({ data, page, onPreviousPage, onNextPage }: CustomersTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Contato</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Criado em</th>
              <th className="w-16 px-6 py-3">
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((customer) => (
              <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                <td className="px-6 py-4">
                  <Link href={`/customers/${customer.id}`} className="font-medium hover:text-primary hover:underline">
                    {customer.name}
                  </Link>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail aria-hidden="true" className="size-3.5" />
                        <span className="max-w-64 truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone aria-hidden="true" className="size-3.5" />
                        <span>{formatBrazilianPhone(customer.phone)}</span>
                      </div>
                    )}

                    {!customer.email && !customer.phone && <span className="text-muted-foreground">Sem contato</span>}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {customer.archivedAt ? (
                    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Arquivado
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">
                      Ativo
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(customer.createdAt)}</td>

                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/customers/${customer.id}`}
                    aria-label={`Abrir ${customer.name}`}
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
