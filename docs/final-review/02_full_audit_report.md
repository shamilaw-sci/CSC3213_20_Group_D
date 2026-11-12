# Care4U Final Repository Audit

Audit date: 2026-10-03. Scope: audit only; no application source, schema, configuration, or tests changed. Finding IDs below are the sole severity-counting units; repeated mentions in later sections are not additional findings.

## Executive Summary

| Measure | Result |
|---|---:|
| Tracked files inventoried | 283 (277 after excluding four lockfiles and two tracked Vite-cache files) |
| Human-readable source/configuration/documentation files indexed and searched | 219 |
| Web page components reviewed | 43 |
| Mobile screen files reviewed | 16 (15 distinct; reset is a duplicate) |
| Backend JavaScript files checked | 75 |
| SQL migration files | 6 incremental files; no base schema or 002 migration in this checkout |
| Application behavior/security test files | 0 |
| HIGH / MEDIUM / LOW findings | 8 / 10 / 7 |

The repository is feature-rich and the web frontend builds, but it is not yet defensible as release-ready. The first fixes should close professional approval and patient-data authorization gaps, make dispensing atomic, repair mobile password reset, and correct emergency claims. The requested three project guides were absent from this checkout, so their exact header/acceptance rules could not be verified. The current README, viva guide, deployment checklist, and progress notes were used; the supplied module responsibility map was context only, not file-authorship evidence. Historical progress notes and screenshots were not treated as proof of current behavior.

### Verification performed and limits

- Backend syntax gate passed for 75 JavaScript files; direct frontend ESLint passed; direct Vite production build passed (2,187 modules, output written only under the system temporary directory).
- No application test suite, seeded database, running API, role-specific browser session, device build, or live emergency/notification integration was available. All exploit and workflow assessments are static-code findings, not successful penetration tests.
- Searches found no tracked .env file or current source-embedded secret, no obvious SQL construction from unescaped user values in reviewed query paths, and no active UI route that directly exposes the two unreferenced doctor note modals. The deployment checklist mentions a formerly embedded Telegram token; Git history was not exhaustively secret-scanned, so rotate/verify separately.
- Exact per-file classification, file-level authorship evidence, activity, and review status is in 01_repository_inventory.md. The supplied responsibility map is supporting context only. Existing plausible headers remain valid despite later integration or a different module owner; disputed co-credit needs team confirmation before any source edit.

## Critical Findings

