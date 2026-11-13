# Care4U viva preparation

Current authentication sample: [backend/session workflow](02-authentication-and-access.md), [backend file reference](02-authentication-file-reference.md), [complete web/mobile UI file reference](03-authentication-ui-file-reference.md) and [Ctrl+F change map](02-authentication-change-map.md). [Stage 3A](../review/STAGE3A.md) adds 56 source/UI checks to the retained 89 backend checks, plus exact synthetic-browser states/screenshots. Native/device, real DB/cookies/provider/deployment acceptance remains pending. Shared files and other modules are explicitly partial; stop for independent review.

## Earlier scaffold and stage context

The first completed Stage 2A sample is [Authentication and access](02-authentication-and-access.md), with a [file-by-file reference](02-authentication-file-reference.md) and [change map](02-authentication-change-map.md). It is now updated through [Stage 2B](../review/STAGE2B.md): 89 application checks including actual rate middleware execution, resend integrity, partial dependency/UI traces and outstanding runtime/policy limits. Independent review is the next step; other module pages remain pending.

Stage 1 scaffold, 2026-11-12. This page records source-backed entry points and the proposed documentation order. It is not a claim that every workflow is verified.

Stage 1B preserved the inherited application baseline and added [an actionable review/test/documentation plan](../review/NEXT_STAGE_PLAN.md). Begin with isolated auth/session/ownership fixtures and the corresponding viva page. The review-tooling fixtures pass, while application runtime/visual journeys remain unverified.

Start with the existing [viva code guide](../../CARE4U_VIVA_CODE_GUIDE.md), then read the current [baseline](../review/BASELINE.md), [findings](../review/FINDINGS.md) and [ownership register](../review/OWNERSHIP.md). Older guides and audit notes must be reconciled with the preserved working copy before final viva answers are certified.

## Implemented shape

Care4U has a React/Vite web portal, an Expo/React Native mobile client and an Express/PostgreSQL API. Backend routes usually lead through controllers, services and repositories; appointment logic also lives directly in its controller/repository. Authentication uses server-side PostgreSQL-backed sessions, not JWTs. Role and object access are enforced at the backend; web/mobile state supports navigation and session restoration.

The mobile app focuses on patients, offers a doctor-profile fallback, and directs other staff roles to the web portal. Payments are sandbox workflows. Telegram implements the utility named `sendEmergencySMS`; real SMS delivery is not established by that function name. Email, storage and AI are external boundaries. Scheduled reminder/expiry jobs run in the API process.

## Trace these symbols first

| Viva topic | Source entry point / named symbol |
|---|---|
| App assembly, routes, cookies/CORS | `backend/app.js`; `frontend/src/App.jsx` (`ProtectedRoute`, session initialization) |
| Database and scheduling | `backend/src/config/db.js` (`pool`); `backend/server.js`; `sendAppointmentReminders`, `runExpiryJob` |
| Authentication and approval | `auth.service.js` (`login`); `auth.controller.js`; middleware `isAuthenticated`, `authorize` |
| Patient ownership | `middleware/patientAccess.js` (`authorizePatientResource`), patient routes/services |
| Consent categories | patient `consent.service.js`, `consent.repository.js`; `patientService.getMedicalRecords` |
| Booking and doctor consultation | `appointment.controller.js`; `appointment.repository.js` (`bookAvailableAppointment`); doctor availability/repository |
| Prescription issue and dispensing | `prescription.service.js` (`dispenseMedicine`); repository `lockPrescription`, `updateQuantityDispensed` |
| Lab finalization | laboratory service `uploadLabReport`; repository `createLabReportAndCompleteRequest` |
| Hospital/OPD/emergency | hospital service/repository; emergency service/routes; mobile `EmergencySOS.js` |
| Auditing/admin | middleware `logAudit`, `auditMiddleware`; admin repository/controllers and admin pages |
| Storage/notifications/AI | `config/supabase.js`, `utils/email.js`, `sms.util.js` (`sendEmergencySMS`), `ai.util.js` |
| UI/state foundations | web `main.jsx`, shared components, API clients/auth stores; mobile `App.js` |

Paths in this table are relative to their relevant `backend/src/modules`, client source tree or explicitly named directory. The full paths and imports are searchable in [FILE_REVIEW_TRACKER.csv](../review/FILE_REVIEW_TRACKER.csv) and `review/evidence/source-imports.csv`.

## Proposed pages for later stages

Create remaining pages only as their implementations are individually reviewed. The authentication page and its linked references now exist; other proposed pages below remain pending:

1. `01-architecture-and-setup.md`: packages, runtime, complete schema prerequisites, environments and start/check commands.
2. `02-authentication-and-access.md`: registration/OTP/approval/login/logout, sessions, role matrix, object ownership and audit semantics.
3. `03-patient-doctor-appointments.md`: data shape, availability, status transitions, consultation records and category consent.
4. `04-prescription-pharmacy-payments.md`: QR capabilities, interaction warnings, quantities/expiry, transactions, orders and sandbox limits.
5. `05-laboratory-hospital-emergency.md`: assignments, report lifecycle, OPD, assisted registration, break-glass and notification/device failure boundaries.
6. `06-admin-and-health-content.md`: approvals, account state, audit viewer, settings, analytics, QR reissue and published feeds.
7. `07-ui-and-mobile.md`: actual role coverage, shared primitives, module themes, loading/error/empty states, accessibility and native behavior.
8. `08-verification-and-limitations.md`: fixture journeys, concurrency/rollback evidence, known gaps, external dependencies and viva modification exercises.

Every module page should explain purpose, maintainer separately from original authors, entry paths/symbols, request/response flow, tables, permissions, validation, state changes, transactions/auditing, failure handling, limits and checks actually performed. Use synthetic examples and never publish credentials or real patient records.

## Baseline claims safe to make

75 backend JS files passed syntax checks, web ESLint reported zero errors/warnings, 2,187 modules compiled in a production web bundle, and 30 mobile JS files passed Babel parsing. No browser/device, database/API, external-delivery or end-to-end journey was tested in Stage 1. No automated application test suite or CI is tracked, and the migration directory requires an external base schema. Explain these limitations plainly during preparation.
