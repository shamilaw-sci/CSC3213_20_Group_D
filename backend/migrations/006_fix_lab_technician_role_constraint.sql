-- Fixes a mismatch discovered during testing: the users_role_check
-- constraint only allowed 'lab_staff', but all application code (Epic
-- 7.4, CARE4U-236/237/238) consistently uses 'lab_technician' per the
-- Final Review Development Guide's exact wording. This caused a 500
-- error whenever a lab_technician account tried to verify OTP.
-- Both values are kept in the constraint since old seeded rows may
-- still use 'lab_staff'.

ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role::text = ANY (ARRAY['patient', 'doctor', 'hospital_staff', 'pharmacist', 'lab_technician', 'lab_staff', 'emergency_staff', 'admin']::text[]));