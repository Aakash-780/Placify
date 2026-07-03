import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { NotificationService } from '@/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Users, Search, ChevronDown, Eye, CheckCircle, XCircle,
    Clock, FileText, Mail, Briefcase, ZoomIn, ZoomOut, RotateCcw,
    Maximize2, Minimize2, Download, ExternalLink, X, Loader2,
    Calendar, Award, GraduationCap, UserCheck, MessageSquare, Trophy, Undo, Check,
    Sparkles, Brain, Zap, Filter, SlidersHorizontal, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, bg: string, text: string, dot: string, border: string }> = {
    applied: {
        label: 'Applied',
        color: 'blue',
        icon: FileText,
        bg: 'bg-blue-500/10 hover:bg-blue-500/20',
        text: 'text-blue-400',
        dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
        border: 'border-blue-500/30 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30'
    },
    under_review: {
        label: 'Applied',
        color: 'blue',
        icon: FileText,
        bg: 'bg-blue-500/10 hover:bg-blue-500/20',
        text: 'text-blue-400',
        dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
        border: 'border-blue-500/30 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30'
    },
    shortlisted: {
        label: 'Shortlisted',
        color: 'cyan',
        icon: UserCheck,
        bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
        text: 'text-cyan-400',
        dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
        border: 'border-cyan-500/30 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30'
    },
    interview_scheduled: {
        label: 'Interviewing',
        color: 'orange',
        icon: MessageSquare,
        bg: 'bg-orange-500/10 hover:bg-orange-500/20',
        text: 'text-orange-400',
        dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
        border: 'border-orange-500/30 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30'
    },
    selected: {
        label: 'Selected',
        color: 'emerald',
        icon: Trophy,
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        text: 'text-emerald-400',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        border: 'border-emerald-500/30 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
    },
    rejected: {
        label: 'Rejected',
        color: 'red',
        icon: XCircle,
        bg: 'bg-rose-500/10 hover:bg-rose-500/20',
        text: 'text-rose-400',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        border: 'border-rose-500/30 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30'
    },
    withdrawn: {
        label: 'Withdrawn',
        color: 'gray',
        icon: Undo,
        bg: 'bg-slate-500/10 hover:bg-slate-500/20',
        text: 'text-slate-400',
        dot: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]',
        border: 'border-slate-500/30 focus:border-slate-500/60 focus:ring-1 focus:ring-slate-500/30'
    }
};

const getRecruiterCompanyName = (roleData: any) => {
    if (!roleData || !roleData.company) return '';
    try {
        if (roleData.company.trim().startsWith('{')) {
            const parsed = JSON.parse(roleData.company);
            return parsed.companyName || '';
        }
    } catch (e) {
        console.error("Failed to parse company JSON", e);
    }
    return roleData.company;
};

