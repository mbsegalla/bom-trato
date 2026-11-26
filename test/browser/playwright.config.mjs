import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseURL = 'http://127.0.0.1:3100';
export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.browser.spec.mjs',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    // Build with fake settings even if the developer has a local .env file.
    // This suite owns the process and refuses to reuse another server.
    command: 'pnpm build && pnpm start --hostname 127.0.0.1 --port 3100',
    cwd: root,
    url: baseURL + '/login',
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_BASE_URL_API: 'http://127.0.0.1:5000',
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'ci-placeholder.apps.googleusercontent.com',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ci_placeholder',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
