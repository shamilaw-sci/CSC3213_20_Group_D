/**
 * @file patient-ui.test.cjs
 * @module Patient UI/service contract tests
 * @desc Actual service exports with synthetic Axios only; browser/native rendering is separate.
 */
const test=require('node:test');const assert=require('node:assert/strict');
const {load}=require('./support/source-ui.cjs');
function service(platform,data={}) {
 const calls=[];const request=async(...args)=>{calls.push(args);return {data};};
 const api=load(`${platform}/src/services/patient.service.js`,{'./api':{get:request,put:request,post:request,delete:request}});
 return {api,calls};
}
for(const platform of ['frontend','mobile']) {
 for(const [name,args] of [['getPatientProfile',['patient']],['updatePatientProfile',['patient',{full_name:'Demo'}]],['getMedicalRecords',['patient']],['getConsentSettings',['patient']],['updateConsentSettings',['patient',['Mental Health']]]]) {
  test(`${platform} ${name} rejects negative envelopes rather than empty/saved success`,async()=>{const h=service(platform,{success:false,data:{}});await assert.rejects(h.api[name](...args),/did not confirm/);});
 }
 test(`${platform} medical record wrapper validates array and forwards consultation not role`,async()=>{
  const h=service(platform,{success:true,data:[]});await h.api.getMedicalRecords('patient','admin','appointment');assert.equal(h.calls[0][0],'/api/patients/patient/medical-records');assert.equal(h.calls[0][1].params.appointmentId,'appointment');assert.equal(h.calls[0][1].params.role,undefined);
  const malformed=service(platform,{success:true,data:{}});await assert.rejects(malformed.api.getMedicalRecords('patient'));
 });
 test(`${platform} privacy response must contain a confirmed list`,async()=>{
  const h=service(platform,{success:true,data:{locked_categories:['Mental Health']}});assert.deepEqual(Array.from(await h.api.getConsentSettings('patient')),['Mental Health']);
  const bad=service(platform,{success:true,data:{}});await assert.rejects(bad.api.getConsentSettings('patient'));
 });
}
for(const [name,args] of [['requestConsentAccess',['patient','appointment']],['verifyConsentAccess',['patient','appointment','123456']],['getConsentAccessStatus',['patient','appointment']]]) {
 test(`web ${name} refuses a malformed acknowledged grant/request`,async()=>{const h=service('frontend',{success:true,data:{}});await assert.rejects(h.api[name](...args));});
}
test('web verified grant is accepted only with explicit grant acknowledgement and expiry',async()=>{
 const h=service('frontend',{success:true,data:{granted:true,grantedCategories:['Mental Health'],expiresAt:'2026-11-13T12:00:00Z'}});const r=await h.api.verifyConsentAccess('patient','appointment','123456');assert.equal(r.granted,true);
});

const {screen}=require('./support/source-ui.cjs');
function webRecords(records,user={profile_id:'patient',id:'account'}) {
 return screen('frontend/src/pages/patient/MedicalRecordsPage.jsx',{imports:{
  '../../services/patient.service':{getMedicalRecords:async()=>records},
  '../../store/authStore':select=>select({user}),
  '@tanstack/react-query':{useQuery:()=>({data:records,isLoading:false,isError:false})},
  'lucide-react':new Proxy({},{get:(_t,name)=>name}),
  '../../components/common/PageHeader':'PageHeader','../../components/common/Modal':'Modal',
  '../../components/common/Spinner':'Spinner',
 }});
}
test('actual record screen filters all schema-supported record types',()=>{
 const records=['consultation','diagnosis','lab_result','vaccination','other'].map((record_type,i)=>({id:String(i),record_type,title:record_type,created_at:'2026-11-13T00:00:00Z'}));
 const h=webRecords(records);for(const type of ['Diagnoses','Vaccinations','Other']) {
  h.find(n=>n.type==='button'&&h.text(n)===type).props.onClick();h.render();
  const cards=h.nodes().filter(n=>n.props.record);assert.equal(cards.length,1);assert.match(cards[0].props.record.record_type,new RegExp(type==='Diagnoses'?'diagnosis':type==='Vaccinations'?'vaccination':'other'));
 }
});
test('actual record screen does not substitute account ID for missing profile',()=>{
 const h=webRecords([],{id:'account'});assert.match(h.find(n=>n.type==='Alert').props.message,/profile is unavailable/);
});

test('opt-in dialog does not steal input focus on parent callback changes and Escape uses latest callback',()=>{
 let focusCount=0,listener,closed=0;const previous={isConnected:true,focus(){}};
 const document={activeElement:previous};const props={isOpen:true,manageFocus:true,title:'Demo dialog',onClose:()=>{closed=1;}};
 const h=screen('frontend/src/components/common/Modal.jsx',{props,globals:{document},imports:{'lucide-react':{X:'X'}}});
 const root={focus(){focusCount++;document.activeElement=root;},addEventListener(_name,fn){listener=fn;},removeEventListener(){},querySelectorAll(){return [];}};
 h.find(n=>n.props.role==='dialog').props.ref.current=root;h.effects();assert.equal(focusCount,1);
 const input={};document.activeElement=input;props.onClose=()=>{closed=2;};h.render();h.effects();
 assert.equal(focusCount,1);assert.equal(document.activeElement,input);listener({key:'Escape',preventDefault(){}});assert.equal(closed,2);
});
