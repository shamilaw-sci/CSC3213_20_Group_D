# Care4U final review progress

## Current work: autonomous remaining final review

2026-11-14. User authorized completing remaining review without per-stage pauses or handoff ZIPs. Preserve completed work and use focused checks plus major integration checkpoints. Missing isolated-DB/native/deployment acceptance leaves explicit gaps, not unrelated source/UI/viva blockers. No live records/DB writes, real messages/payments, deployment, push or merge.

[Patient Stage 4A](STAGE4A.md) is the current coherent batch, starting at b09bfd0 with clean entry: profile persistence/validation, service ownership/consultation boundaries, atomic consent mutation protocol/expiry/attempt guards, acknowledged web/mobile feedback, record filters and representative web a11y/responsiveness. Existing 145 + 44 new checks PASS; final source-bound static checkpoint is recorded in evidence/static-current. [Patient viva](../viva/04-patient-profile-records-consent.md) covers logic and partial scope. C3-11, clinical text classification, explicit revocation and rolling consent budgets remain open.

Patient application commits: 6f261b6 and c06edd8; all six static checks passed. No ZIP; outside-repo application patch saved. Next order: shared auth/audit/config foundations as needed; Doctor/Appointment context; Prescription/dispensing; Pharmacy/Laboratory; Hospital/Emergency; orders/payments; Admin/health content/integrations and remaining shared consumers. Use tracker exclusions/partial states, do not repeat completed foundations unless affected. Final completion requires pending source work, not merely the Patient checkpoint.

## Historical handoffs and discovery

## Current handoff: Stage 3A

2026-11-13 (Asia/Colombo). **Stage 3A complete locally; stop for independent review.** Entry was clean at confirmed Stage 2B final `8c06a83a15bb502da04f987c7dbc8f58deedabcc` on the same `codex/care4u-final-review-2026-11-12` branch. Application/UI/tests/comments commit: `57e6d2c` and response-safety commit `d78465b`. Final documentation/evidence commit is in Git and the outside-repository manifest.

[STAGE3A.md](STAGE3A.md) records seven web auth/application screens, five mobile screens, every supported role form, scoped shared controls/calls/navigation and preserved ownership. Local results: 89 retained backend + 56 new source/UI cases PASS; six static checks and 21 existing review-tooling cases PASS. Eighteen browser-matrix rows and 30 JPEGs record actual web fixtures at exact narrow/desktop widths/states. Source, synthetic browser, native, DB, provider and deployment evidence stay separate. No review-tooling source changed. Two direct registration controllers now hide unexpected server errors; database/session/enrollment policy is unchanged.

[The complete UI viva reference](../viva/03-authentication-ui-file-reference.md) explains each screen's state, handlers/effects, validation, API calls, navigation, failures and exact Ctrl+F symbols. Shared/root/style/config/backend dependencies remain partial to the auth contract; no unrelated consuming module is marked complete. Original tracker baseline/provenance fields are preserved.

Native device/emulator, screen-reader execution, real session/cookie/provider/deployment and DB acceptance remain NOT_RUN/PENDING. adb cannot initialize despite an installed Pixel_6 AVD; no native app/device action ran. Existing schema/disposable-PG/proxy prerequisites and reset-session/other-link, legacy patient/profile-link policies remain open. Direct pharmacy/lab application APIs differ from main OTP enrollment and lack those auth-router budgets; any unification/atomicity/limit change is a separate backend/policy batch.

New archive: `C:\Users\Waasana\.codex\visualizations\2026\11\12\01a1cfb2-a394-7811-9795-1e79790000a9\Care4U-Stage3A-Handoff.zip`; previous archives retained. Source/diff/tests/screenshots/matrix/tracker/viva/ownership and baseline/final/hash manifest are included. Local commits only, no upstream; no push or merge attempted. Next action is independent review, then supported native and existing DB/deployment acceptance prerequisites. Do not start another stage automatically.

## Historical handoffs through Stage 2B

## Current handoff: Stage 2B

2026-11-12. **Stage 2B complete locally; stop for independent review.** Entry was clean at confirmed Stage 2A final `f14aee0c86178b5b14e99d367c5830203efcdd31` on the existing `codex/care4u-final-review-2026-11-12` branch. Application fix/config/tests commit: `0cd2abb`. Final documentation/evidence commit is recorded in the outside-repository archive manifest and Git log.

