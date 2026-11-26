import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { expect, test as base } from '@playwright/test';

export const appOrigin = 'http://127.0.0.1:3100';
export const apiOrigin = 'http://127.0.0.1:5000';

async function restrictBrowser(context) {
  await context.route('**/*', async (route) => {
    const { origin } = new URL(route.request().url());

    if (origin === appOrigin || origin === apiOrigin) {
      return route.continue();
    }

    return route.abort();
  });
}

export const test = base.extend({
  page: async ({ page }, providePage) => {
    await restrictBrowser(page.context());
    await providePage(page);
  },
});

export function inspectAccount(operation, email) {
  if (process.env.BOM_TRATO_E2E !== '1' || !process.env.E2E_API_ROOT) {
    throw new Error('Full-stack E2E inspection requires the isolated environment');
  }

  const backendRoot = resolve(process.env.E2E_API_ROOT);
  const result = execFileSync(process.execPath, ['test/e2e/support/inspect.mjs', operation, email], {
    cwd: backendRoot,
    encoding: 'utf8',
    timeout: 15_000,
  });

  return JSON.parse(result);
}

export function apiResponse(page, method, path) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());

    return url.origin === apiOrigin && url.pathname === path && response.request().method() === method;
  });
}

export { expect };
