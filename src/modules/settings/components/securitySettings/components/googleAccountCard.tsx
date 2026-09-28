'use client';

import { CircleCheck, Link2, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GoogleSignInButton } from '@/modules/auth/components/googleSignInButton';
import { getAuthIdentityProviders, linkGoogleIdentity } from '@/modules/auth/services/authIdentity.service';
import { SessionError } from '@/modules/auth/services/session.service';
import type { AuthProvider } from '@/modules/auth/types/auth.types';

export function GoogleAccountCard() {
  const router = useRouter();

  const [providers, setProviders] = useState<AuthProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    let active = true;

    void getAuthIdentityProviders()
      .then((items) => {
        if (!active) {
          return;
        }

        setProviders(items);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os métodos de acesso.');
      });

    return () => {
      active = false;
    };
  }, [router]);

  const connected = providers?.includes('GOOGLE') ?? false;

  async function handleCredential(credential: string): Promise<void> {
    if (linking) {
      return;
    }

    setLinking(true);
    setError(null);

    try {
      await linkGoogleIdentity(credential);

      setProviders((current) => [...new Set([...(current ?? []), 'GOOGLE' as const])]);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível conectar sua conta Google.');
    } finally {
      setLinking(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
          {connected ? (
            <CircleCheck aria-hidden="true" className="size-5" />
          ) : (
            <Link2 aria-hidden="true" className="size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-semibold">Conta Google</h2>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {connected
              ? 'Sua conta Google está conectada e pode ser usada para entrar no Bom Trato.'
              : 'Conecte sua conta Google para entrar sem precisar digitar sua senha.'}
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {providers === null && !error && (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Verificando conexão...
            </div>
          )}

          {!connected && providers !== null && (
            <div className="mt-5 max-w-xs">
              <GoogleSignInButton
                text="continue_with"
                disabled={linking}
                onCredential={(credential) => void handleCredential(credential)}
                onError={() => setError('Não foi possível abrir o Google.')}
              />
            </div>
          )}

          {connected && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-success-surface px-3 py-1.5 text-sm font-medium text-success">
              <CircleCheck aria-hidden="true" className="size-4" />
              Google conectado
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
