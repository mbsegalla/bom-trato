import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  consentPortfolioPhotos,
  getPortalPortfolioStatus,
  getProfessionalPortfolioImage,
  revokePortfolioPhoto,
} from '@/modules/workOrders/services/workOrderPortfolio.service';
import { mockHttp, issuanceId, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);
const route = '/api/public/work-orders/portfolio';
const status = { canAuthorize: true, photos: [{ id: issuanceId, consented: true, published: false }] };

describe('public work order portfolio safeguards', () => {
  it('sends private consent only through the body with the current consent version', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === route + '/revoke') return success({ ...status, photos: [{ id: issuanceId, consented: false, published: false }] });

      return success(status);
    });

    await getPortalPortfolioStatus(token);
    const approved = await consentPortfolioPhotos(token, { photoIds: [issuanceId], signerName: '  Cliente Teste  ', consent: true });
    const revoked = await revokePortfolioPhoto(token, issuanceId);

    assert.equal(approved.photos[0]?.consented, true);
    assert.equal(revoked.photos[0]?.consented, false);
    assert.deepEqual(calls.map((call) => [call.path, JSON.parse(String(call.body))]), [
      [route + '/status', { token }],
      [route + '/consent', { token, photoIds: [issuanceId], signerName: 'Cliente Teste', consent: true, consentVersion: '1' }],
      [route + '/revoke', { token, photoId: issuanceId }],
    ]);
    assert.ok(calls.every((call) => call.method === 'POST' && call.credentials === 'omit' && call.cache === 'no-store'));
    assert.ok(calls.every((call) => !call.headers.has('Authorization')));
  });

  it('rejects malformed links and invalid consent locally before requesting a public resource', async (t) => {
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });

    await assert.rejects(getPortalPortfolioStatus('invalid'), /inválido/);
    assert.throws(() => consentPortfolioPhotos(token, { photoIds: [], signerName: 'Cliente', consent: true }));
    assert.throws(() => consentPortfolioPhotos(token, { photoIds: [issuanceId], signerName: ' ', consent: true }));
    assert.equal(calls.length, 0);
  });

  it('does not accept empty images, other MIME types or a revoked public photo', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, () => {
      attempt++;
      if (attempt === 1) return new Response('fixture', { headers: { 'Content-Type': 'image/webp' } });
      if (attempt === 2) return new Response('', { headers: { 'Content-Type': 'image/webp' } });
      if (attempt === 3) return new Response('html', { headers: { 'Content-Type': 'text/html' } });

      return new Response(null, { status: 404 });
    });

    assert.equal((await getProfessionalPortfolioImage('fixture', issuanceId)).type, 'image/webp');
    await assert.rejects(getProfessionalPortfolioImage('fixture', issuanceId), /imagem recebida é inválida/);
    await assert.rejects(getProfessionalPortfolioImage('fixture', issuanceId), /imagem recebida é inválida/);
    await assert.rejects(getProfessionalPortfolioImage('fixture', issuanceId), /não está mais disponível/);

    assert.ok(calls.every((call) => call.path === '/api/public/professionals/fixture/portfolio/' + issuanceId + '/content'));
    assert.ok(calls.every((call) => call.credentials === 'omit' && call.cache === 'no-store'));
  });
});
