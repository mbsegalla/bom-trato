import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const flags = process.argv.slice(2);
const coverage = flags.includes('--coverage');
const filters = flags.filter((flag) => flag !== '--coverage');

function findSpecs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return ['node_modules', 'browser', 'coverage'].includes(entry.name) ? [] : findSpecs(path);
    return /\.spec\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const files = [...findSpecs(join(root, 'src')), ...findSpecs(join(root, 'test'))]
  .filter((path) => {
    const name = relative(root, path).split(sep).join('/');
    return filters.length === 0 || filters.some((filter) => name.includes(filter.replaceAll('\\', '/')));
  })
  .sort();

if (files.length === 0) {
  console.error('No matching test files.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [
  '--enable-source-maps',
  '--import', resolve(root, 'test/setup/register.mjs'),
  '--test',
  ...(coverage ? ['--experimental-test-coverage', '--test-coverage-include=src/**', '--test-coverage-exclude=**/*.spec.ts', '--test-coverage-exclude=**/*.spec.tsx'] : []),
  ...files,
], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_BASE_URL_API: 'https://api.example.invalid' },
});

if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
