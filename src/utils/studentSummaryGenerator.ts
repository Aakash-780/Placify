import { insforge } from '@/lib/insforge';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function buildFallbackSummary(student: any, skills: string[] = [], projects: any[] = [], certificates: any[] = []): string {
    const branch = student.branch || '';
    const cgpa = student.cgpa ? Number(student.cgpa).toFixed(1) : '';
    const placement = student.placement_status === 'placed' ? 'placed' : 'seeking opportunities';
    
    let summary = '';
    
    // First sentence: Branch, placement status and CGPA
    if (branch) {
        summary += `${branch} student `;
    } else {
        summary += 'Student ';
    }
    
    if (cgpa && cgpa !== '0.0') {
        summary += `with a CGPA of ${cgpa} `;
    }
    
    summary += `who is currently ${placement}. `;

    // Second sentence: Skills & Projects
    const skillList = skills.length > 0 ? skills : (student.skills || []);
    if (skillList.length > 0) {
        const topSkills = skillList.slice(0, 3).join(', ');
        summary += `Skilled in ${topSkills}`;
        if (projects.length > 0) {
            const topProj = projects[0].title || projects[0].name || '';
            if (topProj) {
                summary += `, with project experience including '${topProj}'`;
            }
        }
        summary += '. ';
    } else if (projects.length > 0) {
        const topProj = projects[0].title || projects[0].name || '';
        if (topProj) {
            summary += `Has worked on projects such as '${topProj}'. `;
        }
    }

    // Third sentence: Certifications
    if (certificates.length > 0) {
        const certName = typeof certificates[0] === 'string' ? certificates[0] : (certificates[0].name || certificates[0].title);
        if (certName) {
            summary += `Holds certification in ${certName}.`;
        }
    }

    // Final fallback
    if (!summary.trim()) {
        summary = 'A dedicated student looking for placement opportunities to utilize their technical skill sets.';
    }

    return summary.trim();
}

export async function generateStudentSummary(studentId: string): Promise<string> {
    try {
        // Fetch all student details
        const [studentRes, skillsRes, projectsRes, certsRes, aiProfileRes] = await Promise.all([
            insforge.database.from('students').select('*').eq('id', studentId).maybeSingle(),
            insforge.database.from('student_skills').select('skill').eq('student_id', studentId),
            insforge.database.from('student_projects').select('title, description').eq('student_id', studentId),
            insforge.database.from('student_certificates').select('name').eq('student_id', studentId),
            insforge.database.from('student_ai_profiles').select('*').eq('student_id', studentId).maybeSingle()
        ]);

        const student = studentRes.data;
        if (!student) {
            throw new Error(`Student not found with ID: ${studentId}`);
        }

        const skills = (skillsRes.data || []).map((s: any) => s.skill);
        const projects = projectsRes.data || [];
        const certificates = (certsRes.data || []).map((c: any) => c.name);
        const aiProfile = aiProfileRes.data;

        // Try using Gemini if API key is configured
        if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here') {
            const prompt = `You are a professional hiring manager. Create a concise, professional 1-to-2 sentence summary (max 35 words) for a student's placement profile.
Focus on their core skills, key projects, and placement goals. Do NOT mention their name, and do NOT use placeholders. Keep it realistic, direct, and flowing naturally.

Student Details:
- Branch: ${student.branch || 'N/A'}
- CGPA: ${student.cgpa || 'N/A'}
- Placement Status: ${student.placement_status === 'placed' ? 'Placed' : 'Seeking opportunities'}
- Bio/About: ${student.bio || 'N/A'}
- Skills: ${skills.join(', ') || 'N/A'}
- Projects: ${projects.map((p: any) => p.title).join(', ') || 'N/A'}
- Certifications: ${certificates.join(', ') || 'N/A'}
- Experience Level: ${aiProfile?.experience_level || 'Fresher'}

Return ONLY the summary text. No quotes, no markdown, no headings.`;

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
                    }),
                }
            );

            if (res.ok) {
                const resJson = await res.json();
                let summary = (resJson.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                summary = summary.replace(/^["']|["']$/g, ''); // strip outer quotes
                if (summary) {
                    // Update student_ai_profiles
                    if (aiProfile) {
                        await insforge.database
                            .from('student_ai_profiles')
                            .update({ resume_summary: summary })
                            .eq('student_id', studentId);
                    } else {
                        await insforge.database
                            .from('student_ai_profiles')
                            .insert([{ student_id: studentId, resume_summary: summary }]);
                    }
                    return summary;
                }
            } else {
                console.warn(`Gemini API returned status ${res.status} during summary generation.`);
            }
        }

        // Procedural fallback if Gemini fails or is not available
        const fallbackSummary = buildFallbackSummary(student, skills, projects, certsRes.data || []);
        
        // Save the fallback summary so that we have a saved value in the DB as well
        if (aiProfile) {
            await insforge.database
                .from('student_ai_profiles')
                .update({ resume_summary: fallbackSummary })
                .eq('student_id', studentId);
        } else {
            await insforge.database
                .from('student_ai_profiles')
                .insert([{ student_id: studentId, resume_summary: fallbackSummary }]);
        }

        return fallbackSummary;
    } catch (err) {
        console.error('Error generating student summary:', err);
        return 'Dedicated student looking for opportunities in technical and engineering roles.';
    }
}
