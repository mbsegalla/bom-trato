'use client';

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { storeActiveOrganizationId } from '@/modules/organizations/services/activeOrganization.storage';

import { completePaymentMethodUpdate, syncPlanChange } from '../services/billing.service';

interface BillingOperationReturnProps {
  organizationId: string;
  operationId: string;
  kind: 'payment-method' | 'plan-change';
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

export function BillingOperationReturn({ organizationId, operationId, kind }: BillingOperationReturnProps) {
  const router = useRouter();

  const [state, setState] = useState<ReturnState>({
    kind: 'loading',
    message:
      kind === 'payment-method' ? 'Estamos confirmando seu novo cartão.' : 'Estamos confirmando a alteração do plano.',
  });

  useEffect(() => {
    let active = true;

    async function process(): Promise<void> {
      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          if (kind === 'payment-method') {
            const result = await completePaymentMethodUpdate(organizationId, operationId);

            if (!active) {
              return;
            }

            if (result.status === 'APPLIED') {
              storeActiveOrganizationId(organizationId);

              setState({
                kind: 'success',
                message: 'Seu novo cartão foi salvo com sucesso.',
              });

              setTimeout(() => {
                window.location.replace('/settings?tab=billing');
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
          } else {
            const result = await syncPlanChange(organizationId, operationId);

            if (!active) {
              return;
            }

            if (result.status === 'APPLIED' || result.status === 'SCHEDULED') {
              storeActiveOrganizationId(organizationId);

              setState({
                kind: 'success',
                message:
                  result.status === 'APPLIED' ? 'Seu novo plano foi aplicado.' : 'A alteração do plano foi agendada.',
              });

              setTimeout(() => {
                window.location.replace('/settings?tab=billing');
              }, 1200);

              return;
            }

            if (result.status === 'CANCELED' || result.status === 'EXPIRED') {
              setState({
                kind: 'error',
                message: 'A alteração do plano não pôde ser concluída.',
              });

              return;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        if (active) {
          setState({
            kind: 'error',
            message:
              'A operação foi enviada, mas ainda está sendo processada. Verifique novamente em alguns instantes.',
          });
        }
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
          message: cause instanceof Error ? cause.message : 'Não foi possível confirmar a operação.',
        });
      }
    }

    void process();

    return () => {
      active = false;
    };
  }, [kind, operationId, organizationId, router]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center text-center">
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
          <CircleCheck className="size-7" />
        ) : state.kind === 'error' ? (
          <CircleAlert className="size-7" />
        ) : (
          <LoaderCircle className="size-7 animate-spin" />
        )}
      </div>

      <h1 className="mt-6 font-heading text-2xl font-semibold">
        {state.kind === 'success'
          ? 'Tudo certo'
          : state.kind === 'error'
            ? 'Precisamos verificar'
            : 'Confirmando alteração'}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.message}</p>

      {state.kind === 'error' && (
        <Button
          type="button"
          onClick={() => window.location.replace('/settings?tab=billing')}
          className="mt-7 cursor-pointer"
        >
          Voltar para assinatura
        </Button>
      )}
    </div>
  );
}
