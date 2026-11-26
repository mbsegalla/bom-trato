'use client';

import { Clipboard, LoaderCircle, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { createReceivablePixQrCode } from '../../../helpers/receivablePixQrCode.helper';
import { createReceivableLivePixSchema } from '../../../schemas/receivableLivePix.schema';
import {
  getReceivableLivePix,
  issueReceivableLivePix,
  recoverReceivableLivePix,
} from '../../../services/receivableLivePix.service';
import type { Receivable } from '../../../types/receivable.types';
import type { ReceivableLivePix } from '../../../types/receivableLivePix.types';

interface Props {
  receivable: Receivable;
  onReceivableChanged: () => void;
}

export function ReceivableLivePixSection(props: Props) {
  const { activeOrganization, switchingOrganization } = useApp();
  if (activeOrganization.id !== props.receivable.organizationId || activeOrganization.role !== 'OWNER') return null;

  return (
    <LivePixPanel
      key={`${props.receivable.organizationId}:${props.receivable.id}`}
      {...props}
      switchingOrganization={switchingOrganization}
    />
  );
}

const labels: Record<ReceivableLivePix['status'], string> = {
  NOT_ISSUED: 'Não emitido',
  PROCESSING: 'Emissão em processamento',
  PENDING: 'Aguardando pagamento',
  SETTLED: 'Pagamento conciliado',
  CLOSED: 'Cobrança encerrada',
  REVIEW_REQUIRED: 'Revisão necessária',
  EXPIRED: 'Expirado',
  STALE: 'Cobrança desatualizada',
};

const reviewLabels: Record<string, string> = {
  IN_PROGRESS: 'Consulta em andamento',
  ABANDONED: 'Consulta interrompida; tente novamente',
  NOT_FOUND: 'Pagamento não localizado pela referência',
  AMBIGUOUS: 'Mais de um pagamento encontrado',
  INVALID_PROVIDER_PAYMENT: 'Dados do pagamento divergentes',
  PROVIDER_UNAVAILABLE: 'Consulta ao Mercado Pago indisponível',
  CONNECTION_CHANGED: 'Conta ou autorização alterada',
  BINDING_CONFLICT: 'Identificador já vinculado',
  UNCERTAIN_CREATION: 'Resultado da emissão ainda não confirmado',
  SNAPSHOT_CHANGED: 'Recebível alterado durante a emissão',
  INVALID_BINDING: 'Vínculo de pagamento inconsistente',
  OWNER_CHANGED: 'Proprietário da organização alterado',
  VERIFIED_PENDING: 'Pagamento pendente',
  VERIFIED_CLOSED: 'Pagamento cancelado ou rejeitado',
  VERIFIED_REFUNDED: 'Estorno ou contestação',
  VERIFIED_REVIEW_REQUIRED: 'Status do provedor exige revisão',
  LEDGER_APPLIED: 'Pagamento registrado no financeiro',
  LEDGER_DUPLICATE: 'Pagamento já registrado',
  LEDGER_REVIEW_REQUIRED: 'Baixa exige revisão',
  LEDGER_UNMATCHED: 'Vínculo financeiro não localizado',
  CLOSED_AFTER_SETTLEMENT: 'Encerramento após baixa',
  APPROVAL_AFTER_CLOSURE: 'Aprovação recebida após encerramento',
  ISSUANCE_REVIEW_REQUIRED: 'Cobrança em revisão',
  UNMATCHED_PAYMENT: 'Pagamento sem vínculo confirmado',
  CREDENTIAL_UNAVAILABLE: 'Credencial da conta indisponível',
  PROCESSING_FAILED: 'Falha no processamento',
};

function reviewLabel(code: string): string {
  return reviewLabels[code] ?? 'Resultado requer acompanhamento';
}

function LivePixPanel({
  receivable,
  onReceivableChanged,
  switchingOrganization,
}: Props & { switchingOrganization: boolean }) {
  const router = useRouter();
  const mounted = useRef(false);
  const busyRef = useRef(false);
  const [requestKey, setRequestKey] = useState(0);
  const [loaded, setLoaded] = useState<{ key: number; data: ReceivableLivePix } | null>(null);
  const [failure, setFailure] = useState<{ key: number; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [document, setDocument] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [expiredIssuance, setExpiredIssuance] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getReceivableLivePix(receivable.organizationId, receivable.id)
      .then((data) => {
        if (active) setLoaded({ key: requestKey, data });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }
        setFailure({
          key: requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar o Pix integrado.',
        });
      });

    return () => {
      active = false;
    };
  }, [receivable.organizationId, receivable.id, requestKey, router]);

  const data = loaded?.key === requestKey ? loaded.data : null;
  const readError = failure?.key === requestKey ? failure.message : null;
  const expiresAt = data?.expiresAt ?? null;
  const issuanceId = data?.issuanceId ?? null;

  const shouldPoll = data?.status === 'PENDING' || data?.status === 'PROCESSING';
  useEffect(() => {
    if (!shouldPoll || switchingOrganization || busy) return;
    const timer = window.setTimeout(() => {
      if (!busyRef.current) setRequestKey((value) => value + 1);
    }, 15_000);
    return () => window.clearTimeout(timer);
  }, [shouldPoll, switchingOrganization, busy, requestKey]);

  useEffect(() => {
    if (expiresAt === null || issuanceId === null) return;
    const timer = window.setTimeout(
      () => setExpiredIssuance(issuanceId),
      Math.max(0, expiresAt.getTime() - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [expiresAt, issuanceId]);

  const currentVersion = data?.receivableVersion === receivable.version;
  const expired = issuanceId !== null && expiredIssuance === issuanceId;
  const code =
    data?.status === 'PENDING' &&
    data.available &&
    currentVersion &&
    data.amountInCents === receivable.balanceInCents &&
    !expired &&
    !switchingOrganization &&
    !busy
      ? data.copyAndPaste
      : null;
  const qr = useMemo(() => {
    if (!code) return null;
    try {
      return createReceivablePixQrCode(code);
    } catch {
      return null;
    }
  }, [code]);

  const disabled = switchingOrganization || busy || data === null;
  const canIssue = !disabled && currentVersion && data?.canIssue === true;
  const status = data?.status === 'PENDING' && expired ? 'EXPIRED' : data?.status;

  function reload(): void {
    if (busyRef.current) return;
    setError(null);
    setRequestKey((value) => value + 1);
    onReceivableChanged();
  }

  const submit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    if (!canIssue || busyRef.current) return;
    const parsed = createReceivableLivePixSchema.safeParse({
      version: receivable.version,
      buyerEmail: email.trim(),
      buyerDocumentType: documentType,
      buyerDocumentNumber: document.trim(),
      confirmed,
    });
    if (!parsed.success) {
      setError('Preencha os dados autorizados do pagador e confirme a emissão.');
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await issueReceivableLivePix(receivable.organizationId, receivable.id, parsed.data);
      if (!mounted.current) return;
      setRequestKey((value) => value + 1);
      if (result.receivableVersion !== receivable.version) onReceivableChanged();
    } catch (cause: unknown) {
      if (!mounted.current) return;
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Resultado incerto. Consulte o status.');
      // Force a fresh read before another submission. The server reservation is authoritative.
      setRequestKey((value) => value + 1);
    } finally {
      busyRef.current = false;
      if (mounted.current) {
        setBusy(false);
        setEmail('');
        setDocument('');
        setConfirmed(false);
      }
    }
  };

  async function recover(): Promise<void> {
    if (disabled || busyRef.current || !data?.canRecover || issuanceId === null) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await recoverReceivableLivePix(receivable.organizationId, receivable.id, issuanceId);
      if (!mounted.current) return;
      if (result.receivableVersion !== receivable.version) onReceivableChanged();
      if (result.issuanceId !== issuanceId) {
        setError('A referência da cobrança foi alterada. Consulte o status novamente.');
      }
    } catch (cause: unknown) {
      if (!mounted.current) return;
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Consulta indisponível. Atualize o status.');
    } finally {
      busyRef.current = false;
      if (mounted.current) {
        // Fetch the authoritative issuance as well as the review; a QR may
        // have been invalidated while the provider was consulted.
        setRequestKey((value) => value + 1);
        setBusy(false);
      }
    }
  }

  async function copy(): Promise<void> {
    if (!code || !expiresAt || expiresAt.getTime() <= Date.now() || busyRef.current) return;
    // Re-read the server before copying so stale UI cannot share a paid QR.
    busyRef.current = true;
    setBusy(true);
    try {
      const fresh = await getReceivableLivePix(receivable.organizationId, receivable.id);
      if (!mounted.current) return;
      if (
        fresh.status !== 'PENDING' ||
        !fresh.copyAndPaste ||
        fresh.copyAndPaste !== code ||
        fresh.receivableVersion !== receivable.version ||
        !fresh.expiresAt ||
        fresh.expiresAt.getTime() <= Date.now()
      ) {
        setRequestKey((value) => value + 1);
        onReceivableChanged();
        toast.error('A cobrança foi alterada. Consulte o status.');
        return;
      }
      await navigator.clipboard.writeText(fresh.copyAndPaste);
      toast.success('Código Pix copiado.');
    } catch {
      if (mounted.current) setRequestKey((value) => value + 1);
      toast.error('Não foi possível copiar o código Pix. Atualize o status.');
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  if (data === null && readError === null && !busy) {
    return null;
  }
  if (data !== null && !data.available && data.issuanceId === null) return null;

  return (
    <section className="mt-6 border-l-2 border-primary bg-muted/30 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading font-semibold">Pix real — Mercado Pago</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium">Produção</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobrança real na conta conectada. Emita apenas com autorização do pagador. A baixa depende da confirmação do
            Mercado Pago.
          </p>
          <Link
            href="/settings?tab=receiving"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Configurar Mercado Pago
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={switchingOrganization || busy}
          onClick={reload}
          className="cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar status
        </Button>
      </div>

      {readError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {readError}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Consultando cobrança...
        </p>
      )}
      {data && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">{status ? labels[status] : ''}</p>
            {data.amountInCents !== null && (
              <p className="mt-1 font-heading text-xl font-semibold">{formatBrlCurrency(data.amountInCents)}</p>
            )}
            {data.issuanceId && (
              <p className="mt-2 text-xs break-all text-muted-foreground">Referência: {data.issuanceId}</p>
            )}
            {data.paymentId && (
              <p className="mt-1 text-xs text-muted-foreground">Pagamento no Mercado Pago: {data.paymentId}</p>
            )}
            {expiresAt && <p className="mt-1 text-xs text-muted-foreground">Validade: {formatDateTime(expiresAt)}</p>}
          </div>

          {!currentVersion && (
            <Button type="button" variant="outline" onClick={onReceivableChanged}>
              Atualizar recebível
            </Button>
          )}
          {data.status === 'NOT_ISSUED' && !data.canIssue && (
            <p className="text-sm text-muted-foreground">
              Emissão ainda não liberada ou indisponível para esta conta e recebível. Confira as permissões, a conexão e
              a liberação do ambiente.
            </p>
          )}
          {canIssue && (
            <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Gerar Pix real de {formatBrlCurrency(receivable.balanceInCents)}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  E-mail do pagador
                  <Input
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  Tipo de documento
                  <select
                    value={documentType}
                    onChange={(event) => {
                      setDocumentType(event.target.value === 'CNPJ' ? 'CNPJ' : 'CPF');
                      setDocument('');
                    }}
                    className="block h-8 w-full rounded-lg border border-input bg-background px-2.5"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </label>
                <label className="block space-y-1 text-sm sm:col-span-2">
                  Documento do pagador (somente números)
                  <Input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={documentType === 'CPF' ? 11 : 14}
                    value={document}
                    onChange={(event) => setDocument(event.target.value.replace(/\D/g, ''))}
                    autoComplete="off"
                  />
                </label>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1"
                  required
                />
                Confirmo a emissão de uma cobrança real neste valor, com os dados autorizados do pagador.
              </label>
              <Button type="submit" disabled={!confirmed || !canIssue} className="cursor-pointer">
                <QrCode aria-hidden="true" className="size-4" /> Gerar Pix real
              </Button>
            </form>
          )}

          {code && qr && (
            <div className="grid items-start gap-5 rounded-xl border border-border bg-background p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              <svg
                role="img"
                aria-label="QR Code Pix para pagamento"
                viewBox={`0 0 ${qr.size} ${qr.size}`}
                shapeRendering="crispEdges"
                className="mx-auto size-56 max-w-full bg-white sm:mx-0"
              >
                <rect width={qr.size} height={qr.size} fill="#fff" />
                <path d={qr.path} fill="#000" />
              </svg>
              <div className="min-w-0">
                <label htmlFor="live-pix-code" className="block text-sm font-medium">
                  Pix Copia e Cola
                </label>
                <Textarea
                  id="live-pix-code"
                  value={code}
                  readOnly
                  spellCheck={false}
                  className="mt-2 min-h-24 font-mono text-xs break-all"
                />
                <Button type="button" variant="outline" onClick={() => void copy()} className="mt-3 cursor-pointer">
                  <Clipboard aria-hidden="true" className="size-4" /> Copiar código Pix
                </Button>
              </div>
            </div>
          )}
          {status === 'PENDING' && code && !qr && (
            <p role="alert" className="text-sm text-destructive">
              Não foi possível exibir o QR Code. Consulte a cobrança.
            </p>
          )}
          {status && ['REVIEW_REQUIRED', 'EXPIRED', 'STALE', 'PROCESSING'].includes(status) && (
            <p className="text-sm text-muted-foreground">
              A tentativa foi preservada. A consulta não libera uma nova cobrança nem gera outro QR Code.
            </p>
          )}
          {issuanceId && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div>
                <h3 className="text-sm font-medium">Conciliação e revisão</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Consulte a cobrança existente. Uma confirmação válida pode registrar a baixa; a consulta nunca emite
                  outro Pix.
                </p>
              </div>
              {data.reviewCode && (
                <p role="status" className="text-sm font-medium">
                  {reviewLabel(data.reviewCode)}
                </p>
              )}
              {data.lastRecoveryCode && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Última consulta ao Mercado Pago</p>
                  <p className="mt-1 text-sm font-medium">{reviewLabel(data.lastRecoveryCode)}</p>
                </div>
              )}
              {data.lastWebhookCode && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Última notificação vinculada</p>
                  <p className="mt-1 text-sm font-medium">{reviewLabel(data.lastWebhookCode)}</p>
                </div>
              )}
              {data.lastRecoveryCode === 'NOT_FOUND' && (
                <p className="text-xs text-muted-foreground">
                  A ausência de resultados não comprova que o Pix não existe. Não emita outra cobrança.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={disabled || !data.canRecover}
                onClick={() => void recover()}
                className="cursor-pointer"
              >
                <RefreshCw aria-hidden="true" className="size-4" /> Consultar no Mercado Pago
              </Button>
              {!data.canRecover && data.nextRecoveryAt && (
                <p className="text-xs text-muted-foreground">
                  Próxima consulta a partir de {formatDateTime(data.nextRecoveryAt)}. Atualize o status para tentar
                  novamente.
                </p>
              )}
              {!data.canRecover && !data.nextRecoveryAt && (
                <p className="text-xs text-muted-foreground">Confira a conexão e as permissões de conciliação.</p>
              )}
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              O código não comprova pagamento. Aguarde a conciliação e não registre manualmente o mesmo pagamento.
              Divergências e estornos exigem revisão.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
