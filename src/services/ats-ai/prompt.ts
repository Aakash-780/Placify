/**
 * Generates the prompt for Llama 3.2 to perform structured ATS analysis.
 */
export function buildAtsPrompt(resumeText: string, jobDescription: string): string {
    return `You are a Senior Technical Recruiter, an advanced ATS (Applicant Tracking System) parser, and an expert resume reviewer.
Your task is to analyze the candidate's Resume against the Job Description and return a highly detailed, professional, and realistic ATS compatibility report.

Analyze the resume and job description on the following aspects:
1. Resume relevance to the role
2. Job description matching
3. Missing keywords (vital skills/tools in JD not found in resume)
4. Technical skills match
5. Soft skills match
6. Experience quality (STAR method, scope, impact, seniority)
7. Education relevance to the target role
8. Projects relevance and detail
9. Certifications mentioned vs required
10. Formatting quality (structure, sections layout)
11. Action verbs usage (developed, optimized, orchestrated, etc.)
12. Resume readability and density
13. Resume strengths (actionable, clear accomplishments)
14. Resume weaknesses (areas lacking metrics or details)
15. Concrete, actionable improvement suggestions

CRITICAL METRIC RULES:
- Generate realistic scores between 0 and 100 for each category.
- Do NOT simply average the breakdown scores to calculate overall_score.
- The overall_score must be an intelligent weighted evaluation based on the role requirements:
  * Keyword Match & Skills: 35% weight
  * Experience Quality: 35% weight
  * Projects: 15% weight
  * Formatting & Action Verbs: 15% weight
- If the resume does not match the JD at all or is blank, the scores should be very low (e.g., < 30).
- If there is no Job Description provided, score the resume generally against standard software engineering/industry expectations.

INPUTS:
==================================================
RESUME:
${resumeText}
==================================================
JOB DESCRIPTION:
${jobDescription || "No job description provided. Evaluate the resume generally for software engineering / general industry standards."}
==================================================

You MUST return a JSON object. Do not output any markdown formatting like \`\`\`json or explanatory text outside the JSON.
The JSON structure must match the following TypeScript schema exactly:
{
  "overall_score": number, // 0-100
  "keyword_match": number, // 0-100
  "skills_score": number, // 0-100
  "experience_score": number, // 0-100
  "education_score": number, // 0-100
  "projects_score": number, // 0-100
  "formatting_score": number, // 0-100
  "action_verbs": number, // 0-100
  "resume_length": number, // 0-100
  "missing_keywords": string[], // List of missing technical keywords or tools from the Job Description
  "strengths": string[], // 3-4 professional strengths observed
  "weaknesses": string[], // 3-4 specific weaknesses observed
  "suggestions": string[], // 3-4 highly actionable suggestions (e.g. "Add React Hooks", "Quantify project impact")
  "summary": string // A professional, concise paragraph summarizing findings and next steps.
}
`;
}
