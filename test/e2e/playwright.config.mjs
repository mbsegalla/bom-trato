import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const databaseUrl = 'postgresql://bom_trato_e2e:e2e_only_password@127.0.0.1:5432/bom_trato_e2e?schema=public';
const baseURL = 'http://127.0.0.1:3100';
const apiOrigin = 'http://127.0.0.1:5000';

if (process.env.BOM_TRATO_E2E !== '1' || process.env.DATABASE_URL !== databaseUrl || !process.env.E2E_API_ROOT) {
  throw new Error('Full-stack E2E requires explicit opt-in, the dedicated loopback database and E2E_API_ROOT');
}

for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (existsSync(resolve(root, file))) {
    throw new Error('Full-stack E2E refuses to load existing frontend environment files');
  }
}

const backendRoot = resolve(process.env.E2E_API_ROOT);

if (!existsSync(resolve(backendRoot, 'test/e2e/support/start-api.mjs'))) {
  throw new Error('The selected backend revision does not include the full-stack test launcher');
}

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.e2e.spec.mjs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  outputDir: './test-results',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node test/e2e/support/start-api.mjs',
      cwd: backendRoot,
      url: apiOrigin + '/api/legal/current',
      reuseExistingServer: false,
      timeout: 90_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm build && pnpm start --hostname 127.0.0.1 --port 3100',
      cwd: root,
      url: baseURL + '/login',
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NEXT_PUBLIC_BASE_URL_API: apiOrigin,
        NEXT_PUBLIC_SITE_URL: baseURL,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'ci-placeholder.apps.googleusercontent.com',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ci_placeholder',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
});
