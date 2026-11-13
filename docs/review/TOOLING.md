# Reusing the review tools

Stage 1B, 2026-11-12. All commands run from the repository root. Python uses the standard library; Node uses already-installed project tools. Nothing starts the Care4U API, loads live `.env` files, installs dependencies, queries a database or sends provider requests.

## Commands

```powershell
python -B -m unittest discover -s docs/review/tools/tests -p 'test_*.py' -v
node --test docs/review/tools/tests/static-checks.test.mjs
node docs/review/tools/static-checks.mjs
python -B docs/review/tools/inventory.py
```

The maintained tests exercise tooling behavior in temporary fixture repositories/directories. They are useful regression deliverables; retain them. Their synthetic failures are intentional and do not report Care4U runtime failures.

## Inventory contract

`inventory.py` requires the existing `evidence/initial-state.json` and never creates/replaces a baseline. Stage 1 evidence files remain historical and unchanged. Refresh writes `FILE_REVIEW_TRACKER.csv`, `evidence/inventory-current.json`, `evidence/source-imports-current.csv` and `evidence/untracked-review-deliverables.csv`.

Human-maintained columns survive refresh verbatim, including review status, verification notes, documentation references, exclusions, original-author decisions, `ownership_decision` and additional custom columns. Existing category/responsibility/evidence fields are retained; `current_*` columns hold refreshed facts separately. `sha256_at_start`, `git_state_at_start` and `baseline_path` describe Stage 1, not the latest commit. New rows have pending review/verification and no invented author. Tooling checks never mark application rows reviewed.

Deleted/untracked historical paths remain rows. A still-tracked missing file records its missing/read-error state. Git rename evidence (committed since the previous refresh, staged or unstaged) carries decisions and prior paths forward. A unique exact-content move can also be inferred when the old path is absent; duplicate matches remain separate pending rows. Similarity guesses, copies and ambiguous filename matches do not silently transfer decisions. Every generated module classification is provisional.

Changed contents preserve old verification notes but invalidate their applicability; that warning remains sticky across subsequent refreshes. A reviewer must explicitly reverify and update applicability. Restored or renamed files still require the reviewer's judgment about relevant prior assertions.

Tracked generated evidence and the tracker itself get path-level rows without content hashes, parsing or source imports. Untracked generated reports/backups are excluded from the deliverables CSV; untracked review source/docs/tests are listed separately until staged/tracked. Thus the tool does not recursively inventory its own generated content. Existing tracked `.vite` files remain accounted for as cache, without adding them to checkpoint changes.

Serialization completes before writes. Replacements use a same-directory temporary file and atomic replace. The tracker is replaced after a byte-identical recoverable backup and a concurrent-edit check; the success summary/rename cursor advances afterward. Backups live in ignored `evidence/tracker-backups/`; the original 283-row tracker is also committed at `ad3b2fd`. A refresh may publish auxiliary CSV facts before a later tracker-write failure, so consumers should use the completed tracker and the refresh command's successful exit together. There is no claim of a multi-file filesystem transaction.

## Static-check evidence contract

`static-checks.mjs` runs six independent required checks: B01 backend syntax, B02 web lint, B03 web compilation, B04 mobile parser, B05 tracked whitespace, B06 direct-dependency metadata. Parser/lint/compilation/metadata are recorded as distinct kinds. Runtime and visual verification are explicitly `NOT_RUN`.

Current reports live under `evidence/static-current/`. At run start, a new `manifest.json` marks the run RUNNING/PENDING and every per-check report is replaced with a pending report. Each receives its exact command/cwd, run ID, UTC start/finish timestamps, scoped source hash/file list, result, exit code and limitations. Missing executables, missing tracked inputs and setup errors become FAIL; other checks continue. Inputs changed during a check yield INVALIDATED. Any required non-PASS makes the command exit nonzero.

**Accept a report only when** its run ID matches the completed manifest, its result is PASS and its source content hash still matches the relevant inputs. A pending/interrupted run cannot reuse a previous PASS; a checked-out old report is historical even if its filename says current. The recorded Git HEAD locates the run; content fingerprints remain the test-evidence identity across later documentation/evidence commits.

Source fingerprints include tracked and nonignored untracked files in each check's scope plus review tooling. They exclude live `.env` files, generated review outputs/tracker and caches. They do not fingerprint dependency directory internals; B06 compares installed direct versions to the lockfiles. The runner clears service/public configuration from child environments. Vite uses existing configuration with `envDir:false`, a synthetic public API origin and `write:false`.

Raw stdout/stderr are not persisted: reports keep lengths/hashes and structured, source-free diagnostics. Node syntax can identify a failure count/exit without preserving its raw source excerpt. Lint diagnostics retain path/line/column/rule/severity; worker failures retain safe error codes. This deliberately limits diagnostic detail to avoid copying sensitive source/configuration into reports. Inspect the named source locally for a failure. These tools are not an exhaustive secret scanner or a network sandbox; inspect future project configuration changes before executing them.

## Stage 3A application UI checks (separate from review tooling)

`node --test frontend/tests/auth-ui.test.cjs` runs 56 actual-source tests with explicit synthetic hooks/import/API/navigation boundaries. The maintained frontend alias is `test:auth`; it works from frontend through `node --test tests/auth-ui.test.cjs`. The helper uses already installed Babel packages under mobile, so both frontend and mobile dependency trees are required. No new dependency was installed. These tests are application regressions, not additions to the 21 review-tooling fixtures, and they do not render React Native or prove cookies/SQL.

`node frontend/tests/serve-auth-fixture.mjs` creates the clearly labelled loopback-only web fixture using installed Vite/React/Tailwind. It disables config/env/public loading, builds in memory and simulates responses without loading backend/db/provider code. Browser matrix/screenshots under `evidence/stage3a/` describe real UI interactions with those synthetic responses. Native and real session/DB/provider/deployment checks remain separate. The static runner still reports runtime/visual NOT_RUN for its own six commands; it does not execute or aggregate the browser fixture and was not expanded to do so.
