# Care4U Viva Code Guide

## Architecture

Care4U uses three clients around one session-based API:

```text
React/Vite web or Expo mobile
        |
        | HTTPS + session cookie
        v
Express route -> controller -> service -> repository -> PostgreSQL
        |                                      |
        +-> auth/RBAC/audit middleware         +-> parameterized SQL
        |
        +-> Supabase Storage, email, AI, Telegram (optional integrations)
```

Routes map URLs and enforce authentication/roles. Controllers translate HTTP input and output. Services contain validation, state transitions, ownership rules, and business workflows. Repositories contain SQL and return database records.

## Module map

| Module | Frontend entry points | Backend directory | Main tables |
|---|---|---|---|
| Authentication | `frontend/src/pages/auth`, `mobile/src/screens/LoginScreen.js` | `backend/src/modules/auth` | `users`, `otp_verifications`, `password_reset_tokens`, `session` |
| Patient profile/history | `frontend/src/pages/patient`, `frontend/src/services/patient.service.js` | `backend/src/modules/patient` | `patients`, `medical_records`, `patient_allergies`, `patient_conditions`, `vaccinations`, background/device/family tables |
| Privacy and consent | `ConsultationPage.jsx`, patient profile privacy UI | `patient/consent.*` | `consent_settings`, `consent_access_requests`, `consent_access_grants` |
| Doctor/consultation | `frontend/src/pages/doctor` | `doctor`, `appointment`, `interaction` | `doctors`, `doctor_availability`, `appointments`, `medical_records`, `drug_interactions` |
| Prescription/pharmacy | patient/pharmacy pages and prescription service | `prescription`, `pharmacy`, `order`, `payment` | `prescriptions`, `prescription_items`, `prescription_dispensing`, `pharmacies`, `medicine_orders`, `payment_transactions` |
| Laboratory | lab pages plus consultation lab-order UI | `laboratory`, doctor lab functions | `laboratories`, `lab_test_requests`, `lab_reports` |
| Hospital/OPD | `frontend/src/pages/hospital` | `hospital` | `hospitals`, `appointments`, `patients`, `doctors` |
| Emergency | `EmergencySOS.js`, hospital/admin emergency pages | `emergency` | `emergency_alerts`, `emergency_access_logs` |
| Administration | `frontend/src/pages/admin` | `admin`, `health-content` | `users`, `audit_logs`, `system_settings`, `health_content` |

## High-value file inventory

| File | Why it matters |
|---|---|
| `backend/app.js` | CORS, proxy trust, PostgreSQL session store, cookies, health route, module mounts, global errors |
| `backend/server.js` | Process entry point and reminder/expiry schedules |
| `backend/src/middleware/auth.js` | Active-account authentication, role checks, own-profile enforcement |
| `backend/src/middleware/patientAccess.js` | Patient UUID ownership and active doctor-consultation enforcement |
| `backend/src/middleware/auditLog.js` | Security/event audit trail |
| `backend/src/config/db.js` | Local DB variables or Render `DATABASE_URL`, production TLS |
| `frontend/src/services/api.js` | The only web API origin; Axios credentials enabled |
| `frontend/src/App.jsx` | Route tree, protected layouts, session restoration |
| `frontend/src/store/authStore.js` | Client session state |
| `frontend/src/pages/doctor/ConsultationPage.jsx` | Consultation workspace, consent-aware records, notes, prescriptions, lab ordering |
| `backend/src/modules/patient/consent.service.js` | OTP issuance/verification and temporary category grants |
| `backend/src/modules/appointment/appointment.controller.js` | Booking, ownership, consultation context, status transitions, notes AI |
| `backend/src/modules/prescription/prescription.service.js` | Active-consultation validation, expiry, QR, dispensing rules |
| `backend/src/modules/emergency/emergency.service.js` | SOS, snapshot, logging, alert resolution |
| `backend/migrations` | Incremental production database changes |

## Feature-to-code/data map

| Feature | Frontend | Route | Controller/service/repository | Tables |
|---|---|---|---|---|
| Login/session/logout | auth pages, `App.jsx`, auth store | `/api/auth/*` | `auth.controller/service/repository` | `users`, `session` |
| Patient profile | `PatientProfilePage.jsx` | `/api/patients/:id` | `patient.*` | `patients`, `users` |
| Medical records | `MedicalRecordsPage.jsx`, consultation | `/api/patients/:id/medical-records` | `patient.controller/service/repository` | `medical_records`, consent tables |
| Appointment booking | book pages/screens | `POST /api/appointments` | `appointment.controller/repository` | `appointments`, doctor availability |
| Consultation | `ConsultationPage.jsx` | `/api/appointments/:id/consultation`, notes/status endpoints | `appointment.*` | `appointments`, `medical_records` |
| Privacy OTP | consultation and profile | `/api/patients/:id/consent/*` | `consent.controller/service/repository` | consent tables |
| Prescription | consultation and prescription pages | `/api/prescriptions/*` | `prescription.*` | prescription tables |
| Pharmacy dispensing | pharmacy lookup/dashboard | verify and dispense endpoints | `prescription.*`, `pharmacy.*` | prescriptions, dispensing, pharmacies |
| Medicine delivery | `OrderTrackerPage.jsx` | `/api/orders/*` | `order.*` | `medicine_orders` |
| Lab workflow | lab pages and consultation | doctor lab order + `/api/laboratories/*` | `doctor.*`, `laboratory.*` | lab tables |
| OPD/walk-in | hospital pages | `/api/hospitals/*` | `hospital.*` | hospitals, appointments, patients |
| SOS/break glass | mobile SOS, emergency pages | `/api/emergencies/*` | `emergency.*`, `sms.util.js` | emergency tables |
| Admin operations | admin pages | `/api/admin/*` | `admin.*`, `healthContent.*` | users, audit/settings/content tables |

