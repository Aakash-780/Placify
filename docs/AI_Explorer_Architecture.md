# AI Student Explorer: Architecture & Workflow

The **AI Student Explorer** is an intelligent candidate discovery tool built to function similarly to LinkedIn Recruiter. By combining natural language processing, deep indexing of physical resumes, and a weighted scoring algorithm, it allows Admins and Recruiters to find the perfect candidates for specific roles.

Below is a detailed breakdown of how the system works under the hood from data extraction to UI rendering.

---

## 1. Natural Language Query Parsing (Gemini AI)
When a user types a search query like *"Find CSE students with CGPA > 8.5 who know React and Python"*, the system does not simply do a text search.

1. **Prompt Engineering:** The raw string is injected into a strict system prompt and securely sent to the **Google Gemini API** (`gemini-2.5-flash`).
2. **JSON Filter Generation:** Gemini interprets the context and converts the human sentence into a structured JSON filter object (type `AIFilters`):
   ```json
   {
     "filters": {
       "cgpa_min": 8.5,
       "branch": "CSE",
       "skills": ["React", "Python"]
     },
     "matched_keywords": ["React", "Python"],
     "explanation": "Search applied via Gemini AI."
   }
   ```
3. **Local NLP Fallback:** If the Gemini API fails, rate-limits, or the API key is missing, the system instantly switches to an internal Regular Expression (Regex) parser that manually maps keywords, skills, and bounds to generate the exact same JSON format locally!

---

## 2. In-Depth Resume Text Extraction
To ensure that search hits are highly accurate, we don't just rely on what students type into their basic UI profiles. We deep-read their actual uploaded resumes.

When a recruiter clicks **"AI Analyze"**, the application runs a multi-step data pipeline:
1. **Document Conversion:** 
   - If it's a **.pdf**, the physical file is securely sent to **ConvertAPI**, which scrapes the PDF and returns the entire document as a raw text string.
   - If it's a **.docx**, the browser uses the **Mammoth.js** library to extract the text offline.
2. **AI Extractor Processing:** This massive text payload is sent to Gemini, asking it to interpret the document and extract structured metadata: `extracted_skills`, `extracted_technologies`, `extracted_keywords`, and a `resume_summary`.
3. **Deep Deep Indexing (The Secret Sauce):** Because we want recruiters to be able to search for *any* obscure library that a student might have had in their resume, we inject the ENTIRE plain-text extraction data into the `resume_summary` field being saved to the `student_ai_profiles` database table. This effectively makes the student's physical document entirely "searchable" by the frontend.

---

## 3. Data Aggregation
When the Student Explorer page loads, it performs a highly efficient concurrent database fetch (`Promise.all`) via the **InsForge** backend.

It grabs data from four separate tables:
- `students` (Core profile, CGPA, Branch)
- `student_skills` (User inputted skills array)
- `student_projects` (Project titles and descriptions)
- `student_ai_profiles` (The deep-indexed AI resume data mentioned above)

The application maps all of these relational tables together locally so every student object contains their complete history.

---

## 4. The Weighted Match Scoring Algorithm
Once the data is aggregated and the AI has parsed the recruiter's search filters, the system evaluates every single student and calculates a mathematical **Match Percentage (0-100%)**.

The algorithm creates a massive `studentAllText` string containing all their bio, skills, project descriptions, and deep-indexed resume data.

### The Scoring Matrix:
- **CGPA Match (20% Weight):** 
  - Checks if the student's CGPA strictly satisfies the query bounds (`cgpa_min` / `cgpa_max`).
  - **Strict Rule:** If their CGPA is lower than required, the student automatically fails the test and is hidden entirely.
- **Skill Match (50% Weight):**
  - Scans `studentAllText` to see if the required technical skills exist.
  - Granular division: If 2 skills are required and they have 1, they receive 25/50 points.
- **Project/Keyword Match (30% Weight):**
  - Scans `studentAllText` for generic buzzwords or capabilities requested by the recruiter.

### The Display Logic
Once the percentage is calculated, the system sorts the students from Highest Match to Lowest Match. It also dynamically attaches an array of `matchedResumeWords` to the student object. 

On the UI, the student's card will render:
1. A uniquely colored **Match Badge** (Green for >=80%, Yellow for >=50%, Red for <50%).
2. A beautiful yellow **"Matches in Profile/Resume:"** highlight box displaying exactly which keywords from the original query matched text physically written deep within their profile or resume.