[STAGE2B.md](STAGE2B.md) records reproduced resend stale-write/recreation races, code-only ID/email UPDATE, configurable per-process IP/email/token request budgets and explicit proxy defaults. All 89 application checks pass (original 67 retained), including real installed rate middleware/store execution; the 21 existing tooling checks pass. Current independent static reports are in `evidence/static-current/`. Controlled service interleavings and SQL mocks do not certify PG concurrency. No review tooling was expanded.

Database acceptance is still PENDING: no verified base schema or identified disposable local PG environment. [AUTH_DATABASE_PREREQUISITES.md](AUTH_DATABASE_PREREQUISITES.md) lists exact objects, sanitized schema-only export instructions and focused acceptance cases. No repeated broad search, live configuration, DB connection, production access, patient data export or schema invention occurred. Browser/device/visual/provider/deployment-proxy checks remain NOT_RUN.

Password reset still leaves sessions and other reset links active; legacy patient verification/approval and missing/changed profile-link rules remain unresolved. Raw OTP/reset storage and distributed/persistent limit requirements remain open. No unrelated UI/module review is marked complete. Original auth/app author credits remain; S/21/389 name mapping remains uncertain.

New handoff: `C:\Users\Waasana\.codex\visualizations\2026\11\12\01a1cfb2-a394-7811-9795-1e79790000a9\Care4U-Stage2B-Handoff.zip`; Stage 2A ZIP retained. The manifest contains baseline/final commits, all included full source hashes and diff. Local commits only, no upstream; prior automatic push rejection remains in force and no retry/alternate route occurred. Next step is independent review, then verified schema/disposable DB and proxy evidence plus explicit unresolved-policy decisions. Do not begin other modules automatically.

## Historical progress through Stage 2A

Date: 2026-11-12 (Asia/Colombo). Stages 1/1B and the bounded Stage 2A batch are complete. **Stop for independent review.** Stage 2A adds verified isolated auth fixes, comments and the first full viva sample; live DB/browser/device acceptance remains pending.

## Resume here

Read this file and inspect `git status --porcelain=v2 --branch --untracked-files=all` before each stage. Current handoff: [STAGE2A.md](STAGE2A.md), [authentication viva sample](../viva/02-authentication-and-access.md), [file reference](../viva/02-authentication-file-reference.md) and [change map](../viva/02-authentication-change-map.md). [STAGE1B.md](STAGE1B.md) and [NEXT_STAGE_PLAN.md](NEXT_STAGE_PLAN.md) are previous-stage context. Never treat historical audit reports as current runtime evidence.

Stage 2A entered clean at `245887bcd41b091a5375a79d7932c98c89c2f5ae`; no subsequent/unrelated changes existed. Commits: `150fec1` behavioral auth/session fixes plus 67 maintained isolated application cases; `8c7908b` test script wiring; `438c8a1` separate comments with executable AST parity on 13 files. Exact final documentation commit and included files are in the outside-repository handoff ZIP manifest. The current review branch remains `codex/care4u-final-review-2026-11-12` with no upstream/push; develop/main remain untouched.

Core review covers 14 file references (13 auth source files plus partial app assembly); dependency/UI files are explicitly partial. All 67 policy/contract cases pass; they do not prove live SQL, locking, rollback, cookies or native behavior. OTP/token raw storage/attempt control, reset session revocation and legacy account/consent policies remain open. No schema was invented. Visual/accessibility/browser/native/provider acceptance is NOT_RUN.

Next action is independent review using `Care4U-Stage2A-Handoff.zip` at the path in STAGE2A.md. Do not proceed into other modules automatically. After review, the next bounded batch is verified-schema/disposable DB/session-cookie acceptance, or agreed auth-policy follow-up if the schema is still missing.

Current review branch is `codex/care4u-final-review-2026-11-12`, created from original HEAD `eeacffb0100288c7b89f5bddc33ffc917d6970b0`. Stage 1B entry hashes matched all 290 original files. The inherited 44 application edits were preserved in `a7c074b`, `a3bcac6`, `cc499f3` and `a609f07`; the original Stage 1 tracker/tooling/evidence and historical reports were preserved in `ad3b2fd`. Exact paths/scopes are in `evidence/stage1b/preservation-commits.json`. Source-file authorship remains separate from neutral review-assistant commit authorship.

