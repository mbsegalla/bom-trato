'use client';

import { CircleAlert, Clock3, LogOut, Monitor, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { listSessions, logoutAll, revokeSession, SessionError } from '@/modules/auth/services/session.service';
import type { AuthSession } from '@/modules/auth/types/auth.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { describeUserAgent } from '@/shared/formatters/userAgent.formatter';

import { SecuritySettingsSkeleton } from './securitySettingsSkeleton';

interface SessionsState {
  requestKey: string;
  data: AuthSession[];
}

interface SessionsErrorState {
  requestKey: string;
  message: string;
}

type SecurityConfirmation =
  | {
      type: 'session';
      session: AuthSession;
    }
  | {
      type: 'all';
    };

export function SecuritySettings() {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<SessionsState | null>(null);
  const [errorState, setErrorState] = useState<SessionsErrorState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<SecurityConfirmation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const requestKey = `sessions:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void listSessions()
      .then((sessions) => {
        if (!active) {
          return;
        }

        setErrorState(null);

        setState({
          requestKey,
          data: sessions,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar suas sessões.',
        });
      });

    return () => {
      active = false;
    };
  }, [refreshVersion, requestKey, router]);

  const sessions = state?.data ?? null;

  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  const refreshing = state !== null && state.requestKey !== requestKey;

  async function handleRevoke(session: AuthSession): Promise<void> {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await revokeSession(session.id, session.current);

      if (session.current) {
        router.replace('/login');
        return;
      }

      setState((current) =>
        current === null
          ? current
          : {
              ...current,
              data: current.data.filter((item) => item.id !== session.id),
            },
      );

      setConfirmation(null);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setActionError(cause instanceof Error ? cause.message : 'Não foi possível encerrar esta sessão.');

      setConfirmation(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogoutAll(): Promise<void> {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await logoutAll();

      router.replace('/login');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setActionError(cause instanceof Error ? cause.message : 'Não foi possível encerrar todas as sessões.');

      setConfirmation(null);
    } finally {
      setActionLoading(false);
    }
  }

  if (!sessions && !error) {
    return <SecuritySettingsSkeleton />;
  }

  if (!sessions && error) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CircleAlert aria-hidden="true" className="mx-auto size-7 text-destructive" />

        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => setRefreshVersion((value) => value + 1)}
          className="mt-5 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (!sessions) {
    return null;
  }

  return (
    <>
      <div
        aria-busy={refreshing || actionLoading}
        className={refreshing ? 'space-y-5 opacity-70 transition-opacity' : 'space-y-5 transition-opacity'}
      >
        {actionError && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {actionError}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </div>

              <div>
                <h2 className="font-heading text-xl font-semibold">Sessões ativas</h2>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Veja onde sua conta está conectada e encerre acessos que você não reconhece.
                </p>
              </div>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhuma sessão ativa foi encontrada.</div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  disabled={actionLoading}
                  onRevoke={() =>
                    setConfirmation({
                      type: 'session',
                      session,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut aria-hidden="true" className="size-5" />
            </div>

            <div className="min-w-0">
              <h2 className="font-heading text-xl font-semibold">Encerrar todas as sessões</h2>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Desconecta sua conta de todos os dispositivos, inclusive deste.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={actionLoading}
            onClick={() =>
              setConfirmation({
                type: 'all',
              })
            }
            className="mt-6 cursor-pointer"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sair de todos os dispositivos
          </Button>
        </section>
      </div>

      {confirmation?.type === 'session' && (
        <ConfirmationDialog
          title={confirmation.session.current ? 'Encerrar esta sessão?' : 'Encerrar sessão?'}
          description={
            confirmation.session.current
              ? 'Você será desconectado deste dispositivo e precisará entrar novamente.'
              : 'Este dispositivo perderá o acesso à sua conta e precisará entrar novamente.'
          }
          confirmLabel={confirmation.session.current ? 'Sair deste dispositivo' : 'Encerrar sessão'}
          destructive
          loading={actionLoading}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void handleRevoke(confirmation.session)}
        />
      )}

      {confirmation?.type === 'all' && (
        <ConfirmationDialog
          title="Sair de todos os dispositivos?"
          description="Todas as sessões ativas da sua conta serão encerradas, inclusive esta."
          confirmLabel="Sair de todos"
          destructive
          loading={actionLoading}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void handleLogoutAll()}
        />
      )}
    </>
  );
}

function SessionRow({ session, disabled, onRevoke }: { session: AuthSession; disabled: boolean; onRevoke(): void }) {
  const device = describeUserAgent(session.userAgent);

  const DeviceIcon = device.mobile ? Smartphone : Monitor;

  return (
    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <DeviceIcon aria-hidden="true" className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{device.label}</p>

            {session.current && (
              <span className="rounded-full bg-success-surface px-2.5 py-1 text-xs font-medium text-success">
                Este dispositivo
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
              Sessão iniciada em {formatDateTime(session.createdAt)}
            </p>

            <p>Última renovação em {formatDateTime(session.lastRefreshedAt)}</p>

            <p>Expira em {formatDateTime(session.absoluteExpiresAt)}</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant={session.current ? 'outline' : 'destructive'}
        disabled={disabled}
        onClick={onRevoke}
        className="cursor-pointer self-start sm:self-auto"
      >
        {session.current ? 'Sair deste dispositivo' : 'Encerrar'}
      </Button>
    </div>
  );
}
