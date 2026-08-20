# Epic Progress: CARE4U-204 — Account Lockout & Brute-Force Protection

**Member:** I.M.L.S. Idirisinghe (S/21/389)
**Date:** 2026-08-20
**Status:** Done (pending PR review/merge)

## Summary

Adds two independent layers of brute-force protection to the login
endpoint: per-account lockout after repeated failed attempts
(CARE4U-206), and per-IP rate limiting on the endpoint itself
(CARE4U-207), backed by two new columns on `users` (CARE4U-205). All
lockout/rate-limit responses use the same generic messaging already
established by `forgotPassword` — the caller cannot distinguish "wrong
password" from "account locked" from "rate limited," beyond the 429
status code itself which is inherent to rate limiting and does not
reveal anything about the account.

## Child tickets

| Ticket | Description | Status |
|---|---|---|
| CARE4U-205 | Add `failed_login_attempts` / `locked_until` columns to `users` | Done |
| CARE4U-206 | Enforce lockout logic in `login()` | Done, PR #25 open |
| CARE4U-207 | Rate-limit `/api/auth/login` by IP | Done, PR #27 open |

## Configuration

- Lockout threshold: 5 consecutive failed attempts
- Lockout cooldown: 15 minutes
- Rate limit: 10 requests per IP per 15-minute window (`express-rate-limit`, in-memory store)

## Test results

| # | Test | Result |
|---|------|--------|
| 1 | 5 consecutive wrong-password attempts on a real account | ✅ Pass — `failed_login_attempts` reached 5, `locked_until` set ~15 min in the future |
| 2 | Login with the **correct** password while locked | ✅ Pass — still rejected with the generic "Invalid email or password" message; lockout is checked before the password comparison |
| 3 | Manually expire `locked_until` (simulating cooldown passing), then login with correct password | ✅ Pass — login succeeds |
| 4 | Successful login after lockout expiry | ✅ Pass — `failed_login_attempts` reset to 0, `locked_until` cleared to `NULL` |
| 5 | 11 rapid requests to `/api/auth/login` from the same IP | ✅ Pass — requests 1–10 reached the controller normally; request 11 returned `429` with `{"success":false,"message":"Too many login attempts. Please try again later."}` |

All 5 test cases pass.

## Test environment / method

- Backend run locally via `npm run dev` against the team's shared Supabase Postgres instance, on `develop`.
- Failed-attempt state verified directly against the database (not just HTTP responses), via Supabase SQL editor, since the account-lockout response is intentionally identical to a normal wrong-password response.
- Rate-limit test used a PowerShell loop sending 11 sequential requests and capturing each response/status individually.
- Test account: `testdoctor0819@gmail.com` (created earlier this session, verified doctor role).

## Known limitations (acceptable for this project, noted for completeness)

- The rate limiter's default store is **in-memory**, so the counter resets on every backend restart and would not be shared across multiple server instances in a real production deployment (e.g. behind a load balancer). A shared store (e.g. Redis) would be the production-grade fix; out of scope for this academic project.
- Lockout cooldown (15 min) and rate-limit window (15 min) are currently hardcoded constants in `auth.service.js` / `auth.routes.js`, not configurable via `system_settings` — that configurability is separately covered by epic 7.14 (Admin — System Settings Panel), not yet started.

## Next steps

- [ ] Get PR #25 (CARE4U-206) and PR #27 (CARE4U-207) reviewed and merged into `develop`
- [ ] Update Jira: CARE4U-204 (epic), CARE4U-205, CARE4U-206, CARE4U-207 → Done, once merged
- [ ] Consider a future ticket to move lockout/rate-limit constants into `system_settings` once epic 7.14 exists
