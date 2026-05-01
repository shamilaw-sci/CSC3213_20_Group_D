# Care4U — Centralized Healthcare Ecosystem for Sri Lanka

> **Group D | CSC3213 | University of Peradeniya**
> Mid-Review Release: `v1.0-mid-review` | April 2026

Care4U is a digital healthcare platform built to address the fragmentation of medical records across Sri Lanka's hospitals, clinics, and pharmacies. It gives patients a single place to manage their health data, and gives doctors instant access to that data when it matters.

The system supports patients, doctors, and pharmacies through three interconnected applications — a Node.js REST API, a React web portal, and a React Native mobile app — all connected to a shared PostgreSQL database hosted on Supabase.

---

## Team Members

| Student ID | Name | Module |
|---|---|---|
| S/21/389 | Lasitha Sanuth | Authentication — Register, Login, Session, RBAC |
| S/21/081 | Wasana Karunanayaka | Patient Module — Profile, Records, Prescriptions, QR |
| S/21/166 | Tharindu Lakshan | Doctor Module — Dashboard, Queue, Availability, Audit Logs |
| S/21/001 | Pamudika Abayarathna | Prescription Module — Create, QR Generation, Dispense |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 20 + Express.js |
| **Database** | PostgreSQL via Supabase (Singapore region) |
| **Web Frontend** | React 18 + Vite + Tailwind CSS v4 + React Query v5 |
| **Mobile** | React Native + Expo SDK 54 |
| **Authentication** | Session-based via `express-session` + `connect-pg-simple` — No JWT |
| **QR Codes (web)** | `qrcode.react` for display, `qr-scanner.app` for scanning |
| **QR Codes (mobile)** | `react-native-qrcode-svg` for display |

---

## Prerequisites — Install These First

Before setting up the project, install the following on your computer.
Everything else (Express, React, all npm packages) installs automatically.

| Software | Version | Download |
|---|---|---|
| **Node.js** | v20 or higher | https://nodejs.org — download the LTS version |
| **Git** | Any recent version | https://git-scm.com |
| **Expo Go** | Latest | Install on your phone from App Store or Play Store |

**Verify your installation** by opening a terminal and running:

```bash
node --version    # should show v20.x.x or higher
npm --version     # should show 10.x.x or higher
git --version     # should show any version
```

---

## Setup Instructions

### Step 1 — Download the Project

```bash
git clone https://github.com/shamilaw-sci/CSC3213_20_Group_D.git
cd CSC3213_20_Group_D
```

Or download the zip directly from the `v1.0-mid-review` tag on GitHub:
- Go to the repo → click **Tags** → click `v1.0-mid-review` → click **zip**
- Extract the zip to any folder on your computer

---

### Step 2 — Set Up the Database Credentials

A file named `.env.reviewer` is included in the `backend/` folder.
This file contains the credentials for the shared Care4U Supabase database.
Rename it to `.env` so the backend can read it:

**Windows (Command Prompt):**
```bash
cd backend
rename .env.reviewer .env
```

**Windows (PowerShell):**
```bash
cd backend
Rename-Item .env.reviewer .env
```

**Mac / Linux:**
```bash
cd backend
mv .env.reviewer .env
```

> ⚠️ Do not modify any values inside the `.env` file. The credentials are already configured to connect to the shared Care4U Supabase database with all demo data loaded.

---

### Step 3 — Install and Start the Backend

```bash
cd backend
npm install
npm start
```

**Expected output:**
```
Server running on port 5000
Connected to Supabase PostgreSQL
```

> `npm install` reads `package.json` and automatically downloads all backend packages at the exact versions used during development. This takes 1–2 minutes the first time.

**Leave this terminal running. Open a new terminal for the next step.**

---

### Step 4 — Install and Start the Web Frontend

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v8.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

**Leave this terminal running too.**

---

### Step 5 — Set Up the Mobile App

The mobile app requires your computer and phone to be on the **same Wi-Fi network**.

