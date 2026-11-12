# Authentication, sessions and patient access

Current through Stage 2B, 2026-11-12. Stage 2B baseline: `f14aee0c86178b5b14e99d367c5830203efcdd31`; application fix/tests: `0cd2abb`. See [Stage 2B report](../review/STAGE2B.md) for limits, evidence and schema prerequisites. Stage 2A sample history: Baseline: `245887bcd41b091a5375a79d7932c98c89c2f5ae`. Behavioral fixes: `150fec1`; test commands: `8c7908b`; separate source comments: `438c8a1`. Read the [file-by-file reference](02-authentication-file-reference.md), [change map](02-authentication-change-map.md) and [Stage 2A report](../review/STAGE2A.md) together.

**Evidence labels:** **SOURCE** means inspected implementation. **ISOLATED** means actual source executed with synthetic mocks. **MIDDLEWARE** means installed rate-limit/MemoryStore or Express IP-resolution code executed with synthetic requests/time, without a listening API. **PENDING DB** means PostgreSQL behavior has not been tested. **NOT_RUN** applies to browser/device/visual/provider delivery checks. None of these notes certifies production behavior.

## Terms to explain first

A **server-side session** is a record stored by the API for a signed-in client. The client carries a **cookie**, a small value sent with applicable HTTP requests. Care4U's default session cookie is `connect.sid`; it identifies a session rather than containing the patient's medical record. Express verifies the signed session identifier using `SESSION_SECRET`, and `connect-pg-simple` uses the PostgreSQL `session` table to store session data. Actual cookie signing and store persistence are library behavior; our assembly/lifecycle checks use substitutes and do not test that implementation against PostgreSQL.

Care4U does not use JWT authentication. The session's public `user` object contains `id`, `email`, `role`, `profile_id` and `full_name`. The controller builds this limited object; the password hash is not placed in the session response. A **profile ID** identifies the role's domain row, while a **user ID** identifies the login account. Confusing them can break ownership checks.

**Authentication** asks whether the client has an admitted session/account. **Role authorization** asks whether the admitted role can use this endpoint. **Resource ownership/assignment** asks whether this particular patient/profile/appointment belongs to that admitted person. **Consent** adds a category restriction to an otherwise allowed doctor's record access. Passing one layer does not imply passing the later layers.

## Server and clients

[backend/app.js](../../backend/app.js) installs JSON parsing, the session middleware and route groups. `saveUninitialized:false` avoids automatically storing every untouched anonymous session; `resave:false` avoids unconditional rewrites. The store receives `tableName:'session'` and a 15-minute pruning interval. The cookie lasts one day by default; `SESSION_MAX_AGE_MS` must now be a positive safe integer. Missing secret, missing production origin configuration or an invalid lifetime aborts startup. This startup configuration was exercised with a fake store and synthetic values; no pruning job ran.

Production uses `HttpOnly`, `Secure` and `SameSite=None`; non-production uses `HttpOnly`, non-secure and `SameSite=Lax`. `HttpOnly` prevents ordinary client JavaScript from reading the cookie. `Secure` asks browsers to send it over HTTPS. `SameSite=None` supports cross-site requests, subject to browser privacy/cookie rules. `TRUST_PROXY_HOPS` selects a non-negative integer hop count: default 0 outside production and 1 in production. Session proxy flag still follows production mode. Direct development ignores forwarded IPs; production needs verified fixed proxy paths and restricted direct access. Numeric hop trust alone does not identify trusted proxies. These settings need deployed/browser verification; configured attributes alone do not prove a browser accepted or returned a cookie.

CORS allows exact configured origins and origin-less clients, and enables credentials. An Origin header is a browser boundary signal, not proof of a user's identity. CORS is not a complete CSRF defense. The inherited CSRF/origin concern remains open; Stage 2A does not invent a deployment policy.

The [web API client](../../frontend/src/services/api.js) uses `VITE_API_URL` and `withCredentials:true`. Some screens and web session restoration use `fetch` directly with `credentials:'include'`. On startup, `frontend/src/App.jsx` calls `/api/auth/me` before rendering role routes, updates the Zustand store on success and clears it on failure. A `ProtectedRoute` is a navigation guard; the server is still authoritative. Its current wrong-role branch clears local state during render; this UI implementation was traced, not redesigned.

