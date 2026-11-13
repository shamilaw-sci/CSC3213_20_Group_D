# Authentication UI file reference: web and mobile

Current through Stage 3A, 2026-11-13. Baseline `8c06a83`; application changes `57e6d2c` and response-safety commit `d78465b`. Use this with the [backend/session explanation](02-authentication-and-access.md), [backend file reference](02-authentication-file-reference.md), [change map](02-authentication-change-map.md) and [Stage 3A evidence](../review/STAGE3A.md). Backend rules are not duplicated here.

**SOURCE** means inspected implementation. **SOURCE TEST** means actual trusted source executed with synthetic hooks/imports/API/navigation; it is not a renderer. **BROWSER FIXTURE** means actual web React/DOM/Axios against synthetic loopback responses. **NATIVE NOT_RUN** means no emulator/device execution. **PENDING DB** and **NOT_RUN real cookies/provider/deployment** remain independent labels. Fifty-four new source checks and 89 existing backend checks pass; browser states are listed individually in the matrix. No page is certified end-to-end with a real account.

The [symbol inventory](../review/evidence/stage3a/source-symbols.json) gives exact paths, hashes, state/function/effect names and lines. A partial shared file can contain additional unrelated symbols in that inventory; listing them does not complete their review. All paths and backticked names below are Ctrl+F keys.

## 1. Shared request and response model

An auth screen holds temporary input/error/loading state. Its submit handler validates the applicable fields, sets a synchronous `inFlight.current` ref before awaiting, and calls the package's `auth.service.js`. The service posts through its existing Axios `api`, waits at most 15000 ms, and requires an envelope with `success === true`. A resolved HTTP request alone is insufficient. Failure throws to the screen; `finally` releases the ref/loading state. Refs prevent same-tick double taps before a render disables controls.

Success does not always mean authentication. Registration can mean pending email verification; a professional verification/application can mean awaiting approval; forgot-password means a generic processed request; reset means an acknowledged password update. Only an admitted login/OTP identity updates the UI auth store. The server cookie and backend account/role/object gates remain authoritative. A client timeout is not proof that the server did no work or rolled back.

### `frontend/src/services/auth.service.js` and `mobile/src/services/auth.service.js`

[Web source](../../frontend/src/services/auth.service.js) · [Mobile source](../../mobile/src/services/auth.service.js). Existing Idirisinghe S/21/389 credits remain; review additions do not claim original student authorship. These files have no UI state/effects and do not store/log credentials. The mobile and frontend packages remain separate; no cross-package runtime dependency was introduced.

| Function / Ctrl+F | Input → result | Important steps and failure behavior |
|---|---|---|
| `postAuth` | Fixed endpoint suffix/local path and payload → success envelope | Call `api.post` with `{timeout:15000}`. Reject a negative/malformed envelope even with HTTP 200, retaining `response` for useful feedback. Axios rejects HTTP/network/timeout errors. Web also accepts the fixed public professional application paths. No transaction/cookie guarantee is implemented here. |
| `authErrorMessage` | Request error and contextual fallback → public text | Use expected public response text; never show raw transport exceptions. All 5xx responses use generic wording except the exact known 502 email-submission message. Map known OTP expiry/incorrect/replaced, absent pending registration, invalid/expired/used reset-link and generic server messages into short English. For 429, read numeric positive `Retry-After` through Axios headers or a plain header object, round up seconds, otherwise advise waiting. This formats guidance; it does not count requests, implement a persistent cooldown or prove all error messages are enumeration-safe. |
| `login` | email/password → public session identity envelope | POST `/api/auth/login`. No password trimming or new-password length rule. Cookie persistence still belongs to runtime/server. |
| `register` | email/phone/password/role/profileData → pending email/expiry | POST `/api/auth/register`. This does not create an authenticated UI identity. Role/profile fields are prepared by the screen. |
| `verifyOtp` | pending email/six-digit code → user/profile/approvalPending | POST `/api/auth/verify-otp`. The screen must branch on approval rather than treating every created user as signed in. |
| `resendOtp` | pending email → replacement acknowledgement/expiry | POST `/api/auth/resend-otp`. Provider failure can occur after a code replacement; concurrent email completion order does not prove which code is currently stored. |
| `forgotPassword` | email → generic processed-request envelope | POST `/api/auth/forgot-password`. Known/unknown account and transport submission failure can share the server's generic response; UI must not infer delivery. |
| `resetPassword` | token/newPassword → update acknowledgement | POST `/api/auth/reset-password`. Confirmation is UI-only. Does not revoke sessions/other links or sign in a new identity. |
| `registerPharmacy` — web only | facility/account payload → pending application envelope | POST `/api/pharmacies/register`. Existing direct approval contract; no OTP or session is claimed. |
| `registerLaboratory` — web only | facility/account payload plus available_tests → pending application envelope | POST `/api/laboratories/register`. Same acknowledgement rule, separate existing enrollment path. |

