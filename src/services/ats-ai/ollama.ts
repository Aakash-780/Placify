import { AtsServiceConfig, AtsAnalysisResult } from './types';
import { buildAtsPrompt } from './prompt';
import { parseAtsResult } from './parser';

/**
 * Loads service configuration from environment variables with safe defaults.
 */
export function getOllamaConfig(): AtsServiceConfig {
    const isDev = !!import.meta.env.DEV;
    // Read from Vite compiled env or default to standard settings
    const baseUrl = (import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
    const modelName = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
    
    // Automatically disable AI ATS if we are not in local development mode
    const useAiAts = isDev && (import.meta.env.VITE_USE_AI_ATS !== 'false');

    return {
        baseUrl,
        modelName,
        useAiAts
    };
}

/**
 * Checks if the local Ollama server is running and whether the required model is installed.
 */
export async function checkOllamaStatus(config: AtsServiceConfig): Promise<{
    running: boolean;
    hasModel: boolean;
    error?: string;
}> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

        const res = await fetch(`${config.baseUrl}/api/tags`, {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return {
                running: false,
                hasModel: false,
                error: `HTTP Error: ${res.status}`
            };
        }

        const data = await res.json();
        const models = data.models || [];
        const targetModel = config.modelName.toLowerCase();

        // Match exact, prefix, or suffix of model name (e.g. "llama3.2" matches "llama3.2:latest")
        const hasModel = models.some((m: any) => {
            const mName = m.name.toLowerCase();
            return mName === targetModel ||
                   mName.startsWith(`${targetModel}:`) ||
                   mName === `${targetModel}:latest` ||
                   targetModel.startsWith(mName);
        });

        return {
            running: true,
            hasModel,
            error: undefined
        };
    } catch (err: any) {
        let msg = err.message || String(err);
        if (err.name === 'AbortError') {
            msg = 'Connection timed out';
        }
        return {
            running: false,
            hasModel: false,
            error: msg
        };
    }
}

/**
 * Calls the local Ollama instance to generate an ATS compatibility analysis.
 * Supports streaming updates via the `onChunk` callback.
 */
export async function generateAtsAnalysis(
    resumeText: string,
    jobDescription: string,
    config: AtsServiceConfig,
    onChunk?: (text: string) => void
): Promise<AtsAnalysisResult> {
    const prompt = buildAtsPrompt(resumeText, jobDescription);

    const response = await fetch(`${config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.modelName,
            prompt: prompt,
            format: 'json', // Forces Ollama to output valid JSON
            options: {
                temperature: 0.1, // Low temperature for deterministic analysis
                num_ctx: 8192 // Increase context window for longer resumes/JDs
            },
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama generation failed: HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedResponse = '';

    if (!reader) {
        // Fallback if reader is unavailable
        const data = await response.json();
        return parseAtsResult(data.response);
    }

    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process line-by-line (NDJSON format)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
                const parsedLine = JSON.parse(trimmed);
                if (parsedLine.response) {
                    accumulatedResponse += parsedLine.response;
                    if (onChunk) {
                        onChunk(accumulatedResponse);
                    }
                }
            } catch (err) {
                // Ignore parsing errors for partial or malformed chunk lines
            }
        }
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
        try {
            const parsedLine = JSON.parse(buffer.trim());
            if (parsedLine.response) {
                accumulatedResponse += parsedLine.response;
            }
        } catch (err) {
            // Ignore
        }
    }

    return parseAtsResult(accumulatedResponse);
}