**Find your computer's local IP address:**

Windows:
```bash
ipconfig
# Look for: IPv4 Address under your Wi-Fi adapter
# Example:  192.168.1.45
```

Mac / Linux:
```bash
ifconfig
# Look for: inet under en0 or wlan0
```

**Update the mobile API URL** — open `mobile/src/services/api.js` and replace the IP address with your own:

```javascript
baseURL: 'http://192.168.1.45:5000',
```

**Start the mobile app:**

```bash
cd mobile
npm install
npx expo start
```

A QR code appears in the terminal. Open **Expo Go** on your phone and scan it. The Care4U mobile app loads on your phone.

---

## Test Credentials

Use these accounts to log in and explore the system.

| Role | Email | Password |
|---|---|---|
| **Patient** | nimasha.perera@gmail.com | password123 |
| **Doctor** | dr.kamal.perera@care4u.com | password123 |

> **Note:** Registration is fully functional — new accounts can be registered through the Register page. The demo walkthrough below uses the pre-loaded accounts above because all demo data (records, prescriptions, appointments) is linked specifically to these users. If you register a new account, the portal will load but no health data will appear since no records have been created for that account yet.

### Registration Pages

The registration flow is fully implemented and supports both Patient and Doctor account creation with full form validation (email format, password length, required fields).

![](docs/screenshots/01.png)

![](docs/screenshots/02.png)

![](docs/screenshots/03.png)

![](docs/screenshots/04.png)

---

## Pre-Loaded Demo Data

The shared Supabase database comes with the following data ready to test:

**Test Patient — Nimasha Perera**
- Blood Group: A- | NIC: 199625603456 | DOB: 14 September 1996 | Gender: Female
- QR ID: QR-TEST-001
- Emergency Contact: Ruwan Perera (Spouse) — 0779876543
- 3 allergies: Penicillin (Severe), Sulfonamides (Moderate), Dust Mites (Mild)
- 6 medical records: consultations and lab results assigned to Dr. Kamal Perera and Dr. Ashan Silva
- 6 prescriptions: 3 Active, 1 Partially Filled, 2 Expired

**Test Doctor — Dr. Kamal Perera**
- Specialization: Neurology
- Qualifications: MBBS (Colombo), MD (Neurology), MRCP (UK)
- Experience: 12 Years | Hospital: Kurunegala Teaching Hospital
- Availability: Monday–Friday with configured time slots

**Pre-Seeded Appointments**
- Today's appointment queue has Nimasha Perera scheduled at 9:00 AM — OPD

> ⚠️ Appointments are date-specific. If the demo is run on a different day, the appointment queue may show empty. Re-seed by inserting a new appointment row in the Supabase SQL Editor with `scheduled_at = NOW()`.

---

## Complete Demo Walkthrough

Follow these steps in order to test the full Care4U workflow.

---

### 1 — Web: Patient Login

1. Open `http://localhost:5173` in your browser
2. Enter `nimasha.perera@gmail.com` / `password123` and click **Login**
3. You are redirected to the Patient Portal — My Profile page

![](docs/screenshots/05.png)

---

### 2 — Web: Patient Profile

![](docs/screenshots/06.png)

**Test editing:** Click **Edit Profile** → change any field → click **Save Changes** → a success toast notification appears and the profile updates instantly.

![](docs/screenshots/07.png)

---

### 3 — Web: Medical Records

Click **Medical Records** in the left sidebar.

![](docs/screenshots/08.png)

Click any row to open the detail modal.

![](docs/screenshots/09.png)

---

### 4 — Web: Prescriptions

Click **Prescriptions** in the left sidebar. Click any card header to expand it.
Prescriptions separated into **Active Prescriptions** and **Past Prescriptions**
Expired prescriptions show full medicine and dispensing history but no QR button.

![](docs/screenshots/10.png)

![](docs/screenshots/11.png)

![](docs/screenshots/12.png)

