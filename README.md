# 🎓 Placify — AI-Powered Campus Placement Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%7C%20Claude-purple?style=for-the-badge" />
</p>

<p align="center">
An AI-powered multi-organization campus placement platform that connects students, recruiters, placement cells, and universities through one unified ecosystem.
</p>

---

# 📖 About Placify

Placify is a modern Placement Management Platform built to simplify the entire campus recruitment process.

Instead of using spreadsheets, emails, and multiple disconnected systems, Placify provides one centralized platform where every stakeholder has a dedicated dashboard and workflow.

Whether it's a university managing thousands of students or a recruiter hiring top talent, Placify automates the complete placement lifecycle.

---

# 🌍 Who Uses Placify?

Placify supports multiple organizations under a single platform.

```

Platform Owner (Placify)
│
├── Organization A
│ ├── Admin
│ ├── Sub Admins
│ ├── Students
│ └── Recruiters
│
├── Organization B
│ ├── Admin
│ ├── Students
│ └── Recruiters
│
└── Organization C
├── Admin
├── Students
└── Recruiters

```

Each organization has its own independent users, placement drives, recruiters, and analytics.

---

# 👥 User Roles

## 👑 Platform Owner

The Platform Owner manages the complete Placify ecosystem.

### Responsibilities

- Create Organizations
- Generate Organization Admin Accounts
- Manage Subscriptions
- Monitor Platform Analytics
- View All Organizations
- Manage Platform Settings
- Track Students & Recruiters

---

## 🏫 Organization Admin

Every organization receives its own Admin Dashboard.

### Responsibilities

- Verify Students
- Approve Recruiters
- Manage Sub Admins
- Create Placement Drives
- View Placement Statistics
- Manage Departments
- View Applications
- Track Company Visits

---

## 🧑‍💼 Sub Admin

Sub Admins assist Organization Admins.

### Responsibilities

- Student Verification
- Recruiter Verification
- Placement Drive Support
- Profile Approval
- Data Management

---

## 🎓 Student

Students receive a personalized dashboard.

### Features

- Resume Builder
- ATS Resume Score
- AI Resume Analysis
- Apply for Jobs
- Track Applications
- Coding Platform
- DSA Practice
- Community Forum
- Placement Analytics
- Skill Tracking

---

## 🏢 Recruiter

Recruiters can efficiently hire candidates.

### Features

- Company Dashboard
- Post Jobs
- Manage Applicants
- AI Candidate Search
- ATS Resume Analysis
- Shortlist Candidates
- Interview Management
- Hiring Analytics

---

# ✨ Core Features

## 🔐 Multi-Tenant Architecture

Supports multiple universities and organizations from one platform.

---

## 🤖 AI Candidate Explorer

Recruiters can search candidates using natural language.

Example

```

Find AI/ML students graduating in 2027
with React and Python
CGPA above 8.5

```

Placify converts this into intelligent database queries automatically.

---

## 📄 ATS Resume Analyzer

Automatically

- Extract Skills
- Calculate ATS Score
- Generate Resume Summary
- Detect Missing Keywords
- Recommend Improvements

---

## 💻 Monaco Code Simulator

Built-in coding environment with

- C++
- Java
- Python
- JavaScript

Features

- Run Code
- Syntax Highlighting
- Interview Questions
- Progress Tracking

---

## 📚 DSA Preparation

Includes

- LeetCode 75
- Top Interview 150
- Company-wise Questions
- Progress Tracking
- Notes
- Difficulty Filters

---

## 💬 Community Forum

Students can

- Ask Questions
- Share Resources
- Discuss Interview Experiences
- Connect with Seniors

---

# 📊 Dashboards

## Platform Owner Dashboard

- Organizations
- Students
- Recruiters
- Active Drives
- Platform Analytics

---

## Organization Dashboard

- Placement Statistics
- Company Visits
- Branch-wise Placements
- Student Verification

---

## Student Dashboard

- Applications
- Resume Score
- Coding Progress
- Skills
- Placement Status

---

## Recruiter Dashboard

- Posted Jobs
- Applicants
- Shortlisted Candidates
- Hiring Pipeline

---

# 🛠 Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI

### Backend

- InsForge
- PostgreSQL
- Authentication
- Storage

### AI

- Google Gemini
- Claude AI
- Grok AI

### Libraries

- Monaco Editor
- Recharts
- Lucide React

---

# 🏗 Architecture

```

Platform Owner
│
├── Organization
│
├── Admin
│
├── Sub Admin
│
├── Students
│
├── Recruiters
│
└── AI Engine
├── Resume Parser
├── ATS Analyzer
└── Candidate Search

```

---

# 📂 Project Structure

```

placify/
│
├── src/
│ ├── components/
│ ├── modules/
│ ├── pages/
│ ├── routes/
│ ├── services/
│ ├── layouts/
│ └── utils/
│
├── database/
├── docs/
├── public/
└── package.json

```

---

# 🚀 Installation

```bash
git clone https://github.com/Aakash-780/Placify.git

cd Placify

npm install

npm run dev
```

Production

```bash
npm run build
npm run preview
```

---

# 🔑 Environment Variables

```env
VITE_INSFORGE_BASE_URL=

VITE_INSFORGE_ANON_KEY=

VITE_GEMINI_API_KEY=

VITE_GROK_API_KEY=

VITE_CLOUDCONVERT_API_KEY=
```

---

# 📈 Future Scope

- AI Mock Interviews
- Video Interview Platform
- Company Assessment Portal
- Interview Scheduling
- Email Automation
- Placement Prediction using ML
- Resume Ranking Engine
- Mobile Application

---

# 📄 License

Licensed under the MIT License.

---

<p align="center">
Made with ❤️ using React, TypeScript, PostgreSQL, Tailwind CSS, Gemini AI & Claude AI
</p>
