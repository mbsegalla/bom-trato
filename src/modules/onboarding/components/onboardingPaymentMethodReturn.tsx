'use client';

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { completePaymentMethodUpdate, syncBilling } from '@/modules/settings/services/billing.service';

interface OnboardingPaymentMethodReturnProps {
  organizationId: string;
  operationId: string;
}

type ReturnState =
  | {
      kind: 'loading';
      message: string;
    }
  | {
      kind: 'success';
      message: string;
    }
  | {
      kind: 'error';
      message: string;
    };

export function OnboardingPaymentMethodReturn({ organizationId, operationId }: OnboardingPaymentMethodReturnProps) {
  const router = useRouter();

  const [state, setState] = useState<ReturnState>({
    kind: 'loading',
    message: 'Estamos confirmando seu novo cartão.',
  });

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function process(): Promise<void> {
      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const result = await completePaymentMethodUpdate(organizationId, operationId);

          if (!active) {
            return;
          }

          if (result.status === 'APPLIED') {
            await syncBilling(organizationId);

            if (!active) {
              return;
            }

            setState({
              kind: 'success',
              message: 'Seu cartão foi atualizado. Vamos verificar sua assinatura novamente.',
            });

            redirectTimer = setTimeout(() => {
              router.replace('/onboarding');
            }, 1200);

            return;
          }

          if (result.status === 'CANCELED') {
            setState({
              kind: 'error',
              message: 'A atualização do cartão foi cancelada.',
            });

            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        if (!active) {
          return;
        }

        setState({
          kind: 'error',
          message:
            'O cartão foi enviado, mas a confirmação ainda está sendo processada. Você pode voltar e verificar novamente.',
        });
      } catch (cause: unknown) {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setState({
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível confirmar a atualização do cartão.',
        });
      }
    }

    void process();

    return () => {
      active = false;

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [operationId, organizationId, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <div
        className={
          state.kind === 'success'
            ? 'flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success'
            : state.kind === 'error'
              ? 'flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'
              : 'flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary'
        }
      >
        {state.kind === 'success' ? (
          <CircleCheck aria-hidden="true" className="size-7" />
        ) : state.kind === 'error' ? (
          <CircleAlert aria-hidden="true" className="size-7" />
        ) : (
          <LoaderCircle aria-hidden="true" className="size-7 animate-spin" />
        )}
      </div>

      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
        {state.kind === 'success'
          ? 'Cartão atualizado'
          : state.kind === 'error'
            ? 'Precisamos verificar'
            : 'Confirmando seu cartão'}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.message}</p>

      {state.kind === 'error' && (
        <Button
          type="button"
          onClick={() => router.replace('/onboarding')}
          className="mt-7 min-h-12 cursor-pointer rounded-xl"
        >
          Voltar para assinatura
        </Button>
      )}
    </div>
  );
}
