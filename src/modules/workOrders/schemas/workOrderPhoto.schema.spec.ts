import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { workOrderPhotoFormSchema } from './workOrderPhoto.schema';

describe('work order photo form', () => {
  it('normalizes empty captions and requires explicit visibility', () => {
    assert.deepEqual(workOrderPhotoFormSchema.parse({ stage: 'BEFORE', caption: ' ', visibleInPortal: false }), { stage: 'BEFORE', caption: null, visibleInPortal: false });
    assert.equal(workOrderPhotoFormSchema.safeParse({ stage: 'BEFORE', caption: '' }).success, false);
    assert.equal(workOrderPhotoFormSchema.safeParse({ stage: 'UNKNOWN', caption: '', visibleInPortal: false }).success, false);
    assert.equal(workOrderPhotoFormSchema.safeParse({ stage: 'AFTER', caption: 'a'.repeat(241), visibleInPortal: false }).success, false);
  });
});
