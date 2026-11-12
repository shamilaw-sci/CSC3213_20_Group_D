/**
 * @file static-checks.mjs
 * @module Stage 1 review tooling
 * @desc Parse mobile sources and bundle web in memory without loading .env files.
 * Created by the review assistant, 2026-11-12; no student authorship claimed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const evidence = path.join(root, 'docs/review/evidence');
const requireMobile = createRequire(path.join(root, 'mobile/package.json'));

/** Parse tracked mobile files only; never evaluate their application code. */
function parseMobile() {
  const parser = requireMobile('@babel/parser');
  const files = execFileSync('git', ['ls-files', '-z', 'mobile'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(p => p.endsWith('.js'));
  const results = files.map(file => {
    try {
      parser.parse(fs.readFileSync(path.join(root, file), 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
      return { path: file, result: 'PASS' };
    } catch (error) {
      return { path: file, result: 'FAIL', message: error.message };
    }
  });
  fs.writeFileSync(path.join(evidence, 'mobile-parse.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(`B04: mobile Babel parse: ${results.filter(r => r.result === 'PASS').length}/${files.length} PASS`);
  if (results.some(r => r.result === 'FAIL')) process.exitCode = 1;
}

/** Compile the production web dependency graph with a synthetic public API origin. */
async function bundleWeb() {
  const { build } = await import(pathToFileURL(path.join(root, 'frontend/node_modules/vite/dist/node/index.js')));
  // Prevent inherited public values from entering the generated bundle.
  for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key];
  process.env.VITE_API_URL = 'https://api.example.test';
  const output = await build({
    root: path.join(root, 'frontend'),
    envDir: false,
    mode: 'production',
    build: { write: false },
  });
  const bundles = Array.isArray(output) ? output : [output];
  const summary = bundles.flatMap(bundle => bundle.output.map(item => ({
    file: item.fileName,
    kind: item.type,
    bytes: Buffer.byteLength(item.type === 'chunk' ? item.code : item.source),
  })));
  fs.writeFileSync(path.join(evidence, 'web-build-summary.json'), JSON.stringify({
    result: 'PASS', env_files_loaded: false, api_origin: 'https://api.example.test',
    write: false, artifacts: summary,
  }, null, 2) + '\n');
  console.log('B03: production web bundle PASS (in memory; .env disabled; synthetic origin)');
}

parseMobile();
await bundleWeb();
