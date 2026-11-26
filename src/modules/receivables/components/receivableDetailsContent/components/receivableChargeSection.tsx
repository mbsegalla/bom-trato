'use client';

import { LoaderCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { getCustomerOverview } from '@/modules/customers/services/customer.service';
import { formatBrazilianPhone } from '@/shared/formatters/phone.formatter';

import {
  canPrepareReceivableCharge,
  createReceivableChargeMessage,
} from '../../../helpers/receivableWhatsapp.helper';
import { getReceivable } from '../../../services/receivable.service';
import type { Receivable } from '../../../types/receivable.types';

interface ReceivableChargeSectionProps {
  receivable: Receivable;
  onReceivableSaved: (receivable: Receivable) => void;
}

interface ChargePreview {
  message: string;
  url: string;
  customerName: string;
  phone: string;
}

export function ReceivableChargeSection({ receivable, onReceivableSaved }: ReceivableChargeSectionProps) {
  const { activeOrganization, switchingOrganization } = useApp();
  const router = useRouter();
  const mountedRef = useRef(false);
  const preparingRef = useRef(false);
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<ChargePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canPrepare =
    !switchingOrganization &&
    receivable.organizationId === activeOrganization.id &&
    canPrepareReceivableCharge(receivable);

  async function prepare(): Promise<void> {
    if (!canPrepare || preparingRef.current) {
      return;
    }

    preparingRef.current = true;
    setPreparing(true);
    setPreview(null);
    setError(null);

    try {
      const latest = await getReceivable(activeOrganization.id, receivable.id);

      if (!mountedRef.current) {
        return;
      }

      if (
        latest.id !== receivable.id ||
        latest.organizationId !== activeOrganization.id ||
        latest.customerId !== receivable.customerId
      ) {
        throw new Error('Não foi possível confirmar os dados deste recebível.');
      }

      if (
        latest.version !== receivable.version ||
        latest.status !== receivable.status ||
        latest.balanceInCents !== receivable.balanceInCents
      ) {
        onReceivableSaved(latest);
        toast.info('O recebível foi atualizado. Confira os valores antes de preparar outra mensagem.');
        return;
      }

      if (!canPrepareReceivableCharge(latest)) {
        throw new Error('Este recebível não possui saldo disponível para cobrança.');
      }

      const { customer } = await getCustomerOverview(activeOrganization.id, latest.customerId);

      if (!mountedRef.current) {
        return;
      }

      const result = createReceivableChargeMessage(latest, customer, activeOrganization.name);

      setPreview({
        ...result,
        customerName: customer.name,
        phone: formatBrazilianPhone(customer.phone),
      });
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a cobrança.');
    } finally {
      preparingRef.current = false;

      if (mountedRef.current) {
        setPreparing(false);
      }
    }
  }

  if (!canPrepareReceivableCharge(receivable)) {
    return null;
  }

  return (
    <section className="mt-6 border-l-2 border-primary bg-muted/30 px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading font-semibold">Cobrança pelo WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prepare um lembrete com o saldo em aberto e confira o destinatário antes de enviar.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!canPrepare || preparing}
          onClick={() => void prepare()}
          className="cursor-pointer"
        >
          {preparing ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : preview ? (
            <RefreshCw aria-hidden="true" className="size-4" />
          ) : (
            <MessageCircle aria-hidden="true" className="size-4" />
          )}
          {preview ? 'Atualizar mensagem' : 'Preparar mensagem'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {preview && canPrepare && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-medium">{preview.customerName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{preview.phone}</p>
            <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed whitespace-pre-wrap">
              {preview.message}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Confira o saldo e o número antes de enviar. O WhatsApp abre com a mensagem preenchida; o envio e o registro
            do pagamento continuam manuais.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'min-h-9 cursor-pointer')}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Abrir no WhatsApp
            </a>
            <Button type="button" variant="ghost" onClick={() => setPreview(null)} className="cursor-pointer">
              Fechar prévia
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
