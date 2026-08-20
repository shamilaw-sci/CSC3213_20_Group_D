# Epic Progress: CARE4U-116 & CARE4U-117 — Web Forgot/Reset Password

**Member:** I.M.L.S. Idirisinghe (S/21/389)
**Date:** 2026-08-19
**Status:** Done (verified, no code changes required)

## Summary

Both tickets were found to already be fully implemented, wired into routing,
committed, and merged into `develop` (commit `75f59e8`, on
`origin/feature/CARE4U-116-web-forgot-password-screen`) prior to this
session. No new code was written. This session consisted entirely of
end-to-end manual verification against a live backend + Supabase instance,
since the existing project notes did not reflect that this work was
complete.

## What was verified

**Frontend**
- `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- `frontend/src/pages/auth/ResetPasswordPage.jsx`
- `frontend/src/services/auth.service.js` (`forgotPassword`, `resetPassword`)
- Routes `/forgot-password` and `/reset-password` in `App.jsx`

**Backend**
- `POST /api/auth/forgot-password` (`forgotPasswordController` → `forgotPassword` service)
- `POST /api/auth/reset-password` (`resetPasswordController` → `resetPassword` service)

## Test results

| # | Test | Result |
|---|------|--------|
| 1 | Forgot-password with an existing, verified user | ✅ Pass — reset token generated and logged server-side |
| 2 | Forgot-password with a non-existent email | ✅ Pass — identical generic success message returned (email enumeration protection confirmed) |
| 3 | Reset-password with a valid, unused token + valid new password | ✅ Pass — password actually changed; confirmed by logging in with the new password and reaching the doctor dashboard |
| 4 | Reset-password reusing an already-used token | ✅ Pass — rejected with "Invalid or expired password reset token" |
| 5 | Reset-password page loaded with no `token` in the URL | ✅ Pass — "This reset link is missing or invalid" warning shown |
| 6 | Reset-password with password under 8 characters | ✅ Pass — "Password must be at least 8 characters" shown client-side, no network call made |
| 7 | Reset-password with mismatched password/confirm fields | ✅ Pass — "Passwords do not match" shown client-side, no network call made |

All 7 test cases pass. No bugs found in either ticket's own code.

## Test environment / method

- Backend run locally via `npm run dev` against the team's shared Supabase Postgres instance, on `develop` after pulling latest (`8daacc2..595fb30`, 60 commits, fast-forward).
- Frontend run locally via `npm run dev` (Vite, `http://localhost:5173`).
- Since no real email delivery is wired up yet (`forgotPassword` currently `console.log`s the reset token instead of emailing it — see Known Issues in the main dev guide), reset tokens were read directly from the backend terminal and used to manually construct `/reset-password?token=...` URLs.
- Test account used: a freshly registered **doctor** account (`testdoctor0819@gmail.com`), created and OTP-verified via direct `POST /api/auth/verify-otp` calls (PowerShell `Invoke-RestMethod`), since verifying via the web UI was not possible — see Issues Found below.

## Issues found (out of scope for CARE4U-116/117 — flagged for the team, not fixed)

These were discovered incidentally while setting up test accounts, and are unrelated to the forgot/reset password code itself, which is confirmed correct.

1. **No web OTP verification screen exists.** `RegisterPage.jsx` shows a
   "Registration successful! Please login." alert and redirects straight to
   `/login` without ever collecting an OTP. Since `verifyOtp()` is what
   actually creates the `users` row, **no account registered through the
   web app can currently log in** unless the OTP is submitted manually via
   a direct API call. The mobile app has `OtpVerificationScreen.js`; the
   web app has no equivalent page or route.

2. **Web patient registration fails with a 500 error.** The patient step
   of `RegisterPage.jsx` (Step 2 of 2) only collects Full Name and NIC
   Number — there is no Date of Birth field. Backend `createPatient`
   requires `date_of_birth` (`NOT NULL` constraint), so submission always
   throws `null value in column "date_of_birth" ... violates not-null
   constraint` (Postgres code `23502`), surfaced to the controller as a
   500. This is the same class of bug the CARE4U-134 work already fixed
   on **mobile** (`generatePatientQR()` + a DOB field on
   `mobile/src/screens/RegisterScreen.js`) — the fix does not appear to
   have been ported to the web register page. Web **doctor** registration
   is unaffected (no DOB requirement).

3. **`backend/.env.example` is out of date.** It still documents the old
   Nodemailer pattern (`EMAIL_USER` / `EMAIL_PASS`), but
   `backend/src/utils/email.js` now uses Resend and reads
   `RESEND_API_KEY` at module load time with no fallback — an empty/missing
   key crashes the entire backend on startup (`Error: Missing API key`),
   even for developers with no involvement in the notification features
   that use it (lab reports, appointment reminders, emergency alerts).
   `.env.example` should be updated to include `RESEND_API_KEY`.

## Next steps

- [ ] Update Jira: CARE4U-116 and CARE4U-117 → Done
- [ ] Raise issues 1–3 above as new Jira tickets (or flag to whoever owns `RegisterPage.jsx` / `email.js`) — not part of this epic
- [ ] Confirm whether CARE4U-141 (Resend OTP, mobile) is merged into `develop` — status still unconfirmed as of this session
