/**
 * @file auth-ui.test.cjs
 * @module Web/mobile authentication regression tests
 * @desc Actual source handlers/services behind synthetic React/API/navigation boundaries.
 *       Browser screenshots/keyboard checks are separate; this does not render React Native.
 * @author Codex Review Assistant
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, screen } = require('./support/source-ui.cjs');
const TOKEN = 'a'.repeat(64);
const USER = { id: 'fixture-user', role: 'patient', email: 'fixture@example.test', profile_id: 'fixture-profile' };
const event = () => ({ preventDefault() {} });
const ok = data => ({ status: 200, headers: {}, data: { success: true, data } });
const failure = (status, message, retry) => Object.assign(new Error('Synthetic request error'), { response: { status, data: { success: false, message }, headers: { 'retry-after': retry } } });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

/** @param {string} platform Source package. @param {Function} post Synthetic Axios post.
 * @returns {Object} Actual service exports and captured request arguments.
 */
function service(platform, post = async () => ok({ ...USER, email: USER.email })) {
  const calls = [];
  const api = load(`${platform}/src/services/auth.service.js`, { './api': { post: async (...args) => { calls.push(args); return post(...args); } } });
  return { api, calls };
}

/** @param {string} name Screen basename. @param {Object} options API/navigation/context overrides.
 * @returns {Object} Actual web screen, actual service and observed navigation/UI identity actions.
 */
function web(name, { post, email = USER.email, token = TOKEN } = {}) {
  const s = service('frontend', post); const navigation = [], identities = [], clears = [];
  const result = screen(`frontend/src/pages/auth/${name}Page.jsx`, { imports: {
    '../../services/auth.service': s.api,
    '../../store/authStore': selector => selector({ setUser: value => identities.push(value), clearUser: () => clears.push(true) }),
    'react-router-dom': { useLocation: () => ({ state: { email } }), useNavigate: () => (...args) => navigation.push(args),
      useSearchParams: () => [new URLSearchParams({ token })], Link: 'Link' },
  } });
  return { ...result, ...s, navigation, identities, clears };
}

/** @param {string} name Screen basename. @param {Object} options API/prop overrides.
 * @returns {Object} Actual native-source component and service; runtime/native host controls remain synthetic.
 */
function mobile(name, { post, props = {} } = {}) {
  const s = service('mobile', post); const successes = [];
  const result = screen(`mobile/src/screens/${name}Screen.js`, { props: { email: USER.email,
    onLoginSuccess: value => successes.push(value), onRegisterSuccess: value => successes.push(value),
    onVerifySuccess: value => successes.push(value), onBackToLogin() {}, onBackToRegister() {}, ...props },
    imports: { '../services/auth.service': s.api },
  });
  return { ...result, ...s, successes };
}

/** @param {string} kind Pharmacy or laboratory public application. @param {Function} post Synthetic HTTP result.
 * @returns {Object} Actual source callback/service. RHF validation is mocked here and browser-tested separately.
 */
function legacy(kind, post) {
  const s = service('frontend', post); const resets = [];
  const values = { email: USER.email, phone: '0700000000', password: 'fixture-pass', confirmPassword: 'fixture-pass', name: 'Fixture Facility', license_number: 'FIXTURE-LICENCE', address: 'Fixture address' };
  const result = screen(`frontend/src/pages/${kind}/${kind === 'pharmacy' ? 'Pharmacy' : 'Lab'}RegisterPage.jsx`, { imports: {
    '../../services/auth.service': s.api, '../../components/common/Card': 'Card', '../../components/auth/auth.css': {},
    'react-router-dom': { useNavigate: () => () => {}, Link: 'Link' },
    'lucide-react': new Proxy({}, { get: (_target, name) => String(name) }),
    'react-hook-form': { useForm: () => ({ register: name => ({ name }), handleSubmit: callback => () => callback(values),
      watch: name => values[name], reset: () => resets.push(true), formState: { errors: {} } }) },
  } });
  return { ...result, ...s, resets };
}

