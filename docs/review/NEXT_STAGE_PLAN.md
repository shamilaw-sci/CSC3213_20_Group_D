# Next bounded review stages

Current through Stage 2B: the isolated auth/access batch and focused resend/attempt-limit follow-up are complete locally. Stop for independent review using [STAGE2B.md](STAGE2B.md). The next acceptance batch needs the [exact auth/session schema prerequisites](AUTH_DATABASE_PREREQUISITES.md), verified sanitized schema provenance, an explicitly disposable local PG target and deployment proxy evidence. No repeated broad schema search or automatic expansion to other modules is authorized. Recovery-session/other-link, legacy patient and profile-link policy decisions remain separate and open. The detailed plan below is retained as historical/planning context; completed isolated tests are not pending tasks and are not real DB/browser acceptance.

Prepared in Stage 1B, 2026-11-12. No broad application refactoring begins here. The inherited runtime findings in [FINDINGS.md](FINDINGS.md) remain open; checkpoint commits preserve contents, not correctness.

## Immediate batch: shared access-control verification

Review [auth middleware](../../backend/src/middleware/auth.js) (`isAuthenticated`, `authorize`), [patient access middleware](../../backend/src/middleware/patientAccess.js) (`authorizePatientResource`), [auth service](../../backend/src/modules/auth/auth.service.js) (`login`), OTP/session controller behavior and web/mobile hydration contracts. Keep this batch limited to evidence, repeatable isolated regression fixtures, and source-linked documentation. Do not silently expand it into booking, dispensing or a UI rewrite.

Use the existing Node test runner and controlled CommonJS test wrappers with an allowlisted mocked `require`, before evaluating application modules. The database config connects at import, so the real config module must never be loaded in isolated tests. Deny unexpected imports and external calls. Cover approved patient/doctor allow, pending/rejected/inactive account denial, missing session, failed-login/lockout behavior, OTP professional approval, own/other patient access and assigned/wrong/inactive consultation IDs. A mocked repository test verifies policy control flow, not real SQL/session persistence.

Deliver: maintained fixtures, a case/result matrix with exact source hashes, an updated auth viva page and finding/tracker entries. Application rows become reviewed only after their individual source/contracts are assessed; parsing/lint/build alone is insufficient. Database/cross-origin/browser claims stay pending until the environment below exists.

## Per-module UI and wording standards

Before editing a module, record representative current screens and reusable components, then agree that module's vocabulary and interaction rules. Preserve the implemented `data-module` tokens in [index.css](../../frontend/src/index.css) and [TopNavbar](../../frontend/src/components/layout/TopNavbar.jsx). Patient teal, Doctor blue, Pharmacy emerald, Laboratory aqua, Hospital cyan/deep blue and Admin indigo are intentional. Semantic danger/urgent/success states stay consistent across modules. Mobile uses local `StyleSheet`/`COLORS` definitions; the unreferenced theme file is not automatically the active design authority.

| Module / maintainer | Specific copy and workflow review | Acceptance evidence |
|---|---|---|
| Authentication + Admin / Lasitha | Sign in/register/OTP/reset labels, pending/rejected/active states; approval vs verification; precise mutation confirmations | Form labels/errors and keyboard behavior; no account-enumeration wording regression; admin/non-admin fixture cases |
| Patient / Wasana | Patient profile/records, consent-category explanations, appointments/reports; consistent date/status labels | Loading/empty/error states, label associations, small/desktop widths, own/other account checks |
| Doctor + Audit / Tharindu | Consultation status/action vocabulary, category grants, informational confidential label; audit attempts vs outcomes | Queue-to-consultation journey, expiry of grants, visible save/failure feedback, accurate event documentation |
| Appointment + Prescription + Pharmacy / Pamudika | Booking availability/conflicts; internal enums vs display labels; QR code, partial fill, remaining quantities, order/sandbox payment outcomes | Conflict/expiry/concurrency fixtures; identity/consent handling; no success wording before confirmed persistence |
| Laboratory / Wasana | Request priority/status names, assignment, upload/finalization wording, findings/report URL errors | Queue/upload pending/failure/retry states and cross-lab denial; report completeness/atomicity fixtures |
| Hospital + Emergency / Wasana | OPD/check-in/walk-in terms; break-glass reason/access; dialer opening vs call placement vs dashboard/contact delivery | Permission-denied/location/API/provider mocks; device tests later without placing real calls or sending alerts |

Apply shared Button/Input/Modal/DataTable fixes before consuming screens, preserving module themes. Review focus management, keyboard escape/restore, table headers, form error association, touch targets and non-color status labels. Define two viewport sizes plus keyboard-only and screen-reader checks per web module; choose target Android/iOS runtimes before device acceptance. Never change clinical guidance, role enums or status contracts for copy consistency alone.

## Commenting compliance and ownership

1. Build a per-file/function/component checklist from the actual parsed symbols. Guide 3.2 requires purpose/module/file/accurate author headers; 3.3 requires purpose, inputs and outputs for functions; 3.4 applies component/prop descriptions. Include permissions, side effects, transactions, audit behavior, failures and non-obvious rationale where relevant.
2. Compare each comment to actual code before adding/removing it. Retain useful TODOs/licenses/security notes. Document substantial callbacks where their contract is meaningful; avoid comments that merely restate an assignment. Use JS/CSS/HTML/SQL-compatible comments, and exclude strict JSON/generated/lock/binary files from source-comment insertion.
3. Start with the [ownership register](OWNERSHIP.md) and `ownership-history.csv`; inspect creation patches with rename/copy history and feature-level subsequent implementation. Keep Git uploader, original source author, later contributor and module maintainer separate. Resolve the S/21/389 naming discrepancy and shared utility/lab/appointment credits with team evidence, without guessing.
4. Record decisions in `ownership_decision` and the register. Keep uncertain headers unchanged. Comment-only batches should stay separate from behavior changes, with appropriate static verification and no mass formatting.

