import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { listPlans } from '@/modules/plans/services/plan.service';
import type { Plan } from '@/modules/plans/types/plan.types';

import {
  billingApiErrorResponseSchema,
  billingCardResponseSchema,
  billingEntitlementsResponseSchema,
  billingInvoicesResponseSchema,
  billingPortalResponseSchema,
  billingSubscriptionResponseSchema,
  paymentMethodUpdateResponseSchema,
  planChangeResponseSchema,
} from '../schemas/billing.schema';
import type {
  BillingCard,
  BillingEntitlements,
  BillingInvoicePage,
  BillingSubscription,
  PaymentMethodUpdate,
  PlanChange,
} from '../types/billing.types';

const PLAN_CHANGE_STORAGE_PREFIX = 'bom-trato:plan-change:';

const subscriptionFlights = new Map<string, Promise<BillingSubscription | null>>();
const entitlementFlights = new Map<string, Promise<BillingEntitlements>>();
const cardFlights = new Map<string, Promise<BillingCard | null>>();
const invoiceFlights = new Map<string, Promise<BillingInvoicePage>>();

let plansFlight: Promise<Plan[]> | null = null;

export class BillingRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);

    this.name = 'BillingRequestError';
  }
}

function billingPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/billing`;
}

function getBillingErrorMessage(code: string | null, status: number, fallback: string): string {
  switch (code) {
    case 'OWNER_REQUIRED':
      return 'Somente o administrador do negócio pode realizar esta operação.';

    case 'EMAIL_NOT_VERIFIED':
      return 'Confirme seu e-mail antes de gerenciar a assinatura.';

    case 'PLAN_UNAVAILABLE':
      return 'O plano escolhido não está mais disponível.';

    case 'PRICE_MISMATCH':
      return 'O preço do plano mudou. Atualize os planos antes de continuar.';

    case 'SUBSCRIPTION_NOT_FOUND':
      return 'Nenhuma assinatura foi encontrada para este negócio.';

    case 'INVALID_SUBSCRIPTION_STATE':
      return 'A assinatura não permite esta operação no estado atual.';

    case 'PLAN_CHANGE_CONFLICT':
      return 'Já existe uma alteração de assinatura em andamento.';

    case 'PLAN_CHANGE_SAME_PRICE':
      return 'Sua assinatura já utiliza esse preço.';

    case 'PLAN_CHANGE_QUOTE_EXPIRED':
      return 'A prévia da alteração expirou. Gere uma nova prévia.';

    case 'PLAN_CHANGE_UNSUPPORTED':
      return 'Essa combinação de planos não pode ser alterada automaticamente.';

    case 'PLAN_MEMBER_LIMIT':
      return 'Remova membros antes de migrar para um plano com limite menor.';

    case 'PAYMENT_METHOD_UPDATE_NOT_FOUND':
      return 'A atualização do cartão não foi encontrada.';

    case 'INVALID_PAYMENT_METHOD_UPDATE':
      return 'Não foi possível validar a atualização do cartão.';

    case 'BILLING_RECONCILIATION_REQUIRED':
      return 'Os dados de cobrança estão sendo reconciliados. Tente novamente em instantes.';

    case 'BILLING_BUSY':
    case 'BILLING_READ_FAILED':
      return 'O faturamento está sendo atualizado. Tente novamente em instantes.';

    case 'BILLING_PORTAL_UNAVAILABLE':
      return 'O portal de faturamento não está disponível agora.';
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta operação.';
  }

  if (status === 404) {
    return 'O recurso solicitado não foi encontrado.';
  }

  if (status === 409) {
    return 'Existe outra operação de cobrança em andamento.';
  }

  if (status === 503) {
    return 'O faturamento está sendo atualizado. Tente novamente em instantes.';
  }

  return fallback;
}

async function throwBillingError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  const payload: unknown = await response.json().catch(() => null);

  const parsed = billingApiErrorResponseSchema.safeParse(payload);

  const code = parsed.success ? parsed.data.error.code : null;

  throw new BillingRequestError(getBillingErrorMessage(code, response.status, fallback), response.status, code);
}

async function requestSubscription(organizationId: string): Promise<BillingSubscription | null> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/subscription`);

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível carregar sua assinatura.');
  }

  const payload: unknown = await response.json();

  const parsed = billingSubscriptionResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados da assinatura.');
  }

  return parsed.data;
}

