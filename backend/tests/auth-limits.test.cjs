/**
 * @file auth-limits.test.cjs
 * @module Authentication regression tests
 * @desc Execute installed rate-limit middleware/MemoryStore, with synthetic HTTP
 *       objects and controlled time. No database, network listener or email call.
 * @author Codex Review Assistant (new tests; no student credit claimed)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../node_modules/express-rate-limit');
const { readLimitConfig, createAuthLimiters } = require('../src/modules/auth/auth.limits');

/** Create real middleware and stores; small synthetic limits make boundaries visible.
 * @param {Object} t Node test context for store cleanup.
 * @param {Object} env Synthetic threshold overrides.
 * @param {Function} alterStore Optional store fault injection.
 * @returns {Object} Limiters and their actual stores.
 */
function fixture(t, env = {}, alterStore) {
  const stores = {};
  const limits = createAuthLimiters({ env: { AUTH_RATE_WINDOW_MS: '1000', AUTH_EMAIL_IP_LIMIT: '3',
    AUTH_EMAIL_ADDRESS_LIMIT: '2', AUTH_VERIFY_IP_LIMIT: '3', AUTH_VERIFY_EMAIL_LIMIT: '2',
    AUTH_RESET_IP_LIMIT: '3', AUTH_RESET_TOKEN_LIMIT: '2', ...env }, storeFactory: name => {
    const store = new MemoryStore(); stores[name] = store;
    alterStore?.(store, name); return store;
  } });
  t.after(() => Object.values(stores).forEach(store => store.shutdown()));
  return { limits, stores };
}

/** Execute real middleware in route order and count whether controller is reached.
 * @param {Array<Function>} chain Middleware preceding a synthetic controller.
 * @param {Object} body Synthetic parsed JSON.
 * @param {string} ip Direct client IP.
 * @returns {Promise<Object>} HTTP result, headers and downstream invocation count.
 */
async function request(chain, body = { email: 'person@example.test' }, ip = '203.0.113.10') {
  const result = { status: 200, headers: {}, downstream: 0 };
  const req = { ip, body, headers: {}, app: { get: () => 0 }, method: 'POST', originalUrl: '/synthetic-auth' };
  const res = { headersSent: false, writableEnded: false,
    setHeader: (name, value) => { result.headers[name.toLowerCase()] = value; },
    status: value => { result.status = value; return res; },
    send: value => { result.body = value; res.writableEnded = true; },
  };
  for (const middleware of chain) {
    let next = false;
    await middleware(req, res, error => { next = true; if (error) result.error = error; });
    if (result.error || res.writableEnded || !next) return result;
  }
  result.downstream++; return result;
}

test('defaults and configurable thresholds reject settings that could disable or break the limiter', () => {
  const config = readLimitConfig({});
  assert.equal(config.AUTH_RATE_WINDOW_MS, 900000); assert.equal(config.AUTH_EMAIL_ADDRESS_LIMIT, 5);
  for (const name of Object.keys(config)) for (const value of ['', '0', '-1', '1.5', 'Infinity', 'oops']) {
    assert.throws(() => readLimitConfig({ [name]: value }), new RegExp(name));
  }
  assert.throws(() => readLimitConfig({ AUTH_RATE_WINDOW_MS: '2147483648' }), /at most/);
  assert.equal(readLimitConfig({ AUTH_VERIFY_EMAIL_LIMIT: '7' }).AUTH_VERIFY_EMAIL_LIMIT, 7);
});

