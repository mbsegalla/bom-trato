import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { submittedReviewSchema } from './review.schema';

describe('review response', () => {
  const input = {
    reviewerDisplayName: 'Cliente T.',
    rating: 5,
    comment: null,
    createdAt: '2026-01-01T00:00:00Z',
    verified: true,
    professionalSlug: 'empresa',
  };

  it('rejects invalid ratings and strips customer details', () => {
    assert.equal('customerName' in submittedReviewSchema.parse({ ...input, customerName: 'Private' }), false);

    for (const rating of [0, 6, 4.5])
      assert.equal(submittedReviewSchema.safeParse({ ...input, rating }).success, false);
  });
});
