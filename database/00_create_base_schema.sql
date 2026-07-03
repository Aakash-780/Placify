-- Base Schema for Career Bridge
-- Run this first to create all required tables

-- 1. Students Profile Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    branch TEXT,
    current_year INTEGER,
    graduation_year INTEGER,
    cgpa NUMERIC DEFAULT 0,
    backlogs INTEGER DEFAULT 0,
    placement_status TEXT DEFAULT 'not_placed',
    resume_url TEXT,
    resume_key TEXT,
    profile_photo_url TEXT,
    profile_photo_key TEXT,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    skills TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Student Skills
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student Projects
CREATE TABLE IF NOT EXISTS public.student_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    technologies TEXT[],
    project_url TEXT,
    github_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Student Certificates
CREATE TABLE IF NOT EXISTS public.student_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT,
    issue_date DATE,
    expiration_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Student AI Profiles (cached resume text processing)
CREATE TABLE IF NOT EXISTS public.student_ai_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    tenth_percentage NUMERIC,
    twelfth_percentage NUMERIC,
    internships_count INTEGER,
    experience_months INTEGER,
    certificates_names TEXT[],
    extracted_skills TEXT[],
    extracted_technologies TEXT[],
    extracted_keywords TEXT[],
    ai_tags TEXT[],
    experience_level TEXT,
    resume_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Jobs Board
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    job_type TEXT,
    work_mode TEXT,
    ctc NUMERIC,
    stipend NUMERIC,
    location TEXT[],
    min_cgpa NUMERIC DEFAULT 0,
    max_backlogs INTEGER DEFAULT 0,
    allowed_branches TEXT[],
    allowed_years TEXT[],
    application_deadline TIMESTAMPTZ,
    num_rounds INTEGER,
    interview_process TEXT,
    required_skills TEXT[],
    tech_stack TEXT[],
    status TEXT DEFAULT 'active',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'shortlisted', 'rejected', 'accepted')),
    application_form JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, job_id)
);

-- 8. Saved Jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, job_id)
);

-- 9. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    profile_photo_url TEXT,
    profile_photo_key TEXT,
    employee_id TEXT,
    designation TEXT,
    department TEXT,
    college_name TEXT,
    campus_name TEXT,
    placement_cell_name TEXT,
    office_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Recruiters Table
CREATE TABLE IF NOT EXISTS public.recruiters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    profile_photo_url TEXT,
    profile_photo_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Coding Problems (Simulator)
CREATE TABLE IF NOT EXISTS public.coding_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category TEXT,
    starter_code JSONB DEFAULT '{}'::jsonb,
    test_cases JSONB DEFAULT '[]'::jsonb,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Coding Submissions
CREATE TABLE IF NOT EXISTS public.coding_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.coding_problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. DSA Companies
CREATE TABLE IF NOT EXISTS public.dsa_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. DSA Questions
CREATE TABLE IF NOT EXISTS public.dsa_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    leetcode_url TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category TEXT,
    company_id UUID REFERENCES public.dsa_companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. DSA Progress tracking
CREATE TABLE IF NOT EXISTS public.dsa_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.dsa_questions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'solved' CHECK (status IN ('solved', 'unsolved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, question_id)
);

-- 16. ATS Resume Scans
CREATE TABLE IF NOT EXISTS public.ats_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    feedback JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Alumni Profiles
CREATE TABLE IF NOT EXISTS public.alumni (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company TEXT,
    position TEXT,
    branch TEXT,
    graduation_year INTEGER,
    available_for_mentorship BOOLEAN DEFAULT true,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Referral Requests
CREATE TABLE IF NOT EXISTS public.referral_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES public.alumni(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, alumni_id)
);

-- 19. Discussion Categories (Forum)
CREATE TABLE IF NOT EXISTS public.discussion_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. Discussion Threads (Forum)
CREATE TABLE IF NOT EXISTS public.discussion_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('student', 'recruiter', 'admin')),
    company TEXT,
    category_id UUID REFERENCES public.discussion_categories(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    upvotes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Discussion Comments (Forum)
CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('student', 'recruiter', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);
