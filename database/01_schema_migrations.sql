-- Migration file to ensure AI Profile numeric columns exist
-- Run this if the cloud database resets

ALTER TABLE student_ai_profiles
ADD COLUMN IF NOT EXISTS tenth_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS twelfth_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS internships_count INTEGER,
ADD COLUMN IF NOT EXISTS experience_months INTEGER,
ADD COLUMN IF NOT EXISTS certificates_names TEXT[];

-- Reload PostgREST schema cache so the API recognizes the new columns (InsForge / Supabase specific)
NOTIFY pgrst, 'reload schema';