---

### 5 — Web: Logout

Click the **Logout** button at the bottom of the left sidebar — you are returned to the login page.

---

### 6 — Web: Doctor Login and Dashboard

1. Log in with `dr.kamal.perera@care4u.com` / `password123`
2. The Doctor Dashboard loads

![](docs/screenshots/13.png)

![](docs/screenshots/14.png)

---

### 7 — Web: Doctor Appointment Queue

Click **Appointment Queue** from the dashboard.

![](docs/screenshots/15.png)

---

### 8 — Web: Doctor Profile and Availability

Click **My Profile** from the dashboard.

![](docs/screenshots/16.png)

---

### 9 — Web: Issue a Prescription

Click **Issue Prescription** from the dashboard. Fill in the form using this test data:

| Field | Value |
|---|---|
| **Patient ID** | `006761d1-8279-440e-a786-a492df7abd53` |
| **Appointment ID** | `758de7a6-d63b-4f74-ad90-d6337de2de8f` |
| **Notes** | Take all medicines after meals |

Add medicine rows using the **+ Add Medicine** button:

| Medicine | Dosage | Frequency | Duration | Qty |
|---|---|---|---|---|
| Amoxicillin | 500mg | Three times daily | 7 | 21 |
| Paracetamol | 500mg | Twice daily | 5 | 10 |

![](docs/screenshots/17.png)

Click **Issue Prescription** — the generated prescription QR code appears on screen.

![](docs/screenshots/18.png)

---

### 10 — Mobile App Demo

Open the Care4U app on your phone via Expo Go.

<table>
  <tr>
    <td><img src="docs/screenshots/23.jpeg"/></td>
    <td><img src="docs/screenshots/24.jpeg"/></td>
    <td><img src="docs/screenshots/25.jpeg"/></td>
  </tr>
</table>

The app has 4 tabs at the bottom.

| Tab | What It Shows |
|---|---|
| **My Profile** | Patient profile, emergency contact, and known allergies |
| **Records** | Medical records list — tap any record for full details |
| **Prescriptions** | All prescriptions with medicine details and QR codes |
| **QR Card** | Patient identity QR code for clinic identification |

#### My Profile Tab

<table>
  <tr>
    <td><img src="docs/screenshots/26.jpeg"/></td>
    <td><img src="docs/screenshots/27.jpeg"/></td>
  </tr>
</table>

#### Records Tab

<table>
  <tr>
    <td><img src="docs/screenshots/28.jpeg"/></td>
    <td><img src="docs/screenshots/29.jpeg"/></td>
  </tr>
</table>

#### Prescriptions Tab

<table>
  <tr>
    <td><img src="docs/screenshots/30.jpeg"/></td>
    <td><img src="docs/screenshots/31.jpeg"/></td>
  </tr>
</table>

#### QR Card Tab

![](docs/screenshots/32.jpeg)

---

### 11 — Prescription QR Scan (Pharmacy Verification)

This simulates a patient showing their prescription QR to a pharmacist for dispensing.

1. On the mobile app, tap the **Prescriptions** tab
2. Tap any active prescription to expand it
3. Tap **Show QR Code** — the prescription QR code appears full screen
4. On your computer, open **https://qr-scanner.app** in Chrome
5. Click **Start Scanning** and allow camera access
6. Point the laptop webcam at the QR code on the phone screen
7. The scanner reads the QR and shows a **clickable URL** on screen
8. Click the URL — the **Pharmacy Lookup Page** opens directly in the browser

**Test directly with a known working URL:**
```
http://localhost:5173/pharmacy/RX-02d3d3d4-2875-4c1e-b881-0b19a8a9ad7d
```

![](docs/screenshots/21.png)

![](docs/screenshots/22.png)

---

### 12 — Patient Identity QR Scan (Mobile → Web Lookup)

This simulates a doctor scanning a patient's QR code when they arrive at the clinic.

