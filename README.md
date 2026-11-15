# Care4U — Centralized Healthcare Ecosystem

**CSC3213 Software Engineering | Group D | University of Peradeniya**

Care4U is a healthcare management prototype connecting patients, doctors, pharmacies, laboratories, hospitals, and administrators through a web application, an Android application, and a shared backend.

## 1. Getting Started

Care4U can be accessed in two ways.

### Option 1 — Use the Deployed Applications (Recommended)

The web and Android applications are available for testing with demonstration accounts and a pre-populated Supabase database. **No local installation is required.**

| Application | Access Link |
|---|---|
| **Web Application** | [Open Care4U Web App](https://care4u-deploy-ashy.vercel.app/login) |
| **Android Application** | [Download Care4U Android APK](https://drive.google.com/file/d/1XMVB9sxfWW7tABcxSBc2tQeWo5fwT7Tv/view?usp=sharing) |

For Android, open the download link on an Android device, download the APK, and install the application.

**Demo Access:** Test accounts are available for Patient, Doctor, Pharmacist, Laboratory Technician, Hospital Staff, and Administrator roles. Login credentials will be shared privately with the evaluation supervisor via email.

**Prepared Database:** The deployed applications use Supabase-hosted PostgreSQL, already populated with fictional users, appointments, consultations, prescriptions, medical records, and other evaluation data. No database setup is required for this option.

Demonstration email addresses use Gmail `+` aliases so OTP and password-reset emails can be received in one controlled test inbox.

### Option 2 — Run the Project Locally

The complete source code, database scripts, configuration templates, and setup instructions are provided in [Section 5 — Local Setup](#5-local-setup).

A fresh database does not automatically contain the hosted demonstration users or appointments.

## 2. Team Members

| Student ID | Team Member | Main Contributions |
|---|---|---|
| S/21/389 | Lasitha Sanuth | Authentication, sessions, and role-based access |
| S/21/081 | Wasana Karunanayaka | Patient, privacy, hospital, and emergency modules |
| S/21/166 | Tharindu Lakshan | Doctor, appointments, and consultations |
| S/21/001 | Pamudika Abayarathna | Prescriptions, pharmacy, orders, and payments |

## 3. Implemented Features

| Module | Main Features |
|---|---|
| **Authentication** | Registration, email OTP verification, login/logout, password recovery, session management, role-based access, and professional approvals |
| **Patient** | Profiles, medical history, allergies, chronic conditions, vaccinations, AI-assisted vaccination card extraction, appointment booking, prescriptions, lab reports, privacy controls, QR identification, health awareness, AI assistant, and SOS |
| **Doctor** | Profile and availability, patient queue, consultations, clinical notes, AI-assisted drafts and summaries, prescriptions, medicine interaction warnings, laboratory requests, and consent-based medical record access |
| **Pharmacy** | Registration and approval, prescription QR verification, dispensing, dispensing history, and selected medicine-order demonstrations |
| **Laboratory** | Registration and approval, laboratory requests and queues, test status management, reports, and notifications |
| **Hospital and Emergency** | OPD and walk-in handling, assisted patient registration, SOS alerts, emergency access, and activity logging |
| **Administrator** | Account approvals, user management, audit logs, system settings, health awareness content, analytics, and emergency oversight |

## 4. Architecture and Technologies

Care4U uses a shared Node.js/Express backend and PostgreSQL database for both web and mobile applications.

```text
React Web (Vercel)        React Native / Expo (Android)
          \                       /
           \                     /
                Express API
                  (Render)
                     |
              PostgreSQL
                (Supabase)
```

The backend follows a layered architecture:

```text
Routes → Controllers → Services → Repositories → Database
```

| Component | Technology |
|---|---|
| Web | React, Vite, Tailwind CSS |
| Mobile | React Native, Expo |
| Backend | Node.js, Express |
| Database and Sessions | PostgreSQL, `pg`, `express-session`, `connect-pg-simple` |
| AI | Google Gemini, Groq |
| Other Integrations | Supabase Storage, email/OTP, optional Telegram alerts |
| Hosting | Vercel, Render, Supabase, Expo EAS |

**Repository structure:**

```text
backend/
  database/
    schema.sql
    seed.sql
  src/

frontend/
  src/

mobile/

README.md
```

## 5. Local Setup

The following instructions allow reviewers to configure and run a separate Care4U installation.

**Requirements:** Git, Node.js 22.12 or later, npm, and PostgreSQL or Supabase PostgreSQL. Local mobile testing additionally requires an Expo-compatible device or emulator.

Clone the repository:

```bash
git clone https://github.com/shamilaw-sci/CSC3213_20_Group_D.git
cd CSC3213_20_Group_D
```

### 5.1 Database

Create an empty PostgreSQL database and apply the SQL files in order:

```bash
createdb -U postgres care4u_db

psql -U postgres -d care4u_db -v ON_ERROR_STOP=1 -f backend/database/schema.sql

psql -U postgres -d care4u_db -v ON_ERROR_STOP=1 -f backend/database/seed.sql
```

For a new Supabase PostgreSQL database, import the same SQL files in the same order using a compatible PostgreSQL client.

- `schema.sql` creates the database tables and constraints.
- `seed.sql` adds initial settings, sample medicine-interaction data, and health awareness content.

**Note:** These scripts are for a fresh database and do not recreate the populated hosted demonstration database. Do not run them against the existing demo database.

### 5.2 Backend

From the repository root:

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` and configure the required database, session, email, storage, and API credentials described in Section 5.5.

Start the backend:

```bash
npm run dev
```

- **Backend:** `http://localhost:5000`
- **Health check:** `http://localhost:5000/api/health`

### 5.3 Web Application

Open another terminal in the repository root:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env` and configure:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in a browser.

### 5.4 Mobile Application

Open another terminal in the repository root:

```bash
cd mobile
npm ci
```

Copy `mobile/.env.example` to `mobile/.env` and configure:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000
```

Replace `YOUR_COMPUTER_IP` with the computer's LAN IP address when using a physical device, or use the deployed Render HTTPS backend URL.

Start Expo:

```bash
npm start
```

Follow the Expo instructions to run the application on a compatible device or emulator.

### 5.5 Environment Variables and External APIs

The repository includes configuration templates:

- `backend/.env.example`
- `frontend/.env.example`
- `mobile/.env.example`

Configure the following services as required:

| Service | Environment Variables | Purpose |
|---|---|---|
| PostgreSQL | `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database and session storage |
| Backend Sessions | `SESSION_SECRET`, `CLIENT_URL`, `CORS_ALLOWED_ORIGINS` | Authentication and browser access |
| Email (Gmail SMTP) | `EMAIL_USER`, `EMAIL_PASS` | OTP verification and password recovery |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | File and image uploads |
| Google Gemini / Groq | `GEMINI_API_KEY`, `GROQ_API_KEY` | AI-assisted features |
| Telegram (Optional) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Emergency notifications |
| Web / Mobile | `VITE_API_URL`, `EXPO_PUBLIC_API_URL` | Backend API connection |

For Supabase Storage, configure the `patient-photos`, `doctor-photos`, and `health-content-images` buckets in the new project.

Additional configuration settings are documented in `backend/.env.example`.

**API Credentials:** The deployed demonstration system already has its required integrations configured. Necessary evaluation access details and temporary API credentials for independent testing can be provided privately to the evaluation supervisor.

**Security:** Actual `.env` files, API keys, database passwords, and Supabase service-role credentials must not be committed to the public repository.

**User Registration:** Patients and healthcare professionals can register through the application. Healthcare professional accounts require administrator approval. Public administrator registration is disabled for security reasons.

The hosted demonstration system already includes an administrator account and approved test users. A fresh installation requires secure initial administrator provisioning before administrative approval features can be used.

## 6. Deployment

Care4U uses the following hosting services:

| Service | Purpose |
|---|---|
| **Vercel** | React web application |
| **Render** | Express backend API |
| **Supabase** | PostgreSQL database and file storage |
| **Expo EAS** | Android application builds |

For a separate deployment:

- **Render:** Set the root directory to `backend`, install with `npm ci`, start with `npm start`, and configure the backend environment variables.
- **Vercel:** Set the root directory to `frontend`, build with `npm run build`, use `dist` as the output directory, and configure `VITE_API_URL` with the Render HTTPS backend URL.
- **Expo:** Configure `EXPO_PUBLIC_API_URL` with the backend URL and use the build profiles in `mobile/eas.json`.

The deployed frontend origin must be allowed in the backend's CORS configuration for authenticated requests.

## 7. Testing and Verification

Run the following commands from their respective package directories:

| Directory | Commands |
|---|---|
| `backend/` | `npm run check`, `npm test` |
| `frontend/` | `npm run lint`, `npm run test:auth`, `npm run test:patient`, `npm run build` |
| `mobile/` | `npx expo-doctor`, `npx expo export --platform android` |

The team has also manually tested the web workflows using demonstration accounts across user roles.

## 8. Academic Scope and Limitations

Care4U is an academic healthcare prototype, not a production healthcare service.

- Core patient, doctor, laboratory, hospital, administrative, and prescription workflows are implemented.
- Medicine-order checkout and complete pharmacy order management remain partially implemented.
- Payment records and delivery tracking are simulated; no live payment gateway is integrated.
- AI-generated medical content requires professional review.
- Sample medicine-interaction records are not a complete clinical safety database.

The deployed applications and prepared demonstration database support evaluation of the implemented features.