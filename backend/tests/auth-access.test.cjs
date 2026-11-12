/**
 * @file auth-access.test.cjs
 * @module Authentication regression tests
 * @desc Synthetic policy/lifecycle tests of actual application modules with closed mocks.
 * @author Codex Review Assistant (test implementation; no student credit claimed)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, NOW, sessionRequest, response } = require('./support/isolated.cjs');
const USER = { id: 'user-a', role: 'patient', email: 'patient@example.test', is_active: true,
  verification_status: 'approved', password_hash: 'synthetic-hash', profile_id: 'patient-a' };
const TOKEN = 'a'.repeat(64);

/** Construct actual auth service with strict synthetic repository/provider boundaries.
 * @param {Object} overrides Repository substitutes for the case.
 * @param {Object} extra Email helper substitutes.
 * @returns {Object} Actual service exports, event log and shared fixture client.
 */
function service(overrides = {}, extra = {}) {
  const events = [];
  const db = { fixture: 'transaction-client' };
  const repository = {
    findUserByEmail: async () => ({ ...USER }),
    withTransaction: async callback => { events.push('transaction'); return callback(db); },
    incrementFailedLoginAttempts: async () => events.push('increment'),
    resetFailedLoginAttempts: async () => events.push('clear-failures'),
    getValidPasswordResetToken: async (_token, client) => { events.push(['read-token', client]); return { user_id: USER.id }; },
    updateUserPassword: async (_id, _hash, client) => events.push(['password', client]),
    markTokenAsUsed: async (_token, client) => { events.push(['used', client]); return { token: TOKEN }; },
    findOtpByEmail: async (_email, client) => { events.push(['read-otp', client]); return { id: 'pending-a', email: USER.email, role: 'patient', otp_code: '123456', otp_expires_at: new Date(NOW + 1000), profile_data: {} }; },
    createUser: async () => ({ ...USER }), createPatient: async () => ({ id: 'patient-a' }),
    createDoctor: async () => ({ id: 'doctor-a' }), createPharmacy: async () => ({ id: 'pharmacy-a' }),
    createLaboratory: async () => ({ id: 'lab-a' }), createHospital: async () => ({ id: 'hospital-a' }),
    deleteOtpByEmail: async (_email, client) => events.push(['delete-otp', client]),
    upsertOtpVerification: async () => events.push('store-otp'),
    replacePendingOtp: async () => { events.push('replace-otp'); return { id: 'pending-a' }; },
    savePasswordResetToken: async () => events.push('store-reset'), ...overrides,
  };
  const api = load('backend/src/modules/auth/auth.service.js', {
    'bcryptjs': { compare: async password => password === 'correct-password', hash: async () => 'new-synthetic-hash' },
    'crypto': { randomBytes: () => ({ toString: () => TOKEN }) },
    '../../utils/otp': { generateOtp: () => '123456', getOtpExpiry: () => new Date(NOW + 600000) },
    '../../utils/email': { sendOtpEmail: async () => ({ success: true }), sendPasswordResetEmail: async () => ({ success: true }), ...extra },
    '../../utils/qr': { generatePatientQR: () => 'synthetic-qr' }, './auth.repository': repository,
  });
  return { api, events, db };
}

/** Load the real controller with only the five profile lookups and service mocked.
 * @param {Object} overrides Service behavior for the case.
 * @returns {Object} Actual HTTP controller exports; no server is started.
 */
