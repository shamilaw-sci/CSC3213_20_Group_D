# Stage 2A: authentication, sessions and patient access

2026-11-12, Asia/Colombo. Stop after this batch for independent review.

## Baseline, scope and commits

Entry HEAD was **`245887bcd41b091a5375a79d7932c98c89c2f5ae`**, the final Stage 1B checkpoint. The review branch was clean and had no subsequent changes; `develop`/`main` were not switched/merged. Work continued on `codex/care4u-final-review-2026-11-12`. No unrelated work was found or staged. The prior automatic push rejection remains in force; no new explicit destination approval was supplied and no retry/alternate route was attempted.

| Commit | Scope |
|---|---|
| `150fec1` | Six auth/session source fixes and three maintained application regression files; 67 isolated cases passed before commit |
| `8c7908b` | Backend `test:auth` script and default test wiring; no dependencies/lock resolutions changed |
| `438c8a1` | Separate comments on 13 auth/session/client files; executable ASTs unchanged from the behavioral batch |
| Final documentation/evidence commit | Read the handoff manifest / `git log` for its exact final hash; it includes this report, file coverage, findings/ownership and viva sample |

Exact changed paths are available through `git diff --name-status 245887b HEAD`, the handoff manifest and application patch. Source authorship remains distinct from the neutral review-assistant Git author. No application behavior was attributed to a student just because they maintain that module.

## Confirmed findings and fixes

Each row distinguishes expected behavior from observed pre-fix behavior. Fixed here means source change plus isolated regression evidence; it does not close the corresponding live-runtime acceptance checks.

| ID / impact | Affected paths and symbols | Expected / observed before fix | Change / evidence |
|---|---|---|---|
| A2-01 / high | `middleware/auth.js`: `isAuthenticated`, `authorize` | An account role change must not keep old privileges. Fresh DB role was queried but downstream authorization still used the stale session role; a demoted admin could retain admin allowance | Role mismatch removes/destroys session identity and returns 401. Missing identity in `authorize` now gives 401 instead of throwing. Isolated stale-admin/negative guard cases pass; real store/cookie invalidation pending |
| A2-02 / high | `auth.controller.js`: login/OTP + `saveAuthenticatedSession` | Authenticated identities should receive a new session ID, and success must wait for storage. Login reused anonymous ID; OTP also responded without explicit save acknowledgement; save failure could leave an in-memory user | Regenerate -> assign limited user -> save; failure removes user and attempts destruction. Callback lifecycle/failure and patient/pending-professional cases pass; Express/store end-to-end pending |
| A2-03 / medium | `utils/otp.js`; `auth.service.js`: `verifyOtp` | A verification secret needs a cryptographic source and an unexpired deadline. Math.random was used; exact deadline/invalid date could pass | Node crypto randomInt retains six-digit contract; finite deadline must be strictly future. Deterministic cases pass. Registration attempt limits/raw storage remain open |
| A2-04 / high | auth service/repository: `verifyOtp`, `findOtpByEmail`, `withTransaction` | Verification must operate on the pending data it consumes. Pending row was read before its creation/deletion transaction, permitting a resend/verify race in the requested operation sequence | Read/lock pending row on the same transaction client before checks/create/delete. Client propagation and sequential replay tests pass. Actual row locks, constraints, rollback and concurrency PENDING DB |
| A2-05 / high | auth service/repository: `resetPassword`, token/password helpers | Password replacement and token consumption must be one operation. Separate pool writes allowed partial completion and token replay races | Valid token row lock, password update and guarded consumption share one transaction; no consumed row rejects. Control flow/query/client contract and sequential replay/write-failure cases pass. Real atomicity PENDING DB |
| A2-06 / medium | auth controller: all six input endpoints | Malformed JSON fields should be validation failures, not provider/DB operations or accidental 500s. Numbers/objects/arrays could bypass length/presence tests or fail late | Require nonempty string scalar fields, optional object profileData, six-digit OTP and generated reset-token shape; keep status envelope. Six malformed-input handler cases pass. Full email/phone/profile-domain validation still pending |
| A2-07 / medium | auth service/controller: `login`, recovery helpers/logs | Account-state details should not be returned before password verification. Inactive/pending/rejected messages preceded password comparison; thrown email transport errors also distinguished known recovery accounts | Non-locked account-state details follow correct password; wrong password increments normally. Recovery transport failures use generic response; controller logs use error name/code. Tests pass. Lockout/timing distinctions and registration/resend enumeration remain open |
| A2-08 / medium | `backend/app.js`: `sessionMaxAge` | Invalid configured lifetime should be rejected. Negative/partially numeric values were accepted by parseInt/fallback behavior | Positive safe-integer validation, one-day default preserved; invalid/missing-production-config and cookie option fixtures pass. Actual expiry/provider configuration remains pending |
| A2-09 / low | auth controller: `logoutController`, registration message | Logout without a session should be safe; registration should name its actual channel. Handler dereferenced missing session; copy implied a generic contact channel | Missing session is idempotent; success still waits on destroy when present; message says email. Lifecycle tests pass; no visual/device test |

