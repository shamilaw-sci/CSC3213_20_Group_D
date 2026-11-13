# Authentication file reference

Current through Stage 3A: use [the complete UI file reference](03-authentication-ui-file-reference.md) for every scoped web/mobile screen, shared control, request wrapper and parent auth callback. Backend entries below retain their scoped evidence; native/real DB/session acceptance is still pending.

Companion to [the workflow explanation](02-authentication-and-access.md). Repository-relative paths below are exact Ctrl+F/navigation keys. **Core** means the file's authentication logic was inspected function by function; it does not mean DB/browser/device acceptance passed. **Dependency trace** means only the named access path was followed; the remainder is pending. [The change map](02-authentication-change-map.md) lists proposed exercises separately from implemented fixes.

## Ownership key

- **A:** Existing credit is I.M.L.S. Idirisinghe (S/21/389); Git introduction is `lasitha`. The registration number/history support continuity, but the displayed name differs from current maintainer Lasitha Sanuth. Keep the original credit; name reconciliation remains unresolved.
- **W:** Existing Wasana Karunanayaka (S/21/081) header and Wasana Git identity corroborate original work; this is not a claim of sole authorship. Later contributions stay distinct.
- Creation candidates, original header contents and lineage checks are in `docs/review/evidence/stage2a/ownership.json`. Review-assistant changes are identified by the Stage 2A/2B/3A commits, without transferring student authorship. Module maintainer and original author are separate.

## 1. `backend/src/modules/auth/auth.routes.js` — core

[Source](../../backend/src/modules/auth/auth.routes.js). Purpose: connect the eight authentication URLs to their handlers. Ownership **A**, introduction `cb1614e3e751`; Auth maintainer Lasitha. Features: staged registration, verification/resend, login, logout, session restoration and recovery. No SQL/table access occurs in this file.

There are no custom named handler functions here. Module initialization creates a Router and `loginRateLimiter`; its configured message is the 429 JSON response. Stage 2B adds `createAuthLimiters`/`limits` from `auth.limits.js`. Register/resend/forgot share `emailIp` then `emailAddress`; verify uses `verifyIp` then `verifyEmail`; reset uses `resetIp` then `resetToken`, always before its controller. Registration order is the logic: `POST /register`, `/verify-otp`, `/resend-otp` call controllers without a session gate; `/login` adds the ten-per-15-minute IP limiter before its controller; `/logout` lets the controller handle existing/absent sessions; `GET /me` places `isAuthenticated` before `getMeController`; forgot/reset are pre-authentication recovery routes. Mounted at `/api/auth` in `backend/app.js`.

Inputs are URL/method/body/cookie through Express; outputs/errors are controller JSON or limiter rejection. Ctrl+F `loginRateLimiter`, `router.get('/me'`, `router.post`. Small exercise: change a rate-limit message here; change recovery thresholds through `auth.limits.js`/environment with tests for shared budgets and legitimate retries. Route-order tests use fake middleware; separate Stage 2B tests execute installed rate accounting. Neither proves full HTTP/browser dispatch.

## 2. `backend/src/modules/auth/auth.controller.js` — core

[Source](../../backend/src/modules/auth/auth.controller.js). Purpose: validate HTTP input, coordinate identity/session responses and map errors to status codes. Ownership **A**, introduction `cb1614e3e751`; later profile/lifecycle work has multiple contributors. The new session helper is a Stage 2A review-assistant contribution; it does not replace original file credit. Dependencies: auth service; patient/doctor/pharmacy/laboratory/hospital repositories; Express-session request API. Callers: auth routes. Tables are accessed indirectly through those dependencies.

