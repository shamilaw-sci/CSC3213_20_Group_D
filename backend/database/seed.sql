-- Care4U final-release reference data (15 November 2026)
-- Run AFTER backend/database/schema.sql on a fresh Care4U PostgreSQL/Supabase database.
-- Populates non-personal baseline data only: 4 settings, 12 drug warnings, 5 health articles.
-- DO NOT run this file against production without first checking existing data.
-- The article image URLs below reference the original Care4U Supabase Storage project.
-- For a fully independent installation, copy the images into the new project's Storage
-- bucket and update image_url values; these files are NOT included in schema.sql.
-- Safety: These drug-interaction rules are a small academic demo dataset, not a complete
-- drug-safety knowledge base and should not be relied on for clinical decisions.

BEGIN;

-- 1. Initial system settings. Uses original exported values (30-minute emergency setting).
INSERT INTO public.system_settings (key, value, description)
VALUES
    ('password_min_length', '8', 'Minimum required password length for registration and reset'),
    ('session_timeout_ms', '86400000', 'Session cookie max age in milliseconds (default 24 hours)'),
    ('otp_expiry_minutes', '10', 'How many minutes an OTP code remains valid after being sent'),
    ('emergency_access_duration_minutes', '30', 'How long a Break-the-Glass emergency access grant remains valid')
ON CONFLICT (key) DO NOTHING;

-- 2. Drug-interaction reference rules.
-- The table has no unique pair constraint, so skip pairs already present.
INSERT INTO public.drug_interactions (drug_a, drug_b, severity, note)
SELECT v.drug_a, v.drug_b, v.severity, v.note
FROM (VALUES
    ('Aspirin', 'Prednisolone', 'moderate', 'Increased risk of gastrointestinal bleeding when antiplatelet and corticosteroid therapy are combined.'),
    ('Azithromycin', 'Atorvastatin', 'moderate', 'Macrolide antibiotics can raise statin blood levels, increasing risk of muscle toxicity (myopathy).'),
    ('Azithromycin', 'Domperidone', 'severe', 'Both drugs can prolong the QT interval; combined use raises risk of serious heart rhythm problems.'),
    ('Diclofenac', 'Aspirin', 'moderate', 'Combined NSAID and aspirin use raises gastrointestinal bleeding risk.'),
    ('Diclofenac', 'Losartan', 'moderate', 'Same NSAID-ARB interaction: reduced antihypertensive effect, renal risk.'),
    ('Diclofenac', 'Prednisolone', 'severe', 'Combining an NSAID with a corticosteroid significantly increases risk of GI ulceration and bleeding.'),
    ('Ibuprofen', 'Amlodipine', 'mild', 'NSAIDs may modestly reduce the antihypertensive effect of calcium channel blockers.'),
    ('Ibuprofen', 'Aspirin', 'moderate', 'NSAIDs can interfere with aspirin''s antiplatelet effect and increase bleeding risk when combined.'),
    ('Ibuprofen', 'Losartan', 'moderate', 'NSAIDs can reduce the blood-pressure-lowering effect of ARBs and affect kidney function.'),
    ('Ibuprofen', 'Prednisolone', 'severe', 'Combining an NSAID with a corticosteroid significantly increases risk of GI ulceration and bleeding.'),
    ('Prednisolone', 'Insulin', 'moderate', 'Corticosteroids raise blood glucose, often requiring an insulin dose adjustment.'),
    ('Prednisolone', 'Metformin', 'moderate', 'Corticosteroids raise blood glucose and can counteract metformin''s effect. Glucose monitoring needed.')
) AS v(drug_a, drug_b, severity, note)
WHERE NOT EXISTS (
    SELECT 1 FROM public.drug_interactions AS d
    WHERE lower(d.drug_a) = lower(v.drug_a)
      AND lower(d.drug_b) = lower(v.drug_b)
);

-- 3. Sample published health-awareness articles.
-- Preserve original public image URLs; they will require Storage migration for independence.
INSERT INTO public.health_content (title, body, category, source, status, image_url)
SELECT v.title, v.body, v.category, v.source, v.status, v.image_url
FROM (VALUES
    ('Dengue Fever Alert: Rainy Season', 'With the monsoon season approaching, clear all stagnant water around your home to prevent mosquito breeding. If you experience high fever and joint pain, seek medical care immediately.', 'dengue-alert', NULL, 'published', 'https://nzmbrhjsnkalyojgsecs.supabase.co/storage/v1/object/public/health-content-images/articles/1789400925476-4ey6aphx.png'),
    ('Heat Stroke Alert: Hot Weather Safety', 'Hot weather can lead to heat exhaustion and heat stroke if the body becomes too hot. Learn the warning signs, ways to stay hydrated and cool, immediate first-aid steps, and when urgent medical care is needed.', 'first-aid', 'Care4U Health Editorial', 'published', 'https://nzmbrhjsnkalyojgsecs.supabase.co/storage/v1/object/public/health-content-images/articles/1789402420818-u360k7il.png'),
    ('High Blood Pressure: Know the Warning Signs', 'High blood pressure often develops without noticeable symptoms but can affect the heart, brain, kidneys, and eyes over time. Regular blood pressure checks, healthy daily habits, and knowing when to seek urgent care can help reduce the risk of serious complications.', 'nutrition', 'Care4U Health Editorial', 'published', 'https://nzmbrhjsnkalyojgsecs.supabase.co/storage/v1/object/public/health-content-images/articles/1789402505660-xu9lja3c.png'),
    ('Managing Dust Mite Allergies at Home', 'Simple daily habits can reduce exposure and help relieve<br>allergy symptoms.', 'first-aid', 'Care4U Health Editorial', 'published', 'https://nzmbrhjsnkalyojgsecs.supabase.co/storage/v1/object/public/health-content-images/articles/1789402293521-jlm7mld2.png'),
    ('Safe Antibiotic Use', 'Antibiotics should be used carefully and only as prescribed. Learn when antibiotics are useful, common mistakes to avoid, possible side effects, and the warning signs that may require urgent medical attention.', 'first-aid', 'Care4U Health Editorial', 'published', 'https://nzmbrhjsnkalyojgsecs.supabase.co/storage/v1/object/public/health-content-images/articles/1789402464499-wrc3et3x.png')
) AS v(title, body, category, source, status, image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM public.health_content AS h WHERE h.title = v.title
);

COMMIT;
