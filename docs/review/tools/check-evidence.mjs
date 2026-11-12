/**
 * @file check-evidence.mjs
 * @module Review verification tooling
 * @desc Independent, atomic static-check reports tied to source snapshots.
 * @author Codex Review Assistant (review tooling; no student attribution)
 * Review assistant tooling; no student authorship claimed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';

/** Hash bytes without exposing source/configuration contents.
 * @param {string|Buffer} data Bytes to fingerprint.
 * @returns {string} SHA-256 hex digest.
 */
export function digest(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Atomically replace a serialized report; a write error never truncates it.
 * @param {string} file Destination report path.
 * @param {Object} data Serializable evidence.
 * @returns {void}
 */
export function atomicJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

/** Fingerprint tracked and nonignored untracked inputs; never read live .env files.
 * @param {string} root Repository root.
 * @param {string[]} prefixes Application scopes; tooling is always included.
 * @returns {Object} Commit context, content digest and per-path fingerprints.
 */
export function sourceSnapshot(root, prefixes = []) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
  const files = [...new Set([...tracked, ...untracked])].sort().filter(file =>
    !file.startsWith('docs/review/evidence/') && file !== 'docs/review/FILE_REVIEW_TRACKER.csv' &&
    !file.includes('/.vite/') && !file.includes('/__pycache__/') &&
    (!path.basename(file).startsWith('.env') || path.basename(file) === '.env.example') &&
    (file.startsWith('docs/review/tools/') || prefixes.length === 0 || prefixes.some(prefix => file.startsWith(prefix)))
  ).map(file => {
    const absolute = path.resolve(root, file);
    try {
      const stats = fs.lstatSync(absolute);
      if (!stats.isFile() || stats.isSymbolicLink()) return { path: file, state: 'unsupported-file-type' };
      return { path: file, sha256: digest(fs.readFileSync(absolute)) };
    } catch (error) {
      return { path: file, state: error.code || error.name };
    }
  });
  return { head: git('rev-parse', 'HEAD').trim(), sha256: digest(JSON.stringify(files)), files };
}

/** Execute a static command with no service credentials and retain metadata only.
 * @param {Object} check Command, cwd, kind and optional timeout.
 * @param {string} root Repository root.
 * @returns {Object} Exit status and structured diagnostics without raw source.
 */
export function executeCommand(check, root) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(VITE_|EXPO_PUBLIC_|DB_|DATABASE_URL$|SESSION_|EMAIL_|SUPABASE_|TELEGRAM_|GEMINI_|GROQ_)/.test(name)
  ));
  const child = spawnSync(check.command[0], check.command.slice(1), {
    cwd: path.resolve(root, check.cwd || '.'), env, encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024, timeout: check.timeoutMs || 120000,
    windowsHide: true,
  });
  const stdout = child.stdout || '';
  const stderr = child.stderr || '';
  const marker = stdout.split(/\r?\n/).findLast(line => line.startsWith('CARE4U_CHECK_RESULT '));
  let details = {};
  if (marker) details = JSON.parse(marker.slice('CARE4U_CHECK_RESULT '.length));
  if (check.kind === 'lint' && stdout.trim()) {
    const entries = JSON.parse(stdout);
    details = {
      files: entries.length,
      errors: entries.reduce((sum, entry) => sum + entry.errorCount, 0),
      warnings: entries.reduce((sum, entry) => sum + entry.warningCount, 0),
      diagnostics: entries.flatMap(entry => entry.messages.map(message => ({
        path: path.relative(root, entry.filePath).replaceAll('\\', '/'),
        line: message.line, column: message.column, rule: message.ruleId, severity: message.severity,
      }))),
    };
  }
  const syntaxCount = stdout.match(/Syntax check passed for (\d+) backend/);
  if (syntaxCount) details.files = Number(syntaxCount[1]);
  const moduleCount = stdout.match(/(\d+) modules transformed/);
  if (moduleCount) details.transformed_modules = Number(moduleCount[1]);
  const warnings = [];
  if (stderr.includes('PLUGIN_TIMINGS') || stdout.includes('PLUGIN_TIMINGS')) warnings.push('Vite plugin timing warning');
  return {
    exit_code: child.status ?? 1,
    error_code: child.error?.code || (child.signal ? `signal:${child.signal}` : null),
    details, warnings,
    output: { stdout_sha256: digest(stdout), stderr_sha256: digest(stderr),
      stdout_bytes: Buffer.byteLength(stdout), stderr_bytes: Buffer.byteLength(stderr),
      policy: 'Raw output not persisted; no source snippets or environment values in evidence' },
  };
}

/** Run every required check independently, invalidating old PASS before any work.
 * @param {Object} options Root/output/check definitions and fixture-injectable I/O.
 * @returns {Object} Manifest and exitCode (1 if any required check failed).
 */
export async function runChecks({ root, output, checks, execute = executeCommand, snapshot = sourceSnapshot }) {
  const runId = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  const manifest = { format_version: 2, run_id: runId, started_at: new Date().toISOString(),
    result: 'RUNNING', checks: checks.map(check => ({ id: check.id, result: 'PENDING' })),
    runtime_verification: 'NOT_RUN', visual_verification: 'NOT_RUN' };
  // Manifest goes first. Readers must require matching run_id, completed result
  // and matching source hash; an interrupted run can never validate old PASS.
  atomicJson(path.join(output, 'manifest.json'), manifest);
  const reports = new Map();
  for (const check of checks) {
    const report = { id: check.id, kind: check.kind, required: check.required !== false,
      run_id: runId, command: check.command, cwd: check.cwd || '.', result: 'PENDING',
      source_snapshot: null, limitations: check.limitations,
      started_at: null, finished_at: null };
    atomicJson(path.join(output, `${check.id}.json`), report);
    reports.set(check.id, report);
  }
  for (const check of checks) {
    const report = reports.get(check.id);
    report.result = 'RUNNING';
    report.started_at = new Date().toISOString();
    atomicJson(path.join(output, `${check.id}.json`), report);
    try {
      report.source_snapshot = snapshot(root, check.prefixes);
      if (report.source_snapshot.files.some(file => file.state)) {
        const error = new Error('Unavailable source inputs');
        error.code = 'SOURCE_INPUT_UNAVAILABLE';
        throw error;
      }
      const result = await execute(check, root);
      Object.assign(report, result);
      const after = snapshot(root, check.prefixes);
      report.result = report.source_snapshot.sha256 !== after.sha256 ? 'INVALIDATED'
        : result.exit_code === 0 ? 'PASS' : 'FAIL';
      if (report.result === 'INVALIDATED') report.limitation_at_run = 'Inputs changed while checking; rerun required';
    } catch (error) {
      report.result = 'FAIL';
      report.exit_code = 1;
      // Avoid error.message because child/tool exceptions can contain raw source.
      report.error_code = error.code || error.name;
    }
    report.finished_at = new Date().toISOString();
    atomicJson(path.join(output, `${check.id}.json`), report);
    Object.assign(manifest.checks.find(item => item.id === check.id), {
      result: report.result, source_sha256: report.source_snapshot?.sha256 || null,
    });
    atomicJson(path.join(output, 'manifest.json'), manifest);
  }
  const failed = [...reports.values()].some(report => report.required && report.result !== 'PASS');
  manifest.result = failed ? 'FAIL' : 'PASS';
  manifest.finished_at = new Date().toISOString();
  atomicJson(path.join(output, 'manifest.json'), manifest);
  return { manifest, exitCode: failed ? 1 : 0 };
}
