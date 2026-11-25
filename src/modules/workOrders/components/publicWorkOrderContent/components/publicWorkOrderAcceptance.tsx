'use client';

import { Check, CircleCheck, ClipboardCheck, RefreshCw } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { workOrderAcceptanceFormSchema } from '../../../schemas/workOrderAcceptance.schema';
import { acceptPublicWorkOrder, PublicWorkOrderAcceptanceError } from '../../../services/workOrderAcceptance.service';
import type { WorkOrderStatus } from '../../../types/workOrder.types';
import type {
  PublicWorkOrderAcceptance,
  PublicWorkOrderAcceptanceReceipt,
  WorkOrderAcceptanceInput,
} from '../../../types/workOrderAcceptance.types';

interface PublicWorkOrderAcceptanceSectionProps {
  acceptance: PublicWorkOrderAcceptance | null;
  status: WorkOrderStatus;
  token: string;
  onAccepted(receipt: PublicWorkOrderAcceptanceReceipt): void;
}

type FieldErrors = Partial<Record<keyof WorkOrderAcceptanceInput, string>>;

export function PublicWorkOrderAcceptanceSection({
  acceptance,
  status,
  token,
  onAccepted,
}: PublicWorkOrderAcceptanceSectionProps) {
  const id = useId();
  const activeRef = useRef(true);
  const pendingRef = useRef(false);
  const [signerName, setSignerName] = useState('');
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmation, setConfirmation] = useState<WorkOrderAcceptanceInput | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshRequired, setRefreshRequired] = useState(false);

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  const canAccept =
    status === 'COMPLETED' && acceptance?.canAccept && acceptance.snapshotHash !== null && acceptance.receipt === null;

  function isCurrentToken(): boolean {
    return new URLSearchParams(window.location.hash.slice(1)).get('token') === token;
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();

    if (!canAccept || pendingRef.current || refreshRequired || confirmation !== null || !isCurrentToken()) {
      return;
    }

    const parsed = workOrderAcceptanceFormSchema.safeParse({ signerName, consent });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({ signerName: errors.signerName?.[0], consent: errors.consent?.[0] });

      return;
    }

    setFieldErrors({});
    setError(null);
    setConfirmation(parsed.data);
  };

  async function confirmAcceptance(): Promise<void> {
    if (
      !canAccept ||
      !acceptance?.snapshotHash ||
      !confirmation ||
      pendingRef.current ||
      refreshRequired ||
      !isCurrentToken()
    ) {
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError(null);

    try {
      const receipt = await acceptPublicWorkOrder(
        token,
        acceptance.snapshotHash,
        acceptance.consentVersion,
        confirmation,
      );

      if (!activeRef.current || !isCurrentToken()) {
        return;
      }

      setConfirmation(null);
      onAccepted(receipt);
    } catch (cause: unknown) {
      if (!activeRef.current || !isCurrentToken()) {
        return;
      }

      setConfirmation(null);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível confirmar o aceite. Atualize o atendimento para consultar o resultado.',
      );
      setRefreshRequired(cause instanceof PublicWorkOrderAcceptanceError ? cause.refreshRequired : true);
    } finally {
      pendingRef.current = false;

      if (activeRef.current && isCurrentToken()) {
        setPending(false);
      }
    }
  }

  if (acceptance === null || (status !== 'COMPLETED' && acceptance.receipt === null)) {
    return null;
  }

  if (acceptance.receipt !== null) {
    return (
      <section
        aria-labelledby={`${id}-title`}
        className="mt-6 rounded-3xl border border-success/20 bg-success-surface/40 p-5 sm:p-7"
      >
        <div role="status" className="flex items-start gap-3">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-success" />

          <div>
            <h2 id={`${id}-title`} className="font-heading text-xl font-semibold">
              Aceite da conclusão registrado
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A confirmação da conclusão deste atendimento está registrada e pode ser consultada pela empresa.
            </p>

            <p className="mt-4 text-sm font-medium">
              Aceite em{' '}
              <time dateTime={acceptance.receipt.acceptedAt.toISOString()}>
                {formatDateTime(acceptance.receipt.acceptedAt)}
              </time>
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Serviço concluído em {formatDateTime(acceptance.receipt.completedAt)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-title`} className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardCheck aria-hidden="true" className="size-5" />
        </div>

        <h2 id={`${id}-title`} className="font-heading text-xl font-semibold">
          Aceite da conclusão
        </h2>
      </div>

      {canAccept ? (
        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Após conferir os serviços descritos neste atendimento, informe seu nome para registrar o aceite da
            conclusão.
          </p>

          <fieldset disabled={pending || refreshRequired || confirmation !== null} className="mt-6 space-y-5">
            <div className="max-w-xl space-y-2">
              <Label htmlFor={`${id}-name`}>Seu nome completo *</Label>

              <Input
                id={`${id}-name`}
                name="signerName"
                autoComplete="name"
                value={signerName}
                onChange={(event) => setSignerName(event.currentTarget.value)}
                maxLength={100}
                required
                aria-invalid={Boolean(fieldErrors.signerName)}
                aria-describedby={fieldErrors.signerName ? `${id}-name-error ${id}-help` : `${id}-help`}
                className="h-12"
              />

              {fieldErrors.signerName && (
                <p id={`${id}-name-error`} role="alert" className="text-sm text-destructive">
                  {fieldErrors.signerName}
                </p>
              )}

              <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">
                Seu nome e a data serão registrados para consulta da empresa.
              </p>
            </div>

            <div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <input
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(event) => setConsent(event.currentTarget.checked)}
                  required
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? `${id}-consent-error` : undefined}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />

                <span className="text-sm leading-relaxed">{acceptance.consentText}</span>
              </label>

              {fieldErrors.consent && (
                <p id={`${id}-consent-error`} role="alert" className="mt-2 text-sm text-destructive">
                  {fieldErrors.consent}
                </p>
              )}
            </div>

            <Button type="submit" className="min-h-11 w-full cursor-pointer sm:w-auto">
              <Check aria-hidden="true" className="size-4" />
              Registrar aceite da conclusão
            </Button>
          </fieldset>
        </form>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          O aceite da conclusão não está disponível neste momento. Atualize o atendimento ou fale com o profissional.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {(refreshRequired || !canAccept) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4 min-h-11 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar atendimento
        </Button>
      )}

      {confirmation !== null && (
        <ConfirmationDialog
          title="Confirmar conclusão dos serviços?"
          description="Ao confirmar, você registra seu aceite da conclusão dos serviços descritos neste atendimento."
          confirmLabel="Confirmar aceite"
          loading={pending}
          onCancel={() => {
            if (!pendingRef.current) {
              setConfirmation(null);
            }
          }}
          onConfirm={() => void confirmAcceptance()}
        />
      )}
    </section>
  );
}
