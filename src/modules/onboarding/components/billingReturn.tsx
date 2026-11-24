'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { storeActiveOrganizationId } from '@/modules/organizations/services/activeOrganization.storage';

import { getOnboardingHref } from '../helpers/trial.helper';
import { onboardingOrganizationIdSchema } from '../schemas/onboarding.schema';
import { getOnboarding } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20;

function shouldAwaitConfirmation(state: OnboardingState): boolean {
  if (state.step === 'APP' && state.accessSource === 'TRIAL') {
    return true;
  }

  return ['PAYMENT', 'PAYMENT_PENDING', 'PROVISIONING'].includes(state.step);
}

export function BillingReturn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState('Estamos confirmando sua assinatura com a Stripe.');
  const [timedOut, setTimedOut] = useState(false);

  const organizationId = useMemo(() => {
    const result = onboardingOrganizationIdSchema.safeParse(searchParams.get('organizationId'));

    return result.success ? result.data : null;
  }, [searchParams]);

  const onboardingHref = organizationId ? getOnboardingHref(organizationId) : '/onboarding';

  useEffect(() => {
    if (!organizationId) {
      router.replace('/onboarding');

      return;
    }

    const targetOrganizationId = organizationId;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    function schedule(): void {
      timer = setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    }

    function retryOrTimeout(timeoutMessage: string): void {
      attempts += 1;

      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true);
        setMessage(timeoutMessage);

        return;
      }

      schedule();
    }

    async function poll(): Promise<void> {
      try {
        const state = await getOnboarding(targetOrganizationId);

        if (!active) {
          return;
        }

        if (shouldAwaitConfirmation(state)) {
          retryOrTimeout('O pagamento foi enviado, mas a confirmação ainda está sendo processada.');

          return;
        }

        if (state.step === 'APP' && state.accessSource === 'SUBSCRIPTION') {
          storeActiveOrganizationId(targetOrganizationId);

          router.replace('/dashboard');

          return;
        }

        router.replace(getOnboardingHref(targetOrganizationId));
      } catch (cause: unknown) {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        retryOrTimeout('Não conseguimos confirmar o estado da assinatura agora.');
      }
    }

    void poll();

    return () => {
      active = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [organizationId, router]);

  if (timedOut) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-warning-surface text-warning">
          <CircleAlert aria-hidden="true" className="size-7" />
        </div>

        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">A confirmação está demorando</h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Não faça outro pagamento. Você pode continuar e verificar o estado da assinatura novamente.
        </p>

        <Button
          type="button"
          onClick={() => router.replace(onboardingHref)}
          className="mt-7 min-h-12 cursor-pointer rounded-xl"
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center"
    >
      <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-primary" />

      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">Confirmando seu pagamento</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

      <p className="mt-2 text-xs text-muted-foreground">Você será direcionado automaticamente.</p>
    </div>
  );
}
