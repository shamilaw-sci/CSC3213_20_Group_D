/**
 * @file auth-contracts.test.cjs
 * @module Authentication regression tests
 * @desc Exercise actual route ordering, SQL command contracts and consent status.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, NOW, sessionRequest, response } = require('./support/isolated.cjs');

/** Record Express registration order without binding/listening or running services.
 * @returns {Object} Fake router, ordered declarations and Express constructor stub.
 */
function routerFixture() {
  const records = [], router = {};
  for (const method of ['get', 'post', 'put', 'delete', 'use']) router[method] = (...args) => records.push({ method, args });
  return { router, records, express: { Router: () => router } };
}

test('auth routes keep me behind authentication and login behind its IP limiter', () => {
  const fixture = routerFixture(); const guard = () => {}; const limiter = () => {};
  const controllers = Object.fromEntries(['register','verifyOtp','resendOtp','login','logout','getMe','forgotPassword','resetPassword'].map(name => [name + 'Controller', () => {}]));
  load('backend/src/modules/auth/auth.routes.js', { express: fixture.express, './auth.controller': controllers,
    './auth.limits': { createAuthLimiters: () => ({}) },
    'express-rate-limit': () => limiter, '../../middleware/auth': { isAuthenticated: guard } });
  const me = fixture.records.find(row => row.args[0] === '/me');
  assert.equal(me.args[1], guard); assert.equal(me.args[2], controllers.getMeController);
  const login = fixture.records.find(row => row.args[0] === '/login'); assert.equal(login.args[1], limiter);
  assert.equal(fixture.records.length, 8);
});

test('patient routes install authentication before resource routes; UUID prescription reads never enable pharmacists', () => {
  const fixture = routerFixture(); const guard = () => {};
  const handlers = new Proxy({}, { get: (_object, name) => function handler() { return name; } });
  const owner = options => Object.assign(() => {}, { options });
  load('backend/src/modules/patient/patient.routes.js', {
    express: fixture.express, 'express-rate-limit': () => () => {}, './patient.controller': handlers,
    './consent.controller': handlers, '../../middleware/upload': { upload: { single: () => () => {} } },
    '../../middleware/auth': { isAuthenticated: guard, authorize: (...roles) => Object.assign(() => {}, { roles }) },
    '../../middleware/patientAccess': { authorizePatientResource: owner },
  });
  const index = fixture.records.findIndex(row => row.method === 'use' && row.args[0] === guard);
  assert.ok(index >= 0);
  for (const [position, record] of fixture.records.entries()) {
    if (record.method === 'use') continue;
    assert.ok(position > index || record.args.includes(guard), `Missing auth: ${record.args[0]}`);
    if (record.args[0].startsWith('/:id') && !record.args[0].includes('/consent/access/')) {
      assert.ok(record.args.some(fn => typeof fn === 'function' && Object.hasOwn(fn, 'options')), `Missing ownership guard: ${record.args[0]}`);
    }
  }
  const prescriptions = fixture.records.find(row => row.method === 'get' && row.args[0] === '/:id/prescriptions');
  assert.ok(prescriptions.args.some(fn => fn.options?.allowDoctor === true));
  assert.ok(!prescriptions.args.some(fn => fn.options?.allowPharmacist === true));
  for (const record of fixture.records.filter(row => String(row.args[0]).includes('/consent/access/'))) {
    assert.ok(record.args.some(fn => fn.roles?.includes('doctor')));
  }
});

/** Load actual app assembly while replacing every side-effectful integration.
 * @param {boolean} production Whether to select production cookie rules.
 * @param {Object} env Synthetic environment overrides only.
 * @returns {Object} Recorded session/store/CORS configuration and routes.
 */
function appFixture(production, env = {}) {
  let sessionOptions, corsOptions, storeOptions;
  const routes = []; const middleware = [];
  const settings = {};
  const app = { set: (name, value) => { settings[name] = value; }, use: (...args) => middleware.push(args), get: (...args) => routes.push(args) };
  const noop = () => {};
  const express = Object.assign(() => app, { json: () => noop, urlencoded: () => noop });
  const mocks = { dotenv: { config: () => ({}) }, express,
    cors: options => { corsOptions = options; return noop; }, helmet: () => noop, morgan: () => noop,
    'express-session': options => { sessionOptions = options; return noop; },
    'connect-pg-simple': () => class Store { constructor(options) { storeOptions = options; } },
    './src/config/db': { pool: { fixture: true } },
  };
  for (const module of ['patient','doctor','appointment','prescription','pharmacy','laboratory','hospital','emergency','order','payment','interaction','admin','auth']) mocks[`./src/modules/${module}/${module}.routes`] = noop;
  mocks['./src/modules/health-content/healthContent.routes'] = noop;
  load('backend/app.js', mocks, { env: { SESSION_SECRET: 'synthetic-fixture-secret', NODE_ENV: production ? 'production' : 'test', CLIENT_URL: 'https://web.example.test', ...env } });
  return { sessionOptions, corsOptions, storeOptions, routes, middleware, settings };
}

