import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession, SessionError } from '@/modules/auth/services/session.service';
import {
  BillingRequestError,
  cancelBillingSubscription,
  cancelPlanChange,
  completePaymentMethodUpdate,
  confirmPlanChange,
  createBillingPortal,
  forgetPlanChange,
  getBillingEntitlements,
  getBillingPaymentMethod,
  getBillingSubscription,
  getPlanChange,
  getRememberedPlanChange,
  listBillingInvoices,
  listBillingPlans,
  previewPlanChange,
  rememberPlanChange,
  resumeBillingSubscription,
  startPaymentMethodUpdate,
  syncBilling,
  syncPlanChange,
} from '@/modules/settings/services/billing.service';

import { installBrowserStorage } from '../../support/browserStorage.fixture';
import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/billing';
const date = '2030-01-01T00:00:00.000Z';
const change = {
  id: receivableId,
  sourcePlanPriceId: organizationId,
  targetPlanPriceId: issuanceId,
  mode: 'IMMEDIATE',
  status: 'PROCESSING',
  currency: 'brl',
  amountDueNow: 100,
  targetAmountInCents: 500,
  targetInterval: 'MONTH',
  targetIntervalCount: 1,
  effectiveAt: null,
  quoteExpiresAt: date,
  clientSecret: null,
};
const failure = (code: string, status: number) =>
  Response.json(
    {
      statusCode: status,
      success: false,
      error: { code, message: 'private upstream detail' },
    },
    { status },
  );

