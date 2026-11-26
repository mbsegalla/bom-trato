import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveReviewInvitation, submitReview } from '@/modules/reviews/services/review.service';
import { mockHttp, success } from '../../support/http.fixture';
const token = 'a'.repeat(64);
describe('public review service', () => {
  it('keeps the private invitation token in a POST body and parses the public response', async (t) => {
    const calls = mockHttp(t, () => success({ reviewerDisplayName: 'Cliente T.', rating: 5, comment: null, createdAt: '2026-01-01T00:00:00Z', verified: true, professionalSlug: 'fixture', customerId: 'private' }));
    const result = await submitReview(token, { rating: 5, comment: null });
    assert.equal(result.rating, 5);
    assert.equal('customerId' in result, false);
    assert.equal(calls[0]?.path, '/api/public/reviews/submit');
    assert.deepEqual(JSON.parse(String(calls[0]?.body)), { token, rating: 5, comment: null });
    assert.equal(calls[0]?.headers.has('Authorization'), false);
  });
  it('distinguishes expired and already used invitations without automatically retrying', async (t) => {
    let status = 410;
    const calls = mockHttp(t, () => new Response(null, { status }));
    await assert.rejects(resolveReviewInvitation(token), /expirou/);
    status = 409;
    await assert.rejects(submitReview(token, { rating: 5, comment: null }), /já foi avaliado/);
    assert.equal(calls.length, 2);
  });
});
