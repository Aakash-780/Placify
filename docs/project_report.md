# Career Bridge: Comprehensive Project & Technical Engineering Report

---

## 1. Executive Summary & Abstract
**Career Bridge** is a full-stack, AI-native platform engineered to seamlessly connect university students, placement administrators, and corporate recruiters. Traditional campus placements suffer from highly fragmented workflows—students prepare code on platforms like LeetCode, analyze their resumes on external ATS checkers, and manually submit redundant applications via disconnected Google Forms. 

Career Bridge acts as a modern, centralized Hub. It merges intelligent job matching, sandboxed coding assessments, AI-driven resume analysis, document formatting, and a sophisticated natural language student discovery engine into one highly performant ecosystem. By bridging the gap between talent and opportunity, Career Bridge streamlines the end-to-end campus placement workflow efficiently and resiliently.

## 2. Problem Statement & Core Objectives

### The Problem
*   **Administrative Bottleneck:** Placement Officers rely on manual Excel sheet sorting for eligibility filtering, causing delays and human error.
*   **Fragmented Student Experience:** Students utilize disjointed tools for Resume Building, ATS Checking, Technical Practice (DSA), and Job Applying. 
*   **Recruitment Friction:** Corporate recruiters struggle to find hidden talent using generic keyword searches on platforms like LinkedIn without contextual academic data (like Branches, Year, or Backlogs).

### The Solution (Objectives)
*   **Unify the Toolchain:** Provide students with an in-house Code Simulator, Resume Grader, and DSA curriculum natively connected to their job application profile.
*   **Automate Eligibility:** Enforce strictly-typed mathematical gates at the database level so students can ONLY apply if they meet corporate thresholds.
*   **Revolutionize Admin Tracking:** Upgrade from flat tables to nested `JSONB` structural forms, giving placement cells comprehensive applicant data via instantaneous UI models.
*   **Empower AI Searching:** Grant administrators the power to query talent using natural language ("Show me Python developers who know machine learning with a CGPA above 8").

---

## 3. Technology Stack & Infrastructure

The platform architecture prioritizes speed, scalable persistence, and AI-native microservices.

### Frontend Layer
*   **Core Framework:** React 18 powered by Vite, enabling instant Hot Module Replacement (HMR) and highly optimized ES modules for production via Rollup.
*   **Routing:** React Router DOM (v6) with custom `ProtectedRoute` wrappers tied strictly to asynchronous Role Contexts (Student, Admin, Recruiter).
*   **UI/UX Integration:** Tailwind CSS (v3.4) tightly coupled with `shadcn/ui` components (built on accessible Radix UI primitives) to guarantee aesthetic consistency.
*   **Icons & Theming:** Lucide React for crisp SVG iconography and dynamic Light/Dark mode theming via Context APIs.
*   **Editor Component:** CodeMirror 6 (`@codemirror/state`, `@codemirror/view`) for lightweight, fully syntax-highlighted code execution.

### Backend & Database (BaaS)
*   **Infrastructure:** InsForge Platform powered by PostgreSQL.
*   **Software Development Kit:** `@insforge/sdk` for client-side API bridging and socket management.
*   **Data Storage:** InsForge Storage (AWS S3 Compatible) utilizing dedicated buckets for `resumes` and `profile-images`.
*   **Authentication Engine:** Custom fully-hosted JWT-based flow mapped against distinct identity tables (`students`, `admins`, `recruiters`).

### Artificial Intelligence & External APIs
*   **Primary NLP Engine:** Google Gemini API (`gemini-2.5-flash`), processing real-time natural language queries, resume grading matrices, and complex JSON structured outputs.
*   **Backup Architecture:** xAI Grok fallback routing and Local RegExp fallbacks to combat free-tier 429 (Too Many Requests) or 503 (Service Unavailable) limits.
*   **Evaluation Microservice:** Judge0 CE (Public API) for secure, sandboxed, multi-language remote code compilation.
*   **Document Engines:** `mammoth.js` for `.docx` structural extraction and `ConvertAPI` for high-fidelity PDF-to-Word conversions.

---

## 4. Roles & Identity Management
The `RoleContext` is the foundational security wrapper of the frontend. Upon application load, the system intercepts the active `auth.getSession()` token.
*   **Identity Resolution:** The JWT is cross-referenced asynchronously against three distinct PostgreSQL tables (`admins`, `recruiters`, `students`).
*   **Dynamic Access:** 
    *   `students` gain access strictly to the Job Board, Code Simulator, Resume Builder, and DSA Sheets.
    *   `admins` bypass restriction gates to unlock applicant analytics, modify DSA structures, and post new jobs.

---

## 5. Core Platform Modules & Features

### 5.1. Intelligent Job Board & Automata Filtering (`/jobs`)
*   **Live Renderings:** Displays instantaneous snapshots of On-Campus and Off-Campus opportunities.
*   **Smart Eligibility Checking:** Automatically calculates mathematics against user profiles. Variables like string arrays (`"{React, Java}"`) are parsed through custom interceptors, while CGPAs (e.g., `"8.5"`) are cast strictly to Floating Integers before comparing against employer constraint boundaries (Minimum CGPA, Maximum Active/Dead Backlogs, Graduation Year).
*   **Dynamic Multi-step Applications:** Transitions single-click buttons into elaborate 5-part forms. Submissions are native nested `JSONB` structures injected into the `application_form` payload.

