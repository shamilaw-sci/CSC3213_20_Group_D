# Care4U Repository Inventory

Audit date: 2026-10-03  
Branch: `develop` (`origin/develop`)  
Scope: all tracked human-written source, configuration, migration, documentation, and UI asset files. Generated/dependency directories and lock-file internals were classified but not line-audited.

## Audit basis and file-level authorship method

The requested `Care4U_Team_Development_Guide_v3`, `Care4U_Final_Review_Development_Guide`, and `Care4U_Project_Progress_MidReview` files are not present in this checkout. Available authoritative material was `README.md`, `CARE4U_VIVA_CODE_GUIDE.md`, `CARE4U_DEPLOYMENT_CHECKLIST.md`, the two files in `docs/`, and Git history.

The team's final **module responsibility** map is context, not proof of individual file authorship:

- Lasitha Sanuth (S/21/389): Authentication and Admin.
- Wasana Karunanayaka (S/21/081): Patient, QR lookup, Emergency, Hospital/Clinic, and Laboratory.
- Tharindu Lakshan (S/21/166): Doctor and Audit Logging.
- Pamudika Abayarathna (S/21/001): Prescription, Appointment, and Pharmacy.

The authorship column was rechecked file by file in this order: existing @author header, Git creation/meaningful implementation commits, current blame for substantial code, related commit/progress history, and only then module responsibility as context. A later bug fix, route import, merge resolution, or minor restyling does not transfer original authorship. “Header + Git origin” means identity agreement, **not** sole authorship; “substantial Git” identifies multiple meaningful implementation contributions, not an instruction to overwrite the current header. Where attribution remains uncertain the entry says AUTHORSHIP REQUIRES TEAM CONFIRMATION. “Review” means a file is implicated in a finding or needs targeted follow-up; it does not mean the entire file is defective.

## Backend application and shared infrastructure

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `backend/app.js` | Backend / application | Wasana + Lasitha (substantial Git) | Configures Express, CORS, sessions, middleware, health checks, and module mounts. | Yes, required by `server.js` | No | Yes: CSRF/session policy |
| `backend/server.js` | Backend / application | Wasana + Pamudika (substantial Git) | Starts the API and schedules reminder/expiry jobs. | Yes, package start target | No | Low: in-process schedulers |
| `backend/scripts/check-syntax.js` | Backend / tooling | Wasana (header + Git origin) | Syntax-checks backend JavaScript files. | Yes, `npm run check` | No | No |
| `backend/src/config/db.js` | Backend / configuration | Wasana (header + Git origin) | Creates the PostgreSQL connection pool for local and production environments. | Yes | No | No |
| `backend/src/config/supabase.js` | Backend / configuration | Wasana (header + Git origin) | Creates the server-side Supabase Storage client. | Yes | No | No |
| `backend/src/middleware/auth.js` | Backend / authentication middleware | Lasitha + Wasana (substantial Git) | Enforces session authentication, roles, active accounts, and own-profile checks. | Yes, widely used | No | Yes: approval status not enforced |
| `backend/src/middleware/auditLog.js` | Backend / audit | Tharindu (header + Git origin) | Writes general audit events and provides route middleware. | Yes | No | Yes: logs attempts before outcome; coverage gaps |
| `backend/src/middleware/patientAccess.js` | Backend / patient authorization | Wasana (header + Git origin) | Enforces patient ownership and active-consultation access. | Yes | No | Yes: pharmacist bypass is broad |
| `backend/src/middleware/upload.js` | Backend / upload | Wasana (header + Git origin) | Configures in-memory image uploads, MIME allow-list, and size limits. | Yes | No | Low: MIME is client supplied |
| `backend/src/utils/ai.util.js` | Backend / AI integration | Wasana (header + Git origin) | Calls Gemini/Groq with retry, fallback, and medical guardrails. | Yes | No | Yes: third-party privacy/cost controls |
| `backend/src/utils/email.js` | Backend / notifications | Pamudika + Lasitha + Wasana (substantial Git; no header) | Sends OTP, reset, appointment, consent, lab, rejection, and emergency emails. | Yes | No | Yes: missing author/history comment |
| `backend/src/utils/expiryJob.js` | Backend / prescription job | Pamudika (header + Git origin) | Marks expired prescriptions on a schedule. | Yes, scheduled by `server.js` | No | No |
| `backend/src/utils/otp.js` | Backend / authentication | Lasitha (header + Git origin) | Generates numeric OTPs and expiry timestamps. | Yes | No | No |
| `backend/src/utils/qr.js` | Backend / shared QR | Pamudika + Lasitha (substantial Git) | Generates patient and prescription QR identifiers. | Yes | No | Yes: header attribution incomplete |
| `backend/src/utils/reminderJob.js` | Backend / appointment job | Pamudika (header + Git origin) | Sends upcoming appointment reminders on a schedule. | Yes, scheduled by `server.js` | No | No |
| `backend/src/utils/sms.util.js` | Backend / emergency | Wasana (header + Git origin) | Sends SOS messages through Telegram. | Yes | No | Yes: name says SMS although implementation is Telegram |

