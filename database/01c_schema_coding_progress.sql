-- Migration Schema to create coding_progress table
-- This table tracks active student drafts, notes, and completion statuses for Code Simulator challenges.

CREATE TABLE IF NOT EXISTS public.coding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.coding_problems(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started' CHECK (status IN ('solved','started','unsolved')),
    notes TEXT DEFAULT '',
    last_code TEXT,
    last_language TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, problem_id)
);