The initial 48-case suite ran against unchanged Stage 1B application source and recorded **28 pass / 20 fail**. Those are failing regression expectations, not 20 separate clinical defects or proof of an exploit. The final suite contains 67 cases, all passing, including additional route/config/consent/dependency contracts. Baseline failure names are in `evidence/stage2a/baseline-regressions.json`.

## What was reviewed

The 14 core file references cover auth routes/controller/service/repository, auth/patient-resource middleware, OTP utility, app session/CORS assembly, web/mobile API clients, auth service wrappers and stores. The app is **partial at whole-file level**: unrelated mounted-module behavior remains pending. The other 13 core files have a source-level auth/permission review, with runtime gaps explicit.

Patient routes, consent/record access paths, web/mobile App guards and authentication screens were followed only far enough to validate callers, wording, assignment/category boundaries and response handling. Their clinical features, full UI/accessibility and uninspected functions remain pending. The tracker records category-specific states instead of marking entire modules complete. The new tests and package script are separately accounted for.

File/function/component comments follow guide 3.2–3.4 where the core files were updated: purpose, inputs, outputs, permissions, side effects and failure boundaries. No strict JSON comments were added. Original headers were retained. Creation patches and Git lineage support current credits but S/21/389's naming discrepancy remains unresolved. An exact web-to-mobile auth-store copy was investigated rather than treating the copied-path introduction candidate as a literal mobile creation commit.

## Wording and UI/accessibility

Source wording was inspected for email vs SMS, account verification vs approval, failure/status distinctions and success timing. The backend registration response now names email; login/OTP session success is gated by acknowledgement. Web/mobile login/forgot/reset wrappers and relevant handlers were traced, but no broad UI redesign or clinical wording change occurred.

Source-visible remaining issues: web OTP navigates to login although a patient session may already exist; mobile clears local state in logout's finally even on server failure; some web auth controls lack a form wrapper and need keyboard/label verification; mobile has no startup session hydration. Generic recovery messages must not be treated as delivery confirmation. **Visual, browser, accessibility and native device verification: NOT_RUN.** No suitable isolated rendered/API/device environment was established, and no consistency/accessibility pass is inferred from JSX or build results.

## Verification and limits

