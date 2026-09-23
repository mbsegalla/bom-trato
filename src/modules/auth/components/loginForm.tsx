'use client';

import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { login, SessionError } from '../services/session.service';

export function LoginForm() {
  const router = useRouter();

  const submittingRef = useRef(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const email = String(data.get('email') ?? '').trim();

    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      setError('Informe seu e-mail e sua senha.');

      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);

      router.replace('/onboarding');
    } catch (cause: unknown) {
      setError(cause instanceof SessionError ? cause.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      aria-describedby={error ? 'login-error' : undefined}
      className="space-y-6"
    >
      <fieldset disabled={isSubmitting} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>

          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="voce@empresa.com"
              required
              className="h-12 rounded-xl bg-card pl-11 text-base md:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>

          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              id="login-password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
              className="h-12 rounded-xl bg-card pr-12 pl-11 text-base md:text-base"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              aria-controls="login-password"
              onClick={() => setPasswordVisible((value) => !value)}
              className="absolute top-1/2 right-0.5 size-11 -translate-y-1/2"
            >
              {passwordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </Button>
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        {error && (
          <p
            id="login-error"
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="min-h-12 w-full cursor-pointer rounded-xl">
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </Button>
      </fieldset>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/verify-email" className="font-medium text-primary underline underline-offset-4">
          Não recebeu o e-mail de confirmação?
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/register" className="font-medium text-primary underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
