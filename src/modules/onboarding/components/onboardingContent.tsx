'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SessionError } from '@/modules/auth/services/session.service';

import { createBusiness, getOnboarding, type OnboardingState } from '../services/onboarding.service';

const titles = {
  CREATE_BUSINESS: 'Cadastre seu negócio',
  SELECT_PLAN: 'Escolha seu plano',
  PAYMENT: 'Continue para o pagamento',
  PAYMENT_PENDING: 'Aguardando confirmação do pagamento',
  BILLING_REQUIRED: 'Regularize sua assinatura',
  BILLING_REVIEW: 'Sua assinatura precisa de revisão',
  APP: 'Sua conta está pronta',
  CONTACT_OWNER: 'Fale com o responsável pelo negócio',
};

export function OnboardingContent() {
  const router = useRouter();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  const saving = useRef(false);

  const creation = useRef<{
    name: string;
    key: string;
    id?: string;
  } | null>(null);

  const selectedOrganization = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;

    void getOnboarding(selectedOrganization.current)
      .then((result) => {
        if (!active) {
          return;
        }

        setState(result);
        setError('');

        selectedOrganization.current = result.organizationId ?? undefined;
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError('Não foi possível carregar sua conta. Tente novamente.');
      });

    return () => {
      active = false;
    };
  }, [router, reload]);

  const submit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (saving.current) {
      return;
    }

    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();

    if (name.length < 2 || name.length > 100) {
      setError('Informe um nome entre 2 e 100 caracteres.');
      return;
    }

    if (creation.current && creation.current.name !== name) {
      setError('Primeiro tente novamente com o mesmo nome para confirmar o resultado do envio anterior.');
      return;
    }

    creation.current ??= {
      name,
      key: crypto.randomUUID(),
    };

    saving.current = true;
    setBusy(true);
    setError('');

    try {
      const attempt = creation.current;

      attempt.id ??= await createBusiness(attempt.name, attempt.key);

      selectedOrganization.current = attempt.id;

      setState(await getOnboarding(attempt.id));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível continuar.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-6" aria-busy={busy}>
      <h1 className="font-heading text-3xl font-semibold">{state ? titles[state.step] : 'Carregando sua conta…'}</h1>

      {error && (
        <>
          <p role="alert">{error}</p>

          <Button disabled={busy} onClick={() => setReload((value) => value + 1)}>
            Consultar novamente
          </Button>
        </>
      )}

      {state?.step === 'CREATE_BUSINESS' && (
        <form onSubmit={submit} className="space-y-4">
          <Label htmlFor="business-name">Nome do negócio</Label>

          <Input id="business-name" name="name" minLength={2} maxLength={100} required disabled={busy} />

          <Button type="submit" disabled={busy}>
            {busy ? 'Salvando…' : 'Cadastrar negócio'}
          </Button>
        </form>
      )}

      {state?.step === 'PAYMENT_PENDING' && (
        <>
          <p>Estamos aguardando a confirmação. Não é necessário iniciar outra compra.</p>

          <Button onClick={() => setReload((value) => value + 1)}>Verificar pagamento</Button>
        </>
      )}

      {state?.step === 'SELECT_PLAN' && <p>Seu negócio está cadastrado. Escolha um plano para continuar.</p>}

      {state?.step === 'PAYMENT' && <p>Seu negócio está cadastrado. O próximo passo é concluir o pagamento.</p>}

      {state?.step === 'APP' && <p>Sua assinatura permite acesso ao sistema.</p>}

      {(state?.step === 'BILLING_REQUIRED' || state?.step === 'BILLING_REVIEW') && (
        <p>É necessário verificar a assinatura existente antes de continuar.</p>
      )}

      {state?.step === 'CONTACT_OWNER' && <p>Peça ao responsável que verifique a assinatura deste negócio.</p>}

      <Link className="block underline" href="/">
        Voltar ao início
      </Link>
    </section>
  );
}
