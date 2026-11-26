import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getTrialProgress, hasActiveTrial, hasEndedTrial, getTrialRemainingDaysLabel, getOnboardingHref, getTrialSubscriptionHref } from './trial.helper';
import type { OnboardingState } from '../types/onboarding.types';

const trial = {
  startsAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: new Date('2026-01-15T00:00:00Z'),
  remainingDays: 7,
  active: true,
  convertedAt: null,
  revokedAt: null
};
const state: OnboardingState = {
  step: 'APP',
  organizationId: '11111111-1111-4111-8111-111111111111',
  selectedPlanPriceId: null,
  accessSource: 'TRIAL',
  trialEligible: false,
  trial
};

describe('trial UI state', () => {
  it('shows active trial only in app with trial access and bounds progress', () => {
    assert.equal(hasActiveTrial(state), true);
    assert.equal(hasActiveTrial({ ...state, accessSource: 'SUBSCRIPTION' }), false);
    assert.equal(getTrialProgress(trial), 50);
    assert.equal(getTrialProgress({ ...trial, remainingDays: 20 }), 100);
    assert.equal(getTrialProgress({ ...trial, remainingDays: -1 }), 0);
  });

  it('does not show converted or revoked trial as expired promotion', () => {
    const expired: OnboardingState = {
      ...state,
      step: 'SELECT_PLAN',
      accessSource: 'NONE',
      trial: {
        ...trial,
        active: false,
        remainingDays: 0
      }
    };

    assert.equal(hasEndedTrial(expired), true);
    assert.equal(hasEndedTrial({ ...expired, trial: { ...trial, active: false, convertedAt: trial.startsAt } }), false);
    assert.equal(hasEndedTrial({ ...expired, trial: { ...trial, active: false, revokedAt: trial.startsAt } }), false);
  });
  it('does not show trial actions for missing, inactive or incompatible onboarding states', () => {
    assert.equal(hasActiveTrial({ ...state, trial: null }), false);
    assert.equal(hasActiveTrial({ ...state, trial: { ...trial, active: false } }), false);
    assert.equal(hasActiveTrial({ ...state, step: 'SELECT_PLAN' }), false);
    assert.equal(hasEndedTrial({ ...state, step: 'PAYMENT', accessSource: 'NONE', trial: null }), false);
    assert.equal(hasEndedTrial({ ...state, step: 'PAYMENT', accessSource: 'NONE' }), false);
    assert.equal(hasEndedTrial({ ...state, accessSource: 'NONE', trial: { ...trial, active: false } }), false);
    assert.equal(hasEndedTrial({ ...state, step: 'PAYMENT', accessSource: 'NONE', trial: { ...trial, active: false } }), true);
  });

  it('handles zero and negative trial durations and pluralizes remaining days', () => {
    assert.equal(getTrialProgress({ ...trial, expiresAt: trial.startsAt }), 0);
    assert.equal(getTrialProgress({ ...trial, expiresAt: new Date(trial.startsAt.getTime() - 86400000) }), 0);
    assert.equal(getTrialRemainingDaysLabel(1), '1 dia restante');
    assert.equal(getTrialRemainingDaysLabel(0), '0 dias restantes');
    assert.equal(getTrialRemainingDaysLabel(2), '2 dias restantes');
  });

  it('encodes organization identity without introducing additional query parameters', () => {
    const id = 'fixture &subscribe=0';
    assert.equal(getOnboardingHref(id), '/onboarding?organizationId=fixture%20%26subscribe%3D0');
    assert.equal(getTrialSubscriptionHref(id), '/onboarding?organizationId=fixture%20%26subscribe%3D0&subscribe=1');
  });
});
