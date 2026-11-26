import { date, organizationId } from './authenticatedApp.fixture.mjs';
import { receivableRoute } from './operationalDetails.fixture.mjs';
import { receivableId } from './operationalRecords.fixture.mjs';

export const liveRoute = receivableRoute + '/mercado-pago/live-pix';
export const sandboxRoute = receivableRoute + '/mercado-pago/sandbox-pix';
export const issuanceId = 'abababab-abab-4bab-8bab-abababababab';
// Deliberately nonpayable fixture text matching only the API response envelope.
export const fixtureCode = '000201FIXTURE-ONLY-NOT-PAYABLE6304ABCD';

function base(overrides = {}) {
  return {
    organizationId,
    receivableId,
    receivableVersion: 1,
    available: true,
    canIssue: true,
    status: 'NOT_ISSUED',
    issuanceId: null,
    amountInCents: null,
    paymentId: null,
    expiresAt: null,
    copyAndPaste: null,
    ...overrides,
  };
}

export function livePix(overrides = {}) {
  return base({
    liveMode: true,
    canRecover: false,
    reviewCode: null,
    lastRecoveryCode: null,
    nextRecoveryAt: null,
    lastWebhookCode: null,
    ...overrides,
  });
}

export function sandboxPix(overrides = {}) {
  return base({ liveMode: false, ...overrides });
}

export function pendingFields(overrides = {}) {
  return {
    canIssue: false,
    status: 'PENDING',
    issuanceId,
    amountInCents: 12550,
    paymentId: '123456',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    copyAndPaste: fixtureCode,
    ...overrides,
  };
}

export function reviewFields(overrides = {}) {
  return {
    canIssue: false,
    status: 'REVIEW_REQUIRED',
    issuanceId,
    amountInCents: 12550,
    ...overrides,
  };
}

export function sandboxReview(overrides = {}) {
  return {
    organizationId,
    receivableId,
    issuanceId,
    canRecover: true,
    nextRecoveryAt: null,
    lastAttempt: null,
    lastWebhook: null,
    ...overrides,
  };
}

export function notFoundAttempt() {
  return { status: 'NOT_FOUND', startedAt: date, completedAt: date, paymentId: null };
}
