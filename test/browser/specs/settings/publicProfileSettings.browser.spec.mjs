import { test, expect, success } from '../../support/api.fixture.mjs';
import { date, installAuthenticatedApp, organization, organizationId, organizationRoute } from '../../support/authenticatedApp.fixture.mjs';
import { catalogService, pageResult, serviceId } from '../../support/operationalRecords.fixture.mjs';
import { apiError } from '../../support/settings.fixture.mjs';

const route = organizationRoute(organizationId, 'public-profile');
const catalogRoute = organizationRoute(organizationId, 'services');
const secondServiceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function profile(overrides = {}) {
  return {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    slug: 'fixture-professional',
    headline: null,
    description: null,
    whatsappPhone: null,
    whatsappEnabled: false,
    published: false,
    publishedAt: null,
    selectedServiceIds: [],
    city: 'Uberlândia',
    state: 'MG',
    ...overrides,
  };
}

function installProfile(api, read) {
  api.respond('GET', route, () => success(read()));
  api.respond('GET', catalogRoute, () => success(pageResult([
    catalogService({ name: 'Fixture installation' }),
    catalogService({ id: secondServiceId, name: 'Fixture repair' }),
  ])));
}

test('normalizes the public slug, validates contact and publishes only selected catalog services', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = profile();

  installProfile(api, () => current);
  api.respond('PATCH', route, ({ body }) => {
    const { serviceIds, ...details } = body;

    current = {
      ...current,
      ...details,
      whatsappPhone: details.whatsappPhone?.replace(/\D/g, '') ?? null,
      selectedServiceIds: serviceIds,
      publishedAt: details.published ? date : null,
    };

    return success(current);
  });

  await page.goto('/settings?tab=showcase');

  const main = page.getByRole('main');
  const publish = main.getByRole('checkbox', { name: /Publicar minha vitrine/ });
  const contact = main.getByRole('checkbox', { name: /Permitir contato pelo WhatsApp/ });
  const save = main.getByRole('button', { name: 'Salvar vitrine', exact: true });
  const slug = main.getByLabel('Endereço público', { exact: true });

  await expect(slug).toHaveValue('fixture-professional');
  await expect(publish).toBeDisabled();
  await expect(main.getByRole('link', { name: 'Ver perfil', exact: true })).toHaveCount(0);

  await slug.fill('Instalação & Reparo');
  await expect(slug).toHaveValue('instalacao-reparo');
  await main.getByLabel('Destaque', { exact: true }).fill('  Fixture headline  ');
  await contact.check();
  await publish.check();
  await save.click();

  await expect(main.getByRole('alert').filter({ hasText: 'Informe um WhatsApp válido.' })).toBeVisible();
  expect(api.calls.filter((call) => call.path === route && call.method === 'PATCH')).toHaveLength(0);

  await main.getByLabel('Número para contato', { exact: true }).fill('34999991234');
  await main.getByRole('checkbox', { name: 'Fixture installation', exact: true }).check();
  await main.getByRole('checkbox', { name: 'Fixture repair', exact: true }).check();
  await main.getByRole('checkbox', { name: 'Fixture repair', exact: true }).uncheck();
  await save.click();

  await expect(main.getByText('Sua vitrine está publicada.', { exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Ver perfil', exact: true })).toHaveAttribute('href', '/profissionais/instalacao-reparo');
  await expect(publish).toBeChecked();

  const writes = api.calls.filter((call) => call.path === route && call.method === 'PATCH');

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    slug: 'instalacao-reparo',
    headline: 'Fixture headline',
    description: null,
    whatsappPhone: '(34) 99999-1234',
    whatsappEnabled: true,
    published: true,
    serviceIds: [serviceId],
  });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');

  const catalog = api.calls.filter((call) => call.path === catalogRoute);

  expect(catalog).toHaveLength(1);
  expect(catalog[0].query).toMatchObject({ page: '1', limit: '100', status: 'ACTIVE' });
});