test('mocked route declarations attach IP then field budget before each OTP/recovery controller', () => {
  const fixture = routerFixture();
  const limits = Object.fromEntries(['emailIp', 'emailAddress', 'verifyIp', 'verifyEmail', 'resetIp', 'resetToken'].map(name => [name, () => {}]));
  const controllers = Object.fromEntries(['register','verifyOtp','resendOtp','login','logout','getMe','forgotPassword','resetPassword'].map(name => [name + 'Controller', () => {}]));
  load('backend/src/modules/auth/auth.routes.js', { express: fixture.express, './auth.controller': controllers,
    './auth.limits': { createAuthLimiters: () => limits },
    'express-rate-limit': () => () => {}, '../../middleware/auth': { isAuthenticated: () => {} } });
  for (const [path, ip, field, handler] of [
    ['register', 'emailIp', 'emailAddress', 'register'], ['resend-otp', 'emailIp', 'emailAddress', 'resendOtp'],
    ['forgot-password', 'emailIp', 'emailAddress', 'forgotPassword'], ['verify-otp', 'verifyIp', 'verifyEmail', 'verifyOtp'],
    ['reset-password', 'resetIp', 'resetToken', 'resetPassword'],
  ]) {
    assert.deepEqual(fixture.records.find(row => row.args[0] === '/' + path).args.slice(1),
      [limits[ip], limits[field], controllers[handler + 'Controller']]);
  }
});

test('mocked app assembly selects bounded proxy defaults/config and actual Express resolves IP accordingly', () => {
  const express = require('../node_modules/express');
  for (const [production, env, expected] of [[false, {}, 0], [true, {}, 1], [true, { TRUST_PROXY_HOPS: '0' }, 0], [false, { TRUST_PROXY_HOPS: '2' }, 2]]) {
    const hops = appFixture(production, env).settings['trust proxy'];
    assert.equal(hops, expected);
    const app = express(); app.set('trust proxy', hops);
    const req = Object.assign(Object.create(express.request), { app, socket: { remoteAddress: '203.0.113.10' },
      headers: { 'x-forwarded-for': '198.51.100.23' } });
    assert.equal(req.ip, hops === 0 ? '203.0.113.10' : '198.51.100.23');
  }
  for (const value of ['-1', '1.5', 'true', 'Infinity', 'bad']) {
    assert.throws(() => appFixture(false, { TRUST_PROXY_HOPS: value }), /non-negative integer/);
  }
});

for (const production of [false, true]) test(`session/CORS assembly (${production ? 'production' : 'test'}) uses documented cookie/store contract without connecting`, () => {
  const { sessionOptions: options, corsOptions, storeOptions } = appFixture(production);
  assert.equal(options.cookie.httpOnly, true); assert.equal(options.cookie.secure, production);
  assert.equal(options.cookie.sameSite, production ? 'none' : 'lax'); assert.equal(options.saveUninitialized, false);
  assert.equal(options.resave, false); assert.equal(storeOptions.tableName, 'session');
  let allowed, denied;
  corsOptions.origin('https://web.example.test', (error, value) => { assert.equal(error, null); allowed = value; });
  corsOptions.origin('https://unlisted.example.test', error => { denied = error; });
  assert.equal(allowed, true); assert.ok(denied); assert.equal(corsOptions.credentials, true);
});

test('session assembly rejects missing secret/origins and invalid cookie lifetimes', () => {
  assert.throws(() => appFixture(false, { SESSION_SECRET: '' }), /SESSION_SECRET is required/);
  assert.throws(() => appFixture(true, { CLIENT_URL: '' }), /required in production/);
  for (const value of ['-1', '0', '100garbage', 'Infinity']) {
    assert.throws(() => appFixture(false, { SESSION_MAX_AGE_MS: value }), /positive integer/);
  }
  assert.equal(appFixture(false, { SESSION_MAX_AGE_MS: '60000' }).sessionOptions.cookie.maxAge, 60000);
});

test('repository token/OTP reads and writes honor the supplied transaction client and guarded consumption', async () => {
  const queries = [];
  const pool = { query: async () => { throw new Error('Unexpected pool query outside transaction'); } };
  const client = { query: async (sql, args) => { queries.push({ sql, args }); return { rows: [{ user_id: 'synthetic-user', token: 'synthetic-token' }] }; } };
  const repo = load('backend/src/modules/auth/auth.repository.js', { '../../config/db': { pool } });
  await repo.getValidPasswordResetToken('synthetic-token', client);
  await repo.markTokenAsUsed('synthetic-token', client);
  await repo.updateUserPassword('synthetic-user', 'synthetic-hash', client);
  await repo.findOtpByEmail('synthetic@example.test', client);
  assert.match(queries[0].sql, /FOR UPDATE/); assert.match(queries[0].sql, /used = false/);
  assert.match(queries[1].sql, /used = false/); assert.match(queries[1].sql, /expires_at > CURRENT_TIMESTAMP/);
  assert.match(queries[3].sql, /FOR UPDATE/); assert.equal(queries[2].args[0], 'synthetic-user');
});

