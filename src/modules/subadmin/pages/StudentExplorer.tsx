import React, { useEffect, useState, useCallback } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { extractAndStoreResumeMetadata } from '@/lib/geminiResume';
import { buildFallbackSummary } from '@/utils/studentSummaryGenerator';
import {
    Sparkles, Filter, GraduationCap, Mail, Github,
    Linkedin, FileText, Loader2, X, ChevronLeft, ChevronRight,
    Brain, Code2, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    branch: string;
    current_year: number;
    graduation_year: number;
    cgpa: number;
    backlogs: number;
    placement_status: string;
    bio: string;
    linkedin_url: string;
    github_url: string;
    resume_url: string;
    skills: string[];
    projects?: { title: string; description: string }[];
    matchScore?: number;
    matchedResumeWords?: string[];
    ai_profile?: {
        extracted_skills: string[];
        extracted_technologies: string[];
        resume_summary: string;
        ai_tags: string[];
        extracted_keywords: string[];
        experience_level: string;
        tenth_percentage?: number | null;
        twelfth_percentage?: number | null;
        certificates_names?: string[];
        internships_count?: number;
        experience_months?: number;
    };
}

interface AIFilters {
    cgpa_min?: number;
    cgpa_max?: number;
    branch?: string;
    skills?: string[];
    graduation_year?: number;
    placement_status?: string;
    keywords?: string[];
    tenth_min?: number;
    twelfth_min?: number;
    internships_min?: number;
    sort_by_experience?: boolean;
}

const BRANCHES = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'];
const PAGE_SIZE = 9;

function highlightText(text: string, keywords: string[]): React.ReactNode {
    if (!keywords.length || !text) return text;
    const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 rounded px-0.5">
                {part}
            </mark>
        ) : part
    );
}

