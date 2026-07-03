-- Migration to fix coding_progress schema
-- Drops the strict UUID foreign key constraint to permit built-in alphanumeric LeetCode IDs (e.g. 'lc-1')

ALTER TABLE public.coding_progress DROP CONSTRAINT IF EXISTS coding_progress_problem_id_fkey;
ALTER TABLE public.coding_progress ALTER COLUMN problem_id TYPE TEXT;
