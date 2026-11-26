import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { downloadWorkOrderReport } from '@/modules/workOrders/services/workOrderDocument.service';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

describe('work order report download', () => {
  it('requires a PDF response and names the file using the requested scoped work order', async (t) => {
    let contentType = 'application/pdf';
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response('%PDF-1.4 fixture', { headers: { 'Content-Type': contentType } });
    });

    await restoreSession();
    const result = await downloadWorkOrderReport(organizationId, receivableId);

    assert.equal(result.filename, 'relatorio-os-' + receivableId + '.pdf');
    assert.equal(result.blob.type, 'application/pdf');

    contentType = 'text/html';

    await assert.rejects(downloadWorkOrderReport(organizationId, receivableId), /interpretar o relatório/);
    assert.equal(
      calls.at(-1)?.path,
      '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/report.pdf'
    );
  });
});
