import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  deleteWorkOrderPhoto,
  getPublicWorkOrderPhotoContent,
  listWorkOrderPhotos,
  updateWorkOrderPhoto,
  uploadWorkOrderPhoto,
} from '@/modules/workOrders/services/workOrderPhoto.service';
import { PublicWorkOrderError } from '@/modules/workOrders/services/workOrderPortal.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/photos';
const date = '2025-01-01T00:00:00.000Z';
const photo = {
  id: issuanceId,
  stage: 'BEFORE' as const,
  caption: null,
  visibleInPortal: false,
  width: 100,
  height: 100,
  sizeInBytes: 10,
  version: 1,
  createdAt: date,
  updatedAt: date,
};

describe('work order photo mutation contracts', () => {
  it('uploads multipart photos without publishing them and sends only visibility changes when details are unchanged', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'POST') return success(photo);
      if (call.path === route && call.method === 'GET') return success([photo]);
      if (call.path === route + '/' + issuanceId && call.method === 'PATCH')
        return success({ ...photo, visibleInPortal: true, version: 2 });
      if (call.path === route + '/' + issuanceId && call.method === 'DELETE')
        return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const file = new File(['fixture'], 'fixture.webp', { type: 'image/webp' });
    const created = await uploadWorkOrderPhoto(organizationId, receivableId, file, {
      stage: 'BEFORE',
      caption: null,
      visibleInPortal: false,
    });
    const list = await listWorkOrderPhotos(organizationId, receivableId);
    const updated = await updateWorkOrderPhoto(organizationId, receivableId, created, {
      stage: 'BEFORE',
      caption: null,
      visibleInPortal: true,
    });

    await deleteWorkOrderPhoto(organizationId, receivableId, updated);

    assert.equal(list[0]?.visibleInPortal, false);
    assert.equal(updated.version, 2);

    const requests = calls.filter((call) => call.path.startsWith(route));
    const upload = requests[0]?.body;

    assert.ok(upload instanceof FormData);
    assert.equal((upload.get('file') as File).name, file.name);
    assert.equal(upload.get('stage'), 'BEFORE');
    assert.equal(upload.has('visibleInPortal'), false);
    assert.deepEqual(JSON.parse(String(requests[2]?.body)), { version: 1, visibleInPortal: true });
    assert.deepEqual(JSON.parse(String(requests[3]?.body)), { version: 2 });
  });

  it('reports the photo count limit and avoids repeating an upload', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route)
        return Response.json({ error: { code: 'WORK_ORDER_PHOTO_LIMIT_REACHED' } }, { status: 409 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(
      uploadWorkOrderPhoto(organizationId, receivableId, new File(['fixture'], 'photo.webp', { type: 'image/webp' }), {
        stage: 'BEFORE',
        caption: null,
        visibleInPortal: false,
      }),
      /20 fotos/,
    );

    assert.equal(calls.filter((call) => call.path === route).length, 1);
  });
});

describe('public photo content contracts', () => {
  it('keeps tokens in the body, omits credentials and distinguishes unavailable photos from retryable failures', async (t) => {
    const token = 'a'.repeat(64);
    let attempt = 0;

    const calls = mockHttp(t, (call) => {
      assert.equal(call.path, '/api/public/work-orders/photos/' + issuanceId + '/content');
      attempt++;
      if (attempt === 1) return new Response('fixture', { headers: { 'Content-Type': 'image/webp' } });
      if (attempt === 2) return new Response(null, { status: 404 });
      return new Response(null, { status: 503 });
    });

    await assert.rejects(getPublicWorkOrderPhotoContent('invalid', issuanceId), /inválido/);
    assert.equal(calls.length, 0);
    assert.equal((await getPublicWorkOrderPhotoContent(token, issuanceId)).type, 'image/webp');

    await assert.rejects(
      getPublicWorkOrderPhotoContent(token, issuanceId),
      (error: unknown) => error instanceof PublicWorkOrderError && !error.retryable,
    );
    await assert.rejects(
      getPublicWorkOrderPhotoContent(token, issuanceId),
      (error: unknown) => error instanceof PublicWorkOrderError && error.retryable,
    );

    for (const call of calls) {
      assert.equal(call.method, 'POST');
      assert.equal(call.credentials, 'omit');
      assert.equal(call.cache, 'no-store');
      assert.deepEqual(JSON.parse(String(call.body)), { token });
      assert.equal(call.headers.get('Authorization'), null);
    }
  });
});
