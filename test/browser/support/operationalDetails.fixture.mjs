import { success } from './api.fixture.mjs';
import { date, organizationId, organizationRoute, userId } from './authenticatedApp.fixture.mjs';
import {
  pageResult,
  quote,
  quoteId,
  receivable,
  receivableId,
  workOrder,
  workOrderId,
} from './operationalRecords.fixture.mjs';

export const quoteRoute = organizationRoute(organizationId, 'quotes/' + quoteId);
export const workOrderRoute = organizationRoute(organizationId, 'work-orders/' + workOrderId);
export const receivableRoute = organizationRoute(organizationId, 'receivables/' + receivableId);
export const paymentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const quoteItemId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const orderItemId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const memberId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const historyId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const item = {
  name: 'Fixture installation',
  description: null,
  unit: 'SERVICE',
  quantityInThousandths: 1000,
  unitAmountInCents: 12550,
  totalInCents: 12550,
  position: 0,
};

export function quoteDetails(overrides = {}) {
  return quote({
    customerEmail: null,
    customerPhone: '34999991234',
    notes: null,
    discountInCents: 0,
    subtotalInCents: 12550,
    paymentCondition: 'AFTER_COMPLETION',
    downPaymentPercentage: null,
    sentAt: null,
    decidedAt: null,
    canceledAt: null,
    createdById: userId,
    updatedById: userId,
    items: [{ ...item, id: quoteItemId, catalogServiceId: null }],
    changeRequest: null,
    ...overrides,
  });
}

export function orderDetails(overrides = {}) {
  return workOrder({
    customerEmail: 'fixture@example.invalid',
    customerPhone: '34999991234',
    instructions: null,
    serviceAddress: null,
    executionNotes: null,
    subtotalInCents: 12550,
    discountInCents: 0,
    startedAt: null,
    completedAt: null,
    canceledAt: null,
    cancellationReason: null,
    createdById: userId,
    updatedById: userId,
    items: [{ ...item, id: orderItemId, sourceQuoteItemId: quoteItemId }],
    ...overrides,
  });
}

export function payment(overrides = {}) {
  return {
    id: paymentId,
    receivableId,
    requestId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    amountInCents: 3000,
    method: 'PIX',
    receivedAt: date,
    notes: null,
    recordedById: userId,
    createdAt: date,
    reversedAt: null,
    reversedById: null,
    reversalReason: null,
    ...overrides,
  };
}

export function installQuoteDetails(api, read) {
  api.respond('GET', quoteRoute, () => success(read()));
  api.respond('GET', quoteRoute + '/status-history', () => {
    const quote = read();

    return success([
      {
        id: historyId,
        quoteId,
        fromStatus: quote.version === 1 ? null : 'SENT',
        toStatus: quote.status,
        actorId: userId,
        version: quote.version,
        createdAt: date,
      },
    ]);
  });
}

export function installWorkOrderDetails(api, read) {
  api.respond('GET', workOrderRoute, () => success(read()));
  api.respond('GET', organizationRoute(organizationId, 'members'), () =>
    success(pageResult([{ id: memberId, userId, role: 'OWNER', createdAt: date, user: { name: 'Fixture owner' } }])),
  );
  api.respond('GET', workOrderRoute + '/share', () => success(null));
  api.respond('GET', workOrderRoute + '/checklist', () => success({ items: [], progress: { total: 0, completed: 0 } }));
  api.respond('GET', workOrderRoute + '/photos', () => success([]));
  api.respond('GET', workOrderRoute + '/portfolio', () => success({ photos: [] }));
  api.respond('GET', workOrderRoute + '/acceptance', () => success({ receipt: null }));
  api.respond('GET', workOrderRoute + '/warranty', () => success({ warranty: null, locked: false }));
  api.respond('GET', workOrderRoute + '/recurrence', () =>
    success({
      recurrence: null,
      canConfigure: true,
      customerArchived: false,
      today: '2026-01-01',
      completedOn: '2026-01-01',
    }),
  );
  api.respond('GET', workOrderRoute + '/status-history', () => success([]));
  api.respond('GET', workOrderRoute + '/schedule-history', () => success(pageResult()));
}

export function installReceivableDetails(api, read, readPayments = () => []) {
  api.respond('GET', receivableRoute, () => success(read()));
  api.respond('GET', receivableRoute + '/payments', () => success(pageResult(readPayments())));

  function pixView() {
    return {
      organizationId,
      receivableId,
      receivableVersion: read().version,
      available: false,
      canIssue: false,
      status: 'NOT_ISSUED',
      issuanceId: null,
      amountInCents: null,
      paymentId: null,
      expiresAt: null,
      copyAndPaste: null,
    };
  }

  api.respond('GET', receivableRoute + '/mercado-pago/sandbox-pix', () => success({ ...pixView(), liveMode: false }));
  api.respond('GET', receivableRoute + '/mercado-pago/live-pix', () =>
    success({
      ...pixView(),
      liveMode: true,
      canRecover: false,
      reviewCode: null,
      lastRecoveryCode: null,
      nextRecoveryAt: null,
      lastWebhookCode: null,
    }),
  );
  api.respond('GET', receivableRoute + '/payment-link', () => success(null));
}

export function unpaidReceivable(overrides = {}) {
  return receivable({
    status: 'OPEN',
    receivedInCents: 0,
    balanceInCents: 12550,
    ...overrides,
  });
}
