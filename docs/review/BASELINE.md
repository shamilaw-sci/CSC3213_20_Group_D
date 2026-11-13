# Care4U repository baseline

Current stage pointer: [Stage 3A](STAGE3A.md), 2026-11-13, entered clean at `8c06a83`. The original Stage 1 baseline below remains historical and its immutable evidence is retained. Stage 3A local application checks and bounded synthetic web-browser evidence are separate from real DB/cookie/native/provider/deployment acceptance. See the current stage report and evidence matrix; do not interpret the historical baseline's NOT_RUN labels as the whole current verification scope.

Assessed 2026-11-12, Asia/Colombo. Scope: local working copy including pre-existing uncommitted changes. No application code was edited.

Stage 1B note: the facts below describe the original Stage 1 snapshot. The 44 edits and seven reports are now preserved on the final-review branch. See [STAGE1B.md](STAGE1B.md) for commit scopes/current status and [TOOLING.md](TOOLING.md) for refreshed evidence semantics. Original Stage 1 evidence files remain immutable; latest independent static reports live under `evidence/static-current/`. Maintained review-tooling tests now exist; an application regression suite remains future work.

## Git and preservation

| Item | Observed state |
|---|---|
| HEAD | `eeacffb0100288c7b89f5bddc33ffc917d6970b0` |
| Current branch / upstream | `develop` / `origin/develop` |
| Ahead / behind | 0 / 0 against local remote-tracking ref; remote server freshness unverified |
| Existing changes | 44 unstaged tracked files; zero staged; seven untracked `docs/final-review/` reports |
| Diff size | 542 insertions, 738 deletions across 44 files |
| Branches | 23 local; 53 remote-tracking refs including symbolic `origin/HEAD` |
| Default remote branch | `origin/HEAD -> origin/main`; active team integration branch is `develop` |
| Remote | `origin`, fetch/push: `https://github.com/shamilaw-sci/CSC3213_20_Group_D.git` |
| History | Not shallow; 468 commits reachable from HEAD |
| Review branch | Not created because the working copy was dirty |

Every local/remote-tracking branch tip and local upstream relationship is listed in [evidence/git-refs.txt](evidence/git-refs.txt). Local branches without upstreams are explicitly blank there; matching remote names do not establish an upstream. No fetch, pull or remote authentication check was performed.

[evidence/preexisting-work.csv](evidence/preexisting-work.csv) accounts for all 51 existing dirty/untracked paths, with diff size and scope. The backend changes include auth/approval gates, public/admin content separation, consent/logging, QR-scoped pharmacy reads, and booking/dispensing/lab transactions. Web changes cover corresponding contracts, OTP messaging, labels/headers and toast cleanup. Mobile changes include reset implementation, approval handling, SOS dialer/reporting, feed, wording/header and environment-example edits. These are existing behavior changes, not merely formatting. The October review notes describe an earlier subset and cannot certify the larger current diff.

[evidence/initial-state.json](evidence/initial-state.json) records hashes for 283 tracked files plus seven pre-existing documents. Stage 1 added only `docs/review/` and `docs/viva/`. The index and existing files were checked again at completion; see [evidence/preservation-check.json](evidence/preservation-check.json). Git reports LF-to-CRLF conversion warnings under current local settings; no line-ending normalization was performed.

## Instructions and documentation

