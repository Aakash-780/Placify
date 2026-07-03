# 🎓 Placify — AI-Powered Campus Placement Platform

> A full-stack web application designed to streamline the campus recruitment and placement process for students, recruiters, and placement administrators.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Role-Based Access Control](#role-based-access-control)
  - [Student Features](#student-features)
  - [Recruiter Features](#recruiter-features)
  - [Admin Features](#admin-features)
  - [AI Student Explorer](#ai-student-explorer)
  - [Community Forum](#community-forum)
  - [DSA Practice Sheets](#dsa-practice-sheets)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Screenshots](#screenshots)

---

## 📖 Overview

**Placify** is a campus placement management platform that connects students with recruiters and placement administrators. It features AI-powered student discovery, resume analysis, a community forum, DSA practice sheets with LeetCode integration, a code simulator, resume builder, and rich dashboards for all roles.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite (rolldown-vite 7.2.2) |
| **Routing** | React Router DOM v7 |
| **Styling** | Tailwind CSS v3 + tailwindcss-animate |
| **UI Components** | Radix UI (Accordion, Dialog, Select, Tabs, Avatar, Progress, Tooltip, etc.) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Code Editor** | Monaco Editor (VS Code engine) |
| **Backend / Database** | InsForge (BaaS — PostgreSQL-backed, REST API) |
| **Authentication** | InsForge Auth (JWT-based, role-aware) |
| **File Storage** | InsForge Storage |
| **AI Search** | Anthropic Claude 3.5 Haiku API (direct REST) |
| **Date Utilities** | date-fns |
| **State Management** | React Context API (RoleContext, AuthContext) |

---

## ✨ Features

### 🔐 Role-Based Access Control

The platform supports **three distinct user roles**, each with tailored navigation and feature access:

| Role | Access |
|---|---|
| **Student** | Dashboard, Jobs, Profile, Resume Builder, Forum, DSA Sheets, Code Simulator, Alumni Network, Off-Campus Jobs |
| **Recruiter** | Dashboard, Post Job, Applicants, **AI Student Explorer**, Jobs, Forum |
| **Admin** | Full access — all student and recruiter features + Analytics, Student Management, **AI Student Explorer** |

Registration flow:
1. Sign up with email/password
2. Select role (Student / Recruiter / Admin)
3. Fill role-specific details
4. Redirected to personalized dashboard

---

### 👨‍🎓 Student Features

#### 📊 Dashboard
- Personalized welcome with profile stats
- Application tracking (applied, shortlisted, offered)
- Upcoming drives and deadlines
- Quick action cards

#### 💼 Job Portal
- Browse all active job listings
- Filter by role, CTC, location, company
- View full job details (description, eligibility, perks)
- One-click application with resume

#### 👤 Profile Management
- Edit personal info: name, branch, CGPA, graduation year, phone, bio
- Upload profile photo and resume (PDF)
- Add social links: LinkedIn, GitHub, Portfolio
- Manage skills and placement status

#### 📄 Resume Builder
- Interactive multi-section resume builder
- Sections: Personal Info, Education, Experience, Projects, Skills, Certifications
- Live preview panel
- Export to PDF

#### 🖥️ Code Simulator
- In-browser code editor powered by Monaco (VS Code engine)
- Support for multiple programming languages
- Run code and see output instantly

#### 🎓 Alumni Network
- Browse alumni profiles
- Connect with seniors in the industry

#### 🌐 Off-Campus Jobs
- Curated off-campus job listings
- External links to apply

---

### 🏢 Recruiter Features

- **Post Jobs** — Create detailed job listings with eligibility criteria, CTC, location, description
- **Applicant Management** — View, shortlist, and manage all applicants for posted jobs
- **AI Student Explorer** — Search and discover students using natural language queries *(see below)*

---

### 🛡️ Admin Features

- **Student Management** — View all registered students with profile details
- **Analytics Dashboard** — Placement statistics, charts (placed vs unplaced, branch-wise, year-wise)
- **All Recruiter Features** — Post jobs, view applicants
- **AI Student Explorer** — Full access

---

### 🤖 AI Student Explorer

> Available for **Admin** and **Recruiter** roles only.

The flagship AI feature that allows recruiters and admins to **discover students using plain English queries**.

#### Natural Language Search
Type queries like:
- `"Find students with CGPA above 8.5 who know React and Node.js"`
- `"CSE students graduating in 2026 who are not placed"`
- `"Python and machine learning enthusiasts"`
- `"Students skilled in Flutter and Kotlin"`

**How it works:**
1. Query sent to **Claude 3.5 Haiku** via Anthropic API
2. Claude converts query into structured filters (`cgpa_min`, `branch`, `skills[]`, `graduation_year`, `placement_status`)
3. Filters applied client-side against the student database
4. Results shown as cards with **matched keywords highlighted in yellow**

**Smart local fallback:** If Claude API is unavailable, a built-in NLP regex parser handles CGPA comparisons, branch detection, 50+ tech skill keywords, and placement status — with zero API dependency.

**Handles gracefully:** Queries about fields not in the DB (10th marks, JEE rank, attendance) return a helpful explanation instead of an error.

#### AI Resume Analysis (Per-Student)
- Click **"AI Analyze"** on any student card that has a resume uploaded
- Claude reads the resume URL and extracts:
  - Skills & technologies
  - Projects
  - Keywords
  - Professional summary (2–3 sentences)
  - AI tags (`#machinelearning`, `#python`, etc.)
  - Experience level (Fresher / Experienced)
- Data saved to `student_ai_profiles` table
- Previously analyzed students show **violet AI Summary** on their card

#### Manual Filters (Sidebar)
- CGPA range (min / max)
- Branch
- Placement Status (Placed / Not Placed)
- Graduation Year
- Skill/Tech Stack text search

#### Student Cards
Each card shows:
- Name, Branch, Graduation Year, Placement Status badge
- **CGPA** prominently displayed
- Skills / Tech stack badges (AI-extracted + manual)
- AI Summary (if analyzed)
- AI hashtags
- Action buttons: 📧 Email, LinkedIn, GitHub, 📄 View Resume, 🤖 AI Analyze

#### Pagination
9 students per page with navigation controls.

---

### 💬 Community Forum

- **Post threads** with title, category, and content
- **Upvoting** — one upvote per user per thread (toggle on/off)
- **Thread deletion** — owners can delete their own threads (with confirmation)
- **Upload date display** — formatted relative timestamps (e.g., "2 days ago")
- **Thread detail view** — full content with comments
- Category filtering

---

### 📚 DSA Practice Sheets

Two curated LeetCode problem sets with direct links to original questions:

#### LeetCode 75
75 essential problems covering all major patterns:
Arrays, Two Pointers, Sliding Window, Stack, Queue, Linked List, Binary Tree, Graphs, DP, Bit Manipulation, and more.

#### Top Interview 150
150 most frequently asked interview questions from top tech companies — all linked directly to LeetCode.

Features:
- Mark problems as solved
- Difficulty badges (Easy / Medium / Hard)
- Direct `↗ Open in LeetCode` links
- Company tags

---

## 🗄️ Database Schema

Key tables (managed via InsForge / PostgreSQL):

| Table | Description |
|---|---|
| `students` | Student profile: name, branch, cgpa, graduation_year, placement_status, resume_url, skills[], etc. |
| `recruiters` | Recruiter profile: company, designation, contact |
| `admins` | Admin profile |
| `jobs` | Job listings: title, company, CTC, location, description, eligibility |
| `applications` | Student job applications with status |
| `forum_threads` | Community forum posts with upvotes, category, author |
| `dsa_questions` | DSA problems with difficulty, topic, leetcode_url |
| `dsa_companies` | Company tags for DSA problems |
| `student_ai_profiles` | AI-extracted resume data: extracted_skills[], extracted_technologies[], extracted_keywords[], resume_summary, ai_tags[], experience_level |

---

## 📁 Project Structure

```
placify/
├── docs/                     # Project documentation & reference sheets
│   ├── project_context.md
│   ├── project_report.md
│   └── learning_insforge_instructions.md
├── database/                 # Database schema migrations & SQL scripts
├── public/                   # Static public assets
├── src/
│   ├── assets/               # Local images and svg icons
│   ├── components/           # Reusable UI component modules
│   │   ├── auth/             # OTP, verification, onboarding
│   │   ├── layout/           # Shared headers, footers
│   │   └── ui/               # Primitive shadcn-style UI components
│   ├── constants/            # Shared static configurations and branches/years data
│   │   ├── branches.ts
│   │   └── years.ts
│   ├── context/              # Global React Contexts (Role, Theme)
│   │   ├── RoleContext.tsx
│   │   └── ThemeContext.tsx
│   ├── layouts/              # Multi-layout shells (Recruiter, Student, Admin)
│   ├── lib/                  # Third-party wrapper integrations (API Mock, InsForge client, Gemini)
│   ├── modules/              # Feature modules grouped by user role
│   ├── pages/                # High-level route pages (AuthPage, Landing, static pages)
│   ├── routes/               # Routing declarations (AppRoutes, ProtectedRoute)
│   ├── styles/               # CSS and styles (index.css)
│   ├── utils/                # Functional utility helpers
│   ├── App.tsx               # Main application container
│   └── main.tsx              # Application entrypoint
├── .env.example              # Template for environment variables
├── .editorconfig             # Editor configuration preferences
├── .prettierrc               # Formatting settings
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory. A template is provided in [.env.example](file:///Users/aakashsrivastava/Desktop/New%20Career%20Bridge/.env.example):

```env
# InsForge Backend
VITE_INSFORGE_BASE_URL=https://your-project.insforge.app
VITE_INSFORGE_ANON_KEY=your_insforge_anon_key

# Google Gemini API key (for AI Student Explorer / ATS Resume Analyzer)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Grok (xAI) API key for AI fallback
VITE_GROK_API_KEY=your_grok_api_key_here

# CloudConvert API keys for Resume PDF/Word conversions
VITE_CONVERT_API_SECRET=your_convert_api_secret_here
VITE_CLOUDCONVERT_API_KEY=your_cloudconvert_api_key_here
```

> ⚠️ **Security Note:** `VITE_` prefixed variables are embedded in the browser bundle. For production, move AI API calls to a backend/edge function.

---

## 🛠️ Scripts

The following npm scripts are defined in the project:

- `npm run dev`: Starts the Vite development server locally.
- `npm run build`: Compiles the TypeScript code and bundles the production app.
- `npm run preview`: Previews the built production bundle locally.
- `npm run lint`: Runs ESLint to check for code quality and syntax issues.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/career-bridge.git
cd career-bridge

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your InsForge, Gemini, and CloudConvert keys

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

The frontend of this application can be compiled to a static SPA. It is configured for deployment to static hosting platforms such as Vercel (using the included `vercel.json` config) or Netlify, with client-side routing fallback configuration.

---

## 👥 User Roles & Test Accounts

After setting up:
1. Register at `/register`
2. Select your role on the Role Selection screen
3. Fill profile details
4. You'll be redirected to your role-specific dashboard

---

## 📊 Key Highlights for Project Report

| Metric | Detail |
|---|---|
| **Total Pages** | 20+ pages/routes |
| **User Roles** | 3 (Student, Recruiter, Admin) |
| **AI Integration** | Claude 3.5 Haiku for NL search + resume analysis |
| **DSA Problems** | 225 problems (75 + 150) with LeetCode links |
| **Database Tables** | 9+ tables |
| **Components** | 30+ reusable UI components |
| **Tech Libraries** | 20+ npm packages |

---

## 🔮 Future Enhancements

- Email notifications for application status updates
- Interview scheduling calendar
- Video interview integration
- AI-powered resume scoring
- Mock interview chatbot
- Mobile app (React Native)

---

## 📄 License

This project is licensed under the [MIT License](file:///Users/aakashsrivastava/Desktop/New%20Career%20Bridge/LICENSE).

---

*Built with ❤️ using React, TypeScript, InsForge, and Claude AI*

# Placify
