/**
 * @file auth-resend.test.cjs
 * @module Authentication regression tests
 * @desc Controlled interleavings of the actual resend service and repository contract.
 * @author Codex Review Assistant (new tests; no student authorship assigned)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, NOW } = require('./support/isolated.cjs');

/** Run actual resend code against a mutable synthetic pending-record boundary.
 * @param {Object} options Interleaving and email outcomes for the case.
 * @returns {Object} Actual service exports, current row accessor and operation log.
 */
function fixture({ afterRead = () => {}, send, absent = false, updateFailure = false } = {}) {
  let row = absent ? null : { id: 'pending-a', email: 'person@example.test', phone: 'old-phone',
    password_hash: 'old-hash', role: 'patient', profile_data: { fullName: 'Old fixture' }, otp_code: '111111' };
  const events = [], messages = [];
  let sequence = 222221;
  const repository = {
    findOtpByEmail: async () => {
      events.push('read');
      const snapshot = row ? structuredClone(row) : null;
      afterRead({ get: () => row, set: value => { row = value; } });
      return snapshot;
    },
    upsertOtpVerification: async (email, phone, hash, role, code, expires, profile) => {
      events.push('unsafe-upsert');
      row = { id: row?.id || 'recreated-row', email, phone, password_hash: hash, role,
        profile_data: profile, otp_code: code, otp_expires_at: expires };
      return structuredClone(row);
    },
    replacePendingOtp: async (id, email, code, expires) => {
      events.push('replace-code');
      if (updateFailure) throw new Error('fixture update failed');
      if (!row || row.id !== id || row.email !== email) return null;
      row.otp_code = code; row.otp_expires_at = expires;
      return structuredClone(row);
    },
    withTransaction: async () => { throw new Error('Resend must not hold an email transaction'); },
  };
  const service = load('backend/src/modules/auth/auth.service.js', {
    bcryptjs: {}, crypto: {}, './auth.repository': repository,
    '../../utils/otp': { generateOtp: () => String(++sequence), getOtpExpiry: () => new Date(NOW + 600000) },
    '../../utils/qr': {}, '../../utils/email': { sendOtpEmail: async (email, code) => {
      events.push('email'); messages.push({ email, code });
      return send ? send(email, code) : { success: true };
    } },
  });
  return { service, get: () => row, events, messages };
}

test('resend preserves a newer registration update instead of restoring stale identity fields', async () => {
  const f = fixture({ afterRead: state => state.set({ ...state.get(), phone: 'new-phone',
    password_hash: 'new-hash', role: 'doctor', profile_data: { fullName: 'New fixture' } }) });
  await f.service.resendOtp('person@example.test');
  assert.equal(f.get().phone, 'new-phone'); assert.equal(f.get().password_hash, 'new-hash');
  assert.equal(f.get().role, 'doctor'); assert.equal(f.get().profile_data.fullName, 'New fixture');
  assert.ok(!f.events.includes('unsafe-upsert'));
});

test('resend cannot recreate a pending row consumed by verification before its write', async () => {
  const f = fixture({ afterRead: state => state.set(null) });
  await assert.rejects(f.service.resendOtp('person@example.test'), /No pending registration/);
  assert.equal(f.get(), null); assert.equal(f.messages.length, 0);
});

test('resend does not target a different new row with the same email', async () => {
  const f = fixture({ afterRead: state => state.set({ ...state.get(), id: 'pending-b', password_hash: 'new-hash' }) });
  await assert.rejects(f.service.resendOtp('person@example.test'), /No pending registration/);
  assert.equal(f.get().id, 'pending-b'); assert.equal(f.get().password_hash, 'new-hash'); assert.equal(f.messages.length, 0);
});

test('missing pending registration causes no write or provider request', async () => {
  const f = fixture({ absent: true });
  await assert.rejects(f.service.resendOtp('missing@example.test'), /No pending registration/);
  assert.deepEqual(f.events, ['read']);
});

test('successful resend confirms a code-only update before provider submission', async () => {
  const f = fixture(); const result = await f.service.resendOtp('person@example.test');
  assert.deepEqual(f.events, ['read', 'replace-code', 'email']);
  assert.equal(result.email, 'person@example.test'); assert.equal(f.get().otp_code, f.messages[0].code);
  assert.equal(f.get().password_hash, 'old-hash'); assert.equal(result.otpExpiresAt.getTime(), NOW + 600000);
});

for (const outcome of ['reject', 'throw']) test(`resend provider ${outcome} leaves replacement code stored and reports delivery failure`, async () => {
  const f = fixture({ send: async () => { if (outcome === 'throw') throw new Error('fixture provider'); return { success: false }; } });
  await assert.rejects(f.service.resendOtp('person@example.test'), /Failed to send OTP email/);
  assert.equal(f.get().otp_code, '222222'); assert.equal(f.get().password_hash, 'old-hash');
  assert.ok(!f.events.includes('unsafe-upsert'));
});

test('repository update failure never submits an email', async () => {
  const f = fixture({ updateFailure: true });
  await assert.rejects(f.service.resendOtp('person@example.test'), /fixture update failed/);
  assert.equal(f.messages.length, 0);
});

test('overlapping email completion order does not imply both emails contain the final code', async () => {
  let completeFirst;
  const f = fixture({ send: async (_email, code) => code === '222222'
    ? new Promise(resolve => { completeFirst = resolve; }) : { success: true } });
  const first = f.service.resendOtp('person@example.test');
  while (!completeFirst) await Promise.resolve();
  await f.service.resendOtp('person@example.test');
  completeFirst({ success: true }); await first;
  assert.equal(f.get().otp_code, '222223'); assert.equal(f.messages[0].code, '222222');
});

test('replacement repository uses one parameterized UPDATE bounded by pending id/email', async () => {
  let call;
  const repo = load('backend/src/modules/auth/auth.repository.js', { '../../config/db': { pool: {
    query: async (sql, args) => { call = { sql, args }; return { rows: [] }; },
  } } });
  assert.equal(await repo.replacePendingOtp('pending-a', 'person@example.test', '123456', new Date(NOW)), null);
  assert.match(call.sql, /^\s*UPDATE otp_verifications/);
  assert.match(call.sql, /WHERE id = \$1 AND email = \$2/);
  assert.ok(!/INSERT|ON CONFLICT|password_hash\s*=|profile_data\s*=|role\s*=|phone\s*=/i.test(call.sql));
  assert.equal(call.args[0], 'pending-a'); assert.equal(call.args[2], '123456');
});