for (const [name, endpoint] of [['registerPharmacy', '/api/pharmacies/register'], ['registerLaboratory', '/api/laboratories/register']]) test(`web ${name} preserves its separate pending-approval API contract`, async () => {
  const s = service('frontend'); await s.api[name]({ email: USER.email }); assert.equal(s.calls[0][0], endpoint);
  const denied = service('frontend', async () => ({ status: 200, data: { success: false } })); await assert.rejects(denied.api[name]({}), /not acknowledged/);
});
test('pharmacy application callback suppresses duplicates and never reports a negative envelope as pending approval', async () => {
  const pending = deferred(); const h = legacy('pharmacy', () => pending.promise);
  const first = h.submit(); const second = h.submit(); assert.equal(h.calls.length, 1);
  pending.resolve({ status: 200, data: { success: false, message: 'Fixture application rejected' } }); await Promise.all([first, second]); h.render();
  assert.equal(h.resets.length, 0); assert.match(h.find(n => n.type === 'Alert').props.message, /rejected/);
});
test('laboratory application validates confirmation, maps selected tests and waits for acknowledgement', async () => {
  const h = legacy('laboratory');
  for (const [name, value] of Object.entries({ name: 'Fixture Lab', license_number: 'FIXTURE-LAB', address: 'Fixture address', phone: '0700000000', email: USER.email, password: 'fixture-pass', confirmPassword: 'different' })) h.input(name, value);
  await h.submit(); h.render(); assert.equal(h.calls.length, 0); assert.match(h.find(n => n.props.name === 'confirmPassword').props.error, /do not match/);
  h.input('confirmPassword', 'fixture-pass'); h.nodes().find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange(); h.render();
  await h.submit(); h.render(); assert.equal(h.calls[0][0], '/api/laboratories/register'); assert.equal(h.calls[0][1].available_tests.length, 1);
  assert.match(h.text(h.render()), /Application submitted/);
});

for (const platform of ['frontend','mobile']) {
  for (const [name, args, path] of [ ['login', [USER.email, 'legacy'], 'login'],
    ['register', [USER.email, '0700000000', 'fixture-pass', 'patient', { fullName: 'Fixture' }], 'register'],
    ['verifyOtp', [USER.email, '123456'], 'verify-otp'], ['resendOtp', [USER.email], 'resend-otp'],
    ['forgotPassword', [USER.email], 'forgot-password'], ['resetPassword', [TOKEN, 'fixture-pass'], 'reset-password'],
  ]) test(`${platform} actual ${name} wrapper requires acknowledgement and bounds request wait`, async () => {
    const s = service(platform); await s.api[name](...args);
    assert.equal(s.calls[0][0], '/api/auth/' + path); assert.equal(s.calls[0][2].timeout, 15000);
    const negative = service(platform, async () => ({ status: 200, data: { success: false, message: 'Denied fixture' } }));
    await assert.rejects(negative.api[name](...args), /not acknowledged/);
  });
  test(`${platform} actual error formatter preserves rate guidance and hides transport details`, () => {
    const { api } = service(platform);
    assert.match(api.authErrorMessage(failure(429, 'Too many requests.', '90')), /Try again in 90 seconds/);
    assert.match(api.authErrorMessage(failure(429, 'Too many requests.', 'invalid')), /Wait before trying/);
    assert.match(api.authErrorMessage(new Error('secret transport details')), /Cannot connect to Care4U/);
    assert.equal(api.authErrorMessage(failure(502, 'Failed to send verification email. Please try again.')), 'Failed to send verification email. Please try again.');
    for (const status of [500, 502]) assert.equal(api.authErrorMessage(failure(status, 'Synthetic internal database marker')), 'Care4U could not complete the request. Please try again.');
    assert.match(api.authErrorMessage(failure(400, 'OTP has expired')), /expired.*Request a new code/);
    assert.match(api.authErrorMessage(failure(400, 'Invalid OTP')), /incorrect or has been replaced/);
    assert.match(api.authErrorMessage(failure(400, 'Invalid or expired password reset token')), /already used.*Request a new link/);
  });
}

test('web sign-in form handler preserves existing password compatibility and suppresses same-tick duplicates', async () => {
  const pending = deferred(); const h = web('Login', { post: () => pending.promise });
  h.input('email', USER.email); h.input('password', 'legacy');
  const first = h.submit(); const duplicate = h.submit(); h.render();
  assert.equal(h.calls.length, 1); assert.equal(h.find(n => n.type === 'Button').props.loading, true);
  pending.resolve(ok(USER)); await Promise.all([first, duplicate]); h.render();
  assert.equal(h.identities.length, 1); assert.equal(h.navigation[0][0], '/patient/profile');
});

