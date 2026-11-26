import { LoaderCircle, ReceiptText, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionError } from '@/modules/auth/services/session.service';

import { pixKeyTypeSchema, receivingSettingsFormSchema } from '../../../schemas/receivingSettings.schema';
import { saveReceivingSettings } from '../../../services/receivingSettings.service';
import type { PixKeyType, ReceivingSettingsView } from '../../../types/receivingSettings.types';

const keyTypes = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'EVP', label: 'Chave aleatória' },
] satisfies { value: PixKeyType; label: string }[];

const keyPlaceholders: Record<PixKeyType, string> = {
  CPF: '11 dígitos',
  CNPJ: '14 caracteres',
  PHONE: '+55 seguido de DDD e número',
  EMAIL: 'E-mail cadastrado no banco',
  EVP: 'Chave aleatória cadastrada no banco',
};

interface ReceivingSettingsFormProps {
  organizationId: string;
  settings: ReceivingSettingsView;
  switchingOrganization: boolean;
  onReload: () => void;
  onSaved: (settings: ReceivingSettingsView) => void;
}

export function ReceivingSettingsForm({
  organizationId,
  settings,
  switchingOrganization,
  onReload,
  onSaved,
}: ReceivingSettingsFormProps) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const [pixEnabled, setPixEnabled] = useState(settings.pixEnabled);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(settings.pixKeyType ?? 'EVP');
  const [pixKey, setPixKey] = useState(settings.pixKey ?? '');
  const [merchantName, setMerchantName] = useState(settings.merchantName ?? '');
  const [merchantCity, setMerchantCity] = useState(settings.merchantCity ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const disabled = !settings.canConfigure || saving || switchingOrganization || needsReload;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (disabled || submittingRef.current) {
      return;
    }

    const parsed = receivingSettingsFormSchema.safeParse(
      pixEnabled
        ? { pixEnabled, pixKeyType, pixKey, merchantName, merchantCity, confirmed, version: settings.version }
        : {
            pixEnabled: false,
            pixKeyType: null,
            pixKey: null,
            merchantName: null,
            merchantCity: null,
            confirmed: false,
            version: settings.version,
          },
    );

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados de recebimento.');
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = await saveReceivingSettings(organizationId, parsed.data);

      if (!mountedRef.current) {
        return;
      }

      if (result.version !== settings.version + 1 || result.pixEnabled !== pixEnabled) {
        setNeedsReload(true);
        throw new Error('Não foi possível confirmar os dados salvos. Atualize a configuração.');
      }

      toast.success(pixEnabled ? 'Dados de recebimento salvos.' : 'Dados Pix removidos.');
      onSaved(result);
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError) {
        if (cause.status === 401) {
          router.replace('/login');
          return;
        }

        if (cause.status === 409) {
          setNeedsReload(true);
        }
      }

      setConfirmed(false);
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os dados de recebimento.');
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <ReceiptText aria-hidden="true" className="size-5" />
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold">Dados de recebimento</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Configure a chave Pix do seu negócio para receber de clientes. Esta conta não é o meio de pagamento da
              assinatura do Bom Trato.
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" disabled={saving || switchingOrganization} onClick={onReload} className="cursor-pointer">
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar
        </Button>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />

        <div>
          <p className="text-sm font-medium">{settings.pixEnabled ? 'Destino Pix cadastrado' : 'Nenhum destino Pix cadastrado'}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            A chave é armazenada de forma criptografada. O cadastro não confirma a titularidade no banco e ainda não
            gera cobranças ou pagamentos.
          </p>
        </div>
      </div>

      {!settings.encryptionAvailable && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          O recurso de recebimentos ainda não está habilitado na API. Contate o administrador da plataforma.
        </p>
      )}

      {settings.encryptionAvailable && !settings.canConfigure && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Os dados estão disponíveis apenas para consulta.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <label className="flex min-h-10 items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={pixEnabled}
            disabled={disabled}
            onChange={(event) => {
              setPixEnabled(event.currentTarget.checked);
              setConfirmed(false);
            }}
            className="size-4 accent-primary"
          />
          Cadastrar destino Pix
        </label>

        {pixEnabled ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="receiving-pix-type">Tipo de chave</Label>
                <Select
                  items={keyTypes}
                  value={pixKeyType}
                  disabled={disabled}
                  onValueChange={(value) => {
                    const parsed = pixKeyTypeSchema.safeParse(value);

                    if (parsed.success && parsed.data !== pixKeyType) {
                      setPixKeyType(parsed.data);
                      setPixKey('');
                      setConfirmed(false);
                    }
                  }}
                >
                  <SelectTrigger id="receiving-pix-type" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {keyTypes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiving-pix-key">Chave Pix</Label>
                <Input
                  id="receiving-pix-key"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={pixKey}
                  disabled={disabled}
                  maxLength={150}
                  placeholder={keyPlaceholders[pixKeyType]}
                  onChange={(event) => {
                    setPixKey(event.currentTarget.value);
                    setConfirmed(false);
                  }}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiving-merchant-name">Nome exibido do recebedor</Label>
                <Input
                  id="receiving-merchant-name"
                  value={merchantName}
                  disabled={disabled}
                  maxLength={25}
                  onChange={(event) => {
                    setMerchantName(event.currentTarget.value);
                    setConfirmed(false);
                  }}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Até 25 caracteres; use o nome reconhecível da conta.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiving-merchant-city">Cidade do recebedor</Label>
                <Input
                  id="receiving-merchant-city"
                  value={merchantCity}
                  disabled={disabled}
                  maxLength={15}
                  onChange={(event) => {
                    setMerchantCity(event.currentTarget.value);
                    setConfirmed(false);
                  }}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Até 15 caracteres.</p>
              </div>
            </div>

            <label className="mt-5 flex min-h-10 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={disabled}
                onChange={(event) => setConfirmed(event.currentTarget.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              Confirmei no meu banco que a chave pertence à conta que desejo usar para receber dos clientes.
            </label>
          </>
        ) : (
          settings.pixEnabled && (
            <p className="mt-3 text-sm text-destructive">
              Ao salvar, a chave e os dados do recebedor serão removidos da configuração.
            </p>
          )
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {settings.canConfigure && (
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={disabled || (pixEnabled && !confirmed) || (!pixEnabled && !settings.pixEnabled)}
              className="min-h-11 cursor-pointer rounded-xl px-5"
            >
              {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {pixEnabled ? 'Salvar dados de recebimento' : 'Remover dados Pix'}
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
