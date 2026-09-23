'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useVerificationCooldown } from '../hooks/useVerificationCooldown';
import { resendVerificationEmail } from '../services/emailVerification.service';
import { verifyEmailOnce } from '../services/session.service';
import { ResendVerificationButton } from './resendVerificationButton';

type Stage = 'loading' | 'waiting' | 'verifying' | 'error' | 'recovered';

export function EmailVerification({ planPriceId }: { planPriceId?: string }) {
  const router = useRouter();
  const remainingSeconds = useVerificationCooldown();

  const [stage, setStage] = useState<Stage>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [retry, setRetry] = useState(0);
  const [hasToken, setHasToken] = useState(false);

  const tokenRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const loginHref = planPriceId ? `/login?planPriceId=${encodeURIComponent(planPriceId)}` : '/login';

  useEffect(() => {
    let active = true;

    const tokens = new URLSearchParams(window.location.hash.slice(1)).getAll('token');

    const token = tokenRef.current ?? (tokens.length === 1 ? tokens[0] : null);

    tokenRef.current = token;
    setHasToken(token !== null);

    if (!token) {
      setStage(window.location.hash ? 'error' : 'waiting');
      setMessage(
        window.location.hash ? 'O link é inválido. Solicite outro e-mail.' : 'Abra o link recebido por e-mail.',
      );

      return;
    }

    setStage('verifying');
    setMessage('Confirmando seu e-mail…');

    void verifyEmailOnce(token, retry > 0)
      .then((result) => {
        if (!active) {
          return;
        }

        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);

        if (result.kind === 'recovered') {
          setEmail(result.email);
          setStage('recovered');

          setMessage('Não recebemos a resposta da confirmação, mas encontramos uma sessão autenticada.');

          return;
        }

        router.replace('/onboarding');
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setStage('error');

        setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar. Tente novamente.');
      });

    // Keep the request running during Strict Mode cleanup.
    // The next effect execution subscribes to the same promise.
    return () => {
      active = false;
    };
  }, [router, retry]);

  const resend: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (busyRef.current || remainingSeconds > 0) {
      return;
    }

    const form = event.currentTarget;

    busyRef.current = true;
    setSending(true);
    setMessage('');

    try {
      const result = await resendVerificationEmail(String(new FormData(form).get('email') ?? ''));

      setMessage(
        result.success
          ? 'Se houver uma conta pendente, enviaremos outro e-mail. Confira também o spam.'
          : result.message,
      );

      if (result.success) {
        form.reset();
      }
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  const busy = stage === 'loading' || stage === 'verifying';

  return (
    <section className="mx-auto w-full max-w-md space-y-6" aria-busy={busy}>
      <h1 className="font-heading text-3xl font-semibold">
        {busy ? 'Confirmando seu e-mail…' : stage === 'recovered' ? 'Continuar com sua conta' : 'Confirmação de e-mail'}
      </h1>

      <p role={stage === 'error' ? 'alert' : 'status'}>{message || 'Aguarde um instante…'}</p>

      {stage === 'recovered' && (
        <>
          <p>
            Sessão de <strong>{email}</strong>.
          </p>

          <Button onClick={() => router.replace('/onboarding')}>Continuar com esta conta</Button>

          <Link className="block underline" href={loginHref}>
            Entrar com outra conta
          </Link>
        </>
      )}

      {stage === 'error' && hasToken && (
        <Button disabled={sending} onClick={() => setRetry((value) => value + 1)}>
          Tentar novamente
        </Button>
      )}

      {!busy && stage !== 'recovered' && (
        <form onSubmit={resend} className="space-y-4">
          <Label htmlFor="verification-email">E-mail do cadastro</Label>

          <Input
            id="verification-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={sending}
          />

          <ResendVerificationButton isSending={sending} remainingSeconds={remainingSeconds} />

          <Link className="block underline" href={loginHref}>
            Já confirmou? Entrar
          </Link>
        </form>
      )}
    </section>
  );
}