// ── Local NLP Fallback Parser ─────────────────────────────────────────────────
function parseNaturalLanguageQuery(query: string): { filters: AIFilters; matched_keywords: string[]; explanation: string } {
    const q = query.toLowerCase().trim();
    const filters: AIFilters = {};
    const keywords: string[] = [];
    const explanationParts: string[] = [];

    // CGPA
    const cgpaGt = q.match(/cgpa\s*(?:is\s*)?(?:greater\s*than|above|>|>=|more\s*than)\s*(\d+(?:\.\d+)?)/);
    const cgpaLt = q.match(/cgpa\s*(?:is\s*)?(?:less\s*than|below|<|<=|under)\s*(\d+(?:\.\d+)?)/);
    const cgpaRange = q.match(/cgpa\s*(?:between)?\s*(\d+(?:\.\d+)?)\s*(?:and|-|to)\s*(\d+(?:\.\d+)?)/);
    if (cgpaRange) {
        filters.cgpa_min = parseFloat(cgpaRange[1]);
        filters.cgpa_max = parseFloat(cgpaRange[2]);
        explanationParts.push(`CGPA ${filters.cgpa_min}–${filters.cgpa_max}`);
    } else if (cgpaGt) {
        filters.cgpa_min = parseFloat(cgpaGt[1]);
        explanationParts.push(`CGPA above ${filters.cgpa_min}`);
    } else if (cgpaLt) {
        filters.cgpa_max = parseFloat(cgpaLt[1]);
        explanationParts.push(`CGPA below ${filters.cgpa_max}`);
    }
    if (!filters.cgpa_min && !filters.cgpa_max) {
        const genGt = q.match(/(?:above|greater\s*than|more\s*than|>)\s*(\d+(?:\.\d+)?)/);
        const genLt = q.match(/(?:below|less\s*than|under|<)\s*(\d+(?:\.\d+)?)/);
        if (genGt && parseFloat(genGt[1]) <= 10) { filters.cgpa_min = parseFloat(genGt[1]); explanationParts.push(`CGPA above ${filters.cgpa_min}`); }
        else if (genLt && parseFloat(genLt[1]) <= 10) { filters.cgpa_max = parseFloat(genLt[1]); explanationParts.push(`CGPA below ${filters.cgpa_max}`); }
    }

    // Branch
    const branchMap: Record<string, string> = {
        'cse': 'CSE', 'computer science': 'CSE', 'it': 'IT', 'information technology': 'IT',
        'ece': 'ECE', 'electronics': 'ECE', 'eee': 'EEE', 'electrical': 'EEE',
        'mech': 'MECH', 'mechanical': 'MECH', 'civil': 'CIVIL', 'mba': 'MBA', 'mca': 'MCA',
    };
    for (const [alias, val] of Object.entries(branchMap)) {
        if (new RegExp(`\\b${alias}\\b`).test(q)) { filters.branch = val; explanationParts.push(`branch: ${val}`); break; }
    }

    // Mathematical Extractions
    const tenthMatch = q.match(/(?:10|10th|tenth|class 10)(?:\s+marks|\s+percentage|\s+grade|).*?(?:>|>=|greater than|above)\s*(\d+(?:\.\d+)?)/);
    if (tenthMatch) {
        filters.tenth_min = parseFloat(tenthMatch[1]);
        explanationParts.push(`10th marks > ${filters.tenth_min}%`);
    }

    const twelfthMatch = q.match(/(?:12|12th|twelfth|class 12)(?:\s+marks|\s+percentage|\s+grade|).*?(?:>|>=|greater than|above)\s*(\d+(?:\.\d+)?)/);
    if (twelfthMatch) {
        filters.twelfth_min = parseFloat(twelfthMatch[1]);
        explanationParts.push(`12th marks > ${filters.twelfth_min}%`);
    }

    const internMatch = q.match(/internships?.*(?:>|>=|greater than|above)\s*(\d+)/) || q.match(/(\d+)\+?\s+internships?/);
    if (internMatch) {
        filters.internships_min = parseInt(internMatch[1]);
        explanationParts.push(`internships >= ${filters.internships_min}`);
    }
    
    if (q.includes('most experience') || q.includes('sort by experience') || q.includes('highest internships')) {
        filters.sort_by_experience = true;
        explanationParts.push('Sorting by experience');
    }

    // Placement
    if (q.match(/\b(not placed|unplaced|seeking|looking for|available)\b/)) { filters.placement_status = 'not_placed'; explanationParts.push('not placed'); }
    else if (q.match(/\b(placed|got job|hired)\b/)) { filters.placement_status = 'placed'; explanationParts.push('placed'); }

    // Year
    const yearM = q.match(/\b(202[3-9]|2030)\b/);
    if (yearM) { filters.graduation_year = parseInt(yearM[1]); explanationParts.push(`grad year ${filters.graduation_year}`); }

    // Skills
    const techList = [
        'react', 'angular', 'vue', 'nextjs', 'next.js', 'node', 'nodejs', 'node.js',
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'golang', 'rust',
        'django', 'flask', 'spring', 'express', 'fastapi',
        'machine learning', 'ml', 'deep learning', 'dl', 'artificial intelligence', 'ai',
        'data science', 'data analytics', 'nlp', 'computer vision',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops',
        'android', 'ios', 'flutter', 'react native', 'kotlin', 'swift',
        'blockchain', 'web3', 'solidity', 'cybersecurity',
        'html', 'css', 'tailwind', 'figma',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit',
    ];
    const foundSkills: string[] = [];
    for (const t of techList) {
        if (q.includes(t)) {
            const name = t === 'ml' ? 'Machine Learning' : t === 'dl' ? 'Deep Learning' : t === 'ai' ? 'AI' : t === 'nlp' ? 'NLP' : t.charAt(0).toUpperCase() + t.slice(1);
            if (!foundSkills.includes(name)) { foundSkills.push(name); keywords.push(name); }
        }
    }
    if (foundSkills.length) { filters.skills = foundSkills; explanationParts.push(`skills: ${foundSkills.join(', ')}`); }

    // Generic fallback
    if (!Object.keys(filters).length) {
        const stopWords = new Set(['find', 'show', 'give', 'with', 'have', 'that', 'from', 'student', 'students', 'whose', 'where', 'their', 'more', 'than', 'greater', 'less', 'marks', 'score']);
        const words = q.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        if (words.length) { filters.keywords = words; keywords.push(...words); explanationParts.push(`searching: ${words.join(', ')}`); }
    }

    return {
        filters,
        matched_keywords: keywords,
        explanation: explanationParts.length ? `Finding students with ${explanationParts.join(', ')}.` : 'Showing all students.',
    };
}

