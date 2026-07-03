-- Multi-Tenant SaaS Schema Migration
-- Run this migration to add support for multiple organizations/tenants.

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    website TEXT,
    logo_url TEXT,
    logo_key TEXT,
    address TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed Default Organization
INSERT INTO public.organizations (id, name, code, website)
VALUES ('00000000-0000-0000-0000-000000000001', 'Placify Default', 'PLACIFY', 'https://placify.in')
ON CONFLICT (code) DO NOTHING;

-- 3. Add organization_id column to core operational tables
DO $$
BEGIN
    -- students table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'organization_id') THEN
        ALTER TABLE public.students ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- recruiters table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruiters' AND column_name = 'organization_id') THEN
        ALTER TABLE public.recruiters ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- admins table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'organization_id') THEN
        ALTER TABLE public.admins ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- jobs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.jobs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- job_applications table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'organization_id') THEN
        ALTER TABLE public.job_applications ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- saved_jobs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- notifications table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'organization_id') THEN
        ALTER TABLE public.notifications ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- discussion_threads table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_threads' AND column_name = 'organization_id') THEN
        ALTER TABLE public.discussion_threads ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- discussion_comments table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_comments' AND column_name = 'organization_id') THEN
        ALTER TABLE public.discussion_comments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- audit_logs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- alumni table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumni' AND column_name = 'organization_id') THEN
        ALTER TABLE public.alumni ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- referral_requests table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_requests' AND column_name = 'organization_id') THEN
        ALTER TABLE public.referral_requests ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- coding_submissions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coding_submissions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.coding_submissions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- dsa_progress table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dsa_progress' AND column_name = 'organization_id') THEN
        ALTER TABLE public.dsa_progress ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- ats_scans table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ats_scans' AND column_name = 'organization_id') THEN
        ALTER TABLE public.ats_scans ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- mock_interviews table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mock_interviews' AND column_name = 'organization_id') THEN
        ALTER TABLE public.mock_interviews ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- resume_reviews table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_reviews' AND column_name = 'organization_id') THEN
        ALTER TABLE public.resume_reviews ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- off_campus_jobs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'off_campus_jobs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.off_campus_jobs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- interview_rounds table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_rounds' AND column_name = 'organization_id') THEN
        ALTER TABLE public.interview_rounds ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;

    -- application_status_history table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'application_status_history' AND column_name = 'organization_id') THEN
        ALTER TABLE public.application_status_history ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;
END $$;

-- 4. Add college_id column to students table and create unique constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'college_id') THEN
        ALTER TABLE public.students ADD COLUMN college_id TEXT;
        
        -- Generate initial distinct college_ids for existing students to satisfy uniqueness
        UPDATE public.students SET college_id = 'COLLEGE_' || substring(id::text from 1 for 8) WHERE college_id IS NULL;
        
        -- Add unique constraint
        ALTER TABLE public.students ADD CONSTRAINT students_org_college_id_unique UNIQUE (organization_id, college_id);
    END IF;
END $$;

-- 5. Add role column to admins table to support sub_admin role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'role') THEN
        ALTER TABLE public.admins ADD COLUMN role TEXT DEFAULT 'organization_admin' CHECK (role IN ('organization_admin', 'sub_admin'));
    END IF;
END $$;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
