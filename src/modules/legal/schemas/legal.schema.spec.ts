import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { currentLegalDocumentsResponseSchema } from './legal.schema';

describe('legal document contract', () => {
  it('requires both versioned legal documents before acceptance', () => {
    const terms = { version: '2026-01', effectiveAt: '2026-01-01T00:00:00Z', path: '/terms' };
    const privacy = { ...terms, path: '/privacy' };
    assert.equal(currentLegalDocumentsResponseSchema.safeParse({ statusCode: 200, success: true, data: { terms, privacy } }).success, true);
    assert.equal(currentLegalDocumentsResponseSchema.safeParse({ statusCode: 200, success: true, data: { terms } }).success, false);
    assert.equal(currentLegalDocumentsResponseSchema.safeParse({ statusCode: 200, success: true, data: { terms: { ...terms, version: '' }, privacy } }).success, false);
  });
});
