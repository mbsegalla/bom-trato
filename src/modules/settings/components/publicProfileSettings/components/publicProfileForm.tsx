'use client';

import { ExternalLink, Globe2, LoaderCircle, MapPin, MessageCircle, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CatalogService } from '@/modules/serviceCatalog/types/catalogService.types';
import { formatBrazilianPhone, formatBrazilianPhoneInput } from '@/shared/formatters/phone.formatter';

import type { PublicProfileInput, PublicProfileSettings } from '../../../../publicProfiles/types/publicProfile.types';

interface PublicProfileFormProps {
  profile: PublicProfileSettings;
  services: CatalogService[];
  owner: boolean;
  saving: boolean;
  error: string | null;
  feedback: string | null;
  onSave(input: PublicProfileInput): void;
}

function slugInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/g, '')
    .slice(0, 120);
}

export function PublicProfileForm({
  profile,
  services,
  owner,
  saving,
  error,
  feedback,
  onSave,
}: PublicProfileFormProps) {
  const [slug, setSlug] = useState(profile.slug);
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [description, setDescription] = useState(profile.description ?? '');
  const [whatsappPhone, setWhatsappPhone] = useState(formatBrazilianPhone(profile.whatsappPhone));
  const [whatsappEnabled, setWhatsappEnabled] = useState(profile.whatsappEnabled);
  const [published, setPublished] = useState(profile.published);
  const [selectedServiceIds, setSelectedServiceIds] = useState(() => new Set(profile.selectedServiceIds));

  const hasLocation = Boolean(profile.city) && Boolean(profile.state);

  function toggleService(serviceId: string, checked: boolean): void {
    setSelectedServiceIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }

      return next;
    });
  }

  function submit(): void {
    onSave({
      slug,
      headline: headline.trim() || null,
      description: description.trim() || null,
      whatsappPhone: whatsappPhone.trim() || null,
      whatsappEnabled,
      published,
      serviceIds: [...selectedServiceIds],
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Store className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold">Sua vitrine</h2>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Escolha como seu negócio aparecerá publicamente no Bom Trato.
            </p>
          </div>
        </div>

        {!owner && (
          <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            Somente o administrador pode alterar a vitrine.
          </div>
        )}

        {feedback && <div className="mt-6 rounded-xl bg-success-surface p-4 text-sm text-success">{feedback}</div>}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <fieldset disabled={!owner || saving} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="public-profile-slug">Endereço público</Label>

            <div className="flex h-12 overflow-hidden rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex items-center bg-muted/50 px-3 text-sm text-muted-foreground">/profissionais/</span>

              <input
                id="public-profile-slug"
                value={slug}
                maxLength={120}
                onChange={(event) => setSlug(slugInput(event.currentTarget.value))}
                className="min-w-0 flex-1 bg-transparent px-3 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-profile-headline">Destaque</Label>

            <Input
              id="public-profile-headline"
              value={headline}
              maxLength={160}
              onChange={(event) => setHeadline(event.currentTarget.value)}
              placeholder="Ex.: Instalações elétricas e manutenção residencial"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-profile-description">Sobre seu trabalho</Label>

            <Textarea
              id="public-profile-description"
              value={description}
              maxLength={3000}
              onChange={(event) => setDescription(event.currentTarget.value)}
              placeholder="Conte um pouco sobre seu trabalho, experiência e região de atendimento."
              className="min-h-36 rounded-xl"
            />
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-primary" />

              <div>
                <p className="font-medium">Localização pública</p>

                {hasLocation ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.city} - {profile.state}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-destructive">
                    Informe cidade e estado na aba Negócio antes de publicar.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;

                  setWhatsappEnabled(checked);

                  if (!checked) {
                    setPublished(false);
                  }
                }}
                className="mt-1 size-4 accent-primary"
              />

              <span>
                <span className="flex items-center gap-2 font-medium">
                  <MessageCircle className="size-4" />
                  Permitir contato pelo WhatsApp
                </span>

                <span className="mt-1 block text-sm text-muted-foreground">
                  Seu número não será exibido diretamente na página pública.
                </span>
              </span>
            </label>

            {whatsappEnabled && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="public-whatsapp">Número para contato</Label>

                <Input
                  id="public-whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={whatsappPhone}
                  maxLength={15}
                  onChange={(event) => setWhatsappPhone(formatBrazilianPhoneInput(event.currentTarget.value))}
                  placeholder="(34) 99999-9999"
                  className="h-12 rounded-xl"
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium">Serviços exibidos</h3>

            <p className="mt-1 text-sm text-muted-foreground">Selecione até 20 serviços ativos do seu catálogo.</p>

            {services.length === 0 ? (
              <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Você ainda não possui serviços ativos no catálogo.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(service.id)}
                      onChange={(event) => toggleService(service.id, event.currentTarget.checked)}
                      className="mt-1 size-4 accent-primary"
                    />

                    <span className="min-w-0">
                      <span className="block font-medium">{service.name}</span>

                      {service.description && (
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                          {service.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={published}
                disabled={(!published && (!hasLocation || !whatsappEnabled)) || saving}
                onChange={(event) => setPublished(event.currentTarget.checked)}
                className="mt-1 size-4 accent-primary"
              />

              <span>
                <span className="flex items-center gap-2 font-medium">
                  <Globe2 className="size-4" />
                  Publicar minha vitrine
                </span>

                <span className="mt-1 block text-sm text-muted-foreground">
                  Ao publicar, nome do negócio, logo, cidade, estado e serviços selecionados ficarão públicos.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            {profile.published && (
              <Link
                href={`/profissionais/${profile.slug}`}
                target="_blank"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium"
              >
                <ExternalLink className="size-4" />
                Ver perfil
              </Link>
            )}

            <Button type="button" disabled={saving} onClick={submit} className="min-h-11 cursor-pointer rounded-xl">
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              Salvar vitrine
            </Button>
          </div>
        </fieldset>
      </section>
    </div>
  );
}
