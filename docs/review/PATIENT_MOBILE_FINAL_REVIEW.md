# Patient Mobile final review

2026-11-15, Asia/Colombo. Branch: codex/care4u-final-review-2026-11-12.
The completion documentation commit also corrects the record-card comment to name its actual onPress prop; executable code is unchanged.

Source commits: 895caba134446be0923850c72b064d61d15bfe2c — docs(patient): clarify mobile workflows and screen controls; 4ec4632086003ce58eabd723ce56b1de02643f79 — docs(patient): explain mobile hospital search limitation.

## Scope and preservation

Reviewed all sections of 18 current files: eleven screens, two components, four services and the shared mobile App.js. Shared SOS and doctor fallback are included because App.js consumes them. Existing mobile auth and Stage 4A profile/record/consent logic were preserved. Auth screen implementations were not reworked. API client/auth store were inspected as dependencies and left unchanged; search utilities, theme, entry/config/assets remain for the later shared-source group. Doctor backend source was read only for request contracts, not marked fully reviewed.

Before editing, exact files, authorship/history and dirty Doctor sources were saved under outputs/patient-mobile-final-2026-11-15. All 18 complete source files preserve entry executable AST and tokens, with comments/JSX comment containers/insignificant JSX whitespace excluded and comparison line endings normalized. Import/function/call/JSX counts also match. Every proposed file was parsed and compared before saving; helper failures wrote no partial application file. Git diffs were reviewed alongside those checks. All three pre-existing Doctor backend files still match the entry hashes byte for byte and were never staged.

Only comments and whitespace left by removed comment banners changed. No API parameter, event handler, field, validation, medical wording, style, permission, calculation, dependency or feature changed. In particular, hospitalName, replacement cancellation and SOS retry behavior were documented without fixing them. No reset, branch switch, rebase, push or merge occurred.

## Useful comments and UI review

Searchable labels identify profile/photo/save buttons, all clinical sections and add forms, privacy switches, QR references, appointment tabs/actions, report previews, AI chat controls, bottom navigation, logout and SOS actions. Feature comments explain partial dashboard loading, profile save guards, independent privacy writes, camera/gallery permissions, AI draft review, stale record responses, external document opening, expiry/QR decisions, navigation unmounting and SOS delivery limits. Existing explanatory comments were retained; decorative separators, unnecessary parameter/return boilerplate and review-stage claims were removed.

UI consistency was reviewed from source only. No visual screen testing, styling corrections or user-facing wording changes were made. Existing module colors and native layout/style definitions remain intact. MedicalRecordsScreen.filterChip has duplicate minHeight keys (44 then 36); the effective value is 36. This source observation was left unchanged because intended touch-target sizing needs a separate UI decision/device check.

## Verification

- All 18 files: complete parse, required header, comment standard and before/after AST/token comparison PASS.
- Existing auth and patient suites: 77/77 PASS, command node --test frontend/tests/patient-ui.test.cjs frontend/tests/auth-ui.test.cjs. The first sandbox attempt could not spawn test processes (EPERM); the unchanged command passed outside the sandbox. These are isolated source/UI-contract tests, not React Native device tests.
- Worktree and staged Git whitespace checks: PASS.
- Native build/Metro/export/emulator/device, native cookies/back/focus, camera/gallery, location/dialer, real AI/storage/API/database/provider acceptance: NOT RUN. The mobile package has start/android/ios/web scripts but no build or test script. Parser and isolated checks do not certify a native build.
- The preceding Patient Web lint/build and 21 patient cases remain recorded in its own report; no claim is made that web compilation validates native screens.

[Verification and ownership evidence](evidence/patient-mobile-2026-11-15/verification.json) contains complete final test output, per-file starting/final hashes/signatures/counts, followed Git history and unchanged Doctor hashes. The local reviewed patch/test log remain under outputs/patient-mobile-final-2026-11-15.

## File tracker

Reviewed means complete source/comment review; runtime gaps and open issues remain as stated.

