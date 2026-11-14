# Stage 1 findings

## Patient Stage 4A update

See [STAGE4A.md](STAGE4A.md): P4-01 profile name persistence/validation, P4-02 service ownership/active context, P4-03 consent transaction/expiry/attempt guards, P4-04 acknowledged client states, P4-05 patient filters/dialog/labels/responsiveness and P4-06 expiry payload clearing have scoped source fixes and checks. Real PG/native/deployment acceptance remains pending. Open: clinical text classification/confidential flag policy, patient-initiated/lock-change revocation, rolling consent request budgets, profile-link cardinality, safety/AI/photo confidentiality. C3-11 remains open; not every registration route is protected. Continue remaining modules autonomously; no global clinical/privacy closure.

## Stage 3A current update

See [STAGE3A.md](STAGE3A.md), source/UI commit `57e6d2c` and response-safety commit `d78465b`, and [complete UI reference](../viva/03-authentication-ui-file-reference.md). Earlier stage sections remain historical. All 89 backend and 56 new source/UI cases pass; exact web fixture coverage is separate from native/real DB/session acceptance.

| ID / scope | Implemented or observed | Current status |
|---|---|---|
| C3-01–C3-03 | Real web forms/error associations; acknowledged bounded client requests; duplicate and OTP competing-action guards | Source/tests PASS; representative web browser states PASS. Native render/runtime NOT_RUN. |
| C3-04 | Approved OTP identity navigates directly; pending professionals receive approval guidance and no admitted UI identity | Web fixture and parent/source contracts PASS; real cookies/DB/approval administration pending. |
| C3-05–C3-06 | Scoped control/contrast/wording/visibility changes; expired/replaced-code and reset recovery; generic non-delivery recovery acknowledgement | Selected narrow/desktop web checks PASS; no full WCAG, native, other browser or real provider claim. |
| C3-07–C3-08 | Mobile logout no longer silently clears UI on failure; web store mutation moved out of route-guard render | Source contracts PASS. Real session store/logout/whole-app bootstrap and native behavior pending. |
| C3-09 | Direct professional application negative envelopes/disabled states, lab confirmation/false pre-verification badges, keyboard link corrected | Actual RHF/public-form browser fixtures PASS; module backend/DB acceptance not closed. |
| C3-10 | Comments/ownership uncertainty, full scoped UI viva and category-specific tracker updated | Source documentation complete for scoped screens; partial shared/module reviews explicit. |
| C3-12 | Generic unexpected registration-controller failures and web/mobile 5xx filtering; safe known provider wording retained | Actual controller/client source tests PASS after browser capture. Raw server logging and whole-module privacy remain OPEN. |
| C3-11 / M01 | Existing direct `/api/pharmacies/register` and `/api/laboratories/register` create pending users without main OTP, set user is_verified=true, and do not install Stage 2B auth-router budgets; inspected service creation steps are not one demonstrated shared transaction | SOURCE-confirmed separate contracts/absence; policy/security/transaction follow-up OPEN. Only unexpected registration failure text changed; schema, enrollment and approval rules remain unchanged. Do not call all public registration globally limited/email-verified. |

Unchanged open policies: reset leaves sessions/other unused links and lockout intact; legacy/unverified patient and missing/same-role profile-link rules remain. Native/assistive technology/hardware back/insets/font scaling/URL host behavior remain NOT_RUN because adb initialization fails. Verified schema/disposable PG and deployed cookie/proxy evidence remain missing. Shared-control changes are additive/scoped, but unrelated consumers, full app/session integration and inherited clinical/privacy findings are not certified complete.

## Stage 2B current update

See [STAGE2B.md](STAGE2B.md) for `0cd2abb`, pre-fix reproduction and 89 passing application checks. Stage 2A notes below are historical; no inherited clinical/privacy finding is certified fully closed.

