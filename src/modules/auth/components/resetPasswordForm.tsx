'use client';

import { Check, Circle, CircleCheck, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { passwordResetTokenSchema } from '../schemas/auth.schema';
import { resetPassword } from '../services/passwordReset.service';
import { getPasswordRequirements, isPasswordValid } from '../utils/passwordPolicy';

function subscribeToHash(onChange: () => void): () => void {
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

export function ResetPasswordForm() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);

  const submittingRef = useRef(false);

  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hash === null) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(1));
  const tokens = params.getAll('token');

  const tokenResult = passwordResetTokenSchema.safeParse(tokens.length === 1 ? tokens[0] : undefined);

  const token = tokenResult.success ? tokenResult.data : null;
  const invalidLink = !token;

  const passwordRequirements = getPasswordRequirements(password);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!token || submittingRef.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const newPassword = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

    setError(null);

    if (!newPassword || !passwordConfirmation) {
      setError('Preencha os dois campos de senha.');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError('A senha deve ter de 12 a 128 caracteres, uma letra maiúscula e um caractere especial.');
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await resetPassword(token, newPassword);

      if (!result.success) {
        setInvalidToken(result.invalidToken === true);
        setError(result.message);
        return;
      }

      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);

      form.reset();
      setPassword('');
      setPasswordChanged(true);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (passwordChanged) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CircleCheck aria-hidden="true" className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary">ACESSO RECUPERADO</p>

        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Senha alterada</h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Sua nova senha já está ativa. Entre novamente para continuar no Bom Trato.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Entrar na minha conta
        </Link>
      </div>
    );
  }

  if (invalidLink || invalidToken) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole aria-hidden="true" className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary">RECUPERAÇÃO DE ACESSO</p>

        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Precisamos de um novo link
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Este link é inválido, expirou ou já foi utilizado. Solicite uma nova recuperação de senha para continuar.
        </p>

        <Link
          href="/forgot-password"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Solicitar novo link
        </Link>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Lembrou sua senha?{' '}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div aria-busy={isSubmitting} className="mx-auto w-full max-w-md">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LockKeyhole aria-hidden="true" className="size-7" />
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary">RECUPERAÇÃO DE ACESSO</p>

      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Crie uma nova senha</h1>

      <p className="mt-4 leading-relaxed text-muted-foreground">
        Escolha uma senha segura para voltar a acessar sua conta.
      </p>

      <form onSubmit={handleSubmit} aria-describedby={error ? 'reset-password-error' : undefined} className="mt-8">
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">Nova senha</Label>

            <div className="relative">
              <Input
                id="reset-password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                required
                onChange={(event) => setPassword(event.currentTarget.value)}
                aria-describedby="reset-password-requirements"
                className="h-12 rounded-xl pr-12"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-controls="reset-password"
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                {passwordVisible ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </Button>
            </div>

            <ul id="reset-password-requirements" className="space-y-1.5 pt-1 text-xs leading-relaxed">
              {passwordRequirements.map(({ label, isSatisfied }) => (
                <li
                  key={label}
                  className={
                    isSatisfied ? 'flex items-start gap-2 text-primary' : 'flex items-start gap-2 text-muted-foreground'
                  }
                >
                  {isSatisfied ? (
                    <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  ) : (
                    <Circle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  )}

                  <span>
                    <span className="sr-only">{isSatisfied ? 'Atendido: ' : 'Pendente: '}</span>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-confirmation">Confirme a nova senha</Label>

            <Input
              id="reset-password-confirmation"
              name="passwordConfirmation"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="h-12 rounded-xl"
            />
          </div>

          {error && (
            <p
              id="reset-password-error"
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2 min-h-12 w-full cursor-pointer rounded-xl">
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Alterando senha...
              </>
            ) : (
              'Criar nova senha'
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}
