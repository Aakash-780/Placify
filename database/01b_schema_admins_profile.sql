ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS profile_photo_url text, 
ADD COLUMN IF NOT EXISTS profile_photo_key text, 
ADD COLUMN IF NOT EXISTS employee_id text, 
ADD COLUMN IF NOT EXISTS designation text, 
ADD COLUMN IF NOT EXISTS department text, 
ADD COLUMN IF NOT EXISTS college_name text, 
ADD COLUMN IF NOT EXISTS campus_name text, 
ADD COLUMN IF NOT EXISTS placement_cell_name text, 
ADD COLUMN IF NOT EXISTS office_contact text;