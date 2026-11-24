import type { OnboardingState, OnboardingStep } from '../../../types/onboarding.types';

interface OnboardingProgressProps {
  state: OnboardingState;
}

interface OnboardingProgressView {
  labels: string[];
  current: number;
}

const subscriptionProgress: Record<OnboardingStep, number> = {
  PROVISIONING: 1,
  SELECT_PLAN: 1,
  PAYMENT: 2,
  PAYMENT_PENDING: 2,
  BILLING_REQUIRED: 2,
  BILLING_REVIEW: 2,
  CREATE_BUSINESS: 3,
  APP: 3,
  CONTACT_OWNER: 1,
};

function resolveProgress(state: OnboardingState): OnboardingProgressView {
  if (state.trialEligible || state.trial !== null) {
    return {
      labels: ['Conta', 'Seu negócio', 'Tudo pronto'],
      current: state.trial !== null ? 3 : 2,
    };
  }

  return {
    labels: ['Conta', 'Pagamento', 'Seu negócio'],
    current: subscriptionProgress[state.step],
  };
}

export function OnboardingProgress({ state }: OnboardingProgressProps) {
  const { labels, current } = resolveProgress(state);

  return (
    <header className="mb-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Configuração da conta</p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        {labels.map((label, index) => {
          const currentStep = index + 1;

          return (
            <div
              key={label}
              aria-current={currentStep === current ? 'step' : undefined}
              className={
                currentStep <= current
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
  );
}
