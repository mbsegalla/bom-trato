'use client';

import { CircleAlert, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { listSessions, logoutAll, revokeSession, SessionError } from '@/modules/auth/services/session.service';
import type { AuthSession } from '@/modules/auth/types/auth.types';

import { SecuritySettingsSkeleton } from '../securitySettingsSkeleton';
import { LogoutAllSessionsCard } from './components/logoutAllSessionsCard';
import { SessionList } from './components/sessionList';

interface SessionsState {
  requestKey: string;
  data: AuthSession[];
}

interface SessionsErrorState {
  requestKey: string;
  message: string;
}

type SecurityConfirmation = { type: 'session'; session: AuthSession } | { type: 'all' };

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
        if (active) {
          setErrorState(null);
          setState({ requestKey, data: sessions });
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

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
    if (actionLoading) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await revokeSession(session.id, session.current);

      if (session.current) {
        router.replace('/login');
        return;
      }

      setState((current) =>
        current === null ? current : { ...current, data: current.data.filter((item) => item.id !== session.id) },
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
    if (actionLoading) return;

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
    <SecuritySettingsSkeleton />;
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
  if (!sessions) return null;

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
        <SessionList
          sessions={sessions}
          disabled={actionLoading}
          onRevoke={(session) => setConfirmation({ type: 'session', session })}
        />
        <LogoutAllSessionsCard disabled={actionLoading} onLogoutAll={() => setConfirmation({ type: 'all' })} />
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
