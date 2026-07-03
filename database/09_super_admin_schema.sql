-- Migration: Super Admin Control Center Setup

-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Alter students table for onboarding status
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Verified';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS otp TEXT;
ALTER TABLE public.students ALTER COLUMN account_status SET DEFAULT 'Pending';
ALTER TABLE public.students ALTER COLUMN verification_status SET DEFAULT 'Pending';

-- 3. Alter recruiters table for onboarding status
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Verified';
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS otp TEXT;
ALTER TABLE public.recruiters ALTER COLUMN status SET DEFAULT 'Pending';

-- 4. Alter admins table for onboarding status and custom permissions
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS otp TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.admins ALTER COLUMN status SET DEFAULT 'Pending';

-- 5. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    performed_by TEXT NOT NULL,
    action TEXT NOT NULL,
    affected_user TEXT,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 7. Seed platform settings
INSERT INTO public.platform_settings (key, value) VALUES
('platform_name', '"Placify"'),
('platform_logo', '"/logo.png"'),
('maintenance_mode', 'false'),
('email_config', '{"smtp_server": "smtp.gmail.com", "port": 587, "sender": "notifications@placify.in"}'),
('notification_settings', '{"new_registrations": true, "account_updates": true}'),
('default_settings', '{"max_jobs_per_recruiter": 50}')
ON CONFLICT (key) DO NOTHING;

-- 8. Seed initial Super Admin account (sahilsrivastava8962@gmail.com / user-aakash)
INSERT INTO public.super_admins (user_id, name, email) VALUES
('user-aakash', 'Aakash Srivastava', 'sahilsrivastava8962@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';