**Viva:** Why attach the response to a negative-envelope error? So the screen can display the public reason and rate header while refusing a false success. Why not use the raw error's `message`? It may contain transport/internal details rather than useful user guidance.

## 2. `frontend/src/pages/auth/LoginPage.jsx`

[Source](../../frontend/src/pages/auth/LoginPage.jsx). Purpose: sign in any supported web role. `LoginPage` uses `AuthLayout`, shared controls, `login`, `authErrorMessage`, React Router and Zustand. Existing Idirisinghe S/21/389 credit is retained.

State: `formData` has email/password; `errors` holds field messages; `loading` controls busy/disabled states; `serverError` holds request failure. `inFlight` is the synchronous guard. `location.state.message` can show an acknowledged prior approval/completion notice. `setUser` is UI state, not a backend authorization operation. There are no effects in this screen.

| Function/callback | Logic |
|---|---|
| `LoginPage` | Render a real form with email/password autocomplete, opt-in masking control, useful alert, submit action and internal recovery/registration links. |
| `handleChange(event)` | Update the named credential, clear its field error and clear old request feedback. Password characters remain unchanged. |
| `validate()` | Require trimmed nonempty email and nonempty password. Registration's eight-character minimum is not applied to an existing sign-in password; the backend still checks credentials. This is not comprehensive address validation. |
| `handleSubmit(event)` | Prevent default; return if already pending; focus the first required error. Otherwise guard/set loading, call `login(email.trim(),password)`, require identity ID/role, set public UI identity, then replace the route by role. Catch useful public/network/rate errors; finally release loading/ref. |
| Link callbacks | Prevent in-page navigation while the request is pending. This does not claim exhaustive browser-history/window-lifecycle cancellation behavior. |

Destinations: patient `/patient/profile`; doctor `/doctor/dashboard`; admin `/admin`; pharmacist `/pharmacy/dashboard`; hospital staff `/hospital/dashboard`; lab technician `/laboratory/dashboard`; unknown role fallback `/`. These are UI destinations, not grants of access. Real server authorization is separate.

Verification: SOURCE TEST and BROWSER FIXTURE for required errors/focus, Tab/Enter, masking, pending state, acknowledgement, 429 and network recovery. Full bootstrap/cookie acceptance is pending. **Viva:** Why remove the login length check? A sign-in form should not silently reject an existing credential based on a rule for creating a new password.

## 3. `frontend/src/pages/auth/RegisterPage.jsx`

[Source](../../frontend/src/pages/auth/RegisterPage.jsx). Purpose: the existing two-step OTP registration for all five public roles. `ROLE_OPTIONS` is the displayed allowlist: patient, doctor, pharmacist, lab technician and hospital staff. It does not offer admin/emergency-staff signup. Original Idirisinghe S/21/389 credit remains.

State: `step` selects account/profile form; `formData` keeps account email/phone/password/confirmation/role and the role fields below; `errors`, `loading`, `serverError` hold feedback. `inFlight` guards the request, `formRef` identifies the active form. The `[step]` effect focuses its first input after a transition. It installs no timer. Changing role clears stale errors/request feedback; returning to step one retains entered values.

| Role | Required profile controls → `profileData` keys |
|---|---|
| Patient | fullName, nic, dateOfBirth → same keys |
| Doctor | fullName, slmcRegNumber, specialization → same keys |
| Pharmacist | pharmacyName, licenseNumber, pharmacyAddress, pharmacyPhone → name, licenseNumber, address, phone |
| Lab technician | laboratoryName, laboratoryLicenseNumber, laboratoryAddress, laboratoryPhone → name, licenseNumber, address, phone |
| Hospital staff | hospitalName, hospitalType, hospitalLocation, hospitalDepartments → name, type, location, departments |

`formData` also contains the account fields and unused role fields retained between selections. Only the selected role's profile object is sent. Confirmation is not sent.

| Function/callback / Ctrl+F | Important steps |
|---|---|
| `RegisterPage` | Render step indicator, role buttons with pressed state, separate account/profile forms and approval explanation for professionals. Uses existing shared fields/buttons. |
| `handleChange(event)` | Change one controlled field and clear its old errors/request feedback. |
| `validateStep1()` | Require email/phone, new password with eight characters, confirmation and matching passwords. Required non-secret checks reject whitespace-only values. It does not certify complete phone/email/account policy. |
| `validateStep2()` | Require only the selected profile's fields, checking trimmed nonempty values. Credential authenticity/NIC policy and DB constraints are outside this client check. The date control supplies a date-shaped value. |
| `handleNext(event)` | Prevent default, validate account fields, focus first error or clear feedback and set step 2. No API request occurs on step 1. |
| `handleSubmit(event)` | Guard duplicates; validate profile; construct the role-specific object; call `register` with trimmed account email/phone and unchanged password; require response email; navigate to `/verify-otp` carrying that email in route state. On failure preserve inputs and restore loading. |
| Role/Back/Link callbacks | Role selection changes role/error state; Back returns to account inputs; sign-in Link is blocked while pending. Password controls only change visibility. |

