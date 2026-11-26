import { success } from './api.fixture.mjs';
import { date, organizationId, organizationRoute, userId } from './authenticatedApp.fixture.mjs';
import { pageResult } from './operationalRecords.fixture.mjs';

export const memberId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const invitationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const memberUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const planPriceId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const profileRoute = organizationRoute(organizationId, 'profile');
export const automationRoute = organizationRoute(organizationId, 'notifications/automation-events');
export const membersRoute = organizationRoute(organizationId, 'members');
export const invitationsRoute = organizationRoute(organizationId, 'invitations');
export const billingRoute = organizationRoute(organizationId, 'billing');

export function member(overrides = {}) {
  return {
    id: memberId,
    userId: memberUserId,
    role: 'MEMBER',
    createdAt: date,
    user: { name: 'Fixture member' },
    ...overrides,
  };
}

export const ownerMember = member({
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  userId,
  role: 'OWNER',
  user: { name: 'Fixture owner' },
});

export function invitation(overrides = {}) {
  return {
    id: invitationId,
    organizationId,
    email: 'member@example.invalid',
    status: 'PENDING',
    expiresAt: '2030-01-02T00:00:00Z',
    lastSentAt: date,
    acceptedAt: null,
    revokedAt: null,
    createdAt: date,
    ...overrides,
  };
}

export function entitlements(overrides = {}) {
  return {
    hasAccess: true,
    maxUsers: 3,
    memberCount: 1,
    teamManagementEnabled: true,
    canAddMember: true,
    ...overrides,
  };
}

export function businessProfile(overrides = {}) {
  return {
    id: organizationId,
    name: 'Fixture business',
    email: null,
    logoUrl: null,
    phone: null,
    documentType: null,
    document: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    defaultReceivableDueDays: 7,
    autoQuoteFollowUpEnabled: false,
    autoWorkOrderReminderEnabled: false,
    autoReviewRequestEnabled: false,
    autoReceivableReminderEnabled: false,
    ...overrides,
  };
}

export function automationEvent(overrides = {}) {
  return {
    id: invitationId,
    type: 'QUOTE_FOLLOW_UP',
    entityType: 'QUOTE',
    entityId: memberId,
    description: 'Fixture quote reminder',
    href: '/quotes/' + memberId,
    status: 'ACCEPTED',
    availableAt: date,
    createdAt: date,
    finishedAt: date,
    lastErrorCode: null,
    ...overrides,
  };
}

export function subscription(overrides = {}) {
  return {
    id: memberId,
    organizationId,
    planPriceId,
    status: 'ACTIVE',
    currentPeriodStart: date,
    currentPeriodEnd: '2030-01-01T00:00:00Z',
    paidThrough: '2030-01-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    hasAccess: true,
    ...overrides,
  };
}

export const plan = {
  id: invitationId,
  code: 'FIXTURE',
  name: 'Fixture professional',
  description: 'Fixture plan description',
  maxUsers: 3,
  teamManagementEnabled: true,
  prices: [{ id: planPriceId, amountInCents: 5990, currency: 'brl', interval: 'MONTH', intervalCount: 1 }],
};

export function invoice(overrides = {}) {
  return {
    id: memberId,
    number: 'FIX-001',
    status: 'paid',
    currency: 'brl',
    amountDue: 5990,
    amountPaid: 5990,
    hostedInvoiceUrl: null,
    invoicePdf: null,
    paidAt: date,
    stripeCreatedAt: date,
    ...overrides,
  };
}

export function installTeam(api, readMembers, readInvitations, readEntitlements = () => entitlements()) {
  api.respond('GET', membersRoute, () => success(pageResult(readMembers())));
  api.respond('GET', invitationsRoute, () => success(pageResult(readInvitations())));
  api.respond('GET', billingRoute + '/entitlements', () => success(readEntitlements()));
}

export function installBilling(api, readSubscription, readInvoices = () => ({ items: [], nextCursor: null })) {
  api.respond('GET', billingRoute + '/subscription', () => success(readSubscription()));
  api.respond('GET', billingRoute + '/entitlements', () => success(entitlements()));
  api.respond('GET', billingRoute + '/payment-method', () => success({ brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030 }));
  api.respond('GET', billingRoute + '/invoices', ({ query }) => success(readInvoices(query)));
  api.respond('GET', '/api/plans', () => success([plan]));
}

export function apiError(status, code) {
  return { status, json: { statusCode: status, success: false, error: { code, message: code } } };
}