The immutable Stage 1 snapshot remains `evidence/initial-state.json`. The inherited application source checkpoint is `a609f07`; later review-only commits build on it. Use `git log --oneline` for the latest review-tooling/evidence commits. Current static reports are under `evidence/static-current/` and must match their manifest run ID and source hashes. B01–B06 passed; runtime/visual verification remains NOT_RUN. Twenty-one maintained tooling regression fixtures passed. Application files still await individual behavioral/commenting/UI review.

The Stage 1B next batch (isolated auth/access fixtures and viva documentation) has now been completed in Stage 2A. Full DB/schema and browser/device acceptance remain blocked by unverified prerequisites. No broad application refactor starts automatically.

Publication status: **local commits only; push blocked**. Automatic approval review rejected the attempted push of this review branch to `https://github.com/shamilaw-sci/CSC3213_20_Group_D.git`, stating that the destination was not established as trusted for exporting private source/review artifacts and that this specific egress lacked explicit approval. No push process ran and no workaround was attempted. Obtain the user's explicit approval for this branch and destination before retrying; do not push develop/main. The review branch has no upstream yet.

## Documentation structure

The existing `docs/` convention is retained. These files establish the proposed structure for subsequent review stages:

| File | Purpose |
|---|---|
| [PROGRESS.md](PROGRESS.md) | Stage status, decisions, handoff, review order |
| [FILE_REVIEW_TRACKER.csv](FILE_REVIEW_TRACKER.csv) | One row for each of 283 tracked files at entry |
| [BASELINE.md](BASELINE.md) | Git, architecture, environment, checks and limitations |
| [OWNERSHIP.md](OWNERSHIP.md) | Responsibility map, provenance evidence, unresolved attribution |
| [FINDINGS.md](FINDINGS.md) | Confirmed discovery findings and inherited issues needing revalidation |
| [../viva/README.md](../viva/README.md) | Viva entry points and proposed module documentation |
| `evidence/` | Machine-readable hashes, refs, versions, check results, dependencies and ownership |
| `tools/` | Review-only inventory and safe static-check helpers; no student authorship claimed |

Existing `docs/final-review/01_*` through `05B_*` documents are now tracked historical evidence, unchanged and labelled by their directory README. Root README, root viva guide, deployment checklist and epic notes remain unchanged. Review documentation and fixtures were added/updated in Stage 1B.

## Stage 1 completed

- Inspected repository/ancestor instructions, external v3 team guide and final-development guide, current headers, documentation, Git refs/status and relevant local diffs.
- Inventoried all tracked paths and classified every file. Detailed per-file behavioral review remains pending; inventory completion is not review completion.
- Collected per-file Git introduction candidates with rename/copy detection and current author-header evidence. No student author was assigned from module responsibility alone.
- Checked source imports, actual module mounts, client entry points, package manifests, all four lockfiles, migrations and integration boundaries.
- Executed backend syntax, frontend lint, production web compilation, mobile parsing, diff whitespace checks and direct-dependency consistency checks. All executed project checks passed; see [BASELINE.md](BASELINE.md).
- Recorded original file hashes for all 283 tracked and seven pre-existing untracked files. Final preservation verification is recorded in `evidence/preservation-check.json`.

## Stage 1 protection decision (historical; superseded by Stage 1B authorization)

Stage 1 continued analysis without switching branches. `evidence/preexisting-work.csv` lists each original dirty/untracked path and its likely scope; `evidence/initial-state.json` records SHA-256 values. Hashes alone were not a recoverable backup. Stage 1B subsequently created explicit authorized checkpoints, including the original tracker and tools, before refreshing them.

Stage 1B created the review branch in the same checkout while carrying all local work. Concern-based checkpoints preserve those exact contents without claiming runtime correctness or resolving all attribution. No blanket staging, stash, reset, cleanup, history rewrite, pull or merge into develop/main occurred. No relevant application work was excluded by creating a clean worktree.

Keep checkpoints and source hashes as the unambiguous review baseline. Use only synthetic configuration for future isolated tests. Full commit scopes and the schema-search/publication-inspection limits are in the Stage 1B report.