The [mobile API client](../../mobile/src/services/api.js) uses `EXPO_PUBLIC_API_URL`, a development-only localhost fallback and `withCredentials:true`. Native cookie handling depends on the runtime and was NOT_RUN. `mobile/App.js` currently has **no startup `/me` restoration**; its in-memory store starts with `user:null`. Login and patient OTP success populate it. Doctors have a profile-only fallback; other staff roles are directed to the web. Do not claim web/mobile session-restoration parity or persistent mobile login from source inspection.

Both auth stores hold volatile UI state only. `setUser` does not authenticate a request. `clearUser` does not destroy a server session or remove an HTTP-only cookie. Client login/logout/navigation behavior must be read together with the backend session lifecycle.

## Registration and verification

**Flow:** web `RegisterPage` or mobile `RegisterScreen` -> HTTP `/api/auth/register` -> `registerController` -> `register` -> `findUserByEmail`, password hashing, `upsertOtpVerification` -> `sendOtpEmail` boundary -> public response -> verification screen.

1. The controller requires nonempty string email/phone/password/role, an allowed public role, an optional object `profileData` and a password of at least eight characters. These are shape checks, not a complete email, phone, NIC or professional-credential validation system. Email lookup is exact/case-sensitive at this layer; no new case-normalization policy was imposed.
2. Public roles are `patient`, `doctor`, `pharmacist`, `lab_technician` and `hospital_staff`. Public registration cannot choose `admin` or `emergency_staff`.
3. The service rejects an existing user's email, hashes the password with bcrypt cost 12 and stores pending data in `otp_verifications`. No `users` row is created yet. Re-registering a pending email overwrites its pending values under the existing upsert behavior.
4. `generateOtp` uses Node's cryptographic `randomInt(100000,1000000)` and returns six digits. `getOtpExpiry(10)` gives a ten-minute lifetime. The code remains raw in the pending-registration table; hashing and persistent/distributed attempt controls remain open; Stage 2B adds volatile request budgets described below.
5. Email success means the helper reported submission; real delivery is untested. The controller now accurately says the code was sent **by email**, instead of implying a phone/SMS channel. A failed send leaves the pending record available for resend, but returns an error. The actual SMTP boundary was not invoked.

**Resend:** route IP/address budgets -> `resendOtpController` -> `resendOtp` -> find pending row -> `replacePendingOtp` UPDATE by observed ID + email -> email after successful update. Previously, resending upserted the old phone/hash/role/profile snapshot, which could restore older registration details or recreate a row consumed by verification. The new write changes only code/expiry and timestamp, never inserts, and returns no row if consumed/replaced by a different ID. No row means 404 and no email. Provider rejection/exception means 502, while the new code remains stored. Only the current unexpired stored value can verify; later replacements and out-of-order delivery mean an email can carry a superseded code. Random generation can also repeat a value. Pending-registration existence remains exposed through the existing useful 404. Controlled interleavings pass; actual PG concurrency remains pending.

**Verify:** verification screen -> `/api/auth/verify-otp` -> `verifyOtpController` -> `verifyOtp` -> `withTransaction` -> lock/read pending row -> compare code and expiry -> create user and matching profile -> delete pending row -> commit -> controller response/session.

The read now uses the same transaction client as creation/deletion and requests `FOR UPDATE`. Wrong/missing codes, missing rows, exact expiry and invalid expiry are denied. An expired code is not valid at its deadline. Sequential replay is denied after the pending row is consumed. The tests verify source control flow/client usage and replay at the mocked repository boundary; actual concurrent verification/resend and database uniqueness/rollback are PENDING DB.

`createUser` sets `is_verified:true` after OTP validation. This email-verification flag differs from **professional approval**: patients are `approved`; doctors/pharmacies/labs/hospitals start `pending`. Their professional profile `is_verified` values are initially false. Admin approval lives outside this reviewed implementation; its effect is consumed by the auth gates, not independently certified here.

