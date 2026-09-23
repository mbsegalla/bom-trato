'use client';

import { CircleAlert, CircleCheck, LoaderCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useVerificationCooldown } from '../hooks/useVerificationCooldown';
import { resendVerificationEmail } from '../services/emailVerification.service';
import { verifyEmailOnce } from '../services/session.service';
import { AuthPageHeader } from './authPageHeader';
import { ResendVerificationButton } from './resendVerificationButton';

interface VerificationResultState {
  token: string;
  status: 'error' | 'recovered';
  message: string;
  email?: string;
}

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function getLocationHash(): string {
  return window.location.hash;
}

function getServerLocationHash(): string {
  return '';
}

export function EmailVerification() {
  const router = useRouter();

  const remainingSeconds = useVerificationCooldown();

  const hash = useSyncExternalStore(subscribeToLocation, getLocationHash, getServerLocationHash);

  const token = useMemo(() => {
    if (!hash) {
      return null;
    }

    const tokens = new URLSearchParams(hash.slice(1)).getAll('token');

    return tokens.length === 1 ? tokens[0] : null;
  }, [hash]);

  const [verification, setVerification] = useState<VerificationResultState | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [retry, setRetry] = useState(0);

  const busyRef = useRef(false);

  const verificationForCurrentToken = verification?.token === token ? verification : null;

  const isVerifying = token !== null && verificationForCurrentToken === null;

  const invalidFragment = hash.length > 0 && token === null;

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    void verifyEmailOnce(token, retry > 0)
      .then((result) => {
        if (!active) {
          return;
        }

        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);

        if (result.kind === 'recovered') {
          setVerification({
            token,
            status: 'recovered',
            email: result.email,
            message: 'Encontramos uma sessão autenticada e seu e-mail já está confirmado.',
          });

          return;
        }

        router.replace('/onboarding');
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setVerification({
          token,
          status: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível confirmar seu e-mail.',
        });
      });

    return () => {
      active = false;
    };
  }, [retry, router, token]);

  const resend: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (busyRef.current || remainingSeconds > 0) {
      return;
    }

    const form = event.currentTarget;

    const email = String(new FormData(form).get('email') ?? '');

    busyRef.current = true;
    setSending(true);
    setResendMessage(null);

    try {
      const result = await resendVerificationEmail(email);

      if (!result.success) {
        setResendMessage(result.message);

        return;
      }

      setResendMessage('Se houver uma conta pendente, enviaremos um novo e-mail. Confira também a pasta de spam.');

      form.reset();
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  if (isVerifying) {
    return (
      <section aria-busy="true" className="w-full">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LoaderCircle aria-hidden="true" className="size-7 motion-safe:animate-spin" />
        </div>

        <div className="mt-6">
          <AuthPageHeader
            eyebrow="Confirmação de e-mail"
            title="Confirmando seu e-mail"
            description="Aguarde um instante enquanto preparamos o seu acesso."
          />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">Isso deve levar apenas alguns segundos.</p>
        </div>
      </section>
    );
  }

  if (verificationForCurrentToken?.status === 'recovered') {
    return (
      <section className="w-full">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
          <CircleCheck aria-hidden="true" className="size-7" />
        </div>

        <div className="mt-6">
          <AuthPageHeader
            eyebrow="E-mail confirmado"
            title="Seu acesso está pronto"
            description="Encontramos sua sessão e você pode continuar a configuração da sua conta."
          />
        </div>

        {verificationForCurrentToken.email && (
          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Conta confirmada</p>

            <p className="mt-1 text-sm font-medium">{verificationForCurrentToken.email}</p>
          </div>
        )}

        <Button
          type="button"
          onClick={() => router.replace('/onboarding')}
          className="mt-6 min-h-12 w-full cursor-pointer rounded-xl"
        >
          Continuar
        </Button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Não é sua conta?{' '}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
            Entrar com outra conta
          </Link>
        </p>
      </section>
    );
  }

  const verificationError =
    verificationForCurrentToken?.status === 'error'
      ? verificationForCurrentToken.message
      : invalidFragment
        ? 'O link informado é inválido. Solicite um novo e-mail de confirmação.'
        : null;

  return (
    <section className="w-full">
      <div
        className={
          verificationError
            ? 'flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'
            : 'flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'
        }
      >
        {verificationError ? (
          <CircleAlert aria-hidden="true" className="size-7" />
        ) : (
          <Mail aria-hidden="true" className="size-7" />
        )}
      </div>

      <div className="mt-6">
        <AuthPageHeader
          eyebrow="Confirmação de e-mail"
          title={verificationError ? 'Precisamos de um novo link' : 'Confira sua caixa de entrada'}
          description={
            verificationError
              ? 'Você pode solicitar abaixo um novo e-mail para continuar.'
              : 'Enviamos um link para confirmar seu e-mail e continuar a configuração da sua conta.'
          }
        />
      </div>

      {verificationError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {verificationError}
        </div>
      )}

      {verificationForCurrentToken?.status === 'error' && token && (
        <Button
          type="button"
          variant="outline"
          disabled={sending}
          onClick={() => {
            setVerification(null);
            setRetry((value) => value + 1);
          }}
          className="mt-4 min-h-12 w-full cursor-pointer rounded-xl"
        >
          Tentar confirmar novamente
        </Button>
      )}

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />

        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Reenviar confirmação</span>

        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={resend} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-email">E-mail do cadastro</Label>

          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              id="verification-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              disabled={sending}
              placeholder="voce@empresa.com"
              className="h-12 bg-card pl-11 text-base md:text-base dark:bg-card"
            />
          </div>
        </div>

        <ResendVerificationButton isSending={sending} remainingSeconds={remainingSeconds} />
      </form>

      <div aria-live="polite" aria-atomic="true">
        {resendMessage && (
          <p className="mt-4 rounded-xl bg-info-surface p-4 text-sm leading-relaxed text-info">{resendMessage}</p>
        )}
      </div>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Já confirmou seu e-mail?{' '}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Entrar
        </Link>
      </p>
    </section>
  );
}
