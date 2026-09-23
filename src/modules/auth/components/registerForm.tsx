'use client';

import { ArrowRight, Check, Circle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { registerUser } from '../services/auth.service';
import type { RegisterFormProps } from '../types/auth.types';
import { getPasswordRequirements, isPasswordValid } from '../utils/passwordPolicy';

export function RegisterForm({ selectedPlan }: RegisterFormProps) {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [passwordValue, setPasswordValue] = useState('');
  const passwordRequirements = getPasswordRequirements(passwordValue);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = selectedPlan
    ? {
        pathname: '/login',
        query: {
          planPriceId: selectedPlan.price.id,
        },
      }
    : '/login';

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

    setError(null);

    if (!name || !email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (!isPasswordValid(password)) {
      setError('A senha deve ter de 12 a 128 caracteres, uma letra maiúscula e um caractere especial.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await registerUser({
        name,
        email,
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      form.reset();
      setPasswordValue('');
      const params = new URLSearchParams();

      if (selectedPlan) {
        params.set('planPriceId', selectedPlan.price.id);
      }

      const query = params.toString();
      router.replace(query ? `/verify-email?${query}` : '/verify-email');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary">COMECE SEU PRÓXIMO BOM TRATO</p>

      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Seu negócio merece esse cuidado.
      </h1>

      <p className="mt-3 text-muted-foreground">Crie sua conta para organizar sua rotina em um só lugar.</p>

      {selectedPlan && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Plano escolhido</p>

              <p className="mt-1 font-semibold">{selectedPlan.name}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: selectedPlan.price.currency.toUpperCase(),
                }).format(selectedPlan.price.amountInCents / 100)}
                {' / '}
                {selectedPlan.price.interval === 'YEAR' ? 'ano' : 'mês'}
              </p>
            </div>

            <Link href="/#pricing" className="text-sm font-medium text-primary underline underline-offset-4">
              Alterar
            </Link>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">O cadastro não realiza cobrança.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={error ? 'register-error' : undefined}
        className="mt-7"
      >
        <fieldset disabled={isSubmitting} className="space-y-4">
          <legend className="sr-only">Dados da conta</legend>

          <div className="space-y-2">
            <Label htmlFor="register-name">Nome</Label>

            <Input
              id="register-name"
              name="name"
              autoComplete="name"
              placeholder="Como podemos chamar você?"
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">E-mail</Label>

            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="voce@empresa.com"
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>

            <div className="relative">
              <Input
                id="register-password"
                name="password"
                onChange={(event) => setPasswordValue(event.currentTarget.value)}
                aria-describedby="register-password-requirements"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="h-12 rounded-xl pr-12"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-controls="register-password"
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
            <ul id="register-password-requirements" className="space-y-1.5 pt-1 text-xs leading-relaxed">
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
            <Label htmlFor="register-password-confirmation">Confirme sua senha</Label>

            <Input
              id="register-password-confirmation"
              name="passwordConfirmation"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="h-12 rounded-xl"
            />
          </div>

          {error && (
            <p
              id="register-error"
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
                Criando conta...
              </>
            ) : (
              <>
                Criar conta
                <ArrowRight aria-hidden="true" className="size-4" />
              </>
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href={loginHref} className="font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  );
}