## API endpoint map

Public or pre-authentication endpoints:

- `/api/health`; doctor list/search/profile/slots/availability; verified laboratory list.
- `/api/auth/register`, `/verify-otp`, `/resend-otp`, `/login`, `/forgot-password`, `/reset-password`.
- Public registration endpoints retained for pharmacy/laboratory onboarding and published health-content reads.

Authenticated endpoint groups:

- `/api/auth/me`, `/api/auth/logout` — current session.
- `/api/patients/:id/*` — own patient data; doctor record reads require the assigned in-progress `appointmentId`; pharmacist access is limited to the prescription lookup workflow.
- `/api/doctors/:id/*` — private dashboard/profile mutations require the doctor session's own `profile_id`.
- `/api/appointments` and `/api/appointments/:id/*` — patient self-booking/cancellation or assigned-doctor consultation operations.
- `/api/prescriptions`, `/verify/:qrValue`, `/:id/dispense` — doctor issue, pharmacist verify/dispense, patient/issuing-doctor view.
- `/api/pharmacies/:id/*` — linked pharmacist profile/dashboard/history; approval is admin-only.
- `/api/laboratories/:id/*` and `/requests/:id/*` — linked lab technician queue/status/report operations; approval is admin-only.
- `/api/orders/*` — owning patient or assigned pharmacy.
- `/api/payments/*` — authenticated owning patient only.
- `/api/hospitals/*` — linked `hospital_staff` account.
- `/api/emergencies/*` — patient SOS; break-glass reads/actions for doctor, `emergency_staff`, `hospital_staff`, or admin.
- `/api/admin/*` and admin health content — `admin` only.

## Authentication and RBAC flow

1. Registration validates the real project roles: `patient`, `doctor`, `pharmacist`, `lab_technician`, and `hospital_staff`.
2. OTP verification creates the user/profile. Professional accounts remain subject to admin approval.
3. Login stores `id`, `role`, and linked `profile_id` in the PostgreSQL-backed Express session.
4. The browser receives an HTTP-only cookie. Production uses `Secure` and `SameSite=None`; Vercel requests use credentials and Render trusts one proxy hop.
5. `isAuthenticated` verifies both the session and that the user remains active. `authorize(...)` validates the role. Ownership middleware then compares route objects with `profile_id` or assigned workflow records.
6. Frontend route protection is usability only; backend checks are authoritative.

## Main journeys

### Patient

Register/OTP -> login -> restore session through `/api/auth/me` -> maintain profile and clinical background -> search doctor -> book appointment -> review records/prescriptions/reports -> track medicine orders/payments -> logout.

### Doctor consultation

Open own queue -> move an assigned appointment through a valid state -> open refresh-safe consultation context -> load patient safety information with the active appointment ID -> request consent OTP for locked categories -> record structured notes -> optionally issue prescription/order lab test -> complete consultation.

### Privacy/OTP consent

Patient selects locked categories. During an `in_progress` appointment, the assigned doctor requests an OTP. The patient supplies it out-of-band. Verification creates a short-lived grant for selected categories and the service rechecks patient, doctor, appointment, expiry, and category on access.

### Prescription/pharmacy

The assigned doctor creates a prescription only during the matching active consultation. A QR value identifies it. An authenticated pharmacist verifies the QR, dispenses validated quantities, and the system updates partial/completed status and dispensing history. Orders remain visible only to the owning patient and assigned pharmacy.

### Hospital/OPD/emergency

The linked hospital account views today's OPD queue, checks in appointments, registers assisted patients, and assigns walk-ins. A patient can trigger SOS. Authorized emergency roles use the minimal snapshot/break-glass flow, with access logging and explicit alert resolution.

## Common viva modifications

| If asked to change… | Start here |
|---|---|
| API deployment origin | `frontend/src/services/api.js`, Vercel `VITE_API_URL` |
| Cookie/CORS behavior | `backend/app.js`, Render origin variables |
| Role access | module `*.routes.js`, then ownership middleware/service |
| Patient profile fields | patient page/service/controller/service/repository and `patients` migration/schema |
| Appointment statuses | `appointment.controller.js` transition map and appointment UI badges/actions |
| Consent categories/duration | `patient/consent.service.js`, consent repository, consultation/profile UI |
| Prescription rules | `prescription.service.js` and prescription repository/UI |
| Lab priorities/statuses | doctor/laboratory services, repositories, migration `007` |
| OPD workflow | hospital page plus hospital controller/service/repository |
| SOS roles/snapshot | emergency routes/service/repository and emergency UI |
| Admin approval behavior | admin service/repository and approvals page |
| Health articles | health-content module and admin/patient feed components |
| Add an endpoint | route -> controller -> service -> repository, then client service and UI |

## Deployment architecture

- Vercel serves the Vite static web bundle.
- Render runs the Express server and exposes `/api/health`.
- PostgreSQL stores domain data and Express sessions.
- Supabase Storage holds uploaded images/documents where configured.
- Expo/EAS builds the mobile client; `EXPO_PUBLIC_API_URL` must be device-reachable HTTPS.
- Cross-origin browser sessions depend on exact CORS origins, credentials, proxy trust, and secure `SameSite=None` cookies.

## Known limitations/out of scope

- Payments are a sandbox workflow, not a real payment gateway.
- Email/Telegram/AI depend on external credentials and provider availability.
- Scheduled reminder and expiry jobs run inside the web process; a dedicated scheduler/worker is preferable for horizontally scaled production.
- The frontend currently emits a non-blocking large-chunk build warning; route-level code splitting is a later optimization.
- The migration directory is incremental and assumes the base schema already exists.
- Lab UI expansion and broad page refactors are intentionally out of scope for final deployment repair.