SOURCE TEST covers all five payload mappings. BROWSER FIXTURE inspected all role forms at 320px, account errors, step focus, Back/Continue and representative patient/professional submissions. A browser-native date control required keyboard entry because IAB's `fill` action did not commit its date; the committed value was checked. **Viva:** Why are facility fields renamed? The screen's role-specific input names map to the existing service's common `profileData.name/address/phone` contract.

## 4. `frontend/src/pages/auth/OtpVerificationPage.jsx`

[Source](../../frontend/src/pages/auth/OtpVerificationPage.jsx). Purpose: finish pending registration without confusing email verification, professional approval and a saved session. Original author remains unconfirmed; the file records Git introduction `lasitha`/`5aaea4b`, not a guessed personal author.

Inputs/context: `location.state.email` must be a string; otherwise the screen shows recoverable missing-registration links without a form. State is `otpCode`, `error`, `loading`, `resending`, `resendMessage`; `busy` combines the two request states, and one `inFlight` ref serializes them. No effects/countdown are implemented here. A fresh direct link/new tab may lack navigation state; a browser reload may retain history state, so do not claim every refresh loses it.

- `handleVerify(event)` prevents default, refuses absent email/pending request, requires exactly six digits and focuses the code error. It calls `verifyOtp`. `approvalPending:true` clears stale UI identity and navigates to sign-in with approval guidance. Otherwise an acknowledged ID/role sets public identity and goes directly to its role destination. Errors remain on the form; `finally` releases the guard/loading state.
- `handleResend()` refuses overlap/missing email, clears feedback and old code input before posting, then shows submission acknowledgement or useful failure. It releases `resending` on every outcome. No insert, password/profile write or email provider call occurs in the UI.
- The input callback keeps at most six digits and clears stale code errors. The Back link returns to registration when idle and is disabled during a request. Shared controls disable verify/resend/input together.

The helper explains expired/incorrect/replaced codes. Only a currently stored, unexpired server value can work; neither delivery order nor the client's field proves that. A 502 after resend can leave a replacement stored, and a client timeout can leave the outcome unknown. No success text guarantees inbox delivery or validity of every concurrent email.

Verification: SOURCE TEST and BROWSER FIXTURE for missing context, validation, expiry/replacement messages, shared busy state, old input clearing, 502/network recovery and patient/professional navigation. DB/code-generation/real delivery remain pending. **Viva:** Why does a patient avoid another login? The server has already acknowledged saved session creation; the UI can use that public identity. Pending professionals receive no equivalent admitted identity.

## 5. `frontend/src/pages/auth/ForgotPasswordPage.jsx`

[Source](../../frontend/src/pages/auth/ForgotPasswordPage.jsx). Existing Idirisinghe S/21/389 credit. Features: real email form, generic acknowledgement, useful request/rate errors, back-to-sign-in navigation.

State is `email`, `error`, `loading`, `submitted` plus `inFlight`. There are no effects. `handleChange(event)` clears old feedback while updating email. `handleSubmit(event)` prevents default/duplicates, requires trimmed email and focuses it on error, then calls `forgotPassword`. Only an acknowledged envelope sets `submitted`. A failure leaves a retryable form and releases loading. Required email error is associated with the input; request failures announce through `Alert` without duplicating the same message below the field.

The successful message is conditional on account existence and says the request was processed, with inbox/spam guidance. It does not assert that an address exists or an email arrived. The footer Link returns to sign-in; pending navigation is blocked. SOURCE TEST and BROWSER FIXTURE cover required association/focus, Enter, 429 and generic acknowledgement. **Viva:** Why ignore any specific success text about account existence? Recovery must preserve the server's generic public contract rather than create an enumeration clue.

## 6. `frontend/src/pages/auth/ResetPasswordPage.jsx`

[Source](../../frontend/src/pages/auth/ResetPasswordPage.jsx). Existing Idirisinghe S/21/389 credit. `useSearchParams` reads `token`; `validToken` checks exactly 64 lowercase hexadecimal characters. This is shape validation, not expiry/use validation; the backend remains authoritative.

State: `formData.newPassword/confirmPassword`, `errors`, `loading`, `serverError`, `success`, and `inFlight`. No effects. Missing/malformed token renders recovery rather than a submit form.

