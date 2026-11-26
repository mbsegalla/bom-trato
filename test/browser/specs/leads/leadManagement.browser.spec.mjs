import { test, expect, success } from '../../support/api.fixture.mjs';
import {
  customerId,
  date,
  installAuthenticatedApp,
  organizationId,
  organizationRoute,
} from '../../support/authenticatedApp.fixture.mjs';
import { installQuoteDetails, quoteDetails } from '../../support/operationalDetails.fixture.mjs';
import { pageResult, quoteId } from '../../support/operationalRecords.fixture.mjs';

const leadId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const route = organizationRoute(organizationId, 'leads');
const detailRoute = route + '/' + leadId;

function lead(overrides = {}) {
  return {
    id: leadId,
    organizationId,
    catalogServiceId: null,
    requestedServiceName: 'Fixture installation',
    name: 'Fixture customer',
    email: 'client@example.invalid',
    phone: '34999991234',
    message: 'Fixture request for service',
    status: 'NEW',
    convertedCustomerId: null,
    convertedQuoteId: null,
    contactedAt: null,
    convertedAt: null,
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

test('paginates opportunities and combines a trimmed search with the selected status', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', route, ({ query }) => {
    const current = Number(query.page);

    if (query.search) return success(pageResult());
    if (query.status === 'CONTACTED') {
      return success(pageResult([lead({ name: 'Contacted customer', status: 'CONTACTED' })]));
    }

    return success(pageResult([lead({
      name: current === 1 ? 'First opportunity' : 'Second opportunity',
    })], current, current === 1));
  });

  await page.goto('/leads');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Oportunidades', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'First opportunity', exact: true })).toHaveAttribute('href', '/leads/' + leadId);
  await main.getByRole('button', { name: 'Próxima página' }).click();
  await expect(main.getByRole('link', { name: 'Second opportunity', exact: true })).toBeVisible();

  const contacted = main.getByRole('group', { name: 'Status das oportunidades' }).getByRole('button', { name: 'Contatadas' });

  await contacted.click();
  await expect(contacted).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('link', { name: 'Contacted customer', exact: true })).toBeVisible();

  await main.getByPlaceholder('Buscar por nome, contato ou serviço...').fill('  Cliente & Cia  ');
  await main.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(main.getByRole('heading', { name: 'Nenhuma oportunidade encontrada' })).toBeVisible();
  await main.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(main.getByRole('link', { name: 'Contacted customer', exact: true })).toBeVisible();

  expect(api.calls.filter((call) => call.path === route).map(({ query }) => [
    query.page, query.status ?? '', query.search ?? '',
  ])).toEqual([
    ['1', '', ''],
    ['2', '', ''],
    ['1', 'CONTACTED', ''],
    ['1', 'CONTACTED', 'Cliente & Cia'],
    ['1', 'CONTACTED', ''],
  ]);
});

test('marks a lead as contacted, archives it and removes terminal mutation actions', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = lead();

  api.respond('GET', detailRoute, () => success(current));
  api.respond('POST', detailRoute + '/contacted', () => {
    current = { ...current, status: 'CONTACTED', contactedAt: date };

    return success(current);
  });
  api.respond('POST', detailRoute + '/archive', () => {
    current = { ...current, status: 'ARCHIVED', archivedAt: date };

    return success(current);
  });

  await page.goto('/leads/' + leadId);

  const main = page.getByRole('main');
  const contact = main.getByRole('button', { name: 'Marcar como contatada', exact: true });
  const archive = main.getByRole('button', { name: 'Arquivar', exact: true });

  await expect(main.getByRole('heading', { name: 'Fixture customer', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'client@example.invalid', exact: true })).toHaveAttribute('href', 'mailto:client@example.invalid');

  const whatsapp = main.locator('a[href^="https://wa.me/"]');
  const url = new URL(await whatsapp.getAttribute('href'));

  expect(url.pathname).toBe('/5534999991234');
  expect(url.searchParams.get('text')).toContain('Fixture installation');
  await expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer');

  await contact.click();
  await expect(contact).toHaveCount(0);
  await expect(archive).toBeEnabled();
  await archive.click();

  await expect(archive).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Converter em cliente e orçamento', exact: true })).toHaveCount(0);
  await expect(main.getByText(current.message, { exact: true })).toBeVisible();

  const writes = api.calls.filter((call) => call.method === 'POST' && call.path.startsWith(detailRoute));

  expect(writes.map((call) => call.path)).toEqual([detailRoute + '/contacted', detailRoute + '/archive']);
  expect(writes.every((call) => call.headers['x-csrf-token'] === 'fixture-csrf')).toBe(true);
});

test('keeps an unconverted opportunity after a conflict and opens the new quote after explicit retry', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let conflict = true;
  const current = lead();

  api.respond('GET', detailRoute, () => success(current));
  api.respond('POST', detailRoute + '/convert', () => conflict
    ? { status: 409, json: { success: false } }
    : success({
        lead: { ...current, status: 'CONVERTED', convertedCustomerId: customerId, convertedQuoteId: quoteId, convertedAt: date },
        customerId,
        quoteId,
      }));
  installQuoteDetails(api, () => quoteDetails({ title: 'Converted fixture quote' }));

  await page.goto('/leads/' + leadId);

  const main = page.getByRole('main');
  const convert = main.getByRole('button', { name: 'Converter em cliente e orçamento', exact: true });

  await convert.click();
  await expect(main.getByRole('alert').filter({ hasText: 'Esta oportunidade não pode ser alterada no estado atual.' })).toBeVisible();
  await expect(convert).toBeEnabled();
  await expect(page).toHaveURL(new RegExp('/leads/' + leadId + '$'));

  conflict = false;
  await convert.click();

  await expect(page).toHaveURL(new RegExp('/quotes/' + quoteId + '$'));
  await expect(main.getByRole('heading', { name: 'Converted fixture quote', exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === detailRoute + '/convert')).toHaveLength(2);
});

test('shows the existing quote and disallows repeated conversion on a converted lead', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  api.respond('GET', detailRoute, () => success(lead({
    status: 'CONVERTED',
    convertedCustomerId: customerId,
    convertedQuoteId: quoteId,
    convertedAt: date,
  })));

  await page.goto('/leads/' + leadId);

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Oportunidade convertida', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Abrir orçamento', exact: true })).toHaveAttribute('href', '/quotes/' + quoteId);
  await expect(main.getByRole('button', { name: 'Converter em cliente e orçamento', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Arquivar', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Marcar como contatada', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.method === 'POST' && call.path.startsWith(detailRoute))).toHaveLength(0);
});
