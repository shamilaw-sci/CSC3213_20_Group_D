# Supplied Supabase catalog assessment

Received 2026-11-13 after read-only discovery commit `3382c73`. Source: user-supplied Supabase SQL Editor CSV corresponding to the catalog query supplied in this chat. Captured timestamp in the result: **2026-11-13 08:29:51.271191 UTC**; reported PostgreSQL server version: **17.6**. This is user-provided catalog evidence, not an independently authenticated export or restored schema. No live connection was made for this assessment; no records, migrations, tests or writes ran on Supabase.

[Preserved CSV](evidence/supabase-catalog-2026-11-13.csv), SHA-256 `5d2655c5b1e5f3fdd988c7acd2cad269965636d5d80da40d6a23806680429aca`. All 535 rows parse as CSV and their details as JSON. The input was inspected as schema metadata; no redactions were needed. It contains definitions and object names, not application rows or connection credentials. The original attachment's bytes are preserved; do not interpret the column names password_hash/token/otp_code as exported credential values.

## What is now known from this snapshot

| Category | Count / evidence |
|---|---|
| Public tables | 35, all reported as ordinary tables |
| Columns | 312 |
| Constraints | 114, all reported validated |
| Indexes | 68; includes backing primary/unique indexes, so not 68 additional constraints |
| Environment | PostgreSQL 17.6 and capture timestamp |
| Installed extensions | pg_stat_statements 1.11; pgcrypto 1.3; plpgsql 1.0; supabase_vault 0.3.1; uuid-ossp 1.1 |
| Namespaces listed | auth, extensions, graphql, graphql_public, public, realtime, storage, vault |

The CSV has no routine, trigger, enum, domain, view or policy rows. If the supplied query was run in full and its result exported completely, its scope returned none in public. This does not independently certify database-wide absence, permissions, completeness or other schemas' definitions. Public tables are listed below; existence does not certify any module's correctness:

appointments, audit_logs, consent_access_grants, consent_access_requests, consent_settings, consultation_notes, doctor_availability, doctors, drug_interactions, emergency_access_logs, emergency_alerts, health_content, hospitals, lab_reports, lab_test_requests, laboratories, medical_records, medicine_orders, otp_verifications, password_reset_tokens, patient_allergies, patient_conditions, patient_family_history, patient_health_background, patient_medical_devices, patients, payment_transactions, pharmacies, prescription_dispensing, prescription_items, prescriptions, session, system_settings, users, vaccinations.

## Auth/session contracts resolved at metadata level

- All nine relations in AUTH_DATABASE_PREREQUISITES.md are present. users has a UUID/default primary key, unique email and phone, password_hash, role, nullable is_verified/is_active with false/true defaults, non-null failed_login_attempts default 0, locked_until, and non-null verification_status default approved. Email/phone unique constraints do not establish case-normalized identity. Nullable flags are an observed schema property, not a statement about existing records.
- otp_verifications has UUID/default primary key, unique email, six-character code, timestamptz expiry, password hash, role, JSONB profile_data default empty object and timestamp defaults. updated_at is present, but no user-trigger definition was returned; an automatic update-on-write trigger is not demonstrated. These names/defaults are consistent with the auth repository contract, without proving runtime races/rollback.
- password_reset_tokens uses **id as its UUID primary key**; token is a separate unique non-null varchar(64). user_id is a non-null FK to users with ON DELETE CASCADE; used is non-null default false; expires_at is non-null timestamptz; created_at has a default. A stored token value was not exported.
- session has sid varchar primary key, non-null sess JSON and non-null expire timestamp(6) without time zone. idx_session_expire exists. This resolves the earlier missing-table/index metadata questions; session adapter compatibility/timezone/persistence still needs disposable runtime acceptance.
- patients requires full_name, date_of_birth and qr_code_id; NIC is nullable but unique. QR and UHI each have unique constraints. doctors requires full_name, slmc_reg_number (unique) and specialization. Profile IDs default to UUID generation.
- pharmacies/laboratories require user_id, name, license_number (unique), address and phone. available_tests is a non-null text array with empty-array default for laboratories. hospitals requires user_id/name and stores departments as text; hospital user_id is unique. The CSV does not show a unique user_id constraint/index on patients, doctors, pharmacies or laboratories. Do not assume database-enforced one-profile-per-user in those tables; agree the intended cardinality before a later change.

## Migration reconciliation: object state, not applied history

| Repository migration | Matching supplied metadata | Status |
|---|---|---|
| 001 | OTP table/columns, unique email, email index and RLS enabled | Object state consistent; actual application/order unverified |
| 003 | users.verification_status, varchar(20), non-null, approved default | Object state consistent; actual application/order unverified |
| 004 | health_content table, category/status checks and fields | Object state consistent; actual application/order unverified |
| 005 | system_settings table/column definitions | Table state consistent; seed values intentionally not read/exported |
| 006 | users_role_check includes lab_technician and legacy lab_staff plus other roles | Object state consistent; actual application/order unverified |
| 007 | lab_test_requests.priority non-null text with routine default and routine/urgent/stat check | Object state consistent; actual application/order unverified |

No migration ledger or applied identifiers were supplied. The earlier dashboard screenshot's No migrations label cannot distinguish manually executed DDL from migration-managed changes. Nothing explains missing repository migration 002. These observations must not be relabelled as verified applied migrations.

## RLS and exposure follow-up

The result reports RLS **enabled only for otp_verifications**, not forced on any table, and disabled on the other 34 public tables, including users, patients, session and password_reset_tokens. No policy definitions were returned. This is an observed setting, not proof that anonymous callers can read these tables: schema/table grants, role inheritance, actual API exposed schemas and service access are missing. Conversely, Express ownership checks do not demonstrate protection of a separately exposed Supabase Data API. A later read-only privileges/API configuration assessment is needed before judging exposure; do not enable/disable RLS or change grants during discovery. No security finding is automatically closed by synthetic demo data.

## Remaining requirements and next step

This snapshot is enough for a concrete source-to-schema contract review without a direct live connection. It is **not restore-ready SQL**: it lacks complete DDL semantics, privileges/default privileges, owners/role behavior, collation/search-path/timezone settings, partition/inheritance/storage attributes, extension placement/configuration and dependency definitions outside public. The supplied query also omitted composite/range/base type definitions and sequence definitions. Zero rows in omitted/empty categories do not fill those gaps. No executable SQL has been reconstructed or presented as verified.

For a faithful disposable restore, obtain a sanitized schema-only pg_dump and reconcile dependent schemas/roles/extensions, or explicitly authorize a separately labelled reconstructed test fixture later. Installed pg_dump 18.3 can inspect older servers, but use a matching PostgreSQL **17** runtime/toolchain for the simplest disposable acceptance baseline and verify required extension availability. Supabase-only extensions (especially supabase_vault) are not automatically required by Care4U merely because installed; identify dependencies before deciding plain PostgreSQL versus isolated local Supabase. No database/cluster has been initialized or started.

Existing direct TLS access remains blocked; a subsequent explicit Node 24/system-CA retry also failed SELF_SIGNED_CERT_IN_CHAIN. The signed-in Firefox route could not proceed because desktop browser URL-policy enforcement is unsupported. Neither limitation blocks analysis of this supplied metadata. Render deployment/ingress/worker count/environment and cookie/request-limit proxy acceptance remain unchanged and unverified in [the hosting report](DATABASE_HOSTING_DISCOVERY.md).

Next: independent Stage 3A review remains the application checkpoint; continue documentation-only schema/privilege/hosting discovery as evidence becomes available. No application batch, live test, migration, deployment, push or merge is authorized by this CSV.