| ID | Severity | Module and evidence | Exact problem and correction | Correction risk |
|---|---|---|---|---|
| H01 | HIGH | Auth: backend/src/modules/auth/auth.controller.js (verifyOtpController, lines 164–202); backend/src/modules/auth/auth.service.js (login, ~246); backend/src/middleware/auth.js (isAuthenticated, 16–37); mobile/App.js (~528–545) | OTP verification creates a session for every new user, including professionals whose verification_status remains pending. Login blocks pending accounts, but subsequent session middleware only checks is_active; protected professional APIs can therefore be reached with the OTP cookie. Do not authenticate pending professionals, and recheck approval on every protected request. Add role-specific regression tests. | MEDIUM: changes onboarding/session behavior. |
| H02 | HIGH | Health content: backend/src/modules/health-content/healthContent.routes.js (public GET /, 61–64); controller (getAllContentController, 87–99); repository (findAllContent, 42–65) | The unauthenticated list defaults to all rows and accepts a status query, so draft content is publicly readable. Public reads must be hard-filtered to published; admin draft listing needs an authenticated admin route. | LOW–MEDIUM: admin list contract must be preserved deliberately. |
| H03 | HIGH | Patient/pharmacy: backend/src/modules/patient/patient.routes.js (~450–455); backend/src/middleware/patientAccess.js (39–41); frontend/src/pages/pharmacy/PatientQRLookupPage.jsx | Any authenticated pharmacist passes the full patient-prescriptions endpoint for any supplied patient UUID; there is no server-side QR, patient-present, consent, or prescription relationship proof. The UI confirmation checkbox is not authorization. Require a scoped server-verified access token/relationship and audit it. | HIGH: pharmacy lookup and dispensing flows depend on the current contract. |
| H04 | HIGH | Appointment/consent: backend/src/modules/appointment/appointment.controller.js (getPatientConsultationNotesController, 350–397); appointment.repository.js (getConsultationNotesByPatientId, ~259–279); backend/src/modules/patient/patient.service.js (getMedicalRecords, 214–420) | During an active consultation, the notes endpoint returns every consultation record, including records marked confidential or matching locked categories, without applying the consent-filtering path used by medical-record access. Reuse one server-side privacy policy for this route and test locked/unlocked/granted states. | HIGH: clinical visibility rules need an explicit product decision. |
| H05 | HIGH | Prescription: backend/src/modules/prescription/prescription.service.js (dispensePrescription, ~153–315); prescription.repository.js (quantity update) | Dispensing reads quantities, validates, then performs item updates, status update, and history insert as separate statements without a transaction or row lock. Concurrent requests can overdispense; a mid-sequence failure can leave partial state. Make the operation one transaction with guarded quantity updates/idempotency, then test two concurrent pharmacists. | HIGH: medication safety and data migration/transaction semantics. |
| H06 | HIGH | Emergency: mobile/src/components/EmergencySOS.js (16, 52–109); backend/src/modules/emergency/emergency.service.js (triggerSosAlert, 14–50); backend/src/utils/sms.util.js | The shipped phone fallback is a dummy number, the tel: link opens a dialer rather than placing a call, location/API delivery can fail silently, and optional Telegram dispatch is described as SMS/notification. “Notifying hospital and emergency services” overstates what is guaranteed. Use a validated deployment number, truthful staged UI, explicit delivery result, and a tested fallback; never claim dispatch success merely from a logged alert. | HIGH: emergency UX and external integration require real-device validation. |
| H07 | HIGH | Mobile auth: mobile/src/screens/ResetPasswordScreen.js; ForgotPasswordScreen.js; mobile/App.js (~592–607); mobile/src/services/auth.service.js (~68) | ResetPasswordScreen is byte-for-byte the forgot-password request screen (including the wrong @file header); the reset route renders it without a token/new-password flow although the reset API exists. Implement the actual reset flow/deep-link contract or explicitly route reset to a supported web flow, with device tests. | MEDIUM: deep-link/session navigation contract. |
| H08 | HIGH | AI/privacy: backend/src/modules/patient/patient.controller.js (chat handler, ~712–887; logAudit ~870); backend/src/modules/patient/patient.routes.js (chat limiter); backend/src/utils/ai.util.js | AI chat sends profile, medications, conditions and allergies to a third-party model, then stores the raw patient message in a general audit record. Minimize/redact audit payloads, document patient disclosure/consent, and bound message/history size. Keep clinical disclaimers and verify provider data handling before release. | MEDIUM–HIGH: privacy policy and forensic needs must be balanced. |

## UI Consistency

Different role modules intentionally have different palettes. Findings below compare pages or interactions within a module; they are not a request to unify all modules.

| Module | Observed within-module state | Action and linked finding |
|---|---|---|
| Authentication (web/mobile) | Web OTP success uses browser alert (frontend/src/pages/auth/OtpVerificationPage.jsx:49) while adjacent auth flows use inline errors or page transitions; mobile reset is a duplicate of forgot. “Sign in”, “Log in”, and “Login” coexist. | Use one auth success/error pattern and terminology (L03); H07 is the functional blocker. |
| Patient web | Patient pages share the main shell and teal/blue family, but tables/forms/modals are locally implemented in large pages. Common Modal and DataTable lack keyboard/dialog semantics, and error association in Input is incomplete. | M09; retain patient-specific visual language while strengthening shared primitives. |
| Patient mobile | PatientHomeScreen, MedicalRecordsScreen, PrescriptionsScreen, PatientProfileScreen and App each define local COLORS maps while mobile/src/constants/theme.js has no imports. This makes same-module token drift likely; screenshots are historical and insufficient to assert pixel-level defects. | L07: consolidate only proven repeated tokens after a device comparison. |
| Doctor | Dashboard and ConsultationPage use the same doctor navigation but the latter is an exceptionally large component with local section styles; two doctor note modal files are unreferenced. Loading/error states exist, but a real viewport and keyboard pass is still needed. | L05 and M09; no speculative visual rewrite. |
| Hospital/emergency | Hospital pages use consistent emergency emphasis; the mobile SOS countdown wording asserts more than the system does. All-caps emergency emphasis is appropriate, but delivery status must be accurate. | H06; do not dilute critical warnings. |
| Pharmacy | Lookup and dispensing use QR-driven flow; an in-person consent checkbox on the lookup page is not backed by API authorization. Preserve pharmacy theme while fixing the gate. | H03. |
| Laboratory | Dashboard/request/report pages share the module navigation and report flow. URL-only upload introduces untrusted external destinations; component-level validation is not enough. | M05. |
| Admin | Admin pages share dashboard patterns, but account activation/deactivation is one click without a confirmation in AdminAccountManagementPage.jsx:113–155, while QR reissue does confirm. Alerts/prompts coexist with app toasts. | M08, L03; only confirm the consequential direction, not every toggle. |
| Shared | App.jsx:200 and main.jsx:28 both mount a toast renderer. Common Modal lacks dialog role, accessible title, focus trap/Escape/restore; DataTable click rows are not keyboard equivalent; Input errors lack robust aria binding. | L01 and M09. |

