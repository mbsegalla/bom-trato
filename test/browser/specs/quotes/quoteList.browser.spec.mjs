import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { pageResult, quote, quoteId } from '../../support/operationalRecords.fixture.mjs';

const route = organizationRoute(organizationId, 'quotes');

test('lists paginated quotes and resets pagination when the approval filter changes', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, ({ query }) => {
    const current = Number(query.page);

    if (query.status === 'APPROVED') {
      return success(pageResult([quote({ title: 'Approved quote', status: 'APPROVED' })]));
    }

    return success(
      pageResult([quote({ title: current === 1 ? 'First quote' : 'Second quote' })], current, current === 1),
    );
  });

  await page.goto('/quotes');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Orçamentos', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'First quote', exact: true })).toHaveAttribute(
    'href',
    '/quotes/' + quoteId,
  );
  await expect(main.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  await main.getByRole('button', { name: 'Próxima página' }).click();
  await expect(main.getByRole('link', { name: 'Second quote', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Próxima página' })).toBeDisabled();

  const approved = main
    .getByRole('group', { name: 'Status dos orçamentos' })
    .getByRole('button', { name: 'Aprovados' });

  await approved.click();
  await expect(approved).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('link', { name: 'Approved quote', exact: true })).toBeVisible();

  const calls = api.calls.filter((call) => call.path === route);

  expect(calls.map(({ query }) => [query.page, query.status ?? 'ALL'])).toEqual([
    ['1', 'ALL'],
    ['2', 'ALL'],
    ['1', 'APPROVED'],
  ]);
  expect(calls.every((call) => call.headers.authorization === 'Bearer fixture-access')).toBe(true);
});

test('distinguishes an expired sent quote from a previously approved quote', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  const past = '2020-01-01T00:00:00.000Z';

  api.respond('GET', route, () =>
    success(
      pageResult([
        quote({ title: 'Expired quote', status: 'SENT', validUntil: past }),
        quote({
          id: '99999999-9999-4999-8999-999999999999',
          title: 'Approved quote',
          status: 'APPROVED',
          validUntil: past,
        }),
      ]),
    ),
  );

  await page.goto('/quotes');

  const table = page.getByRole('main').getByRole('table');
  const expired = table.getByRole('row').filter({ hasText: 'Expired quote' });
  const approved = table.getByRole('row').filter({ hasText: 'Approved quote' });

  await expect(expired.getByText('Expirado', { exact: true })).toBeVisible();
  await expect(approved.getByText('Aprovado', { exact: true })).toBeVisible();
  await expect(approved.getByText('Expirado', { exact: true })).toHaveCount(0);
});

test('shows a recovery action after an unavailable quote list and then the genuine empty state', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  let unavailable = true;

  api.respond('GET', route, () => (unavailable ? { status: 503, json: { success: false } } : success(pageResult())));

  await page.goto('/quotes');

  const main = page.getByRole('main');

  await expect(
    main.getByText('Os orçamentos estão sendo atualizados. Tente novamente em instantes.', { exact: true }),
  ).toBeVisible();
  unavailable = false;

  await main.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(main.getByRole('heading', { name: 'Nenhum orçamento por aqui' })).toBeVisible();
  expect(api.calls.filter((call) => call.path === route)).toHaveLength(2);
});
