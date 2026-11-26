import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const raw = mkdtempSync(join(tmpdir(), 'bom-trato-coverage-'));
const output = join(root, 'coverage');
try {
  mkdirSync(output, { recursive: true });
  const result = spawnSync(process.execPath, [join(root, 'test/run.mjs'), '--coverage'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NODE_V8_COVERAGE: raw },
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.error) throw result.error;
  writeFileSync(join(output, 'node-report.txt'), (result.stdout ?? '') + (result.stderr ?? ''));
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else {
    // Native line/branch/function percentages include only executed files.
    // Inventory ALL production TS/TSX sources separately, including files
    // that never appeared in V8 coverage. File execution is not line coverage.
    function sources(directory) {
      return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sources(path);
        return /\.tsx?$/.test(entry.name) && !/(\.spec|\.d)\.tsx?$/.test(entry.name) ? [path] : [];
      });
    }
    const seen = new Set();
    const rawFiles = readdirSync(raw).filter((file) => file.endsWith('.json'));
    if (rawFiles.length === 0) throw new Error('V8 coverage was not collected');
    for (const file of rawFiles) {
      const data = JSON.parse(readFileSync(join(raw, file), 'utf8'));
      for (const script of data.result ?? []) {
        if (!script.url.startsWith('file:')) continue;
        const path = fileURLToPath(script.url);
        if (script.functions?.some((fn) => fn.ranges?.some((range) => range.count > 0))) seen.add(path);
      }
    }
    const groups = new Map();
    const missing = [];
    for (const file of sources(join(root, 'src')).sort()) {
      const path = relative(root, file).split(sep).join('/');
      if (isAbsolute(path) || path.startsWith('../')) continue;
      const module = /^src\/modules\/([^/]+)\//.exec(path)?.[1];
      const key = module ?? (path.split('/')[1] ?? 'other');
      const count = groups.get(key) ?? { total: 0, executed: 0 };
      count.total += 1;
      if (seen.has(file)) count.executed += 1;
      else missing.push(path);
      groups.set(key, count);
    }
    const report = [
      '# Frontend source execution inventory',
      '', 'Files executed by the Node regression suite, not a line-coverage percentage. Browser coverage is separate.',
      '', '| Module | Executed files | Total TS/TSX files |', '|---|---:|---:|',
      ...[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => '| ' + [name, count.executed, count.total].join(' | ') + ' |'),
      '', '## Files not observed (' + missing.length + ')', '', ...missing.map((file) => '- ' + file), '',
    ].join('\n');
    writeFileSync(join(output, 'inventory.md'), report);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.split('## Files')[0] + '\nFiles not observed: ' + missing.length + '.\n');
    console.log(report.split('## Files')[0]);
  }
} finally {
  rmSync(raw, { recursive: true, force: true });
}
