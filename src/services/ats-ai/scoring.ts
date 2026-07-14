import { AtsAnalysisResult, AtsServiceConfig } from './types';
import { generateAtsAnalysis } from './ollama';

const CACHE_PREFIX = 'placify_ats_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // Cache for 7 days

/**
 * Computes a SHA-256 hash of combined resume and job description to uniquely identify inputs.
 */
export async function computeAtsHash(resumeText: string, jobDescription: string): Promise<string> {
    const combined = `${resumeText.trim()}||${jobDescription.trim()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    
    // Perform standard browser WebCrypto digest
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retreives cached analysis results if available and not expired.
 */
export async function getCachedAnalysis(resumeText: string, jobDescription: string): Promise<AtsAnalysisResult | null> {
    try {
        const hash = await computeAtsHash(resumeText, jobDescription);
        const cached = localStorage.getItem(`${CACHE_PREFIX}${hash}`);
        if (!cached) return null;

        const entry = JSON.parse(cached);
        if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(`${CACHE_PREFIX}${hash}`); // Expired
            return null;
        }

        return entry.result;
    } catch (e) {
        console.warn('[ATS Cache] Failed to load cache:', e);
        return null;
    }
}

/**
 * Persists analysis results in localStorage.
 */
export async function setCachedAnalysis(resumeText: string, jobDescription: string, result: AtsAnalysisResult): Promise<void> {
    try {
        const hash = await computeAtsHash(resumeText, jobDescription);
        const entry = {
            result,
            timestamp: Date.now()
        };
        localStorage.setItem(`${CACHE_PREFIX}${hash}`, JSON.stringify(entry));
    } catch (e) {
        console.warn('[ATS Cache] Failed to save cache:', e);
    }
}

/**
 * Runs the ATS analyzer. Checks cache first, otherwise delegates to Llama 3.2.
 */
export async function runAtsAnalysis(
    resumeText: string,
    jobDescription: string,
    config: AtsServiceConfig,
    onChunk?: (text: string) => void
): Promise<AtsAnalysisResult> {
    // 1. Check cache
    const cached = await getCachedAnalysis(resumeText, jobDescription);
    if (cached) {
        if (onChunk) {
            onChunk("Retrieved from local cache...\n");
        }
        return cached;
    }

    // 2. Perform Ollama generation
    const result = await generateAtsAnalysis(resumeText, jobDescription, config, onChunk);

    // 3. Cache the successful result
    await setCachedAnalysis(resumeText, jobDescription, result);

    return result;
}