### 5.2. Admin Applicant Viewer & JSONB Rendering
*   Admins manage applicants via the `/admin/applicants` portal securely tied to specific job UUIDs.
*   **Dialog Modals:** Instead of flattening data, the system utilizes Radix UI modals to elegantly pop out and map the highly-nested `application_form` JSON dictionaries, rendering all keys seamlessly (e.g., transforming `twelfthPercent` to "Twelfth Percent").
*   **Status Management:** Admins can instantly alter statuses (`pending`, `under_review`, `shortlisted`, `rejected`, `accepted`) directly triggering PostgreSQL `UPDATE` commands.

### 5.3. Dynamic DSA Sheet Manager
*   An active graphical user interface for Placement Cells to dynamically add top tech company names and curate problem-sets. 
*   **Real-time Synching:** Eliminates the need for manual SQL injections. Updates map instantly to the student-facing `/dsa-sheets` page for immediate practice tracking.

### 5.4. Sandboxed Code Simulator (`/simulator`)
*   A browser-native execution environment leveraging the ultra-lightweight CodeMirror 6 engine.
*   **Live Evaluation:** Pings the Judge0 microservice to remotely compile algorithms and safely execute the user's inputs against multiple test targets.
*   **Compilation Tracing:** Returns standard output (`stdout`) or highly distinct Compilation Error logging to the UI, later storing historical completion marks to `coding_submissions`.

### 5.5. ATS Checker & Resume Workflow (`/resume-builder`)
*   **Corporate ATS Simulation:** Grades student resumes on formatting, phrasing, and keyword density to flag missing abilities.
*   **Format Bridging:** Implements Native Gemini base64 parsing for PDFs, and `mammoth.js` for `.docx`.
*   **File Converters:** High-fidelity conversion between PDF and Word formats using `ConvertAPI` to perfectly preserve styling, fonts, and layouts.

### 5.6. AI Student Explorer & Intelligent Matching Engine
*   *Built exclusively for Admins and Recruiters.*
*   Acts as a robust LinkedIn Recruiter-style query engine leveraging natural language queries.
*   **NLP Harvesting Process:** Automatically extracts structured arrays (Skills, Tech Stack, Projects) from submitted resumes, aggressively caching the outputs to `student_ai_profiles` to drastically reduce redundant AI API token usage tracking.
*   **Algorithmic Match Scoring (0-100%):** Evaluates organic queries dynamically against cached integers and keywords to assign percentage fits based on:
    *   **Skill Context (50% weight):** Are they a direct tech-stack match?
    *   **Project / Keyword Relevance (30% weight):** Does their portfolio echo the query context?
    *   **Academic Constraints (20% weight):** Do they satisfy baseline CGPA and backlog restrictions?

---

## 6. Database Schema Design (PostgreSQL)

The platform is strictly modeled across relation schemas and document methodologies (JSONB) to balance speed and scale.

*   **Identities & Hierarchies:** 
    *   `students`: Core metrics (CGPA, Branch, Current Year, Bio, Links).
    *   `admins`: Organizational structural maps (`employee_id`, `placement_cell_name`, `college_name`).
*   **Opportunity Maps:**
    *   `jobs`: The baseline requirements (`min_cgpa`, `allowed_branches`, `max_backlogs`).
    *   `job_applications`: The critical Join table utilizing dual `student_id` & `job_id` foreign constraints tied smoothly to an `application_form JSONB` field.
*   **Academic Portfolios:**
    *   `student_skills`, `student_projects`, `student_certificates`.
    *   `student_ai_profiles`: Cached NLP structural indices.
*   **Technical Metrics:**
    *   `coding_problems`, `coding_submissions` directly linking executed algorithms to the user identity.

---

## 7. Performance Innovations & Security Implementations

1.  **AI Token Cost Optimizations:** Transitioning directly to the `gemini-2.5-flash` model resolved artificial prompt token drop-offs during highly nested JSON generations. The multi-tier fallbacks ensuring offline capability mean the app will function at 0% down-time during high-traffic campus load checking.
2.  **Stringified PostgreSQL Array Sanitization:** Handled legacy PostgreSQL Text-array serialization crashes (e.g., failing React `.map()` executions on `"{React, Java}"`) natively by deploying targeted client-side REGEX interceptors prior to state assignment.
3.  **UI Client Bundle Formatting:** Swapping the massive legacy VSCode Monaco editor package for CodeMirror 6 slashed final JavaScript client build chunks by ~1.5 MB, dramatically improving Page Time-To-Interactive measurements on slower campus WiFi configurations.
4.  **SQL Multi-line Scaling:** Engineered secure SQL payload deployments utilizing native `CHR(10)` mappings, securely overriding Windows/OS terminal string-stripping behaviors to render highly aligned rich-text Job descriptions dynamically in the browser.

---

## 8. Future Architecture & Enhancement Roadmap
*   **Alumni Mentorship Node:** Integrating a direct Alumni tracking web component encouraging senior mentorship and referral tracking natively embedded into the Job Boards.
*   **Community Forum Completion:** Finalizing UI logic across forum message threading allowing authenticated role-based tech community support.
*   **Advanced Role Level Security (RLS):** Fully closing the database sandbox securely mapping generic PostgreSQL policies mapping `auth.uid()` explicitly back to `<table_prefix>_id` limiting read/write capacities to absolute true-owners prior to scaling.