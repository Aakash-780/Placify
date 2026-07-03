-- Migration: Organization Admin & SubAdmin refactoring and Multi-tenant RBAC updates

-- 1. Add admin_id to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS admin_id TEXT;

-- 2. Create organization_admins table
CREATE TABLE IF NOT EXISTS public.organization_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Auth user reference
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    must_change_password BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create subadmins table
CREATE TABLE IF NOT EXISTS public.subadmins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Auth user reference
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_admin UUID REFERENCES public.organization_admins(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    role TEXT DEFAULT 'Placement Officer',
    password_hash TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Update students table for admin verification tracking
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 5. Update recruiters table for admin verification tracking
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected', 'Suspended'));
ALTER TABLE public.recruiters ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 6. Trigger to sync legacy admins table -> organization_admins / subadmins
CREATE OR REPLACE FUNCTION public.sync_admins_to_new_tables()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.role = 'organization_admin' THEN
        INSERT INTO public.organization_admins (user_id, organization_id, name, email, is_active)
        VALUES (NEW.user_id, NEW.organization_id, NEW.name, NEW.email, (NEW.status = 'Active'))
        ON CONFLICT (user_id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            is_active = EXCLUDED.is_active;
    ELSIF NEW.role = 'sub_admin' OR NEW.role = 'subadmin' OR NEW.role = 'super_admin' THEN
        INSERT INTO public.subadmins (user_id, organization_id, name, email, department, role, status)
        VALUES (NEW.user_id, NEW.organization_id, NEW.name, NEW.email, NEW.department, NEW.designation, NEW.status)
        ON CONFLICT (user_id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            department = EXCLUDED.department,
            role = EXCLUDED.role,
            status = EXCLUDED.status;
    END IF;

    -- Auto-verify email in auth.users
    UPDATE auth.users SET email_verified = true WHERE id = NEW.user_id::uuid;

    RETURN NEW;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_admins_to_new_tables ON public.admins;
CREATE TRIGGER trg_sync_admins_to_new_tables
AFTER INSERT OR UPDATE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.sync_admins_to_new_tables();

-- Trigger to delete from new tables on legacy admin delete
CREATE OR REPLACE FUNCTION public.sync_admins_delete_to_new_tables()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    DELETE FROM public.organization_admins WHERE user_id = OLD.user_id;
    DELETE FROM public.subadmins WHERE user_id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_admins_delete_to_new_tables ON public.admins;
CREATE TRIGGER trg_sync_admins_delete_to_new_tables
AFTER DELETE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.sync_admins_delete_to_new_tables();

-- 7. Trigger to sync organization_admins -> legacy admins table
CREATE OR REPLACE FUNCTION public.sync_organization_admins_to_legacy()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.admins (user_id, organization_id, name, email, status, role)
    VALUES (
        NEW.user_id, 
        NEW.organization_id, 
        NEW.name, 
        NEW.email, 
        CASE WHEN NEW.is_active THEN 'Active' ELSE 'Suspended' END, 
        'organization_admin'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        role = 'organization_admin';

    -- Also update organizations.admin_id
    UPDATE public.organizations
    SET admin_id = NEW.id::text
    WHERE id = NEW.organization_id;

    -- Auto-verify email in auth.users
    UPDATE auth.users SET email_verified = true WHERE id = NEW.user_id::uuid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_organization_admins_to_legacy ON public.organization_admins;
CREATE TRIGGER trg_sync_organization_admins_to_legacy
AFTER INSERT OR UPDATE ON public.organization_admins
FOR EACH ROW EXECUTE FUNCTION public.sync_organization_admins_to_legacy();

CREATE OR REPLACE FUNCTION public.sync_organization_admins_delete_to_legacy()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    DELETE FROM public.admins WHERE user_id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_organization_admins_delete_to_legacy ON public.organization_admins;
CREATE TRIGGER trg_sync_organization_admins_delete_to_legacy
AFTER DELETE ON public.organization_admins
FOR EACH ROW EXECUTE FUNCTION public.sync_organization_admins_delete_to_legacy();

-- 8. Trigger to sync subadmins -> legacy admins table
CREATE OR REPLACE FUNCTION public.sync_subadmins_to_legacy()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.admins (user_id, organization_id, name, email, department, designation, status, role, permissions)
    VALUES (
        NEW.user_id, 
        NEW.organization_id, 
        NEW.name, 
        NEW.email, 
        NEW.department, 
        NEW.role, 
        NEW.status, 
        'sub_admin',
        ARRAY['Manage Students', 'Manage Jobs', 'Manage Applications', 'View Analytics', 'Manage Community', 'Manage DSA Sheets']
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        status = EXCLUDED.status,
        role = 'sub_admin';

    -- Auto-verify email in auth.users
    UPDATE auth.users SET email_verified = true WHERE id = NEW.user_id::uuid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_subadmins_to_legacy ON public.subadmins;
CREATE TRIGGER trg_sync_subadmins_to_legacy
AFTER INSERT OR UPDATE ON public.subadmins
FOR EACH ROW EXECUTE FUNCTION public.sync_subadmins_to_legacy();

CREATE OR REPLACE FUNCTION public.sync_subadmins_delete_to_legacy()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    DELETE FROM public.admins WHERE user_id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_subadmins_delete_to_legacy ON public.subadmins;
CREATE TRIGGER trg_sync_subadmins_delete_to_legacy
AFTER DELETE ON public.subadmins
FOR EACH ROW EXECUTE FUNCTION public.sync_subadmins_delete_to_legacy();

-- Migrate existing organization_admin records from admins table to organization_admins
INSERT INTO public.organization_admins (user_id, organization_id, name, email, is_active)
SELECT user_id, organization_id, name, email, (status = 'Active')
FROM public.admins
WHERE role = 'organization_admin'
ON CONFLICT (user_id) DO NOTHING;

-- Migrate existing subadmin records from admins table to subadmins
INSERT INTO public.subadmins (user_id, organization_id, name, email, department, role, status)
SELECT user_id, organization_id, name, email, department, designation, status
FROM public.admins
WHERE role IN ('sub_admin', 'subadmin', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';
