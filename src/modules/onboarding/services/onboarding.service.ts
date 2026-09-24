import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { onboardingStateSchema } from '../schemas/onboarding.schema';
import type { OnboardingState } from '../types/onboarding.types';

let bootstrapFlight: Promise<OnboardingState> | null = null;

const stateFlights = new Map<string, Promise<OnboardingState>>();

async function readOnboardingState(response: Response): Promise<OnboardingState> {
  if (response.status === 401) {
    throw new SessionError('Entre para continuar.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar a próxima etapa. Tente novamente.');
  }

  const payload: unknown = await response.json();

  const parsed = onboardingStateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a próxima etapa.');
  }

  return parsed.data;
}

async function requestBootstrap(): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/bootstrap', {
    method: 'POST',
  });

  return readOnboardingState(response);
}

export function bootstrapOnboarding(): Promise<OnboardingState> {
  if (bootstrapFlight) {
    return bootstrapFlight;
  }

  const request = requestBootstrap();

  bootstrapFlight = request;

  const cleanup = () => {
    if (bootstrapFlight === request) {
      bootstrapFlight = null;
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestOnboardingState(organizationId?: string): Promise<OnboardingState> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';

  const response = await authenticatedFetch(`/api/onboarding${query}`);

  return readOnboardingState(response);
}

export function getOnboarding(organizationId?: string): Promise<OnboardingState> {
  const key = organizationId ?? '__default__';

  const existing = stateFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestOnboardingState(organizationId);

  stateFlights.set(key, request);

  const cleanup = () => {
    if (stateFlights.get(key) === request) {
      stateFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function selectOnboardingPlan(organizationId: string, planPriceId: string): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      planPriceId,
    }),
  });

  return readOnboardingState(response);
}

export async function completeBusinessSetup(organizationId: string, name: string): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/business', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      name,
    }),
  });

  return readOnboardingState(response);
}