`handleChange` preserves password characters and clears stale feedback. `validate` requires eight characters and nonempty/matching confirmation. `handleSubmit` prevents default/duplicates, refuses an invalid token, focuses field errors, then awaits `resetPassword`. Only acknowledgement sets success and clears both passwords. Errors keep the form retryable and offer a direct `/forgot-password` link; `finally` releases busy state. On success the form disappears and sign-in remains an explicit action. Shared visibility controls never submit.

SOURCE TEST and BROWSER FIXTURE cover malformed/missing link, mismatch/focus, expired/used-token message, direct recovery href, generic 500 and acknowledged completion. Reset still does not revoke existing sessions/other links or automatically create a new session. **Viva:** Why is confirmation absent from the API body? It prevents client typing mistakes; the server independently validates token/newPassword and does not need the duplicate string.

## 7. `frontend/src/pages/pharmacy/PharmacyRegisterPage.jsx`

[Source](../../frontend/src/pages/pharmacy/PharmacyRegisterPage.jsx). Original Pamudika S/21/001 credit is preserved despite Auth's different maintainer. This public application uses the existing direct pharmacy API, **not** the main OTP registration flow. Its module card/layout is retained.

State: `loading`, `success`, `error`, `inFlight`; React Hook Form owns field values/errors. Its `useForm` methods are important dependencies, not locally implemented functions:

| Symbol | Meaning here |
|---|---|
| `register` | RHF field wiring/rules, not the imported main registration service. Trims non-secret values via `setValueAs` before required checks; preserves password characters. |
| `handleSubmit(onSubmit)` | Validate and focus RHF errors before invoking the local callback. Form `noValidate` lets those associated messages own feedback. |
| `watch('password')` | Confirmation validator compares current password values. |
| `reset()` | Clear RHF values after acknowledged success, not after failure. |
| `formState.errors` | Named field messages passed to shared `Input`. |

Required fields are pharmacy name, license number, address, phone, email, password and confirmation. Existing email pattern and eight-character new-password/confirmation rules remain. `onSubmit(data)` serializes rapid submits, maps only six account/facility fields to `registerPharmacy`, and shows pending approval only after strict acknowledgement. It catches useful public/rate/network failure, releases busy state and preserves a retry path. `fieldset disabled={loading}` disables the whole form; shared input refs/error IDs work with actual RHF. Back to sign-in is a real keyboard link; success uses an acknowledged pending-approval card, not a session/OTP claim.

SOURCE TEST checks callback/API acknowledgement and duplicates with RHF validation mocked. BROWSER FIXTURE executes real RHF: seven required errors/focus, Enter, negative HTTP-200 rejection, disabled fields, narrow layout and pending approval. **Viva:** Does `success` mean the pharmacy can dispense? No. It means the application endpoint acknowledged it; admin approval and backend permissions remain required.

## 8. `frontend/src/pages/laboratory/LabRegisterPage.jsx`

[Source](../../frontend/src/pages/laboratory/LabRegisterPage.jsx). Original personal authorship remains unconfirmed; introduction `71cdfdd` uses Git identity S/21/001. Do not replace it with current Lab maintainer Wasana or certify a sole author from Git alone.

`INITIAL_FORM` contains name, license_number, address, phone, email, password and confirmPassword. `AVAILABLE_TESTS` is the existing 14-label facility catalogue; choosing a label is not a clinical order or proof the facility is approved. State is `form`, `selectedTests`, `fieldErrors`, `submitError`, `isSubmitting`, `isComplete`; `inFlight` is the synchronous guard. There are no effects.

| Function/callback | Steps and limits |
|---|---|
| `LabRegisterPage` | Keep the module hero/cards, facility fields, credential section and diagnostic checklist. Badges now describe review/details rather than claiming contact/admin verification already happened. |
| `handleChange(event)` | Functionally update one input/textarea, clear its field error and old submit error. |
| `toggleTest(test)` | Add once or filter out that label. Checkbox labels provide names/click targets; Space toggles the native checkbox. |
| `validate()` | Require facility fields; retain existing phone/email patterns; require eight-character password and matching confirmation. Store field errors, focus first failure, return boolean. These checks do not validate a real license/facility. |
| `handleSubmit(event)` | Prevent default/duplicates; validate; send trimmed non-secret facility/account strings plus `available_tests` to `registerLaboratory`; only acknowledgement sets completion and resets form. Failure preserves values and restores editing. |
| Return/Cancel callbacks | Navigate to sign-in; disabled while pending. They do not authenticate or cancel server-side work. |

The address textarea has explicit label, required/invalid state and `address-error` description. A disabled fieldset covers inputs, masking controls and catalogue while pending. SOURCE TEST checks confirmation/selection/payload/acknowledgement. BROWSER FIXTURE checks desktop/narrow layout, seven required errors/focus, textarea association, mismatch, Space selection, rate guidance and pending approval. **Viva:** What distinguishes `fieldErrors` from `submitError`? The first belongs to individual controls; the second describes an API/request outcome.

