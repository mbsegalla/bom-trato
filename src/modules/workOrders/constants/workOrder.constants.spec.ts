import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canCancelWorkOrder, isWorkOrderPlanningEditable } from './workOrder.constants';

describe('work order action availability', () => {
  it('only allows planning before execution and prevents canceling terminal orders', () => {
    assert.equal(isWorkOrderPlanningEditable('OPEN'), true);
    assert.equal(isWorkOrderPlanningEditable('SCHEDULED'), true);
    assert.equal(isWorkOrderPlanningEditable('IN_PROGRESS'), false);
    for (const status of ['COMPLETED', 'CANCELED'] as const) {
      assert.equal(canCancelWorkOrder(status), false);
      assert.equal(isWorkOrderPlanningEditable(status), false);
    }
  });
});
