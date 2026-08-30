-- CARE4U-257: Create health_content table for Admin Health Content Management (Epic 7.10)
-- Draft -> published workflow; feeds Member 2's patient-facing content epic (8.13)

CREATE TABLE health_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('first-aid', 'vaccine', 'nutrition', 'mental-health', 'dengue-alert')),
    source VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);