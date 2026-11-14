/**
 * @file serve-patient-fixture.mjs
 * @module Synthetic patient browser verification
 * @desc Loopback-only in-memory Vite/API fixture; no dotenv, app, DB, provider or disk build.
 * @author Codex Review Assistant
 */
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const port=4179;
const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,envDir:false,publicDir:false,
 plugins:[react(),tailwindcss()],define:{'import.meta.env.VITE_API_URL':JSON.stringify(`http://127.0.0.1:${port}`)},
 build:{write:false,rollupOptions:{input:fileURLToPath(new URL('./patient-fixture.html',import.meta.url))}}});
const assets=new Map(result.output.map(x=>[x.fileName,x.type==='asset'?x.source:x.code]));
let scenario='success';const held=[];
let profile={id:'synthetic-profile',user_id:'synthetic-account',full_name:'Demo Patient',date_of_birth:'2000-01-01',email:'demo@example.test',phone:'0700000000',nic:'SYNTHETIC',blood_group:'O+',emergency_contact_name:'Demo Contact',emergency_contact_phone:'0700000001',emergency_contact_relationship:'Family',qr_code_id:'SYNTHETIC-QR',is_verified:true};
let locked_categories=['Mental Health'];
const records=['consultation','diagnosis','lab_result','vaccination','other'].map((record_type,i)=>({id:`synthetic-record-${i}`,record_type,title:`Demo ${record_type}`,description:'Synthetic demonstration only.',created_at:'2026-11-13T08:00:00Z',doctor_name:'Demo Doctor'}));
/** @param {Object} res HTTP response. @param {number} status Code. @param {Object} body Synthetic envelope. @returns {void} */
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'");
 const url=new URL(req.url,`http://127.0.0.1:${port}`);let body={};
 if(req.method!=='GET'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16384){res.destroy();return;}}try{body=JSON.parse(raw||'{}');}catch{json(res,400,{success:false});return;}}
 if(url.pathname==='/__fixture/scenario'){scenario=body.scenario;json(res,200,{success:true});return;}
 if(url.pathname==='/__fixture/release'){held.splice(0).forEach(release=>release());json(res,200,{success:true});return;}
 if(url.pathname.startsWith('/api/')){
  // Hold writes only, allowing the test toolbar to release them; payloads never leave loopback.
  if(scenario==='delayed'&&req.method!=='GET')await new Promise(resolve=>held.push(resolve));
  if(scenario==='network-failure'){res.destroy();return;}
  if(scenario==='server-failure'){json(res,500,{success:false,message:'Synthetic server failure'});return;}
  if(scenario==='negative-envelope'){json(res,200,{success:false,message:'Synthetic request not confirmed'});return;}
  let data=[];
  if(url.pathname==='/api/auth/me')data={id:'synthetic-account',profile_id:profile.id,role:'patient'};
  else if(url.pathname==='/api/patients/synthetic-profile'){
   if(req.method==='PUT')profile={...profile,...Object.fromEntries(Object.entries(body).filter(([key])=>['full_name','blood_group','emergency_contact_name','emergency_contact_phone','emergency_contact_relationship'].includes(key)))};
   data=profile;
  }else if(url.pathname.endsWith('/consent')){if(req.method==='PUT')locked_categories=body.lockedCategories;data={locked_categories};}
  else if(url.pathname.endsWith('/medical-records'))data=scenario==='empty'?[]:records;
  json(res,200,{success:true,data});return;
 }
 const key=assets.has(url.pathname.slice(1))?url.pathname.slice(1):'tests/patient-fixture.html';
 if(!assets.has(key)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',key.endsWith('.js')?'text/javascript':key.endsWith('.css')?'text/css':'text/html');res.end(assets.get(key));
}).listen(port,'127.0.0.1',()=>console.log(`Synthetic patient fixture: http://127.0.0.1:${port}/profile`));