1. On the mobile app, tap the **QR Card** tab — the patient identity QR code appears
2. On your computer, open **https://qr-scanner.app** in Chrome
3. Click **Start Scanning** and allow camera access
4. Point the laptop webcam at the QR code on the phone screen
5. The scanner reads the QR and shows a **clickable URL** on screen
6. Click the URL — the **Patient Lookup Page** opens in the browser

**Test without scanning — type this URL directly:**
```
http://localhost:5173/lookup/QR-TEST-001
```


![](docs/screenshots/19.png)

![](docs/screenshots/20.png)

---

## Mid-Review Notes

The following items are intentionally hardcoded for the mid-review demonstration and will be replaced with real session data on Integration Day.

| Item | Mid-Review State | After Integration |
|---|---|---|
| Patient ID in web pages | Hardcoded UUID (Nimasha Perera) | `useAuthStore()` session user |
| Patient ID in mobile screens | Hardcoded UUID | `useAuthStore()` session user |
| Doctor ID in prescription controller | Hardcoded UUID (Kamal Perera) | `req.session.user` |
| Auth middleware on routes | Commented out | Uncommented on all routes |

---

## Project Structure

```
CSC3213_20_Group_D/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # Database connection (Supabase)
│   │   ├── middleware/         # isAuthenticated, authorize (RBAC)
│   │   ├── modules/
│   │   │   ├── auth/           # S/21/389 — Login, register, session
│   │   │   ├── patient/        # S/21/081 — Profile, records, allergies, prescriptions
│   │   │   ├── doctor/         # S/21/166 — Profile, queue, availability
│   │   │   ├── prescription/   # S/21/001 — Create, QR, dispense
│   │   │   └── appointment/    # Shared — booking and status updates
│   │   └── utils/              # QR generation, email, OTP helpers
│   ├── .env.reviewer           # ← Rename this to .env before running
│   ├── package.json
│   └── server.js
│
├── frontend/                   # React 18 + Vite web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Card, Modal, DataTable, Badge, Spinner
│   │   │   └── layout/         # Sidebar, PatientLayout
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── patient/        # Profile, Medical Records, Prescriptions, QR Lookup
│   │   │   ├── doctor/         # Dashboard, Appointment Queue, Issue Prescription
│   │   │   └── pharmacy/       # Prescription verification page
│   │   └── services/           # Axios API call functions
│   └── package.json
│
├── mobile/                     # React Native + Expo SDK 54 mobile app
│   ├── src/
│   │   ├── screens/            # Profile, QR Card, Prescriptions, Medical Records
│   │   └── services/           # Axios API call functions
│   ├── App.js                  # 4-tab bottom navigation
│   └── package.json
│
└── docs/
    └── screenshots/            # Screenshots used in this README
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new patient or doctor |
| POST | /api/auth/login | Login — creates session cookie |
| POST | /api/auth/logout | Logout — destroys session |
| GET | /api/auth/me | Get current logged-in user |
| GET | /api/patients/:id | Get patient profile |
| PUT | /api/patients/:id | Update patient profile |
| GET | /api/patients/:id/medical-records | Get all medical records |
| GET | /api/patients/:id/prescriptions | Get all prescriptions with medicine items |
| GET | /api/patients/:id/allergies | Get all allergies |
| POST | /api/patients/:id/allergies | Add a new allergy |
| GET | /api/patients/qr/:qrCodeId | Get patient by QR code ID |
| GET | /api/doctors/:id | Get doctor profile |
| GET | /api/doctors/:id/appointments/today | Get today's appointment queue |
| POST | /api/prescriptions | Create prescription and generate QR |
| GET | /api/prescriptions/:id | Get prescription details |
| GET | /api/prescriptions/verify/:qrValue | Verify prescription by QR value |
| POST | /api/appointments | Book an appointment |
| PUT | /api/appointments/:id/status | Update appointment status |

---

*Care4U — Group D | CSC3213 | University of Peradeniya | April 2026*
