import { AtsAnalysisResult } from './types';

/**
 * Strips markdown code blocks, extracts the JSON object, parses it, and validates/normalizes it.
 */
export function parseAtsResult(rawText: string): AtsAnalysisResult {
    let cleanText = rawText.trim();
    
    // Strip markdown code block markers if present
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
    }
    
    try {
        const parsed = JSON.parse(cleanText);
        return validateAndNormalize(parsed);
    } catch (e) {
        // Fallback: try finding the first '{' and last '}'
        const startIdx = cleanText.indexOf('{');
        const endIdx = cleanText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            try {
                const substring = cleanText.substring(startIdx, endIdx + 1);
                const parsed = JSON.parse(substring);
                return validateAndNormalize(parsed);
            } catch (subErr) {
                throw new Error("Failed to parse AI output as JSON: " + (e as Error).message);
            }
        }
        throw new Error("Failed to extract JSON object from AI output: " + (e as Error).message);
    }
}

/**
 * Ensures all fields exist and are of the correct type, applying default fallbacks if missing.
 */
function validateAndNormalize(obj: any): AtsAnalysisResult {
    return {
        overall_score: clampScore(obj.overall_score ?? obj.overallScore),
        keyword_match: clampScore(obj.keyword_match ?? obj.keywordMatch),
        skills_score: clampScore(obj.skills_score ?? obj.skillsScore),
        experience_score: clampScore(obj.experience_score ?? obj.experienceScore ?? obj.experience),
        education_score: clampScore(obj.education_score ?? obj.educationScore ?? obj.education),
        projects_score: clampScore(obj.projects_score ?? obj.projectsScore ?? obj.projects),
        formatting_score: clampScore(obj.formatting_score ?? obj.formattingScore ?? obj.formatting),
        action_verbs: clampScore(obj.action_verbs ?? obj.actionVerbs ?? 50),
        resume_length: clampScore(obj.resume_length ?? obj.resumeLength ?? 50),
        missing_keywords: Array.isArray(obj.missing_keywords) 
            ? obj.missing_keywords.map(String) 
            : Array.isArray(obj.missingKeywords) 
                ? obj.missingKeywords.map(String) 
                : [],
        strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
        weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses.map(String) : [],
        suggestions: Array.isArray(obj.suggestions) 
            ? obj.suggestions.map(String) 
            : Array.isArray(obj.recommendations) 
                ? obj.recommendations.map(String) 
                : [],
        summary: typeof obj.summary === 'string' 
            ? obj.summary 
            : typeof obj.feedback === 'string' 
                ? obj.feedback 
                : 'Local AI analysis complete.'
    };
}

function clampScore(val: any): number {
    const num = Number(val);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
}
