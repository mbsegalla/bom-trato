'use client';

import { CircleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { publicProfileFormSchema } from '@/modules/publicProfiles/schemas/publicProfile.schema';
import { getPublicProfileSettings, updatePublicProfile } from '@/modules/publicProfiles/services/publicProfile.service';
import type {
  PublicProfileInput,
  PublicProfileSettings as Profile,
} from '@/modules/publicProfiles/types/publicProfile.types';
import { listCatalogServices } from '@/modules/serviceCatalog/services/catalogService.service';
import type { CatalogService } from '@/modules/serviceCatalog/types/catalogService.types';

import { PublicProfileForm } from './components/publicProfileForm';

interface State {
  profile: Profile;
  services: CatalogService[];
}

export function PublicProfileSettings() {
  const { activeOrganization } = useApp();

  return (
    <OrganizationPublicProfileSettings
      key={activeOrganization.id}
      organizationId={activeOrganization.id}
      owner={activeOrganization.role === 'OWNER'}
    />
  );
}

function OrganizationPublicProfileSettings({ organizationId, owner }: { organizationId: string; owner: boolean }) {
  const router = useRouter();

  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getPublicProfileSettings(organizationId),
      listCatalogServices(organizationId, {
        page: 1,
        limit: 100,
        status: 'ACTIVE',
      }),
    ])
      .then(([profile, services]) => {
        if (!active) {
          return;
        }

        setState({
          profile,
          services: services.items,
        });

        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setLoadError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua vitrine.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, router]);

  async function save(input: PublicProfileInput): Promise<void> {
    if (!owner || saving) {
      return;
    }

    const parsed = publicProfileFormSchema.safeParse(input);

    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? 'Confira os dados da vitrine.');

      return;
    }

    setSaving(true);
    setSaveError(null);
    setFeedback(null);

    try {
      const updated = await updatePublicProfile(organizationId, parsed.data);

      setState((current) =>
        current
          ? {
              ...current,
              profile: updated,
            }
          : current,
      );

      setFeedback(updated.published ? 'Sua vitrine está publicada.' : 'Vitrine atualizada com sucesso.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setSaveError(cause instanceof Error ? cause.message : 'Não foi possível salvar sua vitrine.');
    } finally {
      setSaving(false);
    }
  }

  if (!state && !loadError) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!state && loadError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CircleAlert className="mx-auto size-7 text-destructive" />

        <p className="mt-4 text-sm text-destructive">{loadError}</p>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-5 cursor-pointer"
        >
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (!state) {
    return null;
  }

  const profileKey = JSON.stringify(state.profile);

  return (
    <PublicProfileForm
      key={profileKey}
      profile={state.profile}
      services={state.services}
      owner={owner}
      saving={saving}
      error={saveError}
      feedback={feedback}
      onSave={(input) => void save(input)}
    />
  );
}