const BRANCHES = ['all', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'];
const GRAD_YEARS = ['all', '2024', '2025', '2026', '2027', '2028'];
const QUICK_CHIPS = [
    'CGPA > 9',
    'Python',
    'React',
    'Node.js',
    'Machine Learning',
    'Internship Experience',
    'Open Source',
    'Competitive Programming'
];

export default function Applicants() {
    const { role, roleData } = useRole();
    const renderProgressTracker = (currentStatus: string) => {
        const trackerSteps = [
            { key: 'applied', label: 'Applied' },
            { key: 'shortlisted', label: 'Shortlisted' },
            { key: 'interview_scheduled', label: 'Interviewing' },
            { key: 'selected', label: 'Selected' }
        ];
        
        const normalizedStatus = currentStatus === 'under_review' ? 'applied' : currentStatus;
        const activeIdx = trackerSteps.findIndex(s => s.key === normalizedStatus);
        const isTerminated = currentStatus === 'rejected' || currentStatus === 'withdrawn';
        
        return (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] font-bold text-muted-foreground/85 mb-2.5 sm:mb-3 select-none">
                {trackerSteps.map((step, idx) => {
                    const isCompleted = !isTerminated && activeIdx > idx;
                    const isCurrent = !isTerminated && activeIdx === idx;
                    const isUpcoming = !isTerminated && activeIdx < idx;
                    
                    return (
                        <React.Fragment key={step.key}>
                            <div className="flex items-center gap-1">
                                {isCompleted ? (
                                    <span className="text-emerald-400 font-extrabold text-[11px] leading-none">✓</span>
                                ) : isCurrent ? (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]"></span>
                                    </span>
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-border dark:bg-slate-700" />
                                )}
                                <span className={cn(
                                    isCompleted && "text-muted-foreground/95 dark:text-slate-300 font-semibold",
                                    isCurrent && "text-indigo-600 dark:text-indigo-400 font-black",
                                    isUpcoming && "text-muted-foreground/45 font-medium"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < trackerSteps.length - 1 && (
                                <span className={cn(
                                    "w-3 h-0.5 rounded shrink-0",
                                    isCompleted ? "bg-emerald-500/40" : "bg-border dark:bg-slate-800"
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
                
                {isTerminated && (
                    <>
                        <span className="w-3 h-0.5 rounded bg-border dark:bg-slate-800 shrink-0" />
                        <div className="flex items-center gap-1">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                currentStatus === 'rejected' ? 'bg-rose-500' : 'bg-slate-500'
                            )} />
                            <span className={cn(
                                "font-bold capitalize text-[10px]",
                                currentStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                            )}>
                                {currentStatus}
                            </span>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState<any[]>([]);
    // Initialize selectedJob directly from query param to avoid race conditions on mount
    const [selectedJob, setSelectedJob] = useState<string>(() => {
        return searchParams.get('jobId') || 'all';
    });
    const [applications, setApplications] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewApp, setViewApp] = useState<any>(null);

    // AI Analyzer States
    const [aiAnalyzerActive, setAiAnalyzerActive] = useState(false);
    const [activeChips, setActiveChips] = useState<string[]>([]);
    const [customSkillQuery, setCustomSkillQuery] = useState('');
    const [minCgpaFilter, setMinCgpaFilter] = useState<number | null>(null);
    const [gradYearFilter, setGradYearFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [placementFilter, setPlacementFilter] = useState('all');
    const [sortBy, setSortBy] = useState('match');

    // Sync selectedJob state if URL query parameter change occurs
    useEffect(() => {
        const jobId = searchParams.get('jobId');
        if (jobId) {
            setSelectedJob(jobId);
        } else {
            setSelectedJob('all');
        }
    }, [searchParams]);

    // Resume Preview state
    const [previewResumeUrl, setPreviewResumeUrl] = useState<string | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewResumeName, setPreviewResumeName] = useState<string>('');
    const [previewZoom, setPreviewZoom] = useState<number>(100);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Fetch PDF as Blob and generate a local Object URL to prevent auto-download
    const handleOpenPreview = async (url: string, name: string) => {
        if (!url) return;
        setPreviewResumeUrl(url);
        setPreviewResumeName(name);
        setPreviewZoom(100);
        setPreviewLoading(true);
        setPreviewError(false);
        setIsFullscreen(false);
        
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }

        try {
            console.log('[ResumePreview] Fetching document via URL:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch document: HTTP ${response.status}`);
            let blob = await response.blob();
            
            // Re-wrap blob as application/pdf to bypass Content-Disposition headers
            blob = new Blob([blob], { type: 'application/pdf' });
            
            const bUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(bUrl);
        } catch (err: any) {
            console.error('[ResumePreview] Fetch failed:', err);
            setPreviewError(true);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleClosePreview = () => {
        setPreviewResumeUrl(null);
        setIsFullscreen(false);
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }
    };

    // Timeout loading state after 10s if fetching takes too long
    useEffect(() => {
        let timer: any;
        if (previewResumeUrl && previewLoading) {
            timer = setTimeout(() => {
                setPreviewLoading(currentLoading => {
                    if (currentLoading) {
                        setPreviewError(true);
                        return false;
                    }
                    return currentLoading;
                });
            }, 10000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [previewResumeUrl, previewLoading]);

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [previewBlobUrl]);

    const handleDownload = () => {
        if (!previewResumeUrl) return;
        const link = document.createElement('a');
        link.href = previewResumeUrl;
        link.download = `${previewResumeName.replace(/\s+/g, '_')}_Resume.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        async function fetchJobs() {
            let query = insforge.database.from('jobs').select('id, company, title, role');
            if (role === 'recruiter') {
                const compName = getRecruiterCompanyName(roleData);
                query = query.eq('company', compName);
            }
            const { data } = await query.order('created_at', { ascending: false });
            setJobs(data || []);
            setLoading(false);
        }
        fetchJobs();
    }, [role, roleData]);

    useEffect(() => {
        if (!selectedJob) return;
        let isCurrent = true;
        
        async function fetchApps() {
            let query = insforge.database
                .from('job_applications')
                .select('*, students(*), jobs(company, title, role)')
                .order('created_at', { ascending: false });
                
            if (selectedJob !== 'all') {
                if (role === 'recruiter') {
                    const compName = getRecruiterCompanyName(roleData);
                    const { data: jobCheck } = await insforge.database
                        .from('jobs')
                        .select('company')
                        .eq('id', selectedJob)
                        .maybeSingle();
                    if (!jobCheck || jobCheck.company !== compName) {
                        if (isCurrent) setApplications([]);
                        return;
                    }
                }
                query = query.eq('job_id', selectedJob);
            } else if (role === 'recruiter') {
                const compName = getRecruiterCompanyName(roleData);
                const { data: compJobs } = await insforge.database
                    .from('jobs')
                    .select('id')
                    .eq('company', compName);
                const ids = (compJobs || []).map(j => j.id);
                if (ids.length > 0) {
                    query = query.in('job_id', ids);
                } else {
                    if (isCurrent) setApplications([]);
                    return;
                }
            }
            
            const { data, error } = await query;
            if (error) {
                console.error(error);
                return;
            }
            if (isCurrent) {
                // Fetch rich profile data for these students to enable Resume Intelligence and AI screening
                const studentIds = (data || []).map((app: any) => app.student_id).filter(Boolean);
                let skillMap: Record<string, string[]> = {};
                let projMap: Record<string, any[]> = {};
                let certMap: Record<string, any[]> = {};
                let aiProfileMap: Record<string, any> = {};

                if (studentIds.length > 0) {
                    try {
                        const [skillsRes, projRes, certRes, aiRes] = await Promise.all([
                            insforge.database.from('student_skills').select('*').in('student_id', studentIds),
                            insforge.database.from('student_projects').select('*').in('student_id', studentIds),
                            insforge.database.from('student_certificates').select('*').in('student_id', studentIds),
                            insforge.database.from('student_ai_profiles').select('*').in('student_id', studentIds),
                        ]);

                        (skillsRes.data || []).forEach((s: any) => {
                            if (!skillMap[s.student_id]) skillMap[s.student_id] = [];
                            skillMap[s.student_id].push(s.skill);
                        });

                        (projRes.data || []).forEach((p: any) => {
                            if (!projMap[p.student_id]) projMap[p.student_id] = [];
                            projMap[p.student_id].push(p);
                        });

                        (certRes.data || []).forEach((c: any) => {
                            if (!certMap[c.student_id]) certMap[c.student_id] = [];
                            certMap[c.student_id].push(c);
                        });

                        (aiRes.data || []).forEach((p: any) => {
                            aiProfileMap[p.student_id] = p;
                        });
                    } catch (enrichErr) {
                        console.error("Failed to enrich student details:", enrichErr);
                    }
                }

                const enrichedData = (data || []).map((app: any) => {
                    const s = app.students;
                    return {
                        ...app,
                        students: s ? {
                            ...s,
                            skills: skillMap[s.id] || [],
                            projects: projMap[s.id] || [],
                            certificates: certMap[s.id] || [],
                            ai_profile: aiProfileMap[s.id] || null
                        } : null
                    };
                });

                setApplications(enrichedData);
            }
        }
        fetchApps();

        return () => {
            isCurrent = false;
        };
    }, [selectedJob, role, roleData]);

    async function updateStatus(appId: string, status: string) {
        try {
            await insforge.database.from('job_applications').update({ status }).eq('id', appId);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));

            // Log status history
            await insforge.database.from('application_status_history').insert([{
                application_id: appId,
                status: status,
                notes: `Status updated by recruiter/placement coordinator.`
            }]);

            // Find application detail to send notification
            const app = applications.find(a => a.id === appId);
            if (app) {
                const studentId = app.student_id;
                const company = app.jobs?.company || 'Company';
                const jobTitle = app.jobs?.title || app.jobs?.role || 'Job';

                if (studentId) {
                    await NotificationService.createStatusNotification(
                        studentId,
                        status,
                        company,
                        jobTitle,
                        appId
                    );
                }
            }
        } catch (err) {
            console.error("Failed to update status completely:", err);
        }
    }

    const statusColor: Record<string, string> = {
        applied: 'warning',
        under_review: 'warning',
        shortlisted: 'default',
        interview_scheduled: 'default',
        selected: 'success',
        rejected: 'destructive',
        withdrawn: 'secondary',
        pending: 'warning'
    };

    const hasSkill = (student: any, skillName: string) => {
        if (!student) return false;
        const nameLower = skillName.toLowerCase();
        const skillsList = [
            ...(student.skills || []),
            ...(student.ai_profile?.extracted_skills || []),
            ...(student.ai_profile?.extracted_technologies || [])
        ].map(s => s.toLowerCase());
        
        return skillsList.some(s => s.includes(nameLower) || nameLower.includes(s));
    };

    const hasInternship = (student: any) => {
        if (!student) return false;
        if ((student.ai_profile?.internships_count || 0) > 0) return true;
        const expText = JSON.stringify(student.experience || '').toLowerCase();
        const bioText = (student.bio || '').toLowerCase();
        const resumeText = (student.ai_profile?.resume_summary || '').toLowerCase();
        return expText.includes('intern') || bioText.includes('intern') || resumeText.includes('intern');
    };

    const hasMLProjects = (student: any) => {
        if (!student) return false;
        const projectText = JSON.stringify(student.projects || '').toLowerCase();
        return projectText.includes('machine learning') || projectText.includes('ml') || projectText.includes('tensorflow') || projectText.includes('pytorch') || projectText.includes('deep learning');
    };

    const hasOpenSource = (student: any) => {
        if (!student) return false;
        const bioText = (student.bio || '').toLowerCase();
        const projectText = JSON.stringify(student.projects || '').toLowerCase();
        return student.github_url || bioText.includes('open source') || projectText.includes('open source') || bioText.includes('contribution');
    };

    const hasCompetitiveProgramming = (student: any) => {
        if (!student) return false;
        const bioText = (student.bio || '').toLowerCase();
        return bioText.includes('competitive programming') || bioText.includes('dsa') || bioText.includes('codeforces') || bioText.includes('leetcode') || bioText.includes('codechef');
    };

    const calculateMatchScore = (student: any) => {
        if (!student) return 0;
        let score = 50; // base score
        
        // CGPA component (up to 20 pts)
        const cgpa = Number(student.cgpa) || 0;
        if (cgpa >= 9) score += 20;
        else if (cgpa >= 8) score += 15;
        else if (cgpa >= 7) score += 10;
        
        // Skills component (up to 15 pts)
        const skillsCount = (student.skills || []).length + (student.ai_profile?.extracted_skills || []).length;
        score += Math.min(15, skillsCount * 3);
        
        // Projects component (up to 15 pts)
        const projectsCount = (student.projects || []).length;
        score += Math.min(15, projectsCount * 5);
        
        // Experience component (up to 10 pts)
        const hasExp = (student.experience || []).length > 0 || (student.ai_profile?.experience_months || 0) > 0;
        if (hasExp) score += 10;

        // Certifications component (up to 10 pts)
        const certsCount = (student.certificates || []).length;
        score += Math.min(10, certsCount * 5);

        return Math.min(100, score);
    };

    const filtered = (() => {
        let processed = [...applications];

        // Search query (name search)
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            processed = processed.filter(a => a.students?.name?.toLowerCase().includes(q));
        }

        // AI Analyzer Filters
        if (aiAnalyzerActive) {
            // Quick Chips Filters
            activeChips.forEach(chip => {
                if (chip === 'CGPA > 9') {
                    processed = processed.filter(a => Number(a.students?.cgpa) >= 9);
                } else if (chip === 'Python') {
                    processed = processed.filter(a => hasSkill(a.students, 'Python'));
                } else if (chip === 'React') {
                    processed = processed.filter(a => hasSkill(a.students, 'React'));
                } else if (chip === 'Node.js') {
                    processed = processed.filter(a => hasSkill(a.students, 'Node.js'));
                } else if (chip === 'Machine Learning') {
                    processed = processed.filter(a => hasSkill(a.students, 'Machine Learning') || hasMLProjects(a.students));
                } else if (chip === 'Internship Experience') {
                    processed = processed.filter(a => hasInternship(a.students));
                } else if (chip === 'Open Source') {
                    processed = processed.filter(a => hasOpenSource(a.students));
                } else if (chip === 'Competitive Programming') {
                    processed = processed.filter(a => hasCompetitiveProgramming(a.students));
                }
            });

            // Custom Skill Search
            if (customSkillQuery.trim()) {
                const skill = customSkillQuery.trim();
                processed = processed.filter(a => hasSkill(a.students, skill));
            }

            // Academic Filters
            if (minCgpaFilter) {
                processed = processed.filter(a => Number(a.students?.cgpa) >= minCgpaFilter);
            }
            if (gradYearFilter !== 'all') {
                processed = processed.filter(a => String(a.students?.graduation_year) === gradYearFilter);
            }
            if (branchFilter !== 'all') {
                processed = processed.filter(a => a.students?.branch === branchFilter);
            }
            if (placementFilter !== 'all') {
                processed = processed.filter(a => a.students?.placement_status === placementFilter);
            }

            // Sorting
            processed.sort((a, b) => {
                const sA = a.students;
                const sB = b.students;
                if (!sA || !sB) return 0;

                if (sortBy === 'cgpa') {
                    return (Number(sB.cgpa) || 0) - (Number(sA.cgpa) || 0);
                }
                if (sortBy === 'skills') {
                    const skillsA = (sA.skills || []).length + (sA.ai_profile?.extracted_skills || []).length;
                    const skillsB = (sB.skills || []).length + (sB.ai_profile?.extracted_skills || []).length;
                    return skillsB - skillsA;
                }
                if (sortBy === 'projects') {
                    return (sB.projects || []).length - (sA.projects || []).length;
                }
                if (sortBy === 'certs') {
                    return (sB.certificates || []).length - (sA.certificates || []).length;
                }
                if (sortBy === 'experience') {
                    const expA = (sA.experience || []).length + (sA.ai_profile?.experience_months || 0);
                    const expB = (sB.experience || []).length + (sB.ai_profile?.experience_months || 0);
                    return expB - expA;
                }
                
                // Default: 'match'
                return calculateMatchScore(sB) - calculateMatchScore(sA);
            });
        }

        return processed;
    })();

    const cgpa9Count = applications.filter(a => Number(a.students?.cgpa) >= 9).length;
    const pythonCount = applications.filter(a => hasSkill(a.students, 'Python')).length;
    const reactNodeCount = applications.filter(a => hasSkill(a.students, 'React') && hasSkill(a.students, 'Node.js')).length;
    const internshipCount = applications.filter(a => hasInternship(a.students)).length;
    const mlProjectsCount = applications.filter(a => hasSkill(a.students, 'Machine Learning') || hasMLProjects(a.students)).length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-heading font-bold">Applicants</h1> 
                <p className="text-muted-foreground mt-1">Manage applications for your job postings</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger className="w-full sm:w-[320px]">
                        <SelectValue placeholder="All Jobs" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map(j => (
                            <SelectItem key={j.id} value={j.id}>{j.company} — {j.title || j.role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search applicants by name..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* AI Analyze Applicants Panel */}
            <div className="border border-violet-500/20 bg-violet-500/5 dark:bg-violet-950/10 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <Brain className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-heading font-bold text-base flex items-center gap-1.5 text-foreground">
                                AI Analyze Applicants
                                <Badge className="bg-violet-600 text-white text-[9px] uppercase font-bold py-0.5 px-1.5 rounded">Beta</Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground">Intelligent screening, custom skill ranking & profile insights</p>
                        </div>
                    </div>
                    
                    <Button
                        type="button"
                        onClick={() => {
                            setAiAnalyzerActive(!aiAnalyzerActive);
                            if (aiAnalyzerActive) {
                                // Reset analyzer states when closing
                                setActiveChips([]);
                                setCustomSkillQuery('');
                                setMinCgpaFilter(null);
                                setGradYearFilter('all');
                                setBranchFilter('all');
                                setPlacementFilter('all');
                                setSortBy('match');
                            }
                        }}
                        className={cn(
                            "h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2",
                            aiAnalyzerActive 
                                ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/25" 
                                : "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/10"
                        )}
                    >
                        <Zap className="w-4 h-4" />
                        {aiAnalyzerActive ? "Disable AI Analyzer" : "Enable AI Analyzer"}
                    </Button>
                </div>

                {aiAnalyzerActive && (
                    <div className="mt-5 pt-4 border-t border-violet-500/10 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                        {/* Custom skill search, sort & academic filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Skill Search</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="e.g. Docker, Vue..."
                                        value={customSkillQuery}
                                        onChange={e => setCustomSkillQuery(e.target.value)}
                                        className="pl-8 h-8 text-xs bg-background/50 border-violet-500/25 focus-visible:ring-violet-500/30"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort Candidates By</label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-violet-500/25">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-violet-500/20 text-foreground">
                                        <SelectItem value="match">Best Profile Match</SelectItem>
                                        <SelectItem value="cgpa">Highest CGPA</SelectItem>
                                        <SelectItem value="skills">Most Relevant Skills</SelectItem>
                                        <SelectItem value="projects">Most Projects</SelectItem>
                                        <SelectItem value="certs">Most Certifications</SelectItem>
                                        <SelectItem value="experience">Most Experience</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Academic Filters (CGPA)</label>
                                <Select 
                                    value={minCgpaFilter === null ? 'all' : String(minCgpaFilter)} 
                                    onValueChange={v => setMinCgpaFilter(v === 'all' ? null : Number(v))}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-violet-500/25">
                                        <SelectValue placeholder="CGPA Requirement" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-violet-500/20 text-foreground">
                                        <SelectItem value="all">Any CGPA</SelectItem>
                                        <SelectItem value="9">{"CGPA >= 9.0"}</SelectItem>
                                        <SelectItem value="8">{"CGPA >= 8.0"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Branch</label>
                                <Select value={branchFilter} onValueChange={setBranchFilter}>
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-violet-500/25">
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-violet-500/20 text-foreground">
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {BRANCHES.filter(b => b !== 'all').map(b => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Graduation & Placement select boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Graduation Year</label>
                                <Select value={gradYearFilter} onValueChange={setGradYearFilter}>
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-violet-500/25">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-violet-500/20 text-foreground">
                                        <SelectItem value="all">All Years</SelectItem>
                                        {GRAD_YEARS.filter(y => y !== 'all').map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Placement Status</label>
                                <Select value={placementFilter} onValueChange={setPlacementFilter}>
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-violet-500/25">
                                        <SelectValue placeholder="Select Placement" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-violet-500/20 text-foreground">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="not_placed">Seeking Placement</SelectItem>
                                        <SelectItem value="placed">Placed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Interactive Quick Chips Row */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Filters</label>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_CHIPS.map(chip => {
                                    const isActive = activeChips.includes(chip);
                                    return (
                                        <button
                                            type="button"
                                            key={chip}
                                            onClick={() => {
                                                if (isActive) {
                                                    setActiveChips(activeChips.filter(c => c !== chip));
                                                } else {
                                                    setActiveChips([...activeChips, chip]);
                                                }
                                            }}
                                            className={cn(
                                                "text-xs px-3 py-1 rounded-full border transition-all duration-200 font-medium select-none cursor-pointer",
                                                isActive
                                                    ? "bg-violet-600 border-transparent text-white font-extrabold shadow-[0_0_8px_rgba(109,40,217,0.3)] scale-105"
                                                    : "bg-background hover:bg-muted border-violet-500/20 hover:border-violet-500/30 text-foreground"
                                            )}
                                        >
                                            {chip}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recruiter Insights Block */}
                        <div className="bg-violet-500/5 dark:bg-violet-950/20 border border-violet-500/10 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin duration-3000" />
                                AI Recruit Insights (Total Candidate Pool)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className="text-foreground">{cgpa9Count}</strong> candidate{cgpa9Count !== 1 ? 's have' : ' has'} CGPA above 9.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className="text-foreground">{pythonCount}</strong> candidate{pythonCount !== 1 ? 's know' : ' knows'} Python.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className="text-foreground">{reactNodeCount}</strong> candidate{reactNodeCount !== 1 ? 's know' : ' knows'} React and Node.js.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className="text-foreground">{internshipCount}</strong> candidate{internshipCount !== 1 ? 's have' : ' has'} internship experience.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className="text-foreground">{mlProjectsCount}</strong> candidate{mlProjectsCount !== 1 ? 's have' : ' has'} machine learning projects.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {filtered.length === 0 ? (
                <Card className="border border-border/40 bg-card backdrop-blur-md">
                    <CardContent className="p-12 text-center text-muted-foreground">
                        <p>No applications yet for this job</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 animate-stagger">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{filtered.length} applicant{filtered.length > 1 ? 's' : ''} found</span>
                    </p>
                    {filtered.map(app => {
                        const student = app.students;
                        const initials = student?.name 
                            ? student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
                            : '?';
                        const resumeUrl = app.application_form?.resumeUrl || student?.resume_url;
                        
                        return (
                            <div 
                                key={app.id} 
                                className="group relative rounded-xl border border-border/40 bg-card hover:bg-muted/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 backdrop-blur-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20"
                            >
                                {/* Left Panel: Avatar & Info */}
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div className="relative">
                                        <Avatar 
                                            className="w-14 h-14 rounded-2xl border border-border/60 shadow-md cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40" 
                                            onClick={() => setViewApp(app)}
                                        >
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-200 font-bold text-lg rounded-2xl">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center shadow",
                                            app.status === 'selected' ? 'bg-emerald-500' :
                                            app.status === 'rejected' ? 'bg-rose-500' :
                                            app.status === 'shortlisted' ? 'bg-blue-500' :
                                            app.status === 'withdrawn' ? 'bg-slate-500' : 'bg-amber-500'
                                        )} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 
                                                className="font-bold text-lg hover:text-primary transition-colors cursor-pointer leading-none text-foreground"
                                                onClick={() => setViewApp(app)}
                                            >
                                                {student?.name || 'Unknown'}
                                            </h3>
                                            {aiAnalyzerActive && student && (
                                                <Badge className="bg-violet-600 dark:bg-violet-800 hover:bg-violet-700 text-white font-extrabold text-[10px] flex items-center gap-1 py-0.5 rounded-full select-none">
                                                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                                    {calculateMatchScore(student)}% Match
                                                </Badge>
                                            )}
                                            {student?.current_year && (
                                                <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-muted border-border text-muted-foreground tracking-wider">
                                                    Year {student.current_year}
                                                </Badge>
                                            )}
                                        </div>

                                        {selectedJob === 'all' && (
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                                                <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <span className="truncate">
                                                    Applied for: {app.jobs?.company} — <span className="text-primary">{app.jobs?.title || app.jobs?.role}</span>
                                                </span>
                                            </div>
                                        )}

                                        {/* Student Metadata Row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-0.5">
                                            {student?.branch && (
                                                <span className="flex items-center gap-1.5 bg-muted border border-border px-2 py-0.5 rounded-md">
                                                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                                    {student.branch}
                                                </span>
                                            )}
                                            {student?.cgpa !== undefined && (
                                                <span className="flex items-center gap-1.5 bg-muted border border-border px-2 py-0.5 rounded-md">
                                                    <Award className="w-3.5 h-3.5 text-amber-500" />
                                                    CGPA: <span className="font-semibold text-foreground">{student.cgpa}</span>
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 text-muted-foreground/80">
                                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                Applied {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* AI Resume Intelligence & Skills Row */}
                                        {aiAnalyzerActive && student && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {hasInternship(student) && (
                                                        <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5 font-bold py-0.5 px-2 rounded-full">
                                                            💼 Internship Experience
                                                        </Badge>
                                                    )}
                                                    {(student.projects || []).length > 0 && (
                                                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 font-bold py-0.5 px-2 rounded-full">
                                                            🚀 {(student.projects || []).length} Project{(student.projects || []).length > 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {(student.certificates || []).length > 0 && (
                                                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-bold py-0.5 px-2 rounded-full">
                                                            🏆 {(student.certificates || []).length} Certification{(student.certificates || []).length > 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {hasOpenSource(student) && (
                                                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-bold py-0.5 px-2 rounded-full">
                                                            🌐 Open Source
                                                        </Badge>
                                                    )}
                                                    {hasCompetitiveProgramming(student) && (
                                                        <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 font-bold py-0.5 px-2 rounded-full">
                                                            💻 CP / DSA
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {[
                                                        ...(student.skills || []),
                                                        ...(student.ai_profile?.extracted_skills || []),
                                                        ...(student.ai_profile?.extracted_technologies || [])
                                                    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8).map(skill => {
                                                        const isMatch = (customSkillQuery.trim() && skill.toLowerCase().includes(customSkillQuery.toLowerCase().trim())) || 
                                                            activeChips.some(c => skill.toLowerCase().includes(c.toLowerCase()) || (c === 'Machine Learning' && skill.toLowerCase().includes('machine learning')));
                                                        return (
                                                            <Badge 
                                                                key={skill} 
                                                                variant={isMatch ? 'default' : 'outline'} 
                                                                className={cn(
                                                                    "text-[10px] px-1.5 py-0.5 transition-all duration-200", 
                                                                    isMatch ? "bg-violet-600 hover:bg-violet-700 text-white font-extrabold border-transparent shadow-[0_0_8px_rgba(109,40,217,0.3)] scale-105" : "text-muted-foreground/80"
                                                                )}
                                                            >
                                                                {skill}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Panel: Controls & Actions */}
                                <div className="flex flex-col items-stretch sm:items-end md:items-end lg:items-end gap-3 flex-shrink-0">
                                    {/* Progress Tracker */}
                                    {renderProgressTracker(app.status)}

                                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-end lg:items-center gap-3">
                                        {/* Premium Status Selector */}
                                        {(() => {
                                            const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                                            
                                            return (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={cn(
                                                                "h-9 px-3.5 rounded-2xl bg-background border hover:bg-muted transition-all duration-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg hover:shadow-indigo-500/5 select-none w-full sm:w-[160px] cursor-pointer",
                                                                config.border
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className={cn("w-2 h-2 rounded-full shrink-0 animate-pulse", config.dot)} />
                                                                <span className={cn("truncate font-black tracking-tight", config.text)}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-popover border border-border backdrop-blur-lg rounded-2xl shadow-2xl p-2 w-[180px] z-[100] animate-in fade-in duration-200">
                                                        <div className="text-[10px] font-bold tracking-wider text-muted-foreground/50 uppercase px-2.5 py-1.5 select-none border-b border-border mb-1.5">
                                                            Update Status
                                                        </div>
                                                        {Object.entries(STATUS_CONFIG)
                                                            .filter(([key]) => key !== 'under_review')
                                                            .map(([key, item]) => {
                                                                const isSelected = app.status === key || (key === 'applied' && app.status === 'under_review');
                                                                const ItemIcon = item.icon;
                                                                
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={key}
                                                                        onClick={() => updateStatus(app.id, key)}
                                                                        className={cn(
                                                                            "flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer focus:bg-accent focus:text-accent-foreground dark:focus:bg-white/5 dark:focus:text-white group mb-0.5 last:mb-0",
                                                                            isSelected ? "bg-primary/10 text-primary dark:bg-white/5 dark:text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:text-white"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className={cn(
                                                                                "w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-150 shrink-0",
                                                                                isSelected ? "bg-primary/5 border-primary/20 dark:bg-white/5 dark:border-white/10" : "bg-transparent border-transparent"
                                                                            )}>
                                                                                <ItemIcon className={cn("w-3.5 h-3.5", isSelected ? item.text : "text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-slate-200")} />
                                                                            </div>
                                                                            <span className={cn(
                                                                                "truncate",
                                                                                isSelected && "font-bold"
                                                                            )}>
                                                                                {item.label}
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            );
                                        })()}

                                        {/* Action Buttons */}
                                        {resumeUrl && (
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    type="button"
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="flex-1 sm:flex-initial h-9 px-3.5 bg-background dark:bg-slate-950/40 border border-border dark:border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200 text-xs font-medium text-foreground"
                                                    onClick={() => {
                                                        handleOpenPreview(resumeUrl, student?.name || 'Candidate');
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                    Preview
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-9 w-9 bg-background dark:bg-slate-950/40 border border-border dark:border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 transition-all duration-200 text-muted-foreground"
                                                    asChild
                                                    title="Download Resume"
                                                >
                                                    <a href={resumeUrl} download={`${student?.name || 'candidate'}_resume.pdf`} target="_blank" rel="noopener noreferrer">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={!!viewApp} onOpenChange={(o) => (!o ? setViewApp(null) : null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-foreground">{viewApp?.students?.name}'s Application Form</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Applied for: {viewApp?.jobs?.company} — {viewApp?.jobs?.title || viewApp?.jobs?.role}
                        </DialogDescription>
                    </DialogHeader>

                    <Separator className="my-2 bg-border" />

                    <ScrollArea className="flex-1 -mx-6 px-6">
                        {viewApp?.application_form && Object.keys(viewApp.application_form).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                                {Object.entries(viewApp.application_form).map(([key, value]) => {
                                    // Formatting camelCase to regular words
                                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    
                                    let contentElement = <p className="text-sm text-foreground">{String(value) || '—'}</p>;
                                    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
                                        contentElement = (
                                            <a 
                                                href={value} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 break-all font-medium"
                                            >
                                                {value}
                                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                            </a>
                                        );
                                    } else if (typeof value === 'string' && value.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                        contentElement = (
                                            <a 
                                                href={`mailto:${value}`}
                                                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 break-all font-medium"
                                            >
                                                {value}
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            </a>
                                        );
                                    } else if (key.toLowerCase().includes('key') && typeof value === 'string' && value.length > 20) {
                                        contentElement = (
                                            <code className="text-xs font-mono bg-muted/60 border border-border/40 px-2 py-1 rounded block select-all break-all text-foreground">
                                                {value}
                                            </code>
                                        );
                                    }

                                    return (
                                        <div key={key} className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{formattedKey}</p>
                                            <div className="pt-0.5">
                                                {contentElement}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <p>No detailed application form was submitted.</p>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Resume Preview Dialog */}
            <Dialog 
                open={!!previewResumeUrl} 
                onOpenChange={(o) => {
                    if (!o) {
                        handleClosePreview();
                    }
                }}
            >
                <DialogContent className={cn(
                    "transition-all duration-300 select-none [&>button]:hidden",
                    isFullscreen
                        ? "w-screen h-screen max-w-none m-0 rounded-none border-0 p-4 flex flex-col bg-background dark:bg-slate-950 text-foreground dark:text-slate-100 z-[100]"
                        : "max-w-4xl w-[95vw] max-h-[90vh] h-[85vh] flex flex-col p-4 bg-card border-border dark:bg-slate-900 dark:border-white/10 backdrop-blur-md rounded-xl shadow-2xl text-foreground dark:text-slate-100"
                )}>
                    {/* Dialog title/description for accessibility */}
                    <div className="sr-only">
                        <DialogTitle>Resume Preview: {previewResumeName}</DialogTitle>
                        <DialogDescription>Interactive PDF Resume viewer with zoom controls</DialogDescription>
                    </div>

                    {/* Toolbar Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border dark:border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            <h3 className="font-bold text-base truncate max-w-[150px] sm:max-w-xs text-foreground dark:text-slate-100">{previewResumeName}'s Resume</h3>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 text-[10px] uppercase font-bold py-0.5 tracking-wide">PDF</Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Zoom Controls */}
                            <div className="flex items-center bg-muted dark:bg-slate-950/60 rounded-lg p-0.5 border border-border dark:border-white/10">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5"
                                    onClick={() => setPreviewZoom(z => Math.max(50, z - 25))}
                                    disabled={previewZoom <= 50}
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-mono font-bold px-2 min-w-[45px] text-center text-foreground dark:text-slate-300">{previewZoom}%</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5"
                                    onClick={() => setPreviewZoom(z => Math.min(200, z + 25))}
                                    disabled={previewZoom >= 200}
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                                {previewZoom !== 100 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5"
                                        onClick={() => setPreviewZoom(100)}
                                        title="Reset Zoom"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>

                            <Separator orientation="vertical" className="h-6 bg-border dark:bg-white/10 hidden sm:block" />

                            {/* Actions & Close */}
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5 rounded-lg"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5 rounded-lg"
                                    asChild
                                    title="Open in New Tab"
                                >
                                    <a href={previewResumeUrl || undefined} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5 rounded-lg"
                                    onClick={handleDownload}
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                                
                                <Separator orientation="vertical" className="h-6 bg-border dark:bg-white/10" />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                    onClick={handleClosePreview}
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* PDF Viewer Body */}
                    <div className="relative flex-1 w-full bg-muted/30 dark:bg-slate-950/40 rounded-lg border border-border/40 dark:border-white/5 overflow-hidden flex items-center justify-center mt-3">
                        {previewLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-950/80 z-10 space-y-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium">Loading preview...</p>
                            </div>
                        )}
                        {previewError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 dark:bg-slate-950/90 z-10 p-6 text-center space-y-4">
                                <XCircle className="w-12 h-12 text-rose-500 animate-pulse" />
                                <div>
                                    <p className="text-lg font-bold text-foreground dark:text-slate-100">Failed to load preview</p>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">There was an issue opening this PDF. You can open it in a new tab or download it directly.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" asChild className="bg-background border-border text-foreground hover:bg-muted dark:bg-slate-900 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">
                                        <a href={previewResumeUrl || undefined} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                                        </a>
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleDownload} className="bg-background border-border text-foreground hover:bg-muted dark:bg-slate-900 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">
                                        <Download className="w-4 h-4 mr-2" /> Download
                                    </Button>
                                </div>
                            </div>
                        )}
                        {previewBlobUrl && (
                            <div className="w-full h-full overflow-auto flex justify-center items-start p-4">
                                <div 
                                    style={{
                                        width: `${previewZoom}%`,
                                        height: `${previewZoom}%`,
                                        minHeight: '65vh'
                                    }}
                                    className="transition-all duration-200"
                                >
                                    <iframe
                                        src={`${previewBlobUrl}#toolbar=0`}
                                        className="w-full h-full border-0 rounded-md bg-white shadow-xl"
                                        onLoad={() => setPreviewLoading(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
