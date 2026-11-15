


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "doctor_id" "uuid",
    "scheduled_at" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "type" character varying(20) DEFAULT 'opd'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "appointments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "appointments_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['opd'::character varying, 'private'::character varying, 'online'::character varying])::"text"[])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "entity_type" character varying(50),
    "entity_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_access_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "request_id" "uuid",
    "granted_categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "granted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."consent_access_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "requested_categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "otp_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "used_at" timestamp with time zone,
    "invalidated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "consent_access_requests_attempt_count_check" CHECK (("attempt_count" >= 0))
);


ALTER TABLE "public"."consent_access_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "locked_categories" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consent_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultation_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid",
    "doctor_id" "uuid",
    "patient_id" "uuid",
    "symptoms" "text",
    "diagnosis" "text",
    "treatment_plan" "text",
    "follow_up_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consultation_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctor_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid",
    "day_of_week" character varying(10) NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "slot_duration_minutes" integer DEFAULT 20,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "doctor_availability_day_of_week_check" CHECK ((("day_of_week")::"text" = ANY ((ARRAY['monday'::character varying, 'tuesday'::character varying, 'wednesday'::character varying, 'thursday'::character varying, 'friday'::character varying, 'saturday'::character varying, 'sunday'::character varying])::"text"[])))
);


ALTER TABLE "public"."doctor_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" character varying(255) NOT NULL,
    "slmc_reg_number" character varying(50) NOT NULL,
    "specialization" character varying(100) NOT NULL,
    "qualifications" "text",
    "years_experience" integer,
    "hospital_name" character varying(255),
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "photo_url" "text"
);


ALTER TABLE "public"."doctors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drug_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "drug_a" character varying(255) NOT NULL,
    "drug_b" character varying(255) NOT NULL,
    "severity" character varying(50) NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drug_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emergency_access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "accessed_by" "uuid",
    "user_role" character varying(50) NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."emergency_access_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emergency_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."emergency_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "body" "text" NOT NULL,
    "category" character varying(50) NOT NULL,
    "source" character varying(255),
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text",
    CONSTRAINT "health_content_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['first-aid'::character varying, 'vaccine'::character varying, 'nutrition'::character varying, 'mental-health'::character varying, 'dengue-alert'::character varying])::"text"[]))),
    CONSTRAINT "health_content_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::"text"[])))
);


ALTER TABLE "public"."health_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hospitals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(150) NOT NULL,
    "type" character varying(100),
    "location" "text",
    "departments" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."hospitals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lab_request_id" "uuid" NOT NULL,
    "laboratory_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "report_url" "text",
    "findings" "text",
    "is_finalized" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "viewed_at" timestamp without time zone,
    "doctor_reviewed_at" timestamp with time zone,
    "doctor_remark" "text"
);


