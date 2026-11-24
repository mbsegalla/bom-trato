import type { OnboardingState, OnboardingTrial } from '../types/onboarding.types';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function hasActiveTrial(state: OnboardingState): boolean {
  return state.step === 'APP' && state.accessSource === 'TRIAL' && state.trial?.active === true;
}

export function hasEndedTrial(state: OnboardingState): boolean {
  return (
    state.accessSource === 'NONE' &&
    state.trial !== null &&
    !state.trial.active &&
    state.trial.convertedAt === null &&
    state.trial.revokedAt === null &&
    (state.step === 'SELECT_PLAN' || state.step === 'PAYMENT')
  );
}

export function getTrialRemainingDaysLabel(remainingDays: number): string {
  return remainingDays === 1 ? '1 dia restante' : `${remainingDays} dias restantes`;
}

export function getTrialProgress(trial: OnboardingTrial): number {
  const duration = Math.ceil((trial.expiresAt.getTime() - trial.startsAt.getTime()) / MILLISECONDS_PER_DAY);

  if (duration <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (trial.remainingDays / duration) * 100));
}

export function getOnboardingHref(organizationId: string): string {
  return `/onboarding?organizationId=${encodeURIComponent(organizationId)}`;
}

export function getTrialSubscriptionHref(organizationId: string): string {
  return `${getOnboardingHref(organizationId)}&subscribe=1`;
}
