'use client';

import { ArrowLeft, ArrowRight, CircleCheck, LoaderCircle, Mail, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { usePasswordResetCooldown } from '../hooks/usePasswordResetCooldown';
import { requestPasswordReset } from '../services/passwordReset.service';

function formatCooldown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function ForgotPasswordForm() {
  const submittingRef = useRef(false);

  const remainingSeconds = usePasswordResetCooldown();
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current || remainingSeconds > 0) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get('email') ?? '').trim();

    setError(null);
    setResendMessage(null);

    if (!email) {
      setError('Informe seu e-mail.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setRequestedEmail(email);
      setRequested(true);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  async function handleResend(): Promise<void> {
    if (!requestedEmail || submittingRef.current || remainingSeconds > 0) {
      return;
    }

    submittingRef.current = true;
    setIsResending(true);
    setError(null);
    setResendMessage(null);

    try {
      const result = await requestPasswordReset(requestedEmail);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setResendMessage(
        'Nova solicitação realizada. Se houver uma conta cadastrada para esse endereço, você receberá um novo link.',
      );
    } finally {
      submittingRef.current = false;
      setIsResending(false);
    }
  }

  if (requested) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CircleCheck aria-hidden="true" className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary">RECUPERAÇÃO DE ACESSO</p>

        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Confira seu e-mail</h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Se houver uma conta cadastrada para esse endereço, você receberá um link para criar uma nova senha.
        </p>

        <div className="mt-6 rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">
          O link é temporário. Confira também a pasta de spam caso não encontre a mensagem.
        </div>

        <div className="mt-6 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">Não recebeu o e-mail?</p>

          <Button
            type="button"
            variant="link"
            disabled={isResending || remainingSeconds > 0}
            onClick={handleResend}
            className="mt-1 min-h-11 w-full cursor-pointer"
          >
            {isResending ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Solicitando novamente...
              </>
            ) : remainingSeconds > 0 ? (
              <>
                <RotateCcw aria-hidden="true" className="size-4" />
                Reenviar em {formatCooldown(remainingSeconds)}
              </>
            ) : (
              <>
                <RotateCcw aria-hidden="true" className="size-4" />
                Reenviar link
              </>
            )}
          </Button>

          <div aria-live="polite" aria-atomic="true">
            {resendMessage && (
              <p role="status" className="mt-3 rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">
                {resendMessage}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Voltar para entrar
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary">RECUPERAÇÃO DE ACESSO</p>

      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Esqueceu sua senha?</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">
        Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha.
      </p>

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={error ? 'forgot-password-error' : undefined}
        className="mt-8"
      >
        <fieldset disabled={isSubmitting} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="forgot-password-email">E-mail</Label>

            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                placeholder="voce@empresa.com"
                required
                className="h-12 rounded-xl pl-11"
              />
            </div>
          </div>

          {error && (
            <p
              id="forgot-password-error"
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || remainingSeconds > 0}
            className="min-h-12 w-full cursor-pointer rounded-xl"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Enviando...
              </>
            ) : remainingSeconds > 0 ? (
              `Enviar novamente em ${formatCooldown(remainingSeconds)}`
            ) : (
              <>
                Enviar link de recuperação
                <ArrowRight aria-hidden="true" className="size-4" />
              </>
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline underline-offset-4"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}
