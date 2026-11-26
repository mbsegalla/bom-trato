import { test, expect } from '../../support/api.fixture.mjs';

test('refuses a malformed quote share without revealing quote data or sending a decision', async ({ page, api }) => {
  await page.goto('/quote-share#token=invalid');
  await expect(page.getByRole('heading', { name: 'Este orçamento não está disponível' })).toBeVisible();
  await expect(page.getByText('O link do orçamento é inválido.')).toBeVisible();
  expect(api.calls).toHaveLength(0);
});
