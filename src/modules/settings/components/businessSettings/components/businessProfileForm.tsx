import { Building2, CircleCheck, LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { BusinessProfile, OrganizationDocumentType } from '../../../types/business.types';
import {
  formatBusinessDocument,
  formatBusinessDocumentInput,
  formatBusinessPostalCode,
} from '../helpers/businessProfileFormatters';

interface BusinessProfileFormProps {
  profile: BusinessProfile;
  owner: boolean;
  saving: boolean;
  refreshing: boolean;
  feedback: string | null;
  saveError: string | null;
  onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']>;
}

export function BusinessProfileForm({
  profile,
  owner,
  saving,
  refreshing,
  feedback,
  saveError,
  onSubmit,
}: BusinessProfileFormProps) {
  const [documentType, setDocumentType] = useState<OrganizationDocumentType | ''>(profile.documentType ?? '');
  const [documentValue, setDocumentValue] = useState(formatBusinessDocument(profile.documentType, profile.document));

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
                onChange={(event) =>
                  setDocumentValue(formatBusinessDocumentInput(documentType, event.currentTarget.value))
                }
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
                defaultValue={formatBusinessPostalCode(profile.postalCode)}
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