Across all modules, static inspection confirmed many explicit loading, empty and error branches, so this audit does not label them globally absent. Hover/focus, responsive overflow, contrast and touch-target quality remain **manual QA not performed**; no current rendered screenshot set was available. For any subsequent UI change, compare every page in the affected module at narrow and desktop widths rather than transferring another module's visual theme.

## Comment/Header Problems

The header search over 195 JS/JSX files found 23 without @file, 44 without @module, 4 without @desc, and 32 without @author in the opening comment region. These are field-presence counts, not 103 distinct bad files: a file can be counted several times, and short config/entrypoint files are included. mobile/src/screens/ResetPasswordScreen.js has a wrong @file because it duplicates ForgotPasswordScreen.js; mobile/src/constants/theme.js still has the placeholder “[Your Name] (S/21/XXX)”. No duplicated header block or independently verified wrong real student number was established.

The earlier claim that Pamudika's Laboratory backend headers were wrong is **withdrawn**: he created and substantially implemented those files. Wasana later made substantial changes to laboratory.routes.js and laboratory.service.js, but Pamudika's original credit remains valid. Likewise, Tharindu's original Appointment backend headers, Wasana's Doctor ConsultationPage and Pharmacy integration headers, Lasitha's mobile DoctorProfile header, and Wasana's appointment UI/service headers are supported by their file histories even where another person owns the overall module. Only frontend/src/components/common/QRScanner.jsx and frontend/src/pages/pharmacy/PharmacyDispensingHistoryPage.jsx have person-name headers directly contradicted by creation history and current blame; the mobile theme placeholder is invalid but does not name a real person. Mixed-contributor headers should be discussed with the team before adding names. Parameter/return descriptions should still be checked against current signatures in laboratory.service.js (upload/status methods) and other changed service APIs. Important comments should explain authorization, consent, conflict, partial dispensing, and payment-status rules, not trivial callback mechanics.

## AI/Temporary Comment Cleanup

| Files and locations | Problem | Safe proposed edit |
|---|---|---|
| backend/src/modules/patient/patient.service.js:6, 11, ~1740–1749; frontend/src/pages/auth/OtpVerificationPage.jsx:4 | Epic/fix history in live source comments. | Replace with current privacy/OTP behavior and searchable business terms. |
| backend/src/modules/doctor/doctor.repository.js:198; backend/src/modules/emergency/emergency.service.js:14; backend/src/utils/email.js opening comment | “UPDATED”, “Now includes”, or prior-provider history explains development chronology rather than current logic. | Document current search, Telegram/email delivery semantics; do not claim SMS when only Telegram is configured. |
| backend/src/modules/prescription/prescription.service.js:68–315; backend/src/modules/laboratory/laboratory.service.js; backend/src/modules/pharmacy/pharmacy.service.js | Long Step 1/2/3 implementation narration repeats statements and obscures actual invariants. | Retain concise comments on safety, state transitions, and failure/transaction policy after functional decisions. |
| backend/src/modules/appointment/appointment.controller.js:~1047 | Comment still calls confirmation email “simulated”; current email utility may send real mail. | State the real, configured notification/fallback behavior. |

