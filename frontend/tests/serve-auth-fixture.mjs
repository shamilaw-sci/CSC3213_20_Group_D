/**
 * @file serve-auth-fixture.mjs
 * @module Auth UI verification fixture
 * @desc Loopback-only, in-memory build/API fixtures. No dotenv, DB, email, disk build or app server import.
 * @author Codex Review Assistant
 */
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 4178;
const result = await build({ root, configFile: false, envDir: false, publicDir: false,
  plugins: [react(), tailwindcss()], define: { 'import.meta.env.VITE_API_URL': JSON.stringify(`http://127.0.0.1:${port}`) },
  build: { write: false, rollupOptions: { input: fileURLToPath(new URL('./auth-fixture.html', import.meta.url)) } },
});
const assets = new Map(result.output.map(item => [item.fileName, item.type === 'asset' ? item.source : item.code]));
let scenario = 'success';
let pending = { email: 'fixture@example.test', role: 'patient' };
const held = [];
/** @param {Object} res Node response. @param {number} status HTTP code. @param {Object} data Synthetic body. @returns {void} */
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '90' } : {}) }); res.end(JSON.stringify(data)); };
const server = http.createServer(async (req, res) => {
  // Keep fonts/assets/API access on this host; blocked remote Google fonts use the local fallback.
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'");
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (req.method === 'POST') {
    let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 16384) { res.destroy(); return; } }
    let body; try { body = JSON.parse(raw || '{}'); } catch { json(res, 400, { success: false }); return; }
    if (url.pathname === '/__fixture/scenario') { scenario = body.scenario; json(res, 200, { success: true }); return; }
    if (url.pathname === '/__fixture/release') { held.splice(0).forEach(release => release()); json(res, 200, { success: true }); return; }
    if (!url.pathname.startsWith('/api/auth/') && !['/api/pharmacies/register', '/api/laboratories/register'].includes(url.pathname)) { json(res, 404, { success: false }); return; }
    if (body.email && !body.email.endsWith('@example.test')) { json(res, 400, { success: false, message: 'Use synthetic @example.test addresses only.' }); return; }
    if (scenario === 'delayed') await new Promise(resolve => held.push(resolve));
    if (scenario === 'network-failure') { res.destroy(); return; }
    if (scenario === 'rate-limit') { json(res, 429, { success: false, message: 'Too many authentication requests. Please try again later.' }); return; }
    if (scenario === 'server-failure') { json(res, 500, { success: false, message: 'Internal server error' }); return; }
    if (scenario === 'provider-failure') { json(res, 502, { success: false, message: 'Failed to send verification email. Please try again.' }); return; }
    if (scenario === 'expired-code') { json(res, 400, { success: false, message: 'OTP has expired' }); return; }
    if (scenario === 'replaced-code') { json(res, 400, { success: false, message: 'Invalid OTP' }); return; }
    if (scenario === 'expired-token') { json(res, 400, { success: false, message: 'Invalid or expired password reset token' }); return; }
    if (scenario === 'negative-envelope') { json(res, 200, { success: false, message: 'Synthetic request was not acknowledged.' }); return; }
    if (url.pathname === '/api/auth/register') pending = { email: body.email, role: body.role };
    const user = { id: 'synthetic-user', email: pending.email, role: pending.role, profile_id: 'synthetic-profile', full_name: 'Fixture User' };
    const data = url.pathname.endsWith('/login') ? { ...user, email: body.email, role: 'patient' }
      : url.pathname.endsWith('/verify-otp') ? { approvalPending: scenario === 'pending' || pending.role !== 'patient', user, profile: { id: user.profile_id } }
      : { email: body.email, otpExpiresAt: new Date(Date.now() + 600000).toISOString() };
    json(res, 200, { success: true, message: 'Synthetic acknowledgement', data }); return;
  }
  const key = assets.has(url.pathname.slice(1)) ? url.pathname.slice(1) : 'tests/auth-fixture.html';
  if (!assets.has(key)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', key.endsWith('.js') ? 'text/javascript' : key.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(assets.get(key));
});
server.listen(port, '127.0.0.1', () => console.log(`Synthetic auth fixture ready at http://127.0.0.1:${port}/login`));