## Source-linked viva pages

Follow [the viva scaffold](../viva/README.md), starting with `02-authentication-and-access.md`. For each role/workflow document request -> route/middleware -> controller/service -> repository/table -> response/UI, with relative source links and named symbols. Explain access restrictions, validation, transitions, side effects, transactions, audit events, failure handling, original-author uncertainty and actual verification limits. Separate implemented behavior from guide backlog and inherited findings. Include a synthetic example and a small, behavior-preserving viva modification exercise after baseline fixtures exist.

## Schema search result and exact blocker

The search covered tracked/all-ref SQL history; repository and external Markdown guides/progress material; local deployment/mid-review archives; root and development-guide DOCX text; and text extraction from five project/reference PDFs. See `evidence/stage1b/schema-search.json` for source hashes, page extraction coverage and archive members. No complete executable starting schema was found in this searched material. Scanned-image content was not reconstructed with OCR, and unsearched/remote materials are not claimed absent.

The repository and deployment archive provide only migrations `001`, `003`–`007`. The installed `connect-pg-simple` 10.0.0 package provides `backend/node_modules/connect-pg-simple/table.sql` for the session table, but that fragment has not been validated against the project's PostgreSQL version. It contains `WITH (OIDS=FALSE)` and must not be blindly used as a current whole-system schema. No dependency/vendor file was copied into Git.

Missing prerequisites include canonical executable definitions, ordering, keys/types/defaults/constraints/indexes and expected version/extension/RLS contracts for: users/profile/role/approval/lockout/reset-token tables; patient clinical/background/vaccination tables; doctor availability/appointments; consent settings/requests/grants; prescription/items/dispensing; pharmacy/orders/payments; lab requests/reports; hospital/emergency; audit logs and sessions. The six increments do not establish these foundations. The absence of migration `002` is a sequence gap, not proof of its intended contents.

`database-contract-candidates.csv` points to relation references in SQL strings; it is a source-navigation aid, not a trusted DDL reconstruction. Obtain an existing **sanitized schema-only** SQL file from approved project material or a team-controlled development source, with source/version/hash evidence. Do not connect to production, dump data, copy credentials or invent missing constraints from queries. Until verified, DB integration/concurrency tests are blocked; isolated access-policy tests, UI/copy inventories, ownership and viva work can proceed.

## Disposable database acceptance plan

Once the schema is verified, choose a fresh local PostgreSQL instance/container compatible with it. Explicitly name a review-only database/user and require loopback host, review database-name prefix, dedicated role, fixture marker and an explicit test-environment flag before any write/reset. Refuse unknown or non-loopback URLs. Never load the application's live `.env`; create synthetic test configuration separately. Disable server reminder/expiry intervals and automatic session cleanup jobs during deterministic tests.

Apply the verified base schema and incremental migrations in the documented order to an empty test database, capture schema/version checks, then seed synthetic patients A/B, doctors A/B, pharmacist/pharmacy A/B, laboratories A/B, hospital staff, admin, pending/rejected/inactive accounts and deterministic appointments/times. Include session and consent rows without real contact details. Own and tear down only that uniquely identified test database/fixture namespace.

| Contract | Required repeatable assertions |
|---|---|
| Auth/session/approval | OTP patient session vs pending professional, login/lockout, hydration, account state recheck, logout; cookie/CORS behavior tested separately in browser |
| Patient/consent | Own vs other patient, assigned active appointment, locked category, explicit doctor/appointment-scoped grant, expiry/revocation and multiple same-day appointments |
| Booking | Two clients racing the same slot; one winner; alternate insertion paths, unavailable slot, invalid/past time and failure rollback |
| Dispensing | Concurrent partial fills, duplicate item IDs, nonpositive/excess quantities, expired/status-invalid prescription, all-or-nothing quantity/status/history changes |
| Laboratory | Cross-lab denial, duplicate/retried uploads, failure between insert/update, request/report transaction rollback and finalization state |
| QR/emergency/admin | Scoped QR authorization/replay policy once agreed, no UUID bypass, minimal break-glass data/reason/logs, role restrictions and approval/content visibility |

Real concurrent DB transactions are required to verify locking/atomicity; query mocks cannot certify them. Use deterministic clocks/fake timers for expiry and background jobs. Preserve any new maintained regression suite as a first-class deliverable.

## Mock boundaries

| Boundary | Test substitute | Assertions |
|---|---|---|
| Email | Stub `sendOtpEmail`, reset/consent/reminder/lab/rejection/emergency helpers | Recipient is synthetic, payload contract and failure handling; no SMTP transport loaded |
| Telegram | Replace `sendEmergencySMS`/outbound fetch with allowlisted stub | Request intent/result/failure only; no bot token or real channel |
| AI | Stub text/vision provider facade with deterministic success, invalid output, timeout and quota failure | No patient context leaves test; output review/guardrails, fallback and logging limits |
| Supabase Storage | In-memory upload/remove/public-URL adapter | MIME/size/path rules, authorization, cleanup and provider failure; no service-role client |
| Payments | Existing sandbox logic with deterministic references and local repository fixtures | No real card/payment gateway; state/amount/ownership and retry assertions |
| Native location/dialer | Expo Location/Linking fakes | Permission denial, missing location, API retry, dialer failure and truthful confirmation; no real call |

Unexpected outbound access should fail tests. Provider acceptance, browser sessions, visual accessibility and device behavior remain separate verification categories with their own evidence.
