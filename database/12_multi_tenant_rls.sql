
-- Migration: Multi-tenant RLS Policies, Indexes, and Onboarding Status Column

-- 1. Add status column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended'));

-- 2. Backfill status column for existing students based on verification and account statuses
UPDATE public.students 
SET status = 'verified' 
WHERE verification_status = 'Verified' OR verification_status = 'Approved';

UPDATE public.students 
SET status = 'rejected' 
WHERE verification_status = 'Rejected';

UPDATE public.students 
SET status = 'suspended' 
WHERE account_status = 'Suspended';

UPDATE public.students 
SET status = 'pending' 
WHERE status IS NULL;

-- 3. Backfill any null college_id values with distinct fallback values
UPDATE public.students 
SET college_id = 'COLLEGE_' || substring(id::text from 1 for 8) 
WHERE college_id IS NULL;

-- 4. Add organization_id to mentor_profiles and dsa_questions tables
ALTER TABLE public.mentor_profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.dsa_questions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';

-- 5. Create database performance indexes
CREATE INDEX IF NOT EXISTS idx_students_org ON public.students(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_org ON public.recruiters(organization_id);
CREATE INDEX IF NOT EXISTS idx_dsa_org ON public.dsa_questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_mentors_org ON public.mentor_profiles(organization_id);

-- 6. Helper Functions for RLS Policy Enforcement (SECURITY DEFINER to avoid recursion)

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins 
        WHERE user_id = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Check students
    SELECT organization_id INTO org_id FROM public.students WHERE user_id = auth.uid()::text LIMIT 1;
    IF org_id IS NOT NULL THEN
        RETURN org_id;
    END IF;

    -- Check recruiters
    SELECT organization_id INTO org_id FROM public.recruiters WHERE user_id = auth.uid()::text LIMIT 1;
    IF org_id IS NOT NULL THEN
        RETURN org_id;
    END IF;

    -- Check admins/subadmins
    SELECT organization_id INTO org_id FROM public.admins WHERE user_id = auth.uid()::text LIMIT 1;
    IF org_id IS NOT NULL THEN
        RETURN org_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. Enable RLS and Define Row Level Security Policies

-- students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_tenant_policy" ON public.students;
CREATE POLICY "students_tenant_policy" ON public.students
  FOR ALL
  USING (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- recruiters table
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recruiters_tenant_policy" ON public.recruiters;
CREATE POLICY "recruiters_tenant_policy" ON public.recruiters
  FOR ALL
  USING (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- subadmins table
ALTER TABLE public.subadmins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subadmins_tenant_policy" ON public.subadmins;
CREATE POLICY "subadmins_tenant_policy" ON public.subadmins
  FOR ALL
  USING (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- mentor_profiles table
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mentor_profiles_tenant_policy" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_tenant_policy" ON public.mentor_profiles
  FOR ALL
  USING (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR user_id = auth.uid()::text 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- dsa_questions table
ALTER TABLE public.dsa_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dsa_questions_tenant_policy" ON public.dsa_questions;
CREATE POLICY "dsa_questions_tenant_policy" ON public.dsa_questions
  FOR ALL
  USING (
    public.is_super_admin() 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_tenant_policy" ON public.jobs;
CREATE POLICY "jobs_tenant_policy" ON public.jobs
  FOR ALL
  USING (
    public.is_super_admin() 
    OR organization_id = public.get_auth_user_organization_id()
  )
  WITH CHECK (
    public.is_super_admin() 
    OR organization_id = public.get_auth_user_organization_id()
  );

-- 8. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