| File path | Module | Status | Important comments | UI checked | Syntax/build verification | Commit status | Identified issue |
|---|---|---|---|---|---|---|---|
| `mobile/src/screens/PatientHomeScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/screens/PatientProfileScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM01: failed refresh retains previous profile without an inline load warning. |
| `mobile/src/screens/PatientQRCardScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM01: failed refresh retains the old card. |
| `mobile/src/screens/DoctorSearchScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba + 4ec4632` | PM02: response-order race; PM06: hospitalName parameter ignored. |
| `mobile/src/screens/DoctorProfileScreen.js` | Doctor / Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM01: failed refresh retains the old profile. |
| `mobile/src/screens/BookAppointmentScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM03: failed original cancellation is logged but success alert still appears. |
| `mobile/src/screens/MyAppointmentsScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/screens/MedicalRecordsScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` + completion commit | None requiring changes in this scope. |
| `mobile/src/screens/LabReportsScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/screens/PrescriptionsScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM05: expiry display depends on device time and rerender. |
| `mobile/src/screens/AIChatScreen.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/components/HealthAwarenessFeed.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/components/EmergencySOS.js` | Emergency / Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | PM04: no in-flight guard; retry after ambiguous API failure. |
| `mobile/src/services/patient.service.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/services/doctor.service.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba + 4ec4632` | None requiring changes in this scope. |
| `mobile/src/services/appointment.service.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/src/services/prescription.service.js` | Patient Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |
| `mobile/App.js` | Shared / Mobile | Reviewed | Complete | Source only | Syntax + AST/tokens PASS | `895caba` | None requiring changes in this scope. |

## Authorship

Preserved I.M.L.S. Idirisinghe (S/21/389) on DoctorProfileScreen, supported by cf4b450 by lasitha. Doctor service retains both Idirisinghe and Wasana credits: introduction c905b72 and later patient search/slot expansion d6e5fa7 support the shared history. No maintenance-map attribution to Tharindu was substituted. PrescriptionsScreen retains original Pamudika (S/21/001) plus Wasana’s existing status/medicine-details credit, with names expanded from the supplied team mapping. Its introduction and the prescription service are 3fe802f by S/21/001. Other current Wasana credits were retained against their history. App.js begins with an Expo scaffold; uploader/initial scaffold identity is not a sole-authorship certification of the evolved application. No contributor identity or co-credit was invented. Full evidence is retained; the prior lasitha/display-name reconciliation remains a historical ownership question rather than a silent reassignment.

## Issues requiring separate functional review

- PM01: failed refreshes on profile/QR/doctor profile keep previous data; their initial error screen is suppressed when a previous object exists. No separate inline refresh warning is shown there.
- PM02: doctor search debounces the waiting timer but does not cancel or version requests already sent; an older response can replace later results.
- PM03: mobile replacement booking and cancellation are separate requests. Cancellation failure is logged and still leads to the success alert, so both appointments may remain active without a patient warning.
- PM04: SOS has no separate in-flight guard. A failed/ambiguous primary hospital request is retried without coordinates; the client cannot establish whether the original reached the server. Backend deduplication is not certified by this group.
- PM05: prescription/next-visit calculations use device time on render/memo dependencies; there is no dedicated expiry/time refresh. An open QR dialog does not independently revalidate expiry.
- PM06: mobile search sends hospitalName; current doctor controller destructures specialty and hospital. Hospital filtering is therefore ignored. The parameter and current Doctor work were preserved; comments now identify the mismatch.
- The retained summary service wrapper sends a legacy role query without consultation ID. It does not grant doctor access and no mobile history-summary screen was invented or claimed.

These are verified source observations, not newly reproduced native/live failures. No functional fix was authorized or performed in this mobile group.

## Viva and continuation

The [single existing viva guide](../../CARE4U_VIVA_CODE_GUIDE.md#patient-mobile-frontend--final-viva-table-2026-11-15) now contains one consolidated 25-row mobile table; [matching TSV](../viva/patient-mobile-final-table.tsv) is available for Word. Web rows remain in the same guide and are not duplicated into another full study document.

Patient Mobile source group is complete. Last complete file: mobile/App.js, with the final search-contract clarification recorded in the two search files. Next exact source: backend/src/modules/doctor/doctor.controller.js, then doctor.service.js and doctor.repository.js plus routes and audit dependencies. Inspect their uncommitted changes and snapshot before editing; preserve their current implementations. Continue Doctor Web, Appointment, Prescription, Pharmacy, Hospital/Clinic, Laboratory, Emergency, Admin, remaining integrations and shared sources in the user’s order. No later group is marked complete.