export function getBillingSubscription(organizationId: string): Promise<BillingSubscription | null> {
  const existing = subscriptionFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestSubscription(organizationId);

  subscriptionFlights.set(organizationId, request);

  const cleanup = () => {
    if (subscriptionFlights.get(organizationId) === request) {
      subscriptionFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestEntitlements(organizationId: string): Promise<BillingEntitlements> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/entitlements`);

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível carregar os limites do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = billingEntitlementsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os limites do plano.');
  }

  return parsed.data;
}

export function getBillingEntitlements(organizationId: string): Promise<BillingEntitlements> {
  const existing = entitlementFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestEntitlements(organizationId);

  entitlementFlights.set(organizationId, request);

  const cleanup = () => {
    if (entitlementFlights.get(organizationId) === request) {
      entitlementFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestPaymentMethod(organizationId: string): Promise<BillingCard | null> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/payment-method`);

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível carregar o método de pagamento.');
  }

  const payload: unknown = await response.json();

  const parsed = billingCardResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o método de pagamento.');
  }

  return parsed.data;
}

export function getBillingPaymentMethod(organizationId: string): Promise<BillingCard | null> {
  const existing = cardFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestPaymentMethod(organizationId);

  cardFlights.set(organizationId, request);

  const cleanup = () => {
    if (cardFlights.get(organizationId) === request) {
      cardFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestInvoices(organizationId: string, cursor?: string): Promise<BillingInvoicePage> {
  const query = new URLSearchParams({
    limit: '20',
  });

  if (cursor) {
    query.set('cursor', cursor);
  }

  const response = await authenticatedFetch(`${billingPath(organizationId)}/invoices?${query.toString()}`);

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível carregar as faturas.');
  }

  const payload: unknown = await response.json();

  const parsed = billingInvoicesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as faturas.');
  }

  return parsed.data;
}

export function listBillingInvoices(organizationId: string, cursor?: string): Promise<BillingInvoicePage> {
  const key = `${organizationId}:${cursor ?? 'first'}`;

  const existing = invoiceFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestInvoices(organizationId, cursor);

  invoiceFlights.set(key, request);

  const cleanup = () => {
    if (invoiceFlights.get(key) === request) {
      invoiceFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export function listBillingPlans(): Promise<Plan[]> {
  if (plansFlight) {
    return plansFlight;
  }

  const request = listPlans().then((result) => {
    if (!result.success) {
      throw new Error(result.message);
    }

    return result.plans;
  });

  plansFlight = request;

  const cleanup = () => {
    if (plansFlight === request) {
      plansFlight = null;
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function cancelBillingSubscription(organizationId: string): Promise<void> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível cancelar a renovação da assinatura.');
  }
}

export async function resumeBillingSubscription(organizationId: string): Promise<void> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/resume`, {
    method: 'POST',
  });

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível retomar a assinatura.');
  }
}

export async function startPaymentMethodUpdate(organizationId: string): Promise<PaymentMethodUpdate> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/payment-method/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accepted: true,
    }),
  });

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível iniciar a atualização do cartão.');
  }

  const payload: unknown = await response.json();

  const parsed = paymentMethodUpdateResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a atualização do cartão.');
  }

  return parsed.data;
}

export async function completePaymentMethodUpdate(
  organizationId: string,
  updateId: string,
): Promise<PaymentMethodUpdate> {
  const response = await authenticatedFetch(
    `${billingPath(organizationId)}/payment-method/updates/${encodeURIComponent(updateId)}/complete`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível concluir a atualização do cartão.');
  }

  const payload: unknown = await response.json();

  const parsed = paymentMethodUpdateResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a atualização do cartão.');
  }

  return parsed.data;
}

export async function previewPlanChange(organizationId: string, planPriceId: string): Promise<PlanChange> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/plan-changes/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planPriceId,
    }),
  });

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível calcular a alteração do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = planChangeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a alteração do plano.');
  }

  return parsed.data;
}

export async function confirmPlanChange(organizationId: string, changeId: string): Promise<PlanChange> {
  const response = await authenticatedFetch(
    `${billingPath(organizationId)}/plan-changes/${encodeURIComponent(changeId)}/confirm`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível confirmar a alteração do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = planChangeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a alteração do plano.');
  }

  persistPlanChange(organizationId, parsed.data);

  return parsed.data;
}

export async function getPlanChange(organizationId: string, changeId: string): Promise<PlanChange> {
  const response = await authenticatedFetch(
    `${billingPath(organizationId)}/plan-changes/${encodeURIComponent(changeId)}`,
  );

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível carregar a alteração do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = planChangeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a alteração do plano.');
  }

  persistPlanChange(organizationId, parsed.data);

  return parsed.data;
}

export async function syncPlanChange(organizationId: string, changeId: string): Promise<PlanChange> {
  const response = await authenticatedFetch(
    `${billingPath(organizationId)}/plan-changes/${encodeURIComponent(changeId)}/sync`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível atualizar o estado da alteração do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = planChangeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a alteração do plano.');
  }

  persistPlanChange(organizationId, parsed.data);

  return parsed.data;
}

export async function cancelPlanChange(organizationId: string, changeId: string): Promise<PlanChange> {
  const response = await authenticatedFetch(
    `${billingPath(organizationId)}/plan-changes/${encodeURIComponent(changeId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível cancelar a alteração do plano.');
  }

  const payload: unknown = await response.json();

  const parsed = planChangeResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o cancelamento da alteração.');
  }

  persistPlanChange(organizationId, parsed.data);

  return parsed.data;
}

export async function createBillingPortal(organizationId: string): Promise<string> {
  const response = await authenticatedFetch(`${billingPath(organizationId)}/portal`, {
    method: 'POST',
  });

  if (!response.ok) {
    await throwBillingError(response, 'Não foi possível abrir o portal de faturamento.');
  }

  const payload: unknown = await response.json();

  const parsed = billingPortalResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o endereço do portal.');
  }

  return parsed.data.url;
}

function planChangeStorageKey(organizationId: string): string {
  return `${PLAN_CHANGE_STORAGE_PREFIX}${organizationId}`;
}

function isTerminalPlanChange(change: PlanChange): boolean {
  return ['APPLIED', 'CANCELED', 'EXPIRED'].includes(change.status);
}

function persistPlanChange(organizationId: string, change: PlanChange): void {
  if (typeof window === 'undefined') {
    return;
  }

  const key = planChangeStorageKey(organizationId);

  if (isTerminalPlanChange(change)) {
    window.localStorage.removeItem(key);
    return;
  }

  if (change.status !== 'QUOTED') {
    window.localStorage.setItem(key, change.id);
  }
}

export function rememberPlanChange(organizationId: string, changeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(planChangeStorageKey(organizationId), changeId);
}

export function forgetPlanChange(organizationId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(planChangeStorageKey(organizationId));
}

export async function getRememberedPlanChange(organizationId: string): Promise<PlanChange | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const changeId = window.localStorage.getItem(planChangeStorageKey(organizationId));

  if (!changeId) {
    return null;
  }

  try {
    const change = await getPlanChange(organizationId, changeId);

    if (isTerminalPlanChange(change)) {
      forgetPlanChange(organizationId);
      return null;
    }

    return change;
  } catch (cause: unknown) {
    if (cause instanceof BillingRequestError && cause.code === 'PLAN_CHANGE_NOT_FOUND') {
      forgetPlanChange(organizationId);
      return null;
    }

    throw cause;
  }
}
