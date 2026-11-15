# Patient Web final review

2026-11-15, Asia/Colombo. Branch: codex/care4u-final-review-2026-11-12.
Source commit: f5bacbfe4b745157d8e7f32aa0495a762a2155f7 — docs(patient): improve web page and feature comments.

## Scope and comments

Reviewed the full current contents of the 13 requested files, including every profile section, plus two patient widgets and four supporting services listed below. All 19 source files received comment improvements. App.jsx, TopNavbar.jsx, Button.jsx and backend access/booking dependencies were inspected only within this scope and left unchanged; their complete shared/module review remains pending. Existing Stage 4A profile/consent work was preserved.

Added short file headers, retained supported original credits, added searchable UI/action labels and explained real conditions/failures. Removed decorative separators, obsolete review-stage language, unnecessary parameter/return boilerplate and inaccurate privacy/feed descriptions. No functions, handlers, imports, fields, styles or user-facing text changed in the comment work.

## Preservation and approved recovery

Entry commit: 20a6eb3b62554a3fd628cb0bfa0b888d6c86c7e3. Exact entry files, dirty Doctor files, status and worktree/index patches were saved under outputs/patient-web-final-2026-11-15 before editing. This local snapshot is not committed as a duplicate source tree.

PW01: the pre-existing uncommitted MyAppointmentsPage.jsx duplicated the medical-record page and removed the appointment workspace. The user explicitly approved restoring current HEAD while keeping the snapshot. Its appointment history, cancellation and rescheduling are now restored, with comments. Restoring tracked HEAD creates no separate functional Git diff; the source commit is comment-only relative to Git. The replacement remains at outputs/patient-web-final-2026-11-15/baseline/frontend/src/pages/patient/MyAppointmentsPage.jsx.

Parsed executable AST and token comparisons ignore comments, JSX comment containers and insignificant JSX whitespace using React text-whitespace rules. Comparison normalizes line endings. Eighteen files match exact entry executable code; the approved appointment recovery matches entry HEAD instead. All 19 final files match entry HEAD executable code. Function/import/call/JSX counts were also recorded. Every file was parsed and checked before saving; failed helper matches wrote no partial application file. Git diffs were inspected.

The three dirty Doctor backend files match entry SHA-256 hashes byte for byte and were not staged. Untracked foundation notes and existing outputs were left in place. No reset, rebase, branch switch, push or merge occurred.

## UI changes and verification

UI consistency was reviewed from source code only. No styling or visible wording changes were made. Existing themes, responsive classes, layouts, controls, loading states and error handling remain. No screen was visually tested in this group.

- npm.cmd run lint: PASS, exit 0.
- npm.cmd run build: PASS, exit 0; final build transformed 2,189 modules.
- npm.cmd run test:patient: PASS, 21/21 existing cases. Coverage is web/mobile response validation, consent contracts, record filters and dialog behavior; it does not exercise every page or certify concurrency.
- All 19 files: syntax, required header, comment standard and executable AST/token preservation PASS.
- Git worktree and staged diff whitespace checks PASS after removing whitespace left by deleted comment banners.
- Browser/device visuals, live sessions/APIs, DB transactions/concurrency and AI/email/storage/payment providers: NOT RUN.

[Machine-readable verification and authorship](evidence/patient-web-2026-11-15/verification.json) contains actual final logs, source hashes, AST/token hashes, feature counts and protected Doctor hashes. Local logs remain in outputs/patient-web-final-2026-11-15.

## File tracker

Reviewed means complete source/comment review with the runtime limits above; open functional issues are not marked fixed.