L04 covers documentation-only source cleanup. These edits should follow, not conceal, the functional fixes; retain useful domain-rule comments and accurate student attribution. Missing @author is a documentation gap, **not permission to assign the module owner**.

## User-Facing Text Problems

| Current term | Alternate terms found | Recommended standard |
|---|---|---|
| Sign in | Log in; Login | **Sign in** for actions/headings; “sign-in” as adjective. |
| Laboratory report | Lab report; lab reports | **Lab report** in compact UI; “laboratory report” in formal explanations. |
| QR code | QR Code | **QR code** except where a proper-name title deliberately differs. |
| Break-Glass access | Break-the-Glass access; Break-Glass Protocol | **Break-Glass access** for the audited feature. |
| Verification code | OTP; OTP code | **Verification code** in user copy; OTP in technical documentation. |
| Partially filled | partially_filled | **Partially filled** in UI; raw enum stays API/internal. |

L03 includes action/feedback inconsistencies. Specific examples: web OTP uses “Account verified successfully! Please log in.” in an alert; mobile forgot-password uses a generic “request processed” response; some validation errors expose API field names such as doctorId/scheduledAt/type or patient_id/pharmacy_id. Use short user-actionable copy while preserving non-enumerating forgot-password behavior. Review clinical and AI wording with a clinician or supervisor; do not make a chatbot answer sound diagnostic. Emergency text requires the H06 correction, not mere copy polish.

## Functional/Integration Problems

| ID | Severity | Evidence and impact | Proposed correction / risk |
|---|---|---|---|
| M01 | MEDIUM | backend/src/modules/auth/auth.routes.js:38–59 rate-limits login only; auth.service.js / auth.repository.js hold OTP and reset token values without a per-code attempt cap. Online guessing/resend abuse is less constrained than login. | Add endpoint-specific throttling and attempt/expiry controls; hash one-time codes/tokens where compatible. Risk MEDIUM: email/reset usability and storage migration. |
| M02 | MEDIUM | backend/app.js:97–140 accepts URL-encoded bodies and uses SameSite=None for production session cookies, with credentialed cross-origin frontend; no CSRF token/origin gate was found for mutations. | Add a consistent CSRF/origin defense for state-changing cookie-authenticated routes and test simple-form/preflight cases. Risk MEDIUM–HIGH: cross-origin deployment behavior. This is a structural exposure, not a demonstrated exploit. |
| M03 | MEDIUM | backend/src/modules/appointment/appointment.controller.js:~950–995 validates only presence of doctorId, scheduledAt and type, then checkAppointmentConflict and INSERT are separate; no database uniqueness constraint was found in available migrations. | Enforce doctor availability/future time/type server-side and make slot uniqueness atomic. Risk MEDIUM: booking policy may need product clarification. |
| M04 | MEDIUM | backend/src/modules/laboratory/laboratory.service.js:~339–350 inserts a report then marks request completed separately; a failed second write leaves a report and a non-completed request, while retry may hit “report exists”. | Transactionally couple report creation/status or provide idempotent recovery. Risk MEDIUM. |
| M05 | MEDIUM | frontend/src/pages/laboratory/LabReportUploadPage.jsx (~36–103) accepts a HTTP(S) report URL; backend/src/modules/laboratory/laboratory.controller.js:210–222 stores report_url without equivalent validation. Patient/doctor views open it. | Server-validate scheme/host and preferably use trusted storage/signed URLs plus an external-link warning. Risk MEDIUM: existing links may need accommodation. |
| M06 | MEDIUM | backend/src/modules/admin/admin.routes.js and admin.service.js implement consequential approval/account/config mutations; no general mutation audit hook was found, while QR reissue has a specific audit call. | Audit actor, target, action, result and time for all admin mutations; avoid raw sensitive payloads. Risk LOW–MEDIUM. |
| M07 | MEDIUM | backend/src/middleware/auditLog.js (~38–64) records the event before the protected controller runs; a later denial/failure can appear as completed access. | Record outcome after response or distinguish ATTEMPT from SUCCESS. Risk MEDIUM: audit consumers and historical semantics. |
| M08 | MEDIUM | frontend/src/pages/admin/AdminAccountManagementPage.jsx:113–155 toggles account active state without confirmation; unlike QR reissue, deactivation is immediately consequential. | Confirm deactivation with identity/context and disable during submission; keep reactivation lightweight. Risk LOW. |
| M09 | MEDIUM | frontend/src/components/common/Modal.jsx, DataTable.jsx, Input.jsx: dialog focus/label/escape, clickable-row keyboard access, and error-field association are incomplete. | Improve primitives and retest every consuming module with keyboard/screen reader. Risk MEDIUM: shared UI reach. |
| M10 | MEDIUM | backend/migrations contains 001 and 003–007 but no reproducible base schema/002; there are no application tests. README/deployment docs rely on an external database state. | Supply a validated baseline migration or explicit schema artifact and automate critical-flow regression checks. Risk MEDIUM–HIGH: schema export may reveal live data if done carelessly. |