No `AGENTS.md` was found in the repository (including ignored paths outside dependency trees) or its inspected ancestors through `D:\`. No dedicated commenting guide is tracked. The prior review notes identified external guides, which were found at:

- `D:\Projects\Care4U - Healthcare Project\final development\Care4U_Team_Development_Guide_v3.md`: read in full; sections 3.2–3.4 define file/function/component headers and naming conventions. Section 6 describes workflow, not the header templates.
- `D:\Projects\Care4U - Healthcare Project\final development\Care4U_Final_Review_Development_Guide.md`: inspected for remaining-work, UX, ownership, consent and release context; backlog descriptions are not implementation evidence.

The explicit current Stage 1 instructions govern scope and dirty-work protection. Historical guide instructions to pull, branch, request pasted code or create tickets do not authorize changing the existing work here. Comment syntax must fit the language: strict JSON, lockfiles, binaries and generated files must not receive source comment headers. Keep original authors separate from maintainers.

Tracked documents are root `README.md`, `CARE4U_VIVA_CODE_GUIDE.md`, `CARE4U_DEPLOYMENT_CHECKLIST.md`, `frontend/README.md` and two `docs/epic_*` notes. The frontend README remains Vite boilerplate. Root guides describe real entry points but include dated requirements/claims; the deployment checklist is tied to an older branch. Seven additional review reports already exist untracked. They are historical claims, not rerun evidence. External older Word/PDF/slide materials were located but were not comprehensively audited in Stage 1.

## Repository and technology

| Area | Tracked files | Actual structure |
|---|---:|---|
| Root | 7 | Project docs, ignore file, small independent npm manifest/lock and `old_AIChatScreen.js` |
| Backend | 90 | Express app/server, 14 feature modules, config/middleware/utilities, six SQL migrations, syntax tool |
| Web | 109 | React pages for six principal workspaces, common components/layouts, client services/store, Vite configuration/assets |
| Mobile | 43 | Expo application shell, screens/services/store/utilities/assets, EAS config |
| Docs | 34 | Two epic notes and 32 screenshots |
| Total | **283** | All represented once in `FILE_REVIEW_TRACKER.csv` |

Categories: 194 handwritten source, 19 configuration, six documentation, six migrations, four lockfiles, one verification tool, eight directory placeholders, 39 binary assets, four vector assets and two generated Vite-cache files. No tracked test suite, vendored source tree, shared-package workspace or CI pipeline was found. Language/formats are JavaScript/CommonJS, JavaScript ES modules/JSX, CSS, HTML, PostgreSQL SQL, JSON, Markdown and SVG/images. No TypeScript application sources/config were found.

The four `package.json`/`package-lock.json` pairs use npm lockfile format 3. There is no root workspace configuration, root script orchestration, `packageManager` field or project `engines` declaration. Root dependencies duplicate some QR/native packages without a shared package abstraction. Web/mobile services, stores, search utilities and UI concepts are maintained in separate trees.

| Component | Manifest constraint | Locked and locally installed |
|---|---|---|
| Express | `^5.2.1` | 5.2.1 |
| PostgreSQL driver | `^8.20.0` | 8.20.0 |
| Supabase JS | `^2.110.7` | 2.110.7 |
| Web React / React DOM | `^19.2.4` | 19.2.4 |
| Vite | `^8.0.1` | 8.0.3 |
| Tailwind | `^4.2.2` | 4.2.2 |
| ESLint | `^9.39.4` | 9.39.4 |
| React Query / Zustand (web) | `^5.96.1` / `^5.0.12` | 5.96.1 / 5.0.12 |
| Expo | `~54.0.37` | 54.0.37 |
| React Native / React (mobile) | `0.81.5` / `19.1.0` | 0.81.5 / 19.1.0 |
| Zustand / Axios (mobile) | `^5.0.15` / `^1.15.2` | 5.0.15 / 1.20.0 |

All 62 direct dependency declarations across the four manifests match lock-root metadata, and installed direct versions match their lock entries. This does not validate every transitive dependency, native build, supply-chain vulnerability or clean-install reproducibility. Full versions and dependency engine requirements are in [evidence/dependency-versions.json](evidence/dependency-versions.json).

Local tools: Node 24.22.1, Git 2.53.0.windows.2, Python 3.12.4. `npm`/`npm.cmd`/`npx.cmd` were unavailable on this shell's PATH; local dependency tools were invoked with Node. Java 21 and Android `adb` were discoverable; no emulator/device/native build was tested. PostgreSQL `psql`, global Expo/EAS/ESLint/TypeScript commands were not found on PATH. This does not prove those tools are absent elsewhere on the machine.

The README's generic Node 20+ requirement is insufficient for the current lockfile: Supabase JS requires Node >=22, Vite/plugin-react require ^20.19.0 or >=22.12.0, and React Native requires >=20.19.4. The current Node passes these requirements. No dependency installation or version change was performed.

## Architecture and integrations

`backend/app.js` mounts `/api/auth`, `/patients`, `/doctors`, `/appointments`, `/prescriptions`, `/pharmacies`, `/laboratories`, `/hospitals`, `/emergencies`, `/orders`, `/payments`, `/interactions`, `/admin`, and `/admin/health-content`. Most modules use route -> controller -> service -> repository; appointment has controller/repository orchestration without a separate service. SQL uses `pg`; Supabase JS is a separate storage client.

Sessions use `express-session` with `connect-pg-simple`, HTTP-only cookies and credentialed clients. Production branches configure secure/SameSite=None cookies, CORS allowlists and proxy trust. Backend role/object checks are authoritative; client route/store guards are usability boundaries. `patientAccess.js` uses assigned in-progress appointments for doctor patient access; category consent is implemented in patient/consent services and repositories. Runtime enforcement remains untested in this stage.

Web entry points are `src/main.jsx` (QueryClient/provider/toasts) and `src/App.jsx` (routes/hydration/layouts). Mobile uses `index.js` -> `App.js` with conditional screen state: patient workflows are the main workspace, doctors have a profile fallback, and other roles receive a web-workspace message. Mobile is not a full professional-portal equivalent.

| Boundary | Source/config evidence | Verification boundary |
|---|---|---|
| PostgreSQL + session schema | `config/db.js`, repositories, `app.js` | Importing DB config calls `pool.connect()`; not imported/executed |
| Incremental database changes | `backend/migrations/001`, `003`–`007` | Base domain/session/consent schema and `002` not supplied; nothing applied |
| Supabase Storage | `config/supabase.js`, upload middleware, patient/doctor/content paths | Service-role credentials/bucket policies needed; not contacted |
| Email | `utils/email.js`, Nodemailer Gmail SMTP | Real OTP/reset/reminder/consent/lab/emergency side effects; not called |
| AI | `utils/ai.util.js`, Gemini/Groq SDKs, patient/consultation handlers | Model identifiers/provider availability and data handling not validated by network requests |
| Emergency delivery | `utils/sms.util.js` uses Telegram `fetch` despite SMS name | Optional env config, acceptance/delivery untested; no paid SMS test |
| Native device | Expo image picker/location, Linking dialer in `EmergencySOS.js` | Current local SOS code hardcodes its dialer number; no call/location/device test |
| Payments/orders | `payment`/`order` modules | Local sandbox/status workflows; no real payment/courier service exercised |
| Hosting | `frontend/vercel.json`, `mobile/eas.json`, root checklist | Vercel SPA rewrite/EAS profiles tracked; Render deployment described, no tracked Render/IaC pipeline found |

`backend/server.js` starts reminder and expiry intervals; `db.js` immediately attempts a database connection. Starting the server is therefore not a safe static baseline check. No live `.env` contents were read or copied. Environment variable **names only** are listed in `evidence/inventory-summary.json`; development/provider requirements remain unconfirmed. The README/checklist still refer to a configurable emergency-phone variable that the dirty SOS code no longer consumes. See findings.

## Commands and executed baseline

Manifest commands:

| Scope | Available scripts | Gaps |
|---|---|---|
| Root | None | No combined build/check/test |
| Backend | `start`, `dev`, `check`, `test` | `test` is just `npm run check`; no assertions or DB/API tests. `.eslintrc.js` exists but no lint script/dependency |
| Web | `dev`, `build`, `lint`, `preview` | No test/typecheck script. ESLint 9 flat config, React Hooks/Refresh rules; no formatter check |
| Mobile | `start`, `android`, `ios`, `web` | No test/lint/typecheck/production build script; EAS profiles are remote/native build configuration |

All commands below ran against the dirty snapshot **before any application change**. Results are first-stage baseline evidence; there are no later application regressions to compare yet.

| ID | Actually executed | Result / scope |
|---|---|---|
| B01 | `node scripts/check-syntax.js` in `backend` | PASS, 75 JS files; invokes `node --check` without evaluating app code |
| B02 | `node node_modules/eslint/bin/eslint.js . --format json --output-file ../docs/review/evidence/frontend-eslint.json` in `frontend` | PASS, 89 files, zero errors/warnings; no `--fix` |
| B03 | `node docs/review/tools/static-checks.mjs` | PASS, Vite 8.0.3 production bundle, 2,187 modules; in-memory output, no `.env` loading, synthetic `https://api.example.test` origin |
| B04 | Same review helper, Babel parser | PASS, 30/30 tracked mobile JS files; JSX parsing only, no bundler/device execution |
| B05 | `git -c core.safecrlf=false diff --check` and `git -c core.safecrlf=false diff --cached --check` | PASS, whitespace checks; existing CRLF warnings noted separately |
| B06 | JSON inspection of all four manifests/locks and installed direct packages | PASS, root metadata and all 62 installed direct versions match; no install or registry access |

