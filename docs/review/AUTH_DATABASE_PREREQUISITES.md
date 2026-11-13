# Auth/session database verification prerequisites

**Update, 2026-11-13:** User-supplied catalog results now report PostgreSQL 17.6, 35 public tables and auth/session definitions. See [catalog assessment](SUPABASE_CATALOG_ASSESSMENT.md). Original connection/discovery notes below remain historical; no restore-ready export or applied migration history is available.

2026-11-12, Stage 2B. **PENDING DB**. No verified executable base schema or identified disposable local PostgreSQL was available. `psql`, `pg_ctl`, `initdb` and `docker` were not found on PATH. That is not proof that PostgreSQL is absent everywhere. No live `.env`, database connection or data export was used. The [Stage 1B search](evidence/stage1b/schema-search.json) is retained; no new lead justified repeating it.

## Exact objects needed

This is a list of application-required columns/contracts to verify against the real DDL, **not a replacement schema**. Export all dependent types/functions/triggers/constraints as well as tables, including any additional non-null columns/defaults the source does not name.

| Relation | Columns used by the focused auth/session path | Definitions/behavior to verify |
|---|---|---|
| `users` | `id`, `email`, `phone`, `password_hash`, `role`, `is_verified`, `is_active`, `verification_status`, `failed_login_attempts`, `locked_until`, `created_at` | ID type/default, exact email uniqueness/case/collation, phone rules, role/status types and checks, non-null/counter/active defaults, update/delete triggers and profile/reset dependencies. No uniqueness constraint is invented here. |
| `otp_verifications` | `id`, `email`, `phone`, `password_hash`, `role`, `otp_code`, `otp_expires_at`, `profile_data`, `created_at`, `updated_at` | Migration 001 defines UUID PK/default `gen_random_uuid()`, unique email, VARCHAR(6) code, timestamptz deadlines, JSONB default and RLS. Verify applied state and role access. ID must identify a single stable pending row; new row IDs must not be recycled by app/triggers. New resend UPDATE uses ID + email. |
| `password_reset_tokens` | `token`, `user_id`, `expires_at`, `used` | Token key/uniqueness, expiry type/time semantics, `used` false default/non-null, user FK/delete policy, extra required/default columns. Source assumes unused unexpired lookup/guarded consumption; confirm constraints. |
| `patients` | `id`, `user_id`, `full_name`, `nic`, `date_of_birth`, `qr_code_id`, `created_at` | User FK/cardinality, ID defaults, required profile fields, NIC/QR uniqueness/validation, delete rules. |
| `doctors` | `id`, `user_id`, `full_name`, `slmc_reg_number`, `specialization`, `is_verified`, `created_at` | User FK/cardinality, required fields, professional identifiers/checks/defaults. |
| `pharmacies` | `id`, `user_id`, `name`, `license_number`, `address`, `phone`, `is_verified`, `is_active`, `created_at` | User FK/cardinality, ID defaults, required values/credential constraints and approval/active behavior. |
| `laboratories` | Same columns as pharmacies | Actual lab DDL and constraints, not an assumed copy of pharmacy DDL. |
| `hospitals` | `id`, `user_id`, `name`, `type`, `location`, `departments`, `is_verified`, `is_active`, `created_at` | User FK/cardinality, departments/type representations/defaults and required values. |
| `session` | `sid`, `sess`, `expire` | `connect-pg-simple` 10 contract: sid primary key, JSON session object, timestamp expiry and expiry index; app's session role/grants/search path and cleanup behavior. Installed adapter `table.sql` includes legacy `WITH (OIDS=FALSE)` and is not certified for the unknown PG version. Do not blindly apply it or substitute it for project DDL. |

Also supply PostgreSQL server/pg_dump versions, schema/search path, timezone/collation, extensions and UUID function availability; custom enums/domains/functions/triggers; keys/FKs/unique/check constraints/indexes; RLS policies/forced-RLS and application role/grants. Confirm whether `public` is the real namespace. No login-role passwords/connection strings are required. Existing incremental migrations 001,003–007 and their actual applied order/version history must be reconciled with the base; absence of 002 does not reveal its contents. Approval/session code may depend on more tables through triggers; include those dependencies.