export default function StudentExplorer() {
    const { role } = useRole();

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Access Restricted</h2>
                <p className="text-muted-foreground">Student Explorer is only available for Admins.</p>
            </div>
        );
    }

    const [students, setStudents] = useState<Student[]>([]);
    const [filtered, setFiltered] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiQuery, setAiQuery] = useState('');
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiFilters, setAiFilters] = useState<AIFilters>({});
    const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
    const [aiExplanation, setAiExplanation] = useState('');
    const [cgpaRange, setCgpaRange] = useState<[number, number]>([0, 10]);
    const [branchFilter, setBranchFilter] = useState('All');
    const [placementFilter, setPlacementFilter] = useState('all');
    const [gradYearFilter, setGradYearFilter] = useState('all');
    const [skillSearch, setSkillSearch] = useState('');
    const [page, setPage] = useState(1);
    const [processingResume, setProcessingResume] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [studRes, aiRes, skillsRes, projRes] = await Promise.all([
                insforge.database.from('students').select('*').order('created_at', { ascending: false }),
                insforge.database.from('student_ai_profiles').select('*'),
                insforge.database.from('student_skills').select('*'),
                insforge.database.from('student_projects').select('*')
            ]);
            const aiMap: Record<string, any> = {};
            (aiRes.data || []).forEach((p: any) => { aiMap[p.student_id] = p; });
            
            const skillMap: Record<string, string[]> = {};
            (skillsRes.data || []).forEach((s: any) => {
                if (!skillMap[s.student_id]) skillMap[s.student_id] = [];
                if (s.skill) skillMap[s.student_id].push(s.skill);
            });

            const projMap: Record<string, any[]> = {};
            (projRes.data || []).forEach((p: any) => {
                if (!projMap[p.student_id]) projMap[p.student_id] = [];
                projMap[p.student_id].push({ title: p.title, description: p.description });
            });

            const combined: Student[] = (studRes.data || []).map((s: any) => ({
                ...s,
                skills: skillMap[s.id] || [],
                projects: projMap[s.id] || [],
                ai_profile: aiMap[s.id] || null,
            }));
            setStudents(combined);
            setFiltered(combined);
            setLoading(false);
        }
        load();
    }, []);

    const applyFilters = useCallback((
        base: Student[], af: AIFilters, cgpa: [number, number],
        branch: string, placement: string, gradYear: string, skill: string,
    ) => {
        return base.reduce((acc, s) => {
            const cgpaVal = Number(s.cgpa) || 0;
            let include = true;

            // ── Manual Hard Filters ───────────────────────────────────────
            if (cgpaVal < cgpa[0] || cgpaVal > cgpa[1]) include = false;
            if (branch !== 'All' && s.branch !== branch) include = false;
            if (placement !== 'all' && s.placement_status !== placement) include = false;
            if (gradYear !== 'all' && String(s.graduation_year) !== gradYear) include = false;
            
            const studentAllText = [
                ...(s.skills || []), 
                ...(s.projects?.flatMap(p => [p.title, p.description]) || []),
                ...(s.ai_profile?.extracted_skills || []), 
                ...(s.ai_profile?.extracted_technologies || []), 
                ...(s.ai_profile?.ai_tags || []), 
                ...(s.ai_profile?.extracted_keywords || []), 
                ...(s.ai_profile?.certificates_names || []),
                s.bio || '',
                s.ai_profile?.resume_summary || ''
            ].join(' ').toLowerCase();

            if (skill) {
                const sl = skill.toLowerCase().trim();
                // Allow splitting by comma or space for multiple keywords in the manual filter
                const searchTerms = sl.split(/[\s,]+/).filter(Boolean);
                let missingManualTerm = false;
                searchTerms.forEach(term => {
                    if (!studentAllText.includes(term)) {
                        missingManualTerm = true;
                    }
                });
                if (missingManualTerm) include = false;
            }

            // ── AI Driven Match Scoring ─────────────────────────────────
            let matchScore = 100;
            let studentMatchedWords: string[] = [];
            const hasAiFilters = Object.keys(af).length > 0;

            if (include && hasAiFilters) {
                let score = 0;
                let potentialMax = 0;
                let isStrictFail = false;

                // 1. CGPA Match (20%)
                if (af.cgpa_min !== undefined || af.cgpa_max !== undefined) {
                    potentialMax += 20;
                    const cMin = af.cgpa_min ?? 0;
                    const cMax = af.cgpa_max ?? 10;
                    if (cgpaVal >= cMin && cgpaVal <= cMax) {
                        score += 20;
                    } else {
                        isStrictFail = true; // CGPA is a strict requirement
                    }
                }

                // 2. Skill Match (50%)
                if (af.skills && af.skills.length > 0) {
                    potentialMax += 50;
                    let matched = 0;
                    af.skills.forEach(reqSkill => {
                        if (studentAllText.includes(reqSkill.toLowerCase())) {
                            matched++;
                            studentMatchedWords.push(reqSkill);
                        }
                    });
                    if (matched > 0) score += Math.round((matched / af.skills.length) * 50);
                    // Removed strict fail here so students without extracted skills still appear but score lower
                }

                // 3. Project / Keyword Match (30%)
                if (af.keywords && af.keywords.length > 0) {
                    potentialMax += 30;
                    let matched = 0;
                    af.keywords.forEach(kw => {
                        if (studentAllText.includes(kw.toLowerCase())) {
                            matched++;
                            studentMatchedWords.push(kw);
                        }
                    });
                    if (matched > 0) score += Math.round((matched / af.keywords.length) * 30);
                }

                // Strict Metadata requirements
                if (af.branch && s.branch !== af.branch) isStrictFail = true;
                if (af.graduation_year && s.graduation_year !== af.graduation_year) isStrictFail = true;
                if (af.placement_status && s.placement_status !== af.placement_status) isStrictFail = true;
                
                // New Fields Check
                if (af.tenth_min !== undefined) {
                    const val = Number(s.ai_profile?.tenth_percentage) || 0;
                    if (val >= af.tenth_min) score += 10;
                    else isStrictFail = true;
                }
                if (af.twelfth_min !== undefined) {
                    const val = Number(s.ai_profile?.twelfth_percentage) || 0;
                    if (val >= af.twelfth_min) score += 10;
                    else isStrictFail = true;
                }
                if (af.internships_min !== undefined) {
                    const val = Number(s.ai_profile?.internships_count) || 0;
                    if (val >= af.internships_min) score += 10;
                    else isStrictFail = true;
                }

                // Require at least a 10% match overall to be included, unless NO AI filters matched (meaning purely strict filters applied)
                if (isStrictFail) {        
                    include = false;
                } else if (score === 0 && potentialMax > 0 && 
                           af.tenth_min === undefined && 
                           af.twelfth_min === undefined && 
                           af.internships_min === undefined && 
                           af.cgpa_min === undefined && 
                           af.cgpa_max === undefined) {
                    // Only drop them if there were exclusively text/cognitive search words (skills/tags) and zero matched
                    include = false;
                } else {
                    matchScore = potentialMax > 0 ? Math.round((score / potentialMax) * 100) : 100;
                    // Sort by experience bonus logic
                    if (af.sort_by_experience) {
                        const internships = s.ai_profile?.internships_count ?? 0;
                        const expMonths = s.ai_profile?.experience_months ?? 0;
                        matchScore += (internships * 5) + (expMonths * 0.5); // Add bonus to total score for sorting
                    }
                }
            }

            if (include) {
                acc.push({ ...s, matchScore, matchedResumeWords: studentMatchedWords });
            }
            return acc;
        }, [] as Student[]).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }, []);

    useEffect(() => {
        setFiltered(applyFilters(students, aiFilters, cgpaRange, branchFilter, placementFilter, gradYearFilter, skillSearch));
        setPage(1);
    }, [students, aiFilters, cgpaRange, branchFilter, placementFilter, gradYearFilter, skillSearch, applyFilters]);

    async function runAiSearch() {
        if (!aiQuery.trim()) {
            setAiFilters({});
            setMatchedKeywords([]);
            setAiExplanation('');
            return;
        }
        setAiProcessing(true);
        try {
            const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

            if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here') {
                // ── Gemini API ────────────────────────────────────────────
                const prompt = `You are a student database search assistant. Convert the user query into JSON filters.

AVAILABLE DATABASE FIELDS:
- cgpa_min / cgpa_max (number 0-10): CGPA range ONLY.
- branch: CSE, IT, ECE, EEE, MECH, CIVIL, MBA, MCA
- skills (string[]): programming languages, frameworks, technologies
- keywords (string[]): general keywords or phrases to search verbatim in their physical resume/bio
- tenth_min (number 0-100): Minimum 10th grade / class 10 percentage requested.
- twelfth_min (number 0-100): Minimum 12th grade / class 12 percentage requested.
- internships_min (number): Minimum internships count requested.
- sort_by_experience (boolean): Set to true if the user implies sorting by experience or most internships.

RULES:
1. ONLY output a field if explicitly requested. DO NOT guess the "branch" based on partial matching (e.g. do NOT extract "ECE" from the word "percentage", or "IT" from the word "with").
2. If the user asks for certificates, add them to the 'keywords' array. If they ask for class 10 percentage > 85, set 'tenth_min' to 85. 
3. Return ONLY raw JSON — no markdown, no code fences, no backticks.

Query: "${aiQuery}"

Return ONLY this exact JSON format (no other text):
{"filters":{},"matched_keywords":[],"explanation":""}`;

                let raw = "";
                
                try {
                    const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
                        try {
                            const res = await fetch(url, options);
                            if ((res.status === 503 || res.status === 429) && retries > 0) {
                                console.warn(`Gemini API returned ${res.status}. Retrying in ${delay}ms... (${retries} retries left)`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                return fetchWithRetry(url, options, retries - 1, delay * 2);
                            }
                            return res;
                        } catch (err) {
                            if (retries > 0) {
                                console.warn(`Gemini API fetch failed:`, err, `Retrying in ${delay}ms... (${retries} retries left)`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                return fetchWithRetry(url, options, retries - 1, delay * 2);
                            }
                            throw err;
                        }
                    };

                    const res = await fetchWithRetry(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
                        {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0, maxOutputTokens: 400 },
                            }),
                        }
                    );

                    if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
                    const data = await res.json();
                    raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                } catch (geminiError: any) {
                    console.warn("Gemini failed, falling back to Grok:", geminiError);
                    const GROK_KEY = import.meta.env.VITE_GROK_API_KEY;
                    if (!GROK_KEY) throw geminiError; // cascade to offline script if no Grok key
                    
                    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${GROK_KEY}`
                        },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: prompt }],
                            model: "grok-2-latest",
                            temperature: 0,
                            max_tokens: 400
                        })
                    });
                    
                    if (!grokRes.ok) throw new Error(`Grok API error ${grokRes.status}`);
                    const grokData = await grokRes.json();
                    raw = (grokData.choices?.[0]?.message?.content || '').trim();
                }

                // Strip markdown fences if present
                raw = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
                const m = raw.match(/\{[\s\S]*\}/);
                if (m) raw = m[0];
                const parsed = JSON.parse(raw);
                setAiFilters(parsed.filters || {});
                setMatchedKeywords(parsed.matched_keywords || []);
                setAiExplanation(parsed.explanation || 'Search applied via Gemini AI.');
            } else {
                // ── Local NLP fallback (no API key needed) ────────────────
                await new Promise(r => setTimeout(r, 200));
                const result = parseNaturalLanguageQuery(aiQuery);
                setAiFilters(result.filters);
                setMatchedKeywords(result.matched_keywords);
                setAiExplanation(result.explanation);
            }
        } catch (err: any) {
            console.error('AI search error:', err);
            // Silently fall back to local parser on any API error
            const result = parseNaturalLanguageQuery(aiQuery);
            setAiFilters(result.filters);
            setMatchedKeywords(result.matched_keywords);
            setAiExplanation(result.explanation);
        } finally {
            setAiProcessing(false);
        }
    }

    function clearAiSearch() {
        setAiQuery('');
        setAiFilters({});
        setMatchedKeywords([]);
        setAiExplanation('');
    }

    async function analyzeResume(student: Student) {
        if (!student.resume_url) return;
        setProcessingResume(student.id);
        try {
            const updatedProfile = await extractAndStoreResumeMetadata(student.id, student.resume_url);
            if (updatedProfile) {
                setStudents((prev: Student[]) => prev.map((s: Student) =>
                    s.id === student.id ? { ...s, ai_profile: updatedProfile as any } : s
                ));
            } else {
                console.error("No updated profile returned.");
                alert("Failed to analyze resume. Check console.");
            }
        } catch (err: any) {
            console.error('Resume analysis error:', err);
            alert(`Analysis Error:\n\n${err.message || err}`);
        } finally {
            setProcessingResume(null);
        }
    }

    async function analyzeAllResumes() {
        const needsProcessing = students.filter(s => !!s.resume_url && (!s.ai_profile || typeof s.ai_profile.tenth_percentage === 'undefined'));
        if (needsProcessing.length === 0) return alert("Everything is already up to date!");
        if (!confirm(`Found ${needsProcessing.length} students needing resume analysis. Please wait and DO NOT refresh the page until it finishes. Proceed?`)) return;

        for (const s of needsProcessing) {
            setProcessingResume(s.id);
            try {
                const updatedProfile = await extractAndStoreResumeMetadata(s.id, s.resume_url);
                if (updatedProfile) {
                    setStudents((prev: Student[]) => prev.map((prevS: Student) =>
                        prevS.id === s.id ? { ...prevS, ai_profile: updatedProfile as any } : prevS
                    ));
                }
                // Wait for 4 seconds between requests to avoid Gemini 429 (Too Many Requests) on the free tier
                await new Promise(resolve => setTimeout(resolve, 4000));
            } catch(e: any) {
                console.error(`Failed to analyze ${s.name}`, e);
                alert(`Error processing ${s.name}:\n\n${e.message || e}`);
                setProcessingResume(null);
                return; // Stop the loop so they can see the error!
            }
        }
        setProcessingResume(null);
        alert("Finished analyzing all past resumes!");
    }

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); 
    const gradYears = [...new Set(students.map(s => s.graduation_year))].filter(Boolean).sort() as number[];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-4 left-16 w-24 h-24 rounded-full bg-white blur-2xl" />
                </div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-6 h-6" />
                        <span className="text-sm font-medium text-white/80 uppercase tracking-wider">AI-Powered</span>
                    </div>
                    <h1 className="text-3xl font-heading font-bold mb-1">Student Explorer</h1>
                    <p className="text-white/70">Discover top candidates using natural language search and AI resume analysis</p>

                    <div className="flex gap-2 mt-6">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                            <input
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && runAiSearch()}
                                placeholder='e.g. "Find students with CGPA > 8 who know React and Python"'
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                            />
                        </div>
                        <Button onClick={runAiSearch} disabled={aiProcessing} className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6">
                            {aiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-1" />Search</>}
                        </Button>
                        {Object.keys(aiFilters).length > 0 && (
                            <Button variant="ghost" onClick={clearAiSearch} className="border border-white/20 text-white hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {aiExplanation && (
                        <div className="mt-3 flex items-start gap-2 bg-white/10 rounded-lg p-3">
                            <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-white/90">{aiExplanation}</p>
                        </div>
                    )}

                    {!aiQuery && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {['CGPA above 8', 'Students skilled in React and Node.js', 'Machine learning students', 'Python and data science', 'Not yet placed CSE students'].map(s => (
                                <button key={s} onClick={() => setAiQuery(s)}
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1 rounded-full border border-white/20 transition-colors">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Filter Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" />Manual Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">CGPA: {cgpaRange[0].toFixed(1)} – {cgpaRange[1].toFixed(1)}</Label>
                                <div className="flex gap-2">
                                    <Input type="number" min={0} max={10} step={0.1} value={cgpaRange[0]}
                                        onChange={e => setCgpaRange([parseFloat(e.target.value) || 0, cgpaRange[1]])}
                                        className="h-8 text-sm" placeholder="Min" />
                                    <Input type="number" min={0} max={10} step={0.1} value={cgpaRange[1]}
                                        onChange={e => setCgpaRange([cgpaRange[0], parseFloat(e.target.value) || 10])}
                                        className="h-8 text-sm" placeholder="Max" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Branch</Label>
                                <Select value={branchFilter} onValueChange={setBranchFilter}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Placement Status</Label>
                                <Select value={placementFilter} onValueChange={setPlacementFilter}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="not_placed">Not Placed</SelectItem>
                                        <SelectItem value="placed">Placed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Graduation Year</Label>
                                <Select value={gradYearFilter} onValueChange={setGradYearFilter}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {gradYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Skill / Tech Stack</Label>
                                <div className="relative">
                                    <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="React, Python, ML..." className="pl-8 h-8 text-sm" />
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full"
                                onClick={() => { setCgpaRange([0, 10]); setBranchFilter('All'); setPlacementFilter('all'); setGradYearFilter('all'); setSkillSearch(''); }}>
                                <RefreshCw className="w-3 h-3 mr-2" />Reset Filters
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Showing</span>
                                <span className="font-semibold">{filtered.length} / {students.length}</span>
                            </div>
                            <Progress value={students.length > 0 ? (filtered.length / students.length) * 100 : 0} className="h-2" />
                            {matchedKeywords.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">AI Matched:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {matchedKeywords.map(k => (
                                            <Badge key={k} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{k}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Student Cards */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="h-64 animate-pulse bg-muted/50" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <Card>
                            <CardContent className="p-16 text-center">
                                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="font-semibold">No students found</p>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {paginated.map(student => (
                                    <StudentCard key={student.id} student={student} matchedKeywords={matchedKeywords}
                                        onAnalyzeResume={analyzeResume} processingResume={processingResume} />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
                                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Student Card ──────────────────────────────────────────────────────────────
function StudentCard({ student, matchedKeywords, onAnalyzeResume, processingResume }: {
    student: Student; matchedKeywords: string[];
    onAnalyzeResume: (s: Student) => void; processingResume: string | null;
}) {
    const isAnalyzing = processingResume === student.id;
    const hasAIProfile = !!student.ai_profile?.resume_summary;
    const allSkills = [...(student.skills || []), ...(student.ai_profile?.extracted_skills || []), ...(student.ai_profile?.extracted_technologies || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
    const placementColor = student.placement_status === 'placed' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';

    return (
        <Card className="group overflow-hidden border hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            {hasAIProfile && <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />}
            <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold">
                            {student.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                            {matchedKeywords.length > 0 ? highlightText(student.name, matchedKeywords) : student.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">{student.branch} • {student.graduation_year}</p>
                        <div className="flex gap-2 items-center mt-1">
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium inline-block', placementColor)}>
                                {student.placement_status === 'placed' ? '✓ Placed' : 'Seeking'}
                            </span>
                            {student.matchScore !== undefined && student.matchScore < 100 && (
                                <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1',
                                    student.matchScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                    student.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30'
                                )}>
                                    <Brain className="w-3 h-3" />
                                    {Math.round(student.matchScore)}% Match
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary">{Number(student.cgpa).toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">CGPA</div>
                    </div>
                </div>

                {(() => {
                    const summaryText = student.ai_profile?.resume_summary || buildFallbackSummary(student);
                    return (
                        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-lg p-2 mb-3">
                            <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-violet-500" />
                                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">AI Summary</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {matchedKeywords.length > 0 ? highlightText(summaryText, matchedKeywords) : summaryText}
                            </p>
                        </div>
                    );
                })()}

                {allSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {allSkills.map(skill => {
                            const isMatch = matchedKeywords.some(k => skill.toLowerCase().includes(k.toLowerCase()));
                            return (
                                <Badge key={skill} variant={isMatch ? 'default' : 'outline'}
                                    className={cn('text-xs', isMatch && 'bg-yellow-400 text-yellow-900 border-yellow-400')}>
                                    {skill}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                {student.ai_profile?.ai_tags && student.ai_profile.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {student.ai_profile.ai_tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                    </div>
                )}

                {student.matchedResumeWords && student.matchedResumeWords.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-2 mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Code2 className="w-3 h-3 text-yellow-600" />
                            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Matches in Profile/Resume:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {student.matchedResumeWords.map(word => (
                                <span key={word} className="text-[10px] bg-yellow-100/80 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <Separator className="my-3" />
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                        {student.email && <a href={`mailto:${student.email}`}><Button variant="ghost" size="icon" className="h-7 w-7"><Mail className="w-3.5 h-3.5" /></Button></a>}
                        {student.linkedin_url && <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><Linkedin className="w-3.5 h-3.5" /></Button></a>}
                        {student.github_url && <a href={student.github_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><Github className="w-3.5 h-3.5" /></Button></a>}
                        {student.resume_url && <a href={student.resume_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7" title="View Resume"><FileText className="w-3.5 h-3.5" /></Button></a>}
                    </div>
                    {student.resume_url && (
                        <Button variant="outline" size="sm" className={cn('text-xs h-7 px-2', hasAIProfile && 'border-violet-300 text-violet-600')}
                            onClick={() => onAnalyzeResume(student)} disabled={isAnalyzing}>
                            {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Brain className="w-3 h-3 mr-1" />}
                            {hasAIProfile ? 'Re-analyze' : 'AI Analyze'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
