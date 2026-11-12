# Care4U — Centralized Healthcare Ecosystem

Care4U is the CSC3213 Group D university healthcare project. It connects patients, doctors, pharmacies, laboratories, hospitals, emergency workflows, and administrators through a shared PostgreSQL-backed API, a React web portal, and an Expo mobile application.

## Team

| Student ID | Name | Primary area |
|---|---|---|
| S/21/389 | Lasitha Sanuth | Authentication, sessions, RBAC |
| S/21/081 | Wasana Karunanayaka | Patient, privacy, hospital/emergency |
| S/21/166 | Tharindu Lakshan | Doctor, appointments, consultation |
| S/21/001 | Pamudika Abayarathna | Prescription, pharmacy, orders/payments |

## Architecture

```text
React/Vite web (Vercel)          Expo mobile (EAS)
             \                    /
              HTTPS + session API
                       |
                  Express (Render)
                       |
 Route -> Controller -> Service -> Repository -> PostgreSQL
                       |
        Supabase Storage / email / AI / Telegram
```

Authentication uses `express-session` with `connect-pg-simple`; Care4U does not use JWTs. Backend route/RBAC and object-ownership checks are authoritative. In production, Vercel-to-Render sessions use credentialed CORS, secure cookies, `SameSite=None`, and Express proxy trust.

## Main features

- Registration, OTP verification, professional approval, login/session restoration, logout, password reset, and active-account enforcement.
- Patient profile, medical records, allergies, conditions, medical devices, health background, family history, vaccinations, prescriptions, laboratory reports, appointments, payments, and order tracking.
- Doctor discovery, availability, queue, consultation workspace, structured notes, patient-consent OTP access, prescription creation, interaction warnings, and laboratory orders/review.
- Pharmacy registration/approval, QR verification, dispensing, dashboard, history, and medicine-order workflow.
- Laboratory registration/approval, assigned request queue, status updates, and finalized reports.
- Hospital profile, OPD check-in, assisted registration, walk-in assignment, and emergency dashboard.
- Patient SOS, break-glass snapshot/access logging, live alerts, and resolution.
- Admin approval/accounts, RBAC reference, audit logs, emergency oversight, health content, analytics, QR reissue, and system settings.
- Guardrailed AI summaries/chat with provider fallback when configured.

## Technology

| Layer | Technology |
|---|---|
| API | Node.js, Express 5 |
| Database/session store | PostgreSQL, `pg`, `connect-pg-simple` |
| Web | React 19, Vite 8, React Router, React Query, Axios, Tailwind CSS |
| Mobile | React Native 0.81, Expo SDK 54, Zustand, Axios |
| Storage/integrations | Supabase Storage, SMTP, Gemini/Groq, Telegram (optional) |

## Repository layout

```text
backend/    Express API, migrations, modules, middleware, jobs
frontend/   React/Vite web application
mobile/     Expo mobile application
docs/       Review notes and screenshots
CARE4U_VIVA_CODE_GUIDE.md
CARE4U_DEPLOYMENT_CHECKLIST.md
```

Backend modules follow the same flow:

```text
*.routes.js -> *.controller.js -> *.service.js -> *.repository.js -> PostgreSQL
```

## Prerequisites

- Node.js 20 or newer and npm 10 or newer.
- PostgreSQL with the Care4U base schema.
- Supabase project/storage when upload features are required.
- Expo Go or an EAS setup for mobile testing.

## Local setup

Clone the repository and remain on the intended working branch. Do not commit any `.env` file.

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run check
npm run dev
```

Apply the project base schema first, then apply files in `backend/migrations` in numeric order. `GET /api/health` is the health-check endpoint.

Backend environment variable names:

- Runtime/database: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Browser/session: `CLIENT_URL`, `CORS_ALLOWED_ORIGINS`, `SESSION_SECRET`, `SESSION_MAX_AGE_MS`.
- Email: `EMAIL_USER`, `EMAIL_PASS`.
- Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- AI: `GEMINI_API_KEY`, `GROQ_API_KEY`.
- Optional emergency delivery: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- Development diagnostics: `SHOW_AUTH_CODES_IN_CONSOLE` (must be false/unset in production).

### Web frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Set `VITE_API_URL` to the backend origin. The central configuration is `frontend/src/services/api.js`; do not hardcode API origins in pages/components.

Production verification:

```bash
npm run build
```

### Mobile

```bash
cd mobile
cp .env.example .env
npm ci
npm start
```

Set `EXPO_PUBLIC_API_URL` to an origin reachable from the emulator/device. A production build fails fast when it is missing. `EXPO_PUBLIC_EMERGENCY_PHONE` is optional for the emergency contact shortcut.

## Roles

The implemented role names are:

- `patient`
- `doctor`
- `pharmacist`
- `lab_technician`
- `hospital_staff`
- `emergency_staff` (supported emergency operations)
- `admin`

Do not introduce aliases in routes or database data without a migration and coordinated application change.

## API overview

All endpoints are mounted under `/api`:

| Prefix | Purpose |
|---|---|
| `/auth` | Registration, OTP, login/session, reset |
| `/patients` | Patient profile, clinical data, consent, AI, appointments |
| `/doctors` | Directory, profile, availability, queue, labs |
| `/appointments` | Booking, consultation, notes, statuses |
| `/prescriptions` | Creation, viewing, QR verification, dispensing |
| `/pharmacies` | Registration, profile, dashboard, history, approval |
| `/laboratories` | Directory, profile, queues, status, reports, approval |
| `/hospitals` | Profile, OPD, walk-ins, assisted registration |
| `/emergencies` | SOS, snapshot, access log, alert lifecycle |
| `/orders` | Medicine orders and fulfillment |
| `/payments` | Patient sandbox payments |
| `/interactions` | Consultation-scoped medicine safety checks |
| `/admin` | Admin accounts, audit, analytics, settings, content |

See [CARE4U_VIVA_CODE_GUIDE.md](CARE4U_VIVA_CODE_GUIDE.md) for the detailed endpoint/feature map.

## Deployment

- Backend target: Render, root `backend`, `npm ci`, `npm start`, health path `/api/health`.
- Web target: Vercel, root `frontend`, `npm ci`, `npm run build`, output `dist`.
- Mobile target: Expo/EAS when included in the release.
- Configure exact HTTPS origins in both `VITE_API_URL` and backend CORS variables.
- Configure production environment values only in provider dashboards.

Deployment URLs are intentionally omitted until real environments exist. Follow [CARE4U_DEPLOYMENT_CHECKLIST.md](CARE4U_DEPLOYMENT_CHECKLIST.md) before release.

## Demo accounts and data

No credentials are published in this repository. Create/seed reviewer accounts through the approved database/demo process and share them out-of-band. Do not commit reviewer environment files or production-like secrets.

## Verification

```bash
cd backend
npm run check

npm run test:auth

cd ../frontend
npm run build
```

Authentication/session/patient-access regression checks are maintained in `backend/tests` and run with `npm run test:auth`; `npm test` runs syntax plus those checks. They use synthetic mocks and do not verify PostgreSQL constraints, persistence, locking, rollback, browser cookies or native devices. Manual role/ownership and deployed cross-origin session smoke tests remain required.

## Additional documentation

- [Viva code guide](CARE4U_VIVA_CODE_GUIDE.md)
- [Authentication and access viva sample](docs/viva/02-authentication-and-access.md)
- [Deployment checklist](CARE4U_DEPLOYMENT_CHECKLIST.md)
