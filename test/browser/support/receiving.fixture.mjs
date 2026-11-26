import { success } from './api.fixture.mjs';
import { date, organizationId, organizationRoute } from './authenticatedApp.fixture.mjs';

export const settingsRoute = organizationRoute(organizationId, 'receiving-settings');
export const connectionRoute = organizationRoute(organizationId, 'mercado-pago/connection');

export function receivingSettings(overrides = {}) {
  return {
    pixEnabled: false,
    pixKeyType: null,
    pixKey: null,
    merchantName: null,
    merchantCity: null,
    version: 0,
    canConfigure: true,
    encryptionAvailable: true,
    ...overrides,
  };
}

export function configuredPix(overrides = {}) {
  return receivingSettings({
    pixEnabled: true,
    pixKeyType: 'EMAIL',
    pixKey: 'fixture@example.invalid',
    merchantName: 'Fixture business',
    merchantCity: 'Uberlandia',
    version: 1,
    ...overrides,
  });
}

export function connection(overrides = {}) {
  return {
    available: true,
    liveMode: false,
    canConnect: true,
    canDisconnect: false,
    status: 'NOT_CONNECTED',
    accountId: null,
    connectedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

export function connectedAccount(overrides = {}) {
  return connection({
    canDisconnect: true,
    status: 'CONNECTED',
    accountId: '123456789',
    connectedAt: date,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
  });
}

export function installReceiving(api, readSettings = () => receivingSettings(), readConnection = () => connection()) {
  api.respond('GET', settingsRoute, () => success(readSettings()));
  api.respond('GET', connectionRoute, () => success(readConnection()));
}