test('web sign-in required errors prevent API calls and associate a field error', async () => {
  const h = web('Login'); await h.submit(); h.render();
  assert.equal(h.calls.length, 0); assert.equal(h.find(n => n.props.name === 'email').props.error, 'Email is required');
});

for (const [label, fields, expected] of [
  ['Patient', { fullName: 'Fixture Person', nic: '200000000000', dateOfBirth: '2000-01-01' }, { fullName: 'Fixture Person', nic: '200000000000', dateOfBirth: '2000-01-01' }],
  ['Doctor', { fullName: 'Fixture Doctor', slmcRegNumber: 'FIXTURE-SLMC', specialization: 'Fixture specialty' }, { fullName: 'Fixture Doctor', slmcRegNumber: 'FIXTURE-SLMC', specialization: 'Fixture specialty' }],
  ['Pharmacist', { pharmacyName: 'Fixture Pharmacy', licenseNumber: 'FIXTURE-PH', pharmacyAddress: 'Fixture address', pharmacyPhone: '0700000000' }, { name: 'Fixture Pharmacy', licenseNumber: 'FIXTURE-PH', address: 'Fixture address', phone: '0700000000' }],
  ['Lab Technician', { laboratoryName: 'Fixture Lab', laboratoryLicenseNumber: 'FIXTURE-LAB', laboratoryAddress: 'Fixture address', laboratoryPhone: '0700000000' }, { name: 'Fixture Lab', licenseNumber: 'FIXTURE-LAB', address: 'Fixture address', phone: '0700000000' }],
  ['Hospital Staff', { hospitalName: 'Fixture Hospital', hospitalType: 'Fixture type', hospitalLocation: 'Fixture location', hospitalDepartments: 'Fixture department' }, { name: 'Fixture Hospital', type: 'Fixture type', location: 'Fixture location', departments: 'Fixture department' }],
]) test(`web registration ${label}: both steps submit and only selected role fields reach API`, async () => {
  const h = web('Register'); h.press(label); h.render();
  for (const [name, value] of Object.entries({ email: USER.email, phone: '0700000000', password: 'fixture-pass', confirmPassword: 'fixture-pass' })) h.input(name, value);
  await h.submit(); h.render();
  for (const [name, value] of Object.entries(fields)) h.input(name, value);
  await h.submit(); h.render();
  assert.equal(h.calls.length, 1); assert.equal(JSON.stringify(h.calls[0][1].profileData), JSON.stringify(expected));
  assert.equal(h.navigation[0][0], '/verify-otp'); assert.equal(h.navigation[0][1].state.email, USER.email);
});

test('web registration whitespace-only role details never submit', async () => {
  const h = web('Register');
  for (const [name, value] of Object.entries({ email: USER.email, phone: '0700000000', password: 'fixture-pass', confirmPassword: 'fixture-pass' })) h.input(name, value);
  await h.submit(); h.render(); h.input('fullName', '   '); await h.submit();
  assert.equal(h.calls.length, 0);
});

