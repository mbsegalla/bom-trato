'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';

import { bootstrapOnboarding, getOnboarding } from '../../services/onboarding.service';
import type { OnboardingState } from '../../types/onboarding.types';
import { OnboardingContentSkeleton } from '../onboardingContentSkeleton';
import { OnboardingProgress } from './components/onboardingProgress';
import { OnboardingStepContent } from './components/onboardingStepContent';

export function OnboardingContent() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    void bootstrapOnboarding()
      .then((result) => {
        if (active) {
          setState(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível preparar sua conta.');
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function refreshOnboarding(): Promise<void> {
    if (!state?.organizationId || refreshing) return;

    setRefreshing(true);
    setError(null);

    try {
      setState(await getOnboarding(state.organizationId));
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar sua conta.');
    } finally {
      setRefreshing(false);
    }
  }

  if (!state && !error) return <OnboardingContentSkeleton />;

  if (!state) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-7">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Não conseguimos continuar</h1>
        <p role="alert" className="mt-4 text-sm leading-relaxed text-destructive">
          {error}
        </p>
        <Button
          type="button"
          className="mt-6 min-h-12 cursor-pointer rounded-xl"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <OnboardingProgress step={state.step} />
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <OnboardingStepContent
          state={state}
          refreshing={refreshing}
          onStateChange={setState}
          onRefresh={() => void refreshOnboarding()}
        />
      </section>
    </div>
  );
}
