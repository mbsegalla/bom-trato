'use client';

import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getCurrentUser, SessionError } from '@/modules/auth/services/session.service';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { getOnboarding } from '@/modules/onboarding/services/onboarding.service';
import {
  getStoredActiveOrganizationId,
  storeActiveOrganizationId,
} from '@/modules/organizations/services/activeOrganization.storage';
import { listJoinedOrganizations } from '@/modules/organizations/services/organization.service';
import type { JoinedOrganization } from '@/modules/organizations/types/organization.types';

import { AppBootstrapSkeleton } from './appBootstrapSkeleton';
import { AppShell } from './appShell';

const ACTIVE_ORGANIZATION_KEY = 'bom-trato:active-organization';

interface AppContextValue {
  user: AuthUser;
  organizations: JoinedOrganization[];
  activeOrganization: JoinedOrganization;
  switchingOrganization: boolean;
  switchOrganization(organizationId: string): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
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
  const [switchingOrganization, setSwitchingOrganization] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        let availableOrganization: JoinedOrganization | null = null;

        for (const organization of candidates) {
          const onboarding = await getOnboarding(organization.id);

          if (onboarding.step === 'APP') {
            availableOrganization = organization;
            break;
          }
        }

        if (!active) {
          return;
        }

        if (availableOrganization === null) {
          router.replace('/onboarding');
          return;
        }

        storeActiveOrganizationId(availableOrganization.id);

        setUser(currentUser);
        setOrganizations(joinedOrganizations);
        setActiveOrganization(availableOrganization);
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
      const onboarding = await getOnboarding(organization.id);

      if (onboarding.step !== 'APP') {
        router.replace('/onboarding');
        return;
      }

      window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organization.id);

      setActiveOrganization(organization);

      router.replace('/dashboard');
    } finally {
      setSwitchingOrganization(false);
    }
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

  if (!user || !activeOrganization) {
    return <AppBootstrapSkeleton />;
  }

  return (
    <AppContext.Provider
      value={{
        user,
        organizations,
        activeOrganization,
        switchingOrganization,
        switchOrganization,
      }}
    >
      <AppShell>{children}</AppShell>
    </AppContext.Provider>
  );
}
