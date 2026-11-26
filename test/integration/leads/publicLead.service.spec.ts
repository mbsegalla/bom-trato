import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPublicLead } from '@/modules/leads/services/publicLead.service';

import { issuanceId, mockHttp, organizationId, success } from '../../support/http.fixture';

const input = {
  name: 'Fixture customer',
  email: '',
  phone: '34999991234',
  catalogServiceId: null,
  message: 'Preciso de uma revisao',
};

describe('public lead service', () => {
  it('uses the selected public slug and preserves the idempotency key', async (t) => {
    const calls = mockHttp(t, () => success({ id: issuanceId, createdAt: '2026-01-01T00:00:00Z' }));

    await createPublicLead('fixture', organizationId, input);

    assert.equal(calls[0]?.path, '/api/public/professionals/fixture/leads');
    assert.equal(calls[0]?.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0]?.body)), { ...input, email: null, requestKey: organizationId });
    assert.equal(calls[0]?.headers.has('Authorization'), false);
  });

  it('reports uncertain success and unavailable professionals without repeating the request', async (t) => {
    let missing = false;
    const calls = mockHttp(t, () => (missing ? new Response(null, { status: 404 }) : success({ id: 'invalid' })));

    await assert.rejects(createPublicLead('fixture', organizationId, input), /confirmar sua solicitação/);

    missing = true;

    await assert.rejects(createPublicLead('fixture', organizationId, input), /não está disponível/);
    assert.equal(calls.length, 2);
  });
});