| ID | Confirmed behavior / remediation | Current acceptance status |
|---|---|---|
| B2-01 | Resend's stale snapshot upsert overwrote newer registration fields or recreated a consumed pending row. Reproduced both before fix; code-only UPDATE now matches observed ID/email, never inserts, and gates email on matched row. Provider failure retains replacement; concurrent email order need not match writes. | SOURCE + 10 isolated resend regression/SQL contract cases PASS; actual PG row locking/rollback/interleavings PENDING. |
| B2-02 / inherited M01 | Unbounded OTP/recovery routes now have configurable shared email-generation and independent verify/reset IP/field budgets. Actual installed middleware/MemoryStore tests cover allow/exhaustion/expiry/failure. | Focused per-process safeguard implemented/tested; global/persistent limits, raw secret storage and timing/response hardening remain OPEN. No blanket M01 closure. |
| B2-03 | One-hop proxy trust applied in development too. Default is now direct-client (0) outside production, existing 1-hop default retained in production, configurable non-negative integer. | Captured app config and actual Express IP resolver PASS on synthetic headers/socket; real trusted proxy paths/access restrictions/session forwarded-protocol and browser checks NOT_RUN. |
| B2-04 / S1-03 | Verified starting schema/disposable PG still unavailable; existing search reused. Exact auth/session objects and schema-only export/acceptance instructions supplied. | PENDING DB; no guessed schema, production connection or data export. |

Unchanged policy consequences: password reset leaves sessions active and other unused links reusable until expiry/use; lockout remains. Legacy/unverified patient rules do not gain a blanket verification gate. Missing profile may admit a session with null profile then deny downstream ownership; same-role profile-link changes can leave stale session profile IDs. Policy decisions and DB/browser acceptance remain open. Consent, CSRF, unrelated module and visual/accessibility findings are not closed.

## Stage 2A current update

See [STAGE2A.md](STAGE2A.md) for A2-01 through A2-09: stale session roles; session ID rotation/save acknowledgement; cryptographic OTP/deadlines; pending-OTP transaction read; password/token transaction consumption; typed input validation; account-state/recovery disclosure and logging; cookie-lifetime validation; absent-session logout/email wording. They have source fixes and 67 passing isolated policy/contract cases. Live DB/browser/device acceptance remains open; no inherited clinical/privacy finding is marked fully closed.

S1-02 now has a maintained application auth/access regression suite and `test:auth`/default-test wiring. Coverage for other modules and CI remains pending. M01 and M02, reset session revocation/other-token policy, legacy patient verification/approval, missing profile/link changes, consent category classification and UI/logout feedback remain unresolved as detailed in the Stage 2A report. Source-confirmed absence is distinguished from an unagreed policy. The historical Stage 1 register follows unchanged in meaning.

2026-11-12. Discovery findings only; no application fixes applied. Static check results are in [BASELINE.md](BASELINE.md). No executed project check failed, and there are no Stage 1 application regressions.

Stage 1B update: S1-01 preservation is complete through explicit checkpoints on the review branch. Tracker-refresh loss and stale-PASS tooling risks were addressed with 21 maintained regression fixtures and independent static reports. These tooling resolutions do not close H/M runtime findings. S1-02 still applies to application tests/CI; the new fixtures test review tooling only. The searched material did not provide a verified complete base schema; see [NEXT_STAGE_PLAN.md](NEXT_STAGE_PLAN.md). No application behavior or disputed source author was changed in Stage 1B.

## Confirmed discovery findings

| ID | Finding / evidence | Implication / next action |
|---|---|---|
| S1-01 | 44 unstaged files and seven existing untracked audit reports on `develop`; transactions/security/UI changes span all clients | Preserve and reconcile these batches before implementation; see `preexisting-work.csv`. A clean HEAD worktree would omit relevant work |
| S1-02 | `backend/package.json` test aliases syntax; no tracked application assertions or CI found | Passing baseline does not prove role/ownership, rollback or workflow correctness. Establish fixture-based checks first |
| S1-03 | Six incremental migrations (`001`, `003`–`007`) assume existing users/domain/consent/session schema; no base schema/002 is tracked | Fresh database reproduction is incomplete. Obtain sanitized schema and fixtures; do not infer production schema or run migrations |
| S1-04 | Backend/mobile lint and all typecheck scripts absent; backend ESLint config has no associated installed lint dependency/script | Record as unavailable coverage, not a failing run. Agree later tooling without installing dependencies for style alone |
| S1-05 | `npm` unavailable on PATH, though installed local tools work through Node | Standard documented npm commands were not executed. Restore npm before clean-install/standard-script verification |
| S1-06 | README Node 20+ conflicts with locked Supabase Node >=22 requirement and finer Vite/RN engine minimums | Correct documentation in a later documentation batch; pin/verify an agreed runtime |
| S1-07 | Current `EmergencySOS.js` hardcodes its dialer number while root README/checklist still describe `EXPO_PUBLIC_EMERGENCY_PHONE`; response copy says notification unconfirmed | Documentation/config contract differs in the existing dirty work. Review device behavior and agreed requirements; no emergency call was made |
| S1-08 | Two generated files under tracked `frontend/.vite/deps/`; root `old_AIChatScreen.js` and mobile `constants/theme.js` have no incoming imports in the static map | Review hygiene/legacy reachability separately; no deletion proposed solely from a filename or static absence |
| S1-09 | Four independent npm roots with overlapping dependencies and no shared workspace; web/mobile duplicated client utilities | Document actual duplication and contracts. No architecture/package-manager migration is implied |
| S1-10 | Ownership map conflicts with older docs; 37 source/tool/migration files lack a detected author header; existing names/compound credits vary | Resolve original authors using history and team evidence; see `OWNERSHIP.md`, do not mass-replace headers |
| S1-11 | Existing root viva/deployment docs and older audit reports contain stale scope/status statements; frontend README is boilerplate | Reconcile after behavior is verified. Historical “PASS” results are not current acceptance evidence |
| S1-12 | `db.js` connects at import; server schedules email reminders and expiry mutations; AI/storage clients require configuration | Use mocks/disposable services for next-stage tests. Do not import/start the application against unidentified local configuration |

