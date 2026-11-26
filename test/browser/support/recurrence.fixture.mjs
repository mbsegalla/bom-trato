import { customerId, organizationId, organizationRoute } from './authenticatedApp.fixture.mjs';
import { workOrderId } from './operationalRecords.fixture.mjs';

export const today = '2026-01-15';
export const recurrenceRoute = organizationRoute(organizationId, 'work-orders/' + workOrderId + '/recurrence');
export const listRoute = organizationRoute(organizationId, 'work-order-recurrences');

export function recurrence(overrides = {}) {
  return {
    intervalUnit: 'MONTH',
    intervalCount: 1,
    nextVisitOn: '2026-01-16',
    enabled: true,
    autoGenerateEnabled: true,
    version: 1,
    lastGeneratedQuoteId: null,
    lastGeneratedVisitOn: null,
    ...overrides,
  };
}

export function recurrenceItem(overrides = {}) {
  return {
    workOrderId,
    title: 'Fixture recurring service',
    customerId,
    customerName: 'Fixture customer',
    customerArchived: false,
    recurrence: recurrence(),
    ...overrides,
  };
}

export function recurrenceView(overrides = {}) {
  return {
    recurrence: recurrence(),
    canConfigure: true,
    customerArchived: false,
    today,
    completedOn: '2026-01-01',
    ...overrides,
  };
}

export function recurrencePage(items, overrides = {}) {
  return {
    items,
    page: 1,
    hasMore: false,
    today,
    canConfigure: true,
    ...overrides,
  };
}