test('requires a configured city and state even when contact is enabled', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);

  installProfile(api, () => profile({ city: null, state: null, whatsappEnabled: true, whatsappPhone: '34999991234' }));

  await page.goto('/settings?tab=showcase');

  const main = page.getByRole('main');

  await expect(main.getByText('Informe cidade e estado na aba Negócio antes de publicar.', { exact: true })).toBeVisible();
  await expect(main.getByRole('checkbox', { name: /Permitir contato pelo WhatsApp/ })).toBeChecked();
  await expect(main.getByRole('checkbox', { name: /Publicar minha vitrine/ })).toBeDisabled();
  expect(api.calls.filter((call) => call.path === route && call.method === 'PATCH')).toHaveLength(0);
});

test('preserves unsaved fields after a slug conflict and unpublishes automatically when contact is disabled', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = profile({
    published: true,
    publishedAt: date,
    whatsappEnabled: true,
    whatsappPhone: '34999991234',
    selectedServiceIds: [serviceId],
  });
  let conflict = true;

  installProfile(api, () => current);
  api.respond('PATCH', route, ({ body }) => {
    if (conflict) return apiError(409, 'PUBLIC_PROFILE_SLUG_TAKEN');

    const { serviceIds, ...details } = body;

    current = { ...current, ...details, publishedAt: null, selectedServiceIds: serviceIds };

    return success(current);
  });

  await page.goto('/settings?tab=showcase');

  const main = page.getByRole('main');
  const slug = main.getByLabel('Endereço público', { exact: true });
  const contact = main.getByRole('checkbox', { name: /Permitir contato pelo WhatsApp/ });
  const publish = main.getByRole('checkbox', { name: /Publicar minha vitrine/ });
  const save = main.getByRole('button', { name: 'Salvar vitrine', exact: true });

  await expect(publish).toBeChecked();
  await slug.fill('occupied-fixture');
  await save.click();

  await expect(main.getByRole('alert').filter({ hasText: 'Esta URL já está sendo utilizada por outro profissional.' })).toBeVisible();
  await expect(slug).toHaveValue('occupied-fixture');
  await expect(publish).toBeChecked();

  conflict = false;
  await slug.fill('available-fixture');
  await contact.uncheck();
  await expect(publish).not.toBeChecked();
  await expect(publish).toBeDisabled();
  await save.click();

  await expect(main.getByText('Vitrine atualizada com sucesso.', { exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Ver perfil', exact: true })).toHaveCount(0);
  await expect(main.getByRole('checkbox', { name: 'Fixture installation', exact: true })).toBeChecked();

  const writes = api.calls.filter((call) => call.path === route && call.method === 'PATCH');

  expect(writes).toHaveLength(2);
  expect(writes[1].body).toMatchObject({
    slug: 'available-fixture', whatsappEnabled: false, published: false, serviceIds: [serviceId],
  });
});

test('exposes the persisted showcase to ordinary members but prevents all configuration changes', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  installProfile(api, () => profile({ published: true, publishedAt: date, whatsappEnabled: true, whatsappPhone: '34999991234', selectedServiceIds: [serviceId] }));

  await page.goto('/settings?tab=showcase');

  const main = page.getByRole('main');

  await expect(main.getByText('Somente o administrador pode alterar a vitrine.', { exact: true })).toBeVisible();
  await expect(main.getByLabel('Endereço público', { exact: true })).toHaveValue('fixture-professional');
  await expect(main.getByLabel('Endereço público', { exact: true })).toBeDisabled();
  await expect(main.getByRole('button', { name: 'Salvar vitrine', exact: true })).toBeDisabled();

  for (const checkbox of await main.getByRole('checkbox').all()) {
    await expect(checkbox).toBeDisabled();
  }

  expect(api.calls.filter((call) => call.path === route && call.method === 'PATCH')).toHaveLength(0);
});
