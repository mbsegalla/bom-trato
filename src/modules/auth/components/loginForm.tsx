'use client';

import { ArrowRight, Eye, EyeOff, Info, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { login, loginWithGoogle, SessionError } from '../services/session.service';
import { AuthMethodDivider } from './authMethodDivider';
import { GoogleSignInButton } from './googleSignInButton';

interface LoginNotice {
  title: string;
  description: string;
}

export function LoginForm() {
  const router = useRouter();

  const submittingRef = useRef(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<LoginNotice | null>(null);

  const busy = isSubmitting || googleSubmitting;

  function clearFeedback(): void {
    setError(null);
    setNotice(null);
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current || busy) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      setNotice(null);
      setError('Informe seu e-mail e sua senha.');

      return;
    }

    submittingRef.current = true;

    setIsSubmitting(true);

    clearFeedback();

    try {
      await login(email, password);

      router.replace('/dashboard');
    } catch (cause: unknown) {
      setError(cause instanceof SessionError ? cause.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      submittingRef.current = false;

      setIsSubmitting(false);
    }
  };

  async function handleGoogleCredential(credential: string): Promise<void> {
    if (busy) {
      return;
    }

    setGoogleSubmitting(true);

    clearFeedback();

    try {
      await loginWithGoogle(credential);

      router.replace('/dashboard');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.code === 'GOOGLE_ACCOUNT_LINK_REQUIRED') {
        setNotice({
          title: 'Sua conta já existe no Bom Trato',
          description:
            'Entre com sua senha normalmente. Depois, você poderá conectar sua conta Google em Configurações → Segurança.',
        });

        return;
      }

      setError(cause instanceof SessionError ? cause.message : 'Não foi possível entrar com Google.');
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton
        text="continue_with"
        disabled={busy}
        onCredential={(credential) => void handleGoogleCredential(credential)}
        onError={() => {
          setNotice(null);
          setError('Não foi possível abrir o login do Google.');
        }}
      />

      <AuthMethodDivider />

      <form
        onSubmit={handleSubmit}
        aria-busy={busy}
        aria-describedby={error ? 'login-error' : notice ? 'login-notice' : undefined}
        className="space-y-6"
      >
        <fieldset disabled={busy} className="space-y-5">
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
                onChange={() => {
                  if (error) {
                    setError(null);
                  }
                }}
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
                onChange={() => {
                  if (error) {
                    setError(null);
                  }
                }}
                className="h-12 rounded-xl bg-card pr-12 pl-11 text-base md:text-base"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-controls="login-password"
                onClick={() => setPasswordVisible((value) => !value)}
                className="absolute top-1/2 right-0.5 size-11 -translate-y-1/2 cursor-pointer active:not-aria-[haspopup]:translate-y-[-50%]"
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

          {notice && (
            <div id="login-notice" role="status" className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{notice.title}</p>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notice.description}</p>
              </div>
            </div>
          )}

          {error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="min-h-12 w-full cursor-pointer rounded-xl">
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
    </div>
  );
}
