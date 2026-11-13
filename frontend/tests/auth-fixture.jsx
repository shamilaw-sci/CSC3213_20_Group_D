/**
 * @file auth-fixture.jsx
 * @module Auth UI verification fixture
 * @desc Actual auth screens with synthetic API and destination routes, not a production app entry.
 * @author Codex Review Assistant
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import '../src/index.css';
import LoginPage from '../src/pages/auth/LoginPage';
import RegisterPage from '../src/pages/auth/RegisterPage';
import OtpVerificationPage from '../src/pages/auth/OtpVerificationPage';
import ForgotPasswordPage from '../src/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../src/pages/auth/ResetPasswordPage';
import PharmacyRegisterPage from '../src/pages/pharmacy/PharmacyRegisterPage';
import LabRegisterPage from '../src/pages/laboratory/LabRegisterPage';
import useAuthStore from '../src/store/authStore';

/** @returns {JSX.Element} Test controls outside product forms; scenario changes never contact a real API. */
export default function Fixture() {
  const [scenario, setScenario] = useState('success');
  const [ready, setReady] = useState(true);
  const user = useAuthStore(state => state.user);
  /** @param {Object} event Scenario selection. @returns {Promise<void>} Await the local fixture configuration. */
  const selectScenario = async event => {
    const value = event.target.value; setReady(false);
    await fetch('/__fixture/scenario', { method: 'POST', body: JSON.stringify({ scenario: value }) });
    setScenario(value); setReady(true);
  };
  return <>
    <aside style={{ padding: 12, fontFamily: 'sans-serif', background: '#fff3cd', color: '#332500' }}>
      <strong>Synthetic auth fixture — no account or email actions.</strong>{' '}
      <label>API scenario <select aria-label="API scenario" value={scenario} onChange={selectScenario}>
        {['success', 'pending', 'rate-limit', 'network-failure', 'server-failure', 'provider-failure', 'negative-envelope', 'expired-code', 'replaced-code', 'expired-token', 'delayed'].map(value => <option key={value}>{value}</option>)}
      </select></label>{' '}<span role="status">{ready ? 'Fixture ready' : 'Updating fixture'}</span>{' '}
      <Link to="/login">Sign-in fixture</Link>{' '}<Link to="/register">Registration fixture</Link>{' '}
      <button type="button" onClick={() => fetch('/__fixture/release', { method: 'POST' })}>Release delayed response</button>
    </aside>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
      <Route path="/laboratory/register" element={<LabRegisterPage />} />
      <Route path="*" element={<main><h1>Synthetic signed-in destination</h1><p>Confirmed UI identity: {user?.role || 'none'}</p><Link to="/login">Back to fixture</Link></main>} />
    </Routes>
  </>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Fixture /></BrowserRouter>);