| Command / inspection | Result and what it proves |
|---|---|
| `node --test --test-reporter=spec backend/tests/auth-access.test.cjs backend/tests/auth-contracts.test.cjs` | 67 PASS; actual source executed behind exact mocked imports, deterministic Date, synthetic identities and denied unexpected network/timer/config imports |
| `node backend/scripts/check-syntax.js` | 75 backend JS files PASS; `.cjs` tests separately execute under the Node runner |
| `node docs/review/tools/static-checks.mjs` | Independent B01 syntax/B02 lint/B03 compilation/B04 parser/B05 whitespace/B06 metadata reports; final results/source fingerprints included in handoff |
| `python -B -m unittest discover -s docs/review/tools/tests -p 'test_*.py' -v` and `node --test docs/review/tools/tests/static-checks.test.mjs` | Existing maintained inventory/evidence tooling regression checks retained; no review-infrastructure expansion |
| Babel AST comparison of the comment-only batch | 13 files' executable ASTs identical after removing comments/source positions; `comments-only-ast.json` records exact paths and comparison commit |
| Original ownership/creation and copy investigation | 14 core paths recorded in `ownership.json`; no identity reassignment or unsupported sole-author claim |
| `git diff --check` and final staged diff/coverage inspection | No accidental unrelated path/permission feature removal identified; exact file coverage in tracker/manifest |

No live dotenv config, DB connection, email/Telegram/AI/storage/payment request, listener, session cleanup, reminder/expiry job, deployment, production query or data export ran. The VM harness uses explicit substitutes **before** loading source. Unexpected imports throw. It is a controlled test harness for trusted project code, not a security sandbox for hostile code.

Mocked SQL checks prove command/argument/client intent only. PostgreSQL schema/constraints/persistence/locking/rollback/concurrency, actual express-session cookie behavior, real rate limiter accounting, provider delivery and browser/native access remain unverified. No speculative schema was created. npm is still unavailable on PATH; direct Node equivalents were executed. `npm test` now includes syntax plus `test:auth`, but that npm invocation itself was not claimed executed.

## Open findings and policies

- Inherited H01/H04/H07 have better isolated evidence but remain open for DB/browser/device acceptance. H02 public content and all unrelated H/M findings stay outside this batch's closure scope.
- M01 remains open: registration/recovery OTP attempts/route limiting, raw OTP/reset storage, timing/response distinctions and token lifecycle hardening need a compatible design. Crypto randomness and transactional consumption fix only part of that concern.
- Password reset currently leaves other tokens, sessions and lockout untouched. Global session revocation, reset-triggered unlocking and invalidation of every older link require explicit compatibility/policy decisions. The absence of revocation is source-confirmed, not silently presented as safe account-wide recovery.
- Patient pending/legacy unverified flags, account profile-link changes and missing linked profiles need agreed rules. Do not infer these from student responsibility tables or old guide aspirations.
- Consent remains category-text based; `is_confidential` does not independently authorize/hide a record. Consent grant mutation atomicity and the formal category policy remain pending. The filter also relies on caller ownership/role guards.
- CORS is not a tested CSRF defense; proxy/cookie behavior and global error-log redaction still need targeted deployment review. Authentication log reductions do not close all audit/privacy concerns.
- The verified executable base schema is still missing. This blocks real DB acceptance but did not block this source review, isolated tests, comments or viva sample.

## Documentation and independent-review handoff

- [Authentication/session/access explanation and viva questions](../viva/02-authentication-and-access.md).
- [Complete core file reference and explicitly partial dependency traces](../viva/02-authentication-file-reference.md).
- [Requested-change/Ctrl+F/permission/verification map](../viva/02-authentication-change-map.md).
- Updated progress, findings, ownership and category-specific tracker.
- Stage 2A ZIP outside the repository: `C:\Users\Waasana\.codex\visualizations\2026\11\12\01a1cfb2-a394-7811-9795-1e79790000a9\Care4U-Stage2A-Handoff.zip`. The archive manifest records the exact baseline/final commits, full included source paths/hashes, tests/evidence and application diff. Credentials/live env/dependencies/build output/patient data/unrelated files are excluded.

Recommended next bounded batch, **after independent review**: verify the sanitized base schema and session-store contracts, then run disposable DB/session/cookie acceptance for these same auth/consent paths. If schema remains unavailable, resolve the listed legacy-account/session-revocation policies and implement only an agreed, fixture-covered auth follow-up. Do not automatically begin the remaining modules.
