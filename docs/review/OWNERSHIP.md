# Ownership and provenance register

## Stage 3A attribution decision

Source/UI changes are `57e6d2c` and response-safety commit `d78465b`, committed as Codex Review Assistant, separate from original student authorship. Existing auth Idirisinghe S/21/389, root/shared Wasana S/21/081 and PharmacyRegisterPage Pamudika S/21/001 headers remain. New AuthLayout/styles/application tests/fixtures name review-assistant implementation; strict JSON/config receives no invented student header. No author was replaced with a current module maintainer.

| Case | Evidence and decision |
|---|---|
| Existing web/mobile auth screens/services | Existing S/21/389 credits and lasitha introduction evidence retained. The Idirisinghe/Lasitha Sanuth display-name reconciliation remains unresolved; no sole-author certification. |
| Web OTP page | Previously no author header; introduction `5aaea4b` by lasitha. New header explicitly says original author unconfirmed and records Git introduction, rather than inventing a personal identity. |
| Public pharmacy application | Existing Pamudika S/21/001 header; introduction `1dae2df` by S/21/001 supports the original feature credit. Retained regardless of Auth maintenance. Later contributions remain separate. |
| Public laboratory application | Previously no author header; introduction `71cdfdd` by S/21/001. New header records uncertainty and points here. Git introduction supports lineage, not a declaration of sole/human authorship; current Wasana Lab maintenance is not substituted as original author. |
| Shared controls/root apps | Existing Wasana credit retained. Scope is auth consumers/callbacks; unrelated file features/consumers are not marked fully reviewed. |

Per-file source hashes/symbols and tracker decisions separate these claims from Git uploader, later contributor and maintainer roles. Four final contract-comment edits are AST-identical to the browser-captured executable source. No disputed student name/credit was silently resolved.

## Stage 2B attribution decision

Existing auth routes/service/repository Idirisinghe S/21/389 credits and app Wasana S/21/081 credit are retained. Stage 2B application changes are `0cd2abb`, committed as Codex Review Assistant; commit author is not original student author. New `auth.limits.js`, `auth-resend.test.cjs` and `auth-limits.test.cjs` explicitly identify review-assistant implementation. Tests/config/docs updates do not reassign source credit; `.env.example`/strict JSON gain no invented student header. Lasitha remains the Auth maintainer; the Idirisinghe/Lasitha Sanuth display-name discrepancy remains unresolved. Existing source provenance and immutable tracker baseline fields are preserved; no new ownership claim is inferred from module responsibility. See [STAGE2B.md](STAGE2B.md).

Stage 1, 2026-11-12. No application headers were added or rewritten.

Stage 2A update: 14 core paths were checked against their creation-candidate contents and followed Git lineage (`evidence/stage2a/ownership.json`). Existing student credits were retained, including the unresolved S/21/389 displayed-name discrepancy. New review-assistant helpers/tests and behavioral changes are identified by commits `150fec1`, `8c7908b`, `438c8a1`; they do not change original file authorship. Module maintainers remain the current user-supplied map.

The mobile auth-store introduction candidate was clarified: `8447c1a` has an exact `C100` copy from `frontend/src/store/authStore.js`, whose source was introduced at `17f18c0`. The mobile path did not exist at that older source commit. Retain the Wasana credit with this copy lineage instead of claiming a literal mobile-file creation there. No sole-author claim was inferred. Comments/source reference were completed for the core auth scope; uncertain human identity/co-credit decisions remain open.

## Module responsibility

The current user-supplied map governs maintenance responsibility for this review:

| Maintainer | Student ID | Responsibility |
|---|---|---|
| Lasitha Sanuth | S/21/389 | Authentication + Admin |
| Wasana Karunanayaka | S/21/081 | Patient + Emergency + Hospital/Clinic + Laboratory |
| Tharindu Lakshan | S/21/166 | Doctor + Audit Logging |
| Pamudika Abayarathna | S/21/001 | Prescription + Appointment + Pharmacy |

This map does not prove original file authorship. Root README assigns appointments with Doctor; the external final guide places Hospital under Member 3 and Laboratory under Member 4. Those older responsibility maps differ from the current instruction. Preserve valid original credits while using the current map for module maintenance. Shared infrastructure, payments, interactions, assets and documentation may need an explicit maintainer decision instead of silently allocating authorship.

## Evidence method and coverage

[evidence/ownership-history.csv](evidence/ownership-history.csv) contains **283 rows**, one for each tracked path, including full introduction-candidate commit hash, Git author identity/date, number of addition candidates, current author-header text and status. The same provisional evidence is summarized in `FILE_REVIEW_TRACKER.csv` alongside module responsibility.

Git investigation used `git log --follow -M -C --find-copies-harder --diff-filter=A --format=... -- <path>`. Rename following/copy detection was requested where Git supports it; history can still contain multiple addition candidates through merges, copies or imports. The earliest reported candidate is recorded as repository-introduction evidence. It is not an automatic declaration of the person who originally wrote the content. Empty stubs, scaffolds, imported assets, copied files, shared accounts and substantial later rewrites all require further interpretation. No “most lines” or “latest committer” authorship rule was used.