function controller(overrides = {}) {
  const api = { login: async () => ({ ...USER }), verifyOtp: async () => ({ user: { ...USER }, profile: { id: 'patient-a', full_name: 'Synthetic Person' } }),
    register: async () => ({ email: USER.email }), resendOtp: async () => ({ email: USER.email }),
    forgotPassword: async () => ({ message: 'Generic recovery response' }), resetPassword: async () => {}, ...overrides };
  return load('backend/src/modules/auth/auth.controller.js', {
    './auth.service': api,
    '../patient/patient.repository': { getPatientByUserId: async () => ({ id: 'patient-a', full_name: 'Synthetic Person' }) },
    '../doctor/doctor.repository': { getDoctorByUserId: async () => ({ id: 'doctor-a' }) },
    '../pharmacy/pharmacy.repository': { getPharmacyByUserId: async () => ({ id: 'pharmacy-a' }) },
    '../laboratory/laboratory.repository': { getLaboratoryByUserId: async () => ({ id: 'lab-a' }) },
    '../hospital/hospital.repository': { getHospitalByUserId: async () => ({ id: 'hospital-a' }) },
  });
}

test('isolation refuses live config, unlisted imports and network-capable dependencies', () => {
  assert.throws(() => load('backend/src/modules/auth/auth.repository.js', {}), /Unexpected import/);
  assert.throws(() => load('backend/app.js', {}), /Unexpected import/);
});

for (const [name, row, status] of [
  ['approved patient', USER, 200], ['approved doctor', { ...USER, role: 'doctor' }, 200],
  ['inactive', { ...USER, is_active: false }, 403], ['rejected patient', { ...USER, verification_status: 'rejected' }, 403],
  ['pending doctor', { ...USER, role: 'doctor', verification_status: 'pending' }, 403], ['deleted account', null, 403],
]) test(`authentication account state: ${name}`, async () => {
  const auth = load('backend/src/middleware/auth.js', { '../config/db': { pool: { query: async () => ({ rows: row ? [row] : [] }) } } });
  const { req, events } = sessionRequest({ ...USER, role: row?.role || 'patient' });
  const res = response(); let allowed = false;
  await auth.isAuthenticated(req, res, () => { allowed = true; });
  assert.equal(res.statusCode, status); assert.equal(allowed, status === 200);
  if (status === 403) assert.ok(events.includes('destroy'));
});

test('missing session denies before DB access and repository failures deny safely', async () => {
  const auth = load('backend/src/middleware/auth.js', { '../config/db': { pool: { query: async () => { throw new Error('fixture DB unavailable'); } } } });
  const res = response(); await auth.isAuthenticated({}, res, () => assert.fail()); assert.equal(res.statusCode, 401);
  const { req } = sessionRequest(USER); const broken = response();
  await auth.isAuthenticated(req, broken, () => assert.fail()); assert.equal(broken.statusCode, 500);
  assert.equal(broken.body.message, 'Internal server error');
});

test('role changed after login invalidates stale admin session before authorization', async () => {
  const auth = load('backend/src/middleware/auth.js', { '../config/db': { pool: { query: async () => ({ rows: [{ ...USER, role: 'doctor' }] }) } } });
  const { req, events } = sessionRequest({ ...USER, role: 'admin' }); const res = response();
  await auth.isAuthenticated(req, res, () => auth.authorize('admin')(req, res, () => assert.fail('stale admin must not pass')));
  assert.equal(res.statusCode, 401); assert.ok(events.includes('destroy'));
});

test('role/profile guards fail closed for absent session, wrong role and wrong profile', () => {
  const auth = load('backend/src/middleware/auth.js', { '../config/db': {} });
  const noSession = response(); auth.authorize('admin')({}, noSession, () => assert.fail()); assert.equal(noSession.statusCode, 401);
  const req = { session: { user: USER }, params: { id: 'patient-b' } };
  const wrong = response(); auth.authorize('doctor')(req, wrong, () => assert.fail()); assert.equal(wrong.statusCode, 403);
  const profile = response(); auth.authorizeOwnProfile()(req, profile, () => assert.fail()); assert.equal(profile.statusCode, 403);
  req.params.id = 'patient-a'; let allowed = false; auth.authorizeOwnProfile()(req, response(), () => { allowed = true; }); assert.ok(allowed);
});