| Function / exact search term | Inputs -> output/side effects | Logic, permissions and failure behavior |
|---|---|---|
| `isNonemptyString` | Untrusted field -> boolean; no mutation | Check string type, then trimmed nonempty content. Password characters are not rewritten. Helps reject arrays/objects/numbers before database/hash operations. |
| `saveAuthenticatedSession` | `req`, limited public user object -> promise; rotates ID, sets `session.user`, saves | 1. Await regeneration. 2. Assign identity. 3. Await save. On either failure, remove an available in-memory identity, attempt destruction and reject. The endpoint cannot claim login success before acknowledgement. It is not a real-store integration test. |
| `registerController` | email/phone/password/role plus optional object profileData -> 200 `{email,otpExpiresAt}` | 1. Validate string shapes, public-role allowlist and eight-character password. 2. Reject non-object supplied profile data. 3. Call `register`. 4. Report email submission. 400 validation/duplicate, 502 reported email failure, 500 unexpected. It does not log in or fully validate every role-specific profile field. |
| `resendOtpController` | body.email -> 200 new email/expiry | Require a nonempty string; call resend; 404 no pending registration, 502 reported send failure, 500 unexpected. No user/profile created. |
| `verifyOtpController` | body.email, six-digit string otpCode -> 201 `{approvalPending,user,profile}` | Call verification transaction. Patient/approved identity uses saved fresh session; pending professional removes any old session user and waits for approval. 400 wrong/expired code or duplicate; 404 no pending row; 500 DB/session failure. Account creation may already have committed when session save fails. |
| `loginController` | body.email/password -> 200 public session identity | Require strings; validate service credentials; resolve the role-specific profile; construct only id/email/role/profile_id/full_name; rotate/save; return. Missing profile becomes null rather than a fabricated ID. 401 invalid credentials, 403 restricted account, 429 lockout, 500 repository/session failure. |
| `logoutController` | optional session -> 200 or 500; clears `connect.sid` after destruction | Existing session: destroy callback must succeed first. Missing session is idempotent success with cookie clearing. Destruction error returns 500, not successful logout. The callback is the completion gate. |
| `getMeController` | already-gated session.user -> 200 identity, otherwise 401 | Return the public snapshot after middleware. It does not itself query account state or validate consent. |
| `forgotPasswordController` | body.email -> generic 200 response | Reject malformed/missing field with 400, call recovery service, relay generic message. Unexpected repository failure is 500. A generic success is not proof that an account exists or an email arrived. |
| `resetPasswordController` | 64 lowercase-hex token, newPassword string (8+) -> 200 confirmation | Validate independently of client confirmation fields; await reset transaction; 400 invalid/expired/used or malformed, 500 unexpected. Does not create/revoke sessions. |

The lifecycle helper's Promise executors/callbacks only translate regenerate/save callbacks into resolve/reject; the destroy callback is best-effort cleanup. Controller logs retain operational error name/code instead of raw error objects. Supported features and status distinctions are listed above; no controller is a substitute for route authorization. Small exercises: change OTP copy in `registerController`; add a validated profile field across controller/service/repository; change session identity fields only after checking hydration/store consumers and preventing password/hash exposure.

## 3. `backend/src/modules/auth/auth.service.js` — core

[Source](../../backend/src/modules/auth/auth.service.js). Purpose: implement registration, credential, verification and recovery rules. Ownership **A**, introduction `cb1614e3e751`; later transactional/provider changes have separate contributors. Depends on bcrypt, Node crypto, OTP/QR/email helpers and auth repository. Called by the controller. Relevant tables: users, pending registrations, role profiles and password reset tokens, through repository functions.

