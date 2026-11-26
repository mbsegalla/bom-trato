import { expect, success, test } from '../../support/api.fixture.mjs';
import { installAuthenticatedApp, onboarding, organization, organizationId } from '../../support/authenticatedApp.fixture.mjs';
import { billingRoute, installBilling, invoice, subscription } from '../../support/settings.fixture.mjs';

test('requires confirmation before disabling renewal and allows the owner to resume it', async ({ page, api }) => {
  await installAuthenticatedApp(page, api);
  let current = subscription();

  installBilling(api, () => current);
  api.respond('POST', billingRoute + '/cancel', () => {
    current = { ...current, cancelAtPeriodEnd: true };

    return success(null);
  });
  api.respond('POST', billingRoute + '/resume', () => {
    current = { ...current, cancelAtPeriodEnd: false };

    return success(null);
  });

  await page.goto('/settings?tab=billing');

  const main = page.getByRole('main');
  const cancel = main.getByRole('button', { name: 'Cancelar renovação', exact: true });
  const change = main.getByRole('button', { name: 'Alterar plano', exact: true });

  await expect(main.getByRole('heading', { name: 'Fixture professional', exact: true })).toBeVisible();
  await expect(change).toBeEnabled();
  await cancel.click();

  const dialog = main.getByRole('alertdialog', { name: 'Cancelar renovação?' });

  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(api.calls.filter((call) => call.path === billingRoute + '/cancel')).toHaveLength(0);

  await cancel.click();
  await dialog.getByRole('button', { name: 'Cancelar renovação', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(main.getByText('A assinatura está programada para terminar em', { exact: false })).toBeVisible();
  await expect(change).toBeDisabled();

  await main.getByRole('button', { name: 'Retomar assinatura', exact: true }).click();
  const resume = main.getByRole('alertdialog', { name: 'Retomar assinatura?' });

  await resume.getByRole('button', { name: 'Retomar assinatura', exact: true }).click();
  await expect(resume).toBeHidden();
  await expect(cancel).toBeEnabled();
  await expect(change).toBeEnabled();

  expect(
    api.calls.filter((call) => call.method === 'POST' && call.path.startsWith(billingRoute)).map((call) => call.path),
  ).toEqual([billingRoute + '/cancel', billingRoute + '/resume']);
});

test('deduplicates overlapping invoice pages and preserves already loaded invoices when pagination finishes', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api);
  const first = invoice();
  const second = invoice({ id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', number: 'FIX-002' });

  installBilling(
    api,
    () => subscription(),
    (query) =>
      query.cursor ? { items: [first, second], nextCursor: null } : { items: [first], nextCursor: 'fixture-next' },
  );

  await page.goto('/settings?tab=billing');

  const main = page.getByRole('main');
  const invoices = main.locator('section').filter({ has: page.getByRole('heading', { name: 'Faturas', exact: true }) });

  await expect(invoices.getByText('Fatura FIX-001', { exact: true })).toBeVisible();
  await invoices.getByRole('button', { name: 'Carregar mais', exact: true }).click();
  await expect(invoices.getByText('Fatura FIX-002', { exact: true })).toBeVisible();
  await expect(invoices.getByText('Fatura FIX-001', { exact: true })).toHaveCount(1);
  await expect(invoices.getByRole('button', { name: 'Carregar mais', exact: true })).toHaveCount(0);

  const reads = api.calls.filter((call) => call.path === billingRoute + '/invoices');

  expect(reads).toHaveLength(2);
  expect(reads[1].query.cursor).toBe('fixture-next');
});

test('exposes the subscription summary but never reads card or invoice data for a member', async ({ page, api }) => {
  await installAuthenticatedApp(page, api, { organizations: [{ ...organization, role: 'MEMBER' }] });
  installBilling(api, () => subscription());

  await page.goto('/settings?tab=billing');

  const main = page.getByRole('main');

  await expect(main.getByRole('heading', { name: 'Fixture professional', exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Gerenciamento da assinatura', exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Método de pagamento', exact: true })).toHaveCount(0);
  await expect(main.getByRole('heading', { name: 'Faturas', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Alterar plano', exact: true })).toHaveCount(0);
  expect(
    api.calls.filter(
      (call) => call.path === billingRoute + '/payment-method' || call.path === billingRoute + '/invoices',
    ),
  ).toHaveLength(0);
});

test('shows the free trial without requesting Stripe billing data or implying automatic charges', async ({
  page,
  api,
}) => {
  await installAuthenticatedApp(page, api, {
    onboarding: (id) =>
      onboarding(id, {
        accessSource: 'TRIAL',
        trial: {
          startsAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
          convertedAt: null,
          revokedAt: null,
          remainingDays: 3,
          active: true,
        },
      }),
  });

  await page.goto('/settings?tab=billing');

  const main = page.getByRole('main');
  const trial = main
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Avaliação gratuita', exact: true }) });

  await expect(trial.getByText('3 dias restantes', { exact: true })).toBeVisible();
  await expect(trial.getByText('Sem compromisso financeiro', { exact: true })).toBeVisible();
  await expect(trial.getByRole('link', { name: 'Escolher meu plano', exact: true })).toHaveAttribute(
    'href',
    '/onboarding?organizationId=' + organizationId + '&subscribe=1',
  );
  expect(api.calls.filter((call) => call.path.startsWith(billingRoute))).toHaveLength(0);
});