ALTER TABLE "public"."lab_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_test_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "laboratory_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "test_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'routine'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lab_test_requests_priority_check" CHECK (("priority" = ANY (ARRAY['routine'::"text", 'urgent'::"text", 'stat'::"text"]))),
    CONSTRAINT "lab_test_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sample_collected'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."lab_test_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."laboratories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "license_number" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "available_tests" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."laboratories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "doctor_id" "uuid",
    "appointment_id" "uuid",
    "record_type" character varying(50),
    "title" character varying(255),
    "description" "text",
    "is_confidential" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chief_complaint" "text",
    "diagnosis" "text",
    "treatment_plan" "text",
    "follow_up_needed" boolean DEFAULT false,
    CONSTRAINT "medical_records_record_type_check" CHECK ((("record_type")::"text" = ANY ((ARRAY['consultation'::character varying, 'diagnosis'::character varying, 'lab_result'::character varying, 'vaccination'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."medical_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medicine_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "prescription_id" "uuid",
    "status" "text" DEFAULT 'placed'::"text" NOT NULL,
    "delivery_address" "text" NOT NULL,
    "total_amount" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "medicine_orders_status_check" CHECK (("status" = ANY (ARRAY['placed'::"text", 'accepted'::"text", 'packed'::"text", 'out_for_delivery'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."medicine_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "phone" character varying,
    "password_hash" character varying NOT NULL,
    "role" character varying NOT NULL,
    "otp_code" character varying(6) NOT NULL,
    "otp_expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."otp_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" character varying(64) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_allergies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "allergen" character varying(255) NOT NULL,
    "severity" character varying(20),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_allergies_severity_check" CHECK ((("severity")::"text" = ANY ((ARRAY['mild'::character varying, 'moderate'::character varying, 'severe'::character varying])::"text"[])))
);


ALTER TABLE "public"."patient_allergies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "condition" character varying(255) NOT NULL,
    "diagnosed_at" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_priority" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."patient_conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_family_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "relation" character varying(50) NOT NULL,
    "condition" character varying(200) NOT NULL,
    "notes" "text",
    "is_emergency_relevant" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."patient_family_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_health_background" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "background_type" character varying(50) NOT NULL,
    "title" character varying(200) NOT NULL,
    "event_date" "date",
    "notes" "text",
    "is_emergency_relevant" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."patient_health_background" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_medical_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "device_name" character varying(150) NOT NULL,
    "device_type" character varying(100),
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_emergency_relevant" boolean DEFAULT true NOT NULL,
    "implanted_at" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."patient_medical_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "nic" character varying(12),
    "uhi" character varying(20),
    "full_name" character varying(255) NOT NULL,
    "date_of_birth" "date" NOT NULL,
    "gender" character varying(10),
    "blood_group" character varying(5),
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "qr_code_id" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "emergency_contact_relationship" character varying(100),
    "photo_url" "text",
    CONSTRAINT "patients_gender_check" CHECK ((("gender")::"text" = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'LKR'::"text" NOT NULL,
    "payment_type" "text" NOT NULL,
    "reference_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text" DEFAULT 'card'::"text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['card'::"text", 'cash'::"text", 'online'::"text"]))),
    CONSTRAINT "payment_transactions_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['appointment'::"text", 'lab_test'::"text", 'medicine_delivery'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "license_number" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pharmacies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_dispensing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prescription_dispensing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid",
    "medicine_name" character varying(255) NOT NULL,
    "dosage" character varying(100),
    "frequency" character varying(100),
    "duration_days" integer,
    "quantity_prescribed" integer NOT NULL,
    "quantity_dispensed" integer DEFAULT 0,
    "special_notes" "text"
);


ALTER TABLE "public"."prescription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "doctor_id" "uuid",
    "appointment_id" "uuid",
    "qr_code_value" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "expires_at" timestamp with time zone NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "prescriptions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'partially_filled'::character varying, 'completed'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session" (
    "sid" character varying NOT NULL,
    "sess" json NOT NULL,
    "expire" timestamp(6) without time zone NOT NULL
);


ALTER TABLE "public"."session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" character varying(100) NOT NULL,
    "value" character varying(255) NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "password_hash" character varying(255) NOT NULL,
    "role" character varying(30) NOT NULL,
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "failed_login_attempts" integer DEFAULT 0 NOT NULL,
    "locked_until" timestamp with time zone,
    "verification_status" character varying(20) DEFAULT 'approved'::character varying NOT NULL,
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY (ARRAY['patient'::"text", 'doctor'::"text", 'hospital_staff'::"text", 'pharmacist'::"text", 'lab_technician'::"text", 'lab_staff'::"text", 'emergency_staff'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vaccinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "vaccine_name" character varying(255) NOT NULL,
    "date_administered" "date" NOT NULL,
    "dose_number" character varying(50),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vaccinations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_access_grants"
    ADD CONSTRAINT "consent_access_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_access_requests"
    ADD CONSTRAINT "consent_access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_settings"
    ADD CONSTRAINT "consent_settings_patient_id_key" UNIQUE ("patient_id");



ALTER TABLE ONLY "public"."consent_settings"
    ADD CONSTRAINT "consent_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultation_notes"
    ADD CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doctor_availability"
    ADD CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_slmc_reg_number_key" UNIQUE ("slmc_reg_number");



ALTER TABLE ONLY "public"."drug_interactions"
    ADD CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emergency_access_logs"
    ADD CONSTRAINT "emergency_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_content"
    ADD CONSTRAINT "health_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hospitals"
    ADD CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hospitals"
    ADD CONSTRAINT "hospitals_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."lab_reports"
    ADD CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_test_requests"
    ADD CONSTRAINT "lab_test_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."laboratories"
    ADD CONSTRAINT "laboratories_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "public"."laboratories"
    ADD CONSTRAINT "laboratories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medicine_orders"
    ADD CONSTRAINT "medicine_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_verifications"
    ADD CONSTRAINT "otp_verifications_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."otp_verifications"
    ADD CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."patient_allergies"
    ADD CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_conditions"
    ADD CONSTRAINT "patient_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_family_history"
    ADD CONSTRAINT "patient_family_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_health_background"
    ADD CONSTRAINT "patient_health_background_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_medical_devices"
    ADD CONSTRAINT "patient_medical_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_nic_key" UNIQUE ("nic");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_qr_code_id_key" UNIQUE ("qr_code_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_uhi_key" UNIQUE ("uhi");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacies"
    ADD CONSTRAINT "pharmacies_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "public"."pharmacies"
    ADD CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_dispensing"
    ADD CONSTRAINT "prescription_dispensing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_qr_code_value_key" UNIQUE ("qr_code_value");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_consent_access_grants_context" ON "public"."consent_access_grants" USING "btree" ("patient_id", "doctor_id", "appointment_id", "expires_at" DESC);



CREATE INDEX "idx_consent_access_requests_context" ON "public"."consent_access_requests" USING "btree" ("patient_id", "doctor_id", "appointment_id", "created_at" DESC);



CREATE INDEX "idx_consent_patient_id" ON "public"."consent_settings" USING "btree" ("patient_id");



CREATE INDEX "idx_hospitals_is_active" ON "public"."hospitals" USING "btree" ("is_active");



CREATE INDEX "idx_hospitals_is_verified" ON "public"."hospitals" USING "btree" ("is_verified");



CREATE INDEX "idx_hospitals_user_id" ON "public"."hospitals" USING "btree" ("user_id");



CREATE INDEX "idx_otp_verifications_email" ON "public"."otp_verifications" USING "btree" ("email");



CREATE INDEX "idx_password_reset_tokens_token" ON "public"."password_reset_tokens" USING "btree" ("token");



CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_patient_family_history_emergency" ON "public"."patient_family_history" USING "btree" ("patient_id", "is_active", "is_emergency_relevant");



CREATE INDEX "idx_patient_family_history_patient_id" ON "public"."patient_family_history" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_health_background_emergency" ON "public"."patient_health_background" USING "btree" ("patient_id", "is_active", "is_emergency_relevant");



CREATE INDEX "idx_patient_health_background_patient_id" ON "public"."patient_health_background" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_medical_devices_active" ON "public"."patient_medical_devices" USING "btree" ("patient_id", "is_active", "is_emergency_relevant");



CREATE INDEX "idx_patient_medical_devices_patient_id" ON "public"."patient_medical_devices" USING "btree" ("patient_id");



CREATE INDEX "idx_prescription_dispensing_created_at" ON "public"."prescription_dispensing" USING "btree" ("created_at");



CREATE INDEX "idx_prescription_dispensing_pharmacy_id" ON "public"."prescription_dispensing" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_prescription_dispensing_prescription_id" ON "public"."prescription_dispensing" USING "btree" ("prescription_id");



CREATE INDEX "idx_session_expire" ON "public"."session" USING "btree" ("expire");



CREATE INDEX "idx_vaccinations_patient_id_date" ON "public"."vaccinations" USING "btree" ("patient_id", "date_administered" DESC);



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."consent_access_grants"
    ADD CONSTRAINT "consent_access_grants_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_access_grants"
    ADD CONSTRAINT "consent_access_grants_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_access_grants"
    ADD CONSTRAINT "consent_access_grants_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_access_grants"
    ADD CONSTRAINT "consent_access_grants_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."consent_access_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consent_access_requests"
    ADD CONSTRAINT "consent_access_requests_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_access_requests"
    ADD CONSTRAINT "consent_access_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_access_requests"
    ADD CONSTRAINT "consent_access_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consultation_notes"
    ADD CONSTRAINT "consultation_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consultation_notes"
    ADD CONSTRAINT "consultation_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."consultation_notes"
    ADD CONSTRAINT "consultation_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."doctor_availability"
    ADD CONSTRAINT "doctor_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doctors"
    ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emergency_access_logs"
    ADD CONSTRAINT "emergency_access_logs_accessed_by_fkey" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emergency_access_logs"
    ADD CONSTRAINT "emergency_access_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emergency_alerts"
    ADD CONSTRAINT "emergency_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hospitals"
    ADD CONSTRAINT "hospitals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_reports"
    ADD CONSTRAINT "lab_reports_lab_request_id_fkey" FOREIGN KEY ("lab_request_id") REFERENCES "public"."lab_test_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_reports"
    ADD CONSTRAINT "lab_reports_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_reports"
    ADD CONSTRAINT "lab_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_test_requests"
    ADD CONSTRAINT "lab_test_requests_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."lab_test_requests"
    ADD CONSTRAINT "lab_test_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_test_requests"
    ADD CONSTRAINT "lab_test_requests_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_test_requests"
    ADD CONSTRAINT "lab_test_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."laboratories"
    ADD CONSTRAINT "laboratories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."medicine_orders"
    ADD CONSTRAINT "medicine_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_orders"
    ADD CONSTRAINT "medicine_orders_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_orders"
    ADD CONSTRAINT "medicine_orders_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_allergies"
    ADD CONSTRAINT "patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_conditions"
    ADD CONSTRAINT "patient_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_family_history"
    ADD CONSTRAINT "patient_family_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_health_background"
    ADD CONSTRAINT "patient_health_background_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_medical_devices"
    ADD CONSTRAINT "patient_medical_devices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacies"
    ADD CONSTRAINT "pharmacies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_dispensing"
    ADD CONSTRAINT "prescription_dispensing_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_dispensing"
    ADD CONSTRAINT "prescription_dispensing_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."consent_access_grants" TO "anon";
GRANT ALL ON TABLE "public"."consent_access_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_access_grants" TO "service_role";



GRANT ALL ON TABLE "public"."consent_access_requests" TO "anon";
GRANT ALL ON TABLE "public"."consent_access_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_access_requests" TO "service_role";



GRANT ALL ON TABLE "public"."consent_settings" TO "anon";
GRANT ALL ON TABLE "public"."consent_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_settings" TO "service_role";



GRANT ALL ON TABLE "public"."consultation_notes" TO "anon";
GRANT ALL ON TABLE "public"."consultation_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."consultation_notes" TO "service_role";



GRANT ALL ON TABLE "public"."doctor_availability" TO "anon";
GRANT ALL ON TABLE "public"."doctor_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."doctor_availability" TO "service_role";



GRANT ALL ON TABLE "public"."doctors" TO "anon";
GRANT ALL ON TABLE "public"."doctors" TO "authenticated";
GRANT ALL ON TABLE "public"."doctors" TO "service_role";



GRANT ALL ON TABLE "public"."drug_interactions" TO "anon";
GRANT ALL ON TABLE "public"."drug_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."drug_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."emergency_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."emergency_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."emergency_access_logs" TO "service_role";



GRANT ALL ON TABLE "public"."emergency_alerts" TO "anon";
GRANT ALL ON TABLE "public"."emergency_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."emergency_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."health_content" TO "anon";
GRANT ALL ON TABLE "public"."health_content" TO "authenticated";
GRANT ALL ON TABLE "public"."health_content" TO "service_role";



GRANT ALL ON TABLE "public"."hospitals" TO "anon";
GRANT ALL ON TABLE "public"."hospitals" TO "authenticated";
GRANT ALL ON TABLE "public"."hospitals" TO "service_role";



GRANT ALL ON TABLE "public"."lab_reports" TO "anon";
GRANT ALL ON TABLE "public"."lab_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_reports" TO "service_role";



GRANT ALL ON TABLE "public"."lab_test_requests" TO "anon";
GRANT ALL ON TABLE "public"."lab_test_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_test_requests" TO "service_role";



GRANT ALL ON TABLE "public"."laboratories" TO "anon";
GRANT ALL ON TABLE "public"."laboratories" TO "authenticated";
GRANT ALL ON TABLE "public"."laboratories" TO "service_role";



GRANT ALL ON TABLE "public"."medical_records" TO "anon";
GRANT ALL ON TABLE "public"."medical_records" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_records" TO "service_role";



GRANT ALL ON TABLE "public"."medicine_orders" TO "anon";
GRANT ALL ON TABLE "public"."medicine_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."medicine_orders" TO "service_role";



GRANT ALL ON TABLE "public"."otp_verifications" TO "anon";
GRANT ALL ON TABLE "public"."otp_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."patient_allergies" TO "anon";
GRANT ALL ON TABLE "public"."patient_allergies" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_allergies" TO "service_role";



GRANT ALL ON TABLE "public"."patient_conditions" TO "anon";
GRANT ALL ON TABLE "public"."patient_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."patient_family_history" TO "anon";
GRANT ALL ON TABLE "public"."patient_family_history" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_family_history" TO "service_role";



GRANT ALL ON TABLE "public"."patient_health_background" TO "anon";
GRANT ALL ON TABLE "public"."patient_health_background" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_health_background" TO "service_role";



GRANT ALL ON TABLE "public"."patient_medical_devices" TO "anon";
GRANT ALL ON TABLE "public"."patient_medical_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_medical_devices" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacies" TO "anon";
GRANT ALL ON TABLE "public"."pharmacies" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacies" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_dispensing" TO "anon";
GRANT ALL ON TABLE "public"."prescription_dispensing" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_dispensing" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_items" TO "anon";
GRANT ALL ON TABLE "public"."prescription_items" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_items" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."session" TO "anon";
GRANT ALL ON TABLE "public"."session" TO "authenticated";
GRANT ALL ON TABLE "public"."session" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vaccinations" TO "anon";
GRANT ALL ON TABLE "public"."vaccinations" TO "authenticated";
GRANT ALL ON TABLE "public"."vaccinations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







