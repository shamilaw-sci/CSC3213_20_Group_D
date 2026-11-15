/**
 * @file isolated.cjs
 * @module Authentication regression tests
 * @desc Load actual CommonJS source with explicit mocks and no live-service imports.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const NOW = Date.parse('2026-11-12T10:00:00.000Z');

/** Evaluate one trusted source file with a deterministic clock and closed import set.
 * @param {string} file Repository-relative source path.
 * @param {Object} mocks Exact require specifiers mapped to controlled substitutes.
 * @param {Object} options Optional clock/environment fixtures.
 * @returns {*} Actual module exports; unexpected imports/network/timers throw.
 */
function load(file, mocks, options = {}) {
  const module = { exports: {} };
  const instant = options.now ?? NOW;
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [instant])); }
    static now() { return instant; }
  }
  const denied = () => { throw new Error('Unexpected external effect in isolated test'); };
  const context = vm.createContext({
    module, exports: module.exports, Date: Clock,
    process: { env: { ...(options.env || {}) } },
    console: { log() {}, warn() {}, error() {} },
    fetch: denied, setInterval: denied, setTimeout: denied,
    require(specifier) {
      if (!Object.hasOwn(mocks, specifier)) throw new Error(`Unexpected import: ${specifier} in ${file}`);
      return mocks[specifier];
    },
  });
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }).runInContext(context);
  return module.exports;
}

/** Make a controllable Express-session double, preserving lifecycle order.
 * @param {Object} user Optional existing session identity.
 * @param {Object} failures Optional regeneration/save/destroy errors.
 * @returns {Object} Request session and recorded callback operations.
 */
function sessionRequest(user, failures = {}) {
  const events = [];
  const req = { body: {}, params: {}, query: {} };
  const makeSession = () => ({
    user,
    regenerate(callback) {
      events.push('regenerate');
      if (!failures.regenerate) req.session = makeSession();
      if (!failures.regenerate) delete req.session.user;
      callback(failures.regenerate || null);
    },
    save(callback) { events.push('save'); callback(failures.save || null); },
    destroy(callback) { events.push('destroy'); callback(failures.destroy || null); },
  });
  req.session = makeSession();
  return { req, events };
}

/** Capture HTTP output without binding a socket.
 * @returns {Object} Chainable response double, status, JSON body and cleared cookies.
 */
function response() {
  return { statusCode: 200, cookies: [], status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }, clearCookie(...args) { this.cookies.push(args); } };
}
module.exports = { load, NOW, sessionRequest, response };
