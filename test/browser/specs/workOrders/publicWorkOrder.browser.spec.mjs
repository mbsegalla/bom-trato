import { expect, success, test } from '../../support/api.fixture.mjs';

const token = 'a'.repeat(64);
const hash = 'b'.repeat(64);
const route = '/api/public/work-orders/resolve';
const acceptanceRoute = '/api/public/work-orders/acceptance';
const date = '2026-01-01T00:00:00.000Z';
const consentText = 'Confirmo a conclusão dos serviços descritos.';

function portal(overrides = {}) {
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 3600000);

  return {
    organization: { name: 'Fixture business', logoUrl: null },
    workOrder: {
      title: 'Fixture service',
      status: 'COMPLETED',
      currency: 'brl',
      subtotalInCents: 10000,
      discountInCents: 0,
      totalInCents: 10000,
      responsibleName: 'Fixture professional',
      scheduledStartAt: null,
      scheduledEndAt: null,
      startedAt: date,
      completedAt: date,
      canceledAt: null,
      createdAt: date,
      items: [
        {
          name: 'Fixture inspection',
          description: null,
          unit: 'SERVICE',
          quantityInThousandths: 1000,
          unitAmountInCents: 10000,
          totalInCents: 10000,
          position: 0,
        },
      ],
    },
    financial: {
      receivedInCents: 5000,
      remainingContractInCents: 5000,
      outstandingReceivablesInCents: 5000,
    },
    timeline: [
      { type: 'WORK_ORDER_CREATED', occurredAt: date, scheduledStartAt: null, scheduledEndAt: null },
      { type: 'WORK_ORDER_COMPLETED', occurredAt: date, scheduledStartAt: null, scheduledEndAt: null },
    ],
    checklist: {
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Inspection completed',
          completed: true,
          completedAt: date,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          title: 'Final verification',
          completed: false,
          completedAt: null,
        },
      ],
      progress: { total: 2, completed: 1 },
    },
    photos: [],
    acceptance: { canAccept: true, snapshotHash: hash, consentVersion: '1', consentText, receipt: null },
    warranty: { durationDays: 90, terms: 'Fixture warranty terms', expiresAt: '2030-01-01T00:00:00.000Z' },
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ...overrides,
  };
}

async function fillAcceptance(page) {
  const section = page.getByRole('region', { name: 'Aceite da conclusão', exact: true });

  await section.getByLabel('Seu nome completo *', { exact: true }).fill('  Cliente   Teste  ');
  await section.getByRole('checkbox', { name: consentText }).check();
  await section.getByRole('button', { name: 'Registrar aceite da conclusão' }).click();

  return page.getByRole('alertdialog', { name: 'Confirmar conclusão dos serviços?' });
}

test('refuses malformed private links without requesting the service', async ({ page, api }) => {
  await page.goto('/acompanhar#token=invalid');

  await expect(page.getByRole('heading', { name: 'Atendimento indisponível' })).toBeVisible();
  await expect(page.getByText('O link de acompanhamento é inválido ou está incompleto.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
  expect(api.calls).toHaveLength(0);
});

test('retries a temporary portal failure and displays only the shared checklist and financial progress', async ({
  page,
  api,
}) => {
  let unavailable = true;
  api.respond('POST', route, () => (unavailable ? { status: 503, json: { success: false } } : success(portal())));

  await page.goto('/acompanhar#token=' + token);

  await expect(page.getByRole('heading', { name: 'Atendimento indisponível' })).toBeVisible();
  unavailable = false;

  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByRole('heading', { name: 'Seu serviço foi concluído!' })).toBeVisible();
  await expect(page.getByText('Fixture warranty terms', { exact: true })).toBeVisible();
  await expect(page.getByText('Inspection completed', { exact: true })).toBeVisible();
  await expect(page.getByText('Final verification', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Progresso das etapas compartilhadas do atendimento' }),
  ).toHaveAttribute('aria-valuetext', '1 de 2 itens concluídos');
  await expect(
    page.getByRole('progressbar', { name: 'Percentual do valor contratado registrado como recebido' }),
  ).toHaveAttribute('value', '50');

  const calls = api.calls.filter((call) => call.path === route);

  expect(calls).toHaveLength(2);
  for (const call of calls) {
    expect(call.body).toEqual({ token });
    expect(call.headers.authorization).toBeUndefined();
  }
});

test('requires signer and consent, allows cancellation of confirmation and registers an acceptance only once', async ({
  page,
  api,
}) => {
  api.respond('POST', route, () => success(portal()));
  api.respond('POST', acceptanceRoute, () => success({ acceptedAt: date, completedAt: date }));

  await page.goto('/acompanhar#token=' + token);

  const section = page.getByRole('region', { name: 'Aceite da conclusão', exact: true });

  await section.getByRole('button', { name: 'Registrar aceite da conclusão' }).click();
  await expect(
    section.getByRole('alert').filter({ hasText: 'Informe seu nome com pelo menos 2 caracteres.' }),
  ).toBeVisible();
  await expect(section.getByRole('alert').filter({ hasText: 'Marque a confirmação da conclusão' })).toBeVisible();

  const confirmation = await fillAcceptance(page);

  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === acceptanceRoute)).toHaveLength(0);

  await section.getByRole('button', { name: 'Registrar aceite da conclusão' }).click();
  await confirmation.getByRole('button', { name: 'Confirmar aceite' }).click();

  await expect(page.getByRole('heading', { name: 'Aceite da conclusão registrado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar aceite da conclusão' })).toHaveCount(0);

  const calls = api.calls.filter((call) => call.path === acceptanceRoute);

  expect(calls).toHaveLength(1);
  expect(calls[0].body).toEqual({
    token,
    snapshotHash: hash,
    consentVersion: '1',
    signerName: 'Cliente Teste',
    consent: true,
  });
  expect(calls[0].headers.authorization).toBeUndefined();
});

test('blocks another submission after an uncertain or stale acceptance until the service is refreshed', async ({
  page,
  api,
}) => {
  api.respond('POST', route, () => success(portal()));
  api.respond('POST', acceptanceRoute, () => ({
    status: 409,
    json: { success: false, error: { code: 'WORK_ORDER_ALREADY_ACCEPTED' } },
  }));

  await page.goto('/acompanhar#token=' + token);

  const confirmation = await fillAcceptance(page);

  await confirmation.getByRole('button', { name: 'Confirmar aceite' }).click();

  const section = page.getByRole('region', { name: 'Aceite da conclusão', exact: true });

  await expect(section.getByRole('alert').filter({ hasText: 'já possui um aceite' })).toBeVisible();
  await expect(section.getByRole('button', { name: 'Registrar aceite da conclusão' })).toBeDisabled();
  await expect(section.getByRole('button', { name: 'Atualizar atendimento' })).toBeVisible();
  expect(api.calls.filter((call) => call.path === acceptanceRoute)).toHaveLength(1);
});

test('does not display acceptance or warranty actions for work that is still in progress', async ({ page, api }) => {
  const current = portal();
  api.respond('POST', route, () =>
    success({
      ...current,
      workOrder: { ...current.workOrder, status: 'IN_PROGRESS', completedAt: null },
      acceptance: null,
      warranty: null,
    }),
  );

  await page.goto('/acompanhar#token=' + token);

  await expect(page.getByRole('heading', { name: 'Seu atendimento está em andamento.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar aceite da conclusão' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Baixar relatório do atendimento' })).toHaveCount(0);
  expect(api.calls.filter((call) => call.path === acceptanceRoute)).toHaveLength(0);
});
