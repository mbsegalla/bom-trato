import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { publicWorkOrderAcceptanceReceiptSchema, workOrderAcceptanceFormSchema, workOrderAcceptanceSnapshotHashSchema } from './workOrderAcceptance.schema';

describe('work order acceptance', () => {
  it('requires explicit consent and normalizes signer whitespace', () => {
    assert.deepEqual(workOrderAcceptanceFormSchema.parse({ signerName: ' Cliente   Teste ', consent: true }), { signerName: 'Cliente Teste', consent: true });
    assert.equal(workOrderAcceptanceFormSchema.safeParse({ signerName: 'Cliente', consent: false }).success, false);
    assert.equal(workOrderAcceptanceSnapshotHashSchema.safeParse('a'.repeat(64)).success, true);
    assert.equal(workOrderAcceptanceSnapshotHashSchema.safeParse('invalid').success, false);
  });
  it('does not expose private signer information through a public receipt', () => {
    const date = '2026-01-01T00:00:00Z';
    const result = publicWorkOrderAcceptanceReceiptSchema.parse({ acceptedAt: date, completedAt: date, signerName: 'Private' });
    assert.deepEqual(Object.keys(result).sort(), ['acceptedAt', 'completedAt']);
  });
});