| File path | Module | Status | Important comments | UI checked | Syntax/build verification | Commit status | Identified issue |
|---|---|---|---|---|---|---|---|
| `frontend/src/components/layout/PatientLayout.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/components/layout/PatientNavbar.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW05: logout request can fail before redirect. |
| `frontend/src/pages/patient/BookAppointmentPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW04: rescheduling is two separate requests. |
| `frontend/src/pages/patient/DoctorSearchPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/pages/patient/LabReportsPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW05: blocked popup is not detected before marking read. |
| `frontend/src/pages/patient/MedicalRecordsPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/pages/patient/MyAppointmentsPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW01 resolved with approval; replacement snapshot preserved. |
| `frontend/src/pages/patient/OrderTrackerPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/pages/patient/PatientLookupPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW02 missing consultation ID/list errors; PW03 character-based summary formatting. |
| `frontend/src/pages/patient/PatientProfilePage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/pages/patient/PaymentHistoryPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/pages/patient/PrescriptionsPage.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | PW06: browser-time expiry has no dedicated refresh timer. |
| `frontend/src/services/patient.service.js` | Patient Web / service | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/components/common/HealthAwarenessFeed.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/components/chat/AIChatWidget.jsx` | Patient Web | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/services/doctor.service.js` | Patient Web / service | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/services/appointment.service.js` | Patient Web / service | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/services/prescription.service.js` | Patient Web / service | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |
| `frontend/src/services/healthContentService.js` | Patient Web / service | Reviewed | Complete | Source only | Parse/AST/tokens + lint/build PASS | `f5bacbf` | None requiring a change in this scope. |

## Authorship

Existing headers were checked against followed introduction/contributor history; uploader identity alone was not treated as sole authorship. Wasana credits were retained for 16 files. Pamudika credits were retained for OrderTrackerPage and PaymentHistoryPage; prescription.service.js’s existing S/21/001 credit was expanded to the supplied team name. OrderTrackerPage has historical path/addition noise: substantive introduction d41f229 and later 595fb30 are by S/21/001. PaymentHistoryPage is 12dafcc and prescription.service.js is f69a6ac, also S/21/001. PatientProfilePage includes later lasitha contributions; the original Wasana credit is retained without claiming sole ownership or inventing a co-author identity. Per-file history is in the evidence. Current maintenance assignments did not override supported original credits.

## Issues needing attention

- PW02 — lookup consultation context: health-list and summary calls omit appointment ID required for doctor access by patientAccess.js. The role argument is ignored by the service and cannot unlock data. Some query errors have no separate display, so denied access can resemble an empty list. Review the consultation flow without weakening backend checks.
- PW03 — lookup AI formatting: formatAiText uses normalizedText.split(""); characters are treated as lines, making summary layout unreliable.
- PW04 — rescheduling: replacement booking and original cancellation are separate requests. Failed cancellation retains the replacement and may leave both appointments active, with a warning.
- PW05 — acknowledgement limits: logout redirects even after request failure; report opening does not detect blocked popups before requesting the read update.
- PW06 — expiry display: prescription status uses browser time during render; memoized counts/filters have no dedicated expiry timer. An already-open QR dialog does not independently revalidate expiry. Backend dispensing checks remain authoritative.

These are source findings, not newly reproduced live failures. No additional functional fixes were made. Doctor-row locking was traced from booking controller to repository; real PostgreSQL contention was not tested.

## Viva and next file

The single consolidated 28-row Patient Web table is in [the existing viva guide](../../CARE4U_VIVA_CODE_GUIDE.md#patient-web-frontend--final-viva-table-2026-11-15), with [matching TSV](../viva/patient-web-final-table.tsv). Historical Stage 4A documentation stays available; no duplicate full study guide was created.

Patient Web source group is complete. Last supporting source file reviewed: frontend/src/services/healthContentService.js. Next group begins mobile/src/screens/PatientHomeScreen.js, then patient profile/QR/search/booking/appointment/record/report/prescription screens and services. Reuse completed auth and Stage 4A work. Shared entry points, SOS and utilities must be accounted for without claiming unrelated work complete. Later groups follow the user’s order: Doctor Backend, Doctor Web, Appointment, Prescription, Pharmacy, Hospital/Clinic, Laboratory, Emergency, Admin, integrations/shared sources.
