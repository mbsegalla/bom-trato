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