## 9. `mobile/src/screens/LoginScreen.js`

[Source](../../mobile/src/screens/LoginScreen.js). Existing Idirisinghe S/21/389 credit. `LoginScreen({onLoginSuccess,onForgotPassword,onRegister})` renders the existing navy hero/teal card with keyboard avoidance and scrolling. State is `email`, `password`, `showPassword`, `loading`, `error`; refs are `passwordInputRef` and `inFlight`. No effects.

`validate()` requires email/password without imposing a new-password length rule on sign-in. `handleLogin()` guards rapid taps, calls `login(email.trim(),password)`, requires acknowledged identity ID/role and calls `onLoginSuccess`. Failure uses the shared public/network/rate formatter; `finally` restores controls. Input callbacks update one value and clear errors. Email's Next key focuses the password ref; password's Done submits. The visibility callback changes masking only. Forgot/create-account callbacks delegate navigation to the parent and are disabled while pending.

`COLORS`/`styles` retain navy, white and teal, deepen action/error/muted text, enlarge small text and the 44-unit eye target. Corrected footer text avoids an unsupported security assurance and broken characters. Accessibility labels/roles/busy-related disabled state are source features, not proof of TalkBack/VoiceOver behavior. SOURCE TEST passes; **NATIVE NOT_RUN**. **Viva:** Does the callback save a native login permanently? No; the parent sets volatile UI state, and native cookie persistence is a separate unverified runtime concern.

## 10. `mobile/src/screens/RegisterScreen.js`

[Source](../../mobile/src/screens/RegisterScreen.js). Existing Idirisinghe S/21/389 credit. Only patient and doctor registration are supported on mobile; staff facility forms remain web workflows. Props are `onRegisterSuccess` and `onBackToLogin`.

State: `role`, `email`, `phone`, `password`, `confirmPassword`, `showPassword`, `showConfirmPassword`, `fullName`, `nic`, `dateOfBirth`, `slmcRegNumber`, `specialization`, `loading`, `error`; `inFlight` guards the request. No effects.

`validate()` checks trimmed required account/full-name values, new-password length/confirmation, and the selected role fields. Patient date must be a four-digit-year ISO-shaped date with finite Date value and matching ISO round trip; impossible dates such as February 31 are rejected. It does not define an agreed age/future-date/NIC/credential policy or prove DB type compatibility. Doctor requires SLMC registration and specialization.

`handleRegister()` serializes, builds patient or doctor `profileData`, trims existing non-secret fields, preserves password characters, calls `register`, and sends only acknowledged pending email to `onRegisterSuccess`. No user/session identity is set. On failure show useful feedback and restore editing. Role callbacks select role/clear old errors; input callbacks update/clear feedback; masking callbacks change visibility. The final confirmation Done key submits; role/back/actions and inputs are disabled during the request. Footer explains doctor approval separately from email verification.

SOURCE TEST covers both payloads and impossible date rejection; **NATIVE NOT_RUN** for layout, date keyboard, focus and host Date behavior. **Viva:** Why does the success callback receive email rather than a logged-in user? Registration has only created pending verification data.

## 11. `mobile/src/screens/OtpVerificationScreen.js`

[Source](../../mobile/src/screens/OtpVerificationScreen.js). Existing Idirisinghe S/21/389 credit. Props: pending `email`, `onVerifySuccess`, `onBackToRegister`. State: `otpCode`, `loading`, `error`, `resending`, `resendCooldown`, `resendMessage`; refs `otpInputRef`, `inFlight`; derived `verifyDisabled` and `resendDisabled` keep displayed/a11y/action states aligned.

Effects: mount schedules focus after 350 ms and cancels that timer on unmount. The `[resendCooldown]` effect installs a one-second interval while positive, decrements toward zero and cleans up each interval. After successful resend, a separate 150 ms one-shot refocus checks the optional input ref. These UX timers do not enforce backend OTP validity.

| Function/callback | Important steps |
|---|---|
| `validate()` | Require pending context and exactly six digits. Missing context has a centered recovery card without actionable OTP inputs. |
| `handleOtpChange(text)` | Strip nondigits, keep at most six, clear stale errors. |
| `handleVerify()` | Refuse overlap, validate, clear old feedback, call `verifyOtp`. Pending professionals get an approval alert and parent callback; an approved response must contain public user ID/role before the parent can admit it. Catch useful errors and release busy state. |
| `handleResend()` | Refuse overlap/missing email/positive advisory cooldown; clear old code and feedback before posting. On acknowledgement show submission wording, set 30-second local cooldown and refocus. Failure can still mean server replacement occurred; show guidance and restore controls. |
| Back callback | Return to registration when idle. Long email text can wrap within the badge. |