| Function | Inputs -> output/side effects | Short steps and important limits |
|---|---|---|
| `register` | email/phone/plain password/role/profileData -> email/expiry | Check existing exact email; hash password at cost 12; generate ten-minute code; upsert pending data; attempt email; reject send failure. No account/profile created. Provider rejection can leave pending data, so resend remains possible. Role/scalar validation is currently the controller's contract. |
| `resendOtp` | email -> email/new expiry | Read pending ID/email; generate code/expiry; call `replacePendingOtp`; no matched row rejects without email; otherwise submit email outside an explicit transaction. No identity/hash/role/profile rewrite or insert. Provider false/throw rejects but leaves replacement stored. Current stored code wins; concurrent email order need not match writes. PG acceptance pending. |
| `verifyOtp` | email/code -> user/profile | Inside `withTransaction`, lock/read pending row; reject missing, wrong, exact-expiry or invalid-expiry code; create account; choose one of five profile builders; delete pending row on same client; return after commit. QR creation applies to patients. Callback/branches perform the work on the passed client. Actual DB concurrency/rollback is pending. |
| `login` | email/password -> full internal user row | Find exact email; deny absent/active lockout; compare hash; increment failures on mismatch; then check active/rejected/professional approval; clear counters on admitted valid login. It neither returns the whole row to HTTP nor creates a session itself. Preserve locked-account 429 semantics; no timing equalization. |
| `forgotPassword` | email -> generic message | Unknown account returns generic response; known account gets 32 random bytes encoded to 64 hex chars, one-hour expiry, raw token row and email attempt. Transport rejection/exception stays generic; DB failure propagates. Other tokens are not revoked. |
| `resetPassword` | token/new password -> resolved promise | Inside one transaction: select/lock valid unused token; bcrypt password; update user; guarded token consumption must return a row; commit. Failure rejects for rollback. Does not clear lockout or revoke sessions/other reset links. |

Ctrl+F function names and constants `MAX_FAILED_LOGIN_ATTEMPTS`, `LOCKOUT_MINUTES`. Change password length at the controller and both clients, not only here; bcrypt cost is an exercise in `register`/`resetPassword`, requiring performance evidence. A proposed reset-session revocation rule needs a compatible session-store design and real DB tests. No new rule is silently introduced by the notes.

## 4. `backend/src/modules/auth/auth.repository.js` — core

[Source](../../backend/src/modules/auth/auth.repository.js). Purpose: execute parameterized auth SQL and provide a shared transaction client. Ownership **A**, introduction `cb1614e3e751`; original source is not assigned to the latest review committer. It imports `config/db`, which connects at import in normal runtime. Tests replace that import before loading. Callers: auth service; no direct public endpoints. Errors propagate to the service/controller.

| Function | Inputs -> output / tables | Important logic |
|---|---|---|
| `withTransaction` | async callback(client) -> callback result | Acquire client, BEGIN, await callback, COMMIT; on error request ROLLBACK; finally release. Callback failure tests prove command sequencing only. A rollback-driver failure can mask the original error; actual recovery is pending. |
| `createUser` | email, phone, hash, role, optional db -> selected new users row | Mark email verified; professional roles doctor/pharmacist/lab_technician/hospital_staff become pending, others approved; insert parameterized values. Public role restriction belongs to controller. Never returns password_hash in the selected creation fields. |
| `createPatient` | userId, fullName, nic, dateOfBirth, qrCodeId, db -> patient row | Insert account-linked identity/QR fields. Actual required/unique constraints depend on missing base schema. |
| `createDoctor` | userId, fullName, slmcRegNumber, specialization, db -> doctor row | Insert linked profile with `is_verified:false`; does not approve a professional. |
| `createPharmacy` | userId, name, licenseNumber, address, phone, db -> pharmacy row | Insert linked unverified active pharmacy; distinct from user's pending approval flag. |
| `createLaboratory` | same facility identity/contact inputs, db -> laboratory row | Insert linked unverified active laboratory. Uses the shared transaction client during OTP account creation. |
| `createHospital` | userId, name, type, location, departments, db -> hospital row | Insert linked unverified active hospital. No external credential verification is performed. |
| `findUserByEmail` | exact email -> users row or null | Parameterized SELECT; returns internal password/state fields for the service. No case normalization. |
| `savePasswordResetToken` | raw token, userId, expiry -> inserted token row | Insert raw bearer secret and expiry. No migration to hashed storage or deletion of older tokens here. |
| `getValidPasswordResetToken` | token, optional db -> row/null | Select unused token whose expiry exceeds transaction current timestamp; request `FOR UPDATE`. Lock retention requires caller transaction, not a one-off pool query. |
| `markTokenAsUsed` | token, db -> token row/null | Guard UPDATE by unused/unexpired state, mark used, return token. The service treats no row as rejection and requests rollback. |
| `updateUserPassword` | userId, already-hashed password, db -> void | Update password_hash by user ID. Does not invalidate sessions or modify lockout. |
| `upsertOtpVerification` | email, phone, hash, role, code, expiry, profileData -> pending public columns | Insert or overwrite pending registration by email; store raw OTP and hashed password; update timestamp. Returned columns omit secrets, while subsequent find may read them internally. |
| `replacePendingOtp` | observed pending ID, exact email, code, expiry -> selected identity/expiry or null | One parameterized UPDATE by ID + email; only code, expiry and timestamp change. No insert/upsert or registration identity fields; zero rows means consumed/replaced/missing. Called by resend only, before provider submission. |
| `findOtpByEmail` | email, optional db -> pending row/null | Read pending account data; request `FOR UPDATE` only when passed a transaction client. This is why verify and resend use different read contexts. |
| `deleteOtpByEmail` | email, db -> void | Delete pending row on supplied client after account/profile creation. Sequential replay then finds no pending registration. |
| `incrementFailedLoginAttempts` | userId, threshold, cooldown minutes -> counter/deadline | Atomic SQL increment; if new count reaches threshold, set lock deadline to current timestamp plus interval. Unknown nullable/default constraints remain PENDING DB. |
| `resetFailedLoginAttempts` | userId -> void | Set failures to zero and deadline NULL after an eligible successful login. Expiry alone does not call this function. |

