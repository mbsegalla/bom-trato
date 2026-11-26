'use client';

import { ExternalLink, Link2, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import {
  disconnectMercadoPagoConnection,
  getMercadoPagoConnection,
  startMercadoPagoConnection,
} from '../../../services/mercadoPagoConnection.service';
import type { MercadoPagoConnectionView } from '../../../types/mercadoPagoConnection.types';

const statusLabels: Record<MercadoPagoConnectionView['status'], string> = {
  NOT_CONNECTED: 'Não conectado',
  CONNECTED: 'Conta vinculada',
  EXPIRED: 'Credenciais expiradas',
  DISCONNECTED: 'Desconectado',
  RECONNECT_REQUIRED: 'Nova autorização necessária',
};

type PanelState =
  | { requestKey: number; kind: 'ready'; data: MercadoPagoConnectionView }
  | { requestKey: number; kind: 'error'; message: string };

interface MercadoPagoSettingsPanelProps {
  organizationId: string;
  switchingOrganization: boolean;
}

export function MercadoPagoSettingsPanel({ organizationId, switchingOrganization }: MercadoPagoSettingsPanelProps) {
  const router = useRouter();
  const mounted = useRef(false);
  const pending = useRef(false);
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<PanelState | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void getMercadoPagoConnection(organizationId)
      .then((data) => {
        if (active) {
          setState({ requestKey, kind: 'ready', data });
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

        setState({
          requestKey,
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível consultar a conexão.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, requestKey, router]);

  const current = state?.requestKey === requestKey ? state : null;
  const data = current?.kind === 'ready' ? current.data : null;
  const disabled = switchingOrganization || busy || current === null;

  function reload(): void {
    setError(null);
    setConfirmDisconnect(false);
    setRequestKey((value) => value + 1);
  }

  async function run(operation: () => Promise<void>): Promise<void> {
    if (disabled || pending.current) {
      return;
    }

    pending.current = true;
    setBusy(true);
    setError(null);

    try {
      await operation();
    } catch (cause: unknown) {
      if (!mounted.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.');
    } finally {
      pending.current = false;

      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  async function connect(): Promise<void> {
    if (!data?.canConnect) {
      return;
    }

    await run(async () => {
      const result = await startMercadoPagoConnection(organizationId);

      if (mounted.current) {
        window.location.assign(result.authorizationUrl);
      }
    });
  }

  async function disconnect(): Promise<void> {
    if (!data?.canDisconnect || !confirmDisconnect) {
      return;
    }

    await run(async () => {
      await disconnectMercadoPagoConnection(organizationId);

      if (mounted.current) {
        toast.success('Conta desconectada no Bom Trato.');
        reload();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Link2 aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">Mercado Pago</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Conecte a conta do seu negócio para preparar os recebimentos integrados. A assinatura do Bom Trato e o Pix
              manual não são alterados.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={reload} disabled={disabled} className="cursor-pointer">
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar
        </Button>
      </div>

      {current === null ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Consultando conexão...
        </p>
      ) : current.kind === 'error' ? (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {current.message}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">{statusLabels[current.data.status]}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ambiente: {current.data.liveMode ? 'Produção' : 'Testes'}
            </p>
            {current.data.accountId && (
              <p className="mt-1 text-sm text-muted-foreground">Conta: {current.data.accountId}</p>
            )}
            {current.data.expiresAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Validade das credenciais: {formatDateTime(current.data.expiresAt)}
              </p>
            )}
          </div>

          {!current.data.available && (
            <p className="text-sm text-muted-foreground">
              A conexão ainda não está habilitada pelo administrador da plataforma.
            </p>
          )}

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              A autorização acontece no Mercado Pago. As credenciais ficam criptografadas no servidor. Conectar a conta
              ainda não gera cobranças nem habilita baixas automáticas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {current.data.canConnect && (
              <Button type="button" onClick={() => void connect()} disabled={disabled} className="cursor-pointer">
                {busy ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <ExternalLink aria-hidden="true" className="size-4" />
                )}
                {current.data.status === 'NOT_CONNECTED' ? 'Conectar Mercado Pago' : 'Reconectar Mercado Pago'}
              </Button>
            )}
            {current.data.canDisconnect && !confirmDisconnect && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDisconnect(true)}
                disabled={disabled}
                className="cursor-pointer"
              >
                Desconectar
              </Button>
            )}
          </div>

          {confirmDisconnect && current.data.canDisconnect && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm">
                Remover as credenciais do Bom Trato? Para revogar a autorização no provedor, acesse também sua conta
                Mercado Pago. Uma reconexão deverá utilizar a mesma conta deste ambiente.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="destructive" disabled={disabled} onClick={() => void disconnect()}>
                  Confirmar desconexão
                </Button>
                <Button type="button" variant="outline" disabled={disabled} onClick={() => setConfirmDisconnect(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
