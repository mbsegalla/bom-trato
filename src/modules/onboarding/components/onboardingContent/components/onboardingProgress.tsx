import type { OnboardingState } from '../../../types/onboarding.types';

function progressForStep(step: OnboardingState['step']): number {
  if (step === 'CREATE_BUSINESS' || step === 'APP') {
    return 3;
  }

  if (step === 'PAYMENT' || step === 'PAYMENT_PENDING' || step === 'BILLING_REQUIRED' || step === 'BILLING_REVIEW') {
    return 2;
  }

  return 1;
}

export function OnboardingProgress({ step }: { step: OnboardingState['step'] }) {
  const progress = progressForStep(step);

  return (
    <header className="mb-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Configuração da conta</p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        {['Conta', 'Pagamento', 'Seu negócio'].map((label, index) => {
          const currentStep = index + 1;

          return (
            <div
              key={label}
              className={
                currentStep <= progress
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
