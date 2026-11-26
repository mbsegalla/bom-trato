import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getWorkOrderPhotoContent,
  uploadWorkOrderPhoto,
  validateWorkOrderPhotoFile,
} from '@/modules/workOrders/services/workOrderPhoto.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

describe('work order photo service', () => {
  it('rejects invalid type, empty and oversize files before network requests', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });
    const input = { stage: 'BEFORE' as const, caption: null, visibleInPortal: false };
    for (const file of [
      new File(['data'], 'fixture.txt', { type: 'text/plain' }),
      new File([], 'fixture.webp', { type: 'image/webp' }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'fixture.webp', { type: 'image/webp' }),
    ]) {
      assert.notEqual(validateWorkOrderPhotoFile(file), null);
      await assert.rejects(uploadWorkOrderPhoto(organizationId, receivableId, file, input));
    }
    assert.equal(calls.length, 0);
  });

  it('accepts only nonempty WebP content from the scoped authenticated endpoint', async (t) => {
    let type = 'image/webp';
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response('fixture', { headers: { 'Content-Type': type } });
    });

    await restoreSession();

    assert.equal((await getWorkOrderPhotoContent(organizationId, receivableId, issuanceId)).type, 'image/webp');

    type = 'text/html';

    await assert.rejects(getWorkOrderPhotoContent(organizationId, receivableId, issuanceId), /conteúdo da foto/);
    assert.equal(
      calls.at(-1)?.path,
      '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/photos/' + issuanceId + '/content',
    );
  });
});