describe('billing error mapping and recovery', () => {
  for (const [code, status, message] of [
    ['OWNER_REQUIRED', 403, 'Somente o administrador'],
    ['EMAIL_NOT_VERIFIED', 403, 'Confirme seu e-mail'],
    ['PLAN_UNAVAILABLE', 409, 'não está mais disponível'],
    ['PRICE_MISMATCH', 409, 'O preço do plano mudou'],
    ['SUBSCRIPTION_NOT_FOUND', 404, 'Nenhuma assinatura'],
    ['INVALID_SUBSCRIPTION_STATE', 409, 'estado atual'],
    ['PLAN_CHANGE_CONFLICT', 409, 'alteração de assinatura em andamento'],
    ['PLAN_CHANGE_SAME_PRICE', 409, 'já utiliza esse preço'],
    ['PLAN_CHANGE_QUOTE_EXPIRED', 409, 'prévia da alteração expirou'],
    ['PLAN_CHANGE_UNSUPPORTED', 409, 'não pode ser alterada automaticamente'],
    ['PLAN_MEMBER_LIMIT', 409, 'Remova membros'],
    ['PAYMENT_METHOD_UPDATE_NOT_FOUND', 404, 'atualização do cartão não foi encontrada'],
    ['INVALID_PAYMENT_METHOD_UPDATE', 400, 'validar a atualização do cartão'],
    ['BILLING_RECONCILIATION_REQUIRED', 503, 'reconciliados'],
    ['BILLING_BUSY', 503, 'faturamento está sendo atualizado'],
    ['BILLING_READ_FAILED', 503, 'faturamento está sendo atualizado'],
    ['BILLING_PORTAL_UNAVAILABLE', 503, 'portal de faturamento não está disponível'],
  ] as const) {
    it('preserves the domain code and safe message for ' + code, async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return failure(code, status);
      });
      await restoreSession();
      await assert.rejects(
        syncBilling(organizationId),
        (error: unknown) =>
          error instanceof BillingRequestError &&
          error.status === status &&
          error.code === code &&
          error.message.includes(message) &&
          !error.message.includes('private upstream detail'),
      );
      assert.equal(calls.filter((call) => call.path === route + '/sync').length, 1);
    });
  }

  for (const [status, message] of [
    [403, 'não tem permissão'],
    [404, 'recurso solicitado não foi encontrado'],
    [409, 'outra operação de cobrança'],
    [503, 'faturamento está sendo atualizado'],
    [500, 'Não foi possível verificar sua assinatura'],
  ] as const) {
    it('uses a safe fallback for malformed HTTP ' + status, async (t) => {
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response('not JSON', { status });
      });
      await restoreSession();
      await assert.rejects(
        syncBilling(organizationId),
        (error: unknown) =>
          error instanceof BillingRequestError &&
          error.code === null &&
          error.status === status &&
          error.message.includes(message),
      );
    });
  }

  it('returns a session error after a single unsuccessful refresh replay', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 401 });
    });
    await restoreSession();
    await assert.rejects(getBillingSubscription(organizationId), (error: unknown) => error instanceof SessionError);
    assert.equal(calls.filter((call) => call.path === route + '/subscription').length, 2);
  });

  const operations = [
    ['subscription', () => getBillingSubscription(organizationId)],
    ['entitlements', () => getBillingEntitlements(organizationId)],
    ['payment-method', () => getBillingPaymentMethod(organizationId)],
    ['invoices', () => listBillingInvoices(organizationId)],
    ['cancel', () => cancelBillingSubscription(organizationId)],
    ['resume', () => resumeBillingSubscription(organizationId)],
    ['payment-method/setup', () => startPaymentMethodUpdate(organizationId)],
    [
      'payment-method/updates/' + receivableId + '/complete',
      () => completePaymentMethodUpdate(organizationId, receivableId),
    ],
    ['plan-changes/preview', () => previewPlanChange(organizationId, issuanceId)],
    ['plan-changes/' + receivableId + '/confirm', () => confirmPlanChange(organizationId, receivableId)],
    ['plan-changes/' + receivableId, () => getPlanChange(organizationId, receivableId)],
    ['plan-changes/' + receivableId + '/sync', () => syncPlanChange(organizationId, receivableId)],
    ['plan-changes/' + receivableId, () => cancelPlanChange(organizationId, receivableId)],
    ['portal', () => createBillingPortal(organizationId)],
  ] as const;

  for (const [index, [path, operation]] of operations.entries()) {
    it('does not retry rejected billing operation ' + index + ' ' + path, async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return failure('BILLING_BUSY', 503);
      });
      await restoreSession();
      await assert.rejects(
        operation(),
        (error: unknown) => error instanceof BillingRequestError && error.code === 'BILLING_BUSY',
      );
      assert.equal(calls.filter((call) => call.path.split('?')[0] === route + '/' + path).length, 1);
    });
  }

  for (const [index, [path, operation]] of operations.entries()) {
    if (path === 'cancel' || path === 'resume') continue;
    it('rejects malformed success data for operation ' + index + ' ' + path, async (t) => {
      const browser = installBrowserStorage(t);
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return success({ invalid: true });
      });
      await restoreSession();
      await assert.rejects(operation(), /interpretar/);
      assert.equal(browser.localStorage.getItem('bom-trato:plan-change:' + organizationId), null);
    });
  }

  it('coalesces catalogue requests and recovers after an unavailable catalogue', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, () => (++attempt === 1 ? new Response(null, { status: 503 }) : success([])));
    const first = listBillingPlans();
    assert.strictEqual(first, listBillingPlans());
    await assert.rejects(first, /carregar os planos/);
    assert.deepEqual(await listBillingPlans(), []);
    assert.equal(calls.length, 2);
  });

  it('isolates and clears concurrent card and entitlement flights after success', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/payment-method')) return success(null);
      return success({ hasAccess: true, maxUsers: 2, memberCount: 1, teamManagementEnabled: true, canAddMember: true });
    });
    await restoreSession();
    const card = getBillingPaymentMethod(organizationId);
    const limits = getBillingEntitlements(organizationId);
    assert.strictEqual(card, getBillingPaymentMethod(organizationId));
    assert.strictEqual(limits, getBillingEntitlements(organizationId));
    assert.notStrictEqual(card, getBillingPaymentMethod(receivableId));
    await Promise.all([card, limits]);
    await Promise.all([getBillingPaymentMethod(organizationId), getBillingEntitlements(organizationId)]);
    assert.equal(calls.filter((call) => call.path === route + '/payment-method').length, 2);
    assert.equal(calls.filter((call) => call.path === route + '/entitlements').length, 2);
  });

  it('works without browser storage and does not attempt a remembered change request', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success(change);
    });
    await restoreSession();
    rememberPlanChange(organizationId, receivableId);
    forgetPlanChange(organizationId);
    assert.equal(await getRememberedPlanChange(organizationId), null);
    assert.equal((await confirmPlanChange(organizationId, receivableId)).status, 'PROCESSING');
    assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 1);
  });

  for (const status of [
    'PROCESSING',
    'PENDING_PAYMENT',
    'SCHEDULED',
    'QUOTED',
    'APPLIED',
    'EXPIRED',
    'CANCELED',
  ] as const) {
    it('restores or clears remembered plan change state ' + status, async (t) => {
      const browser = installBrowserStorage(t);
      const key = 'bom-trato:plan-change:' + organizationId;
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return success({ ...change, status });
      });
      await restoreSession();
      rememberPlanChange(organizationId, receivableId);
      const result = await getRememberedPlanChange(organizationId);
      const terminal = ['APPLIED', 'EXPIRED', 'CANCELED'].includes(status);
      assert.equal(result?.status ?? null, terminal ? null : status);
      assert.equal(browser.localStorage.getItem(key), terminal ? null : receivableId);
    });
  }
});