for (const [label, ipName, fieldName, body] of [
  ['email generation', 'emailIp', 'emailAddress', { email: 'person@example.test' }],
  ['OTP verification', 'verifyIp', 'verifyEmail', { email: 'person@example.test', otp: '000000' }],
  ['password reset', 'resetIp', 'resetToken', { token: 'a'.repeat(64) }],
]) test(`actual ${label} middleware permits budget, rejects excess, and retries after expiry`, async t => {
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1800000000000 });
  const { limits } = fixture(t);
  const chain = [limits[ipName], limits[fieldName]];
  assert.equal((await request(chain, body)).downstream, 1);
  assert.equal((await request(chain, body)).downstream, 1);
  const denied = await request(chain, body);
  assert.equal(denied.downstream, 0); assert.equal(denied.status, 429);
  assert.match(denied.body.message, /Too many authentication requests/);
  assert.ok(Number(denied.headers['retry-after']) > 0); assert.ok(denied.headers['ratelimit-limit']);
  t.mock.timers.tick(1001);
  assert.equal((await request(chain, body)).downstream, 1);
});

test('email generation shares address budget across IPs and normalized spelling without changing request data', async t => {
  const { limits, stores } = fixture(t);
  const body = { email: ' Person@Example.Test ' };
  // These same instances are wired into register, resend and forgot-password.
  assert.equal((await request([limits.emailIp, limits.emailAddress], body)).downstream, 1);
  assert.equal(body.email, ' Person@Example.Test ');
  assert.equal((await request([limits.emailIp, limits.emailAddress], { email: 'person@example.test' }, '203.0.113.11')).downstream, 1);
  assert.equal((await request([limits.emailIp, limits.emailAddress], { email: 'PERSON@example.test' }, '203.0.113.12')).status, 429);
  assert.ok([...stores.emailAddress.current.keys()].every(key => /^[a-f0-9]{64}$/.test(key)));
  assert.equal((await request([limits.verifyIp, limits.verifyEmail], body)).downstream, 1);
});

test('actual IP budget bounds rotating addresses/tokens and blocks before field/controller work', async t => {
  const { limits, stores } = fixture(t);
  for (let index = 0; index < 3; index++) assert.equal((await request([limits.resetIp, limits.resetToken], { token: String(index) })).downstream, 1);
  assert.equal((await request([limits.resetIp, limits.resetToken], { token: 'unseen-token' })).status, 429);
  assert.equal(stores.resetToken.current.size, 3);
});

test('IPv6 addresses in the same /56 share actual IP budget; other clients and fields remain independent', async t => {
  const { limits } = fixture(t, { AUTH_EMAIL_IP_LIMIT: '1' });
  assert.equal((await request([limits.emailIp], {}, '2001:db8:1234:5600::1')).downstream, 1);
  assert.equal((await request([limits.emailIp], {}, '2001:db8:1234:56ff::2')).status, 429);
  assert.equal((await request([limits.emailIp], {}, '2001:db8:1234:5700::2')).downstream, 1);
});

test('malformed field shapes use a bounded fallback bucket instead of throwing or reaching controller indefinitely', async t => {
  const { limits } = fixture(t);
  for (const name of ['emailAddress', 'verifyEmail', 'resetToken']) {
    assert.equal((await request([limits[name]], null)).downstream, 1);
    assert.equal((await request([limits[name]], { email: {}, token: [] })).downstream, 1);
    assert.equal((await request([limits[name]], { email: ' ', token: '' })).status, 429);
  }
});

test('all permitted attempts count even if downstream validation/provider fails', async t => {
  const { limits } = fixture(t, { AUTH_EMAIL_ADDRESS_LIMIT: '1' });
  const failed = await request([limits.emailAddress, (_req, _res, next) => next(new Error('synthetic provider failure'))]);
  assert.match(failed.error.message, /provider failure/);
  assert.equal((await request([limits.emailAddress])).status, 429);
});

test('store failure propagates without invoking downstream controller/provider', async t => {
  const { limits } = fixture(t, {}, (store, name) => {
    if (name === 'verifyEmail') store.increment = async () => { throw new Error('synthetic store failure'); };
  });
  const result = await request([limits.verifyIp, limits.verifyEmail]);
  assert.equal(result.downstream, 0); assert.match(result.error.message, /store failure/);
});