Only the server checks code expiry/current value and actual request limits. A local countdown reaching zero is not permission to bypass a 429 window. SOURCE TEST covers missing context, competing actions and approved/pending parent logic. Timer appearance, native focus/autofill/alerts/screen readers and actual cookies are **NATIVE NOT_RUN**. **Viva:** Why clear input before even a failed resend? The server may have replaced the code before email submission fails, so the old entry is no longer reliable.

## 12. `mobile/src/screens/ForgotPasswordScreen.js`

[Source](../../mobile/src/screens/ForgotPasswordScreen.js). Existing Idirisinghe S/21/389 credit. Props `onBackToLogin`, `onResetPassword`; state `email`, `loading`, `error`, `submitted`; ref `inFlight`; no effects.

`validate()` requires trimmed email. `handleSubmit()` guards, validates, calls the acknowledged recovery wrapper and sets `submitted` only on success. A negative envelope/rate/network failure stays a retryable error and releases loading. The input callback clears old feedback; Done submits; Back delegates to the parent when idle. The success card stays generic and its “Use a reset link” callback changes screens only. It does not retrieve a token or confirm email delivery. Existing keyboard-aware navy/teal layout and semantic feedback remain, with readable text/labels.

SOURCE TEST verifies rejection/restore behavior; native rendering and screen readers are **NOT_RUN**. **Viva:** Why provide a manual reset-link screen? The current app has no configured automatic reset deep-link import; the email's web link can be completed on web or pasted into the native reset form.

## 13. `mobile/src/screens/ResetPasswordScreen.js`

[Source](../../mobile/src/screens/ResetPasswordScreen.js). Existing Idirisinghe S/21/389 credit. Prop `onBackToLogin`; state `showPassword`, `showConfirmation`, `resetLink`, `newPassword`, `confirmPassword`, `loading`, `error`, `success`; ref `inFlight`. No effects.

`RESET_TOKEN_PATTERN` requires 64 lowercase hexadecimal characters. `extractToken(value)` trims the pasted value, accepts a matching raw token or parses an HTTP(S) URL's token query, validates the same pattern and returns empty on failure. It does not visit the pasted URL; requests still use the configured Care4U API. Other schemes/invalid tokens are refused.

`handleReset()` checks token, eight-character new password and matching confirmation before posting. It serializes, awaits strict acknowledgement, then clears link/passwords and shows completion. Failure maps public/rate/network messages and preserves retry inputs. Change callbacks clear stale errors; masking callbacks only toggle display; Done on confirmation submits; Back/controls respect busy state. Success does not sign in a new identity or revoke existing sessions/other links.

SOURCE TEST covers raw token/HTTP link, malformed scheme/token, negative envelope and acknowledged clearing. Its URL/Date globals are Node test substitutes, not proof of device host implementations. **NATIVE NOT_RUN** for layout, keyboard and real cookie/reset behavior. **Viva:** Does accepting an arbitrary HTTP(S) link send a request to that host? No. Only a matching token is extracted locally and posted to the fixed API.

## 14. Shared controls, layout, styles and state

| Source / exact symbol | Features, logic and scope |
|---|---|
| [AuthLayout.jsx](../../frontend/src/components/auth/AuthLayout.jsx), `AuthLayout` | New review-assistant component. `title`, optional `description`, `children` → main landmark, existing Card, shared branding/footer, responsive max-width. No state/effects/API/navigation. Used by the five main auth screens; professional application layouts remain distinct. |
| [auth.css](../../frontend/src/components/auth/auth.css), `.auth-page`, `.auth-controls` | New review-assistant auth-only rules: deeper teal/semantic/muted tones, focus, wrapping, 44px controls and 16px narrow text inputs. Public application controls use their existing deep module brand tones. Checkbox boxes keep their own size inside full label targets. No unrelated portal selector/theme is replaced. |
| [Input.jsx](../../frontend/src/components/common/Input.jsx), `Input` | Existing Wasana S/21/081 credit. Props include id/label/name/type/value/onChange/error/required/disabled, optional `revealPassword`, className and remaining DOM props/ref. ID preference is explicit id, name, generated `useId`; error ID links field text; external descriptions are combined. `visible` is the only local state; visibility button is `type=button`, named/pressed and disabled with the input. Required now reaches the actual DOM input. Auth-consumer review only; broader forms need their own regression acceptance. |
| [Button.jsx](../../frontend/src/components/common/Button.jsx), `Button` | Existing Wasana credit. Select variant/size classes, combine `disabled || loading`, expose busy state and decorative spinner, call the caller's click/submit behavior. Default type is button; auth forms explicitly choose submit. No effects/state/API. Other consumer layouts are not certified. |
| [Alert.jsx](../../frontend/src/components/common/Alert.jsx), `Alert` | Existing Wasana credit. Empty message returns null; otherwise select semantic style/icon, pair text with a decorative icon and announce error as alert, other feedback as status. No state/effect. Screen-reader execution remains pending. |
| [Card.jsx](../../frontend/src/components/common/Card.jsx), `Card` | Existing Wasana credit. `title`, children, number, icon, className control optional feature/heading and shared padding/accent/content. No state/effects/API. Auth's child-only cards and public application cards were inspected; all module consumers/features are not marked complete. Stage 3A change here is comment-only. |
| [index.css](../../frontend/src/index.css) | Partial read of auth/root semantic tokens, typography and module themes; no edits. External font loading was blocked in the fixture, so fallback-font layout was checked. Other module styles remain outside this review. |
| [web api.js](../../frontend/src/services/api.js) | `configuredApiUrl` requires VITE_API_URL in production, falls back locally outside production and trims trailing slash. Axios requests browser-managed credentials/JSON. No token store or global session redesign. |
| [mobile api.js](../../mobile/src/services/api.js) | EXPO_PUBLIC_API_URL required for production; localhost fallback only in development. Existing Axios credentials/JSON configuration remains. Native cookie behavior is not proved by `withCredentials`. |
| [web store](../../frontend/src/store/authStore.js), [mobile store](../../mobile/src/store/authStore.js), `useAuthStore`, `setUser`, `clearUser` | Existing Wasana credit. `create(set)` initializes volatile `user:null`; actions replace/clear UI identity only. No effects/persistent storage, cookie destruction or backend authorization. Source contract retained; native restoration remains absent. |

