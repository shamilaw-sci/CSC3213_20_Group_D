-- CARE4U-275: Create system_settings table for Admin System Settings Panel (Epic 7.14)
-- Key-value store for previously hardcoded values: OTP expiry, password
-- policy minimums, session timeout, emergency-access duration. Seeded
-- with values matching current hardcoded defaults elsewhere in the code.

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
('otp_expiry_minutes', '10', 'How many minutes an OTP code remains valid after being sent'),
('password_min_length', '8', 'Minimum required password length for registration and reset'),
('session_timeout_ms', '86400000', 'Session cookie max age in milliseconds (default 24 hours)'),
('emergency_access_duration_minutes', '30', 'How long a Break-the-Glass emergency access grant remains valid');