import { Mail, MapPin, Phone } from 'lucide-react';

import type { CustomerOverview } from '@/modules/customers/types/customer.types';
import { formatDate } from '@/shared/formatters/date.formatter';
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from '@/shared/formatters/phone.formatter';

interface CustomerContactCardProps {
  customer: NonNullable<CustomerOverview['customer']>;
}

export function CustomerContactCard({ customer }: CustomerContactCardProps) {
  const validPhone = customer.phone ? isValidBrazilianPhone(customer.phone) : false;

  const formattedPhone = customer.phone ? formatBrazilianPhone(customer.phone) : null;

  const phoneHref = customer.phone && validPhone ? `tel:+55${normalizeBrazilianPhone(customer.phone)}` : null;

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">Contato</h2>

      <div className="mt-5 space-y-5">
        <div className="flex items-start gap-3">
          <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">E-mail</p>

            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="mt-1 block truncate text-sm font-medium hover:text-primary"
              >
                {customer.email}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Não informado</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-xs text-muted-foreground">Telefone</p>

            {formattedPhone ? (
              phoneHref ? (
                <a href={phoneHref} className="mt-1 block text-sm font-medium hover:text-primary">
                  {formattedPhone}
                </a>
              ) : (
                <p className="mt-1 text-sm font-medium">{formattedPhone}</p>
              )
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Não informado</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-xs text-muted-foreground">Endereço padrão do serviço</p>

            {customer.defaultServiceAddress ? (
              <p className="mt-1 text-sm font-medium whitespace-pre-wrap">{customer.defaultServiceAddress}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Não informado</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Última atualização em {formatDate(customer.updatedAt)}
      </p>
    </section>
  );
}
