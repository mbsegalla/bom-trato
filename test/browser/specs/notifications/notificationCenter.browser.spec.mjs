import { test, expect, success } from '../../support/api.fixture.mjs';
import {
  date,
  installAuthenticatedApp,
  notification,
  organizationId,
  organizationRoute,
  ticket,
} from '../../support/authenticatedApp.fixture.mjs';

const route = organizationRoute(organizationId, 'notifications');
const secondId = '55555555-5555-4555-8555-555555555555';

function notificationControls(page) {
  const header = page.getByRole('banner');
  const bell = header.getByRole('button', { name: /^Notificações(?:, \d+ não lidas)?$/ });
  const popover = header.getByRole('region', { name: 'Notificações', exact: true });

  return { bell, popover };
}

async function expectClosed(bell, popover) {
  await expect(bell).toHaveAttribute('aria-expanded', 'false');
  await expect(popover).toBeHidden();
}

test('opens and closes notifications and acknowledges all unread items through the scoped hook', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  const items = [notification(), notification({ id: secondId, title: 'Second notification' })];

  let read = false;

  api.respond('GET', route, () => success({
    items: read ? items.map((item) => ({ ...item, readAt: date })) : items,
    unreadCount: read ? 0 : 2,
  }));
  api.respond('POST', route + '/read-all', () => {
    read = true;

    return { status: 204 };
  });

  await page.goto('/customers');

  const { bell, popover } = notificationControls(page);

  await expect(bell).toHaveAccessibleName('Notificações, 2 não lidas');
  await expectClosed(bell, popover);
  await bell.click();
  await expect(bell).toHaveAttribute('aria-expanded', 'true');

  await expect(popover.getByText('Fixture notification', { exact: true })).toBeVisible();
  await expect(popover.getByText('2 não lidas', { exact: true })).toBeVisible();
  await bell.click();
  await expectClosed(bell, popover);

  await bell.click();
  await expect(bell).toHaveAttribute('aria-expanded', 'true');
  await popover.getByRole('button', { name: 'Marcar lidas', exact: true }).click();

  await expect(popover.getByText('Nenhuma notificação não lida', { exact: true })).toBeVisible();
  await expect(popover.getByRole('button', { name: 'Marcar lidas', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === route + '/read-all')).toHaveLength(1);
});

test('refreshes the list when an SSE notification arrives and reconnects using a fresh one-use ticket', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  let unreadCount = 0;
  let issued = 0;
  const nextTicket = 'b'.repeat(43);

  api.respond('GET', route, () => success({
    items: unreadCount > 0 ? [notification()] : [],
    unreadCount,
  }));
  api.respond('POST', route + '/stream-ticket', () => success({
    ticket: ++issued === 1 ? ticket : nextTicket,
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  }));

  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: 'Ainda não há clientes por aqui' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.fixtureEventSources.length)).toBe(1);

  const firstUrl = await page.evaluate(() => window.fixtureEventSources[0].url);

  expect(new URL(firstUrl).pathname).toBe(route + '/stream');
  expect(new URL(firstUrl).searchParams.get('ticket')).toBe(ticket);

  // Wait for the initial list to finish before sending the simulated SSE event.
  const { bell, popover } = notificationControls(page);

  await bell.click();
  await expect(popover.getByText('Tudo tranquilo por aqui', { exact: true })).toBeVisible();
  await bell.click();
  await expectClosed(bell, popover);

  unreadCount = 1;

  await page.evaluate(() => window.fixtureEventSources[0].dispatchEvent(new Event('notifications-changed')));
  await expect(bell).toHaveAccessibleName('Notificações, 1 não lidas');

  await page.evaluate(() => window.fixtureEventSources[0].onerror(new Event('error')));
  await expect.poll(() => page.evaluate(() => window.fixtureEventSources.length)).toBe(2);

  const sources = await page.evaluate(() => window.fixtureEventSources.map(({ url, closed }) => ({ url, closed })));

  expect(sources[0].closed).toBe(true);
  expect(new URL(sources[1].url).searchParams.get('ticket')).toBe(nextTicket);
  expect(api.calls.filter((call) => call.path === route + '/stream-ticket')).toHaveLength(2);
});

test('shows an explicit retry for a failed notification read and acknowledges an individual notification', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  let failed = true;
  let readAt = null;

  api.respond('GET', route, () => failed
    ? { status: 503, json: { success: false } }
    : success({ items: [notification({ readAt })], unreadCount: readAt === null ? 1 : 0 }));
  api.respond('POST', route + '/' + notification().id + '/read', () => {
    readAt = date;

    return { status: 204 };
  });

  await page.goto('/customers');

  const { bell, popover } = notificationControls(page);

  await bell.click();
  await expect(bell).toHaveAttribute('aria-expanded', 'true');

  await expect(popover.getByRole('alert').filter({ hasText: 'Não foi possível carregar suas notificações.' })).toBeVisible();

  failed = false;

  await popover.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(popover.getByText('Fixture notification', { exact: true })).toBeVisible();
  await popover.getByRole('button', { name: /Fixture notification/ }).click();

  await expect.poll(() => api.calls.filter((call) => call.path === route + '/' + notification().id + '/read').length).toBe(1);
  await expect(bell).toHaveAccessibleName('Notificações');
  await expectClosed(bell, popover);
});