For an approved patient, `saveAuthenticatedSession` regenerates the anonymous session ID, assigns the limited identity, and waits for `save` before returning 201. Pending professionals receive `approvalPending:true`, an account/profile response, and no authenticated `session.user`; returning their identity in JSON does not authorize them. The web shows an approval/sign-in message; mobile returns professionals to login instead of setting its auth store.

Account creation commits before session persistence. If that later persistence fails, the account/code transaction is not undone; the response is an error and the user may need to sign in after the store recovers. An OTP retry can then find no pending registration. This recovery UX remains a limitation, not a claim that the registration was rolled back.

## OTP and recovery request budgets

[auth.limits.js](../../backend/src/modules/auth/auth.limits.js) uses installed express-rate-limit MemoryStores. Default window is 15 minutes (`AUTH_RATE_WINDOW_MS=900000`). Register/resend/forgot share 20 requests per IP and 5 per email. Verify has 30 per IP and 10 per email; reset has 30 per IP and 5 per token. Setting names and exact defaults are in [Stage 2B](../review/STAGE2B.md) and `.env.example`; positive integer configuration is required.

Every reached budget counts, including malformed input, success and provider/DB failure. IP runs first; rejection never calls the field budget/controller. Email counting uses trimmed lowercase address hashes; token counting uses a trimmed case-sensitive hash. Database/body values are unchanged. Missing or malformed fields share an IP fallback; IPv6 uses /56 grouping. Exhaustion gives generic 429 plus rate headers/Retry-After; expiry admits retries if both budgets allow. A store failure reaches the generic 500 handler and stops controller work. Forgot responses remain generic for known/unknown accounts.

These limits are per-process and volatile: restart clears counters and different workers do not share them. Distributed requests can bypass a single process's IP budget; targeted account budgets and shared NATs can inconvenience legitimate users. They are not persistent OTP failed-guess counters, a global email quota or a complete memory-capacity/abuse defense. Actual middleware execution tests cover thresholds, expiry and failures; deployed proxy topology, distributed operation and browser feedback remain unverified.

## Login, lockout and session creation

**Flow:** `LoginPage.handleSubmit` (`fetch`) or `LoginScreen.handleLogin` (Axios) -> `/api/auth/login` -> IP limiter -> `loginController` -> `login` -> user repository/bcrypt -> role-specific profile lookup -> regenerate/save session -> public identity -> web role redirect or mobile store update.

1. The existing IP limiter admits ten login requests per 15 minutes per IP. Actual middleware rate accounting, reverse-proxy correctness and multi-instance storage were not exercised by the route-order test.
2. Unknown email gives a generic invalid-credentials error. An active account lockout is checked before password comparison. Otherwise the password is checked before exposing inactive/rejected/pending-account details, fixing an unnecessary account-state disclosure.
3. Wrong password increments `failed_login_attempts`. At five or more failures, the SQL sets `locked_until` 15 minutes ahead. Correct credentials for an eligible account clear attempts and lockout. A past lock deadline allows another comparison; the accumulated count is not automatically reset on expiry, so another failed attempt can lock it again. That behavior was not changed by guessing a new lockout-window rule.
4. Inactive and rejected users are denied. Non-patients must be `approved`. Patient `pending`/missing verification-state and legacy `is_verified:false` semantics are not expanded here: current gates explicitly deny rejected patients but do not add a universal new verified-flag condition. The team must settle legacy/assisted-account requirements before a policy change.
5. The controller resolves patient/doctor/pharmacy/lab/hospital profile IDs with their repository functions. Admin has no domain-profile lookup in this controller. A missing linked profile currently yields `profile_id:null`; downstream ownership guards deny profile access. Whether login itself must reject such accounts is an unresolved policy.
6. Successful login rotates the session ID before storing authenticated identity and waits for store acknowledgement. Regeneration/save failure cannot return success; the in-memory identity is removed and destruction is attempted. No real cookie/store operation was performed by the isolated doubles.

