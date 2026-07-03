-- Add the application_form JSONB column to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS application_form JSONB DEFAULT '{}'::jsonb;
