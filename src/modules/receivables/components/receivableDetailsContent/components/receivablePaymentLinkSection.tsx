'use client';

import { Clipboard, Link2, LoaderCircle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { getCustomerOverview } from '@/modules/customers/services/customer.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { formatBrazilianPhone } from '@/shared/formatters/phone.formatter';

import { canPrepareReceivableCharge, createReceivableChargeMessage } from '../../../helpers/receivableWhatsapp.helper';
import {
  createReceivablePaymentLink,
  getReceivablePaymentLinkStatus,
  revokeReceivablePaymentLink,
} from '../../../services/receivablePaymentLink.service';
import type { Receivable } from '../../../types/receivable.types';
import type {
  CreatedReceivablePaymentLink,
  ReceivablePaymentLinkStatus,
} from '../../../types/receivablePaymentLink.types';

interface ReceivablePaymentLinkSectionProps {
  receivable: Receivable;
}

export function ReceivablePaymentLinkSection({ receivable }: ReceivablePaymentLinkSectionProps) {
  const { activeOrganization, switchingOrganization } = useApp();

  if (activeOrganization.role !== 'OWNER' || activeOrganization.id !== receivable.organizationId) {
    return null;
  }

  return <PaymentLinkPanel receivable={receivable} disabled={switchingOrganization} />;
}

function PaymentLinkPanel({ receivable, disabled }: ReceivablePaymentLinkSectionProps & { disabled: boolean }) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const pendingRef = useRef(false);
  const [status, setStatus] = useState<ReceivablePaymentLinkStatus | null>(null);
  const [created, setCreated] = useState<CreatedReceivablePaymentLink | null>(null);
  const [whatsapp, setWhatsapp] = useState<{
    url: string;
    customerName: string;
    phone: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { organizationId, id: receivableId, version } = receivable;
  const { activeOrganization } = useApp();

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    void getReceivablePaymentLinkStatus(organizationId, receivableId)
      .then((result) => {
        if (active) {
          setStatus(result);
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível consultar o link.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [organizationId, receivableId, router]);

  async function run(operation: () => Promise<void>): Promise<void> {
    if (loading || disabled || pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      await operation();
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.');
    } finally {
      pendingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  async function generate(): Promise<void> {
    setCreated(null);
    setWhatsapp(null);

    await run(async () => {
      const result = await createReceivablePaymentLink(organizationId, receivableId, version);

      if (mountedRef.current) {
        setCreated(result);
        setStatus({ active: true, expiresAt: result.expiresAt });
        toast.success('Link de pagamento gerado.');
      }
    });
  }

  async function revoke(): Promise<void> {
    setCreated(null);
    setWhatsapp(null);

    await run(async () => {
      await revokeReceivablePaymentLink(organizationId, receivableId);

      if (mountedRef.current) {
        setStatus(null);
        toast.success('Link de pagamento revogado.');
      }
    });
  }

  async function prepareWhatsapp(): Promise<void> {
    if (!created) {
      return;
    }

    setWhatsapp(null);

    await run(async () => {
      const { customer } = await getCustomerOverview(organizationId, receivable.customerId);
      const { message, url } = createReceivableChargeMessage(receivable, customer, activeOrganization.name);
      const current = await getReceivablePaymentLinkStatus(organizationId, receivableId);

      if (!current?.active || current.expiresAt.getTime() !== created.expiresAt.getTime()) {
        throw new Error('O link mudou ou está indisponível. Gere um novo link antes de compartilhar.');
      }

      const target = new URL(url);

      const text = `${message}\n\nLink de pagamento Pix: ${created.url}`;

      target.searchParams.set('text', text);

      if (mountedRef.current) {
        setWhatsapp({
          url: target.toString(),
          customerName: customer.name,
          phone: formatBrazilianPhone(customer.phone),
          message: text,
        });
      }
    });
  }

  async function copy(): Promise<void> {
    if (!created || disabled || loading) {
      return;
    }

    try {
      await navigator.clipboard.writeText(created.url);
      toast.success('Link copiado.');
    } catch {
      toast.error('Selecione e copie o link manualmente.');
    }
  }

  const eligible = canPrepareReceivableCharge(receivable);

  return (
    <section className="mt-6 border-l-2 border-primary bg-muted/30 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading font-semibold">Link de pagamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compartilhe uma página de pagamento Pix válida por sete dias. Gerar outro link invalida o anterior.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {eligible && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || loading}
              onClick={() => void generate()}
              className="cursor-pointer"
            >
              {loading ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Link2 aria-hidden="true" className="size-4" />
              )}
              {status?.active ? 'Gerar novo link' : 'Gerar link'}
            </Button>
          )}
          {status && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || loading}
              onClick={() => void revoke()}
              className="cursor-pointer"
            >
              Revogar link
            </Button>
          )}
        </div>
      </div>

      {status && (
        <p className="mt-3 text-sm text-muted-foreground">
          {status.active ? `Link ativo até ${formatDateTime(status.expiresAt)}.` : 'Link indisponível ou expirado.'}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {created && eligible && !disabled && (
        <div className="mt-4 space-y-3">
          <label htmlFor="receivable-payment-link" className="block text-sm font-medium">
            Link privado do cliente
          </label>
          <Input id="receivable-payment-link" readOnly value={created.url} className="font-mono text-xs" />

          <p className="text-xs text-muted-foreground">
            Copie agora: o token não é recuperável depois de sair da tela. Alterações no saldo ou nos dados Pix
            invalidam o link. Compartilhe apenas com o cliente correto.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => void copy()}>
              <Clipboard aria-hidden="true" className="size-4" />
              Copiar link
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={() => void prepareWhatsapp()}>
              <MessageCircle aria-hidden="true" className="size-4" />
              Preparar WhatsApp
            </Button>
          </div>

          {whatsapp && !loading && (
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium">Destinatário: {whatsapp.customerName}</p>
              <p className="text-xs text-muted-foreground">{whatsapp.phone}</p>
              <p className="text-sm leading-relaxed break-all whitespace-pre-wrap">{whatsapp.message}</p>
              <a
                href={whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
              >
                Abrir no WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Revogar a página não cancela códigos Pix já copiados. Confirme o recebimento no banco antes de registrar o
        pagamento.
      </p>
    </section>
  );
}
