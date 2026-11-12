/**
 * @file static-worker.mjs
 * @module Review verification tooling
 * @desc Isolated parsing, in-memory Vite compilation and package metadata checks.
 * @author Codex Review Assistant (review tooling; no student attribution)
 * Review assistant tooling; no student authorship claimed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

const [kind, rootArg] = process.argv.slice(2);
const root = path.resolve(rootArg);
let details;
let failed = false;

/** Parse each tracked mobile file independently; no module evaluation occurs.
 * @returns {Object} Per-file parser results and counts; sets failure flag on error.
 */
function parseMobile() {
  const parser = createRequire(path.join(root, 'mobile/package.json'))('@babel/parser');
  const files = execFileSync('git', ['ls-files', '-z', 'mobile'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(file => file.endsWith('.js'));
  const results = files.map(file => {
    try {
      parser.parse(fs.readFileSync(path.join(root, file), 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
      return { path: file, result: 'PASS' };
    } catch (error) {
      failed = true;
      return { path: file, result: 'FAIL', error_code: error.code || error.name,
        line: error.loc?.line, column: error.loc?.column };
    }
  });
  return { files: files.length, passed: results.filter(item => item.result === 'PASS').length, results };
}

/** Compile the actual web graph with no .env loading and no output writes.
 * @returns {Promise<Object>} In-memory artifact sizes and safe environment policy.
 */
async function bundleWeb() {
  const { build } = await import(pathToFileURL(path.join(root, 'frontend/node_modules/vite/dist/node/index.js')));
  for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key];
  process.env.VITE_API_URL = 'https://api.example.test';
  const result = await build({ root: path.join(root, 'frontend'), envDir: false, mode: 'production',
    build: { write: false } });
  const artifacts = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output.map(item => ({
    file: item.fileName, kind: item.type,
    bytes: Buffer.byteLength(item.type === 'chunk' ? item.code : item.source),
  })));
  return { artifacts, env_files_loaded: false, write: false, api_origin: 'https://api.example.test' };
}

/** Compare direct dependencies and lock-root metadata, without registry access.
 * @returns {Object} Direct version comparisons; sets failure flag on mismatch.
 */
function dependencies() {
  const scopes = [];
  for (const layer of ['', 'backend', 'frontend', 'mobile']) {
    const directory = path.join(root, layer);
    const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    const manifest = readJson(path.join(directory, 'package.json'));
    const lock = readJson(path.join(directory, 'package-lock.json'));
    const lockRoot = lock.packages?.[''] || {};
    const manifestMatches = ['dependencies', 'devDependencies'].every(key =>
      isDeepStrictEqual(manifest[key] || {}, lockRoot[key] || {}));
    const packages = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).map(name => {
      const locked = lock.packages?.[`node_modules/${name}`]?.version;
      let installed;
      try { installed = readJson(path.join(directory, 'node_modules', name, 'package.json')).version; }
      catch { installed = 'MISSING'; }
      if (locked !== installed) failed = true;
      return { name, locked, installed };
    });
    if (!manifestMatches) failed = true;
    scopes.push({ layer: layer || 'root', manifest_lock_root_matches: manifestMatches, packages });
  }
  return { scopes, direct_dependencies: scopes.reduce((count, scope) => count + scope.packages.length, 0) };
}

try {
  if (kind === 'mobile-parse') details = parseMobile();
  else if (kind === 'web-build') details = await bundleWeb();
  else if (kind === 'dependencies') details = dependencies();
  else throw new Error('Unknown static worker kind');
} catch (error) {
  failed = true;
  details = { error_code: error.code || error.name };
}
console.log('CARE4U_CHECK_RESULT ' + JSON.stringify(details));
process.exitCode = failed ? 1 : 0;
