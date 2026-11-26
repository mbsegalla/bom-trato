import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getReceivablePixCharge } from '@/modules/receivables/services/receivablePixCharge.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const data = {
  organizationId,
  receivableId,
  receivableVersion: 1,
  receivingSettingsVersion: 2,
  amountInCents: 1001,
  currency: 'brl',
  merchantName: 'TEST',
  txid: 'A'.repeat(25),
  copyAndPaste: '000201FIXTURE6304ABCD',
};

describe('static Pix charge HTTP boundary', () => {
  it('accepts only the exact tenant and receivable identity with valid financial fields', async (t) => {
    let payload = data;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return success(payload);
    });

    await restoreSession();

    assert.deepEqual(await getReceivablePixCharge(organizationId, receivableId), data);

    for (const patch of [
      { organizationId: issuanceId },
      { receivableId: issuanceId },
      { amountInCents: 0 },
      { copyAndPaste: 'invalid' },
    ]) {
      payload = { ...data, ...patch };

      await assert.rejects(getReceivablePixCharge(organizationId, receivableId), /confirmar as instruções Pix/);
    }
    assert.ok(
      calls
        .filter((call) => call.path.endsWith('/pix-charge'))
        .every(
          (call) =>
            call.path === '/api/organizations/' + organizationId + '/receivables/' + receivableId + '/pix-charge',
        ),
    );
  });

  it('distinguishes authorization and financial conflicts', async (t) => {
    let status = 403;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response(null, { status });
    });

    await restoreSession();

    await assert.rejects(getReceivablePixCharge(organizationId, receivableId), /proprietário autorizado/);

    status = 409;

    await assert.rejects(getReceivablePixCharge(organizationId, receivableId), /saldo em aberto/);
  });
});
