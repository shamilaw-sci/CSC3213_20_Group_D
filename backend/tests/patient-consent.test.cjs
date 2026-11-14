/**
 * @file patient-consent.test.cjs
 * @module Patient/consent regression tests
 * @desc Actual source behind closed SQL/provider boundaries; no live records or PG concurrency claim.
 * @author Codex Review Assistant
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./support/isolated.cjs');
const patient = { id: 'patient', user_id: 'account', email: 'demo@example.test', is_verified: true };
const owner = { id: 'account', profile_id: 'patient', role: 'patient' };
const doctor = { id: 'doctor-account', profile_id: 'doctor', role: 'doctor' };
function patientService(repository = {}) {
 return load('backend/src/modules/patient/patient.service.js', {
  './patient.repository': { getPatientById: async () => patient, ...repository },
  './consent.repository': { getConsentSettings: async () => ({ locked_categories: [] }) },
  './consent.service': {}, '../../utils/ai.util': {}, '../../config/supabase': { supabase: {} },
 });
}
function consent(overrides = {}) {
 const events = [], client = { query: async () => ({ rows: [] }) };
 const repo = { withPatientTransaction: async (_id, work) => { events.push('begin'); const result = await work(client); events.push('commit'); return result; },
  getConsentSettings: async () => ({ locked_categories: ['Mental Health'] }),
  upsertConsentSettings: async (_id, values) => ({ locked_categories: values }),
  getActiveConsentAccessGrant: async () => null, invalidateActiveAccessRequests: async () => {},
  createConsentAccessRequest: async () => ({ id: 'request', requested_categories: ['Mental Health'], expires_at: '2026-11-12T10:10:00Z' }),
  getActiveConsentAccessRequest: async () => ({ id: 'request', attempt_count: 0, otp_hash: 'synthetic-hash', requested_categories: ['Mental Health'] }),
  markConsentAccessRequestUsed: async (_id, db) => { assert.equal(db, client); events.push('consume'); return { id: 'request' }; },
  revokeActiveConsentAccessGrants: async () => events.push('revoke'),
  createConsentAccessGrant: async data => { events.push('grant'); return { ...data, granted_categories: data.grantedCategories }; },
  invalidateConsentAccessRequest: async () => events.push('invalidate'),
  incrementConsentAccessAttempt: async () => ({ attempt_count: 1 }), ...overrides.repo };
 const service = load('backend/src/modules/patient/consent.service.js', { bcryptjs: { hash: async () => 'synthetic-hash', compare: async () => true, ...overrides.bcrypt },
  './consent.repository': repo, './patient.repository': { getPatientById: async () => patient, getPatientByUserId: async () => patient },
  '../doctor/doctor.repository': { getDoctorByUserId: async () => ({ id: 'doctor' }) },
  '../appointment/appointment.repository': { getAppointmentById: async () => ({ patient_id: 'patient', doctor_id: 'doctor', status: 'in_progress' }), ...overrides.appointment },
  '../../utils/otp': { generateOtp: () => '123456', getOtpExpiry: () => new Date('2026-11-12T10:10:00Z') },
  '../../utils/email': { sendConsentAccessOtpEmail: overrides.email || (async () => ({ success: true })) } });
 return { service, events, client };
}
test('profile repository persists full name and only whitelisted editable columns', async () => {
 let query, values; const r=load('backend/src/modules/patient/patient.repository.js', { '../../config/db': { pool: { query: async (q,v) => {query=q;values=v;return {rows:[{}]};} } } });
 await r.updatePatient('patient',{full_name:'Demo Patient',role:'admin'});
 assert.match(query,/full_name\s*=/);assert.ok(values.includes('Demo Patient'));assert.doesNotMatch(query,/role\s*=/);
});
test('profile rejects invalid shape and empty name before update', async () => {
 for (const body of [null, [], {full_name:''}, {full_name:42}, {blood_group:'impossible'}]) {
  let updates=0; const s=patientService({updatePatient:async()=>{updates++;return {};}});
  await assert.rejects(s.updatePatientProfile('patient',body),e=>e.statusCode===400);assert.equal(updates,0);
 }
});
test('record service denies unowned or missing identities before returning records',async()=>{
 for(const user of [null,{id:'other',profile_id:'other',role:'patient'},{role:'pharmacist'}]) {
  const s=patientService({getMedicalRecords:async()=>[{id:'private'}]});await assert.rejects(s.getMedicalRecords('patient',user),e=>e.statusCode===403);
 }
});
test('consent categories reject mixed or malformed elements rather than silently discarding locks',async()=>{
 const h=consent();for(const categories of [[null],['Mental Health',42],{},['']]) await assert.rejects(h.service.updatePatientConsentSettings('patient',categories,owner),e=>e.statusCode===400);
});
test('verification consumes and creates grant on the same transaction client',async()=>{
 const h=consent();const result=await h.service.verifyConsentAccessOtp('patient','appointment','123456',doctor);assert.equal(result.granted,true);assert.deepEqual(h.events,['begin','consume','revoke','grant','commit']);
});
test('consume SQL rechecks expiry, attempts, invalidation and single use',async()=>{
 let sql;const r=load('backend/src/modules/patient/consent.repository.js',{'../../config/db':{pool:{query:async(q)=>{sql=q;return {rows:[]};}}}});
 await r.markConsentAccessRequestUsed('request');assert.match(sql,/expires_at > (?:NOW|clock_timestamp)\(\)/);assert.match(sql,/attempt_count < 5/);assert.match(sql,/used_at IS NULL/);assert.match(sql,/invalidated_at IS NULL/);
});

for (const [label, appointment] of [['wrong patient',{patient_id:'other'}],['wrong doctor',{doctor_id:'other'}],['completed',{status:'completed'}],['cancelled',{status:'cancelled'}]]) {
 test(`consent rejects ${label} consultation before accessing grants`,async()=>{
  let grantReads=0;const h=consent({appointment:{getAppointmentById:async()=>({patient_id:'patient',doctor_id:'doctor',status:'in_progress',...appointment})},repo:{getActiveConsentAccessGrant:async()=>{grantReads++;return {};}}});
  await assert.rejects(h.service.getConsentAccessStatus('patient','appointment',doctor));assert.equal(grantReads,0);
 });
}
test('consent rejects stale profile mapping and unsupported roles',async()=>{
 const h=consent();await assert.rejects(h.service.getConsentAccessStatus('patient','appointment',{...doctor,profile_id:'old'}),e=>e.statusCode===403);
 await assert.rejects(h.service.requestConsentAccessOtp('patient','appointment',owner),e=>e.statusCode===403);
});
test('patient settings deny another account and foreign profile',async()=>{
 const h=consent();await assert.rejects(h.service.getPatientConsentSettings('other',owner),e=>e.statusCode===403);
 await assert.rejects(h.service.getPatientConsentSettings('patient',doctor),e=>e.statusCode===403);
});
test('invalid stored locks fail closed instead of being treated as unlocked',async()=>{
 const h=consent({repo:{getConsentSettings:async()=>({locked_categories:null})}});await assert.rejects(h.service.getConsentAccessStatus('patient','appointment',doctor));
});
test('failed consent attempts commit their counter before returning expected error',async()=>{
 const h=consent({bcrypt:{compare:async()=>false}});await assert.rejects(h.service.verifyConsentAccessOtp('patient','appointment','000000',doctor),e=>e.statusCode===400);assert.deepEqual(h.events,['begin','commit']);
});
test('last invalid attempt invalidates request and commits before 429',async()=>{
 const h=consent({bcrypt:{compare:async()=>false},repo:{incrementConsentAccessAttempt:async()=>({attempt_count:5})}});await assert.rejects(h.service.verifyConsentAccessOtp('patient','appointment','000000',doctor),e=>e.statusCode===429);assert.deepEqual(h.events,['begin','invalidate','commit']);
});
test('expired/replaced/used requests never create a new grant',async()=>{
 const h=consent({repo:{getActiveConsentAccessRequest:async()=>null}});await assert.rejects(h.service.verifyConsentAccessOtp('patient','appointment','123456',doctor),e=>e.statusCode===400);assert.deepEqual(h.events,['begin','commit']);
 const race=consent({repo:{markConsentAccessRequestUsed:async()=>null}});await assert.rejects(race.service.verifyConsentAccessOtp('patient','appointment','123456',doctor),e=>e.statusCode===409);assert.deepEqual(race.events,['begin','commit']);
});
test('provider throws after commit and invalidates only the created request',async()=>{
 let h;h=consent({email:async()=>{h.events.push('provider');throw new Error('synthetic provider failure');}});
 await assert.rejects(h.service.requestConsentAccessOtp('patient','appointment',doctor),e=>e.statusCode===502);assert.deepEqual(h.events,['begin','commit','provider','invalidate']);
});
test('existing grant sends no replacement OTP and returns public metadata',async()=>{
 let emails=0;const h=consent({repo:{getActiveConsentAccessGrant:async()=>({granted_categories:['Mental Health'],expires_at:'2026-11-12T10:15:00Z'})},email:async()=>{emails++;return {success:true};}});
 const r=await h.service.requestConsentAccessOtp('patient','appointment',doctor);assert.equal(r.alreadyGranted,true);assert.equal(emails,0);assert.equal(r.otpHash,undefined);
});
test('successful request returns metadata without code/hash or patient contact',async()=>{
 const h=consent();const r=await h.service.requestConsentAccessOtp('patient','appointment',doctor);assert.equal(r.requestId,'request');assert.equal(r.otpCode,undefined);assert.equal(r.otpHash,undefined);assert.equal(r.patient,undefined);assert.equal(r.email,undefined);
});
test('grant SQL excludes expired/revoked rows and binds all three profile IDs',async()=>{
 let sql,values;const r=load('backend/src/modules/patient/consent.repository.js',{'../../config/db':{pool:{query:async(q,v)=>{sql=q;values=v;return {rows:[]};}}}});
 assert.equal(await r.getActiveConsentAccessGrant('patient','doctor','appointment'),null);assert.match(sql,/revoked_at IS NULL/);assert.match(sql,/expires_at > clock_timestamp\(\)/);assert.deepEqual(Array.from(values),['patient','doctor','appointment']);
});
test('patient lock transaction commits success and rolls back failed grant before release',async()=>{
 const events=[];const client={query:async q=>{events.push(q);return {rows:[{id:'patient'}]};},release:()=>events.push('release')};
 const r=load('backend/src/modules/patient/consent.repository.js',{'../../config/db':{pool:{connect:async()=>client}}});
 assert.equal(await r.withPatientTransaction('patient',async db=>{assert.equal(db,client);return 42;}),42);assert.equal(events[0],'BEGIN');assert.match(events[1],/FOR UPDATE/);assert.deepEqual(events.slice(-2),['COMMIT','release']);
 events.length=0;await assert.rejects(r.withPatientTransaction('patient',async()=>{throw new Error('synthetic grant write failed');}),/synthetic grant/);assert.deepEqual(events.slice(-2),['ROLLBACK','release']);
});
test('wrong code format never begins a transaction',async()=>{
 const h=consent();for(const code of [123456,{},'123','abcdef']) await assert.rejects(h.service.verifyConsentAccessOtp('patient','appointment',code,doctor),e=>e.statusCode===400);assert.equal(h.events.length,0);
});
test('profile trimming ignores identity fields and preserves permitted clearing',async()=>{
 let saved;const h=patientService({updatePatient:async(_id,data)=>{saved=data;return data;}});await h.updatePatientProfile('patient',{full_name:'  Demo Patient  ',emergency_contact_phone:'',role:'admin',nic:'changed'});assert.equal(saved.full_name,'Demo Patient');assert.equal(saved.emergency_contact_phone,'');assert.equal(saved.role,undefined);assert.equal(saved.nic,undefined);
});