For a later patient-access/consent DB batch, additionally verify appointments/doctor linkage/status fields, consent settings/requests/grants and patient medical-record/category sources from the Stage 2A paths. The nine relations above alone cannot certify that broader privacy workflow.

## Obtain a schema-only handoff

1. Ask the project maintainer for an existing verified sanitized development schema first, with origin, export date, server version and migration level. Use a team-approved development database; **do not connect to production or export application records**.
2. The maintainer verifies the exact development target and export permission locally. Configure the approved connection securely outside shared commands/output (for example their local `.pgpass`); do not send credentials or use a literal password/URL in chat or a checked-in script. This review did not run the following command.
3. With connection defaults already selecting that verified development target, run `pg_dump --schema-only --no-owner --no-privileges --schema=public --file=care4u-schema-only.sql`. Use the actual approved schema(s) if different; include dependent objects and check any warnings. This exports DDL, not table records. Supply a separate sanitized description of required application roles/grants/RLS because ownership/privilege statements are intentionally omitted. Never include password hashes from role exports.
4. Inspect the DDL before sharing: function bodies, comments, defaults, foreign-server options and other object definitions can embed credentials or endpoints even in schema-only output. Remove sensitive literals with documented placeholders; record required synthetic substitutes. Do not append INSERT/COPY data or real patient fixtures. Record `Get-FileHash -Algorithm SHA256 -LiteralPath .\care4u-schema-only.sql` after sanitizing, plus provenance/version/migration notes and sanitization limits.
5. Provide a compatible disposable loopback PostgreSQL instance (or authorize creation when appropriate), explicitly named review database and dedicated role, and permission limited to synthetic fixtures in that database. The review must verify isolation before any DDL/write/reset. No production connection or inferred schema is an acceptable shortcut.

## Acceptance after prerequisites exist

Use the guardrails in [NEXT_STAGE_PLAN.md](NEXT_STAGE_PLAN.md): loopback, review-only DB prefix/role, fixture marker and explicit test flag; never load live app dotenv, run server jobs, or reset an unidentified database. Verify real DDL/version first, apply the documented migration order, seed synthetic identities/contact data only and disable unrelated scheduled work.

- Persist/consume pending registrations for all five roles, exact expiry and unique/FK behavior. Force profile creation failure and assert complete user/profile/delete rollback on the same transaction.
- Use two real clients and barriers: registration updates before resend writes; verification locks/consumes before resend UPDATE; delete + new same-email/different-ID row; resend wins before verification reads; concurrent verify; concurrent register/resend. Assert no stale identity restoration/recreation, no duplicate account, code/expiry/state consistency and no email while a service transaction remains open. Out-of-order deliveries need not all remain valid.
- Persist reset tokens, race same-token resets, inject password/consumption/commit failures and assert rollback/replay denial. Existing sessions and other links remain valid under the current unresolved policy; do not assert revocation as implemented.
- Persist/load/rotate/save/destroy sessions and exercise store failure/expiry with synthetic cookies. Separately test actual browser cross-origin/Secure/SameSite behavior and verified reverse-proxy access paths. Memory limiter tests do not prove these contracts or multi-process global limits.

Until executed on the verified disposable environment, schema compatibility, actual persistence, rollback and concurrency acceptance remain **PENDING DB**, regardless of passing query mocks or controlled interleavings.

## Discovery update — 2026-11-13

See [database/hosting discovery](DATABASE_HOSTING_DISCOVERY.md). PostgreSQL 18.3 client/server tools were found outside PATH; the earlier PATH-only result is historical. Supabase hosting is user-confirmed. Live metadata/export remains unavailable because trusted TLS fails before queries; a verified CA/connection or existing sanitized verified export is required. No live records/tests/writes or disposable database creation occurred.
