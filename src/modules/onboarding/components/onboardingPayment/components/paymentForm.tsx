'use client';

import { PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import Image from 'next/image';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function PaymentForm() {
  const checkoutResult = useCheckoutElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (checkoutResult.type !== 'success' || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const validationResult = await checkoutResult.checkout.validateElements();

      if (validationResult.type === 'error') {
        setError(validationResult.error.message || 'Revise os dados do pagamento.');

        return;
      }

      const result = await checkoutResult.checkout.confirm();

      if (result.type === 'error') {
        console.error('Stripe checkout confirmation error:', result.error);

        setError(result.error.message ?? 'Não foi possível confirmar o pagamento.');
      }
    } catch (cause: unknown) {
      console.error('Stripe checkout confirmation failed:', cause);

      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar o pagamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutResult.type === 'loading') {
    return (
      <div aria-busy="true" className="flex min-h-40 flex-col items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  if (checkoutResult.type === 'error') {
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
      >
        {checkoutResult.error.message || 'Não foi possível carregar o formulário de pagamento.'}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Concluir assinatura
          </>
        )}
      </Button>

      <div className="flex flex-col items-center gap-3">
        <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" />
          Pagamento processado com segurança pela Stripe.
        </p>

        <a
          href="https://stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Saiba mais sobre a Stripe"
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Image
            src="/stripe/powered-by-stripe.svg"
            alt="Powered by Stripe"
            width={104}
            height={24}
            className="h-6 w-auto"
          />
        </a>
      </div>
    </form>
  );
}
