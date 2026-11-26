import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, onboarding, organizationId } from '../../support/authenticatedApp.fixture.mjs';
import { installDashboard } from '../../support/dashboard.fixture.mjs';

const route = '/api/onboarding';
const bootstrapRoute = route + '/bootstrap';
const businessRoute = route + '/business';
const url = '/onboarding?organizationId=' + organizationId;
const trialSetup = onboarding(organizationId, {
  step: 'CREATE_BUSINESS',
  accessSource: 'NONE',
  trialEligible: true,
});

function activeTrial() {
  const now = Date.now();

  return onboarding(organizationId, {
    accessSource: 'TRIAL',
    trial: {
      startsAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 14 * 86400000).toISOString(),
      convertedAt: null,
      revokedAt: null,
      remainingDays: 14,
      active: true,
    },
  });
}

test('provisions a free trial, validates the trimmed business name and enters the scoped application without payment', async ({
  page,
  api,
}) => {
  let current = trialSetup;
  await installAuthenticatedApp(page, api, { onboarding: () => current });
  installDashboard(api, { empty: true });

  api.respond('POST', bootstrapRoute, () => success(current));
  api.respond('POST', businessRoute, () => {
    current = activeTrial();

    return success(current);
  });

  await page.goto('/onboarding');

  const main = page.getByRole('main');
  const name = main.getByLabel('Nome do negócio', { exact: true });
  const submit = main.getByRole('button', { name: 'Começar minha avaliação gratuita', exact: true });

  await expect(main.getByRole('heading', { name: 'Seu negócio começa aqui' })).toBeVisible();
  await expect(
    main.getByText('14 dias gratuitos. Sem cartão de crédito e sem renovação automática.', { exact: true }),
  ).toBeVisible();

  await name.fill('   ');
  await submit.click();
  await expect(main.getByRole('alert').filter({ hasText: 'Informe um nome entre 2 e 100 caracteres.' })).toBeVisible();
  expect(api.calls.filter((call) => call.path === businessRoute)).toHaveLength(0);

  await name.fill('  Fixture trial business  ');
  await submit.click();
  await expect(main.getByRole('heading', { name: 'Sua avaliação começou!' })).toBeVisible();

  const proceed = main.getByRole('link', { name: 'Ir para o Bom Trato', exact: true });

  await expect(proceed).toHaveAttribute('href', '/dashboard');
  await proceed.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(main.getByRole('heading', { name: 'Seu dia, mais organizado.' })).toBeVisible();

  const writes = api.calls.filter((call) => call.path === businessRoute);

  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({ organizationId, name: 'Fixture trial business' });
  expect(writes[0].headers['x-csrf-token']).toBe('fixture-csrf');
  expect(api.calls.filter((call) => call.path === bootstrapRoute)).toHaveLength(1);
  expect(api.calls.filter((call) => call.path.includes('/billing/'))).toHaveLength(0);
  expect(await page.evaluate(() => localStorage.getItem('bom-trato:active-organization'))).toBe(organizationId);
});

test('keeps the payment-pending screen until an explicit refresh confirms access', async ({ page, api }) => {
  let current = onboarding(organizationId, { step: 'PAYMENT_PENDING', accessSource: 'NONE' });
  await installAuthenticatedApp(page, api, { onboarding: () => current });

  await page.goto(url);

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Confirmando seu pagamento' })).toBeVisible();
  await expect(main.getByText(/Não inicie outro pagamento/)).toBeVisible();
  await main.getByRole('button', { name: 'Verificar pagamento', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Verificar pagamento', exact: true })).toBeEnabled();
  await expect(main.getByRole('heading', { name: 'Confirmando seu pagamento' })).toBeVisible();

  current = onboarding(organizationId, { step: 'CREATE_BUSINESS', accessSource: 'SUBSCRIPTION' });
  await main.getByRole('button', { name: 'Verificar pagamento', exact: true }).click();

  await expect(main.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Criar meu negócio', exact: true })).toBeEnabled();
  expect(api.calls.filter((call) => call.path === route).map((call) => call.query.organizationId)).toEqual([
    organizationId,
    organizationId,
    organizationId,
  ]);
  expect(api.calls.filter((call) => call.path.includes('/billing/'))).toHaveLength(0);
  expect(api.calls.filter((call) => call.path === bootstrapRoute || call.path === businessRoute)).toHaveLength(0);
});

test('retains the business form after a failed setup request and allows a controlled retry', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, {
    onboarding: () => onboarding(organizationId, { step: 'CREATE_BUSINESS', accessSource: 'SUBSCRIPTION' }),
  });
  let unavailable = true;

  api.respond('POST', businessRoute, () =>
    unavailable ? { status: 503, json: { success: false } } : success(onboarding(organizationId)),
  );

  await page.goto(url);

  const main = page.getByRole('main');
  const name = main.getByLabel('Nome do negócio', { exact: true });
  const submit = main.getByRole('button', { name: 'Criar meu negócio', exact: true });

  await name.fill('Fixture paid business');
  await submit.click();

  await expect(
    main.getByRole('alert').filter({ hasText: 'Não foi possível carregar a próxima etapa. Tente novamente.' }),
  ).toBeVisible();
  await expect(name).toHaveValue('Fixture paid business');
  await expect(submit).toBeEnabled();

  unavailable = false;
  await submit.click();

  await expect(main.getByRole('heading', { name: 'Tudo pronto', exact: true })).toBeVisible();
  expect(api.calls.filter((call) => call.path === businessRoute).map((call) => call.body)).toEqual([
    { organizationId, name: 'Fixture paid business' },
    { organizationId, name: 'Fixture paid business' },
  ]);
});

test('does not offer subscription or business mutations when a member must contact the owner', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api, {
    onboarding: () => onboarding(organizationId, { step: 'CONTACT_OWNER', accessSource: 'NONE' }),
  });

  await page.goto(url);

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Fale com o responsável' })).toBeVisible();
  await expect(
    main.getByText('O responsável pelo negócio precisa concluir esta etapa.', { exact: true }),
  ).toBeVisible();
  await expect(main.getByLabel('Nome do negócio', { exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Verificar pagamento', exact: true })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path.startsWith(route) && call.method === 'POST')).toHaveLength(0);
  expect(api.calls.filter((call) => call.path.includes('/billing/'))).toHaveLength(0);
});
