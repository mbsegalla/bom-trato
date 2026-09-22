'use client';

import { CircleCheck, LoaderCircle, MailCheck } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { emailVerificationTokenSchema } from '../schemas/auth.schema';
import { resendVerificationEmail, verifyEmail } from '../services/emailVerification.service';
import type { EmailVerificationOperation } from '../types/auth.types';
import { EmailVerificationSkeleton } from './emailVerificationSkeleton';

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);

  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function getHashSnapshot(): string {
  return window.location.hash;
}

function getServerHashSnapshot(): null {
  return null;
}

export function EmailVerification() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);

  const busyRef = useRef(false);

  const [operation, setOperation] = useState<EmailVerificationOperation | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendRequested, setResendRequested] = useState(false);
  const [showResend, setShowResend] = useState(false);

  if (hash === null) {
    return <EmailVerificationSkeleton />;
  }

  const params = new URLSearchParams(hash.slice(1));
  const tokens = params.getAll('token');

  const tokenResult = emailVerificationTokenSchema.safeParse(tokens.length === 1 ? tokens[0] : undefined);

  const token = tokenResult.success ? tokenResult.data : null;
  const busy = operation !== null;

  async function handleVerify() {
    console.log('handleVerify called with token:', token); // Log the token for debugging

    if (!token || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setOperation('verify');
    setError(null);

    try {
      const result = await verifyEmail(token);

      console.log('Verification result:', result); // Log the verification result for debugging

      if (!result.success) {
        setError(result.message);
        setShowResend(true);
        return;
      }

      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);

      setVerified(true);
    } finally {
      busyRef.current = false;
      setOperation(null);
    }
  }

  const handleResend: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (busyRef.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '');

    busyRef.current = true;
    setOperation('resend');
    setError(null);
    setResendRequested(false);

    try {
      const result = await resendVerificationEmail(email);

      if (!result.success) {
        setError(result.message);
        return;
      }

      form.reset();
      setResendRequested(true);
    } finally {
      busyRef.current = false;
      setOperation(null);
    }
  };

  return (
    <div aria-busy={busy} className="mx-auto w-full max-w-md">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {verified ? (
          <CircleCheck aria-hidden="true" className="size-7" />
        ) : (
          <MailCheck aria-hidden="true" className="size-7" />
        )}
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary">SUA CONTA NO BOM TRATO</p>

      <div role="status">
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          {verified ? 'E-mail confirmado!' : token ? 'Confirme seu e-mail' : 'Precisamos de um novo link'}
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          {verified
            ? 'Tudo certo com seu e-mail. Entre na sua conta para continuar.'
            : token
              ? 'Clique no botão abaixo para confirmar o endereço de e-mail da sua conta.'
              : 'O link está incompleto ou tem um formato inválido. Solicite outro e-mail para continuar.'}
        </p>
      </div>

      {verified ? (
        <Link
          href="/login"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Entrar na minha conta
        </Link>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {token && (
            <Button
              type="button"
              disabled={busy}
              onClick={handleVerify}
              className="mt-8 min-h-12 w-full cursor-pointer rounded-xl"
            >
              {operation === 'verify' ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar meu e-mail'
              )}
            </Button>
          )}

          {!token || showResend ? (
            <form onSubmit={handleResend} className="mt-8 border-t pt-6">
              <fieldset disabled={busy} className="space-y-4">
                <legend className="mb-3 font-semibold">Solicitar novo e-mail</legend>

                <div className="space-y-2">
                  <Label htmlFor="verification-email">E-mail do cadastro</Label>

                  <Input
                    id="verification-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    required
                    placeholder="voce@empresa.com"
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button type="submit" variant="outline" disabled={busy} className="min-h-12 w-full rounded-xl">
                  {operation === 'resend' ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                      Solicitando...
                    </>
                  ) : (
                    'Enviar novo link'
                  )}
                </Button>
              </fieldset>

              {resendRequested && (
                <p role="status" className="mt-4 rounded-xl bg-primary/5 p-4 text-sm">
                  Se houver uma conta pendente de verificação para esse endereço, você receberá um novo e-mail. Confira
                  também a pasta de spam.
                </p>
              )}
            </form>
          ) : (
            <Button
              type="button"
              variant="link"
              disabled={busy}
              onClick={() => setShowResend(true)}
              className="mt-4 w-full cursor-pointer"
            >
              Preciso de outro link
            </Button>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já confirmou seu e-mail?{' '}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
