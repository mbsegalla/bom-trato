'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getCurrentUser, SessionError } from '@/modules/auth/services/session.service';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { TrialBanner } from '@/modules/onboarding/components/trialBanner';
import { getOnboardingHref, hasActiveTrial } from '@/modules/onboarding/helpers/trial.helper';
import { getOnboarding } from '@/modules/onboarding/services/onboarding.service';
import type { OnboardingState } from '@/modules/onboarding/types/onboarding.types';
import {
  getStoredActiveOrganizationId,
  storeActiveOrganizationId,
} from '@/modules/organizations/services/activeOrganization.storage';
import { listJoinedOrganizations } from '@/modules/organizations/services/organization.service';
import type { JoinedOrganization } from '@/modules/organizations/types/organization.types';

import { AppBootstrapSkeleton } from './appBootstrapSkeleton';
import { AppShell } from './appShell';

const TRIAL_REVALIDATION_INTERVAL_MS = 60_000;

type ActiveOrganizationPatch = Partial<Pick<JoinedOrganization, 'name' | 'logoUrl'>>;

interface AppContextValue {
  user: AuthUser;
  organizations: JoinedOrganization[];
  activeOrganization: JoinedOrganization;
  onboarding: OnboardingState;
  switchingOrganization: boolean;
  switchOrganization(organizationId: string): Promise<void>;
  updateActiveOrganization(patch: ActiveOrganizationPatch): void;
}

interface AvailableOrganization {
  organization: JoinedOrganization;
  onboarding: OnboardingState;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

async function findAvailableOrganization(organizations: JoinedOrganization[]): Promise<AvailableOrganization | null> {
  for (const organization of organizations) {
    const onboarding = await getOnboarding(organization.id);

    if (onboarding.step === 'APP') {
      return {
        organization,
        onboarding,
      };
    }
  }

  return null;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider.');
  }

  return context;
}

export function AppProvider({ children }: AppProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<JoinedOrganization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<JoinedOrganization | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [switchingOrganization, setSwitchingOrganization] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOrganizationId = activeOrganization?.id;
  const trialActive = onboarding !== null && hasActiveTrial(onboarding);

  useEffect(() => {
    let active = true;

    async function bootstrap(): Promise<void> {
      try {
        const [currentUser, joinedOrganizations] = await Promise.all([getCurrentUser(), listJoinedOrganizations()]);

        if (!active) {
          return;
        }

        if (joinedOrganizations.length === 0) {
          router.replace('/onboarding');

          return;
        }

        const storedOrganizationId = getStoredActiveOrganizationId();

        const preferredOrganization =
          joinedOrganizations.find((organization) => organization.id === storedOrganizationId) ??
          joinedOrganizations[0];

        const candidates = [
          preferredOrganization,
          ...joinedOrganizations.filter((organization) => organization.id !== preferredOrganization.id),
        ];

        const available = await findAvailableOrganization(candidates);

        if (!active) {
          return;
        }

        if (available === null) {
          router.replace(getOnboardingHref(preferredOrganization.id));

          return;
        }

        storeActiveOrganizationId(available.organization.id);

        setUser(currentUser);
        setOrganizations(joinedOrganizations);
        setActiveOrganization(available.organization);
        setOnboarding(available.onboarding);
      } catch (cause: unknown) {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível preparar sua área de trabalho.');
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!activeOrganizationId || !trialActive || switchingOrganization) {
      return;
    }

    const organizationId = activeOrganizationId;

    let active = true;
    let checking = false;

    async function revalidate(): Promise<void> {
      if (!active || checking) {
        return;
      }

      checking = true;

      try {
        const state = await getOnboarding(organizationId);

        if (!active) {
          return;
        }

        setOnboarding(state);

        if (state.step !== 'APP') {
          router.replace(getOnboardingHref(organizationId));
        }
      } catch (cause: unknown) {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
        }
      } finally {
        checking = false;
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void revalidate();
      }
    }

    const interval = window.setInterval(() => {
      void revalidate();
    }, TRIAL_REVALIDATION_INTERVAL_MS);

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;

      window.clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeOrganizationId, router, switchingOrganization, trialActive]);

  async function switchOrganization(organizationId: string): Promise<void> {
    if (switchingOrganization || activeOrganization?.id === organizationId) {
      return;
    }

    const organization = organizations.find((item) => item.id === organizationId);

    if (!organization) {
      return;
    }

    setSwitchingOrganization(true);

    try {
      const state = await getOnboarding(organization.id);

      storeActiveOrganizationId(organization.id);

      if (state.step !== 'APP') {
        router.replace(getOnboardingHref(organization.id));

        return;
      }

      setActiveOrganization(organization);
      setOnboarding(state);

      router.replace('/dashboard');
    } finally {
      setSwitchingOrganization(false);
    }
  }

  function updateActiveOrganization(patch: ActiveOrganizationPatch): void {
    if (!activeOrganization) {
      return;
    }

    const organizationId = activeOrganization.id;

    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === organizationId
          ? {
              ...organization,
              ...patch,
            }
          : organization,
      ),
    );

    setActiveOrganization((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current,
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Não conseguimos carregar sua conta</h1>

          <p role="alert" className="mt-4 text-sm leading-relaxed text-destructive">
            {error}
          </p>

          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 cursor-pointer rounded-xl"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!user || !activeOrganization || !onboarding || onboarding.step !== 'APP') {
    return <AppBootstrapSkeleton />;
  }

  const banner =
    trialActive && onboarding.trial ? (
      <TrialBanner
        trial={onboarding.trial}
        organizationId={activeOrganization.id}
        owner={activeOrganization.role === 'OWNER'}
      />
    ) : null;

  return (
    <AppContext.Provider
      value={{
        user,
        organizations,
        activeOrganization,
        onboarding,
        switchingOrganization,
        switchOrganization,
        updateActiveOrganization,
      }}
    >
      <AppShell banner={banner}>{children}</AppShell>
    </AppContext.Provider>
  );
}