The usual JSON envelope stays `{success,message,data}`. Status meanings remain distinct: 400 validation, 401 bad/absent credentials, 403 restricted account/role/resource, 429 lockout/rate limit, 500 unexpected repository/session failure. Pending/no-row OTP and provider-submission errors retain their existing 404/502 distinctions. Raw auth error objects were replaced in controller logs by error names/codes to reduce exposure of SQL/provider details.

## Session restoration and stale access

`GET /api/auth/me` runs `isAuthenticated` before `getMeController`. Missing session/user ID returns 401 before a database query. Existing session expiry/loading is handled by session middleware/store, not by a date check in `getMeController`.

`isAuthenticated` re-reads `is_active`, `role` and `verification_status` from `users` for every admitted request. Deleted/inactive/rejected accounts and non-approved professional accounts are denied. A role differing from the session role now destroys that identity and requires sign-in with 401; it does **not** attach the new role to the old `profile_id`. This closes stale admin privileges after a role change. DB failure returns a generic 500 and does not call the next guard.

The middleware does not refresh every profile/name/email field, enforce password-reset session revocation, or replace all account-policy checks. Changing profile links without changing role may leave a stale session profile; that scenario is pending a defined administrative-linking policy. Session destruction errors can prevent store deletion, but the fresh account/role gate still denies each subsequent request while the restriction exists.

## Roles, patient ownership and consent

`authorize(...roles)` compares the admitted session role to the endpoint's allowlist, returning 401 if no identity and 403 for the wrong role. It must follow `isAuthenticated`. `authorizeOwnProfile(paramName)` compares the requested profile parameter with the session's `profile_id`; it does not query the database or grant clinical consent.

`authorizePatientResource({allowDoctor,allowPharmacist})` handles patient-scoped access:

- A patient must match `session.user.profile_id` to the requested patient ID.
- A doctor needs explicit `allowDoctor:true`, a profile ID and an `appointmentId` from query/body. The appointment must match both patient and doctor and be `in_progress`.
- The optional pharmacist branch is broad when enabled. The current patient UUID prescription route does not enable it; pharmacist QR routes use separate role/confirmation logic. That QR policy is inherited H03 and remains open.
- Other/mismatched access returns 403; appointment repository failure returns generic 500. The normal route supplies prior authentication; an isolated invocation of this patient guard without a session also fails closed with 403.

`patient.routes.js` installs `router.use(isAuthenticated)` after explicitly guarded QR/NIC routes. Resource routes then use ownership guards. Consent request/verify/status routes explicitly require doctor role and rely on consent-service assignment validation. The isolated route-order/coverage checks exercise the actual route declarations with substitutes, not HTTP routing or all controllers.

For medical records, consent is an additional filter. `patientService.getMedicalRecords` returns the owning patient's history, then for a doctor reads `locked_categories`. It identifies categories using case-insensitive text matches across record type/title/description/clinical fields; it does not use a separate formal clinical category column. A record matching several locked categories requires a grant for **every** match. No valid grant, failed grant lookup or missing consultation ID keeps matched protected records hidden. This text-classification design and `is_confidential` being informational metadata are observed behavior, not a newly invented privacy policy.

`consentService.getConsentAccessStatus` resolves the doctor by user ID, verifies patient and appointment ownership and requires an active consultation before consulting a grant. `consentRepository.getActiveConsentAccessGrant` binds patient/doctor/appointment and requires non-revoked/unexpired rows. Tests check the service assignment decisions and requested SQL predicates; actual expiry/revocation selection in PostgreSQL remains PENDING DB. Records that do not match any locked text category remain visible under the existing policy.

Only the access-status and record-filter dependencies were reviewed in those large patient/consent files. Consent OTP issue/consume/grant transaction atomicity, other patient features and the full clinical privacy model remain pending. The generic record service also relies on its callers' role/ownership guards; it is not a complete standalone authorization gateway for arbitrary callers.

## Logout and password recovery

`POST /api/auth/logout` destroys the server session before acknowledging success and clearing the default cookie. Store destruction failure returns 500. No session is handled idempotently. Web role navigation and mobile local-store clearing are client behaviors, not proof of store deletion; mobile currently clears local state in `finally` even when logout fails. No native/server-cookie end-to-end logout test ran.

