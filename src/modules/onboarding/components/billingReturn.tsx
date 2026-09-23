'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';

import { getOnboarding } from '../services/onboarding.service';

const organizationIdSchema = z.uuid();

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20;

export function BillingReturn() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [message, setMessage] = useState('Estamos confirmando sua assinatura com a Stripe.');

  const [timedOut, setTimedOut] = useState(false);

  const organizationId = useMemo(() => {
    const result = organizationIdSchema.safeParse(searchParams.get('organizationId'));

    return result.success ? result.data : null;
  }, [searchParams]);

  useEffect(() => {
    if (!organizationId) {
      router.replace('/onboarding');

      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    let attempts = 0;

    const schedule = () => {
      timer = setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    };

    const poll = async () => {
      try {
        const state = await getOnboarding(organizationId);

        if (!active) {
          return;
        }

        switch (state.step) {
          case 'CREATE_BUSINESS':
          case 'APP':
          case 'BILLING_REQUIRED':
          case 'BILLING_REVIEW':
          case 'CONTACT_OWNER':
          case 'SELECT_PLAN':
            router.replace('/onboarding');

            return;

          case 'PAYMENT':
          case 'PAYMENT_PENDING':
          case 'PROVISIONING':
            attempts += 1;

            if (attempts >= MAX_ATTEMPTS) {
              setTimedOut(true);

              setMessage('O pagamento foi enviado, mas a confirmação ainda está sendo processada.');

              return;
            }

            schedule();

            return;
        }
      } catch (cause: unknown) {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        attempts += 1;

        if (attempts >= MAX_ATTEMPTS) {
          setTimedOut(true);

          setMessage('Não conseguimos confirmar o estado da assinatura agora.');

          return;
        }

        schedule();
      }
    };

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

        <Button type="button" onClick={() => router.replace('/onboarding')} className="mt-7 min-h-12 rounded-xl">
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
