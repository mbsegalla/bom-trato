'use client';

import { CircleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import { businessProfileFormSchema } from '../../schemas/business.schema';
import { getBusinessProfile, updateBusinessProfile } from '../../services/business.service';
import type { BusinessProfile } from '../../types/business.types';
import { BusinessSettingsSkeleton } from '../businessSettingsSkeleton';
import { BusinessProfileForm } from './components/businessProfileForm';

interface BusinessState {
  requestKey: string;
  data: BusinessProfile;
}

interface BusinessErrorState {
  requestKey: string;
  message: string;
}

export function BusinessSettings() {
  const { activeOrganization, updateActiveOrganizationName } = useApp();

  return (
    <OrganizationBusinessSettings
      key={activeOrganization.id}
      organizationId={activeOrganization.id}
      owner={activeOrganization.role === 'OWNER'}
      onOrganizationNameChanged={updateActiveOrganizationName}
    />
  );
}

function OrganizationBusinessSettings({
  organizationId,
  owner,
  onOrganizationNameChanged,
}: {
  organizationId: string;
  owner: boolean;
  onOrganizationNameChanged(name: string): void;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<BusinessState | null>(null);
  const [errorState, setErrorState] = useState<BusinessErrorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const requestKey = `${organizationId}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void getBusinessProfile(organizationId)
      .then((profile) => {
        if (!active) return;

        setErrorState(null);
        setState({ requestKey, data: profile });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar os dados do negócio.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, requestKey, router]);

  const profile = state?.data ?? null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;
  const refreshing = state !== null && state.requestKey !== requestKey;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!owner || submittingRef.current) return;

    const formData = new FormData(event.currentTarget);
    const parsed = businessProfileFormSchema.safeParse({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      documentType: String(formData.get('documentType') ?? ''),
      document: String(formData.get('document') ?? ''),
      addressLine1: String(formData.get('addressLine1') ?? ''),
      addressLine2: String(formData.get('addressLine2') ?? ''),
      city: String(formData.get('city') ?? ''),
      state: String(formData.get('state') ?? ''),
      postalCode: String(formData.get('postalCode') ?? ''),
    });

    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.');
      return;
    }

    submittingRef.current = true;

    setSaving(true);
    setSaveError(null);
    setFeedback(null);

    try {
      const updated = await updateBusinessProfile(organizationId, parsed.data);

      setState({ requestKey, data: updated });
      onOrganizationNameChanged(updated.name);
      setFeedback('Dados do negócio atualizados com sucesso.');
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }
      setSaveError(cause instanceof Error ? cause.message : 'Não foi possível salvar os dados do negócio.');
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  if (!profile && !error) return <BusinessSettingsSkeleton />;

  if (!profile && error) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CircleAlert aria-hidden="true" className="mx-auto size-7 text-destructive" />
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRefreshVersion((value) => value + 1)}
          className="mt-5 cursor-pointer"
        >
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (!profile) return null;

  const profileKey = JSON.stringify([
    profile.id,
    profile.name,
    profile.email,
    profile.phone,
    profile.documentType,
    profile.document,
    profile.addressLine1,
    profile.addressLine2,
    profile.city,
    profile.state,
    profile.postalCode,
  ]);

  return (
    <BusinessProfileForm
      key={`${organizationId}:${profileKey}`}
      profile={profile}
      owner={owner}
      saving={saving}
      refreshing={refreshing}
      feedback={feedback}
      saveError={saveError}
      onSubmit={handleSubmit}
    />
  );
}
