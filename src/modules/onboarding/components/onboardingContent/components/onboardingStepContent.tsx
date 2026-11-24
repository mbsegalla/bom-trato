import { CircleCheck, Gift, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { storeActiveOrganizationId } from '@/modules/organizations/services/activeOrganization.storage';

import { hasActiveTrial } from '../../../helpers/trial.helper';
import type { OnboardingState } from '../../../types/onboarding.types';
import { BillingRecovery } from '../../billingRecovery';
import { OnboardingBusinessForm } from '../../onboardingBusinessForm';
import { OnboardingPayment } from '../../onboardingPayment';
import { OnboardingPlanSelection } from '../../onboardingPlanSelection';

interface OnboardingStepContentProps {
  state: OnboardingState;
  refreshing: boolean;
  onStateChange(state: OnboardingState): void;
  onRefresh(): void;
}

export function OnboardingStepContent({ state, refreshing, onStateChange, onRefresh }: OnboardingStepContentProps) {
  const { organizationId, selectedPlanPriceId } = state;

  switch (state.step) {
    case 'PROVISIONING':
      return <ProvisioningStep />;

    case 'SELECT_PLAN':
      if (!organizationId) return null;

      return (
        <>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Escolha seu plano</h1>

          <p className="mt-3 leading-relaxed text-muted-foreground">
            Escolha a opção que acompanha o momento do seu negócio.
          </p>

          <div className="mt-8">
            <OnboardingPlanSelection organizationId={organizationId} onSelected={onStateChange} />
          </div>
        </>
      );

    case 'PAYMENT':
      if (!organizationId || !selectedPlanPriceId) return null;

      return (
        <>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Revise seu plano e conclua a assinatura
          </h1>

          <p className="mt-3 leading-relaxed text-muted-foreground">
            Confira a opção escolhida e finalize o pagamento para liberar sua conta.
          </p>

          <div className="mt-8">
            <OnboardingPayment
              organizationId={organizationId}
              planPriceId={selectedPlanPriceId}
              onStateChange={onStateChange}
            />
          </div>
        </>
      );

    case 'PAYMENT_PENDING':
      return <PaymentPendingStep refreshing={refreshing} onRefresh={onRefresh} />;

    case 'CREATE_BUSINESS':
      if (!organizationId) return null;

      return (
        <CreateBusinessStep
          organizationId={organizationId}
          trialEligible={state.trialEligible}
          onCompleted={onStateChange}
        />
      );

    case 'APP':
      return <CompletedStep state={state} />;

    case 'BILLING_REQUIRED':
    case 'BILLING_REVIEW':
      if (!organizationId) return null;

      return (
        <BillingRecovery
          organizationId={organizationId}
          variant={state.step === 'BILLING_REVIEW' ? 'review' : 'required'}
          onStateChange={onStateChange}
        />
      );

    case 'CONTACT_OWNER':
      return <ContactOwnerStep />;
  }
}

function ProvisioningStep() {
  return (
    <div aria-busy="true" aria-label="Preparando sua conta" className="space-y-4">
      <Skeleton className="size-14 rounded-2xl motion-reduce:animate-none" />
      <Skeleton className="h-9 w-72 max-w-full motion-reduce:animate-none" />
      <Skeleton className="h-4 w-full motion-reduce:animate-none" />
      <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
    </div>
  );
}

interface PaymentPendingStepProps {
  refreshing: boolean;
  onRefresh(): void;
}

function PaymentPendingStep({ refreshing, onRefresh }: PaymentPendingStepProps) {
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Confirmando seu pagamento</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">
        Recebemos o retorno da Stripe e estamos aguardando a confirmação da assinatura. Não inicie outro pagamento.
      </p>

      <Button type="button" disabled={refreshing} onClick={onRefresh} className="mt-7 min-h-12 rounded-xl">
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
  );
}

interface CreateBusinessStepProps {
  organizationId: string;
  trialEligible: boolean;
  onCompleted(state: OnboardingState): void;
}

function CreateBusinessStep({ organizationId, trialEligible, onCompleted }: CreateBusinessStepProps) {
  const Icon = trialEligible ? Gift : CircleCheck;

  const title = trialEligible ? 'Seu negócio começa aqui' : 'Pagamento confirmado';

  const description = trialEligible
    ? 'Conte como devemos chamar seu negócio e comece a experimentar o Bom Trato por 14 dias.'
    : 'Agora conte como devemos chamar o seu negócio.';

  return (
    <>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
        <Icon aria-hidden="true" className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">{title}</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-8">
        <OnboardingBusinessForm
          organizationId={organizationId}
          trialEligible={trialEligible}
          onCompleted={onCompleted}
        />
      </div>
    </>
  );
}

function CompletedStep({ state }: { state: OnboardingState }) {
  const trialActive = hasActiveTrial(state);

  const title = trialActive ? 'Sua avaliação começou!' : 'Tudo pronto';

  const description = trialActive
    ? 'Seu negócio está configurado. Aproveite sua avaliação gratuita para conhecer os recursos do Bom Trato.'
    : 'Sua conta está configurada e sua assinatura está ativa.';

  function continueToApplication(): void {
    if (state.organizationId) {
      storeActiveOrganizationId(state.organizationId);
    }
  }

  return (
    <>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-success-surface text-success">
        <CircleCheck aria-hidden="true" className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">{title}</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>

      <Link
        href="/dashboard"
        onClick={continueToApplication}
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Ir para o Bom Trato
      </Link>
    </>
  );
}

function ContactOwnerStep() {
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Fale com o responsável</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">
        O responsável pelo negócio precisa concluir esta etapa.
      </p>
    </>
  );
}
