# Care4U Deployment Checklist

Use this checklist for the `fix/deployment-readiness` branch before creating any deployment or merge request. Never place credential values in this file or in Git.

## 1. Required services

- [ ] PostgreSQL database is reachable from Render.
- [ ] Required schema and migrations `001`, `003`–`007` have been applied in order.
- [ ] Supabase Storage buckets used by patient/doctor photo uploads exist and have the intended server-side access policy.
- [ ] Vercel project root is `frontend`.
- [ ] Render service root is `backend`; build command is `npm ci`; start command is `npm start`.
- [ ] Optional Expo/EAS project root is `mobile`.

## 2. Render backend environment variables

Set names only in the Render dashboard; never commit values.

- [ ] `NODE_ENV=production`
- [ ] `PORT` (normally supplied by Render)
- [ ] `DATABASE_URL`, or all of `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- [ ] `SESSION_SECRET` (long, random, production-only)
- [ ] `SESSION_MAX_AGE_MS`
- [ ] `CLIENT_URL` (canonical Vercel origin)
- [ ] `CORS_ALLOWED_ORIGINS` (comma-separated exact origins; include preview origins only if intentionally supported)
- [ ] `EMAIL_USER` and `EMAIL_PASS`
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY` and/or `GROQ_API_KEY` for AI features
- [ ] `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` if SOS Telegram delivery is enabled
- [ ] `SHOW_AUTH_CODES_IN_CONSOLE=false`

## 3. Vercel web environment variables

- [ ] `VITE_API_URL` is the public HTTPS Render origin, without a trailing slash.
- [ ] The same Vercel origin is present in backend `CORS_ALLOWED_ORIGINS`.
- [ ] Production, Preview, and Development scopes are configured deliberately.

## 4. Expo/EAS environment variables

- [ ] `EXPO_PUBLIC_API_URL` is an HTTPS API origin reachable from the device.
- [ ] `EXPO_PUBLIC_EMERGENCY_PHONE` is configured if the mobile SOS contact shortcut is in scope.
- [ ] No production build relies on `localhost`.

## 5. Cookie/session verification

- [ ] Render terminates HTTPS and Express has `trust proxy` enabled.
- [ ] Login response sets the session cookie with `HttpOnly`, `Secure`, and `SameSite=None` in production.
- [ ] Browser requests send credentials and CORS returns the exact requesting origin with credentials enabled.
- [ ] PostgreSQL `session` table is writable and session persistence survives a backend restart.
- [ ] Login, `/api/auth/me`, logout, and a second `/api/auth/me` request behave correctly from the deployed Vercel site.

## 6. Security and data checks

- [ ] Rotate the previously source-embedded Telegram bot token before deployment.
- [ ] Confirm the deleted reviewer environment file is not copied into deployment artifacts.
- [ ] Run a repository and Git-history secret scan.
- [ ] Verify patient A cannot request patient B profile/history/orders/payments by changing a UUID.
- [ ] Verify doctor A cannot update doctor B or access doctor B appointments/reports.
- [ ] Verify lab A cannot update requests assigned to lab B.
- [ ] Verify pharmacy A cannot update or list orders belonging to pharmacy B.
- [ ] Verify patient cancellation and doctor appointment transitions follow allowed states.
- [ ] Verify admin endpoints reject every non-`admin` account.

## 7. Release commands

From `backend`:

```bash
npm ci
npm run check
npm start
```

From `frontend`:

```bash
npm ci
npm run build
```

Optional mobile smoke check from `mobile`:

```bash
npm ci
npx expo-doctor
```

## 8. Post-deployment smoke test

- [ ] `GET /api/health` returns HTTP 200 and `{ "status": "ok" }`.
- [ ] Public doctor/laboratory discovery and health content load.
- [ ] Patient registration, OTP, login, session restoration, and logout work.
- [ ] Patient profile, records, prescriptions, reports, appointments, orders, and payments load.
- [ ] Doctor queue and consultation open only for assigned appointments.
- [ ] Consent OTP locks/unlocks only the chosen categories during the active consultation.
- [ ] Prescription QR verification and dispensing work for an authenticated pharmacist.
- [ ] Hospital OPD and emergency dashboard requests work for the linked hospital account.
- [ ] Admin approval, audit, settings, analytics, and QR reissue pages load.
- [ ] Logs contain no OTPs, credentials, session IDs, or full sensitive records.

## 9. Release decision

- [ ] Backend syntax check passes.
- [ ] Frontend production build passes.
- [ ] No current source secret scan findings remain.
- [ ] Database migration backup/rollback plan exists.
- [ ] Non-blocking bundle-size warning is accepted or separately scheduled.
- [ ] Deployment URLs are recorded in the README only after they are known.
