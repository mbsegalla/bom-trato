'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getStripeConfig } from '@/config/stripe.config';

import { completePaymentMethodUpdate, startPaymentMethodUpdate } from '../services/billing.service';
import type { PaymentMethodUpdate } from '../types/billing.types';

const stripePromise = loadStripe(getStripeConfig().publishableKey);

interface PaymentMethodPanelProps {
  organizationId: string;
  onClose(): void;
  onSaved(): void;
}

export function PaymentMethodPanel({ organizationId, onClose, onSaved }: PaymentMethodPanelProps) {
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [update, setUpdate] = useState<PaymentMethodUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(): Promise<void> {
    if (!accepted || starting) {
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const result = await startPaymentMethodUpdate(organizationId);

      if (result.status === 'APPLIED') {
        onSaved();
        return;
      }

      if (result.status === 'CANCELED' || !result.clientSecret) {
        setError('Não foi possível preparar a atualização do cartão.');

        return;
      }

      setUpdate(result);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a atualização do cartão.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Alterar cartão</h2>

            <p className="mt-1 text-sm text-muted-foreground">O novo cartão será utilizado nas próximas cobranças.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={starting}
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="size-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!update ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-muted text-primary">
                <CreditCard className="size-6" />
              </div>

              <h3 className="mt-5 font-heading text-lg font-semibold">Autorizar novo cartão</h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                O cartão informado será salvo na Stripe e poderá ser utilizado para cobranças recorrentes da sua
                assinatura.
              </p>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-1 size-4"
                />

                <span className="text-sm leading-relaxed">
                  Autorizo o Bom Trato a salvar este cartão e utilizá-lo nas cobranças da assinatura.
                </span>
              </label>

              {error && (
                <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="button"
                disabled={!accepted || starting}
                onClick={() => void start()}
                className="mt-6 min-h-12 w-full cursor-pointer rounded-xl"
              >
                {starting && <LoaderCircle className="size-4 animate-spin" />}
                Continuar
              </Button>
            </>
          ) : update.clientSecret ? (
            <Elements
              key={update.clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret: update.clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#205c49',
                    borderRadius: '10px',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                  },
                },
              }}
            >
              <PaymentMethodForm organizationId={organizationId} update={update} onSaved={onSaved} />
            </Elements>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface PaymentMethodFormProps {
  organizationId: string;
  update: PaymentMethodUpdate;
  onSaved(): void;
}

function PaymentMethodForm({ organizationId, update, onSaved }: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const returnUrl = new URL('/settings/billing/return', window.location.origin);

      returnUrl.searchParams.set('organizationId', organizationId);
      returnUrl.searchParams.set('operationId', update.updateId);
      returnUrl.searchParams.set('kind', 'payment-method');

      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message ?? 'Não foi possível confirmar o cartão.');

        return;
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const completed = await completePaymentMethodUpdate(organizationId, update.updateId);

        if (completed.status === 'APPLIED') {
          onSaved();
          return;
        }

        if (completed.status === 'CANCELED') {
          setError('A atualização do cartão foi cancelada.');

          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setError(
        'O cartão foi confirmado, mas a atualização ainda está sendo processada. Atualize a página em alguns instantes.',
      );
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o cartão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={!stripe || submitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Salvando cartão...
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Salvar cartão
          </>
        )}
      </Button>
    </form>
  );
}
