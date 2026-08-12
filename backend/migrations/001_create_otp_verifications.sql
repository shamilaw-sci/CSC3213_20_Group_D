-- =====================================================
-- Migration: Create otp_verifications table
-- Ticket: C4U-XX (Auth - OTP Verification on Registration)
-- Author: Member 1 (S/21/389)
-- Purpose: Holds pending registration data + OTP until
--          verified, at which point the real users row
--          is created. No password is ever stored in
--          plain text - it is hashed before insertion here.
-- =====================================================

CREATE TABLE otp_verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR NOT NULL UNIQUE,
    phone           VARCHAR,
    password_hash   VARCHAR NOT NULL,
    role            VARCHAR NOT NULL,
    otp_code        VARCHAR(6) NOT NULL,
    otp_expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_otp_verifications_email ON otp_verifications(email);

-- Row Level Security enabled (see Supabase prompt) - backend
-- connects via direct pg connection (Transaction Pooler), not
-- the anon/authenticated client keys, so RLS does not affect
-- the app itself. It only prevents accidental exposure via
-- Supabase's public API keys.
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
