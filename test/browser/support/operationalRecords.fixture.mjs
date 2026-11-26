import { customerId, date, organizationId, userId } from './authenticatedApp.fixture.mjs';

export const quoteId = '55555555-5555-4555-8555-555555555555';
export const workOrderId = '66666666-6666-4666-8666-666666666666';
export const receivableId = '77777777-7777-4777-8777-777777777777';
export const serviceId = '88888888-8888-4888-8888-888888888888';

const base = {
  organizationId,
  customerId,
  customerName: 'Fixture customer',
  currency: 'brl',
  version: 1,
  createdAt: date,
  updatedAt: date,
};

export function quote(overrides = {}) {
  return {
    ...base,
    id: quoteId,
    title: 'Fixture quote',
    status: 'DRAFT',
    totalInCents: 12550,
    validUntil: null,
    ...overrides,
  };
}

export function workOrder(overrides = {}) {
  return {
    ...base,
    id: workOrderId,
    quoteId,
    title: 'Fixture work order',
    status: 'OPEN',
    assignedToId: null,
    assignedToName: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    totalInCents: 12550,
    ...overrides,
  };
}

export function receivable(overrides = {}) {
  return {
    ...base,
    id: receivableId,
    workOrderId,
    kind: 'FULL',
    title: 'Fixture receivable',
    amountInCents: 12550,
    receivedInCents: 2550,
    balanceInCents: 10000,
    status: 'PARTIALLY_PAID',
    overdue: false,
    dueAt: '2030-01-01T00:00:00.000Z',
    notes: null,
    canceledAt: null,
    canceledById: null,
    cancellationReason: null,
    createdById: userId,
    updatedById: userId,
    ...overrides,
  };
}

export function catalogService(overrides = {}) {
  return {
    id: serviceId,
    organizationId,
    name: 'Fixture service',
    description: null,
    unit: 'SERVICE',
    amountInCents: 12550,
    estimatedDurationMinutes: 90,
    currency: 'brl',
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

export function pageResult(items = [], page = 1, hasMore = false) {
  return { items, page, hasMore };
}

export function financialSummary(query) {
  return {
    generatedAt: date,
    currency: 'brl',
    period: { from: query.from, to: query.to },
    currentReceivables: {
      pendingCount: 3,
      pendingAmountInCents: 45678,
      overdueCount: 1,
      overdueAmountInCents: 12345,
    },
    periodReceipts: { count: 2, amountInCents: 98765 },
  };
}