Headers were read from the opening file region (`@author`, plus SQL `Author:`). **165 files have a detected author header**; 37 handwritten-source/migration/verification-tool files have none detected. This is discovery, not full comment compliance: every function, inline callback, component, parameter and return contract has not yet been checked. Header spelling/encoding, generic team attribution and informal compound credits still need individual review. JSON/binary/generated/lock files are not counted as needing JavaScript-style headers.

Whole-history contributor identities include `Wasana-Karunanayaka`, `Wasana Karunanayaka`, `Wasana-K`, `lasitha`, `UdayakumaraDMTL`, `S/21/001` and `shamilaw-sci`. Working hypotheses map the Wasana identities to S/21/081, `lasitha` to S/21/389, `UdayakumaraDMTL` to S/21/166, and `S/21/001` to Pamudika, based on headers, student IDs, guides and history. Account identity is supporting evidence. No person/student ID was invented for `shamilaw-sci`.

## Selected history checks and unresolved cases

| Files / case | Observed evidence | Current attribution status |
|---|---|---|
| `backend/src/modules/appointment/appointment.routes.js` | Introduction `04576ae8252a`, Git identity `UdayakumaraDMTL`; header credits Tharindu S/21/166 | Consistent original-credit evidence despite current Appointment maintainer being Pamudika; do not replace |
| `backend/src/modules/laboratory/laboratory.service.js` and related lab backend files | Earliest service candidate `df52b4b9acba`, identity S/21/001; later lab queue/upload/notification commits by same identity, later authenticated workflow by Wasana | Pamudika credit is supported; current Wasana maintenance is separate. Multiple addition candidates require lineage interpretation before sole-author certification |
| `backend/src/utils/email.js` | Earliest recorded candidate `8ba93fc4bcbd` by S/21/001; later auth/SMTP changes by `lasitha`, appointment/consent/emergency additions by Wasana; no author header | Shared evolution; distinguish original utility from later functions. New author/co-author lines require feature-level evidence |
| `frontend/src/pages/pharmacy/PharmacyLookupPage.jsx` | Created `a2fb88ba7f16` by Wasana identity; dispensing upgrade `6d36225` by S/21/001; current header separates original and dispensing upgrade | Preserve valid original credit; maintenance map is not a reason to erase it |
| `mobile/src/services/doctor.service.js` | Created `c905b72` by `lasitha`; doctor search/booking expansion `d6e5fa7` by Wasana | Auth-module contributor can be original author of a Doctor file; do not infer Tharindu from filename |
| `frontend/src/components/common/QRScanner.jsx`, `mobile/src/constants/theme.js` | Current Wasana headers align with introduction candidates `26be17986298` and `771e51223cff`; header edits are already unstaged | Plausible current credit; existing local edits were not authored by this stage or independently finalized |
| `backend/migrations/007_fix_lab_request_priority_default.sql` | Introduction `86077527a573` by Wasana identity; header says Care4U Team | Keep team attribution; team intent/sole authorship unclear |
| `README.md` | Initial stub `d353d4846187` by `shamilaw-sci`; substantive setup/system docs added by Wasana identities (`972b39c`, `c5e5304`, `04cbd76`) | Initial repository creator is not automatically author of the current README |
| `docs/epic_116_117_progress.md`, `docs/epic_204_lockout_progress.md` | Identify S/21/389 as “I.M.L.S. Idirisinghe”; user/README use Lasitha Sanuth | Reconcile naming identity with team; do not silently substitute one name for the other |
| Admin pages, common layouts, consultation and prescription screens | Existing audit identifies several original-feature/later-UI contributors; current tracked history/header rows are preserved | Per-function/feature attribution and any co-author policy remain pending; old audit is supporting context only |
| Template/assets/generated files | Vite starter README/icons and tracked cache have introduction identities | Git uploader is not proof of artwork/template creation; preserve external licenses/provenance |

## Header policy for later stages

Use the existing guide's `@file`, `@module`, `@desc`, `@author` and function/component purpose/parameter/return conventions with language-compatible syntax. Add a separate module-maintainer field only if the team adopts one; never overwrite a supported original author to match the maintainer table. Record uncertainty here and in the tracker and continue unrelated verified work. Preserve licenses, useful TODOs, security rationale and accurate original names. Do not add student attribution to review-assistant tooling.

Before changing a disputed header, inspect its creation patch, rename/copy lineage and substantial implementation commits; compare current header/guide/student-ID evidence. Use team clarification for unresolved identities or imported/co-created work. No uncertain row in the CSV is a final ownership assignment.

## Patient Stage 4A

Retained Wasana Karunanayaka S/21/081 headers with provisional tracker Git evidence: consent service bb21f15, repository 0c5da2a, profile web 98a9ea1/mobile fe29b4d. Maintainer identity is not sole-author proof. Doctor/Appointment repositories retain Tharindu S/21/166 with UdayakumaraDMTL introductions. New tests/fixtures credit Codex Review Assistant, and original-author baseline columns remain unchanged. Details and scope are in STAGE4A.md and the Patient viva guide.