## Backend modules

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `backend/src/modules/auth/auth.routes.js` | Backend / Authentication | Lasitha (header + Git origin) | Declares registration, OTP, login/session, and reset routes. | Yes, mounted `/api/auth` | No | Yes |
| `backend/src/modules/auth/auth.controller.js` | Backend / Authentication | Lasitha + Wasana (substantial Git) | Validates HTTP inputs and creates/destroys authentication sessions. | Yes | No | Yes: OTP creates pending-user session |
| `backend/src/modules/auth/auth.service.js` | Backend / Authentication | Lasitha + Wasana (substantial Git) | Implements registration, OTP, approval-aware login, lockout, and reset logic. | Yes | No | Yes: throttling/token storage |
| `backend/src/modules/auth/auth.repository.js` | Backend / Authentication | Lasitha + Wasana (substantial Git) | Performs user/profile, OTP, lockout, and reset-token SQL. | Yes | No | Yes: plaintext reset tokens |
| `backend/src/modules/admin/admin.routes.js` | Backend / Admin | Lasitha (Git origin; no header) | Declares admin approvals, accounts, RBAC, audit, analytics, QR, and settings routes. | Yes, mounted `/api/admin` | No | Yes: mutation audit coverage |
| `backend/src/modules/admin/admin.controller.js` | Backend / Admin | Lasitha (Git origin; no header) | Handles admin HTTP requests and response mapping. | Yes | No | Yes: missing author header |
| `backend/src/modules/admin/admin.service.js` | Backend / Admin | Lasitha (Git origin; no header) | Implements approvals, rejection, account status, analytics, settings, and QR reissue. | Yes | No | Yes: most mutations not audited |
| `backend/src/modules/admin/admin.repository.js` | Backend / Admin | Lasitha + Wasana (substantial Git) | Executes admin queries and filtered/paginated reads. | Yes | No | Yes: missing author header |
| `backend/src/modules/appointment/appointment.routes.js` | Backend / Appointment | Tharindu + Wasana (substantial Git) | Declares booking, queue status, consultation, notes, and AI-summary routes. | Yes, mounted `/api/appointments` | No | Yes: shared implementation attribution; header credits original author |
| `backend/src/modules/appointment/appointment.controller.js` | Backend / Appointment | Tharindu + Pamudika + Wasana (substantial Git) | Implements booking, ownership/status transitions, consultation context, notes, and summaries. | Yes | No | Yes: booking validation/race; history comments |
| `backend/src/modules/appointment/appointment.repository.js` | Backend / Appointment | Tharindu + Pamudika + Wasana (substantial Git) | Reads and writes appointments, consultation notes, and conflicts. | Yes | No | Yes: conflict check is non-atomic |
| `backend/src/modules/doctor/doctor.routes.js` | Backend / Doctor | Tharindu + Wasana (substantial Git) | Declares directory, profile, availability, queue, lab order, and lab review routes. | Yes, mounted `/api/doctors` | No | Low: placeholder comment |
| `backend/src/modules/doctor/doctor.controller.js` | Backend / Doctor | Tharindu + Pamudika + Wasana (substantial Git) | Handles doctor profile, availability, dashboard, queue, and laboratory requests. | Yes | No | No |
| `backend/src/modules/doctor/doctor.service.js` | Backend / Doctor | Tharindu + Pamudika + Wasana (substantial Git) | Applies doctor validation and active-consultation rules. | Yes | No | No |
| `backend/src/modules/doctor/doctor.repository.js` | Backend / Doctor | Tharindu + Pamudika + Wasana (substantial Git) | Performs doctor, availability, queue, search, and lab-review SQL. | Yes | No | Yes: `UPDATED:` history comment |
| `backend/src/modules/patient/patient.routes.js` | Backend / Patient | Wasana (header + Git origin) | Declares patient profile, records, history, QR/NIC, labs, appointments, consent, and chat routes. | Yes, mounted `/api/patients` | No | Yes: pharmacist access scope |
| `backend/src/modules/patient/patient.controller.js` | Backend / Patient | Wasana (header + Git origin) | Maps patient HTTP requests and assembles AI-chat context. | Yes | No | Yes: AI privacy and prompt logging |
| `backend/src/modules/patient/patient.service.js` | Backend / Patient | Wasana (header + Git origin) | Implements profile/clinical CRUD, privacy-aware reads, lookup, summaries, and scan logic. | Yes | No | Yes: development-history comments |
| `backend/src/modules/patient/patient.repository.js` | Backend / Patient | Wasana (header + Git origin) | Performs patient, clinical history, prescription, report, and lookup SQL. | Yes | No | No |
| `backend/src/modules/patient/consent.controller.js` | Backend / Consent | Wasana (header + Git origin) | Handles consent settings and temporary access-code requests/verification. | Yes, used by patient routes | No | No |
| `backend/src/modules/patient/consent.service.js` | Backend / Consent | Wasana (header + Git origin) | Enforces consultation-scoped, attempt-limited temporary consent. | Yes | No | No |
| `backend/src/modules/patient/consent.repository.js` | Backend / Consent | Wasana (header + Git origin) | Persists consent settings, access requests, grants, attempts, and expiry. | Yes | No | No |
| `backend/src/modules/emergency/emergency.routes.js` | Backend / Emergency | Wasana (header + Git origin) | Declares SOS, break-glass, alert list, and resolution routes. | Yes, mounted `/api/emergencies` | No | No |
| `backend/src/modules/emergency/emergency.controller.js` | Backend / Emergency | Wasana (header + Git origin) | Derives patient identity from session and maintains five-minute break-glass grants. | Yes | No | No |
| `backend/src/modules/emergency/emergency.service.js` | Backend / Emergency | Wasana (header + Git origin) | Creates alerts, dispatches notifications, logs access, retrieves snapshots, and resolves alerts. | Yes | No | Yes: stale SMS/history comments |
| `backend/src/modules/emergency/emergency.repository.js` | Backend / Emergency | Wasana (header + Git origin) | Queries alerts, emergency snapshots, contact data, and access logs. | Yes | No | No |
| `backend/src/modules/hospital/hospital.routes.js` | Backend / Hospital | Wasana (header + Git origin) | Declares own-hospital profile, OPD, check-in, walk-in, and assisted registration routes. | Yes, mounted `/api/hospitals` | No | No |
| `backend/src/modules/hospital/hospital.controller.js` | Backend / Hospital | Wasana (header + Git origin) | Handles hospital and OPD HTTP operations. | Yes | No | No |
| `backend/src/modules/hospital/hospital.service.js` | Backend / Hospital | Wasana (header + Git origin) | Validates linked hospital operations, assisted patients, and walk-ins. | Yes | No | No |
| `backend/src/modules/hospital/hospital.repository.js` | Backend / Hospital | Wasana (header + Git origin) | Performs hospital, doctors, OPD queue, patient, and walk-in SQL. | Yes | No | Yes: non-atomic duplicate checks |
| `backend/src/modules/laboratory/laboratory.routes.js` | Backend / Laboratory | Pamudika + Wasana (substantial Git) | Declares registration, own profile/queue, status, report, and patient-report routes. | Yes, mounted `/api/laboratories` | No | Yes: shared implementation; Pamudika header is valid |
| `backend/src/modules/laboratory/laboratory.controller.js` | Backend / Laboratory | Pamudika (header + Git origin) | Handles laboratory onboarding, queue/status, uploads, and patient reports. | Yes | No | Yes: URL validation; Pamudika header verified |
| `backend/src/modules/laboratory/laboratory.service.js` | Backend / Laboratory | Pamudika + Wasana (substantial Git) | Enforces lab ownership/status transitions and report finalization. | Yes | No | Yes: shared implementation/step comments; Pamudika header is valid |
| `backend/src/modules/laboratory/laboratory.repository.js` | Backend / Laboratory | Pamudika (header + Git origin) | Performs laboratory, request, report, and queue SQL. | Yes | No | No: Pamudika header verified |
| `backend/src/modules/interaction/interaction.routes.js` | Backend / Doctor safety | Tharindu (header + Git origin) | Declares active-consultation drug/allergy conflict checking. | Yes, mounted `/api/interactions` | No | No |
| `backend/src/modules/interaction/interaction.controller.js` | Backend / Doctor safety | Tharindu (header + Git origin) | Handles medicine conflict checks and audit logging. | Yes | No | No |
| `backend/src/modules/interaction/interaction.service.js` | Backend / Doctor safety | Tharindu (header + Git origin) | Normalizes medicines and evaluates allergy/interaction conflicts. | Yes | No | No |
| `backend/src/modules/interaction/interaction.repository.js` | Backend / Doctor safety | Tharindu (header + Git origin) | Reads allergy, active prescription, and interaction records. | Yes | No | No |
| `backend/src/modules/prescription/prescription.routes.js` | Backend / Prescription | Pamudika (header + Git origin) | Declares create, read, QR verify, and dispense routes. | Yes, mounted `/api/prescriptions` | No | Yes: incomplete author name |
| `backend/src/modules/prescription/prescription.controller.js` | Backend / Prescription | Pamudika + Wasana (substantial Git) | Enforces session-derived doctor/pharmacy identity and prescription ownership. | Yes | No | Yes: incomplete author name |
| `backend/src/modules/prescription/prescription.service.js` | Backend / Prescription | Pamudika + Wasana (substantial Git) | Creates prescriptions, expires them, and performs partial dispensing. | Yes | No | Yes: non-transactional race; step comments |
| `backend/src/modules/prescription/prescription.repository.js` | Backend / Prescription | Pamudika + Wasana (substantial Git) | Performs prescription, item, status, and dispensing-history SQL. | Yes | No | Yes: non-atomic updates |
| `backend/src/modules/pharmacy/pharmacy.routes.js` | Backend / Pharmacy | Pamudika + Wasana (substantial Git) | Declares onboarding, own profile/dashboard/history, and approval routes. | Yes, mounted `/api/pharmacies` | No | No |
| `backend/src/modules/pharmacy/pharmacy.controller.js` | Backend / Pharmacy | Pamudika + Wasana (substantial Git) | Handles pharmacy HTTP operations. | Yes | No | No |
| `backend/src/modules/pharmacy/pharmacy.service.js` | Backend / Pharmacy | Pamudika + Wasana (substantial Git) | Implements registration, profile allow-listing, dashboard, history, and approval. | Yes | No | Yes: step comments |
| `backend/src/modules/pharmacy/pharmacy.repository.js` | Backend / Pharmacy | Pamudika + Wasana (substantial Git) | Performs pharmacy, dashboard, dispensing, and registration SQL. | Yes | No | No |
| `backend/src/modules/order/order.routes.js` | Backend / Pharmacy/order | Pamudika + Wasana (substantial Git) | Declares patient order and assigned-pharmacy fulfillment routes. | Yes, mounted `/api/orders` | No | No |
| `backend/src/modules/order/order.controller.js` | Backend / Pharmacy/order | Pamudika (header + Git origin) | Handles medicine order placement, status, and scoped reads. | Yes | No | Yes: missing function comments |
| `backend/src/modules/order/order.service.js` | Backend / Pharmacy/order | Pamudika + Wasana (substantial Git) | Enforces ownership and order status transitions. | Yes | No | No |
| `backend/src/modules/order/order.repository.js` | Backend / Pharmacy/order | Pamudika (header + Git origin) | Performs medicine-order SQL. | Yes | No | No |
| `backend/src/modules/payment/payment.routes.js` | Backend / Payment | Pamudika (header + Git origin) | Declares authenticated patient sandbox-payment routes. | Yes, mounted `/api/payments` | No | No |
| `backend/src/modules/payment/payment.controller.js` | Backend / Payment | Pamudika + Wasana (substantial Git) | Maps sandbox payment requests and ownership-aware responses. | Yes | No | No |
| `backend/src/modules/payment/payment.service.js` | Backend / Payment | Pamudika + Wasana (substantial Git) | Validates patient ownership and sandbox payment state. | Yes | No | Yes: deliberately not a real gateway |
| `backend/src/modules/payment/payment.repository.js` | Backend / Payment | Pamudika (header + Git origin) | Performs payment transaction SQL. | Yes | No | No |
| `backend/src/modules/health-content/healthContent.routes.js` | Backend / Admin content | Lasitha + Wasana (substantial Git) | Declares public reads and admin content mutations. | Yes, mounted `/api/admin/health-content` | No | Yes: draft exposure; missing author |
| `backend/src/modules/health-content/healthContent.controller.js` | Backend / Admin content | Lasitha + Wasana (substantial Git) | Handles article CRUD, publication, and reads. | Yes | No | Yes: missing author |
| `backend/src/modules/health-content/healthContent.service.js` | Backend / Admin content | Lasitha + Wasana (substantial Git) | Validates categories, uploads images, and manages publication. | Yes | No | Yes: missing author |
| `backend/src/modules/health-content/healthContent.repository.js` | Backend / Admin content | Lasitha + Wasana (substantial Git) | Performs health-content CRUD and status filtering. | Yes | No | Yes: missing author; public all-status read |

