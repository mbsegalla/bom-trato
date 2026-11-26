import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { archiveLead, convertLead, getLead, listLeads, markLeadContacted } from '@/modules/leads/services/lead.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const date = '2026-01-01T00:00:00Z';
const leadId = issuanceId;
const route = '/api/organizations/' + organizationId + '/leads';
const details = route + '/' + leadId;
const state = {
  id: leadId,
  organizationId,
  catalogServiceId: null,
  requestedServiceName: null,
  name: 'Fixture customer',
  email: 'fixture@example.invalid',
  phone: null,
  message: 'Fixture request',
  status: 'NEW',
  convertedCustomerId: null,
  convertedQuoteId: null,
  contactedAt: null,
  convertedAt: null,
  archivedAt: null,
  createdAt: date,
  updatedAt: date,
};

describe('authenticated lead HTTP contracts', () => {
  it('coalesces matching list flights while keeping tenant and status filters isolated', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      const org = call.path.split('/')[3];

      return success({ items: [{ ...state, organizationId: org }], page: 2, hasMore: true });
    });

    await restoreSession();

    const first = listLeads(organizationId, { page: 2, limit: 5, search: '  Teste & Cia  ', status: 'NEW' });
    const duplicate = listLeads(organizationId, { page: 2, limit: 5, search: 'Teste & Cia', status: 'NEW' });
    const other = listLeads(receivableId, { page: 2, limit: 5, search: 'Teste & Cia', status: 'NEW' });

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);

    const [a, b] = await Promise.all([first, other]);

    assert.equal(a.items[0]?.organizationId, organizationId);
    assert.equal(b.items[0]?.organizationId, receivableId);
    assert.equal(a.hasMore, true);
    assert.deepEqual(a.items[0]?.createdAt, new Date(date));

    const reads = calls.filter((call) => call.path.includes('/leads?'));

    assert.equal(reads.length, 2);
    assert.deepEqual(Object.fromEntries(new URLSearchParams(reads[0]?.path.split('?')[1])), {
      page: '2',
      limit: '5',
      status: 'NEW',
      search: 'Teste & Cia',
    });
  });

  it('clears failed list flights and rejects invalid records before the UI receives them', async (t) => {
    let attempts = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      attempts++;

      if (attempts === 1) return new Response(null, { status: 503 });

      return success({
        items: [{ ...state, status: attempts === 2 ? 'INVALID' : 'NEW' }],
        page: 1,
        hasMore: false,
      });
    });

    await restoreSession();

    await assert.rejects(listLeads(organizationId, { page: 1 }), /oportunidades estão sendo atualizadas/);
    await assert.rejects(listLeads(organizationId, { page: 1 }), /interpretar as oportunidades/);
    assert.equal((await listLeads(organizationId, { page: 1 })).items[0]?.status, 'NEW');
    assert.equal(attempts, 3);
  });

  it('scopes contact, archive and conversion writes and keeps converted identities from the server', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === details + '/contacted') return success({ ...state, status: 'CONTACTED', contactedAt: date });
      if (call.path === details + '/archive') return success({ ...state, status: 'ARCHIVED', archivedAt: date });
      if (call.path === details + '/convert') {
        return success({
          lead: { ...state, status: 'CONVERTED', convertedCustomerId: receivableId, convertedQuoteId: issuanceId, convertedAt: date },
          customerId: receivableId,
          quoteId: issuanceId,
        });
      }

      return success(state);
    });

    await restoreSession();

    assert.equal((await getLead(organizationId, leadId)).id, leadId);
    assert.deepEqual((await markLeadContacted(organizationId, leadId)).contactedAt, new Date(date));
    assert.deepEqual((await archiveLead(organizationId, leadId)).archivedAt, new Date(date));

    const converted = await convertLead(organizationId, leadId);

    assert.equal(converted.customerId, receivableId);
    assert.equal(converted.quoteId, issuanceId);
    assert.equal(converted.lead.status, 'CONVERTED');

    const writes = calls.filter((call) => call.path.startsWith(details) && call.method === 'POST');

    assert.deepEqual(writes.map((call) => call.path), [
      details + '/contacted', details + '/archive', details + '/convert',
    ]);
    assert.ok(writes.every((call) => call.headers.get('x-csrf-token') === 'fixture-csrf'));
  });

  it('reports access, missing data and conflicting conversion without replaying mutations', async (t) => {
    let attempts = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      attempts++;

      return new Response(null, { status: [403, 404, 409][attempts - 1] ?? 503 });
    });

    await restoreSession();

    await assert.rejects(getLead(organizationId, leadId), /não tem permissão/);
    await assert.rejects(archiveLead(organizationId, leadId), /não encontrada/);
    await assert.rejects(convertLead(organizationId, leadId), /não pode ser alterada/);

    assert.equal(attempts, 3);
    assert.equal(calls.filter((call) => call.path === details + '/convert').length, 1);
  });
});
