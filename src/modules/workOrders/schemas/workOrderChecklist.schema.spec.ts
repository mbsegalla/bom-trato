import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { publicWorkOrderChecklistItemSchema, workOrderChecklistFormSchema } from './workOrderChecklist.schema';

describe('work order checklist', () => {
  it('validates trimmed titles and enforces the length limit', () => {
    assert.equal(workOrderChecklistFormSchema.parse({ title: ' Verificar ' }).title, 'Verificar');
    assert.equal(workOrderChecklistFormSchema.safeParse({ title: ' ' }).success, false);
    assert.equal(workOrderChecklistFormSchema.safeParse({ title: 'a'.repeat(201) }).success, false);
  });

  it('omits internal actor and visibility fields from a public item', () => {
    const item = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Verify',
      completed: false,
      completedAt: null
    };

    assert.deepEqual(
      publicWorkOrderChecklistItemSchema.parse({
        ...item,
        completedById: 'private',
        visibleInPortal: true
      }),
      item
    );
  });
});
