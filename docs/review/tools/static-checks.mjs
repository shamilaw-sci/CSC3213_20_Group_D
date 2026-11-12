/**
 * @file static-checks.mjs
 * @module Review verification tooling
 * @desc Run static checks independently with fresh, source-bound evidence.
 * @author Codex Review Assistant (review tooling; no student attribution)
 * Review assistant tooling; no student authorship claimed.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChecks } from './check-evidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const worker = path.join(root, 'docs/review/tools/static-worker.mjs');
const checks = [
  { id: 'B01', kind: 'syntax', command: [process.execPath, 'scripts/check-syntax.js'], cwd: 'backend', prefixes: ['backend/'],
    limitations: 'Node syntax only; no module evaluation, API or database assertions' },
  { id: 'B02', kind: 'lint', command: [process.execPath, 'node_modules/eslint/bin/eslint.js', '.', '--format', 'json'], cwd: 'frontend', prefixes: ['frontend/'],
    limitations: 'Configured web ESLint scope only; no fixes, typecheck or runtime verification' },
  { id: 'B03', kind: 'compilation', command: [process.execPath, worker, 'web-build', root], prefixes: ['frontend/'],
    limitations: 'Production graph in memory, .env disabled, synthetic origin; no deployed/browser verification' },
  { id: 'B04', kind: 'parser', command: [process.execPath, worker, 'mobile-parse', root], prefixes: ['mobile/'],
    limitations: 'Tracked JS/JSX parsing only; no Metro/native/device behavior or API calls' },
  { id: 'B05', kind: 'whitespace', command: ['git', '-c', 'core.safecrlf=false', 'diff', '--check', 'HEAD'], prefixes: [],
    limitations: 'Combined tracked staged/unstaged whitespace only; not a behavior test' },
  { id: 'B06', kind: 'metadata', command: [process.execPath, worker, 'dependencies', root], prefixes: ['backend/', 'frontend/', 'mobile/', 'package'],
    limitations: 'Four lock roots and installed direct versions only; no clean install/transitive audit or network access' },
];
const { manifest, exitCode } = await runChecks({ root, output: path.join(root, 'docs/review/evidence/static-current'), checks });
for (const check of manifest.checks) console.log(`${check.id}: ${check.result}`);
console.log('Runtime: NOT_RUN; visual: NOT_RUN');
process.exitCode = exitCode;
