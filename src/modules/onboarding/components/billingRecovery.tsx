'use client';

import { CircleAlert, CreditCard, LoaderCircle, Mail, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import { legalIdentity } from '@/modules/legal/data/legal.data';
import { PaymentMethodPanel } from '@/modules/settings/components/paymentMethodPanel';
import { syncBilling } from '@/modules/settings/services/billing.service';

import { getOnboarding } from '../services/onboarding.service';
import type { OnboardingState } from '../types/onboarding.types';

interface BillingRecoveryProps {
  organizationId: string;
  variant?: 'required' | 'review';
  onStateChange(state: OnboardingState): void;
}

export function BillingRecovery({ organizationId, variant = 'required', onStateChange }: BillingRecoveryProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supportEmailConfigured =
    Boolean(legalIdentity.supportEmail) && !legalIdentity.supportEmail.startsWith('PREENCHER');

  async function checkSubscription(): Promise<void> {
    if (checking) {
      return;
    }

    setChecking(true);
    setError(null);
    setNotice(null);

    try {
      await syncBilling(organizationId);

      const state = await getOnboarding(organizationId);

      onStateChange(state);

      if (state.step === 'BILLING_REQUIRED') {
        setNotice('Sua assinatura ainda precisa de atenção. Se necessário, atualize o método de pagamento.');
      }

      if (state.step === 'BILLING_REVIEW') {
        setNotice('Ainda encontramos uma situação de cobrança que precisa ser revisada.');
      }
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível verificar sua assinatura.');
    } finally {
      setChecking(false);
    }
  }

  const isReview = variant === 'review';

  return (
    <>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-warning-surface text-warning">
        <CircleAlert aria-hidden="true" className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        {isReview ? 'Estamos revisando sua assinatura' : 'Precisamos revisar sua assinatura'}
      </h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">
        {isReview
          ? 'Encontramos uma situação de cobrança que precisa ser reconciliada antes de continuar.'
          : 'Não conseguimos confirmar que sua assinatura está regular. Você pode verificar novamente ou atualizar seu cartão.'}
      </p>

      {notice && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground"
        >
          {notice}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={checking}
          onClick={() => void checkSubscription()}
          className="min-h-12 cursor-pointer rounded-xl"
        >
          {checking ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCcw aria-hidden="true" className="size-4" />
              Verificar novamente
            </>
          )}
        </Button>

        {!isReview && (
          <Button
            type="button"
            variant="outline"
            disabled={checking}
            onClick={() => setPaymentPanelOpen(true)}
            className="min-h-12 cursor-pointer rounded-xl"
          >
            <CreditCard aria-hidden="true" className="size-4" />
            Atualizar cartão
          </Button>
        )}

        {supportEmailConfigured && (
          <a
            href={`mailto:${legalIdentity.supportEmail}?subject=${encodeURIComponent('Ajuda com minha assinatura no Bom Trato')}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Mail aria-hidden="true" className="size-4" />
            Falar com suporte
          </a>
        )}
      </div>

      {!isReview && (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Se o pagamento já foi realizado, use “Verificar novamente”. Não realize uma nova assinatura enquanto
          verificamos a cobrança existente.
        </p>
      )}

      {paymentPanelOpen && (
        <PaymentMethodPanel
          organizationId={organizationId}
          returnPath="/billing/return"
          onClose={() => setPaymentPanelOpen(false)}
          onSaved={() => {
            setPaymentPanelOpen(false);
            void checkSubscription();
          }}
        />
      )}
    </>
  );
}