No hardcoded patient/doctor UUID bypass, unauthenticated mutation in the reviewed protected module routes, or UI control calling a clearly nonexistent route was established. Dev localhost fallbacks in API configuration are guarded/configured for development and should be exercised in deployment smoke tests, not blanket-labelled production failures. Console logging remains in source; prioritize removal/redaction of patient data and diagnostic spam, but retain safe operational error logs. Production error handlers generally return generic 500 responses. The long ConsultationPage and PatientProfileScreen warrant focused maintainability work only after release-blocking behavior is stabilized.

## Security/Privacy Problems

H01–H04 and H08 are direct privacy/authorization concerns; M01, M02, M05–M07 are defense-in-depth or audit integrity concerns. In particular, the H03 pharmacist endpoint is broader than a QR scan, and H04 bypasses an existing consent policy, so frontend hiding/checkboxes are insufficient. H08 includes two separate data destinations: an external AI provider and internal general audit logs. Test with representative sensitive records and inspect log/admin visibility. Do not place real patient data in tests or screenshots.

Password and OTP handling should be reassessed as a complete lifecycle: registration verification, resend, login lockout, reset issuance/consumption, session invalidation, and approval changes. Rejected or deactivated roles must not retain working sessions. A real CSRF test and deployment-cookie check are needed before claiming protection.

## Maintainability Problems

| ID | Severity | Evidence | Recommended scope |
|---|---|---|---|
| L01 | LOW | frontend/src/main.jsx:28 and frontend/src/App.jsx:200 mount two Toaster instances. | Retain one; smoke-test toast positioning across roles. |
| L02 | LOW | frontend/src/App.jsx has no catch-all route. | Add a role-safe not-found page/link; test deep links. |
| L03 | LOW | Auth/admin/patient/lab/emergency copy examples and terminology table above. | A controlled copy pass, not enum/API renaming. |
| L04 | LOW | Header/comment counts and history-comment examples above. | Target active files; verify credit via blame/team; keep business-rule comments. |
| L05 | LOW | old_AIChatScreen.js is a shell fragment; frontend/src/components/doctor/ConsultationNotesModal.jsx and PatientNotesModal.jsx have no references; frontend/src/App.css, starter SVGs and icons.svg appear unused. | Verify one final import/build search, then document archival/removal separately; no deletion in this audit. |
| L06 | LOW | frontend/README.md is Vite boilerplate; docs/epic_116_117_progress.md and epic_204_lockout_progress.md contain historical states; deployment checklist has unresolved items. | Mark historical docs, update current setup/release status. |
| L07 | LOW | mobile/src/constants/theme.js unused; patient mobile screens repeat local COLORS maps. | Compare rendered screens and consolidate true shared tokens incrementally. |

The code also has large single-file pages (notably frontend/src/pages/doctor/ConsultationPage.jsx and mobile/src/screens/PatientProfileScreen.js). Splitting them now is higher regression risk than value for a final viva pass. Review effect/listener cleanup in actual device/browser runs rather than declaring a leak from static size alone. No broad architectural rewrite is recommended.

## Dead/Unused/Suspicious Files

