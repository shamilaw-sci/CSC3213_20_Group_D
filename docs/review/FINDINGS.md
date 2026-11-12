# Stage 1 findings

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
