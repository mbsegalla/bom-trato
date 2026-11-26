import { test, expect, success } from '../../support/api.fixture.mjs';

const route = '/api/public/receivable-payment-links/resolve';
const token = 'a'.repeat(64);

test('invalid private payment link never renders a payment code or contacts the API', async ({ page, api }) => {
  await page.goto('/pagar#token=invalid');

  await expect(page.getByText('Link de pagamento indisponível', { exact: false })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR Code Pix' })).toHaveCount(0);
  expect(api.calls).toHaveLength(0);
});

test('renders a valid fixture QR and hides it after the server rejects a refresh', async ({ page, api }) => {
  let expired = false;
  const copyAndPaste = '000201FIXTURE6304ABCD';
  api.respond('POST', route, () => expired
    ? { status: 404, json: { statusCode: 404, success: false } }
    : success({
      organizationName: 'Fixture company',
      merchantName: 'TEST',
      amountInCents: 1234,
      currency: 'brl',
      copyAndPaste,
      expiresAt: new Date(Date.now() + 300000).toISOString()
    }));

  await page.goto('/pagar#token=' + token);

  await expect(page.getByRole('img', { name: 'QR Code Pix' })).toBeVisible();
  await expect(page.getByLabel('Pix Copia e Cola')).toHaveValue(copyAndPaste);

  expired = true;

  await page.getByRole('button', { name: 'Atualizar cobrança' }).click();

  await expect(page.getByText('Link de pagamento indisponível', { exact: false })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR Code Pix' })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === route)).toHaveLength(2);
  for (const call of api.calls) {
    expect(call.body).toEqual({ token });
    expect(call.headers.authorization).toBeUndefined();
  }
});