- Confirmed duplicate: mobile/src/screens/ResetPasswordScreen.js equals ForgotPasswordScreen.js by file hash and is actively rendered on the reset branch; it is not safe to delete without implementing H07.
- Unreferenced source components: frontend/src/components/doctor/ConsultationNotesModal.jsx and PatientNotesModal.jsx. They may be unfinished alternatives; do not infer they are safe to remove from the repository without team confirmation.
- old_AIChatScreen.js is not an application module and contains only a pasted shell fragment. frontend/src/App.css, Vite/React starter SVGs, and public/icons.svg have no current code references in the audited tree.
- Two tracked frontend/.vite/deps files are generated cache artifacts. Deletion/ignore-rule changes belong to a later cleanup pass, not this audit.

## Cross-Module Workflow Findings

| # | Workflow traced | Frontend → API → server/data contract | Result / mismatch |
|---:|---|---|---|
| 1 | Registration → verification → login → role redirect | Web/mobile auth screens → /api/auth/register, /verify-otp, /login, /me → auth controller/service/repository and users/profile rows. | H01: OTP session bypasses professional approval; H07: mobile reset branch is wrong; M01 covers code retry controls. Web OTP asks user to log in while the response has already established a cookie. |
| 2 | Patient profile and medical records | Patient web/mobile → /api/patients/:id and records → patient routes, patientAccess, service/repository. | Own-profile gate and doctor active-consultation path exist; H04 shows a second consultation-notes route bypasses the consent filter. |
| 3 | Patient appointment booking | BookAppointment web/mobile → /api/appointments → appointment controller/service/repository → appointments. | M03: direct API requests are not bound to displayed availability; conflict check/insert is non-atomic. |
| 4 | Doctor queue → consultation | DoctorDashboard/ConsultationPage → doctor/appointment APIs → active appointment, notes, medical records. | Role and active-appointment checks exist; H04 leaks locked consultation notes through a parallel endpoint. |
| 5 | Prescription → patient → pharmacy → dispensing | ConsultationPage → prescription API/repository → patient PrescriptionsPage/mobile → pharmacy QR lookup and dispense API. | H05: concurrent/partial dispense integrity; H03: broad pharmacist patient-prescription read; status values include partially_filled internally. |
| 6 | Lab request → lab report → doctor/patient | Doctor consultation → laboratory requests → laboratory dashboard/upload → report repository and patient/doctor readers. | M04 non-atomic completion; M05 untrusted external report URL. |
| 7 | SOS/hospital → Break-Glass → audit | Mobile EmergencySOS → /api/emergencies/sos → emergency log; HospitalEmergencyPage → Break-Glass API → emergency access/audit and email. | H06: call/notification promises exceed guarantees. Break-Glass reason/audit route exists; M07 requires outcome accuracy. |
| 8 | Consent-restricted records | Patient privacy settings and grant → patient consent service/repository → doctor record view. | Existing category filter is enforced in patient.service.js but not in appointment notes (H04); test temporary grant expiry and active appointment boundaries. |
| 9 | Hospital OPD | Hospital pages → hospital routes/service/repository → OPD queue and doctor assignment. | Route chain and role gates found; no static contract mismatch established. Real role-data smoke test still required. |
| 10 | Admin approval/oversight | Admin approval/account/health content pages → /api/admin and /api/admin/health-content → admin/content repositories. | H01 undermines pending approval, H02 publishes drafts to anonymous callers; M06–M08 concern audit/confirmation. |
| 11 | Payments | Patient PaymentHistoryPage → /api/payments → payment controller/service/repository → payment_transactions. | Explicit sandbox/self-confirmation design, with patient-ownership checks; do not present it as real payment settlement. Validate status and receipt copy in a seeded smoke test. |
| 12 | AI features | Patient web/mobile chat → patient chat route/controller → AI utility/provider; allergy/interaction features route through interaction service. | H08 raw prompt retention/provider disclosure; existing AI medical disclaimers should remain visible. Check provider limits and representative failures. |

## Recommended Changes

### A. MUST FIX BEFORE VIVA

H01–H08. Demonstrate with tests that pending/rejected professionals cannot use an OTP-created session; public article reads exclude drafts; pharmacist and doctor access respects patient scope/consent; simultaneous dispensing cannot overfill; mobile reset works or truthfully redirects; SOS wording and delivery state are accurate; and AI logs contain no raw health message. These changes require a role-seeded database and, for H06/H07, real-device checks.