## Dependency-aware module order

The import evidence is in `evidence/source-imports.csv`. This is a static import map, not an HTTP call graph or proof of runtime reachability. Cross-module references and database contracts drive this order:

1. **Reproducibility and shared infrastructure.** Establish a sanitized base schema, sessions, fixtures and check commands. Review `config/db.js`, `config/supabase.js`, `app.js`, upload limits, API clients, environment boundaries, common web components, mobile application shell and shared data/search/date utilities.
2. **Identity and security foundations.** Review `middleware/auth.js` (`isAuthenticated`, `authorize`), `patientAccess.js` (`authorizePatientResource`), audit logging, OTP/email/QR utilities, auth repositories/services, client stores and session hydration. Auth controllers also resolve patient/doctor/pharmacy/lab/hospital profiles: verify those identity contracts before declaring auth end-to-end complete. Audit event semantics precede admin audit UI review.
3. **Patient, doctor and appointment foundations as a coordinated batch.** Review patient/doctor/appointment repositories, availability and booking first; then consent repositories/services and patient record filtering; then consultation controllers and clients. `appointment.controller.js` calls patient services; `patient/consent.service.js` uses doctor and appointment repositories; `doctor.service.js` uses appointment repositories. These module-level dependencies prevent a strict one-module-at-a-time topological order. They do not by themselves establish a circular `require` defect.
4. **Consultation outputs and clinical safety.** Review interaction rules, prescription creation/expiry, doctor lab ordering and laboratory finalization. Prescription creation depends on appointments; dispensing controller resolves pharmacy identity. Review the existing transaction changes with disposable PostgreSQL concurrency/rollback fixtures before simplification or header edits obscure their diff.
5. **Pharmacy, orders and sandbox payments.** Review patient QR lookup/consent, prescription verification/dispensing/history, pharmacy profiles, medicine orders and payment ownership. `payment.service.js` imports patient data; prescription workflows use appointments and pharmacy identity. Include patient web/mobile prescription/report displays after their API contracts are settled.
6. **Hospital/clinic and emergency.** Hospital service imports appointment repository and QR utilities; assisted registration, OPD/walk-ins and break-glass require the earlier identity/clinical/audit foundations. Then review SOS, location permissions, dashboard delivery, Telegram/email boundaries and native dialer UX with mocks/device fixtures.
7. **Administration and health content.** Approval/account state is checked early with auth; review the remaining admin UI, aggregate analytics, audit viewer, QR reissue, settings and publishing after their underlying workflows. Public feed clients depend on the publishing contract.
8. **Cross-role UI, wording, accessibility and viva consolidation.** Verify all consuming screens after shared components; retain intentional module themes. Finish integration/device journeys, reconcile ownership, update source-linked viva pages, and review artifacts/configuration/exclusions.

## Recommended next stage

Stage 2 should reconcile the existing stabilization diff and establish a disposable database/schema plus regression fixtures for auth/approval/session, patient consent, booking concurrency, dispensing rollback and lab completion. Begin with shared foundations and the coordinated patient/doctor/appointment contracts. Resolve attribution independently where possible; keep uncertain original authors in the register. No application implementation is authorized by completion of this Stage 1 report alone.

For every later batch, update tracker review/verification status and findings, keep comment-only work separate where practical, and compare with this baseline. Never label a runtime journey passed from lint/build/parser results.

## Read-only database/hosting discovery — 2026-11-13

[Discovery report](DATABASE_HOSTING_DISCOVERY.md): Supabase confirmed; Render is the documented/configured backend target, deployed topology unverified. PostgreSQL 18.3 export tools found outside PATH. Trusted-TLS metadata connection failed before queries; CA certificate/verified schema export required. No live records/tests/writes, export or disposable database creation. Stage 3A remains complete and paused for independent review; only discovery documentation follows it.

## Supplied schema metadata — 2026-11-13

[Catalog assessment](SUPABASE_CATALOG_ASSESSMENT.md) records 535 user-supplied metadata rows from PostgreSQL 17.6: 35 public tables, 312 columns, 114 constraints and 68 indexes. Auth/session structures are now evidenced; migration history and restore-ready DDL remain pending. RLS settings require separate grants/API exposure assessment. No live records/tests/writes or new application batch.
