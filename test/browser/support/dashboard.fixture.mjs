import { success } from './api.fixture.mjs';
import { customerId, date, organizationId, organizationRoute, userId } from './authenticatedApp.fixture.mjs';
import { pageResult, quote, workOrderId } from './operationalRecords.fixture.mjs';

export function installDashboard(api, options = {}) {
  const id = options.organizationId ?? organizationId;
  const empty = options.empty ?? false;
  const root = organizationRoute(id, 'dashboard');
  const summary = {
    quotes: { draft: empty ? 0 : 2, awaitingApproval: empty ? 0 : 1, expiredSent: empty ? 0 : 2 },
    workOrders: { open: empty ? 0 : 1, scheduled: empty ? 0 : 2, inProgress: empty ? 0 : 3, completedInPeriod: empty ? 0 : 4 },
  };

  api.respond('GET', root + '/summary', ({ query }) => success({
    generatedAt: date,
    period: { from: query.from, to: query.to },
    ...summary,
  }));
  api.respond('GET', root + '/financial', ({ query }) => {
    if (options.financialUnavailable?.()) {
      return { status: 503, json: { success: false } };
    }

    return success({
      generatedAt: date,
      currency: 'brl',
      period: { from: query.from, to: query.to },
      currentReceivables: {
        pendingCount: empty ? 0 : 3,
        pendingAmountInCents: empty ? 0 : 45678,
        overdueCount: empty ? 0 : 1,
        overdueAmountInCents: empty ? 0 : 12345,
      },
      periodReceipts: { count: empty ? 0 : 2, amountInCents: empty ? 0 : 98765 },
    });
  });
  api.respond('GET', root + '/financial-trend', ({ query }) => {
    const start = new Date(query.from);
    const items = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(start);

      month.setUTCMonth(month.getUTCMonth() + index);

      return {
        periodStart: month.toISOString(),
        count: empty ? 0 : index === 5 ? 2 : 0,
        amountInCents: empty ? 0 : index === 5 ? 98765 : 0,
      };
    });

    return success({
      generatedAt: date,
      currency: 'brl',
      period: { from: query.from, to: query.to },
      items,
    });
  });
  api.respond('GET', root + '/upcoming-work-orders', () => success({
    generatedAt: date,
    items: empty ? [] : [{
      id: workOrderId,
      customerId,
      customerName: 'Fixture customer',
      title: 'Fixture upcoming service',
      serviceAddress: null,
      scheduledStartAt: '2030-01-01T12:00:00Z',
      scheduledEndAt: '2030-01-01T13:00:00Z',
      assignedTo: { id: userId, name: 'Fixture technician' },
    }],
    hasMore: false,
  }));
  api.respond('GET', organizationRoute(id, 'quotes'), () => {
    if (options.quotesUnavailable) return { status: 503, json: { success: false } };

    return success(pageResult(empty ? [] : [quote({ organizationId: id })]));
  });
}
