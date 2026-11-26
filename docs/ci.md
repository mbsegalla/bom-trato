# Continuous integration

CI runs on pushes to `develop` and `main`, and pull requests targeting `main`. It uses Node.js 24, the pnpm version declared in `package.json`, and the committed lockfile. The workflows are read-only, pin their actions to commit SHAs, and do not deploy or use production secrets.

## Development workflow

Keep the existing `develop -> main` workflow. Before committing locally, run:

```bash
pnpm lint:fix
pnpm format
pnpm check
pnpm build
```

Run formatting **after** ESLint autofixes. Fix all failures instead of disabling Husky, lint rules, or required checks.

Push to `develop` and confirm that the CI run for the exact branch head SHA completed successfully before opening a pull request. If CI fails, resolve the failure on `develop` and verify the new head. If no run or result is accessible, do not describe the change as validated or open a new pull request as though the checks passed.

PR checks validate the proposed merge into `main`. A successful push check does not replace this merge check. Repository administrators should require the validation job as a status check for `main`, without requiring PRs for pushes to `develop`. This workflow alone does not enforce branch protection.

See the repository Actions tab for run results and logs. No automatic deployment or merge is configured.

## Frontend validation

The `Frontend validation` job runs `pnpm check` and builds Next.js. It uses a loopback API address and nonfunctional public configuration placeholders. The build may download the project's existing Google Fonts through Next.js; it does not need a live Bom Trato API or real Stripe or Google credentials.

The frontend currently has no automated test script or test suite configured. Add a real test suite separately before making automated frontend tests a mandatory check. Successful lint, formatting, typecheck and build do not replace browser or payment integration testing.
