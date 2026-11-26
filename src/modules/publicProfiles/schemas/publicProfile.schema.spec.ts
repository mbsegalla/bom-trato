import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { publicProfileFormSchema, publicProfessionalReviewSchema } from './publicProfile.schema';

describe('public profile and review privacy', () => {
  it('requires valid WhatsApp contact before publication and validates slugs', () => {
    const input = {
      slug: 'empresa-teste',
      headline: '',
      description: '',
      whatsappPhone: '',
      whatsappEnabled: false,
      published: false,
      serviceIds: []
    };

    assert.equal(publicProfileFormSchema.safeParse(input).success, true);
    assert.equal(publicProfileFormSchema.safeParse({ ...input, published: true }).success, false);
    assert.equal(publicProfileFormSchema.safeParse({ ...input, whatsappEnabled: true }).success, false);
    assert.equal(publicProfileFormSchema.safeParse({ ...input, slug: '../unsafe' }).success, false);
  });

  it('does not accept unverified reviews or retain internal customer IDs', () => {
    const input = {
      id: '11111111-1111-4111-8111-111111111111',
      reviewerDisplayName: 'Cliente T.',
      rating: 5,
      comment: null,
      createdAt: '2026-01-01T00:00:00Z',
      verified: true
    };
    const result = publicProfessionalReviewSchema.parse({ ...input, customerId: 'private' });

    assert.equal('customerId' in result, false);
    assert.equal(publicProfessionalReviewSchema.safeParse({ ...input, verified: false }).success, false);
  });
});
