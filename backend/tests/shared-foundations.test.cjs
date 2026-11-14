/**
 * @file shared-foundations.test.cjs
 * @module Shared database/audit regression tests
 * @desc Actual source with fake pg/client and synthetic HTTP events; no network/live DB.
 * @author Codex Review Assistant
 */
const test=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');
const {load}=require('./support/isolated.cjs');
test('database startup probe releases its client instead of permanently borrowing a pool slot',async()=>{
 let released=0;class Pool{connect(){return Promise.resolve({release(){released++;}});}}
 load('backend/src/config/db.js',{pg:{Pool},dotenv:{config(){}}});await Promise.resolve();assert.equal(released,1);
});
test('failed startup probe is handled without throwing or exposing raw provider errors',async()=>{
 class Pool{connect(){return Promise.reject(new Error('synthetic secret provider details'));}}
 assert.doesNotThrow(()=>load('backend/src/config/db.js',{pg:{Pool},dotenv:{config(){}}}));await Promise.resolve();await Promise.resolve();
});
test('audit records final denied outcome, captured actor and route pattern without query/capability values',async()=>{
 const calls=[];const api=load('backend/src/middleware/auditLog.js',{'../config/db':{pool:{query:async(...args)=>calls.push(args)}}});
 const res=new EventEmitter();res.statusCode=403;let next=0;
 const req={session:{user:{id:'11111111-1111-4111-8111-111111111111'}},params:{qrCodeId:'SYNTHETIC-CAPABILITY'},path:'/qr/SYNTHETIC-CAPABILITY',baseUrl:'/api/patients',route:{path:'/qr/:qrCodeId'},method:'GET',headers:{'user-agent':'synthetic'},ip:'203.0.113.1'};
 api.auditMiddleware('LOOKUP','patient')(req,res,()=>{next++;});assert.equal(next,1);assert.equal(calls.length,0);delete req.session.user;res.emit('finish');await Promise.resolve();
 assert.equal(calls.length,1);const values=calls[0][1];assert.equal(values[0],'11111111-1111-4111-8111-111111111111');assert.equal(values[3],null);
 const details=JSON.parse(values[4]);assert.equal(details.path,'/api/patients/qr/:qrCodeId');assert.equal(details.statusCode,403);assert.equal(details.outcome,'failed');assert.doesNotMatch(values[4],/SYNTHETIC-CAPABILITY/);
});
test('explicit audit details redact nested credentials and retain useful nonsecret identifiers',async()=>{
 let values;const api=load('backend/src/middleware/auditLog.js',{'../config/db':{pool:{query:async(_q,v)=>{values=v;}}}});
 await api.logAudit(null,'TEST','patient',null,{requestId:'fixture-request',password:'fake-password',nested:{otpCode:'123456',token:'fake-token'},count:1});
 const d=JSON.parse(values[4]);assert.equal(d.requestId,'fixture-request');assert.equal(d.password,'[REDACTED]');assert.equal(d.nested.otpCode,'[REDACTED]');assert.equal(d.count,1);
});
test('audit failure remains best effort and does not reject application operations',async()=>{
 const api=load('backend/src/middleware/auditLog.js',{'../config/db':{pool:{query:async()=>{throw new Error('synthetic database failure');}}}});await assert.doesNotReject(api.logAudit(null,'TEST','patient',null));
});

test('email templates escape user text and provider errors return no raw exception',async()=>{
 let mail;const api=load('backend/src/utils/email.js',{nodemailer:{createTransport:()=>({sendMail:async value=>{mail=value;return {messageId:'synthetic'};}})}});
 await api.sendConsentAccessOtpEmail('demo@example.test','<img src=x onerror=alert(1)>','123456');assert.match(mail.html,/&lt;img/);assert.doesNotMatch(mail.html,/<img src=x/);
 await api.sendRejectionEmail('demo@example.test','<a href="https:\/\/example.test">fake</a>');assert.match(mail.html,/&lt;a/);
 const bad=load('backend/src/utils/email.js',{nodemailer:{createTransport:()=>({sendMail:async()=>{throw new Error('synthetic credential marker');}})}});
 const result=await bad.sendOtpEmail('demo@example.test','123456');assert.equal(result.success,false);assert.doesNotMatch(result.error,/credential marker/);
});
test('optional AI keys are not required to load unrelated API modules',async()=>{
 let initialized=0;class MissingKeyClient{constructor(){initialized++;throw new Error('Missing key');}}
 const api=load('backend/src/utils/ai.util.js',{'@google/generative-ai':{GoogleGenerativeAI:MissingKeyClient},'groq-sdk':MissingKeyClient});
 assert.equal(initialized,0);assert.match(await api.generateAIResponse('Synthetic demo prompt'),/Temporarily Unavailable/);await assert.rejects(api.generateAIVisionResponse('Synthetic',{},'image/png'),/enter the details manually/);
});

test('production DB verifies TLS and URL sslmode cannot silently override the CA policy',async()=>{
 let config;class Pool{constructor(value){config=value;}connect(){return Promise.resolve({release(){}});}}
 load('backend/src/config/db.js',{pg:{Pool},dotenv:{config(){}},'node:url':{URL}}, {env:{NODE_ENV:'production',DATABASE_URL:'postgresql://fixture:fixture@db.example.test/demo?sslmode=require&ssl=false',DB_SSL_CA:'SYNTHETIC-CA'}});
 await Promise.resolve();assert.equal(config.ssl.rejectUnauthorized,true);assert.equal(config.ssl.ca,'SYNTHETIC-CA');assert.doesNotMatch(config.connectionString,/sslmode/);
 const {Client}=require('../node_modules/pg');const client=new Client(config);assert.equal(client.connectionParameters.ssl.rejectUnauthorized,true);
});
test('reminder sends the formatted appointment time rather than doctor name as the time argument',async()=>{
 let sent;const api=load('backend/src/utils/reminderJob.js',{'../config/db':{pool:{query:async()=>({rows:[{patient_email:'demo@example.test',patient_name:'Demo',doctor_name:'Demo Doctor',scheduled_at:'2026-11-15T10:00:00Z'}]})}},'./email':{sendAppointmentReminder:async(...args)=>{sent=args;return {success:true};}}});
 await api.sendAppointmentReminders();assert.equal(sent.length,3);assert.match(sent[2],/2026/);assert.notEqual(sent[2],'Demo Doctor');
});
test('SOS formatter accepts valid zero coordinates without sending a real alert',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');const module={exports:{}};let payload;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/utils/sms.util.js'),'utf8'),{module,exports:module.exports,process:{env:{TELEGRAM_BOT_TOKEN:'synthetic-token',TELEGRAM_CHAT_ID:'synthetic-chat'}},console:{error(){}},fetch:async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true};}});
 assert.equal(await module.exports.sendEmergencySMS(null,'Demo',0,0),true);assert.match(payload.text,/maps\?q=0,0/);
 await module.exports.sendEmergencySMS(null,'Demo',91,0);assert.match(payload.text,/Location unavailable/);
});

test('unconfigured optional Storage does not initialize a client or prevent unrelated API startup',async()=>{
 let created=0;const config=load('backend/src/config/supabase.js',{'@supabase/supabase-js':{createClient(){created++;throw new Error('missing configuration');}},ws:{}});
 assert.equal(created,0);assert.equal(config.supabase,null);
 const doctor=load('backend/src/modules/doctor/doctor.service.js',{'./doctor.repository':{},'../appointment/appointment.repository':{},'../../config/supabase':config});
 await assert.rejects(doctor.uploadDoctorPhoto('demo',{buffer:Buffer.from('synthetic')}),e=>e.statusCode===503);
});