test('web OTP patient goes directly to signed-in destination after acknowledgement', async () => {
  const h = web('OtpVerification', { post: async () => ok({ approvalPending: false, user: USER }) });
  h.input('otpCode', '123456'); await h.submit();
  assert.equal(h.identities.length, 1); assert.equal(h.navigation[0][0], '/patient/profile');
});
test('web OTP pending professional clears stale UI identity and returns to approval guidance', async () => {
  const h = web('OtpVerification', { post: async () => ok({ approvalPending: true, user: { ...USER, role: 'doctor' } }) });
  h.input('otpCode', '123456'); await h.submit();
  assert.equal(h.identities.length, 0); assert.equal(h.clears.length, 1); assert.equal(h.navigation[0][0], '/login');
  assert.match(h.navigation[0][1].state.message, /awaiting admin approval/);
});
test('web OTP missing context and malformed code do not call API', async () => {
  const missing = web('OtpVerification', { email: '' }); assert.equal(missing.nodes().some(n => n.type === 'form'), false);
  const h = web('OtpVerification'); h.input('otpCode', '12ab'); await h.submit(); h.render();
  assert.equal(h.calls.length, 0); assert.equal(h.find(n => n.type === 'Alert').props.message, 'Enter a 6-digit verification code');
});
for (const firstAction of ['verify','resend']) test(`web OTP ${firstAction} suppresses competing action and releases after provider failure`, async () => {
  const pending = deferred(); const h = web('OtpVerification', { post: () => pending.promise }); h.input('otpCode', '123456');
  const first = firstAction === 'verify' ? h.submit() : h.press('Resend code');
  const second = firstAction === 'verify' ? h.press('Resend code') : h.submit();
  assert.equal(h.calls.length, 1);
  pending.resolve({ status: 502, data: { success: false, message: 'Failed to submit email.' } });
  await Promise.all([first, second]); h.render();
  assert.equal(h.find(n => n.type === 'form').props['aria-busy'], false);
  assert.match(h.find(n => n.type === 'Alert').props.message, /could not complete/);
});

for (const [name, stateName] of [['ForgotPassword','submitted'],['ResetPassword','success']]) test(`web ${name} retains rate retry guidance without showing success`, async () => {
  const h = web(name, { post: async () => { throw failure(429, 'Too many requests.', '90'); } });
  if (name === 'ForgotPassword') h.input('email', USER.email);
  else { h.input('newPassword', 'fixture-pass'); h.input('confirmPassword', 'fixture-pass'); }
  await h.submit(); h.render();
  assert.equal(h.nodes().some(n => n.type === 'Alert' && n.props.type === 'success'), false, stateName);
  assert.match(h.find(n => n.type === 'Alert').props.message, /90 seconds/);
});
test('web reset invalid token offers recovery and mismatched passwords never call API', async () => {
  const invalid = web('ResetPassword', { token: 'bad' }); assert.equal(invalid.nodes().some(n => n.type === 'form'), false);
  const h = web('ResetPassword'); h.input('newPassword', 'fixture-pass'); h.input('confirmPassword', 'different'); await h.submit(); h.render();
  assert.equal(h.calls.length, 0); assert.match(h.find(n => n.props.name === 'confirmPassword').props.error, /do not match/);
});
test('web acknowledged recovery stays generic and acknowledged reset clears passwords', async () => {
  const forgot = web('ForgotPassword'); forgot.input('email', USER.email); await forgot.submit(); forgot.render();
  const message = forgot.find(n => n.type === 'Alert').props.message;
  assert.match(message, /If an account exists/); assert.doesNotMatch(message, /has been sent|delivered/);
  const reset = web('ResetPassword'); reset.input('newPassword', 'fixture-pass'); reset.input('confirmPassword', 'fixture-pass');
  await reset.submit(); reset.render(); assert.equal(reset.find(n => n.type === 'Alert').props.type, 'success');
  assert.equal(reset.nodes().some(n => n.type === 'form'), false);
});