## Database and migrations

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `backend/migrations/001_create_otp_verifications.sql` | Database / Auth | Lasitha (Git origin; no header) | Creates pending OTP registration storage. | Required increment | No | Yes: plaintext OTP; legacy header style |
| `backend/migrations/003_add_verification_status.sql` | Database / Auth/Admin | Lasitha (Git origin; no header) | Adds professional approval status. | Required increment | No | Yes: migration sequence gap |
| `backend/migrations/004_create_health_content_table.sql` | Database / Admin content | Lasitha (Git origin; no header) | Creates health content storage. | Required increment | No | No |
| `backend/migrations/005_create_system_settings_table.sql` | Database / Admin | Lasitha (Git origin; no header) | Creates configurable system settings. | Required increment | No | No |
| `backend/migrations/006_fix_lab_technician_role_constraint.sql` | Database / Laboratory | Lasitha (Git origin + blame; no header) | Aligns the user-role constraint with `lab_technician`. | Required increment | No | No |
| `backend/migrations/007_fix_lab_request_priority_default.sql` | Database / Laboratory | AUTHORSHIP REQUIRES TEAM CONFIRMATION (team header; Wasana Git origin) | Normalizes lab-request priority default. | Required increment | No | No |

The repository has no migration `002` and no checked-in base schema for most referenced tables. The migrations are therefore not a complete clean-install database definition.