for (const [name, user, patient, appointment, expected] of [
  ['patient owns profile', USER, 'patient-a', null, true],
  ['patient requests other profile', USER, 'patient-b', null, false],
  ['assigned active doctor', { ...USER, role: 'doctor', profile_id: 'doctor-a' }, 'patient-a', { patient_id: 'patient-a', doctor_id: 'doctor-a', status: 'in_progress' }, true],
  ['other doctor', { ...USER, role: 'doctor', profile_id: 'doctor-b' }, 'patient-a', { patient_id: 'patient-a', doctor_id: 'doctor-a', status: 'in_progress' }, false],
  ['other patient appointment', { ...USER, role: 'doctor', profile_id: 'doctor-a' }, 'patient-b', { patient_id: 'patient-a', doctor_id: 'doctor-a', status: 'in_progress' }, false],
  ['completed appointment', { ...USER, role: 'doctor', profile_id: 'doctor-a' }, 'patient-a', { patient_id: 'patient-a', doctor_id: 'doctor-a', status: 'completed' }, false],
  ['missing appointment', { ...USER, role: 'doctor', profile_id: 'doctor-a' }, 'patient-a', null, false],
  ['pharmacist not enabled', { ...USER, role: 'pharmacist' }, 'patient-a', null, false],
]) test(`patient resource boundary: ${name}`, async () => {
  const access = load('backend/src/middleware/patientAccess.js', { '../modules/appointment/appointment.repository': { getAppointmentById: async () => appointment } });
  const req = { session: { user }, params: { id: patient }, query: { appointmentId: 'appointment-a' } };
  let allowed = false; const res = response();
  await access.authorizePatientResource({ allowDoctor: true })(req, res, () => { allowed = true; });
  assert.equal(allowed, expected); if (!expected) assert.equal(res.statusCode, 403);
});

test('patient resource DB failure is 500 and does not pass access', async () => {
  const access = load('backend/src/middleware/patientAccess.js', { '../modules/appointment/appointment.repository': { getAppointmentById: async () => { throw new Error('fixture'); } } });
  const res = response(); await access.authorizePatientResource({ allowDoctor: true })({ session: { user: { ...USER, role: 'doctor' } }, params: { id: 'patient-a' }, query: { appointmentId: 'a' } }, res, () => assert.fail());
  assert.equal(res.statusCode, 500);
});

for (const [name, user, password, expected] of [
  ['unknown', null, 'correct-password', 'Invalid email or password'],
  ['wrong password', USER, 'incorrect', 'Invalid email or password'],
  ['inactive valid credentials', { ...USER, is_active: false }, 'correct-password', 'Account is deactivated'],
  ['inactive incorrect credentials', { ...USER, is_active: false }, 'incorrect', 'Invalid email or password'],
  ['pending doctor', { ...USER, role: 'doctor', verification_status: 'pending' }, 'correct-password', 'Account pending'],
  ['rejected', { ...USER, verification_status: 'rejected' }, 'correct-password', 'not approved'],
  ['locked', { ...USER, locked_until: new Date(NOW + 60000) }, 'correct-password', 'Too many failed attempts'],
]) test(`login policy: ${name}`, async () => {
  const { api, events } = service({ findUserByEmail: async () => user });
  await assert.rejects(api.login(USER.email, password), error => error.message.includes(expected));
  if (name.includes('incorrect') || name === 'wrong password') assert.ok(events.includes('increment'));
});

test('valid login clears failure count and expired lockout can recover', async () => {
  const { api, events } = service({ findUserByEmail: async () => ({ ...USER, locked_until: new Date(NOW - 1) }) });
  assert.equal((await api.login(USER.email, 'correct-password')).id, USER.id); assert.ok(events.includes('clear-failures'));
});

for (const [name, expiry, code] of [
  ['expired', NOW - 1, '123456'], ['exact expiry', NOW, '123456'], ['malformed expiry', 'invalid', '123456'], ['wrong code', NOW + 1000, '000000'],
]) test(`registration OTP denies ${name}`, async () => {
  const { api } = service({ findOtpByEmail: async () => ({ email: USER.email, role: 'patient', otp_code: '123456', otp_expires_at: expiry, profile_data: {} }) });
  await assert.rejects(api.verifyOtp(USER.email, code));
});

