# Stabilization pass 1 — cleanup change log

Scope: H01, H02, H04 and H07, plus the explicitly permitted evidence-backed header, copy and logging cleanup. The earlier 01–03 audit documents were not changed. No other architecture/security finding was implemented.

Checks below use **B** = backend `node scripts/check-syntax.js` (75 files, pass), **F** = frontend ESLint and Vite production build (both pass), **M** = Babel JSX/module parse of six changed mobile files (pass), **D** = `git diff --check` (pass). These are static/build checks, not database, browser, or device integration tests.

| Changed source file | Exact change and reason | Behavior changed? | Check |
|---|---|---|---|
| `backend/src/middleware/auth.js` | Re-read role and approval status for each authenticated request; destroy a non-approved professional session, closing H01's stale-cookie route. | YES | B, D |
| `backend/src/modules/auth/auth.controller.js` | OTP verification creates a session only for a patient or approved account; pending professional response says approval is required and clears any session user. | YES | B, D |
| `backend/src/modules/auth/auth.routes.js` | Protect `/me` with `isAuthenticated` so hydration cannot accept an unapproved session. | YES | B, D |
| `backend/src/modules/auth/auth.service.js` | Require approval for non-patient login (including unexpected non-approved states); remove OTP and reset-token console disclosure. | YES | B, D |
| `backend/src/modules/appointment/appointment.controller.js` | Retain active-appointment check, then get records through the existing consent-filtered patient service and return consultation records only; remove email-address success logs. | YES | B, D |
| `backend/src/modules/doctor/doctor.repository.js` | Replace a stale UPDATED history marker with an explanation of the current doctor-name/specialty search. | NO | B, D |
| `backend/src/modules/health-content/healthContent.controller.js` | Add a public listing handler hard-coded to `published`, ignoring caller status. | YES | B, D |
| `backend/src/modules/health-content/healthContent.routes.js` | Add authenticated admin `GET /admin` listing; bind public `GET /` to the published-only handler. | YES | B, D |
| `backend/src/modules/patient/consent.service.js` | Remove development console output containing a patient consent access code and email. | NO | B, D |
| `backend/src/utils/expiryJob.js` | Stop returning/logging prescription QR values; keep aggregate expiry count. | NO | B, D |
| `backend/src/utils/reminderJob.js` | Stop logging patient email and appointment time in reminder outcomes; retain a non-identifying failure event. | NO | B, D |
| `frontend/src/App.jsx` | Remove the second toast host; keep the configured host in `main.jsx`. | NO | F, D |
| `frontend/src/components/common/QRScanner.jsx` | Correct contradicted author to Wasana (Git origin and all current blame); standardize default “QR code” label. | YES (copy only) | F, D |
| `frontend/src/components/layout/PatientNavbar.jsx` | Rename misleading `TEST_PATIENT_ID` local binding to `patientId`; query behavior is unchanged. | NO | F, D |
| `frontend/src/pages/admin/AdminHealthContentPage.jsx` | Fetch draft/all-status editorial list from the new authenticated `/admin` endpoint. | YES | F, D |
| `frontend/src/pages/auth/LoginPage.jsx` | Show the post-verification message passed by OTP navigation. | YES (copy) | F, D |
| `frontend/src/pages/auth/OtpVerificationPage.jsx` | Replace browser alert with a role-specific sign-in/approval message at login. | YES | F, D |
| `frontend/src/pages/doctor/DoctorDashboard.jsx` | Standardize patient “QR code” label; do not change scanning logic. | YES (copy only) | F, D |
| `frontend/src/pages/hospital/HospitalEmergencyPage.jsx` | Standardize “Break-Glass access” dialog heading. | YES (copy only) | F, D |
| `frontend/src/pages/patient/BookAppointmentPage.jsx` | Expand verified `Member 2 (S/21/081)` header to Wasana's name. | NO | F, D |
| `frontend/src/pages/patient/PrescriptionsPage.jsx` | Display “Partially filled”; leave internal status enum unchanged. | YES (copy only) | F, D |
| `frontend/src/pages/pharmacy/PharmacyDashboard.jsx` | Display “Partially filled”; leave internal status enum unchanged. | YES (copy only) | F, D |
| `frontend/src/pages/pharmacy/PharmacyDispensingHistoryPage.jsx` | Correct contradicted author to Wasana based on Git origin and blame. | NO | F, D |
| `frontend/src/services/appointment.service.js` | Expand verified `Member 2 (S/21/081)` header to Wasana's name. | NO | F, D |
| `frontend/src/services/doctor.service.js` | Expand verified `Member 2 (S/21/081)` header to Wasana's name. | NO | F, D |
| `frontend/src/services/healthContentService.js` | Call the published-only public endpoint without a status query; replace stale FIX comment. | YES | F, D |
| `mobile/App.js` | Pending professionals return to sign-in after OTP verification instead of becoming authenticated; reset branch now renders a functional reset screen. | YES | M, D |
| `mobile/src/constants/theme.js` | Replace invalid placeholder author with Wasana, supported by Git origin; retain this unused file. | NO | M, D |
| `mobile/src/components/HealthAwarenessFeed.js` | Use the public published-only feed without a status query, matching the enforced backend contract. | NO | M, D |
| `mobile/src/screens/OtpVerificationScreen.js` | Explain pending approval in a native alert and correct the stale header description. | YES | M, D |
| `mobile/src/screens/PrescriptionsScreen.js` | Display “Partially filled”; leave internal status enum unchanged. | YES (copy only) | M, D |
| `mobile/src/screens/ResetPasswordScreen.js` | Replace the duplicated request screen with reset-link/token, new-password and confirmation fields, backend reset call, and success/expired-token errors; fix wrong `@file` while preserving the existing author. | YES | M, D |

## Verification and limits

- Source files changed: **32** (11 backend, 15 frontend, 6 mobile). Documentation files added: 2.
- Source files with header or explanatory-comment changes: **11** (`doctor.repository.js`, `healthContent.routes.js`, `QRScanner.jsx`, `PharmacyDispensingHistoryPage.jsx`, `BookAppointmentPage.jsx`, `appointment.service.js`, `doctor.service.js`, `healthContentService.js`, `theme.js`, `OtpVerificationScreen.js`, `ResetPasswordScreen.js`).
- Files with user-facing copy changes: **12** (`auth.controller.js`, `auth.js`, `QRScanner.jsx`, `LoginPage.jsx`, `OtpVerificationPage.jsx`, `DoctorDashboard.jsx`, `HospitalEmergencyPage.jsx`, `PrescriptionsPage.jsx`, `PharmacyDashboard.jsx`, `OtpVerificationScreen.js`, `mobile/src/screens/PrescriptionsScreen.js`, and `ResetPasswordScreen.js`).
- Backend syntax: **PASS** after core fixes and again after cleanup. Frontend ESLint and production build: **PASS** after core fixes and again after cleanup. Mobile changed-file parser: **PASS** after reset implementation and cleanup. `git diff --check`: **PASS**.
- No live PostgreSQL, HTTP, browser, email, or device test was run. H01/H02/H04/H07 require role-specific integration and mobile-device verification before release. The mobile app has no deep-link scheme; reset email opens the existing web reset page, while mobile accepts a manually pasted full link or token. No token is auto-imported into the app.
- H04 uses the existing category-lock/grant policy. That policy does not independently hide every record marked `is_confidential`; a new meaning for that flag requires team confirmation and was not invented in this pass.
