import { existsSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

// Test-only resolver for Next.js source aliases and TypeScript/TSX.
// Do not transform packages or change the production Next configuration.
const root = fileURLToPath(new URL('../../', import.meta.url));

const sourceRoot = join(root, 'src');

function isProjectFile(path) {
  const local = relative(root, path);

  return (
    !isAbsolute(local) && local !== '..' && !local.startsWith('..' + sep) && !local.split(sep).includes('node_modules')
  );
}

function candidate(path) {
  return [path, path + '.ts', path + '.tsx', join(path, 'index.ts'), join(path, 'index.tsx')].find(
    (entry) => isProjectFile(entry) && existsSync(entry) && statSync(entry).isFile(),
  );
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let path;
    if (specifier.startsWith('@/')) {
      path = candidate(resolve(sourceRoot, specifier.slice(2)));
    } else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const parent = fileURLToPath(context.parentURL);
      if (isProjectFile(parent)) path = candidate(resolve(dirname(parent), specifier));
    }
    return nextResolve(path ? pathToFileURL(path).href : specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith('file:')) return nextLoad(url, context);
    const path = fileURLToPath(url);
    if (!isProjectFile(path) || !/\.tsx?$/.test(path)) return nextLoad(url, context);

    const result = ts.transpileModule(readFileSync(path, 'utf8'), {
      fileName: path,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        inlineSourceMap: true,
        inlineSources: true,
      },
    });

    return { format: 'module', source: result.outputText, shortCircuit: true };
  },
});

// All HTTP tests must explicitly mock the transport. Accidental network
// requests must fail rather than reach a real API or payment provider.
globalThis.fetch = async () => {
  throw new Error('Unexpected network access in frontend tests');
};