### B. SHOULD FIX

M01–M10, prioritized as M02 (CSRF), M03 (booking integrity), M04 (lab transaction), M06–M07 (audit integrity), M10 (reproducible schema/tests), then M05/M08/M09. Keep server and client contract changes synchronized. The absence of the three requested project guides should be resolved before anyone claims full compliance.

### C. OPTIONAL POLISH

L01–L07, with the copy/header work scoped to active files and no mass reformatting. Any author-header change must follow the file-level evidence and team-confirmation rule below. Replace stale/boilerplate documentation only after fixes and final smoke tests establish the current truth.

### D. DO NOT CHANGE NOW / risky

Do not force all role modules into a single visual theme; split huge screens; rename API statuses; remove apparently unused components, assets or tracked cache; or rewrite all author credits during a release-blocker pass. Those changes may be valid later but carry avoidable regression or attribution risk. Do not treat historical screenshots/progress claims as current evidence.

The exact file-by-file proposed modifications, behavior-change flags, and correction risks are in 03_proposed_change_manifest.md. No fixes were applied in this pass.

## Authorship Verification Summary

The file-level register and commit evidence are in 01_repository_inventory.md. Existing @author identity was compared with file creation, meaningful feature commits, and current blame; module responsibility was not used as primary evidence. Large later UI/functional rewrites are recorded as contributions, whereas isolated fixes, styling tweaks, merges, and route imports do not transfer original credit.

- **Author headers verified as correct:** Pamudika's original-author headers on all four Laboratory backend files (controller/repository especially clear); Tharindu's Appointment backend headers; Wasana's Doctor ConsultationPage, patient appointment/prescription web pages, PharmacyLookupPage, PharmacyProfilePage, Pharmacy layout, and mobile appointment screens; Lasitha's original mobile DoctorProfile/doctor-service headers. Other named headers that agree with Git origin remain plausible, not automatically sole-author claims.
- **Author headers confirmed wrong or invalid:** frontend/src/components/common/QRScanner.jsx and frontend/src/pages/pharmacy/PharmacyDispensingHistoryPage.jsx name Pamudika although Wasana created and owns all current blamed lines; mobile/src/constants/theme.js contains “[Your Name] (S/21/XXX)”, an invalid placeholder. No real student's number was independently confirmed wrong.
- **Files with multiple substantial contributors:** Laboratory routes/service and all four Laboratory web pages (Pamudika + Wasana); Appointment controller/repository (Tharindu + Pamudika + Wasana) and routes (Tharindu + Wasana); auth controller/service/repository and middleware (Lasitha + Wasana); shared backend app/email/QR/server; doctor backend and major doctor screens; Admin feature screens (Lasitha original + Wasana substantial UI); pharmacy/prescription/payment/order implementations (Pamudika original + Wasana substantial additions), including PharmacyLookupPage where Wasana originated QR lookup and Pamudika added dispensing actions; mobile auth and prescriptions screens. The inventory names these files individually and distinguishes true implementation from small integration edits.
- **Files requiring team confirmation:** backend/migrations/007_fix_lab_request_priority_default.sql's generic team header; exact co-author lines for the multi-contributor files, notably backend/src/utils/email.js, backend/src/modules/appointment/appointment.controller.js, frontend/src/pages/laboratory/*.jsx, mobile/src/screens/PrescriptionsScreen.js, and the borderline theme-only contribution to frontend/src/components/layout/AdminLayout.jsx. Missing headers are not automatic module-owner assignments. Leave plausible source headers unchanged pending confirmation.
- **Previous audit findings withdrawn:** the “wrong owner/header” claims against Laboratory backend Pamudika headers, Appointment backend Tharindu headers, Wasana's Doctor/Pharmacy/Appointment UI and services, and Lasitha's mobile DoctorProfile/doctor-service headers. The earlier blanket attribution of Pamudika's appointment UI/services and Wasana's email utility from module/latest-commit assumptions is also withdrawn. Two genuinely contradicted headers above remain actionable.

No application source header was edited. The manifest now distinguishes confirmed corrections from team-confirmation items.
