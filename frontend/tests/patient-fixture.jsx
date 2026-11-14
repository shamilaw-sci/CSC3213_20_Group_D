/**
 * @file patient-fixture.jsx
 * @module Synthetic patient browser verification
 * @desc Actual patient screens, stores and Query provider; synthetic API only, no real destinations.
 * @author Codex Review Assistant
 */
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'react-hot-toast';
import PatientProfilePage from '../src/pages/patient/PatientProfilePage';
import MedicalRecordsPage from '../src/pages/patient/MedicalRecordsPage';
import useAuthStore from '../src/store/authStore';
import '../src/index.css';
const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
useAuthStore.getState().setUser({id:'synthetic-account',profile_id:'synthetic-profile',role:'patient'});
/** Fixture controls change only an in-memory loopback server, never live database settings.
 * @returns {JSX.Element} Actual scoped screens and visible synthetic scenario controls.
 */
export default function Fixture(){
 const [scenario,setScenario]=useState('success');
 const change=async event=>{const next=event.target.value;await fetch('/__fixture/scenario',{method:'POST',body:JSON.stringify({scenario:next})});setScenario(next);};
 return <QueryClientProvider client={client}><BrowserRouter><Toaster/><aside style={{padding:12,background:'#fff3cd',color:'#332500'}}>
 <strong>Synthetic patient fixture — no live records, uploads or emails.</strong>{' '}
 <label>API scenario <select aria-label="API scenario" value={scenario} onChange={change}>{['success','negative-envelope','server-failure','network-failure','delayed','empty'].map(value=><option key={value}>{value}</option>)}</select></label>{' '}
 <button onClick={()=>{client.invalidateQueries();}}>Reload data</button>{' '}
 <button onClick={()=>fetch('/__fixture/release',{method:'POST'})}>Release response</button>{' '}
 <Link to="/profile">Profile</Link>{' '}<Link to="/records">Records</Link>
 </aside><main data-module="patient" className="min-h-screen bg-secondary/30 px-4 md:px-8 py-6"><Routes>
 <Route path="/profile" element={<PatientProfilePage/>}/><Route path="*" element={<MedicalRecordsPage/>}/>
 </Routes></main></BrowserRouter></QueryClientProvider>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
