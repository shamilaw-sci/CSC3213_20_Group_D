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


## Patient Web Frontend — final viva table (2026-11-15)

Source review of the current checkout. This is a revision table, not evidence of live API, provider, browser, device or database acceptance. The booking lock was traced in backend source; real PostgreSQL concurrency was not tested.

| File / Module | Important feature | Important logic |
|---|---|---|
| PatientLayout / PatientNavbar | Navigation and logout | Show grouped patient links → flag completed unread reports. Attempt logout → open login even on failure; response status is not checked. |
| PatientProfilePage / patient service | Profile identity and editing | Confirm a patient profile ID through /auth/me → load data → edit name, blood group and emergency contact. Identity fields stay read-only. |
|  | Save profile and avoid duplicate writes | Block another profile save with a ref → wait for confirmed response → replace cache and exit editing. Failure keeps the form open. |
|  | Profile photo | Accept JPEG/PNG/WEBP up to 2 MB → upload as photo → update profile cache on success. |
|  | Patient identity QR | Render the saved patient QR ID; show unavailable when missing. Backend checks who may use it. |
|  | Allergies and priority conditions | Require a name → save selected allergy severity or condition priority flag. Severe allergies sort first; priority is chosen by the patient. |
|  | Devices, past events and family history | Require device name, event title or family condition → save details and chosen emergency flag → refresh that list. Family history collects a relationship, not a relative name. |
|  | Remove health-list entries | Choose an entry → confirm in its dialog → send removal → refresh only the affected list on success. Failure shows an error. |
|  | Vaccinations and AI card scan | Scan image → review editable extracted rows; scanning does not save. Ignore blank rows → require name and date on every active row → submit together. |
|  | Privacy category locks | Edit Mode + loaded settings → block overlapping writes → save full category list separately. Cancel profile editing does not undo saved locks; backend filtering uses record text matching. |
| Patient service / doctor consent | Temporary access confirmation | Send appointment ID and patient code → require a confirmed grant, category list and valid expiry. The legacy role argument grants no access. |
| DoctorSearchPage / doctor service | Find and select a doctor | Submit trimmed specialty/hospital filters → query that filter pair → choose a doctor → open booking. Typing alone does not change applied filters. |
| BookAppointmentPage / Appointment backend | Book and handle competing patients | Group displayed slots by date → select time → request OPD booking. Backend locks the doctor row, rechecks slots/conflicts and inserts in one transaction; stale requests are rejected. |
| BookAppointmentPage | Reschedule failure handling | Book replacement first → cancel original. Failed new booking keeps original; failed cancellation keeps replacement and may leave both active, with a warning. |
| MyAppointmentsPage | Upcoming visits, cancellation and rescheduling | Upcoming means scheduled/confirmed/in-progress by status, sorted earliest first. Other statuses form History. Only scheduled cards offer cancel/reschedule; cancellation asks for confirmation. |
| MedicalRecordsPage | Record timeline and details | Require session profile ID → load records → newest first → filter by type. Counts use all records; open details only if the selected record is still returned. |
| LabReportsPage / PatientNavbar | Report viewing and unread badge | Detect image extension after stripping query/fragment → preview images here; attempt new tab for other files. Mark unread reports read → refresh shared query after success. A blocked popup is not detected. |
| PrescriptionsPage | Expiry, partial dispensing and QR | Valid expiry before browser time overrides saved status. QR needs active/partially-filled status and a reference. Progress is dispensed ÷ prescribed, limited to 0–100%; backend authorizes dispensing. |
| PatientLookupPage / patient service | Doctor QR lookup and access limits | Load scanned patient identity → request health lists. Current doctor calls omit required appointment ID, so backend can reject them; some failed list requests look empty. |
| PatientLookupPage / Appointment backend | Start Visit | Doctor-only button requests immediate OPD booking → backend resolves doctor profile from session and may reuse today’s active visit → require returned ID → open consultation. |
| PatientLookupPage | AI medical-history summary | Request summary → display response or failure. Current call omits consultation ID; current formatter splits into characters, so line/table formatting is unreliable. |
| HealthAwarenessFeed / healthContentService | Select awareness infographics | Keep last article for each exact title in memory → rank allergy keyword matches first → show only image articles. Conditions are not used; failures become an empty feed. |
|  | Slideshow controls | Rotate multiple articles every 15 seconds while unpaused → hover/focus pauses → arrows, dots and swipes select slides. |
| AIChatWidget | Patient AI chat | Ignore blank or loading sends → send new text, chosen language and previous local messages → append reply or failure → release loading. Closing keeps local history; Enter sends, Shift+Enter adds a line. |
|  | AI chat presentation and safety notice | Switch English/Sinhala for later requests → render reply Markdown → keep safety guidance visible. Full screen and close buttons change local display state. |
| OrderTrackerPage | Medicine delivery progress | Display server order status through placed → accepted → packed → out for delivery → delivered. Cancelled shows an alert; unknown statuses mark no step reached. This page does not update orders. |
| PaymentHistoryPage | Payment status and receipts | Load patient transactions → show returned success/pending/failed status → open selected receipt and amount. Sandbox notice stays visible; the page makes no charge request. |
| Prescription service | Prescription reference verification | Send QR reference → return the complete response envelope. Backend checks access and validity; this request does not dispense medicine. |

[Tab-separated table](docs/viva/patient-web-final-table.tsv) · [File tracker, ownership, checks and unresolved issues](docs/review/PATIENT_WEB_FINAL_REVIEW.md). Historical sections above retain their earlier review scope.
