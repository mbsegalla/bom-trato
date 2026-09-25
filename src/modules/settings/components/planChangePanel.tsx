'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { LoaderCircle, LockKeyhole, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getStripeConfig } from '@/config/stripe.config';
import { cn } from '@/lib/utils';
import type { Plan, PlanPrice, PricingInterval } from '@/modules/plans/types/plan.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import {
  getBillingIntervalLabel,
  getPlanChangeModeLabel,
  getPlanChangeStatusLabel,
} from '../constants/billing.constants';
import {
  cancelPlanChange,
  confirmPlanChange,
  previewPlanChange,
  rememberPlanChange,
  syncPlanChange,
} from '../services/billing.service';
import type { BillingSubscription, PlanChange } from '../types/billing.types';

const stripePromise = loadStripe(getStripeConfig().publishableKey);

const intervals: {
  value: PricingInterval;
  label: string;
}[] = [
  {
    value: 'MONTH',
    label: 'Mensal',
  },
  {
    value: 'YEAR',
    label: 'Anual',
  },
];

interface PlanChangePanelProps {
  organizationId: string;
  subscription: BillingSubscription;
  plans: Plan[];
  memberCount: number;
  initialChange?: PlanChange | null;
  onClose(): void;
  onChanged(): void;
}

export function PlanChangePanel({
  organizationId,
  subscription,
  plans,
  memberCount,
  initialChange = null,
  onClose,
  onChanged,
}: PlanChangePanelProps) {
  const current = useMemo(() => findPrice(plans, subscription.planPriceId), [plans, subscription.planPriceId]);

  const availableIntervals = intervals.filter((interval) =>
    plans.some((plan) => plan.prices.some((price) => price.interval === interval.value && price.intervalCount === 1)),
  );

  const [selectedInterval, setSelectedInterval] = useState<PricingInterval>(
    current?.price.interval ?? availableIntervals[0]?.value ?? 'MONTH',
  );
  const [change, setChange] = useState<PlanChange | null>(initialChange);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = change ? findPrice(plans, change.targetPlanPriceId) : null;

  async function selectPrice(price: PlanPrice): Promise<void> {
    if (loadingPriceId) {
      return;
    }

    setLoadingPriceId(price.id);
    setError(null);

    try {
      const preview = await previewPlanChange(organizationId, price.id);

      setChange(preview);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível calcular a alteração.');
    } finally {
      setLoadingPriceId(null);
    }
  }

  async function confirm(): Promise<void> {
    if (!change || confirming) {
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const result = await confirmPlanChange(organizationId, change.id);

      setChange(result);

      if (result.status === 'APPLIED' || result.status === 'SCHEDULED') {
        onChanged();
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar a alteração.');
    } finally {
      setConfirming(false);
    }
  }

  async function refreshChange(): Promise<void> {
    if (!change || confirming) {
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const result = await syncPlanChange(organizationId, change.id);

      setChange(result);

      if (result.status === 'APPLIED' || result.status === 'SCHEDULED') {
        onChanged();
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a alteração.');
    } finally {
      setConfirming(false);
    }
  }

  async function cancel(): Promise<void> {
    if (!change || canceling) {
      return;
    }

    setCanceling(true);
    setError(null);

    try {
      await cancelPlanChange(organizationId, change.id);

      onChanged();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar a alteração.');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Alterar plano</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o plano que melhor acompanha o momento do seu negócio.
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <X className="size-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!change ? (
            <>
              {availableIntervals.length > 1 && (
                <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
                  {availableIntervals.map((interval) => (
                    <Button
                      key={interval.value}
                      type="button"
                      size="sm"
                      variant={selectedInterval === interval.value ? 'default' : 'ghost'}
                      onClick={() => setSelectedInterval(interval.value)}
                      className="flex-1 cursor-pointer rounded-lg"
                    >
                      {interval.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {plans.map((plan) => {
                  const price = plan.prices.find(
                    (candidate) => candidate.interval === selectedInterval && candidate.intervalCount === 1,
                  );

                  if (!price) {
                    return null;
                  }

                  const currentPrice = price.id === subscription.planPriceId;
                  const memberLimitInvalid = plan.maxUsers < memberCount;

                  return (
                    <article
                      key={plan.id}
                      className={cn('rounded-2xl border border-border p-5', currentPrice && 'bg-muted/30')}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>

                            {currentPrice && (
                              <span className="rounded-full bg-success-surface px-2.5 py-1 text-xs font-medium text-success">
                                Plano atual
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                          <p className="mt-4 text-xl font-semibold">
                            {formatBrlCurrency(price.amountInCents)}

                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              / {getBillingIntervalLabel(price.interval)}
                            </span>
                          </p>

                          <p className="mt-2 text-xs text-muted-foreground">Até {plan.maxUsers} usuários</p>

                          {memberLimitInvalid && (
                            <p className="mt-2 text-xs text-destructive">
                              Sua equipe atual possui mais usuários do que este plano permite.
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant={currentPrice ? 'outline' : 'default'}
                          disabled={currentPrice || memberLimitInvalid || loadingPriceId !== null}
                          onClick={() => void selectPrice(price)}
                          className="cursor-pointer"
                        >
                          {loadingPriceId === price.id && <LoaderCircle className="size-4 animate-spin" />}

                          {currentPrice ? 'Atual' : 'Selecionar'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : change.status === 'QUOTED' ? (
            <PlanChangePreview
              change={change}
              target={target}
              confirming={confirming}
              error={error}
              onBack={() => setChange(null)}
              onConfirm={() => void confirm()}
            />
          ) : change.status === 'PENDING_PAYMENT' && change.clientSecret ? (
            <Elements
              key={change.clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret: change.clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#205c49',
                    borderRadius: '10px',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                  },
                },
              }}
            >
              <PlanChangePaymentForm
                organizationId={organizationId}
                change={change}
                target={target}
                onChanged={onChanged}
              />
            </Elements>
          ) : (
            <div>
              <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-primary">
                {getPlanChangeStatusLabel(change.status)}
              </span>

              <h3 className="mt-5 font-heading text-xl font-semibold">{target?.plan.name ?? 'Alteração de plano'}</h3>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {change.status === 'SCHEDULED' && change.effectiveAt
                  ? `A mudança está programada para ${formatDateTime(change.effectiveAt)}.`
                  : change.status === 'PROCESSING'
                    ? 'A alteração está sendo processada pela Stripe.'
                    : change.status === 'PENDING_PAYMENT'
                      ? 'A alteração está aguardando a confirmação do pagamento.'
                      : 'Estamos acompanhando o estado da alteração.'}
              </p>

              {error && (
                <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {change.status !== 'SCHEDULED' && (
                  <Button
                    type="button"
                    disabled={confirming}
                    onClick={() => void refreshChange()}
                    className="cursor-pointer"
                  >
                    {confirming && <LoaderCircle className="size-4 animate-spin" />}
                    Atualizar status
                  </Button>
                )}

                {['PROCESSING', 'PENDING_PAYMENT', 'SCHEDULED'].includes(change.status) && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={canceling}
                    onClick={() => void cancel()}
                    className="cursor-pointer"
                  >
                    {canceling && <LoaderCircle className="size-4 animate-spin" />}
                    Cancelar alteração
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function findPrice(plans: Plan[], planPriceId: string): { plan: Plan; price: PlanPrice } | null {
  for (const plan of plans) {
    const price = plan.prices.find((candidate) => candidate.id === planPriceId);

    if (price) {
      return {
        plan,
        price,
      };
    }
  }

  return null;
}

interface PlanChangePreviewProps {
  change: PlanChange;
  target: {
    plan: Plan;
    price: PlanPrice;
  } | null;
  confirming: boolean;
  error: string | null;
  onBack(): void;
  onConfirm(): void;
}

function PlanChangePreview({ change, target, confirming, error, onBack, onConfirm }: PlanChangePreviewProps) {
  return (
    <div>
      <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-primary">
        {getPlanChangeModeLabel(change.mode)}
      </span>

      <h3 className="mt-5 font-heading text-xl font-semibold">Confirmar alteração</h3>

      <div className="mt-6 rounded-2xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Novo plano</p>

        <p className="mt-1 text-lg font-semibold">{target?.plan.name ?? 'Plano selecionado'}</p>

        <p className="mt-2">
          {formatBrlCurrency(change.targetAmountInCents)}
          {' / '}
          {getBillingIntervalLabel(change.targetInterval)}
        </p>

        {change.mode === 'IMMEDIATE' ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Valor adicional agora</p>

            <p className="mt-1 text-2xl font-semibold text-primary">{formatBrlCurrency(change.amountDueNow)}</p>
          </div>
        ) : (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Alteração efetiva em</p>

            <p className="mt-1 font-semibold">
              {change.effectiveAt ? formatDateTime(change.effectiveAt) : 'Próximo ciclo'}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Esta prévia é válida até {formatDateTime(change.quoteExpiresAt)}.
      </p>

      {error && (
        <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button type="button" variant="outline" disabled={confirming} onClick={onBack} className="cursor-pointer">
          Voltar
        </Button>

        <Button type="button" disabled={confirming} onClick={onConfirm} className="cursor-pointer">
          {confirming && <LoaderCircle className="size-4 animate-spin" />}
          Confirmar alteração
        </Button>
      </div>
    </div>
  );
}

interface PlanChangePaymentFormProps {
  organizationId: string;
  change: PlanChange;
  target: {
    plan: Plan;
    price: PlanPrice;
  } | null;
  onChanged(): void;
}

function PlanChangePaymentForm({ organizationId, change, target, onChanged }: PlanChangePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      rememberPlanChange(organizationId, change.id);

      const returnUrl = new URL('/settings/billing/return', window.location.origin);

      returnUrl.searchParams.set('organizationId', organizationId);
      returnUrl.searchParams.set('operationId', change.id);
      returnUrl.searchParams.set('kind', 'plan-change');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message ?? 'Não foi possível confirmar o pagamento.');

        return;
      }

      for (let attempt = 0; attempt < 15; attempt += 1) {
        const current = await syncPlanChange(organizationId, change.id);

        if (current.status === 'APPLIED' || current.status === 'SCHEDULED') {
          onChanged();
          return;
        }

        if (current.status === 'CANCELED' || current.status === 'EXPIRED') {
          setError('A alteração não pôde ser concluída.');

          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setError('O pagamento foi enviado, mas a alteração ainda está sendo processada.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a alteração.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-semibold">Confirmar pagamento</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {target?.plan.name ?? 'Novo plano'}
          {' · '}
          {formatBrlCurrency(change.amountDueNow)} agora
        </p>
      </div>

      <PaymentElement />

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={!stripe || submitting} className="min-h-12 w-full cursor-pointer rounded-xl">
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Pagar e alterar plano
          </>
        )}
      </Button>
    </form>
  );
}
