/**
 * @file static-checks.test.mjs
 * @module Review tooling regression tests
 * @desc Exercise check evidence freshness and failures using isolated fixtures.
 * @author Codex Review Assistant (review tooling; no student attribution)
 * Review assistant tooling; no application modules or live services are used.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { runChecks, executeCommand, sourceSnapshot } from '../check-evidence.mjs';

/** Create evidence outside the project tree and register fixture-only cleanup.
 * @param {Object} t Node test context.
 * @returns {Object} Temporary root/output paths, never the real project tracker.
 */
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'care4u-review-test-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('care4u-review-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, output: path.join(root, 'nested/evidence') };
}
const definition = id => ({ id, kind: 'parser', command: [process.execPath, '-e', 'process.exit(0)'],
  limitations: 'Synthetic tooling fixture; no Care4U runtime assertion' });
const snapshot = () => ({ head: 'fixture-head', sha256: 'fixture-hash', files: [] });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

test('creates output directory and records command, times, snapshot and limitations', async t => {
  const options = fixture(t);
  const result = await runChecks({ ...options, checks: [definition('A')], snapshot, execute: () => ({ exit_code: 0 }) });
  const report = read(path.join(options.output, 'A.json'));
  assert.equal(result.exitCode, 0);
  assert.equal(report.result, 'PASS');
  assert.ok(report.started_at && report.finished_at && report.command.length);
  assert.equal(report.source_snapshot.sha256, 'fixture-hash');
  assert.match(report.limitations, /Synthetic/);
  assert.equal(result.manifest.runtime_verification, 'NOT_RUN');
  assert.equal(result.manifest.visual_verification, 'NOT_RUN');
});

test('failed rerun invalidates old PASS; independent later check still runs', async t => {
  const options = fixture(t);
  const checks = [definition('A'), definition('B')];
  await runChecks({ ...options, checks, snapshot, execute: () => ({ exit_code: 0 }) });
  const oldId = read(path.join(options.output, 'A.json')).run_id;
  const called = [];
  const result = await runChecks({ ...options, checks, snapshot, execute: check => {
    called.push(check.id);
    return { exit_code: check.id === 'A' ? 2 : 0 };
  } });
  assert.deepEqual(called, ['A', 'B']);
  assert.equal(result.exitCode, 1);
  assert.equal(result.manifest.result, 'FAIL');
  assert.equal(read(path.join(options.output, 'A.json')).result, 'FAIL');
  assert.equal(read(path.join(options.output, 'B.json')).result, 'PASS');
  assert.notEqual(result.manifest.run_id, oldId);
});

test('snapshot exception replaces old PASS and does not prevent independent checks', async t => {
  const options = fixture(t);
  await runChecks({ ...options, checks: [definition('A')], snapshot, execute: () => ({ exit_code: 0 }) });
  const result = await runChecks({ ...options, checks: [definition('A'), { ...definition('B'), prefixes: ['fixture/'] }],
    snapshot: (_root, prefixes) => {
      if (prefixes === undefined) throw new Error('private fixture diagnostic, must not persist');
      return snapshot();
    }, execute: () => ({ exit_code: 0 }) });
  assert.equal(result.exitCode, 1);
  const serialized = fs.readFileSync(path.join(options.output, 'A.json'), 'utf8');
  assert.equal(JSON.parse(serialized).result, 'FAIL');
  assert.ok(!serialized.includes('private fixture diagnostic'));
  assert.equal(read(path.join(options.output, 'B.json')).result, 'PASS');
});

test('changed input during a check invalidates a successful process', async t => {
  const options = fixture(t);
  let count = 0;
  const result = await runChecks({ ...options, checks: [definition('A')],
    snapshot: () => ({ ...snapshot(), sha256: String(++count) }), execute: () => ({ exit_code: 0 }) });
  assert.equal(result.exitCode, 1);
  assert.equal(read(path.join(options.output, 'A.json')).result, 'INVALIDATED');
});

test('before executing first check every previous report is invalidated', async t => {
  const options = fixture(t);
  const checks = [definition('A'), definition('B')];
  await runChecks({ ...options, checks, snapshot, execute: () => ({ exit_code: 0 }) });
  await runChecks({ ...options, checks, snapshot, execute: check => {
    if (check.id === 'A') {
      assert.equal(read(path.join(options.output, 'manifest.json')).result, 'RUNNING');
      assert.equal(read(path.join(options.output, 'B.json')).result, 'PENDING');
    }
    return { exit_code: 0 };
  } });
});

test('real command failure yields nonzero CLI status without raw output leakage', t => {
  const options = fixture(t);
  const failureScript = path.join(options.root, 'failure.mjs');
  fs.writeFileSync(failureScript, 'console.error("fixture-private"); process.exit(7);');
  const moduleUrl = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../check-evidence.mjs')).href;
  const script = `import { runChecks } from ${JSON.stringify(moduleUrl)};
    const result = await runChecks({root: ${JSON.stringify(options.root)}, output: ${JSON.stringify(options.output)},
      checks: [{id:'A',kind:'syntax',command:[process.execPath,${JSON.stringify(failureScript)}],limitations:'fixture'}],
      snapshot: () => ({head:'fixture',sha256:'same',files:[]})}); process.exitCode=result.exitCode;`;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 1);
  const serialized = fs.readFileSync(path.join(options.output, 'A.json'), 'utf8');
  const report = JSON.parse(serialized);
  assert.equal(report.exit_code, 7);
  assert.equal(report.result, 'FAIL');
  assert.ok(!serialized.includes('fixture-private'));
});

test('missing check executable is a reported failure', t => {
  const options = fixture(t);
  const result = executeCommand({ ...definition('A'), command: [path.join(options.root, 'missing-tool')] }, options.root);
  assert.equal(result.exit_code, 1);
  assert.ok(result.error_code);
});

test('missing tracked inputs cannot yield PASS from a process that skips them', async t => {
  const options = fixture(t);
  let executed = false;
  const result = await runChecks({ ...options, checks: [definition('A')],
    snapshot: () => ({ ...snapshot(), files: [{ path: 'gone.js', state: 'ENOENT' }] }),
    execute: () => { executed = true; return { exit_code: 0 }; } });
  assert.equal(result.exitCode, 1);
  assert.equal(executed, false);
  assert.equal(read(path.join(options.output, 'A.json')).error_code, 'SOURCE_INPUT_UNAVAILABLE');
});

test('source snapshots include untracked source and exclude self-generated reports and live env', t => {
  const { root } = fixture(t);
  const git = (...args) => execFileSync('git', ['-c', 'core.autocrlf=false', ...args],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  git('init');
  fs.writeFileSync(path.join(root, 'app.js'), 'const original = 1;');
  git('add', '--', 'app.js');
  git('-c', 'user.name=Review fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', 'fixture');
  const before = sourceSnapshot(root);
  fs.writeFileSync(path.join(root, 'new.js'), 'const untracked = 2;');
  const sourceChanged = sourceSnapshot(root);
  assert.notEqual(before.sha256, sourceChanged.sha256);
  assert.ok(sourceChanged.files.some(file => file.path === 'new.js'));
  fs.mkdirSync(path.join(root, 'docs/review/evidence'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/review/evidence/report.json'), '{}');
  fs.writeFileSync(path.join(root, '.env'), 'SYNTHETIC_FIXTURE=not-live');
  assert.equal(sourceSnapshot(root).sha256, sourceChanged.sha256);
});
