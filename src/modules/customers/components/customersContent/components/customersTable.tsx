import { ArrowRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
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
            <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3 text-left">Cliente</th>
              <th className="px-5 py-3 text-center">Contato</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-center">Criado em</th>
              <th className="w-14 px-5 py-3 text-center">
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((customer) => (
              <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5 align-middle">
                  <Link href={`/customers/${customer.id}`} className="font-medium hover:text-primary hover:underline">
                    {customer.name}
                  </Link>
                </td>

                <td className="px-5 py-3.5 text-center align-middle">
                  <div className="inline-block space-y-1 text-left text-sm">
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

                <td className="px-5 py-3.5 text-center align-middle">
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

                <td className="px-5 py-3.5 text-center align-middle text-sm text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </td>

                <td className="px-5 py-3.5 text-center align-middle">
                  <Link
                    href={`/customers/${customer.id}`}
                    aria-label={`Abrir ${customer.name}`}
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
