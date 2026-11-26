import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  acceptPublicWorkOrder,
  PublicWorkOrderAcceptanceError,
} from '@/modules/workOrders/services/workOrderAcceptance.service';

import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(64),
  hash = 'b'.repeat(64);
const input = { signerName: ' Cliente   Teste ', consent: true as const };

describe('public work order acceptance service', () => {
  it('rejects missing link or snapshot identity before network access', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    await assert.rejects(
      acceptPublicWorkOrder('invalid', hash, '1', input),
      (e: unknown) => e instanceof PublicWorkOrderAcceptanceError && e.refreshRequired,
    );
    await assert.rejects(acceptPublicWorkOrder(token, 'invalid', '1', input));
    assert.equal(calls.length, 0);
  });

  it('submits exact evidence and consent without sending authenticated credentials', async (t) => {
    const date = '2026-01-01T00:00:00Z';
    const calls = mockHttp(t, () => success({ acceptedAt: date, completedAt: date, signerName: 'private' }));

    assert.deepEqual(await acceptPublicWorkOrder(token, hash, '1', input), {
      acceptedAt: new Date(date),
      completedAt: new Date(date),
    });
    assert.equal(calls[0]?.path, '/api/public/work-orders/acceptance');
    assert.equal(calls[0]?.credentials, 'omit');
    assert.equal(calls[0]?.cache, 'no-store');
    assert.deepEqual(JSON.parse(String(calls[0]?.body)), {
      token,
      snapshotHash: hash,
      consentVersion: '1',
      signerName: 'Cliente Teste',
      consent: true,
    });
  });

  it('requires refresh on conflict or lost response and never submits twice implicitly', async (t) => {
    let conflict = true;
    const calls = mockHttp(t, () => {
      if (conflict) return Response.json({ error: { code: 'WORK_ORDER_ALREADY_ACCEPTED' } }, { status: 409 });
      throw new Error('connection lost');
    });

    await assert.rejects(
      acceptPublicWorkOrder(token, hash, '1', input),
      (e: unknown) =>
        e instanceof PublicWorkOrderAcceptanceError && e.refreshRequired && /já possui um aceite/.test(e.message),
    );

    conflict = false;

    await assert.rejects(
      acceptPublicWorkOrder(token, hash, '1', input),
      (e: unknown) => e instanceof PublicWorkOrderAcceptanceError && e.refreshRequired,
    );
    assert.equal(calls.length, 2);
  });
});