Each exact function name is a Ctrl+F key. Small exercises: add a returned public profile field with coordinated caller changes; change lockout threshold through service constants; add token storage/session revocation only with a schema/compatibility plan and real replay/rollback tests. Do not edit parameterized SQL into string-concatenated user input.

## 5. `backend/src/middleware/auth.js` — core

[Source](../../backend/src/middleware/auth.js). Purpose: admit current accounts and enforce role/profile guards. Ownership **A**, original `1bfd62797f1d`; later Wasana resource/account-state work is preserved. Called by auth/patient and other module routes (other module workflows remain pending). Depends on users through `pool`; no provider calls.

| Function | Inputs/output/side effects | Logic and failure |
|---|---|---|
| `isAuthenticated` | req.session.user.id -> next or JSON; may destroy session | Missing ID ->401; SELECT active/role/approval; stale role -> remove identity/destroy/401; deleted/inactive/rejected/non-approved professional ->403; otherwise next. DB error ->500. It does not validate `is_verified` or refresh role-linked profile IDs. |
| `authorize` | allowed role strings -> middleware | Returned handler requires identity (401), then exact role membership (403), otherwise next. Uses session role only after fresh admission. |
| `authorizeOwnProfile` | optional paramName (`id`) -> middleware | Returned handler requires both requested ID and session profile ID, compares their string representations; mismatch/missing ->403; otherwise next. Does not grant access based on a matching login user ID. |

Search `Account permissions changed`, `roles.includes`, `profileId`. Exercise: add an existing role to one endpoint's allowlist after identifying object-ownership checks; do not widen `authorize` globally. Verification: account-state/role/profile fixtures passed; real stale-cookie/store invalidation remains pending.

## 6. `backend/src/middleware/patientAccess.js` — core

[Source](../../backend/src/middleware/patientAccess.js). Purpose: admit a specific patient's owner or assigned active doctor. Ownership **W**, introduction `a06b42e8ef86`; Patient maintainer Wasana. Feature: patient-resource object authorization. Called from patient routes; depends on appointment repository and therefore appointments. No consent-grant table read happens here.

Only factory **`authorizePatientResource`** exists, returning its async request handler. Options default `allowDoctor:false`, `allowPharmacist:false`. The handler reads session user, patient ID (route id/patientId or body.patientId) and appointment ID (query/body). It first admits matching patient profile; optionally admits pharmacist when explicitly enabled; for an enabled doctor, requires profile/appointment ID, loads appointment, checks matching patient/doctor and `in_progress`. Otherwise 403; repository failure 500. Its returned handler does not rewrite request data. Exact Ctrl+F terms: `authorizePatientResource`, `allowDoctor`, `appointment.status`. Exercise: add a new doctor-read route only after testing assignment, status and the downstream category filter; do not enable pharmacist bypass as a convenience.

