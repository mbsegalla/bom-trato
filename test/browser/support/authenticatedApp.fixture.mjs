import { success } from './api.fixture.mjs';

export const organizationId = '11111111-1111-4111-8111-111111111111';
export const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
export const userId = '33333333-3333-4333-8333-333333333333';
export const customerId = '44444444-4444-4444-8444-444444444444';
export const ticket = 'a'.repeat(43);
export const date = '2026-01-01T00:00:00.000Z';

export const organization = {
  id: organizationId,
  name: 'Fixture business',
  logoUrl: null,
  role: 'OWNER',
};

export const user = {
  id: userId,
  name: 'Fixture owner',
  email: 'owner@example.invalid',
  emailVerified: true,
  selectedPlanPriceId: null,
};

export function organizationRoute(id, suffix) {
  return '/api/organizations/' + id + '/' + suffix;
}

export function onboarding(id, overrides = {}) {
  return {
    step: 'APP',
    organizationId: id,
    selectedPlanPriceId: null,
    accessSource: 'SUBSCRIPTION',
    trialEligible: false,
    trial: null,
    ...overrides,
  };
}

export function customer(overrides = {}) {
  return {
    id: customerId,
    organizationId,
    name: 'Fixture customer',
    email: null,
    phone: '34999991234',
    defaultServiceAddress: null,
    notes: null,
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

export function notification(overrides = {}) {
  return {
    id: customerId,
    organizationId,
    type: 'PAYMENT_FAILED',
    title: 'Fixture notification',
    message: 'Fixture message',
    href: '/customers',
    readAt: null,
    createdAt: date,
    ...overrides,
  };
}

export async function installAuthenticatedApp(page, api, options = {}) {
  // Exercise the real React hooks without an actual SSE server or reconnecting
  // external clients. Individual specs can deliver events through this transport.
  await page.addInitScript(() => {
    window.fixtureEventSources = [];

    window.EventSource = class extends EventTarget {
      constructor(url) {
        super();
        this.url = String(url);
        this.closed = false;
        this.onopen = null;
        this.onerror = null;
        window.fixtureEventSources.push(this);
      }

      close() {
        this.closed = true;
      }
    };
  });

  const organizations = options.organizations ?? [organization];

  api.respond('GET', '/api/auth/csrf', () => success({ csrfToken: 'fixture-csrf' }));
  api.respond('POST', '/api/auth/refresh', () => success({
    accessToken: 'fixture-access',
    expiresIn: 3600,
    tokenType: 'Bearer',
    csrfToken: 'fixture-csrf',
  }));
  api.respond('GET', '/api/auth/me', () => success(user));
  api.respond('GET', '/api/organizations/mine', () => success({
    page: 1,
    hasMore: false,
    items: organizations,
  }));
  api.respond('GET', '/api/onboarding', (call) => success(
    options.onboarding?.(call.query.organizationId) ?? onboarding(call.query.organizationId),
  ));

  for (const item of organizations) {
    api.respond('GET', organizationRoute(item.id, 'customers'), () => success({
      items: [],
      page: 1,
      hasMore: false,
    }));
    api.respond('GET', organizationRoute(item.id, 'notifications'), () => success({
      items: [],
      unreadCount: 0,
    }));
    api.respond('POST', organizationRoute(item.id, 'notifications/stream-ticket'), () => success({
      ticket,
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    }));
  }
}
