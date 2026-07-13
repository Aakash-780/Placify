import { insforge } from './insforge';
import mammoth from 'mammoth';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CONVERT_API_SECRET = import.meta.env.VITE_CONVERT_API_SECRET;

export async function extractAndStoreResumeMetadata(studentId: string, resumeUrl: string) {
    if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
        console.warn('VITE_GEMINI_API_KEY is missing. Skipping AI resume extraction.');
        throw new Error('VITE_GEMINI_API_KEY is missing in your .env file.');
    }

    let extractedText = '';
    try {
        if (resumeUrl.toLowerCase().endsWith('.pdf') && CONVERT_API_SECRET) {
            const pdfRes = await fetch(resumeUrl);
            if (!pdfRes.ok) throw new Error('Could not fetch resume file');
            const blob = await pdfRes.blob();
            const formData = new FormData();
            formData.append('File', blob, 'resume.pdf');
            const convertRes = await fetch(`https://v2.convertapi.com/convert/pdf/to/txt?Secret=${CONVERT_API_SECRET}`, {
                method: 'POST',
                body: formData
            });
            const convertData = await convertRes.json();
            if (convertData.Files && convertData.Files[0]) {
                extractedText = decodeURIComponent(escape(atob(convertData.Files[0].FileData)));
            } else {
                throw new Error("ConvertAPI extraction from PDF failed.");
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
        throw new Error("Text Extraction Error: " + err.message);
    }

    extractedText = extractedText.slice(0, 10000);

    const analyzePrompt = `You are analyzing a student resume. Extract all relevant information and return ONLY this exact JSON format (no markdown, no backticks, just the bare JSON).
{
  "extracted_skills": ["skill1","skill2"],
  "extracted_technologies": ["tech1","tech2"],
  "extracted_keywords": ["kw1","kw2"],
  "resume_summary": "2-3 sentence professional summary",
  "ai_tags": ["tag1","tag2"],
  "experience_level": "fresher",
  "tenth_percentage": 90.5,
  "twelfth_percentage": 88.0,
  "certificates_names": ["AWS Certified", "React Basics"],
  "internships_count": 2,
  "experience_months": 12
}

Note: If a percentage is missing entirely, use null. If internships count or experience cannot be found, use 0. If certificates are missing, use an empty array [].

Here is the raw text from the resume:
${extractedText}`;

    try {
        let res = null;
        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
            res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: analyzePrompt }] }],
                        generationConfig: { temperature: 0, maxOutputTokens: 800 },
                    }),
                }
            );

            // Break if successful or if it's a client error other than 429
            if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
                break;
            }

            // If we hit rate limits (429) or server errors (500/503)
            retries++;
            if (retries > maxRetries) break;

            console.warn(`Gemini returned ${res.status}. Retrying in 10 seconds (Attempt ${retries}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        if (!res || !res.ok) throw new Error(`Gemini API error ${res?.status || 'Unknown'}`);
        const data = await res.json();

        let raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        raw = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) raw = m[0];
        const parsed = JSON.parse(raw);

        parsed.resume_summary = parsed.resume_summary + "\\n\\n[FULL_RESUME_TEXT_FOR_SEARCH_ENGINE]: " + extractedText.substring(0, 6000);

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
        throw new Error("Gemini AI or Data Save Error: " + err.message);
    }
}