test('OTP is read/consumed through the same transaction; sequential replay is denied', async () => {
  let consumed = false;
  const { api, db, events } = service({
    findOtpByEmail: async (_email, client) => { assert.equal(client, db); return consumed ? null : { email: USER.email, role: 'patient', otp_code: '123456', otp_expires_at: new Date(NOW + 1000), profile_data: {} }; },
    deleteOtpByEmail: async (_email, client) => { assert.equal(client, db); consumed = true; },
  });
  assert.equal((await api.verifyOtp(USER.email, '123456')).profile.id, 'patient-a');
  assert.ok(events.includes('transaction')); await assert.rejects(api.verifyOtp(USER.email, '123456'));
});

test('password reset uses one transaction client for locked token/password/consumption', async () => {
  const { api, db, events } = service(); await api.resetPassword(TOKEN, 'new-password');
  assert.ok(events.includes('transaction'));
  for (const name of ['read-token', 'password', 'used']) assert.equal(events.find(event => Array.isArray(event) && event[0] === name)[1], db);
});

test('reset refuses missing/expired/used token and password-write failure never consumes it', async () => {
  const missing = service({ getValidPasswordResetToken: async () => null });
  await assert.rejects(missing.api.resetPassword(TOKEN, 'new-password'), /Invalid or expired/);
  const broken = service({ updateUserPassword: async () => { throw new Error('fixture write failure'); } });
  await assert.rejects(broken.api.resetPassword(TOKEN, 'new-password'), /fixture write failure/);
  assert.ok(!broken.events.some(event => Array.isArray(event) && event[0] === 'used'));
});

test('recovery does not disclose email provider errors or account existence', async () => {
  const unknown = service({ findUserByEmail: async () => null });
  const known = service({}, { sendPasswordResetEmail: async () => { throw new Error('synthetic transport failure'); } });
  assert.equal((await unknown.api.forgotPassword('missing@example.test')).message,
    (await known.api.forgotPassword(USER.email)).message);
});

for (const handler of ['loginController', 'verifyOtpController']) test(`${handler} rotates and saves session before success`, async () => {
  const api = controller(); const { req, events } = sessionRequest({ id: 'old-identity' }); const res = response();
  req.body = handler === 'loginController' ? { email: USER.email, password: 'correct-password' } : { email: USER.email, otpCode: '123456' };
  await api[handler](req, res);
  assert.deepEqual(events.slice(0, 2), ['regenerate', 'save']); assert.equal(res.body.success, true); assert.equal(req.session.user.id, USER.id);
  const identity = handler === 'loginController' ? res.body.data : res.body.data.user;
  assert.equal(identity.password_hash, undefined);
});

for (const phase of ['regenerate', 'save']) test(`session ${phase} failure cannot return login success`, async () => {
  const api = controller(); const { req } = sessionRequest(null, { [phase]: new Error('fixture failure') });
  req.body = { email: USER.email, password: 'correct-password' }; const res = response(); await api.loginController(req, res);
  assert.equal(res.statusCode, 500); assert.equal(res.body.success, false); assert.equal(req.session.user, undefined);
});

test('pending professional OTP cannot retain another authenticated identity', async () => {
  const api = controller({ verifyOtp: async () => ({ user: { ...USER, role: 'doctor', verification_status: 'pending' }, profile: { id: 'doctor-a' } }) });
  const { req } = sessionRequest({ id: 'previous-user' }); req.body = { email: USER.email, otpCode: '123456' };
  const res = response(); await api.verifyOtpController(req, res); assert.equal(res.body.data.approvalPending, true); assert.equal(req.session.user, undefined);
});