Forgot-password UI -> client `forgotPassword` -> `/forgot-password` -> controller -> service -> exact account lookup -> `crypto.randomBytes(32)` -> 64-character lowercase hexadecimal token -> one-hour expiry -> `password_reset_tokens` -> email link -> generic response. Unknown accounts and email transport rejection/exception produce the same public message; DB failures still produce 500. A generic message does not prove delivery, and timing differences are not equalized. Stage 2B applies the shared email-generation IP/address budgets before forgot-password and separate IP/token budgets before reset. These do not change the token/session revocation policy.

Web reset reads `token` from the URL. Mobile accepts a pasted raw token or HTTP(S) reset link and extracts a matching token; there is no configured automatic app deep link. Both submit `token,newPassword`; UI confirmation fields are client validation, while the controller independently validates token format and password length.

`resetPassword` uses `withTransaction`: lock valid token -> bcrypt new password -> update password -> guarded token consumption -> commit. Used/expired/missing tokens are rejected; failed password writes do not proceed to consume the token. Concurrent rollback/locking guarantees remain PENDING DB. Tokens are still stored raw, other outstanding reset links remain valid, login failure counters are unchanged and existing sessions are **not revoked** by reset. Session revocation and token-invalidation policy need an explicit, compatible design; do not claim recovery signs out an attacker everywhere.

## Implementation-specific viva questions

| Question | Short answer |
|---|---|
| Where is the JWT stored? | There is no JWT flow here. Express sessions use a cookie identifier and a PostgreSQL store. |
| Is `user.id` the same as `profile_id`? | No. One is the login account; the other is its patient/doctor/facility row. |
| Does `setUser` authenticate mobile requests? | No. It updates UI memory; the API still checks the cookie-backed session. |
| Why is `/me` guarded now? | Session JSON alone could be stale. The middleware re-reads account state before returning it. |
| What changed for a demoted admin? | A role mismatch invalidates the old session and asks for sign-in; stale admin role cannot pass the next allowlist. |
| Why regenerate a session on login? | The authenticated identity must not inherit the previous anonymous identifier. The helper rotates then saves it. |
| What happens if session save fails after OTP? | No success response/session identity is retained; account creation may already have committed. The user may need ordinary sign-in. |
| Is OTP verification professional approval? | No. Email/account verification creates the account; professional approval remains a separate status gate. |
| Where does a doctor get patient access? | An endpoint opts into doctor reads, then the resource guard checks a matching in-progress appointment. |
| Does that appointment unlock all records? | No. The record service still filters locked categories unless a matching temporary consent grant exists. |
| How are categories recognized? | Current code matches category words in several record text fields. It is not a formal classification guarantee. |
| What if consent lookup fails? | Protected matched records stay hidden; the filter does not treat lookup failure as consent. |
| Why use the same transaction client? | Pool calls could run on different connections. Passing one client requests one transaction/row-lock context. Actual DB behavior still needs testing. |
| Can these mocks prove concurrent reset safety? | No. They prove control flow and query/client intent, not PostgreSQL constraints, locking or rollback. |
| Why can a locked account give 429? | Lockout is checked before bcrypt and retains a distinct failure response. That also leaves a response/timing distinction to consider. |
| Why no lowercase-email migration? | Existing exact keys and duplicate handling were not changed without a compatibility decision. |
| Does clearing the UI store log out the server? | No. The logout endpoint must successfully destroy the server session. |
| Does resetting the password revoke all sessions? | No. That is an open hardening/policy requirement, documented honestly. |
| What does `/api/health` prove? | The process handler responds. It does not query the DB or prove schema/provider readiness. |
| What was actually executed? | 89 checks: the original 67 plus resend, route/proxy and actual middleware/store checks. Also static checks and 21 separate review-tooling checks. No live DB/browser/device/provider acceptance. |

Small change exercises are proposals in the [change map](02-authentication-change-map.md), not additional changes already implemented. Explain the permission boundary and required verification before making a viva change.