test('mobile sign-in accepts existing short passwords and suppresses rapid duplicate taps', async () => {
  const pending = deferred(); const h = mobile('Login', { post: () => pending.promise });
  h.input('Email address', USER.email); h.input('Password', 'legacy');
  const first = h.press('Sign in'); const second = h.press('Sign in'); assert.equal(h.calls.length, 1);
  pending.resolve(ok(USER)); await Promise.all([first, second]); assert.equal(h.successes.length, 1);
});
for (const role of ['patient','doctor']) test(`mobile registration ${role} maps supported role fields without exposing password in success callback`, async () => {
  const h = mobile('Register'); if (role === 'doctor') { h.press('Doctor'); h.render(); }
  for (const [name, value] of Object.entries({ 'Full name': 'Fixture Person', 'Email address': USER.email, 'Phone number': '0700000000',
    Password: 'fixture-pass', 'Confirm password': 'fixture-pass', ...(role === 'patient' ? { 'NIC number': '200000000000', 'Date of birth, YYYY-MM-DD': '2000-01-01' }
      : { 'SLMC registration number': 'FIXTURE-SLMC', Specialization: 'Fixture specialty' }) })) h.input(name, value);
  await h.press('Request verification code');
  assert.equal(h.calls[0][1].role, role); assert.equal(h.calls[0][1].profileData.fullName, 'Fixture Person');
  assert.equal(Object.keys(h.successes[0]).join(','), 'email');
});
test('mobile registration rejects impossible dates before requesting email', async () => {
  const h = mobile('Register');
  for (const [name, value] of Object.entries({ 'Full name': 'Fixture Person', 'Email address': USER.email, 'Phone number': '0700000000', Password: 'fixture-pass', 'Confirm password': 'fixture-pass', 'NIC number': '200000000000', 'Date of birth, YYYY-MM-DD': '2000-02-31' })) h.input(name, value);
  await h.press('Request verification code'); h.render(); assert.equal(h.calls.length, 0); assert.match(h.text(h.render()), /YYYY-MM-DD/);
});
for (const name of ['ForgotPassword','ResetPassword']) test(`mobile ${name} does not report a rejected 200 envelope as success and restores editing`, async () => {
  const h = mobile(name, { post: async () => ({ status: 200, data: { success: false, message: 'Synthetic rejection' } }) });
  if (name === 'ForgotPassword') { h.input('Email address', USER.email); await h.press('Request reset link'); }
  else { h.input('Reset link or token', `https://example.test/reset-password?token=${TOKEN}`); h.input('New password', 'fixture-pass'); h.input('Confirm password', 'fixture-pass'); await h.press('Reset password'); }
  h.render(); assert.match(h.text(h.render()), /Synthetic rejection/);
  assert.equal(h.nodes().some(n => n.type === 'TextInput' && n.props.editable === true), true);
  assert.doesNotMatch(h.text(h.render()), /Your password has been reset|Request processed/);
});
for (const link of ['javascript:fixture', 'https://example.test/reset?token=bad', TOKEN.toUpperCase()]) test(`mobile reset refuses malformed link/token ${link.slice(0, 20)}`, async () => {
  const h = mobile('ResetPassword'); h.input('Reset link or token', link); h.input('New password', 'fixture-pass'); h.input('Confirm password', 'fixture-pass');
  await h.press('Reset password'); assert.equal(h.calls.length, 0);
});
test('mobile reset accepts a raw token and clears secrets only after acknowledgement', async () => {
  const h = mobile('ResetPassword'); h.input('Reset link or token', TOKEN); h.input('New password', 'fixture-pass'); h.input('Confirm password', 'fixture-pass');
  await h.press('Reset password'); h.render(); assert.equal(h.calls[0][1].token, TOKEN);
  assert.match(h.text(h.render()), /Your password has been reset/); assert.equal(h.nodes().some(n => n.type === 'TextInput'), false);
});
test('mobile OTP missing context presents recovery without accepting verification', () => {
  const h = mobile('OtpVerification', { props: { email: '' } });
  assert.match(h.text(h.render()), /No registration in progress/); assert.equal(h.calls.length, 0);
});
for (const firstAction of ['verify','resend']) test(`mobile OTP ${firstAction} excludes competing request`, async () => {
  const pending = deferred(); const h = mobile('OtpVerification', { post: () => pending.promise }); h.input('Verification code', '123456');
  const first = h.press(firstAction === 'verify' ? 'Verify email' : 'Resend code');
  const second = h.press(firstAction === 'verify' ? 'Resend code' : 'Verify email'); assert.equal(h.calls.length, 1);
  pending.resolve(ok({ approvalPending: false, user: USER })); await Promise.all([first, second]); h.render();
});

test('shared Input associates required/error text and visibility toggle never submits the form', () => {
  const h = screen('frontend/src/components/common/Input.jsx', { props: { name: 'secret', label: 'Password', type: 'password', revealPassword: true, required: true, error: 'Fixture error' } });
  let input = h.find(n => n.type === 'input'); assert.equal(input.props.required, true); assert.equal(input.props['aria-describedby'], 'secret-error');
  assert.equal(h.find(n => n.type === 'label').props.htmlFor, input.props.id); assert.equal(h.find(n => n.type === 'button').props.type, 'button');
  h.find(n => n.type === 'button').props.onClick(); h.render(); input = h.find(n => n.type === 'input'); assert.equal(input.props.type, 'text');
});

