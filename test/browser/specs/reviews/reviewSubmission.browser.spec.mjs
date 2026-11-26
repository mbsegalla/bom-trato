import { expect, success, test } from '../../support/api.fixture.mjs';

const token = 'a'.repeat(64);
const route = '/api/public/reviews';
const preview = {
  businessName: 'Fixture business',
  logoUrl: null,
  professionalSlug: 'fixture',
  workOrderTitle: 'Fixture service',
  reviewerDisplayName: 'Cliente T.',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

test('rejects a missing invitation without exposing a review form or contacting the API', async ({ page, api }) => {
  await page.goto('/avaliar');

  await expect(page.getByRole('heading', { name: 'Avaliação indisponível' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Este link de avaliação não é válido.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar avaliação' })).toHaveCount(0);
  expect(api.calls).toHaveLength(0);
});

test('requires a rating, trims the optional comment and clears the private token after submission', async ({
  page,
  api,
}) => {
  api.respond('POST', route + '/resolve', () => success(preview));
  api.respond('POST', route + '/submit', (call) =>
    success({
      reviewerDisplayName: preview.reviewerDisplayName,
      rating: call.body.rating,
      comment: call.body.comment,
      createdAt: '2026-01-01T00:00:00.000Z',
      verified: true,
      professionalSlug: preview.professionalSlug,
    }),
  );

  await page.goto('/avaliar#token=' + token);

  await expect(page.getByRole('heading', { name: preview.businessName })).toBeVisible();
  await expect(page.getByText(preview.workOrderTitle, { exact: true })).toBeVisible();

  const submit = page.getByRole('button', { name: 'Enviar avaliação' });

  await expect(submit).toBeDisabled();
  await page.getByRole('button', { name: '4 estrelas', exact: true }).click();
  await page.getByPlaceholder('Como foi o atendimento e o serviço realizado?').fill('  Excelente atendimento  ');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByRole('heading', { name: 'Obrigado pela avaliação!' })).toBeVisible();
  await expect(page).toHaveURL(/\/avaliar$/);
  await expect(page.getByRole('link', { name: 'Ver perfil do profissional' })).toHaveAttribute(
    'href',
    '/profissionais/fixture',
  );

  const calls = api.calls.filter((call) => call.path === route + '/submit');

  expect(calls).toHaveLength(1);
  expect(calls[0].body).toEqual({ token, rating: 4, comment: 'Excelente atendimento' });
  expect(calls[0].headers.authorization).toBeUndefined();
});

test('hides the form after a conflicting submission and does not send a second review', async ({ page, api }) => {
  api.respond('POST', route + '/resolve', () => success(preview));
  api.respond('POST', route + '/submit', () => ({ status: 409, json: { success: false } }));

  await page.goto('/avaliar#token=' + token);
  await page.getByRole('button', { name: '5 estrelas', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();

  await expect(page.getByRole('heading', { name: 'Avaliação indisponível' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Este serviço já foi avaliado.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar avaliação' })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === route + '/submit')).toHaveLength(1);
});

test('reports an expired review invitation without presenting rating controls', async ({ page, api }) => {
  api.respond('POST', route + '/resolve', () => ({ status: 410, json: { success: false } }));

  await page.goto('/avaliar#token=' + token);

  await expect(page.getByRole('alert').filter({ hasText: 'Este link de avaliação expirou.' })).toBeVisible();
  await expect(page.getByRole('button', { name: '5 estrelas', exact: true })).toHaveCount(0);
  expect(api.calls).toHaveLength(1);
  expect(api.calls[0].body).toEqual({ token });
});
