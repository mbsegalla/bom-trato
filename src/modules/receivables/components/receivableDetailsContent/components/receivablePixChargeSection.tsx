'use client';

import { Clipboard, LoaderCircle, QrCode, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

import { canRecordReceivablePayment } from '../../../constants/receivable.constants';
import { createReceivablePixQrCode, type ReceivablePixQrCode } from '../../../helpers/receivablePixQrCode.helper';
import { getReceivablePixCharge } from '../../../services/receivablePixCharge.service';
import type { Receivable } from '../../../types/receivable.types';
import type { ReceivablePixCharge } from '../../../types/receivablePixCharge.types';

interface ReceivablePixChargeSectionProps {
  receivable: Receivable;
  onReceivableChanged: () => void;
}

interface PixPreview {
  charge: ReceivablePixCharge;
  qr: ReceivablePixQrCode;
}

export function ReceivablePixChargeSection({ receivable, onReceivableChanged }: ReceivablePixChargeSectionProps) {
  const { activeOrganization, switchingOrganization } = useApp();
  const router = useRouter();
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PixPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const eligible =
    activeOrganization.role === 'OWNER' &&
    activeOrganization.id === receivable.organizationId &&
    canRecordReceivablePayment(receivable.status) &&
    receivable.currency === 'brl' &&
    receivable.balanceInCents > 0;
  const canGenerate = eligible && !switchingOrganization;

  async function generate(): Promise<void> {
    if (!canGenerate || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setPreview(null);
    setError(null);

    try {
      const charge = await getReceivablePixCharge(receivable.organizationId, receivable.id);

      if (!mountedRef.current) {
        return;
      }

      if (charge.receivableVersion !== receivable.version || charge.amountInCents !== receivable.balanceInCents) {
        onReceivableChanged();
        toast.info('O saldo foi alterado. Confira os dados atualizados e gere um novo Pix.');
        return;
      }

      const qr = createReceivablePixQrCode(charge.copyAndPaste);

      setPreview({ charge, qr });
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o Pix.');
    } finally {
      loadingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  async function copy(): Promise<void> {
    if (!preview || !canGenerate || loadingRef.current) {
      return;
    }

    try {
      await navigator.clipboard.writeText(preview.charge.copyAndPaste);
      toast.success('Pix Copia e Cola copiado.');
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie o código manualmente.');
    }
  }

  if (!eligible) {
    return null;
  }

  return (
    <section className="mt-6 border-l-2 border-primary bg-muted/30 px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading font-semibold">Cobrança Pix</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um QR Code estático com o saldo em aberto e a chave cadastrada em Recebimentos.
          </p>
          <Link href="/settings?tab=receiving" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Configurar recebimentos
          </Link>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!canGenerate || loading}
          onClick={() => void generate()}
          className="cursor-pointer"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : preview ? (
            <RefreshCw aria-hidden="true" className="size-4" />
          ) : (
            <QrCode aria-hidden="true" className="size-4" />
          )}
          {preview ? 'Gerar novamente' : 'Gerar Pix'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {preview && canGenerate && (
        <div className="mt-5 space-y-4">
          <div className="grid items-start gap-5 rounded-xl border border-border bg-background p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <svg
              role="img"
              aria-label="QR Code Pix para o saldo em aberto"
              viewBox={`0 0 ${preview.qr.size} ${preview.qr.size}`}
              shapeRendering="crispEdges"
              className="mx-auto size-56 max-w-full bg-white sm:mx-0"
            >
              <rect width={preview.qr.size} height={preview.qr.size} fill="#fff" />
              <path d={preview.qr.path} fill="#000" />
            </svg>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Valor em aberto</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatBrlCurrency(preview.charge.amountInCents)}</p>
              <p className="mt-3 text-sm text-muted-foreground">Recebedor informado</p>
              <p className="mt-1 break-words font-medium">{preview.charge.merchantName}</p>
              <p className="mt-3 text-xs break-all text-muted-foreground">Referência: {preview.charge.txid}</p>

              <label htmlFor="receivable-pix-copy" className="mt-4 block text-sm font-medium">
                Pix Copia e Cola
              </label>
              <Textarea
                id="receivable-pix-copy"
                readOnly
                spellCheck={false}
                value={preview.charge.copyAndPaste}
                className="mt-2 min-h-24 break-all font-mono text-xs"
              />
              <Button type="button" variant="outline" onClick={() => void copy()} className="mt-3 cursor-pointer">
                <Clipboard aria-hidden="true" className="size-4" />
                Copiar código Pix
              </Button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Confira o recebedor e o valor no aplicativo do banco antes de pagar. O Pix estático contém a chave
            cadastrada e pode ser reutilizado; códigos já compartilhados não podem ser cancelados pelo Bom Trato.
            Gere novamente após alterações no saldo ou na chave. Confirme o recebimento no banco antes de registrar
            o pagamento manualmente.
          </p>

          <Button type="button" variant="ghost" onClick={() => setPreview(null)} className="cursor-pointer">
            Fechar cobrança
          </Button>
        </div>
      )}
    </section>
  );
}
