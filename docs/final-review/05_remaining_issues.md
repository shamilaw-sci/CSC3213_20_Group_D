# Remaining issues after stabilization pass 1

This pass addressed H01, H02, H04 (by reusing the existing consent policy), and H07. The following revised-audit findings remain open; none is implicitly marked resolved by the build checks.

| Finding | Why it remains | Required next decision or verification |
|---|---|---|
| H03 — pharmacist patient-prescription access | Any authenticated pharmacist can still request a patient's prescriptions by UUID; the UI checkbox is not server authorization. | Design and test a short-lived, scoped server grant bound to QR/patient presence, pharmacist and purpose. |
| H05 — concurrent/partial dispensing | Quantity reads and writes remain separate, so concurrent dispensing and partial failure can corrupt medication state. | Transaction/row-lock or guarded update with concurrency tests. |
| H06 — SOS assurance | Dummy call fallback and unconfirmed external delivery remain; wording and failure UX need a real device and deployment-number decision. | Validate emergency number and staged confirmation/fallback on devices. |
| H08 — AI/privacy | AI prompt still includes patient health context and the raw chat message can enter a general audit record. | Agree data minimization, disclosure/consent, provider handling and bounded requests before release. |
| M01 — recovery abuse resistance | Removing console-disclosed tokens did not add OTP/reset attempt limits, endpoint throttles or token hashing. | Define rate limits and a safe token-storage migration. |
| M02 — CSRF/origin defense | Cookie-authenticated mutations still lack a tested CSRF/origin policy. | Add and test deployment-compatible mutation protection. |
| M03 — booking integrity | Direct booking validation is limited and conflict-check/insert is not atomic. | Confirm slot policy, then enforce it atomically server-side. |
| M04 — lab completion atomicity | Report insert and request completion are separate writes. | Transaction or idempotent retry/recovery contract. |
| M05 — report URL trust | The backend still stores external report URLs without equivalent server-side trust validation. | Choose trusted storage/host policy and accommodate existing links. |
| M06 — admin mutation auditing | Significant admin mutations still lack a consistent outcome audit. | Agree event schema and implement actor/target/result logging. |
| M07 — audit outcome accuracy | Current middleware records an attempt before the controller outcome. | Distinguish ATTEMPT from SUCCESS or log after response. |
| M08 — deactivation confirmation | Admin can deactivate accounts without a confirmation step. | Add contextual confirmation and pending-state protection. |
| M09 — shared UI accessibility | Modal, DataTable and Input keyboard/focus/error associations remain incomplete. | Improve shared primitives and retest all consuming screens. |
| M10 — reproducible schema/tests | Baseline/002 schema and application regression tests remain absent. | Provide a sanitized baseline and automate critical role/consent/dispense tests. |

Additional pass-specific limits: H04 now shares the existing category-lock/appointment-grant filter, but the team must define whether `is_confidential` is an independent restriction. No such rule was inferred or added. The mobile reset screen supports paste-in links/tokens and the existing web email link; automatic app deep linking is not configured. No live database, browser, or device acceptance test was available in this pass. Other L-series polish and large-file refactors remain outside this pass.
