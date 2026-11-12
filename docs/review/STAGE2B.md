# Stage 2B: resend integrity and bounded authentication requests

2026-11-12. Entry was clean on `codex/care4u-final-review-2026-11-12` at confirmed Stage 2A final commit `f14aee0c86178b5b14e99d367c5830203efcdd31`. This batch is complete locally and stops for independent review. No branch switch, merge, stash, discard, production connection, schema invention or push retry occurred. The outside-repository manifest records the final commit without a self-referential commit hash in this report.

## Resend defect and fix

`register`, `resendOtp` and `verifyOtp` were read together. Registration intentionally replaces pending registration data by email; verification locks/reads and consumes it inside its account/profile transaction. Resend previously read all pending fields, then upserted that stale snapshot. This could restore an older phone, password hash, role and profile, or insert a row after verification deleted it.

Before fixing source, controlled interleavings reproduced both defects against the unchanged Stage 2A service. [resend-baseline.json](evidence/stage2b/resend-baseline.json) records 2 passes and 8 failed new expectations; these are deliberately failing new defect/contract tests, not failures of the original 67 checks. In particular, the newer-registration and consumed-row cases failed. Other failures include the not-yet-implemented replacement repository contract.

`replacePendingOtp(pendingId,email,code,expiry)` now issues one parameterized `UPDATE`, matching both observed ID and exact email, changing only `otp_code`, `otp_expires_at` and maintenance timestamp. It cannot insert, and does not include identity/password/role/profile columns. No returned row becomes the existing no-pending-registration error (404 at the controller); no email is submitted. A recreated row with a different ID is not targeted. A newer registration update to the same row keeps its newer identity fields.

The service submits email only after the update completes, outside an explicit transaction/held application transaction client. SQL may itself wait for another transaction. A rejected or thrown provider submission becomes the existing `Failed to send OTP email` error (502). The replacement stays stored; no rollback of the code is promised. A successful response means provider-helper submission acknowledgement, not inbox delivery.

Only the code currently stored and still within its deadline can be verified. Replacement normally invalidates the earlier value; random generation can coincidentally produce the same six-digit value. Concurrent resends/registrations may replace it again and emails may complete out of order, so every concurrent email is not guaranteed to carry the final valid code. If verification consumes the row after the update but before delivery, the email can arrive after consumption. Real PostgreSQL locking/interleavings remain pending. Registration replacement and patient/professional approval behavior are unchanged.

## Focused request and attempt safeguards

The installed `express-rate-limit` 8.6.2 is used; no dependency was installed. [auth.limits.js](../../backend/src/modules/auth/auth.limits.js) creates six independent MemoryStores and middleware instances once per router load. The same email-generation instances are shared across register, resend and forgot-password. IP middleware precedes the field middleware and controller.

| Routes / scope | Default budget in `AUTH_RATE_WINDOW_MS=900000` (15 minutes) | Setting |
|---|---|---|
| register + resend + forgot, combined per client IP | 20 | `AUTH_EMAIL_IP_LIMIT` |
| same three routes, combined per address across IPs | 5 | `AUTH_EMAIL_ADDRESS_LIMIT` |
| verify-OTP, per IP | 30 | `AUTH_VERIFY_IP_LIMIT` |
| verify-OTP, per address across IPs | 10 | `AUTH_VERIFY_EMAIL_LIMIT` |
| reset-password, per IP | 30 | `AUTH_RESET_IP_LIMIT` |
| reset-password, per token across IPs | 5 | `AUTH_RESET_TOKEN_LIMIT` |

Settings must be positive safe integers; the window is additionally at most 2147483647 ms for the installed memory-store timer. Invalid explicit values stop startup. Missing settings select defaults, documented in `backend/.env.example`. No live configuration was opened or changed.

Every request reaching a budget counts: valid, malformed, wrong code, successful or downstream failed. No refund occurs for DB/provider errors. An earlier IP rejection does not reach the field budget/controller/provider. Field buckets use SHA-256 of trimmed/lowercase email or trimmed case-sensitive token. Only counting keys are normalized: request bodies, exact database lookups and token validation are unchanged. Raw email/token values are not stored in these store keys; email hashes are guessable and are not anonymization. Missing/empty/non-string fields share an IP fallback. IPv6 IP buckets use the package's default /56 grouping, including fallback keys.

Exhaustion returns 429 `{success:false,message:"Too many authentication requests. Please try again later."}` plus standard rate headers and `Retry-After`. Budgets reset after their configured per-key window; retry is then admitted if the other budget permits. Store errors pass to the generic global 500 handler and do not invoke the controller. Rate responses do not depend on account existence. Existing generic forgot-password behavior and useful OTP 404/502 distinctions remain; this does not eliminate all enumeration/timing differences. Existing login IP 10/15-minute and per-account 5-failure/15-minute lockout rules remain separate and unchanged.

These counters are **per process, volatile and bounded in time**, not global, persistent or a guaranteed memory-capacity ceiling. Restart clears them; workers/instances have independent stores. Attackers can distribute IPs/keys, and address/token budgets can temporarily inconvenience a targeted victim. Shared IPs/NAT can limit legitimate users; successful requests also spend the budget. There is no persistent per-OTP failed-guess counter or account lockout added for OTP. Monitor/tune only after agreed deployment testing; no new external store/infrastructure is introduced.

