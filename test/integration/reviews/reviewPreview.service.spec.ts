import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveReviewInvitation, submitReview } from '@/modules/reviews/services/review.service';

import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);
const date = '2030-01-01T00:00:00.000Z';
const preview = {
  businessName: 'Fixture business',
  logoUrl: null,
  professionalSlug: 'fixture',
  workOrderTitle: 'Fixture service',
  reviewerDisplayName: 'Cliente T.',
  expiresAt: date,
};

describe('review preview and response contracts', () => {
  it('parses only public preview fields and does not send the invitation token in the URL', async (t) => {
    const calls = mockHttp(t, () => success({ ...preview, customerId: 'private', email: 'private@example.invalid' }));

    const result = await resolveReviewInvitation(token);

    assert.deepEqual(result, { ...preview, expiresAt: new Date(date) });
    assert.equal(calls[0]?.method, 'POST');
    assert.equal(calls[0]?.path, '/api/public/reviews/resolve');
    assert.deepEqual(JSON.parse(String(calls[0]?.body)), { token });
    assert.equal(calls[0]?.headers.has('Authorization'), false);
  });

  it('rejects malformed previews and invalid submitted ratings', async (t) => {
    mockHttp(t, (call) =>
      call.path.endsWith('/resolve')
        ? success({ ...preview, expiresAt: 'invalid' })
        : success({
            reviewerDisplayName: 'Cliente T.',
            rating: 6,
            comment: null,
            createdAt: date,
            verified: true,
            professionalSlug: 'fixture',
          }),
    );

    await assert.rejects(resolveReviewInvitation(token), /interpretar/);
    await assert.rejects(submitReview(token, { rating: 5, comment: null }), /interpretar/);
  });

  it('distinguishes invalid links and generic submission failures without implicit retries', async (t) => {
    const calls = mockHttp(t, () => new Response(null, { status: 500 }));

    await assert.rejects(resolveReviewInvitation(token), /não é válido/);
    await assert.rejects(submitReview(token, { rating: 4, comment: 'Fixture' }), /enviar sua avaliação/);
    assert.equal(calls.length, 2);
  });
});
