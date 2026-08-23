-- CARE4U-237: Add verification_status column to users table
-- Supports Epic 7.4 (Multi-Role Registration Support) and 7.6 (Admin Approval Center)
--
-- Existing roles (patient, doctor) default to 'approved' - no change to
-- current login behavior. New roles (pharmacist, lab_technician,
-- hospital_staff) are set to 'pending' at creation time (see
-- auth.repository.js createUser()) and require admin approval before
-- they can log in (enforced in auth.service.js login()).

ALTER TABLE users
ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'approved';