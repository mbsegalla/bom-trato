import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { downloadPublicWorkOrderReport } from '@/modules/workOrders/services/publicWorkOrderReport.service';
import { mockHttp } from '../../support/http.fixture';

const token = 'a'.repeat(64);

describe('public work order document download', () => {
  it('rejects a malformed token without issuing a request', async (t) => {
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });

    await assert.rejects(downloadPublicWorkOrderReport('invalid'), /inválido/);
    assert.equal(calls.length, 0);
  });

  it('downloads the report as PDF with no credentials, cache or token in the URL', async (t) => {
    const calls = mockHttp(t, () => new Response('%PDF-1.4 fixture', { headers: { 'Content-Type': 'application/pdf' } }));

    const blob = await downloadPublicWorkOrderReport(token);

    assert.equal(blob.type, 'application/pdf');
    assert.equal(await blob.text(), '%PDF-1.4 fixture');
    assert.equal(calls[0]?.path, '/api/public/work-orders/report.pdf');
    assert.equal(calls[0]?.method, 'POST');
    assert.equal(calls[0]?.credentials, 'omit');
    assert.equal(calls[0]?.cache, 'no-store');
    assert.deepEqual(JSON.parse(String(calls[0]?.body)), { token });
  });

  it('refuses unexpected content, expired links and network failures', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, () => {
      attempt++;
      if (attempt === 1) return new Response('html', { headers: { 'Content-Type': 'text/html' } });
      if (attempt === 2) return new Response(null, { status: 404 });
      throw new Error('Fixture network failure');
    });

    await assert.rejects(downloadPublicWorkOrderReport(token), /interpretar o documento/);
    await assert.rejects(downloadPublicWorkOrderReport(token), /não está mais disponível/);
    await assert.rejects(downloadPublicWorkOrderReport(token), /Confira sua conexão/);
    assert.equal(calls.length, 3);
  });
});