B03 uses Vite's actual existing config and production graph but `envDir:false`, cleared inherited `VITE_*` values and `build.write:false`. It tests compilation, not actual deployment environment or output-directory writing. Existing `frontend/dist` was not replaced. The emitted in-memory main JS chunk is 1,654,658 bytes, CSS 135,160 bytes; no route splitting was introduced. A non-blocking `rolldown:vite-resolve` plugin-timing warning appeared; no current size-warning claim is inferred from the older documentation.

Results are also in [evidence/check-results.json](evidence/check-results.json), the ESLint/mobile JSON reports and `web-build-summary.json`. The passing checks are limited to syntax/lint/compilation/metadata. No security audit or exhaustive secret/history scan was performed.

### Failures and unavailable checks

**Executed project check failures: none.** The shell's `npm --version` attempt failed because npm is unavailable on PATH; this is an environment limitation, not an application regression. Direct Node invocation provided the safe baseline checks without installing anything.

| Check | Status and requirement |
|---|---|
| Backend/mobile lint | Unconfigured: add an agreed tool/script in a later authorized change; frontend lint does not cover them |
| Type checking | Unconfigured: plain JS/JSX, no project typecheck command/config |
| Unit/integration/E2E | Unavailable as tracked suites; historical manual/isolated check claims were not rerun |
| Clean `npm ci`, `npm test`, registry audit | Not run: npm unavailable; no dependency reinstall or network audit attempted |
| Database/migrations/HTTP sessions | Not run: no confirmed disposable target, complete base schema or synthetic accounts; live config intentionally not used |
| Expo doctor | Not run: no locally configured doctor command/package found, npx unavailable; no download attempted |
| Mobile Metro/native/EAS | Not run: requires selected build/device environment and test configuration; parser pass is insufficient |
| Browser/visual/accessibility/cross-origin sessions | Not run: no safe API fixture environment; builds do not prove user workflows |
| Email/Telegram/AI/payment delivery | Not run: mocks or explicitly isolated provider environments needed |
| CI | No tracked `.github` workflows, GitLab/Jenkins pipeline or equivalent found; hosted UI settings unknown |

Do not upgrade inherited open issues to “fixed” or “failed now” based only on this baseline. Revalidate the transaction and security changes with the exact preserved working copy in Stage 2.