## Proxy/IP boundary

`app.js` previously trusted one proxy hop in every environment. `TRUST_PROXY_HOPS` now accepts a non-negative safe integer, defaulting to 0 outside production and preserving the previous one-hop default in production. Direct development requests ignore spoofed forwarded IPs. Production is safe only when the chosen count matches a verified, fixed trusted path and direct access/shorter alternate paths are restricted. A numeric hop count alone does not identify a trusted proxy. Do not set trust to `true` or assume the deployment has been validated. The existing production session `proxy:true` flag is retained; forwarded-protocol/cookie behavior needs its own deployment review.

Tests execute the actual Express request-IP resolver using captured app settings and synthetic sockets/headers. They prove local resolution for selected settings, not the deployed network topology, browser cookies, session proxy handling or HTTP end-to-end routing.

## Verification actually performed

| Evidence | Result / boundary |
|---|---|
| `node --test --test-reporter=tap backend/tests/auth-access.test.cjs backend/tests/auth-contracts.test.cjs backend/tests/auth-resend.test.cjs backend/tests/auth-limits.test.cjs` | 89 PASS: all 67 Stage 2A cases retained (resend boundary adapted), 2 added route/proxy contracts, 10 resend cases, 10 limit cases. [TAP](evidence/stage2b/application-tests.tap). |
| Resend cases | Actual service under controlled mutable-repository interleavings; newer identity preservation, consumed/new-ID rows, absent row, success, provider false/throw, write failure, ordering, concurrent email completion, parameterized code-only SQL contract. No real PG. |
| Limit cases | Actual installed middleware and MemoryStore execute on synthetic HTTP objects; allowed/exhausted requests, headers, controlled-time expiry/retry, normalized/shared buckets, IPv6, malformed input, failed downstream attempt counting, store failure and config validation. No mock limiter stands in for accounting. |
| Route/app assembly contracts | Fake route/controller/session/store declarations establish order/settings. Actual Express IP resolver separately exercises synthetic request headers/socket. These are not a listening API/browser integration test. |
| Static checks | B01–B06 current reports/manifest: syntax, web lint, in-memory web build, mobile parse, whitespace, lock metadata. Exact commands, source hashes, times and limitations are in `evidence/static-current/`. |
| Maintained review tooling regressions | 12 Python inventory + 9 Node static-report cases PASS. No review tooling source expanded. |

The first combined development run had one new malformed-input test fail because its helper default substituted a valid email when passed `undefined`; changed that synthetic case to `null`. This was a new fixture error, not a pre-existing application failure. The final 89-case rerun passes. Initial Stage 2A static results were passing; the deliberately failing resend reproduction is recorded separately. Final evidence summary includes source hashes and command outcomes.

No DB/schema/session persistence/rollback/SQL concurrency, real email, browser/device/visual/accessibility, deployed proxy, distributed limiter, npm invocation, clean install or CI acceptance was performed. `npm` remains unavailable on PATH; direct Node commands run the maintained suite. PostgreSQL executables/container tooling were not found on PATH; no verified starting schema/disposable database was supplied. [AUTH_DATABASE_PREREQUISITES.md](AUTH_DATABASE_PREREQUISITES.md) lists exact requirements and safe schema-only handoff instructions. The previous broad schema search was not repeated.

## Open policies and ownership

Password reset still leaves existing sessions active, other unused reset links valid until expiry/use, and login lockout untouched. Another valid link can change the password again. Legacy/unverified patient admission remains as described in Stage 2A; no blanket verified-patient gate was added. Missing profiles can produce a session with `profile_id:null` whose downstream ownership access denies; same-role profile-link changes can leave a stale session profile. These are unresolved policies, not closed findings. Raw OTP/reset-token storage, CSRF/origin policy, enumeration/timing, consent-category semantics and unrelated module/UI findings remain open.

Existing auth Idirisinghe S/21/389 and app Wasana S/21/081 credits are preserved. The S/21/389 display-name discrepancy remains uncertain. The new limiter/tests explicitly credit review-assistant implementation; no student author is inferred from module maintenance. Tracker rows distinguish source, isolated/middleware execution, DB and visual categories. No unrelated UI/module review is marked complete.

## Local commits and independent-review handoff

Commit scopes are coherent application fix/tests/config followed by documentation/evidence/tracker; exact hashes are available in Git and the ZIP manifest. All remain local; branch has no upstream. The previous automatic approval review rejected pushing to GitHub because that destination was not established as trusted for source/artifact export and lacked specific approval. No push retry or alternate route was attempted in Stage 2B.

New archive: `C:\Users\Waasana\.codex\visualizations\2026\11\12\01a1cfb2-a394-7811-9795-1e79790000a9\Care4U-Stage2B-Handoff.zip`. It contains complete scoped source/config/tests with repository paths, diff from `f14aee0c86178b5b14e99d367c5830203efcdd31`, this report, schema prerequisites, updated review/viva notes and tracker, test/static results, and a baseline/final/file-hash manifest. Live config, secrets, patient records, dependencies and build output are excluded. Stage 2A archive is retained.

Next: independent review of Stage 2B, then obtain verified sanitized schema/provenance, a clearly disposable local PG environment, and deployment proxy topology evidence for acceptance. Explicit decisions are needed before changing the unresolved recovery/legacy/profile policies. Stop here; do not start other modules automatically.
