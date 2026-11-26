import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dashboardFinancialSchema } from './dashboard.schema';

describe('dashboard financial response', () => {
  it('accepts zero balances and rejects negative or fractional monetary totals', () => {
    const date = '2026-01-01T00:00:00Z';
    const data = {
      generatedAt: date,
      currency: 'brl',
      period: { from: date, to: date },
      currentReceivables: {
        pendingCount: 0,
        pendingAmountInCents: 0,
        overdueCount: 0,
        overdueAmountInCents: 0,
      },
      periodReceipts: { count: 0, amountInCents: 0 },
    };

    assert.equal(dashboardFinancialSchema.safeParse({ statusCode: 200, success: true, data }).success, true);

    for (const amountInCents of [-1, 1.5])
      assert.equal(
        dashboardFinancialSchema.safeParse({
          statusCode: 200,
          success: true,
          data: {
            ...data,
            periodReceipts: { count: 1, amountInCents },
          },
        }).success,
        false,
      );
  });
});
