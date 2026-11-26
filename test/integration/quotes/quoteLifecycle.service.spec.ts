import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  addQuoteItem,
  approveQuote,
  cancelQuote,
  createQuote,
  declineQuote,
  removeQuoteItem,
  repeatWorkOrderQuote,
  replaceQuoteItem,
  sendQuote,
  updateQuote,
} from '@/modules/quotes/services/quote.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/quotes`;
const quoteId = receivableId;
const date = '2025-01-01T00:00:00.000Z';
const newId = '33333333-3333-4333-8333-333333333333';
const input = {
  customerId: receivableId,
  title: 'Fixture quote',
  notes: null,
  validUntil: null,
  paymentCondition: 'AFTER_COMPLETION' as const,
  downPaymentPercentage: null,
};
const quote = {
  ...input,
  id: quoteId,
  organizationId,
  customerName: 'Fixture customer',
  customerEmail: null,
  customerPhone: null,
  status: 'DRAFT',
  currency: 'brl',
  discountInCents: 0,
  subtotalInCents: 1000,
  totalInCents: 1000,
  version: 2,
  sentAt: null,
  decidedAt: null,
  canceledAt: null,
  createdById: organizationId,
  updatedById: null,
  createdAt: date,
  updatedAt: date,
  items: [],
  changeRequest: null,
};

describe('quote lifecycle contracts', () => {
  it('preserves optimistic versions and organization scope in editing and status transitions', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) return success(quote);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const update = {
      title: 'Updated',
      notes: null,
      validUntil: null,
      discountInCents: 100,
      paymentCondition: 'AFTER_COMPLETION' as const,
      downPaymentPercentage: null,
    };
    const item = { version: 3, quantity: '1.5', catalogServiceId: newId };

    await createQuote(organizationId, input);
    await updateQuote(organizationId, quoteId, 2, update);
    await addQuoteItem(organizationId, quoteId, item);
    await replaceQuoteItem(organizationId, quoteId, newId, item);
    await removeQuoteItem(organizationId, quoteId, newId, 4);
    await sendQuote(organizationId, quoteId, 5);
    await approveQuote(organizationId, quoteId, 6);
    await declineQuote(organizationId, quoteId, 7);
    await cancelQuote(organizationId, quoteId, 8);

    const mutations = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(mutations.map((call) => [call.path, call.method]), [
      [route, 'POST'],
      [route + '/' + quoteId, 'PATCH'],
      [route + '/' + quoteId + '/items', 'POST'],
      [route + '/' + quoteId + '/items/' + newId, 'PUT'],
      [route + '/' + quoteId + '/items/' + newId, 'DELETE'],
      ...['send', 'approve', 'decline', 'cancel'].map((action) => [route + '/' + quoteId + '/' + action, 'POST']),
    ]);
    assert.deepEqual(mutations.map((call) => JSON.parse(String(call.body))), [
      input, { ...update, version: 2 }, item, item, { version: 4 },
      { version: 5 }, { version: 6 }, { version: 7 }, { version: 8 },
    ]);
  });

  it('refuses repeated services that return the same quote, wrong organization or non-draft status', async (t) => {
    const replies = [
      quote,
      { ...quote, id: newId, organizationId: receivableId },
      { ...quote, id: newId, status: 'SENT' },
      { ...quote, id: newId },
    ];
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/' + quoteId + '/repeat-service') return success(replies.shift());
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    for (let index = 0; index < 3; index++) {
      await assert.rejects(repeatWorkOrderQuote(organizationId, quoteId), /confirmar o novo orçamento/);
    }
    assert.equal((await repeatWorkOrderQuote(organizationId, quoteId)).id, newId);
    assert.equal(calls.filter((call) => call.path.endsWith('/repeat-service')).length, 4);
  });

  it('reports a version conflict without repeating the mutation', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/send')) return new Response(null, { status: 409 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(sendQuote(organizationId, quoteId, 2), /alterado/);
    assert.equal(calls.filter((call) => call.path.endsWith('/send')).length, 1);
  });
});
