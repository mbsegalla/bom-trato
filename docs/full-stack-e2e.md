# Phase 5.1 — Full-stack E2E

This suite is independent of the existing mocked browser tests and the
required CI jobs. Playwright starts the real built NestJS API and Next.js
application and drives both against a disposable PostgreSQL 17 database.
API traffic is not fulfilled or intercepted with mocked responses.

The opt-in Full-stack E2E workflow checks out the frontend under test and
the exact backend commit in `.github/full-stack-check.json`. Updating that
file on `develop` triggers the workflow; ordinary commits do not. The same
workflow can be started manually. It records both tested revisions.

## First journey

- Create an account through the registration screen and accept the current
  legal terms.
- Retrieve the real encrypted verification email from the backend's
  disposable outbox, then follow its link in the browser.
- Provision the initial organization, activate the 14-day trial and open
  the dashboard.
- Restore the real session from its refresh cookie after a reload.
- Reject an incorrect password and sign in again after clearing the browser
  session.
- Verify the persisted owner, legal acceptance, consumed token, unique
  organization and trial, and absence of Stripe checkout or subscription.

Desktop and mobile Chromium run the journey with unique synthetic accounts.
The read-only inspector and launcher are supplied by the pinned backend
revision. No production route, user seed or authentication bypass is added.

## Isolation and evidence

Only the loopback app and API origins are allowed in the test browser.
The backend uses synthetic credentials, disabled payment/notification
workers and a TCP connection guard that permits the local database only.
The workflow starts a fresh database and applies the real migrations.
Existing local environment files or a non-fixture database URL are rejected.

No real provider is homologated by these tests. Email delivery, Stripe,
Mercado Pago, Google OAuth and S3 require a separately approved external
test environment. Dependency installation, Chromium installation and the
existing Next.js font build can access the network.

The report artifact includes Playwright HTML, failure screenshots, traces,
videos and process output. It contains only synthetic accounts. Reports
and logs are kept out of version control. The workflow does not deploy
or change any production environment.

## Running the same journey locally

Use a fresh, dedicated PostgreSQL 17 database named `bom_trato_e2e` on
127.0.0.1:5432 with user `bom_trato_e2e` and password
`e2e_only_password`. Never reuse a development or production database.

Set `BOM_TRATO_E2E=1`, `DATABASE_URL` to
`postgresql://bom_trato_e2e:e2e_only_password@127.0.0.1:5432/bom_trato_e2e?schema=public`
and `E2E_API_ROOT` to the absolute path of the compatible backend checkout.
Use clean checkouts without local environment files. In the backend run
`pnpm install --frozen-lockfile`, `pnpm prisma:generate`,
`pnpm exec prisma migrate deploy` and `pnpm build`. In the frontend run:

```bash
pnpm install --frozen-lockfile
npm install --prefix test/e2e --package-lock=false --ignore-scripts --no-audit --no-fund
npm --prefix test/e2e exec -- playwright install chromium
pnpm test:e2e
```