**Viva:** Why scope colors to auth rather than change `--primary` globally? Other portals intentionally have their own themes. Why is a visibility toggle a button rather than a link? It changes local masking and must not submit or navigate.

## 15. Root-app authentication dependencies — explicitly partial

[frontend/src/App.jsx](../../frontend/src/App.jsx): `ProtectedRoute` reads UI identity and allowed roles; absent identity returns sign-in. `roleMismatch` now triggers `clearUser` in an effect rather than during render, preserving the existing denial rule without a render-time store update. The guard remains UI navigation, not backend authorization. `App` holds `isInitializing`; its startup effect defines `checkSession`, fetches credentialed `/api/auth/me`, sets acknowledged public identity or clears on denial/network failure, then ends initialization in `finally`. Auth URL mounts include the five main pages plus the two public professional applications. Other route destinations/modules remain pending full review. The focused fixture mounts auth routes directly, so it does not certify real App bootstrap or cross-origin session restoration.

[mobile/App.js](../../mobile/App.js): Auth-relevant state is `authScreen`, `pendingEmail`; existing `activeTab`, `overlayScreen`, `bookingParams` are reset on acknowledged login/logout. `logoutInFlight` prevents duplicate logout calls. Registration callback stores pending email and selects OTP. OTP callback returns pending professionals to login without `setUser`; an admitted public identity selects home. Login callback sets public identity/home and clears overlays. Parent screen callbacks select login/register/forgot/reset without persistent navigation/session storage.

`handleLogout` posts with a 15000 ms bound and requires `success:true`. It clears identity and resets navigation only after acknowledgement; failure alerts that the session may still be active and retains a retry path; `finally` releases the ref. If the server logged out but its response was lost, UI identity can still be stale: backend denial remains authoritative and logout can be retried. This is truthful UI acknowledgement, not a new server revocation policy.

`MobileHeader` is the caller boundary for logout; its remaining presentation, `PatientTabBar`, `manualNavigate`, `closeOverlay` and clinical overlays are named here for navigation only, not declared fully reviewed. Mobile still has no startup `/me` restoration. Patient/doctor views and existing web guidance for other roles remain. Existing Wasana source credit is retained for both root apps.

**Viva:** Why retain UI state when logout fails? Clearing it would imply confirmed sign-out without a server acknowledgement. Does retaining it authorize API access? No; the server can already have destroyed or denied that session.

## 16. Backend registration traces — contract context only

The main six auth endpoints still follow the [existing backend reference](02-authentication-file-reference.md). The main auth backend is unchanged in Stage 3A; two direct registration controllers receive the limited public-error fix described below. Main OTP registration, approval, sessions, request limits and reset policies remain as documented in Stages 2A/2B.

For direct professional applications, the scoped source files are `backend/src/modules/pharmacy/pharmacy.routes.js`, `.controller.js`, `.service.js` and the corresponding three `laboratory` files. Exact symbols: `registerPharmacyController`, `registerPharmacy`, `registerLaboratoryController`, `registerLaboratory`. Routes are public; controllers map facility/account fields and return pending-approval envelopes; services check existing license/email, hash password, insert a pending professional user and create the linked profile through the repository. They do not run main auth OTP verification and currently set user `is_verified=true` in this path. Admin approval remains a separate access gate. The two registration controller catch blocks retain expected 4xx business messages but replace unexpected 5xx text with a generic retry response; the existing raw console logging is still a privacy follow-up. Focused tests invoke the real controllers with synthetic service failures and do not execute SQL.

