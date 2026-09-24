'use client';

import { CircleCheck, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';

import { bootstrapOnboarding, getOnboarding } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';
import { OnboardingBusinessForm } from './onboardingBusinessForm';
import { OnboardingPayment } from './onboardingPayment';
import { OnboardingPlanSelection } from './onboardingPlanSelection';

export function OnboardingContent() {
  const router = useRouter();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    void bootstrapOnboarding()
      .then((result) => {
        if (!active) {
          return;
        }

        setState(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível preparar sua conta.');
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function refreshOnboarding(): Promise<void> {
    if (!state?.organizationId || refreshing) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const nextState = await getOnboarding(state.organizationId);

      setState(nextState);
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar sua conta.');
    } finally {
      setRefreshing(false);
    }
  }

  if (!state && !error) {
    return (
      <div
        aria-busy="true"
        className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center text-center"
      >
        <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-primary" />

        <p className="mt-4 text-sm text-muted-foreground">Preparando seu próximo passo...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-7">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Não conseguimos continuar</h1>

        <p role="alert" className="mt-4 text-sm leading-relaxed text-destructive">
          {error}
        </p>

        <Button
          type="button"
          className="mt-6 min-h-12 cursor-pointer rounded-xl"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const progress =
    state.step === 'CREATE_BUSINESS' || state.step === 'APP'
      ? 3
      : state.step === 'PAYMENT' ||
          state.step === 'PAYMENT_PENDING' ||
          state.step === 'BILLING_REQUIRED' ||
          state.step === 'BILLING_REVIEW'
        ? 2
        : 1;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Configuração da conta</p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
          {['Conta', 'Pagamento', 'Seu negócio'].map((label, index) => {
            const step = index + 1;

            return (
              <div
                key={label}
                className={
                  step <= progress
                    ? 'border-t-2 border-primary pt-3 font-medium text-foreground'
                    : 'border-t-2 border-border pt-3 text-muted-foreground'
                }
              >
                {label}
              </div>
            );
          })}
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {state.step === 'PROVISIONING' && (
          <div className="text-center">
            <LoaderCircle aria-hidden="true" className="mx-auto size-7 animate-spin text-primary" />

            <p className="mt-4 text-muted-foreground">Preparando sua conta...</p>
          </div>
        )}

        {state.step === 'SELECT_PLAN' && state.organizationId && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Escolha seu plano</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              Escolha a opção que acompanha o momento do seu negócio.
            </p>

            <div className="mt-8">
              <OnboardingPlanSelection organizationId={state.organizationId} onSelected={setState} />
            </div>
          </>
        )}

        {state.step === 'PAYMENT' && state.organizationId && state.selectedPlanPriceId && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Conclua sua assinatura</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">Finalize o pagamento para liberar sua conta.</p>

            <div className="mt-8">
              <OnboardingPayment organizationId={state.organizationId} planPriceId={state.selectedPlanPriceId} />
            </div>
          </>
        )}

        {state.step === 'PAYMENT_PENDING' && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Confirmando seu pagamento</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              Recebemos o retorno da Stripe e estamos aguardando a confirmação da assinatura. Não inicie outro
              pagamento.
            </p>

            <Button
              type="button"
              disabled={refreshing}
              onClick={() => void refreshOnboarding()}
              className="mt-7 min-h-12 rounded-xl"
            >
              {refreshing ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar pagamento'
              )}
            </Button>
          </>
        )}

        {state.step === 'CREATE_BUSINESS' && state.organizationId && (
          <>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
              <CircleCheck aria-hidden="true" className="size-7" />
            </div>

            <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">Pagamento confirmado</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">Agora conte como devemos chamar o seu negócio.</p>

            <div className="mt-8">
              <OnboardingBusinessForm organizationId={state.organizationId} onCompleted={setState} />
            </div>
          </>
        )}

        {state.step === 'APP' && (
          <>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
              <CircleCheck aria-hidden="true" className="size-7" />
            </div>

            <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">Tudo pronto</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              Sua conta está configurada e sua assinatura está ativa.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continuar
            </Link>
          </>
        )}

        {state.step === 'BILLING_REQUIRED' && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Precisamos revisar sua assinatura</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              Existe uma assinatura que precisa ser regularizada antes de continuar.
            </p>
          </>
        )}

        {state.step === 'BILLING_REVIEW' && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Estamos revisando sua assinatura</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              Encontramos uma situação de cobrança que precisa ser reconciliada antes de continuar.
            </p>
          </>
        )}

        {state.step === 'CONTACT_OWNER' && (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Fale com o responsável</h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              O responsável pelo negócio precisa concluir esta etapa.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
