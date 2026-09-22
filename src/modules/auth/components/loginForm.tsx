'use client';

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('Esta página ainda está em demonstração. A integração com a API será adicionada em seguida.');
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setMessage(null)} className="space-y-6">
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
            className="h-12 bg-card pl-11 text-base md:text-base dark:bg-card"
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
            className="h-12 bg-card pr-12 pl-11 text-base md:text-base dark:bg-card"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-controls="login-password"
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute top-1/2 right-0.5 size-11 -translate-y-1/2 cursor-pointer text-muted-foreground"
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
            className="inline-flex min-h-11 items-center rounded-sm text-sm text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <Button type="submit" className="h-12 w-full cursor-pointer gap-3 text-sm font-medium">
        Entrar
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>

      <div aria-live="polite" aria-atomic="true">
        {message && <p className="rounded-lg bg-info-surface p-4 text-sm leading-relaxed text-info">{message}</p>}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