The production bundle compiles but currently emits a single approximately 1.65 MB JS chunk. A plugin timing warning was observed. Performance and route splitting are later assessment items, not a Stage 1 failure.

## Inherited issues: revalidate against this exact working copy

The prior `docs/final-review/05_remaining_issues.md` listed H03/H05/H06/H08 and M01–M10. Do not copy its statuses as current facts:

| Historical concern | Current discovery evidence | Remaining verification |
|---|---|---|
| H03 pharmacy patient reads | Dirty patient routes remove pharmacist allowance from UUID prescriptions read; new QR POST requires pharmacist and two boolean confirmations; web now uses it | No short-lived server grant was identified in the new controller. Decide/retest replay, consent evidence, QR capability and least-data policy; booleans alone do not prove patient presence |
| H05 concurrent dispensing | Dirty service uses one client transaction and prescription lock; repository adds quantity guard and shared-client support | Test concurrent requests, duplicate items, rollback, expiry/state changes and history atomicity in disposable PostgreSQL before closure |
| M03 booking integrity | Dirty repository `bookAvailableAppointment` locks doctor row, checks slots/conflict and inserts in one transaction | Test concurrent booking, alternate write paths, boundary times and availability policy; syntax cannot validate locking guarantees |
| M04 lab finalization | Dirty `createLabReportAndCompleteRequest` locks request, verifies assignment/status, inserts report and completes request transactionally | Test retries, duplicate reports, rollback and cross-lab access; current older “separate writes” note is stale for this call path |
| H06 SOS assurance | Dirty mobile code changes dialer/failure wording and backend response explicitly leaves notification unconfirmed | Device permission/call/dashboard/provider failure checks remain unperformed |
| H08 AI/privacy | Dirty patient chat audit removes raw `prompt`; AI helper still receives patient context for applicable features | Reassess minimization, disclosure/consent, provider boundaries, logging and bounded requests. Do not call provider models in discovery |
| H01/H02/H04/H07 earlier stabilization | Existing notes claim auth/public-content/consent/reset fixes and isolated checks | Rerun role/session/OTP/draft/category-grant/reset journeys with fixtures; historical checks were not reproduced here |
| M01/M02/M05–M10 and UI polish | Older reports describe recovery limits, CSRF/origin, report URLs, audit coverage/outcomes, confirmation, accessibility and schema/tests | Detailed current-source review and focused tests pending; keep these as inherited concerns until independently confirmed or superseded |

## Later regression recording

For each authorized implementation batch, record the parent snapshot/commit, changed paths, finding IDs, exact checks and observed results. A failure becomes a regression only when the same check passed on the preserved baseline under comparable conditions. Unexecuted runtime checks remain unknown. Preserve historical IDs when closing/revising findings so earlier reports can be traced.

## Shared foundation update — 2026-11-14

Fixed with focused synthetic checks: startup pool-client leak; production TLS verification with explicit CA/URL override handling; pre-outcome/raw-path audit metadata and nested credential exposure; dynamic email HTML injection and raw provider exceptions; missing optional AI/Storage startup failure; reminder date argument mismatch; zero-coordinate SOS omission. Actual certificate provisioning/handshake, audit durability/coverage/retention, provider/clinical privacy, job duplication/status policy and remaining module permissions remain OPEN. See the shared-runtime viva once for details. No production/read/alert/email/payment/deployment action occurred.