test('transaction helper requests BEGIN/COMMIT/release or ROLLBACK/release on callback failure', async () => {
  const calls = [];
  const client = { query: async sql => calls.push(sql), release: () => calls.push('release') };
  const repo = load('backend/src/modules/auth/auth.repository.js', { '../../config/db': { pool: { connect: async () => client } } });
  assert.equal(await repo.withTransaction(async () => 42), 42);
  assert.deepEqual(calls, ['BEGIN','COMMIT','release']); calls.length = 0;
  await assert.rejects(repo.withTransaction(async () => { throw new Error('fixture callback'); }), /fixture callback/);
  assert.deepEqual(calls, ['BEGIN','ROLLBACK','release']);
});

/** Consent status uses actual service validation; the repository remains a boundary.
 * @param {Object} options Synthetic appointment overrides and optional grant.
 * @returns {Object} Actual consent-service exports with closed dependencies.
 */
function consentFixture({ appointment = {}, grant = null } = {}) {
  return load('backend/src/modules/patient/consent.service.js', {
    bcryptjs: {}, './consent.repository': { getConsentSettings: async () => ({ locked_categories: ['mental health'] }), getActiveConsentAccessGrant: async () => grant },
    './patient.repository': { getPatientById: async () => ({ id: 'patient-a' }) },
    '../doctor/doctor.repository': { getDoctorByUserId: async () => ({ id: 'doctor-a' }) },
    '../appointment/appointment.repository': { getAppointmentById: async () => ({ id: 'appointment-a', patient_id: 'patient-a', doctor_id: 'doctor-a', status: 'in_progress', ...appointment }) },
    '../../utils/otp': {}, '../../utils/email': {},
  });
}
test('consent status validates doctor, patient and active consultation before asking for a grant', async () => {
  const user = { id: 'doctor-user', role: 'doctor' };
  for (const appointment of [{ patient_id: 'patient-b' }, { doctor_id: 'doctor-b' }, { status: 'completed' }]) {
    await assert.rejects(consentFixture({ appointment }).getConsentAccessStatus('patient-a', 'appointment-a', user));
  }
  await assert.rejects(consentFixture().getConsentAccessStatus('patient-a', 'appointment-a', { id: 'pharmacist-user', role: 'pharmacist' }));
  const absent = await consentFixture().getConsentAccessStatus('patient-a', 'appointment-a', user);
  assert.equal(absent.hasActiveGrant, false);
  const present = await consentFixture({ grant: { granted_categories: ['mental health'], expires_at: new Date(NOW + 1000) } }).getConsentAccessStatus('patient-a', 'appointment-a', user);
  assert.equal(present.hasActiveGrant, true); assert.equal(present.grantedCategories[0], 'mental health');
});

test('consent repository contract scopes grant by patient/doctor/appointment and excludes expired/revoked rows', async () => {
  let call;
  const repo = load('backend/src/modules/patient/consent.repository.js', { '../../config/db': { pool: { query: async (sql, args) => { call = { sql, args }; return { rows: [] }; } } } });
  assert.equal(await repo.getActiveConsentAccessGrant('patient-a', 'doctor-a', 'appointment-a'), null);
  assert.deepEqual(Array.from(call.args), ['patient-a','doctor-a','appointment-a']);
  assert.match(call.sql, /revoked_at IS NULL/); assert.match(call.sql, /expires_at > (?:NOW|clock_timestamp)\(\)/);
});

test('medical-record filter hides locked categories on missing/failed grant and requires every matched category', async () => {
  const records = [{ title: 'General note' }, { title: 'Mental health note' }, { title: 'Mental health and genetic note' }];
  const invoke = async access => {
    const api = load('backend/src/modules/patient/patient.service.js', {
      './patient.repository': { getPatientById: async () => ({ user_id: 'patient-user' }), getMedicalRecords: async () => records },
      './consent.repository': { getConsentSettings: async () => ({ locked_categories: ['mental health','genetic'] }) },
      './consent.service': { getConsentAccessStatus: access, validateDoctorConsultationContext: async () => ({}) }, '../../utils/ai.util': {}, '../../config/supabase': {},
    });
    return api.getMedicalRecords('patient-a', { id: 'doctor-user', role: 'doctor' }, 'appointment-a');
  };
  assert.equal((await invoke(async () => ({ hasActiveGrant: false }))).length, 1);
  assert.equal((await invoke(async () => { throw new Error('fixture grant failure'); })).length, 1);
  assert.equal((await invoke(async () => ({ hasActiveGrant: true, grantedCategories: ['mental health'] }))).length, 2);
  assert.equal((await invoke(async () => ({ hasActiveGrant: true, grantedCategories: ['mental health','genetic'] }))).length, 3);
});