## Web application shell, shared components, and services

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `frontend/src/main.jsx` | Web / application | Wasana (header + Git origin) | Mounts React Query and the application. | Yes, entry point | No | Yes: duplicate `Toaster` |
| `frontend/src/App.jsx` | Web / routing | Wasana (header + Git origin) | Restores sessions and defines all web routes/role guards. | Yes | No | Yes: duplicate `Toaster`, no catch-all |
| `frontend/src/index.css` | Web / shared design | Wasana (Git origin; no header) | Defines Tailwind tokens and module-specific themes. | Yes, imported by `main.jsx` | No | No |
| `frontend/src/App.css` | Web / legacy style | Wasana (Git origin; no header) | Contains unused starter/legacy application styles. | No import found | Suspected obsolete | Yes |
| `frontend/src/components/chat/AIChatWidget.jsx` | Web / Patient AI | Wasana (header + Git origin) | Provides patient AI chat, prompts, markdown output, and disclaimer UI. | Yes, mounted in patient layout | No | Yes: privacy disclosure/cost limits |
| `frontend/src/components/common/Alert.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders semantic inline alerts. | Yes | No | No |
| `frontend/src/components/common/Badge.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders status badges. | Yes | No | Yes: incomplete file header |
| `frontend/src/components/common/Button.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders themed buttons with loading/disabled states. | Yes | No | Yes: incomplete file header |
| `frontend/src/components/common/Card.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders consistent cards and headings. | Yes | No | Yes: incomplete file header |
| `frontend/src/components/common/DataTable.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders tables and empty states. | Yes | No | Yes: clickable rows are not keyboard controls |
| `frontend/src/components/common/FaqAccordion.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders FAQ accordion content. | Yes, authentication/help surfaces | No | No |
| `frontend/src/components/common/HealthAwarenessFeed.jsx` | Web / Patient | Wasana (header + Git origin) | Fetches, filters, and rotates published health articles. | Yes | No | Yes: history comment |
| `frontend/src/components/common/Input.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders labeled text inputs and errors. | Yes | No | Yes: incomplete header/ARIA linkage |
| `frontend/src/components/common/Modal.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders overlay dialogs. | Yes | No | Yes: accessibility implementation incomplete |
| `frontend/src/components/common/PageHeader.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders module-themed page hero/header content. | Yes | No | No |
| `frontend/src/components/common/QRScanner.jsx` | Web / shared QR | Wasana (Git origin + blame; header contradicted) | Starts/stops camera QR scanning with cleanup. | Yes | No | Yes: named author contradicted by Git |
| `frontend/src/components/common/Spinner.jsx` | Web / shared UI | Wasana (header + Git origin) | Renders loading indicators. | Yes | No | Yes: incomplete file header |
| `frontend/src/components/doctor/ConsultationNotesModal.jsx` | Web / Doctor | Tharindu (header + Git origin) | Legacy combined notes/lab-order modal. | No import found | Suspected obsolete; logic duplicated in consultation page | Yes |
| `frontend/src/components/doctor/PatientNotesModal.jsx` | Web / Doctor | Tharindu (header + Git origin) | Legacy patient notes history modal. | No import found | Suspected obsolete; logic duplicated in consultation page | Yes |
| `frontend/src/components/layout/TopNavbar.jsx` | Web / shared layout | Wasana (header + Git origin) | Provides responsive module-aware navigation and logout. | Yes, used by all portals | No | Yes: missing `@module` only |
| `frontend/src/components/layout/AdminLayout.jsx` | Web / Admin layout | Lasitha (Git origin; Wasana theme edits) | Wraps admin routes with navigation and outlet. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/AdminNavbar.jsx` | Web / Admin layout | Wasana (Git origin; no header) | Defines admin navigation items. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/DoctorLayout.jsx` | Web / Doctor layout | Wasana (header + Git origin) | Wraps doctor routes. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/DoctorNavbar.jsx` | Web / Doctor layout | Wasana (Git origin; no header) | Defines doctor navigation items. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/HospitalLayout.jsx` | Web / Hospital layout | Wasana (header + Git origin) | Wraps hospital routes. | Yes | No | No |
| `frontend/src/components/layout/HospitalNavbar.jsx` | Web / Hospital layout | Wasana (header + Git origin) | Defines hospital navigation items. | Yes | No | No |
| `frontend/src/components/layout/LabLayout.jsx` | Web / Laboratory layout | Wasana (Git origin; no header) | Wraps laboratory routes. | Yes | No | Yes: missing module/author |
| `frontend/src/components/layout/LabNavbar.jsx` | Web / Laboratory layout | Wasana (Git origin; no header) | Defines laboratory navigation and logout. | Yes | No | Yes: missing module/author |
| `frontend/src/components/layout/PatientLayout.jsx` | Web / Patient layout | Wasana (header + Git origin) | Wraps patient routes. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/PatientNavbar.jsx` | Web / Patient layout | Wasana (header + Git origin) | Defines patient navigation items. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/PharmacyLayout.jsx` | Web / Pharmacy layout | Wasana (header + Git origin) | Wraps pharmacy routes. | Yes | No | Yes: incomplete header |
| `frontend/src/components/layout/PharmacyNavbar.jsx` | Web / Pharmacy layout | Wasana (header + Git origin) | Defines pharmacy navigation items. | Yes | No | Yes: incomplete header |
| `frontend/src/services/api.js` | Web / shared service | Wasana (header + Git origin) | Centralizes API origin, credentials, and JSON headers. | Yes | No | No |
| `frontend/src/services/auth.service.js` | Web / Authentication | Lasitha (header + Git origin) | Calls forgot/reset password endpoints. | Yes | No | Yes: missing `@desc` |
| `frontend/src/services/appointment.service.js` | Web / Appointment | Wasana (header + Git origin) | Calls booking, patient appointment, and status endpoints. | Yes | No | Yes: header says “Member 2” |
| `frontend/src/services/doctor.service.js` | Web / Doctor | Wasana (header + Git origin) | Calls doctor directory/profile/availability endpoints. | Yes | No | Yes: header says “Member 2” |
| `frontend/src/services/healthContentService.js` | Web / Patient content | Wasana (header + Git origin) | Fetches published health content. | Yes | No | No |
| `frontend/src/services/interaction.service.js` | Web / Doctor safety | Tharindu (header + Git origin) | Calls consultation-scoped conflict checking. | Yes | No | No |
| `frontend/src/services/patient.service.js` | Web / Patient | Wasana (header + Git origin) | Centralizes patient/clinical/consent/report API calls. | Yes | No | No |
| `frontend/src/services/prescription.service.js` | Web / Prescription | Pamudika (header + Git origin) | Calls prescription create/read/verify endpoints. | Yes | No | Yes: incomplete author name |
| `frontend/src/store/authStore.js` | Web / shared state | Wasana (header + Git origin) | Stores the hydrated session user in memory. | Yes | No | No |
| `frontend/src/utils/allergenSearch.js` | Web / Patient | Wasana (header + Git origin) | Supplies fuzzy allergen search. | Yes | No | No |
| `frontend/src/utils/dateUtils.js` | Web / Patient | Wasana (header + Git origin) | Formats ages/dates. | Yes | No | No |
| `frontend/src/utils/labTestSearch.js` | Web / Doctor | Tharindu (header + Git origin) | Supplies fuzzy laboratory-test search. | Yes | No | No |
| `frontend/src/utils/medicineSearch.js` | Web / Doctor | Tharindu (header + Git origin) | Supplies fuzzy medicine search. | Yes | No | No |
| `frontend/src/utils/vaccineSearch.js` | Web / Patient | Wasana (header + Git origin) | Supplies fuzzy vaccine search. | Yes | Exact copy also exists on mobile | Low |

## Web pages

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `frontend/src/pages/auth/LoginPage.jsx` | Web page / Authentication | Lasitha (header + Git origin) | Signs users in and redirects by role. | Route `/login` | No | Yes: missing module; terminology |
| `frontend/src/pages/auth/RegisterPage.jsx` | Web page / Authentication | Lasitha + Wasana (original feature + substantial UI) | Collects role-specific registration data and starts OTP verification. | Route `/register` | No | Yes: stale unreachable comment |
| `frontend/src/pages/auth/OtpVerificationPage.jsx` | Web page / Authentication | Lasitha (Git origin; no header) | Verifies registration codes and resends them. | Route `/verify-otp` | No | Yes: missing author/module; browser alert/history header |
| `frontend/src/pages/auth/ForgotPasswordPage.jsx` | Web page / Authentication | Lasitha (header + Git origin) | Requests password-reset email. | Route `/forgot-password` | No | Yes: missing module |
| `frontend/src/pages/auth/ResetPasswordPage.jsx` | Web page / Authentication | Lasitha (header + Git origin) | Validates token and changes password. | Route `/reset-password` | No | Yes: missing module |
| `frontend/src/pages/patient/PatientProfilePage.jsx` | Web page / Patient | Wasana (header + Git origin) | Manages profile, safety history, vaccination scan, consent, and awareness feed. | Route `/patient/profile` | No | Yes: monolithic/history header |
| `frontend/src/pages/patient/MedicalRecordsPage.jsx` | Web page / Patient | Wasana (header + Git origin) | Lists and opens medical records. | Route `/patient/medical-records` | No | Yes: missing module |
| `frontend/src/pages/patient/PrescriptionsPage.jsx` | Web page / Prescription patient view | Wasana (header + Git origin) | Displays prescription status, medicines, and QR details. | Route `/patient/prescriptions` | No | Yes: missing module tag; Wasana header verified |
| `frontend/src/pages/patient/LabReportsPage.jsx` | Web page / Laboratory patient view | Wasana (header + Git origin) | Lists, filters, opens, and marks laboratory reports read. | Route `/patient/lab-reports` | No | Yes: missing module |
| `frontend/src/pages/patient/DoctorSearchPage.jsx` | Web page / Patient | Wasana (header + Git origin) | Searches doctors and opens booking. | Route `/patient/doctors` | No | No |
| `frontend/src/pages/patient/BookAppointmentPage.jsx` | Web page / Appointment | Wasana (header + Git origin) | Selects slots, books, and reschedules appointments. | Route `/patient/book-appointment/:doctorId` | No | Yes: generic name “Member 2” should be clarified, student ID matches Git |
| `frontend/src/pages/patient/MyAppointmentsPage.jsx` | Web page / Appointment | Wasana (header + Git origin) | Displays and cancels patient appointments. | Route `/patient/appointments` | No | No: Wasana header verified |
| `frontend/src/pages/patient/OrderTrackerPage.jsx` | Web page / Pharmacy/order | Pamudika + Wasana (substantial Git) | Displays medicine order progress and payment actions. | Route `/patient/orders` | No | Yes: incomplete header |
| `frontend/src/pages/patient/PaymentHistoryPage.jsx` | Web page / Payment | Pamudika + Wasana (substantial Git) | Displays sandbox payment history and details. | Route `/patient/payments` | No | Yes: incomplete header |
| `frontend/src/pages/patient/PatientLookupPage.jsx` | Web page / QR lookup | Wasana (header + Git origin) | Displays a doctor-facing patient lookup result. | Route `/lookup/:qrCodeId` | No | Yes: standalone/unguarded UX and stale description |
| `frontend/src/pages/doctor/DoctorDashboard.jsx` | Web page / Doctor | Tharindu + Wasana (substantial Git) | Shows dashboard metrics, patient lookup, walk-in start, and lab review. | Route `/doctor/dashboard` | No | Yes: very large component/history comments |
| `frontend/src/pages/doctor/AppointmentQueuePage.jsx` | Web page / Doctor | Tharindu + Wasana (substantial Git) | Polls and manages the doctor's daily queue. | Route `/doctor/queue` | No | Yes: polling overlap risk |
| `frontend/src/pages/doctor/ConsultationPage.jsx` | Web page / Doctor | Wasana (header + Git origin) | Runs consultation, consent, records, notes, prescription, interactions, and lab workflow. | Route `/doctor/consultation/:appointmentId` | No | Yes: extreme size; Wasana header verified |
| `frontend/src/pages/doctor/DoctorProfilePage.jsx` | Web page / Doctor | Tharindu + Wasana (substantial Git) | Edits profile photo/details and availability. | Route `/doctor/profile` | No | Yes: very large component |
| `frontend/src/pages/pharmacy/PharmacyDashboard.jsx` | Web page / Pharmacy | Pamudika + Wasana (substantial Git) | Shows dispensing metrics and QR/patient lookup entry points. | Route `/pharmacy/dashboard` | No | Yes: incomplete header |
| `frontend/src/pages/pharmacy/PatientQRLookupPage.jsx` | Web page / Pharmacy | Pamudika + Wasana (substantial Git) | Looks up a patient and lists eligible prescriptions after UI confirmation. | Route `/pharmacy/patient-lookup` | No | Yes: confirmation is frontend-only; incomplete header |
| `frontend/src/pages/pharmacy/PharmacyLookupPage.jsx` | Web page / Pharmacy | Wasana + Pamudika (substantial Git) | Verifies a prescription QR and dispenses item quantities. | Route `/pharmacy/:qrValue` | No | Yes: Wasana original-author header valid; Pamudika dispensing implementation |
| `frontend/src/pages/pharmacy/PharmacyDispensingHistoryPage.jsx` | Web page / Pharmacy | Wasana (Git origin + blame; header contradicted) | Lists prescriptions dispensed by the pharmacy. | Route `/pharmacy/history` | No | Yes: named author header contradicted by Git |
| `frontend/src/pages/pharmacy/PharmacyProfilePage.jsx` | Web page / Pharmacy | Wasana (header + Git origin) | Views and edits the linked pharmacy profile. | Route `/pharmacy/profile` | No | No: Wasana header verified |
| `frontend/src/pages/pharmacy/PharmacyRegisterPage.jsx` | Web page / Pharmacy | Pamudika + Wasana (substantial Git) | Provides standalone pharmacy onboarding. | Route `/pharmacy/register` | Duplicates part of general registration | Yes: incomplete header/duplicate onboarding |
| `frontend/src/pages/laboratory/LabDashboard.jsx` | Web page / Laboratory | Pamudika + Wasana (substantial Git) | Shows laboratory workload summary. | Route `/laboratory/dashboard` | No | Yes: missing module/author |
| `frontend/src/pages/laboratory/LabQueuePage.jsx` | Web page / Laboratory | Pamudika + Wasana (substantial Git) | Filters assigned requests and changes statuses. | Route `/laboratory/queue` | No | Yes: missing module/author |
| `frontend/src/pages/laboratory/LabReportUploadPage.jsx` | Web page / Laboratory | Pamudika + Wasana (substantial Git) | Finalizes findings and optional report URL. | Route `/laboratory/report/:requestId` | No | Yes: missing module/author; backend URL validation |
| `frontend/src/pages/laboratory/LabRegisterPage.jsx` | Web page / Laboratory | Pamudika + Wasana (substantial Git) | Provides standalone laboratory onboarding. | Route `/laboratory/register` | Duplicates part of general registration | Yes: missing module/author |
| `frontend/src/pages/hospital/HospitalHomePage.jsx` | Web page / Hospital | Wasana (header + Git origin) | Displays hospital operations overview. | Route `/hospital/dashboard` | No | No |
| `frontend/src/pages/hospital/HospitalOPDPage.jsx` | Web page / Hospital | Wasana (header + Git origin) | Runs OPD queue, check-in, walk-in, and assisted registration. | Route `/hospital/opd` | No | Yes: polling overlap; large component |
| `frontend/src/pages/hospital/HospitalEmergencyPage.jsx` | Web page / Emergency/Hospital | Wasana (header + Git origin) | Polls active SOS alerts and starts/resolves break-glass workflows. | Route `/hospital/emergency` | No | Yes: polling overlap |
| `frontend/src/pages/emergency/EmergencySnapshotPage.jsx` | Web page / Emergency | Wasana (header + Git origin) | Shows minimal emergency data after audited authorization. | Route `/hospital/emergency/snapshot/:patientId` | No | No |
| `frontend/src/pages/admin/AdminOverviewPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Shows admin summary and shortcuts. | Route `/admin` | No | Yes: missing author |
| `frontend/src/pages/admin/AdminApprovalsPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Approves/rejects pending professional accounts. | Route `/admin/approvals` | No | Yes: browser prompts/alerts; missing author |
| `frontend/src/pages/admin/AdminAccountManagementPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Filters users and toggles active status. | Route `/admin/accounts` | No | Yes: no confirmation; missing author |
| `frontend/src/pages/admin/AdminRbacPanelPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Displays the RBAC reference matrix. | Route `/admin/rbac` | No | Yes: missing author |
| `frontend/src/pages/admin/AdminAuditLogPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Filters and paginates audit logs. | Route `/admin/audit-log` | No | Yes: missing author |
| `frontend/src/pages/admin/AdminHealthContentPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Creates, edits, publishes, and deletes health content. | Route `/admin/health-content` | No | Yes: browser dialogs; missing author |
| `frontend/src/pages/admin/AdminEmergencyOversightPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Displays break-glass oversight records. | Route `/admin/emergency-oversight` | No | Yes: missing author |
| `frontend/src/pages/admin/AdminAnalyticsPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Displays aggregate usage analytics. | Route `/admin/analytics` | No | Yes: missing author |
| `frontend/src/pages/admin/AdminQrReissuePage.jsx` | Web page / Admin/QR | Lasitha + Wasana (original features + substantial UI) | Searches patients and reissues compromised QR identities. | Route `/admin/qr-reissue` | No | Yes: browser dialogs; missing author |
| `frontend/src/pages/admin/AdminSystemSettingsPage.jsx` | Web page / Admin | Lasitha + Wasana (original features + substantial UI) | Reads and updates system settings. | Route `/admin/settings` | No | Yes: settings not wired to all hardcoded controls; missing author |

## Mobile application

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `mobile/index.js` | Mobile / entry | Wasana (header + Git origin) | Registers the Expo root component. | Yes | No | No |
| `mobile/App.js` | Mobile / navigation | Wasana (header + Git origin) | Hydrates session and implements patient tabs/auth overlays and role fallbacks. | Yes | No | Yes: manual navigation/state monolith |
| `mobile/src/constants/theme.js` | Mobile / shared UI | Wasana (Git origin; placeholder header) | Defines shared colors, spacing, radius, typography, and shadow tokens. | No imports found | Effectively dead; font packages not installed | Yes |
| `mobile/src/components/EmergencySOS.js` | Mobile / Emergency | Wasana (header + Git origin) | Shows countdown SOS, opens phone dialer, captures GPS, and posts alert. | Yes, patient home | No | Yes: hardcoded dummy fallback and debug comments/logs |
| `mobile/src/components/HealthAwarenessFeed.js` | Mobile / Patient | Wasana (header + Git origin) | Displays rotating personalized health content. | Yes | No | No |
| `mobile/src/screens/LoginScreen.js` | Mobile screen / Authentication | Lasitha + Wasana (original features + substantial UI) | Authenticates users. | Active auth state | No | Low: terminology |
| `mobile/src/screens/RegisterScreen.js` | Mobile screen / Authentication | Lasitha + Wasana (original features + substantial UI) | Registers patient/doctor and opens code verification. | Active auth state | No | No |
| `mobile/src/screens/OtpVerificationScreen.js` | Mobile screen / Authentication | Lasitha + Wasana (original features + substantial UI) | Verifies/resends registration code with UI cooldown. | Active auth state | No | Low: OTP terminology |
| `mobile/src/screens/ForgotPasswordScreen.js` | Mobile screen / Authentication | Lasitha + Wasana (original features + substantial UI) | Requests a password-reset email. | Active auth state | Exact duplicate of reset screen | Yes |
| `mobile/src/screens/ResetPasswordScreen.js` | Mobile screen / Authentication | Lasitha + Wasana (original features + substantial UI) | Intended to submit token and new password. | Active auth state | Exact byte-for-byte copy of forgot screen; wrong component/header | Critical review |
| `mobile/src/screens/PatientHomeScreen.js` | Mobile screen / Patient | Wasana (header + Git origin) | Shows patient dashboard, quick actions, SOS, and content feed. | Active tab | No | Yes: local duplicated theme |
| `mobile/src/screens/PatientProfileScreen.js` | Mobile screen / Patient | Wasana (header + Git origin) | Manages profile and clinical background/vaccination data. | Active tab | No | Yes: extreme size/duplicated theme |
| `mobile/src/screens/PatientQRCardScreen.js` | Mobile screen / QR lookup | Wasana (header + Git origin) | Displays patient identity QR and emergency contact. | Active tab | No | No |
| `mobile/src/screens/MedicalRecordsScreen.js` | Mobile screen / Patient | Wasana (header + Git origin) | Lists and opens medical records. | Active tab | No | Yes: duplicated styling |
| `mobile/src/screens/PrescriptionsScreen.js` | Mobile screen / Prescription | Pamudika + Wasana (substantial Git) | Displays prescription history, status, medicines, and QR. | Active tab | No | Yes: mixed/compound author header |
| `mobile/src/screens/LabReportsScreen.js` | Mobile screen / Laboratory patient view | Wasana (header + Git origin) | Displays lab reports and opens report links. | Active overlay | No | Yes: duplicated styling/link trust |
| `mobile/src/screens/DoctorSearchScreen.js` | Mobile screen / Patient | Wasana (header + Git origin) | Searches doctors. | Active overlay | No | Yes: duplicated styling |
| `mobile/src/screens/DoctorProfileScreen.js` | Mobile screen / Doctor discovery/fallback | Lasitha + Wasana (original features + substantial UI) | Shows public doctor details or own doctor mobile fallback. | Active overlay/fallback | No | Yes: Lasitha header valid; Wasana later major UI |
| `mobile/src/screens/BookAppointmentScreen.js` | Mobile screen / Appointment | Wasana (header + Git origin) | Selects slot and books appointment. | Active overlay | No | Yes: backend validation dependency; Wasana header verified |
| `mobile/src/screens/MyAppointmentsScreen.js` | Mobile screen / Appointment | Wasana (header + Git origin) | Lists/cancels patient appointments. | Active tab/overlay | No | No: Wasana header verified |
| `mobile/src/screens/AIChatScreen.js` | Mobile screen / Patient AI | Wasana (header + Git origin) | Provides contextual AI chat and disclaimer. | Active overlay | No | Yes: privacy disclosure/cost limits |
| `mobile/src/services/api.js` | Mobile / shared service | Wasana (header + Git origin) | Configures device API origin and credentialed Axios. | Yes | No | No |
| `mobile/src/services/auth.service.js` | Mobile / Authentication | Lasitha (header + Git origin) | Calls registration, verification, login/session, and reset endpoints. | Yes | No | No |
| `mobile/src/services/appointment.service.js` | Mobile / Appointment | Wasana (header + Git origin) | Calls appointment booking/list/status endpoints. | Yes | No | No: Wasana header verified |
| `mobile/src/services/doctor.service.js` | Mobile / Doctor | Lasitha + Wasana (substantial Git) | Calls doctor directory/profile/slot endpoints. | Yes | No | Yes: Lasitha header valid; Wasana added search implementation |
| `mobile/src/services/patient.service.js` | Mobile / Patient | Wasana (header + Git origin) | Centralizes patient clinical API calls. | Yes | No | No |
| `mobile/src/services/prescription.service.js` | Mobile / Prescription | Pamudika (header + Git origin) | Calls prescription list/detail endpoints. | Yes | No | Yes: incomplete author name |
| `mobile/src/store/authStore.js` | Mobile / shared state | Wasana (header + Git origin) | Stores the session user in memory. | Yes | No | No |
| `mobile/src/utils/allergenSearch.js` | Mobile / Patient | Wasana (header + Git origin) | Supplies fuzzy allergen search. | Yes | No | No |
| `mobile/src/utils/vaccineSearch.js` | Mobile / Patient | Wasana (header + Git origin) | Supplies fuzzy vaccine search. | Yes | Exact copy of web utility | Low |

## Configuration and manifests

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `package.json` | Configuration / root | Wasana (Git origin; no header) | Holds root-level QR dependencies. | No root scripts/source consume them | Suspected obsolete | Yes |
| `backend/package.json` | Configuration / Backend | Wasana (Git origin; no header) | Defines API scripts and dependencies. | Yes | Contains likely unused packages | Yes |
| `backend/.env.example` | Configuration / Backend | Wasana (Git origin; no header) | Documents database, session, browser, email, AI, Telegram, and storage variables. | Yes, setup reference | No | No |
| `backend/.eslintrc.js` | Configuration / Backend | Wasana (header + Git origin) | Legacy backend ESLint rules. | No lint script references it directly | Possibly active for editor only | Low |
| `backend/.vscode/settings.json` | Configuration / editor | Wasana (Git origin; no header) | Stores workspace editor settings. | Editor-only | No | No |
| `frontend/package.json` | Configuration / Web | Wasana (Git origin; no header) | Defines Vite/React scripts and dependencies. | Yes | No | No |
| `frontend/.env.example` | Configuration / Web | Wasana (Git origin; no header) | Documents the web API origin. | Yes | No | No |
| `frontend/eslint.config.js` | Configuration / Web | Wasana (Git origin; no header) | Defines web lint rules. | Yes, `npm run lint` | No | Yes: missing header only |
| `frontend/vite.config.js` | Configuration / Web | Wasana (Git origin; no header) | Configures React/Tailwind Vite plugins. | Yes | No | Yes: missing header |
| `frontend/vercel.json` | Configuration / Web deployment | Wasana (Git origin; no header) | Rewrites SPA routes to `index.html`. | Yes in Vercel | No | No |
| `frontend/index.html` | Web shell | Wasana (Git origin; no header) | Provides the root DOM and metadata. | Yes | No | Low: minimal metadata |
| `mobile/package.json` | Configuration / Mobile | Wasana (Git origin; no header) | Defines Expo scripts and dependencies. | Yes | No | Yes: no lint/test scripts |
| `mobile/.env.example` | Configuration / Mobile | Lasitha (Git origin); Wasana later edits | Documents device API and emergency phone variables. | Yes, setup reference | No | Yes: code fallback conflicts with example |
| `mobile/app.json` | Configuration / Mobile | Wasana (Git origin; no header) | Configures Expo application metadata/assets/plugins. | Yes | No | No |
| `mobile/eas.json` | Configuration / Mobile deployment | Wasana (Git origin; no header) | Configures EAS build profiles. | Yes for EAS | No | No |

## Documentation

| File | Layer / module | File-level authorship evidence | Purpose | Active / referenced | Obsolete / duplicate | Review |
|---|---|---|---|---|---|---|
| `README.md` | Documentation / project | Wasana (current text Git blame; initial stub unrelated) | Describes architecture, setup, roles, APIs, deployment, and limitations. | Yes | No | Yes: base schema dependency needs stronger handoff |
| `CARE4U_VIVA_CODE_GUIDE.md` | Documentation / project | Wasana (Git origin + blame) | Maps features, endpoints, workflows, and viva entry points. | Yes | No | Yes: does not mention identified release blockers |
| `CARE4U_DEPLOYMENT_CHECKLIST.md` | Documentation / deployment | Wasana (Git origin + blame) | Lists deployment variables, security checks, and smoke tests. | Yes | No | Yes: several unchecked blockers remain |
| `docs/epic_116_117_progress.md` | Documentation / Auth progress | Lasitha (Git origin + blame) | Records historical forgot/reset verification and then-known issues. | Reference only | Partly stale: OTP/DOB/email notes no longer match current code | Yes |
| `docs/epic_204_lockout_progress.md` | Documentation / Auth progress | Lasitha (Git origin + blame) | Records lockout/rate-limit implementation and test results. | Reference only | Partly stale PR/status wording | Yes |
| `frontend/README.md` | Documentation / Web | Vite template (not student-authored) | Contains untouched Vite starter text. | Not useful to Care4U | Obsolete boilerplate | Yes |

## Tests

No application test files were found (`*.test.*`, `*.spec.*`, `tests/`, or `__tests__/`). `backend/scripts/check-syntax.js` is a syntax gate, not a behavior/security test suite.

## Generated, dependency, and binary assets

| Paths | Classification | Treatment / status |
|---|---|---|
| `node_modules/`, `backend/node_modules/`, `frontend/node_modules/`, `mobile/node_modules/` | Generated dependencies | Excluded from content audit. |
| `package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`, `mobile/package-lock.json` | Generated dependency lockfiles | Presence/version consistency checked; internals excluded. |
| `frontend/.vite/deps/_metadata.json`, `frontend/.vite/deps/package.json` | Generated Vite cache | Tracked generated files; should not be source-controlled. |
| `dist/`, `build/`, `coverage/`, `.expo/` | Generated output/cache | Not present as tracked source; excluded. |
| `docs/screenshots/01.png` through `docs/screenshots/32.jpeg` | Documentation/UI evidence (32 images) | Sampled visually; screenshots appear historical and do not consistently represent the current top-navigation design. |
| `frontend/public/logo.png`, `frontend/public/favicon.svg`, `mobile/assets/logo.png`, `mobile/assets/icon.png`, `mobile/assets/adaptive-icon.png`, `mobile/assets/splash-icon.png`, `mobile/assets/favicon.png`, `frontend/src/assets/hero.png` | Active image assets | Referenced by application/configuration. |
| `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`, `frontend/public/icons.svg` | Static assets | No references found; likely starter/obsolete assets. |
| `old_AIChatScreen.js` | Root stray source-like file | Not referenced; contains only a pasted shell fragment and is obsolete/suspicious. |

## Inventory totals

- 283 tracked files total.
- 277 tracked non-lock/non-generated files inventoried at repository level.
- 219 human-readable source/configuration/documentation files indexed and searched (excluding the two tracked Vite-cache files); high-risk flows and representative UI files were then read in detail.
- 75 backend JavaScript files syntax-checked.
- 43 web page components/routes audited.
- 16 mobile screen files audited (15 distinct screen implementations because `ResetPasswordScreen.js` duplicates `ForgotPasswordScreen.js`).
- 6 incremental SQL migrations.
- 0 automated application tests.

## Authorship Verification Summary

This is an evidence register, not an instruction to change source headers. “Verified” means the named original author is supported by the existing header and meaningful Git creation/implementation history; it does not exclude later contributors. Git accounts were mapped by commit email/name: lasitha = Lasitha, Wasana-K/Wasana-Karunanayaka = Wasana, UdayakumaraDMTL = Tharindu, S/21/001 = Pamudika. The lone initial repository stub by shamilaw-sci was not treated as authorship of the later README.

### Author headers verified as correct

- Pamudika: backend/src/modules/laboratory/laboratory.controller.js and laboratory.repository.js; the Pamudika original-author credit in laboratory.routes.js and laboratory.service.js is also valid despite later substantial Wasana work.
- Tharindu: backend/src/modules/appointment/appointment.routes.js and appointment.repository.js; appointment.controller.js already credits Tharindu and Wasana, both supported by meaningful commits. Pamudika's booking code there also requires co-credit discussion.
- Wasana: frontend/src/pages/doctor/ConsultationPage.jsx, frontend/src/pages/pharmacy/PharmacyLookupPage.jsx and PharmacyProfilePage.jsx, frontend/src/pages/patient/PrescriptionsPage.jsx, frontend/src/pages/patient/MyAppointmentsPage.jsx, mobile/src/screens/BookAppointmentScreen.js, mobile/src/screens/MyAppointmentsScreen.js, and the shared PharmacyLayout/PharmacyNavbar files. PharmacyLookupPage's original Wasana header remains valid although Pamudika later added substantial dispensing actions.
- Lasitha: mobile/src/screens/DoctorProfileScreen.js and mobile/src/services/doctor.service.js as original author; Wasana later implemented substantial new mobile UI/search behavior. Auth source headers identifying S/21/389 remain plausible original-author credit.
- Shared common components other than QRScanner.jsx: Wasana headers agree with creation history. Most other named source headers likewise agree with their file's Git origin; this identity check does not certify the required header format or sole authorship.

### Author headers confirmed wrong or invalid

| File | Current header | Evidence and disposition |
|---|---|---|
| frontend/src/components/common/QRScanner.jsx | Pamudika | Wasana created the file in 26be179; current blame is 472/472 lines Wasana. The named header is contradicted. Propose Wasana after the team acknowledges this evidence; no source edit in this pass. |
| frontend/src/pages/pharmacy/PharmacyDispensingHistoryPage.jsx | Pamudika | Wasana created the file in 914f5cb; current blame is 499/499 lines Wasana. The named header is contradicted. |
| mobile/src/constants/theme.js | [Your Name] (S/21/XXX) | This is an invalid template placeholder, not an attribution to a real teammate. Git origin is Wasana; the unused file's future/credit should be confirmed before changing it. |

No other real-person author header or student number was confirmed wrong merely because it differs from the module responsibility map.

### Files with multiple substantial implementation contributors

The following are supported by original feature commits plus later functional additions or large UI implementations, not just a single fix/merge/import. An existing original-author header is **not** automatically wrong or incomplete solely because the second name is absent.

| Files | Supported contributors / evidence |
|---|---|
| backend/app.js; backend/server.js; backend/src/middleware/auth.js | Wasana + Lasitha (CORS/session/error handling); Wasana + Pamudika (server reminder/expiry jobs); Lasitha + Wasana (original auth guards plus object-ownership guard), respectively. |
| backend/src/utils/email.js; backend/src/utils/qr.js | Email: Pamudika reminders, Lasitha auth email, Wasana appointment/consent/emergency email. QR: Pamudika prescription QR and Lasitha patient QR. |
| backend/src/modules/auth/auth.controller.js, auth.service.js, auth.repository.js; backend/src/modules/admin/admin.repository.js | Lasitha original auth/admin implementation; Wasana substantial profile/session/approval data logic. |
| backend/src/modules/health-content/healthContent.routes.js, healthContent.controller.js, healthContent.service.js, healthContent.repository.js | Lasitha CRUD/publish implementation; Wasana substantial infographic upload/storage additions. |
| backend/src/modules/appointment/appointment.routes.js, appointment.controller.js, appointment.repository.js | Tharindu original consultation/status/notes; Pamudika booking logic in controller/repository; Wasana expanded consultation/walk-in/booking behavior. Route integration alone is not credited as Pamudika authorship of routes. |
| backend/src/modules/laboratory/laboratory.routes.js, laboratory.service.js | Pamudika original laboratory workflow; Wasana later authenticated workflow/approval changes. The controller and repository remain Pamudika-supported single-origin headers. |
| frontend/src/pages/laboratory/LabDashboard.jsx, LabQueuePage.jsx, LabRegisterPage.jsx, LabReportUploadPage.jsx | Pamudika created functional first versions (71cdfdd); Wasana later implemented large authenticated/polished versions (8607752, b8355b6). |
| backend/src/modules/doctor/doctor.routes.js, doctor.controller.js, doctor.service.js, doctor.repository.js | Tharindu original doctor behavior; Wasana substantial clinical/profile integration; Pamudika implemented search/slot logic in controller/service/repository. Route integration alone does not add route authorship. |
| frontend/src/pages/doctor/DoctorDashboard.jsx, AppointmentQueuePage.jsx, DoctorProfilePage.jsx | Tharindu original screens; Wasana later large functional clinical-workflow/UI implementations. frontend/src/pages/doctor/ConsultationPage.jsx is Wasana-origin and must not be assigned to Tharindu by module. |
| backend/src/modules/pharmacy/pharmacy.routes.js, pharmacy.controller.js, pharmacy.service.js, pharmacy.repository.js; backend/src/modules/prescription/prescription.controller.js, prescription.service.js, prescription.repository.js | Pamudika original pharmacy/prescription features; Wasana later substantial authenticated dispensing and safety integration. |
| backend/src/modules/payment/payment.controller.js, payment.service.js; backend/src/modules/order/order.routes.js, order.service.js | Pamudika original payment/order logic; Wasana later substantial ownership/security and order-flow implementation. |
| frontend/src/pages/pharmacy/PharmacyDashboard.jsx, PatientQRLookupPage.jsx, PharmacyRegisterPage.jsx; frontend/src/pages/patient/OrderTrackerPage.jsx, PaymentHistoryPage.jsx | Pamudika original functional pages; Wasana later major QR, dashboard, tracking, and UI implementations. Their Pamudika original-author headers should not be erased. |
| frontend/src/pages/pharmacy/PharmacyLookupPage.jsx | Wasana created QR verification page (a2fb88b); Pamudika added dispensing actions (6d36225); Wasana later expanded authenticated dispensing (914f5cb). Wasana's original header is valid; any co-author line needs confirmation. |
| frontend/src/pages/admin/AdminOverviewPage.jsx, AdminApprovalsPage.jsx, AdminAccountManagementPage.jsx, AdminRbacPanelPage.jsx, AdminAuditLogPage.jsx, AdminHealthContentPage.jsx, AdminEmergencyOversightPage.jsx, AdminAnalyticsPage.jsx, AdminQrReissuePage.jsx, AdminSystemSettingsPage.jsx | Lasitha created the admin feature screens; Wasana later substantial module-wide UI implementations. Whether the team wants two @author lines for UI rewrites requires confirmation. |
| frontend/src/pages/auth/RegisterPage.jsx; mobile/src/screens/LoginScreen.js, RegisterScreen.js, OtpVerificationScreen.js, ForgotPasswordScreen.js, ResetPasswordScreen.js, DoctorProfileScreen.js; mobile/src/services/doctor.service.js | Lasitha original auth/doctor-profile flows; Wasana later substantial mobile/auth UI or doctor-search implementations. Do not replace Lasitha's original credit. |
| mobile/src/screens/PrescriptionsScreen.js | Pamudika original 403-line prescription screen; Wasana added medicine/status behavior and a large current UI. Its compound header acknowledges both but understates the later implementation. |

### Files requiring team confirmation

- AUTHORSHIP REQUIRES TEAM CONFIRMATION: backend/migrations/007_fix_lab_request_priority_default.sql has a generic “Care4U Team” header and a Wasana Git-origin commit; a commit identity alone does not prove the team intended sole credit.
- AUTHORSHIP REQUIRES TEAM CONFIRMATION before writing new co-author lines on the multi-contributor files above, especially backend/src/utils/email.js (three contributors, no header), backend/src/modules/appointment/appointment.controller.js (Pamudika booking code not named in current header), the four Laboratory web pages (no @author), and mobile/src/screens/PrescriptionsScreen.js (compound informal attribution).
- AUTHORSHIP REQUIRES TEAM CONFIRMATION for frontend/src/components/layout/AdminLayout.jsx if co-credit is proposed: Lasitha created the functional layout, while Wasana later changed its theme; the latter may be presentation-only. Retain the original attribution until clarified.
- Missing headers on other source/config files should use their inventory Git-origin evidence as a **candidate**, never the module owner as an automatic replacement. Do not overwrite a plausible existing header during automated cleanup.

### Previous audit findings withdrawn

Withdrawn: “wrong owner header” for all four Laboratory backend files, the Appointment backend files, frontend/src/pages/doctor/ConsultationPage.jsx, frontend/src/pages/patient/PrescriptionsPage.jsx and MyAppointmentsPage.jsx, frontend/src/pages/pharmacy/PharmacyLookupPage.jsx and PharmacyProfilePage.jsx, mobile/src/screens/DoctorProfileScreen.js, BookAppointmentScreen.js and MyAppointmentsScreen.js, mobile/src/services/appointment.service.js and doctor.service.js. Also withdrawn: assigning Pamudika to frontend/src/services/appointment.service.js or Wasana to backend/src/utils/email.js solely from latest commit/module. These were unsupported ownership inferences, not verified wrong-author findings.