/** Build side-effect-free module stubs for the partial root-app handler tests only. */
function appImports(file) {
  const source = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'); const imports = {};
  const stub = () => null; const proxy = new Proxy(stub, { get: (_target, name) => name === '__esModule' ? true : name === 'default' ? stub : stub });
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) if (!['react', 'react-native', 'lucide-react-native'].includes(match[1])) imports[match[1]] = proxy;
  return imports;
}
for (const succeeds of [false,true]) test(`mobile actual logout ${succeeds ? 'success clears' : 'failure preserves'} local identity`, async () => {
  const clears = [], alerts = []; const imports = appImports('mobile/App.js');
  imports['./src/store/authStore'] = select => select({ user: USER, setUser() {}, clearUser: () => clears.push(true) });
  imports['./src/services/api'] = { post: async () => { if (!succeeds) throw new Error('Synthetic offline'); return ok({}); } };
  const rn = { StyleSheet: { create: value => value }, Platform: { OS: 'android' }, Alert: { alert: (...args) => alerts.push(args) } };
  imports['react-native'] = new Proxy(rn, { get: (target, name) => target[name] || String(name) });
  const h = screen('mobile/App.js', { imports });
  await h.find(n => n.type?.name === 'MobileHeader').props.onLogout();
  assert.equal(clears.length, succeeds ? 1 : 0); assert.equal(alerts.length, succeeds ? 0 : 1);
  if (!succeeds) assert.match(alerts[0][1], /session may still be active/);
});
test('web wrong-role guard preserves denial without updating store during render', () => {
  const clears = []; const imports = appImports('frontend/src/App.jsx');
  const actions = { user: USER, clearUser: () => clears.push(true) };
  imports['./store/authStore'] = select => select(actions);
  imports['react-router-dom'] = { Navigate: 'Navigate' };
  const h = screen('frontend/src/App.jsx', { binding: 'ProtectedRoute', props: { allowedRoles: ['doctor'] }, imports });
  assert.equal(clears.length, 0); assert.equal(h.render().props.to, '/login'); h.effects(); assert.equal(clears.length, 1);
});
for (const approvalPending of [false,true]) test(`mobile actual OTP parent ${approvalPending ? 'awaits approval' : 'admits acknowledged patient'}`, () => {
  const identities = []; const imports = appImports('mobile/App.js');
  const actions = { user: null, setUser: value => identities.push(value), clearUser() {} };
  imports['./src/store/authStore'] = selector => selector(actions);
  const h = screen('mobile/App.js', { imports });
  h.find(n => typeof n.props.onRegister === 'function').props.onRegister(); h.render();
  h.find(n => typeof n.props.onRegisterSuccess === 'function').props.onRegisterSuccess({ email: USER.email }); h.render();
  h.find(n => typeof n.props.onVerifySuccess === 'function').props.onVerifySuccess({ approvalPending, user: USER }); h.render();
  assert.equal(identities.length, approvalPending ? 0 : 1);
  if (approvalPending) assert.equal(h.nodes().some(n => typeof n.props.onLoginSuccess === 'function'), true);
});

for (const [moduleName, handler] of [['pharmacy', 'registerPharmacyController'], ['laboratory', 'registerLaboratoryController']]) {
  test(`${moduleName} public registration hides unexpected failures and preserves expected business errors`, async () => {
    for (const statusCode of [500, 400]) {
      const controllers = load(`backend/src/modules/${moduleName}/${moduleName}.controller.js`, {
        [`./${moduleName}.service`]: { [moduleName === 'pharmacy' ? 'registerPharmacy' : 'registerLaboratory']: async () => {
          throw Object.assign(new Error(statusCode === 500 ? 'Synthetic internal database marker' : 'Synthetic duplicate licence'), { statusCode });
        } },
      });
      const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      await controllers[handler]({ body: { email: USER.email, password: 'fixture-pass', phone: '0700000000', name: 'Fixture Facility', license_number: 'FIXTURE', address: 'Fixture address' } }, response);
      assert.equal(response.code, statusCode);
      assert.equal(response.body.success, false);
      assert.equal(response.body.message, statusCode === 500 ? 'Registration could not be completed. Please try again.' : 'Synthetic duplicate licence');
    }
  });
}
