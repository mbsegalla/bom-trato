# Testing the frontend

The test suite uses the native Node.js test runner (Node 24, matching CI) and
the existing TypeScript dependency. No new dependency or lockfile is needed.
The small test-only resolver supports the existing @/ alias and TS/TSX source.
It does not modify Next.js production resolution. All test HTTP requests are
explicitly mocked; accidental fetch calls fail instead of reaching a real API.

## Organization

- src/modules/<module>/schemas/*.spec.ts — Zod input and response contracts.
- src/modules/<module>/helpers, utils, constants — pure application/UI rules.
- src/modules/<module>/components/*.spec.tsx — static React output and
  presentation rules. These do not simulate browser interactions.
- src/shared — reusable money, quantity, phone and response parsing.
- test/integration/<module> — service integration with a mocked HTTP boundary,
  including authentication, refresh, CSRF, tenant scope and payment recovery.
- test/support — shared fixtures. Keep fixture data synthetic and independent
  from production credentials and data.

Run from the repository root:

```bash
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:coverage
pnpm test -- receivables
```

The full test command discovers every .spec.ts/.spec.tsx in src and test,
fails if no tests match, and propagates the runner exit code. Coverage is a
diagnostic, not an arbitrary percentage threshold. Type checking remains
separate; transpilation in the runner is not a type check. The frontend CI
now runs the full suite before build; lint/Prettier remain owner-managed.

## Add tests with each change

Test the public behavior rather than implementation details. At minimum,
cover valid input, rejected/edge input, authorization and tenant scope,
privacy projection, money in integer cents, dates/time zones, network
failures and idempotent/uncertain mutations. Use fixed times or isolated
clock mocks. Reuse fixture builders but keep assertions in the individual
specs. Do not copy production functions into the expected-value calculation.

This is an initial project-wide regression baseline, not proof of complete
coverage. Remaining priorities: interactive browser tests for login,
onboarding, organization switching, public quote decisions, work order
scheduling/photos/acceptance, subscription changes, Pix QR refresh and
payment confirmation; API-backed end-to-end journeys, accessibility and
mobile behavior; broader component/hook and service failure scenarios.
The mock suite cannot homologate Stripe, Mercado Pago or Google OAuth.

## Second regression expansion: coverage and browser tests

The frontend CI executes the Node suite with native line/branch/function
coverage and publishes `frontend-coverage`. Native coverage measures the
files loaded by the suite; `coverage/inventory.md` separately inventories
**all** production TS/TSX files by module, including never-observed files.
Do not interpret the execution inventory as line coverage. Targets for
application rules (90%) and components/hooks (80%) are planning goals,
not measured results or enforced gates. The browser suite is not included
in the Node coverage percentages.

The standalone Playwright suite runs actual Next pages in Chromium with
desktop and mobile viewports, intercepting the API at a fixed localhost
origin and rejecting external browser requests. It tests password controls,
login error and CSRF, account recovery navigation, public quote token
admission, and refreshing/removing a public Pix QR. All data is synthetic.
This is browser-level regression with a mocked HTTP boundary, not a
full frontend/backend E2E test or a real payment test.

Install the pinned browser tooling separately (no changes to the root
pnpm lockfile; this first standalone setup does not commit an npm lockfile):

```bash
npm install --prefix test/browser --package-lock=false --ignore-scripts --no-audit --no-fund
npm --prefix test/browser exec -- playwright install chromium
pnpm test:browser
```

The suite builds Next with fake public settings, starts a dedicated local
server on port 3100, and will not reuse another running server. The new
browser workflow runs independently of the existing required validation
job and uploads screenshots/traces/HTML on failure. Review its first run
before making that job mandatory in repository protection rules. Keep
browser reports/dependencies out of version control. Remaining priorities
are authenticated organization switching, interactive dashboard and CRUD
journeys, onboarding, quotes, work orders, notifications, and complete
API-backed E2E flows against disposable services. Never use live credentials.

## Third regression expansion — HTTP service contracts

The previous CI baseline was 108 Node tests and 10 browser tests passing. This increment adds isolated HTTP service integration specs for registration, password recovery, organization paging and scoped member cache, onboarding, checkout, notifications, public quote decisions, work order mutations and Mercado Pago OAuth redirect validation. Existing synthetic HTTP fixtures are reused; no real provider or account is accessed. The Node coverage percentage still covers exercised files only: use the source execution inventory to find unobserved modules and prioritize the next interactive component/hook and API-backed E2E work. The existing Playwright suites and CI requirements remain unchanged.
