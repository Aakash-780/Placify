export interface AtsAnalysisResult {
    overall_score: number;
    keyword_match: number;
    skills_score: number;
    experience_score: number;
    education_score: number;
    projects_score: number;
    formatting_score: number;
    action_verbs: number;
    resume_length: number;
    missing_keywords: string[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    summary: string;
}

export interface AtsServiceConfig {
    baseUrl: string;
    modelName: string;
    useAiAts: boolean;
}

export interface CacheEntry {
    result: AtsAnalysisResult;
    timestamp: number;
}
