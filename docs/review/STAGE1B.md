# Stage 1B preservation and tooling report

2026-11-12, Asia/Colombo. Branch: `codex/care4u-final-review-2026-11-12`.

## Entry reconciliation

Original HEAD: `eeacffb0100288c7b89f5bddc33ffc917d6970b0`. At Stage 1B entry, all **290** original Stage 1 paths matched their SHA-256 values: 283 tracked files and seven historical reports. No tracked path had been added/deleted, and all 44 inherited application edits were still unstaged with no staged changes. The additions since the Stage 1 snapshot were the review deliverables created during Stage 1. `evidence/stage1b/entry-reconciliation.json` records every entry hash and added path.

No application contents were changed in Stage 1B. No stash/reset/clean/history rewrite/pull/merge/worktree or live-service test was performed. The user explicitly authorized branch creation, preservation commits and review-branch push. Git author for the checkpoints is the neutral `Codex Review Assistant <codex-review@users.noreply.local>`; no student's Git identity or source authorship was assigned to the review assistant.

## Preservation checkpoints

| Commit | Exact concern / path count |
|---|---|
| `a7c074b` | 15 inherited authentication/approval/reset and published-content contract files |
| `a3bcac6` | 10 inherited clinical workflow files: booking/dispensing/lab transactions, pharmacy QR; shared controllers also contain existing consent-note/chat-audit edits |
| `cc499f3` | Five inherited SOS/logging files, including placeholder-only mobile `.env.example` |
| `a609f07` | 14 inherited presentation, naming and source-header edits |
| `ad3b2fd` | 29 Stage 1 documentation/tool/evidence paths and labelled historical reports; recoverable original tracker/tooling |

The **exact path list, full commit hash and scope of each checkpoint** are in [evidence/stage1b/preservation-commits.json](evidence/stage1b/preservation-commits.json). Every path was explicitly selected, staged-path sets were checked, and the 44 inherited application paths were grouped once each. Whole files were preserved instead of splitting existing mixed-concern controller hunks or changing their contents. Static checks do not certify these inherited behavior changes.

Historical reports remain byte-identical and have a new directory README warning about superseded scope/results. Heuristic publication scanning found only two password-validation error-string false positives, manually inspected. Historical reports contained no email-address/phone-number/data-insert matches in the additional text check. This is limited inspection, not an exhaustive secret/history/PII certification. No live configuration, dependency directories, generated cache changes, unrelated artifacts or patient exports were staged.

## Tooling changes and verification

- Inventory refresh preserves review statuses, notes, documentation, exclusions and ownership decisions. Baseline/current fields are distinct. New rows are pending; deleted rows remain historical. Evidence-backed renames retain history, while ambiguous copies do not inherit it. Missing files are recorded and atomic writes retain recoverable copies. Generated output contents never recursively feed the inventory.
- Static checks have independent command/timestamp/source-snapshot/result/limitation reports, with no live `.env` loading or application service startup. At rerun start, current evidence becomes pending, preventing stale PASS reuse after failure/interruption. Required failures produce nonzero command status. Runtime and visual checks stay `NOT_RUN`.
- **21 maintained tooling fixtures passed:** 12 Python inventory tests and nine Node evidence/runner tests. They cover retained completed rows, new/deleted/missing paths, staged Git renames, ambiguous copies, atomic-write/concurrent-edit rejection, failure-safe rename cursor, immutable baseline, separate untracked deliverables, nonrecursive outputs, failed rerun, changed inputs, missing executables/inputs, independent continuation, source snapshots and real failing CLI status. Intermediate fixture failures were corrected before the final passing runs; they were not Care4U regressions.
- All six actual static checks B01–B06 passed with the new runner. Backend syntax (75 files), web lint (89 files, zero errors/warnings), web production compilation (2,187 modules), mobile parse (30 files), tracked whitespace and 62 direct-dependency metadata comparisons remain distinct. Current per-check evidence is under `evidence/static-current/`; original Stage 1 reports are unchanged.

See [TOOLING.md](TOOLING.md) for safe reuse, report freshness rules, snapshot limitations and fixture commands. No application row is marked reviewed from inventory or check inclusion.

## Blockers and next work

No verified complete base schema was found in the searched project material. Only six incremental migrations and an adapter-provided session-table fragment are available; version/schema/constraint/RLS contracts are not established. No database or production export was queried. npm remains unavailable on this shell's PATH; no dependency install was attempted. Browser/device/provider/runtime assertions and inherited H/M findings remain open. No ownership uncertainty was silently resolved.

[NEXT_STAGE_PLAN.md](NEXT_STAGE_PLAN.md) gives per-module UI/copy standards, guide 3.2–3.4 commenting work, ownership/viva tasks, exact schema prerequisites, disposable DB cases and mocked provider boundaries. The next bounded batch is isolated auth/approval/session/patient-ownership policy fixtures and documentation. Database concurrency and browser/device tests follow only after their verified environments exist.

## Publication restriction

The push attempt to `origin` (`https://github.com/shamilaw-sci/CSC3213_20_Group_D.git`), targeting only `codex/care4u-final-review-2026-11-12`, was rejected by automatic approval review before process creation. The stated reason was that the GitHub destination was not established as trusted for exporting private source/review artifacts and this specific sensitive egress was not explicitly approved in the trusted transcript. All completed work remains committed locally; no upstream was created and no alternate route was attempted. User approval for this exact branch/destination is required before retrying. Develop/main and their local remote-tracking refs remain unchanged.
