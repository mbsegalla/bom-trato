'use client';

import { Building2, CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import { businessProfileFormSchema } from '../schemas/business.schema';
import { getBusinessProfile, updateBusinessProfile } from '../services/business.service';
import type { BusinessProfile, OrganizationDocumentType } from '../types/business.types';
import { BusinessSettingsSkeleton } from './businessSettingsSkeleton';

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
        if (!active) {
          return;
        }

        setErrorState(null);

        setState({
          requestKey,
          data: profile,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

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

    if (!owner || submittingRef.current) {
      return;
    }

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

      setState({
        requestKey,
        data: updated,
      });

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

  if (!profile && !error) {
    return <BusinessSettingsSkeleton />;
  }

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

  if (!profile) {
    return null;
  }

  return (
    <BusinessProfileForm
      key={`${organizationId}:${profile.id}:${profile.documentType ?? 'none'}:${profile.document ?? 'none'}`}
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

function BusinessProfileForm({
  profile,
  owner,
  saving,
  refreshing,
  feedback,
  saveError,
  onSubmit,
}: {
  profile: BusinessProfile;
  owner: boolean;
  saving: boolean;
  refreshing: boolean;
  feedback: string | null;
  saveError: string | null;
  onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']>;
}) {
  const [documentType, setDocumentType] = useState<OrganizationDocumentType | ''>(profile.documentType ?? '');
  const [documentValue, setDocumentValue] = useState(formatDocument(profile.documentType, profile.document));

  function changeDocumentType(nextType: OrganizationDocumentType | ''): void {
    setDocumentType(nextType);
    setDocumentValue('');
  }

  return (
    <form onSubmit={onSubmit} aria-busy={saving || refreshing}>
      <section
        className={
          refreshing
            ? 'rounded-2xl border border-border bg-card p-6 opacity-70 shadow-sm transition-opacity'
            : 'rounded-2xl border border-border bg-card p-6 shadow-sm transition-opacity'
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Building2 aria-hidden="true" className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold">Dados do negócio</h2>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Informações utilizadas para identificar seu negócio no Bom Trato.
            </p>
          </div>
        </div>

        {!owner && (
          <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            Somente o administrador do negócio pode alterar estas informações.
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className="mt-6 flex items-start gap-2 rounded-xl bg-success-surface p-4 text-sm text-success"
          >
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {feedback}
          </div>
        )}

        {saveError && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {saveError}
          </p>
        )}

        <fieldset disabled={saving} className="mt-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-name">Nome do negócio *</Label>

              <Input
                id="business-name"
                name="name"
                defaultValue={profile.name}
                readOnly={!owner}
                maxLength={100}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email">E-mail comercial</Label>

              <Input
                id="business-email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile.email ?? ''}
                readOnly={!owner}
                maxLength={254}
                placeholder="contato@empresa.com"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-phone">Telefone</Label>

              <Input
                id="business-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={profile.phone ?? ''}
                readOnly={!owner}
                maxLength={30}
                placeholder="(34) 99999-9999"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-document-type">Tipo de documento</Label>

              <select
                id="business-document-type"
                name="documentType"
                value={documentType}
                disabled={!owner || saving}
                onChange={(event) => changeDocumentType(event.currentTarget.value as OrganizationDocumentType | '')}
                className="h-12 w-full rounded-xl border border-input bg-transparent px-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
              >
                <option value="">Não informado</option>

                <option value="CPF">CPF</option>

                <option value="CNPJ">CNPJ</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-document">
                {documentType === 'CPF' ? 'CPF' : documentType === 'CNPJ' ? 'CNPJ' : 'Documento'}
              </Label>

              <Input
                id="business-document"
                name="document"
                inputMode="numeric"
                value={documentValue}
                readOnly={!owner || documentType === ''}
                maxLength={documentType === 'CPF' ? 14 : 18}
                placeholder={
                  documentType === 'CPF'
                    ? '000.000.000-00'
                    : documentType === 'CNPJ'
                      ? '00.000.000/0000-00'
                      : 'Selecione o tipo'
                }
                onChange={(event) => setDocumentValue(formatDocumentInput(documentType, event.currentTarget.value))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-address-line-1">Endereço</Label>

              <Input
                id="business-address-line-1"
                name="addressLine1"
                autoComplete="street-address"
                defaultValue={profile.addressLine1 ?? ''}
                readOnly={!owner}
                maxLength={150}
                placeholder="Rua, avenida, número"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-address-line-2">Complemento</Label>

              <Input
                id="business-address-line-2"
                name="addressLine2"
                defaultValue={profile.addressLine2 ?? ''}
                readOnly={!owner}
                maxLength={100}
                placeholder="Sala, bloco, referência"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-city">Cidade</Label>

              <Input
                id="business-city"
                name="city"
                autoComplete="address-level2"
                defaultValue={profile.city ?? ''}
                readOnly={!owner}
                maxLength={100}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-state">Estado</Label>

              <Input
                id="business-state"
                name="state"
                autoComplete="address-level1"
                defaultValue={profile.state ?? ''}
                readOnly={!owner}
                maxLength={2}
                placeholder="MG"
                className="h-12 rounded-xl uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-postal-code">CEP</Label>

              <Input
                id="business-postal-code"
                name="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                defaultValue={formatPostalCode(profile.postalCode)}
                readOnly={!owner}
                maxLength={9}
                placeholder="00000-000"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {owner && (
            <div className="mt-8 flex justify-end">
              <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-xl px-5">
                {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          )}
        </fieldset>
      </section>
    </form>
  );
}

function formatDocument(type: OrganizationDocumentType | null, value: string | null): string {
  if (!value || !type) {
    return '';
  }

  return formatDocumentInput(type, value);
}

function formatDocumentInput(type: OrganizationDocumentType | '', value: string): string {
  const digits = value.replace(/\D/g, '');

  if (type === 'CPF') {
    return digits
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  if (type === 'CNPJ') {
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return '';
}

function formatPostalCode(value: string | null): string {
  if (!value) {
    return '';
  }

  return value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}