These routes do not install the Stage 2B auth-router request budgets, and the inspected direct service writes do not establish a shared transaction for all creation steps. Unifying enrollment/verification/limits/atomicity requires a separate agreed backend/schema batch. No policy was silently changed. Only registration functions/response contracts were traced; all other module functions remain outside file-completion scope. Git credits in those existing files remain unchanged.

## 17. Maintained tests, fixtures and configuration

| File / symbols | What to explain and what it does not prove |
|---|---|
| `frontend/tests/auth-ui.test.cjs`: `service`, `web`, `mobile`, `legacy`, `appImports` | Build synthetic API/navigation/root dependencies and execute actual source handlers. Named tests document the 56 cases, including all role mappings. RHF is mocked for callback tests and exercised for real in the browser. No DB/provider call or native render. |
| `frontend/tests/support/source-ui.cjs`: `load`, `screen` | `load` transforms trusted JSX/modules using installed mobile Babel packages and denies unlisted imports before VM evaluation. `screen` supplies synthetic state/refs/JSX nodes, explicit effects and event inspection. Hook state scheduling/native UI are not React runtime emulation or a security sandbox for hostile code. |
| `frontend/tests/auth-fixture.jsx`: `Fixture`, `selectScenario` | Real React/Router auth components with a clearly labelled synthetic toolbar, API scenario selection, delayed-response release and synthetic destination route. `scenario`, `ready` and public `user` support tests only. It is not a production product entry. |
| `frontend/tests/auth-fixture.html` | Minimal test HTML root/viewport/module entry; no live backend/config. |
| `frontend/tests/serve-auth-fixture.mjs`: `json`, server callback | Vite config/env/public loading disabled, build output kept in memory, loopback-only server. Synthetic response modes include success, approval, rate/network/provider/server/negative-envelope, expired/replaced code/token and held response. No database/email/server import or app-record persistence. Strict synthetic email suffix prevents accidental non-fixture addresses. |
| `frontend/package.json` | Adds `test:auth`. JSON has no comment header. Direct Node command was executed; npm invocation itself is not claimed. Test harness prerequisites include existing frontend and mobile dependency trees. |
| `frontend/vite.config.js`, `frontend/eslint.config.js`, `mobile/package.json` | Existing React/Tailwind/lint/runtime dependency metadata inspected. No dependency or build-tool redesign. Clean install, CI and native build acceptance remain unperformed. |

Run from repository root: `node --test frontend/tests/auth-ui.test.cjs`. From frontend, the maintained script resolves `node --test tests/auth-ui.test.cjs`. For the browser fixture, run `node frontend/tests/serve-auth-fixture.mjs`, open the printed loopback URL and use only synthetic `@example.test` addresses. Do not load live `.env` or substitute production services. Tests, exact results, source hashes and 30 JPEGs are in the Stage 3A handoff; dependencies/build output are excluded.

## Common viva changes and remaining evidence

Use the existing [change map](02-authentication-change-map.md) for exact requested-change rows: label/copy location, required-role field mapping, password rules, API error/retry text, visibility, patient/professional navigation, module theme/control sizing, timers, reset links and logout failure. Backend policy changes remain in the backend guide rather than being presented as UI edits.

Short implementation-specific answers:

- **Why both loading and a ref?** Loading renders feedback; the ref synchronously rejects a second event before the next render.
- **Can a submitted email arrive with a superseded code?** Yes. Other requests can replace the stored code, and submission/completion order need not match delivery.
- **Does 30 seconds make resend valid?** No. It is local UX; server budgets and current OTP expiry still decide.
- **Does a timeout prove failure/rollback?** No. Server work may have completed after the client stopped waiting.
- **Did these browser tests prove cookies?** No. They use real UI/HTTP with synthetic success bodies and destinations, not real session persistence.
- **Why keep two professional enrollment paths?** They already exist; silently changing verification/approval policy would exceed this UI batch. Their differences and missing equivalent budgets are open findings.
- **Were native accessibility and layouts tested?** No. Source props/handlers and parsing were checked, but `adb` failed initialization; device/emulator/TalkBack/VoiceOver remain NOT_RUN.
- **What still needs team/environment input?** Working native runtime, verified sanitized schema/disposable PG and deployment-cookie/proxy evidence, plus decisions on the unresolved enrollment/recovery/legacy/profile policies.

The stage stops for independent review. Browser fixture evidence does not complete unrelated UI/module reviews or resolve inherited DB/privacy findings.