## 7. `backend/src/utils/otp.js` — core

[Source](../../backend/src/utils/otp.js). Purpose: produce short-lived numeric verification codes. Ownership **A**, introduction `cce29c2aee5f`. Used by auth and consent services; no table/provider access in the utility itself.

**`generateOtp()`** -> string: request cryptographic integer in [100000,1000000), stringify it; no leading-zero variant under this existing contract. Random-source failure propagates. **`getOtpExpiry(minutes=10)`** -> Date: obtain current time, add minutes, return deadline. It does not itself enforce expiry or validate provider delivery. Search these names. Exercise: change a workflow's lifetime at its caller and test exact boundary/invalid timestamps; do not assume every caller wants the same lifetime. Mocked deterministic generation/expiry was executed; actual email delivery was not.

## 8. `backend/app.js` — session/CORS/assembly review

[Source](../../backend/app.js). Purpose: configure Express middleware/session storage and mount the module routers. Ownership **W**, introduction `46dce59110ab`, with later auth/integration contributions. **Partial whole-file completion:** session/CORS and all local callbacks were inspected; importing/mounting a router does not complete that module's review. Full-system audit logging, clinical routes and deployment behavior remain pending.

| Local callback / Ctrl+F | Responsibility and steps |
|---|---|
| `origin: (origin, callback)` | Read origin string or absence; allow no-Origin/native requests or exact allowlist member; otherwise callback with error. Inputs configured with split/trim/drop-empty (`origin => origin.trim()` is the parser's one string-normalization callback). No resource permissions are granted. |
| `app.get('/')` | Read request; return process-liveness JSON. No DB query; no login required. |
| `app.get('/api/health')` | Return success/status/message envelope; no DB/schema/provider check. Health response cannot prove readiness. |
| `app.use((err, req, res, next)` | Log escaped error and return generic 500; `next` supplies Express error-handler arity. Current logger receives the raw error; global log redaction is not completed here. |

Initialization reads synthetic-or-runtime env via dotenv, loads routers, installs helmet/morgan/CORS/parsers, validates secret/origins/lifetime, creates PostgreSQL session store, then mounts auth and feature routers and error handler. Session options and exact cookie flags are explained in the workflow page. The process server/listeners/reminder jobs live in `server.js`, not this file. Tests replace dotenv/config/store/router imports before evaluation; no database connection or pruning interval ran. Exercise: change session timeout using environment configuration; deployment-compatible CORS/proxy/CSRF changes need browser and infrastructure evidence.

## 9. `frontend/src/services/api.js` — core client configuration

[Source](../../frontend/src/services/api.js). Purpose: create the web Axios client and export its origin. Ownership **W**, introduction `98a9ea121e3a`. No custom functions are declared. Initialization reads `VITE_API_URL`, requires it in production, falls back to localhost in development, removes one trailing slash and calls `axios.create` with credentials/JSON headers. Exported `API_BASE_URL` is used by App session bootstrap; Stage 3A auth screens use the centralized acknowledged Axios helpers. No password/cookie is stored in this module and no request occurs at construction. Errors from requests reject to callers. Search `API_BASE_URL`, `withCredentials`. Exercise: change deployment origin in env, not each screen; verify credentialed requests/CORS in browser. Compilation/lint pass does not prove cookie acceptance.

## 10. `frontend/src/services/auth.service.js` — core client helpers

[Source](../../frontend/src/services/auth.service.js). Ownership **A**, introduction `75f59e8c1b30`, original credit retained. Stage 3A consolidates six main auth calls plus the two existing public pharmacy/laboratory application paths. `postAuth` bounds requests and requires success acknowledgement; `authErrorMessage` formats public/retry/expiry/network feedback. `login`, `register`, `verifyOtp`, `resendOtp`, `forgotPassword`, `resetPassword`, `registerPharmacy`, `registerLaboratory` are exact Ctrl+F keys. No local persistence/SQL or inbox/session guarantee. [Full function/input/output/error reference](03-authentication-ui-file-reference.md#1-shared-request-and-response-model); actual web fixture transport ran, real cookies/providers remain pending.

## 11. `frontend/src/store/authStore.js` — core UI state

[Source](../../frontend/src/store/authStore.js). Purpose: keep current public user in web memory. Ownership **W**, introduction `17f18c07d518`. The Zustand initializer (search `create((set)`) returns `user:null` and two actions. **`setUser(user)`** calls Zustand `set({user})`; **`clearUser()`** sets null. No persistence middleware, token storage or logout HTTP call is present. App hydration and layout/logout clients call these actions; the store does not enforce authorization or touch DB. Exercise: add a derived UI label without treating it as authority; persistence would require an intentional session-restoration/security decision and tests. Source/lint/build and Stage 3A synthetic browser identity/navigation inspected; real cookie/bootstrap acceptance remains pending.

## 12. `mobile/src/services/api.js` — core client configuration

[Source](../../mobile/src/services/api.js). Purpose: create the mobile Axios client. Ownership **W**, introduction `fe29b4d2807b`. No custom functions are declared. Initialization selects `EXPO_PUBLIC_API_URL` or a development-only localhost value, rejects a missing production origin, and constructs a credentialed JSON client. Unlike web it does not trim a trailing slash. Callers include auth screens, App logout and service wrappers. No cookie/session data is persisted here. Search `EXPO_PUBLIC_API_URL`, `__DEV__`, `withCredentials`. Exercise: set a device-reachable origin; verify on target runtimes. Do not infer native cookie/session persistence from these flags.

## 13. `mobile/src/services/auth.service.js` — core client helpers

[Source](../../mobile/src/services/auth.service.js). Ownership **A**, introduction `d9c11832fba4`, existing credit retained. `postAuth`, `authErrorMessage`, `login`, `register`, `verifyOtp`, `resendOtp`, `forgotPassword`, `resetPassword` now share strict acknowledgement, 15000 ms request bounds and useful public/retry feedback. The mobile UI still registers only patient/doctor; the server has more public roles. [Full function/input/output reference](03-authentication-ui-file-reference.md#1-shared-request-and-response-model). Actual source tests run with synthetic Axios/native host boundaries; native transport/cookies/devices remain NOT_RUN.

## 14. `mobile/src/store/authStore.js` — core UI state

[Source](../../mobile/src/store/authStore.js). Purpose and functions match the web memory store: initializer returns null user; **`setUser(user)`** replaces it; **`clearUser()`** clears it. Ownership **W**, with actual copy lineage: `8447c1a` reports `C100` from the web store originally introduced in `17f18c0`. The older creation candidate followed the source path; it was not evidence the mobile path already existed at that original commit. Keep Wasana credit without claiming exclusive later authorship.

Called by mobile App/login/OTP/logout. It has no startup `/me` call or persistent storage. Search `create((set)`, `setUser`, `clearUser`. Exercise: add startup hydration only as a separate designed feature with loading/network-expiry/device-cookie tests; it is not implemented in this batch.

## Access dependencies and current UI reference scope

The files below are included **in full** in the handoff ZIP so the reviewer can inspect the actual context. The backend/dependency entries remain partial Stage 2A traces; Stage 3A promoted the scoped auth screen reviews and documents them in the linked UI reference. Their unrelated functions/features are not marked reviewed, and their existing authorship remains the Stage 1 register's provisional evidence. This distinction prevents a route trace from being counted as a completed clinical/UI module.

| Exact repository-relative path | Inspected symbols and logic / caller / output |
|---|---|
| `backend/src/modules/patient/patient.routes.js` | Module route declarations: explicitly guarded QR/NIC routes, then `router.use(isAuthenticated)`, ownership guards on `/:id` routes and doctor-only consent endpoints. No custom named functions apart from limiter construction; controller logic is not reviewed wholesale. Route-order/coverage fixture passed. |
| `backend/src/modules/patient/consent.service.js` | `createServiceError` builds status errors; `resolveDoctorProfile` requires doctor/user and resolves doctor row; `validateDoctorConsultationContext` checks patient/appointment presence, both assignments and in-progress status; `getLockedCategories` loads current categories; `getConsentAccessStatus` returns scoped active-grant state. Remaining `getPatientConsentSettings`, `updatePatientConsentSettings`, `ensurePatientOwnsConsentSettings`, `requestConsentAccessOtp`, `verifyConsentAccessOtp`, `hasTemporaryCategoryAccess` were dependency-read for boundaries, not individually certified or changed. |
| `backend/src/modules/patient/consent.repository.js` | `getConsentSettings` defaults to empty locked list; `getActiveConsentAccessGrant` binds three IDs and filters expiry/revocation. Other request/grant mutation helpers remain pending transaction/concurrency review. SQL predicate check is not proof of DB filtering. |
| `backend/src/modules/patient/patient.service.js` | `getMedicalRecords`: patient existence -> load records -> owning patient return; for doctor normalize locked category strings, optionally obtain grant, hide every matched locked category not granted; grant failure remains closed. Other patients/roles depend on caller guards. All non-record features remain pending. |
| `frontend/src/App.jsx` | Partial auth bootstrap/ProtectedRoute review; store invalidation moved from render to effect. Other route/module UI remains pending. See [UI reference](03-authentication-ui-file-reference.md). |
| `mobile/App.js` | Partial auth callbacks/logout review; failure now preserves a retry path and public warning. No startup /me restoration; clinical/tab/overlay presentation remains pending. See [UI reference](03-authentication-ui-file-reference.md). |
| `frontend/src/pages/auth/RegisterPage.jsx` | Stage 3A full scoped screen source/comments/wording/viva review; bounded browser fixture checks. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `frontend/src/pages/auth/LoginPage.jsx` | Stage 3A full scoped screen source/comments/wording/viva review; bounded browser fixture checks. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `frontend/src/pages/auth/OtpVerificationPage.jsx` | Stage 3A full scoped screen source/comments/wording/viva review; bounded browser fixture checks. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `frontend/src/pages/auth/ForgotPasswordPage.jsx` | Stage 3A full scoped screen source/comments/wording/viva review; bounded browser fixture checks. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `frontend/src/pages/auth/ResetPasswordPage.jsx` | Stage 3A full scoped screen source/comments/wording/viva review; bounded browser fixture checks. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `mobile/src/screens/LoginScreen.js` | Stage 3A full scoped screen source/comments/wording/viva review; source-handler tests; native rendering/device NOT_RUN. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `mobile/src/screens/RegisterScreen.js` | Stage 3A full scoped screen source/comments/wording/viva review; source-handler tests; native rendering/device NOT_RUN. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `mobile/src/screens/OtpVerificationScreen.js` | Stage 3A full scoped screen source/comments/wording/viva review; source-handler tests; native rendering/device NOT_RUN. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `mobile/src/screens/ForgotPasswordScreen.js` | Stage 3A full scoped screen source/comments/wording/viva review; source-handler tests; native rendering/device NOT_RUN. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |
| `mobile/src/screens/ResetPasswordScreen.js` | Stage 3A full scoped screen source/comments/wording/viva review; source-handler tests; native rendering/device NOT_RUN. [Complete state/function/validation/API/navigation reference](03-authentication-ui-file-reference.md). |

Dependency paths such as `utils/email.js`, profile repository lookup functions and `appointmentRepository.getAppointmentById` define external/SQL boundaries. They were identified as callers/callees but are not newly declared complete reviews. The profile repositories and provider implementations remain outside this batch's file-completion scope.

## Maintained regression files

| Path | Purpose/functions and scope |
|---|---|
| `backend/tests/support/isolated.cjs` | New review-assistant test code. `load(file,mocks,options)` evaluates actual trusted source in a VM with exact mocked imports, deterministic Date and failing network/timer globals; `sessionRequest(user,failures)` creates controlled callback-session lifecycle; `response()` records status/JSON/cookie clearing. They do not emulate PostgreSQL/browser behavior or constitute a sandbox for hostile source. |
| `backend/tests/auth-access.test.cjs` | New review-assistant tests. `service(overrides,extra)` loads actual service with synthetic repository/hash/email/QR boundaries; `controller(overrides)` loads actual controller with synthetic profiles; named test callbacks exercise account/session/OTP/reset/patient policies and negative failures. Synthetic transaction mocks cannot prove rollback/concurrency. |
| `backend/tests/auth-resend.test.cjs` | Stage 2B `fixture` executes actual resend with mutable synthetic row/provider boundaries; ten controlled interleaving/order/provider/SQL cases. Pre-fix reproduction in stage2b evidence; no real DB proof. |
| `backend/tests/auth-limits.test.cjs` | Stage 2B `fixture` constructs installed middleware/MemoryStore; `request` executes synthetic HTTP chains; real threshold/header/clock-expiry/IPv6/failure checks. No socket listener, database or provider. |
| `backend/tests/auth-contracts.test.cjs` | New review-assistant tests. `routerFixture()` records registration order; `appFixture(production,env)` substitutes all side-effectful assembly modules; `consentFixture(...)` supplies context/grant boundaries. Named tests execute actual route declarations, SQL-call contracts, transaction helper sequencing, consent status and record filtering. They cannot prove real routing/driver/store semantics. |

`backend/package.json` adds `test:auth`; `test` now runs syntax then all four auth test files. Strict JSON receives no comment header. Tests are useful maintained deliverables, not temporary scripts to delete. Commands and source-hash evidence are in the Stage 2B report/ZIP; Stage 2A history is retained.

## Stage 2B addition: `backend/src/modules/auth/auth.limits.js` - core

[Source](../../backend/src/modules/auth/auth.limits.js). New review-assistant implementation, no original student credit claimed. Auth maintainer remains Lasitha. No database, session or provider access; called once by auth routes. `readLimitConfig(env)` selects seven positive integer settings and bounds the timer window; invalid explicit values throw at startup. `fieldKey(field)` returns a request-key callback: trimmed lowercase email or trimmed token is SHA-256 hashed; malformed/empty fields use an IPv6-aware IP fallback. Hashes are not anonymization. `createAuthLimiters(options)` uses its `make` closure to construct six independent middleware/store budgets, returning the shared email-generation pair and independent verify/reset pairs. Optional store factory enables actual-store fault injection/cleanup in tests. No store is shared across different budgets.

Ctrl+F `AUTH_EMAIL_ADDRESS_LIMIT`, `fieldKey`, `createAuthLimiters`, `passOnStoreError`. Input is environment plus parsed request/body/IP; outputs are next(), generic 429 with headers, or next(error) for generic 500. All attempts count, including success/failure; early IP rejection does not reach controller/field. Window expiry permits retry. Counters are volatile per process, not global; multi-worker, NAT and targeted-victim limits are documented in [Stage 2B](../review/STAGE2B.md). Small exercise: change one threshold in synthetic config and prove permitted/exhausted/expiry cases without sending email.

## Stage 2B app/config update - partial assembly scope

`backend/app.js` now validates `trustProxyHops` from `TRUST_PROXY_HOPS`: default 0 non-production, 1 production; non-negative safe integers only. Source and captured assembly settings plus real Express IP getter were exercised. Verified deployment paths/access restrictions, production forwarded-protocol session handling and browser cookies remain pending. `.env.example` documents these non-secret options; live configuration was not read. Existing app Wasana credit remains. Unrelated module assembly is not declared fully reviewed.

Stage 3A also fully reviews the two public professional application screens (`PharmacyRegisterPage`, `LabRegisterPage`) and adds `AuthLayout`/scoped styles; shared controls/root apps remain partial to auth consumers. Their complete function/state references are in the UI companion. Stage 3A source/UI tests and browser fixture do not replace the original backend/session/consent acceptance gaps.