test('logout acknowledges destruction only on success and handles missing session', async () => {
  const api = controller();
  const good = sessionRequest(USER); const res = response(); await api.logoutController(good.req, res);
  assert.ok(good.events.includes('destroy')); assert.equal(res.body.success, true); assert.equal(res.cookies[0][0], 'connect.sid');
  const bad = sessionRequest(USER, { destroy: new Error('fixture') }); const fail = response(); await api.logoutController(bad.req, fail); assert.equal(fail.statusCode, 500);
  const absent = response(); await api.logoutController({}, absent); assert.equal(absent.body.success, true);
});

for (const handler of ['registerController', 'loginController', 'forgotPasswordController', 'resetPasswordController', 'verifyOtpController', 'resendOtpController']) {
  test(`${handler} rejects malformed scalar input as validation, not server failure`, async () => {
    const req = { body: { email: {}, phone: 123, password: 123456789, role: 'patient', token: {}, newPassword: 123456789, otpCode: 123456 } };
    const res = response(); await controller()[handler](req, res); assert.equal(res.statusCode, 400);
  });
}

test('OTP utility uses cryptographic integer source with unchanged six-digit contract', () => {
  const calls = [];
  const api = load('backend/src/utils/otp.js', { crypto: { randomInt: (...args) => { calls.push(args); return 123456; } } });
  assert.equal(api.generateOtp(), '123456'); assert.deepEqual(calls, [[100000, 1000000]]);
  assert.equal(api.getOtpExpiry(10).getTime(), NOW + 600000);
});

for (const role of ['patient', 'doctor', 'pharmacist', 'lab_technician', 'hospital_staff']) {
  test(`OTP creates the matching profile for ${role}`, async () => {
    const { api } = service({
      findOtpByEmail: async () => ({ email: USER.email, role, otp_code: '123456', otp_expires_at: new Date(NOW + 1000), profile_data: {} }),
      createUser: async () => ({ ...USER, role, verification_status: role === 'patient' ? 'approved' : 'pending' }),
    });
    const result = await api.verifyOtp(USER.email, '123456');
    assert.equal(result.profile.id, { patient: 'patient-a', doctor: 'doctor-a', pharmacist: 'pharmacy-a', lab_technician: 'lab-a', hospital_staff: 'hospital-a' }[role]); assert.equal(result.user.role, role);
  });
}

test('registration sends only after persisting hash/code; provider failure stays a registration error', async () => {
  const good = service({ findUserByEmail: async () => null });
  const result = await good.api.register(USER.email, 'synthetic-phone', 'correct-password', 'patient', {});
  assert.equal(result.email, USER.email); assert.ok(good.events.includes('store-otp'));
  const bad = service({ findUserByEmail: async () => null }, { sendOtpEmail: async () => ({ success: false }) });
  await assert.rejects(bad.api.register(USER.email, 'synthetic-phone', 'correct-password', 'patient', {}), /Failed to send OTP email/);
});

test('resend requires pending registration and replaces its code before email', async () => {
  await assert.rejects(service({ findOtpByEmail: async () => null }).api.resendOtp(USER.email), /No pending registration/);
  const good = service(); await good.api.resendOtp(USER.email); assert.ok(good.events.includes('replace-otp'));
});

test('reset sequential replay is denied by consumed-token boundary', async () => {
  let used = false;
  const { api } = service({ getValidPasswordResetToken: async () => used ? null : ({ user_id: USER.id }),
    markTokenAsUsed: async () => { used = true; return { token: TOKEN }; } });
  await api.resetPassword(TOKEN, 'new-password');
  await assert.rejects(api.resetPassword(TOKEN, 'another-password'), /Invalid or expired/);
});

test('hydration exposes public session identity and missing session is 401', () => {
  const publicUser = { id: USER.id, email: USER.email, role: USER.role, profile_id: USER.profile_id };
  const api = controller(); const good = response(); api.getMeController({ session: { user: publicUser } }, good);
  assert.equal(good.body.data, publicUser); assert.equal(good.body.data.password_hash, undefined);
  const absent = response(); api.getMeController({}, absent); assert.equal(absent.statusCode, 401);
});
