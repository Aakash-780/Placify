# Placify

**Placement management is broken by spreadsheets. We replace it with one platform.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

## Overview

Placify is an **AI-powered, multi-tenant campus placement platform** that gives every stakeholder in campus recruitment — universities, placement cells, recruiters, and students — a single dedicated workspace instead of scattered spreadsheets, emails, and disconnected tools.

A single deployment can serve many universities at once. Each organization gets its own admins, students, recruiters, and placement drives, fully isolated from every other organization on the platform.

Recruiters search candidates in plain English. Students get their resumes scored and rewritten by AI. Placement cells run drives, verify students, and track outcomes — all from one dashboard.

---

## The Problem

Campus placement today runs on spreadsheets, forwarded emails, and a patchwork of forms. Placement cells manually cross-check eligibility, recruiters chase applicant lists over email, and students have no single place to track applications, prepare for interviews, or know how their resume stacks up.

None of these tools talk to each other. Every placement season, the same manual work gets repeated — and nothing about it scales as the number of students, recruiters, or partner organizations grows.

---

## What It Does

| Step | Action | Description |
|---|---|---|
| 01 | **Onboard** | A university signs up as an organization; the platform owner provisions its admin and isolates its data from every other tenant |
| 02 | **Manage** | Admins verify students, approve recruiters, and launch placement drives from a single dashboard |
| 03 | **Prepare** | Students build resumes, get an AI-driven ATS score, and practice DSA and coding interviews |
| 04 | **Hire** | Recruiters describe the candidate they want in plain English, shortlist, and run interviews — all inside Placify |

---

## Features

- **AI Candidate Explorer** — recruiters type a request like *"AI/ML students graduating in 2027 with React and Python, CGPA above 8.5"* and Placify turns it into a database query automatically
- **ATS Resume Analyzer** — extracts skills, scores resumes against ATS criteria, flags missing keywords, and recommends fixes
- **Monaco Code Simulator** — an in-browser coding environment for C++, Java, Python, and JavaScript with execution and progress tracking
- **DSA Preparation** — curated problem sets (LeetCode 75, Top Interview 150, company-wise lists) with notes and difficulty filters
- **Community Forum** — students share resources, ask questions, and learn from seniors' interview experiences
- **Multi-Tenant Isolation** — every table is scoped to an organization, enforced at the database level with Row Level Security

---

## Architecture

![Placify High-Level Design](docs/architecture-diagram.png)

```
---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | Role-based dashboards and UI |
| Styling | Tailwind CSS, Radix UI | Design system and components |
| Backend | InsForge, server functions | Auth, business logic, RPCs |
| Database | PostgreSQL | Multi-tenant data with Row Level Security |
| AI | Google Gemini, Claude AI, Grok AI | Resume analysis, candidate search, DSA feedback |
| Editor | Monaco Editor | In-browser coding practice |
| Documents | CloudConvert | Resume/PDF processing |
| Charts | Recharts | Analytics and dashboards |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- An InsForge project (database, auth, storage)
- API keys for Google Gemini and/or Grok

### Installation

```bash
# Clone the repository
git clone https://github.com/Aakash-780/Placify.git
cd Placify

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Open .env and add your keys

# Run the application
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production build

```bash
npm run build
npm run preview
```

---

## Configuration

Create a `.env` file in the project root:

```env
VITE_INSFORGE_BASE_URL=
VITE_INSFORGE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_GROK_API_KEY=
VITE_CLOUDCONVERT_API_KEY=
```

---

## Project Structure

```
placify/
│
├── src/
│   ├── components/     # Shared UI components
│   ├── modules/        # Feature modules (jobs, resumes, DSA, forum...)
│   ├── pages/          # Route-level pages per role
│   ├── routes/         # App routing
│   ├── services/       # API and backend integration
│   ├── layouts/        # Dashboard layouts per role
│   └── utils/          # Helpers and shared logic
│
├── database/           # Schema, migrations, RLS policies
├── docs/               # Documentation and diagrams
├── public/             # Static assets
└── package.json
```

---

## Roadmap

- [ ] AI mock interviews
- [ ] Video interview platform
- [ ] Company assessment portal
- [ ] Interview scheduling
- [ ] Email automation
- [ ] Placement prediction using ML
- [ ] Resume ranking engine
- [ ] Mobile application

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "Add your feature"

# Push to the branch
git push origin feature/your-feature-name

# Open a pull request
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Placify** — one platform for every stakeholder in campus placement.
