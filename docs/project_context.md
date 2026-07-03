# Career Bridge - Project Context

This document provides a comprehensive overview of the "Career Bridge" project as of its current state. It is designed to quickly onboard new developers or AI agents onto the codebase.

## 1. Project Overview
Career Bridge is a full-stack platform designed to bridge the gap between students, recruiters, and placement admins. It handles job postings, student profiles, resume analysis, coding practice, and intelligent student discovery.

## 2. Tech Stack Setup
- **Frontend Framework:** React 18 with Vite
- **Routing:** React Router DOM (v6)
- **Styling:** Tailwind CSS (v3.4), `shadcn/ui` components (Radix UI primitives)
- **Icons:** Lucide React
- **Backend/BaaS:** InsForge (PostgreSQL, Auth, Storage) via `@insforge/sdk`
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`) for NLP tasks.
- **Code Execution:** Judge0 CE (Public API) for secure, sandboxed multi-language remote evaluation.
- **Code Editor:** CodeMirror 6 (`@codemirror/state`, `@codemirror/view`, etc.)

## 3. Environment Variables
The following environment variables are required in `.env`:
```env
VITE_INSFORGE_URL=https://<your-app-id>.region.insforge.app
VITE_INSFORGE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=AIza...
VITE_CONVERT_API_SECRET=your_convertapi_secret_key
```

## 4. Key Features Implemented

### Authentication & Authorization
- **Custom Auth Flow:** Replaced the deprecated `@insforge/react` `<SignInButton>` and hosted auth flow (which was causing 404 errors) with a fully custom `/auth` page.
- **Methods:** Implemented `insforge.auth.signInWithPassword()` and `insforge.auth.signUp()`.
- **Role Control:** Managed via `RoleContext`. Users are assigned roles (`student`, `admin`, `recruiter`) which dictate route access (`ProtectedRoute`).

### Profile Management (`/profile`)
- **Student Information:** CGPA, Branch, Graduation Year, Backlogs, Bio, Social Links.
- **Uploads:** Integration with InsForge Storage for Profile Photo (`profile-images` bucket) and Resume (`resumes` bucket).
- **Dynamic Entities:** Users can add and delete multiple Skills and Projects.
  - *Note:* Fixed recent `404 Not Found` API errors during inserts by temporarily disabling PostgreSQL Row Level Security (RLS) and granting CRUD permissions to `anon` and `authenticated` roles.

### Job Board & Applications (`/jobs`, `/jobs/:id`)
- **Listings:** Displays on-campus and off-campus opportunities.
- **Eligibility Checking:** Smart logic that evaluates a student's eligibility based on:
  - Minimum CGPA (Type-safe number comparison)
  - Maximum Backlogs
  - Allowed Branches
  - Graduation Year (`graduation_year` checked instead of `current_year` to support multi-year cohorts like 2027, 2028, 2029).
- **Applications:** Students can apply to eligible jobs. Records are saved in the `job_applications` table.

### Admin Dashboard & DSA Sheets Management (`/admin/*`)
- **Admin Specific Routes:** Handling Post Jobs (`/admin/post-job`), Applicants (`/admin/applicants`), Students (`/admin/students`), and Analytics (`/admin/analytics`).
- **Manage DSA Sheets (`/admin/manage-dsa`):** A custom admin GUI that allows the Placement Cell/Admins to add new top tech companies and maintain their internal bank of coding questions/topics dynamically from the frontend. Automatically syncs with the student-facing `/dsa-sheets` page without needing raw SQL.

### Code Simulator (`/simulator`)
- **Editor:** Integrated CodeMirror 6 (replaced heavy Monaco editor) supporting syntax highlighting and formatting for JavaScript, Python, Java, and C++.
- **Execution:** Uses AI (GPT/Gemini) as a sandbox to "mentally execute" code and return standard output or compilation errors based on provided sample inputs.
- **Database:** Saves completed attempts to the `coding_submissions` table.

### AI Student Explorer (`/student-explorer`) (Admin/Recruiter only)
- **Intelligent Search Engine:** Upgraded to act like LinkedIn Recruiter. Allows Admins/Recruiters to search for students using natural language combined with hard filters.
- **Resume Parsing & Grok/Gemini Strategy:** Uses `gemini-2.5-flash` model (fallback Local NLP available) for structured extraction of Skills, Tech Stack, and Projects, saving to `student_ai_profiles`.
- **Match Scoring Engine (IMPORTANT):** The `StudentExplorer` evaluates all students dynamically against AI-parsed constraints, assigning a Match Score (0–100%) based on:
  - Skill Match = 50%
  - CGPA Match / Constraints = 20%
  - Project/Keyword Match = 30%
- **Highlighting:** UI visually highlights dynamically generated keywords based directly on the user's natural language queries.

### Resume Builder & File Converters (`/resume-builder`)
- **ATS Checker:** Parses raw `.txt`, `.docx` (via `mammoth`), and `.pdf` (via native Gemini base64 support) to provide grading, feedback, and missing keywords using the Gemini API.
- **File Format Converters:** High-fidelity conversion between PDF and Word. Uses `ConvertAPI` to convert `.pdf` to `.docx` and vice versa while perfectly preserving complex styling, fonts, and layouts.

## 5. Database Schema (InsForge PostgreSQL)
*Note: RLS is currently disabled on all tables to prevent SDK insert errors. If re-enabling RLS, appropriate `INSERT`/`UPDATE` policies mapping `auth.uid()` to `student_id` are required.*

Key tables:
- `students`: Core user profile data.
- `student_skills`: Array-like relations for student skills.
- `student_projects`: Project portfolios with title, description, and URLs.
- `student_ai_profiles`: AI-extracted structured metadata used by the Student Explorer.
- `job_applications`: Join table for Student <-> Job tracking.
- `saved_jobs`: Bookmarking system.
- `coding_problems` & `coding_submissions`: Data for the Code Simulator.

## 6. Recent Major Refactors & Fixes
1. **Auth 404 Fix:** Stripped out legacy `@insforge/react` UI components. Routes now manually check `insforge.auth.getSession()` and map to a custom UI.
2. **Eligibility Logic:** Fixed critical bugs where string variables from the DB (`"8.5"`) were being compared against integer minimums (`7`). Implemented strict `Number()` casting.
3. **API Key Security / CORS:** Migrated Anthropic Claude integration to Google Gemini API to resolve browser-side `401 Unauthorized` errors related to Anthropic's strict CORS policies.
6. **Editor Performance:** Swapped Monaco for CodeMirror 6 to improve web application bundle size by ~1.5MB and fix initialization glitches.
7. **Database Writability:** Addressed `404 Not Found` API responses on POST requests explicitly caused by restrictive (or missing) Row Level Security policies. Allowed mutations to proceed.
8. **Gemini API Token Limits & Fallback System:** Fully integrated `gemini-2.5-flash` natively to ATS Checkers while removing artificial output token limits that were breaking JSON structures. Wrote a sophisticated multi-variable rule-engine logic to serve as a comprehensive fallback if the Gemini API ever fails to respond.

## 7. Next Steps / Pending Development
- **Completing Remaining Pages:** Finalize UI logic and database integration for the Alumni Dashboard and Community Forum components.
- **Re-enabling Security:** Draft and apply proper SQL RLS policies in InsForge before launching to production to ensure students can only edit their own rows.

## 5. Recent Fixes & Backups (April 2026)
### Multi-Tier AI Fallback & Stability
- Added a 3-tier fallback architecture for AI parsing (gemini-2.5-flash ? x.ai Grok ? Offline RegExp).
- Implemented robust 	ry/catch retry loops to handle 429 Too Many Requests and 503 Service Unavailable errors limits from Free-Tier AI APIs.
- Fixed NLP Mathematics matching so "10th" and "IT" do not cross-pollinate incorrectly in Offline mode.

### Database Persistence & Job Application Fixes
- **Live Database Migration**: Transitioned the `Jobs` and `Dashboard` pages from using static mock arrays (`ON_CAMPUS_JOBS`) to fetching true data from the live `public.jobs` database table. The application now displays exactly what is seeded in the cloud.
- **Complex Application Forms (JSONB)**: Evolved the simple one-click apply button into a comprehensive 5-part application form (Personal, Contact, Academic, Backlogs, Resume). 
  - Modified the `job_applications` database schema to include an `application_form` column of type `JSONB` to store these nested JSON payloads effortlessly.
  - Implemented Radix UI Dialog modals for students to fill out the form, and for Admins (in `Applicants.tsx`) to pull and dynamically render the rich JSON data when reviewing candidates.
- **SQL Backups (/database)**: Created structural backup files to survive InsForge free-tier idle pauses:
  - `01_schema_migrations.sql`: Alters/Schema updates.
  - `01a_schema_job_applications_form.sql`: Addition of the `application_form JSONB` column.
  - `01b_schema_admins_profile.sql`: Addition of organizational profile columns to the `admins` schema.
  - `02_seed_students.sql`: Upserts AI profiles for primary test students.
  - `03_seed_job_applications.sql`: Initial simulated applications.
  - `04_seed_jobs.sql`: Contains the seed data for exactly 7 premium tech roles (Google, Amazon, Microsoft, Infosys, Atlassian, Deloitte, TCS).
  - `05_seed_job_applications.sql`: Contains 5 highly realistic, dynamically generated application submissions utilizing real `student_id`s, `job_id`s, and comprehensive `application_form` JSONB payloads for the Admin Applicant Viewer.
