import { insforge } from './insforge';
import mammoth from 'mammoth';

export async function extractAndStoreResumeMetadata(studentId: string, resumeUrl: string) {
    let extractedText = '';
    try {
        if (resumeUrl.toLowerCase().endsWith('.pdf')) {
            // PDF text extraction via server-side or simple conversion if possible.
            // Since we removed CloudConvert keys, we do a basic fetch and slice or try metadata conversion.
            // In a browser client, reading raw PDF directly is limited without third-party libraries,
            // so we fallback to reading as text or a placeholder.
            try {
                const pdfRes = await fetch(resumeUrl);
                if (!pdfRes.ok) throw new Error('Could not fetch resume file');
                extractedText = await pdfRes.text();
            } catch {
                extractedText = 'PDF Content: [Extraction bypassed or raw stream unsupported offline]';
            }
        } else if (resumeUrl.toLowerCase().endsWith('.docx')) {
            const docxRes = await fetch(resumeUrl);
            if (!docxRes.ok) throw new Error('Could not fetch docx file');
            const arrayBuffer = await docxRes.arrayBuffer();
            const mammothResult = await mammoth.extractRawText({ arrayBuffer });
            extractedText = mammothResult.value;
        } else {
            const textRes = await fetch(resumeUrl);
            extractedText = await textRes.text();
        }
    } catch (err: any) {
        console.error("Text Extraction Error:", err);
        extractedText = 'Error reading resume text.';
    }

    extractedText = extractedText.slice(0, 10000);

    const analyzePrompt = `You are analyzing a student resume. Extract all relevant information and return ONLY this exact JSON format (no markdown, no backticks, just the bare JSON).
{
  "extracted_skills": ["skill1","skill2"],
  "extracted_technologies": ["tech1","tech2"],
  "extracted_keywords": ["kw1","kw2"],
  "resume_summary": "2-3 sentence professional summary",
  "ai_tags": ["tag1","tag2"],
  "experience_level": "fresher" or "experienced",
  "tenth_percentage": 90.5,
  "twelfth_percentage": 88.0,
  "certificates_names": ["AWS Certified", "React Basics"],
  "internships_count": 2,
  "experience_months": 12
}

Note: If a percentage is missing entirely, use null. If internships count or experience cannot be found, use 0. If certificates are missing, use an empty array [].

Here is the raw text from the resume:
${extractedText}`;

    // Simple local regex-based heuristic extractor as fallback (used in production or when local AI is offline)
    const localHeuristicExtract = (text: string) => {
        const textLower = text.toLowerCase();
        
        const popularSkills = ['javascript', 'typescript', 'python', 'java', 'c++', 'react', 'node', 'express', 'sql', 'mongodb', 'aws', 'docker', 'git', 'html', 'css', 'excel'];
        const extractedSkills = popularSkills.filter(skill => textLower.includes(skill));
        
        const internshipMatches = textLower.match(/intern(?:ship)?/g) || [];
        const internshipsCount = Math.min(internshipMatches.length, 5);
        
        let experienceMonths = 0;
        const expMatch = textLower.match(/(\d+)\+?\s*years?\s+of\s+experience/i) || textLower.match(/experience\s*:\s*(\d+)\+?\s*years?/i);
        if (expMatch) {
            experienceMonths = parseInt(expMatch[1]) * 12;
        } else if (internshipsCount > 0) {
            experienceMonths = internshipsCount * 3;
        }
        
        const extractPercentage = (terms: string[]): number | null => {
            for (const term of terms) {
                const regex = new RegExp(`${term}\\b[^\\d]*(\\d{2}(?:\\.\\d{1,2})?)`, 'i');
                const match = text.match(regex);
                if (match) {
                    const val = parseFloat(match[1]);
                    if (val >= 35 && val <= 100) return val;
                }
            }
            return null;
        };
        
        const tenth = extractPercentage(['10th', 'tenth', 'class 10', 'ssc']);
        const twelfth = extractPercentage(['12th', 'twelfth', 'class 12', 'hsc', 'intermediate']);
        
        const summary = extractedSkills.length > 0 
            ? `Student specializing in software development with skills in ${extractedSkills.slice(0, 3).join(', ')}.`
            : "Dedicated student looking for opportunities in technical and engineering roles.";
            
        return {
            extracted_skills: extractedSkills,
            extracted_technologies: extractedSkills,
            extracted_keywords: extractedSkills,
            resume_summary: summary,
            ai_tags: extractedSkills.slice(0, 3),
            experience_level: experienceMonths > 6 ? "experienced" : "fresher",
            tenth_percentage: tenth,
            twelfth_percentage: twelfth,
            certificates_names: [] as string[],
            internships_count: internshipsCount,
            experience_months: experienceMonths
        };
    };

    try {
        let parsed = null;
        const isDev = !!import.meta.env.DEV;
        const useLocalAi = isDev && (import.meta.env.VITE_USE_AI_ATS !== 'false');

        if (useLocalAi) {
            try {
                const baseUrl = (import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
                const modelName = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const statusRes = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal }).catch(() => null);
                clearTimeout(timeoutId);

                if (statusRes && statusRes.ok) {
                    const response = await fetch(`${baseUrl}/api/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: modelName,
                            prompt: analyzePrompt,
                            format: 'json',
                            options: {
                                temperature: 0.1
                            },
                            stream: false
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const raw = (data.response || '').trim();
                        parsed = JSON.parse(raw);
                    }
                }
            } catch (ollamaErr) {
                console.warn("Ollama extraction failed, falling back to heuristics:", ollamaErr);
            }
        }

        if (!parsed) {
            parsed = localHeuristicExtract(extractedText);
        }

        parsed.resume_summary = parsed.resume_summary + "\n\n[FULL_RESUME_TEXT_FOR_SEARCH_ENGINE]: " + extractedText.substring(0, 6000);

        const { data: updatedProfile, error } = await insforge.database.from('student_ai_profiles').upsert({
            student_id: studentId,
            ...parsed,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id' }).select();

        if (error) {
            console.error("Supabase UPSERT Error:", error);
            throw new Error("Supabase UI UPSERT Error: " + error.message);
        }

        return updatedProfile?.[0] || null;
    } catch (err: any) {
        console.error('Resume analysis error:', err);
        throw new Error("Local Extractor or Data Save Error: " + err.message);
    }
}
