import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '@/context/RoleContext';
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
import { useUser } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, Users, TrendingUp, Award, ArrowRight,
    BookOpen, Calendar, CheckCircle2, Clock, Plus, UserCheck,
    MessageSquare, Sparkles, Activity, FileText, ShieldCheck, Zap,
    Trophy, Building2, Bell, Eye, ChevronRight, Target, BarChart3
} from 'lucide-react';

const AnimatedCounter = ({ value, duration = 800 }: { value: number, duration?: number }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        if (end === 0) {
            setCount(0);
            return;
        }
        const step = Math.ceil(end / (duration / 20));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 20);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{count}</span>;
};

const InteractiveDonutChart = ({ data }: { data: { name: string, value: number, color: string }[] }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
        return (
            <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-200 dark:text-zinc-800" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-semibold">
                    No active stats
                </div>
            </div>
        );
    }

    let accumulatedAngle = 0;
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
            <div className="relative h-48 w-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {data.map((item, index) => {
                        if (item.value === 0) return null;
                        const angle = (item.value / total) * 360;
                        const startAngle = accumulatedAngle;
                        const endAngle = accumulatedAngle + angle;
                        accumulatedAngle += angle;
                        
                        const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                            const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                            return {
                                x: centerX + radius * Math.cos(angleInRadians),
                                y: centerY + radius * Math.sin(angleInRadians)
                            };
                        };
                        
                        const isHovered = hoveredIndex === index;
                        const radius = isHovered ? 40 : 38;
                        const start = polarToCartesian(50, 50, radius, startAngle);
                        const end = polarToCartesian(50, 50, radius, endAngle);
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const d = [
                            "M", 50, 50,
                            "L", start.x, start.y,
                            "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y,
                            "Z"
                        ].join(" ");
                        
                        return (
                            <path
                                key={index}
                                d={d}
                                fill={item.color}
                                className="transition-all duration-300 cursor-pointer origin-center hover:brightness-105"
                                style={{
                                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                                }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="24" className="fill-card transition-colors duration-300" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {hoveredIndex !== null ? (
                        <>
                            <span className="text-xl font-black tracking-tight" style={{ color: data[hoveredIndex].color }}>
                                {Math.round((data[hoveredIndex].value / total) * 100)}%
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider truncate max-w-[85px] text-center">
                                {data[hoveredIndex].name}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-xl font-black tracking-tight">{total}</span>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                                Total
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 w-full space-y-2">
                {data.map((item, index) => {
                    const percentage = Math.round((item.value / total) * 100);
                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-all duration-200 ${
                                hoveredIndex === index
                                    ? 'bg-muted border-border'
                                    : 'hover:bg-muted/40'
                            }`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-3 h-3 rounded flex-shrink-0 transition-transform duration-200" style={{ backgroundColor: item.color, transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)' }} />
                                <span className={`text-[11px] font-semibold truncate transition-colors duration-200 ${hoveredIndex === index ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="font-bold text-foreground">{item.value}</span>
                                <span className="text-muted-foreground/60">({percentage}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { role, roleData } = useRole();
    const { user } = useUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalJobs: 0, activeJobs: 0, applications: 0, placed: 0, totalStudents: 0,
        appsThisMonth: 0, interviews: 0, offers: 0, connections: 0
    });
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [recApps, setRecApps] = useState<any[]>([]);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                if (role === 'recruiter') {
                    const companyName = getRecruiterCompanyName(roleData);
                    const { data: recJobs } = await insforge.database
                        .from('jobs')
                        .select('*')
                        .eq('company', companyName);
                    
                    const activeJobsCount = (recJobs || []).filter(j => j.status === 'active').length;
                    const jobIds = (recJobs || []).map(j => j.id);
                    
                    let recApps: any[] = [];
                    if (jobIds.length > 0) {
                        const { data: appsData } = await insforge.database
                            .from('job_applications')
                            .select('*, students(*), jobs(*)')
                            .in('job_id', jobIds)
                            .order('created_at', { ascending: false });
                        recApps = appsData || [];
                    }
                    
                    const totalApplicants = recApps.length;
                    const shortlisted = recApps.filter(a => a.status === 'shortlisted' || a.status === 'under_review').length;
                    const offersSent = recApps.filter(a => a.status === 'selected' || a.status === 'accepted').length;
                    
                    setStats({
                        totalJobs: recJobs?.length || 0,
                        activeJobs: activeJobsCount,
                        applications: totalApplicants,
                        placed: offersSent,
                        totalStudents: 0,
                        appsThisMonth: recApps.filter(a => {
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return new Date(a.created_at) >= thirtyDaysAgo;
                        }).length,
                        interviews: shortlisted,
                        offers: offersSent,
                        connections: 0
                    });
                    
                    setRecentJobs((recJobs || []).slice(0, 5));
                    setRecApps((recApps || []).slice(0, 5));
                    
                    const statusCounts = {
                        pending: recApps.filter(a => a.status === 'pending' || a.status === 'under_review').length,
                        shortlisted: recApps.filter(a => a.status === 'shortlisted' || a.status === 'interview_scheduled').length,
                        selected: recApps.filter(a => a.status === 'selected' || a.status === 'accepted').length,
                        rejected: recApps.filter(a => a.status === 'rejected').length,
                        withdrawn: recApps.filter(a => a.status === 'withdrawn').length,
                    };
                    const hasApps = recApps.length > 0;
                    setPieData([
                        { name: 'Applied', value: hasApps ? statusCounts.pending : 0, color: '#3B82F6' },
                        { name: 'Shortlisted', value: hasApps ? statusCounts.shortlisted : 0, color: '#06B6D4' },
                        { name: 'Selected', value: hasApps ? statusCounts.selected : 0, color: '#10B981' },
                        { name: 'Rejected', value: hasApps ? statusCounts.rejected : 0, color: '#EF4444' },
                        { name: 'Withdrawn', value: hasApps ? statusCounts.withdrawn : 0, color: '#8B5CF6' },
                    ]);
                    
                    const activities = recApps.slice(0, 5).map(app => {
                        const studentName = app.students?.name || 'A candidate';
                        const time = new Date(app.created_at);
                        return {
                            title: `${studentName} applied for ${app.jobs?.title || 'Job'}`,
                            time,
                            icon: Briefcase,
                            color: 'text-blue-500 bg-blue-500/10'
                        };
                    });
                    
                    if (activities.length === 0) {
                        setRecentActivities([
                            { title: 'Welcome to your Recruitment Portal! 👋', timeLabel: 'Just now', icon: Sparkles, color: 'text-indigo-500 bg-indigo-500/10' },
                        ]);
                    } else {
                        const formatted = activities.map(act => {
                            const diff = Math.floor((new Date().getTime() - act.time.getTime()) / 1000);
                            let timeLabel = '';
                            if (diff < 60) timeLabel = 'just now';
                            else if (diff < 3600) timeLabel = `${Math.floor(diff / 60)}m ago`;
                            else if (diff < 86400) timeLabel = `${Math.floor(diff / 3600)}h ago`;
                            else timeLabel = act.time.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            return {
                                title: act.title,
                                timeLabel,
                                icon: act.icon,
                                color: act.color,
                            };
                        });
                        setRecentActivities(formatted);
                    }
                    setLoading(false);
                    return;
                }

                let appsQuery = insforge.database.from('job_applications').select('*, jobs(title, company), students(name)', { count: 'exact' });
                let connQuery = insforge.database.from('referral_requests').select('*, students(name)', { count: 'exact' });
                let dsaProgressQuery = insforge.database.from('dsa_progress').select('*, dsa_questions(title), students(name)');

                let recentJobsQuery = insforge.database.from('jobs').select('*').eq('status', 'active');

                if (role === 'student' && roleData?.id) {
                    appsQuery = appsQuery.eq('student_id', roleData.id);
                    connQuery = connQuery.eq('student_id', roleData.id);
                    dsaProgressQuery = dsaProgressQuery.eq('student_id', roleData.id);
                    
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    recentJobsQuery = recentJobsQuery.gte('application_deadline', todayStart.toISOString());
                }

                const [jobsRes, appsRes, studentsRes, recentJobsRes, connRes, dsaRes, skillsRes, projectsRes, certificatesRes] = await Promise.all([
                    insforge.database.from('jobs').select('*', { count: 'exact' }),
                    appsQuery,
                    insforge.database.from('students').select('*', { count: 'exact' }),
                    recentJobsQuery.order('created_at', { ascending: false }).limit(5),
                    connQuery,
                    dsaProgressQuery.order('created_at', { ascending: false }).limit(5),
                    role === 'student' && roleData?.id
                        ? insforge.database.from('student_skills').select('*').eq('student_id', roleData.id)
                        : Promise.resolve({ data: null, error: null }),
                    role === 'student' && roleData?.id
                        ? insforge.database.from('student_projects').select('*').eq('student_id', roleData.id)
                        : Promise.resolve({ data: null, error: null }),
                    role === 'student' && roleData?.id
                        ? insforge.database.from('student_certificates').select('*').eq('student_id', roleData.id)
                        : Promise.resolve({ data: null, error: null })
                ]);

                console.log("Dashboard fetch results:", {
                    jobs: { data: jobsRes.data, error: jobsRes.error },
                    apps: { data: appsRes.data, error: appsRes.error },
                    students: { data: studentsRes.data, error: studentsRes.error },
                    recentJobs: { data: recentJobsRes.data, error: recentJobsRes.error },
                    connections: { data: connRes.data, error: connRes.error },
                    dsa: { data: dsaRes.data, error: dsaRes.error }
                });

                const activeJobsCount = (jobsRes.data || []).filter((j: any) => j.status === 'active').length;
                const studentsData = studentsRes.data || [];
                const placedStudents = studentsData.filter((s: any) => s.placement_status === 'placed').length;

                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const appsData = appsRes.data || [];
                const appsThisMonth = appsData.filter((app: any) => new Date(app.created_at) >= thirtyDaysAgo).length;
                const interviews = appsData.filter((app: any) => app.status === 'shortlisted').length;
                const offers = appsData.filter((app: any) => app.status === 'selected').length;
                const connections = connRes.count || 0;

                setStats({
                    totalJobs: jobsRes.count || 0,
                    activeJobs: activeJobsCount || 0,
                    applications: appsRes.count || 0,
                    placed: placedStudents,
                    totalStudents: studentsData.length,
                    appsThisMonth,
                    interviews,
                    offers,
                    connections
                });

                if (recentJobsRes.data && recentJobsRes.data.length > 0) {
                    setRecentJobs(recentJobsRes.data);
                } else {
                    setRecentJobs([]);
                }

                // Populate pie chart
                const statusCounts = {
                    pending: appsData.filter((a: any) => a.status === 'pending').length,
                    shortlisted: appsData.filter((a: any) => a.status === 'shortlisted').length,
                    selected: appsData.filter((a: any) => a.status === 'selected').length,
                    rejected: appsData.filter((a: any) => a.status === 'rejected').length,
                    withdrawn: appsData.filter((a: any) => a.status === 'withdrawn').length,
                };
                const hasApps = appsData.length > 0;
                setPieData([
                    { name: 'Pending', value: hasApps ? statusCounts.pending : 12, color: '#3B82F6' },
                    { name: 'Shortlisted', value: hasApps ? statusCounts.shortlisted : 5, color: '#06B6D4' },
                    { name: 'Selected', value: hasApps ? statusCounts.selected : 3, color: '#10B981' },
                    { name: 'Rejected', value: hasApps ? statusCounts.rejected : 4, color: '#EF4444' },
                    { name: 'Withdrawn', value: hasApps ? statusCounts.withdrawn : 2, color: '#8B5CF6' },
                ]);

                // Populate Activity timeline
                const activities: any[] = [];
                appsData.forEach((app: any) => {
                    const studentPrefix = role === 'admin' && app.students?.name ? `${app.students.name} ` : '';
                    activities.push({
                        title: `${studentPrefix}applied to ${app.jobs?.title || 'Job'} at ${app.jobs?.company || 'Company'}`,
                        time: new Date(app.created_at),
                        icon: Briefcase,
                        color: 'text-blue-500 bg-blue-500/10'
                    });
                });

                const dsaData = dsaRes.data || [];
                dsaData.forEach((dsa: any) => {
                    const studentPrefix = role === 'admin' && dsa.students?.name ? `${dsa.students.name} ` : '';
                    activities.push({
                        title: `${studentPrefix}solved DSA Question: ${dsa.dsa_questions?.title || 'Problem'}`,
                        time: new Date(dsa.created_at),
                        icon: CheckCircle2,
                        color: 'text-emerald-500 bg-emerald-500/10'
                    });
                });

                const connData = connRes.data || [];
                connData.forEach((conn: any) => {
                    const studentPrefix = role === 'admin' && conn.students?.name ? `${conn.students.name} ` : '';
                    activities.push({
                        title: `${studentPrefix}requested referral from Alumni Mentor`,
                        time: new Date(conn.created_at),
                        icon: UserCheck,
                        color: 'text-purple-500 bg-purple-500/10'
                    });
                });

                activities.sort((a, b) => b.time.getTime() - a.time.getTime());

                if (activities.length === 0) {
                    setRecentActivities([
                        { title: 'Welcome to Placify! 👋', timeLabel: 'Just now', icon: Sparkles, color: 'text-indigo-500 bg-indigo-500/10' },
                        { title: 'Profile verification details approved', timeLabel: '2 days ago', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
                        { title: 'Connected with Mentor: SDE @ Dell', timeLabel: '3 days ago', icon: UserCheck, color: 'text-purple-500 bg-purple-500/10' },
                        { title: 'Saved Microsoft Software Engineer Internship', timeLabel: '5 days ago', icon: Briefcase, color: 'text-blue-500 bg-blue-500/10' },
                        { title: 'Resume uploaded and analyzed by ATS cell', timeLabel: '1 week ago', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
                    ]);
                } else {
                    const formatted = activities.slice(0, 5).map(act => {
                        const diff = Math.floor((new Date().getTime() - act.time.getTime()) / 1000);
                        let timeLabel = '';
                        if (diff < 60) timeLabel = 'just now';
                        else if (diff < 3600) timeLabel = `${Math.floor(diff / 60)}m ago`;
                        else if (diff < 86400) timeLabel = `${Math.floor(diff / 3600)}h ago`;
                        else timeLabel = act.time.toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return {
                            title: act.title,
                            timeLabel,
                            icon: act.icon,
                            color: act.color,
                        };
                    });
                    setRecentActivities(formatted);
                }

                if (role === 'student' && roleData?.id) {
                    const skillsData = skillsRes?.data || [];
                    const projectsData = projectsRes?.data || [];
                    const certificatesData = certificatesRes?.data || [];
                    
                    const sections = [
                        {
                            name: 'Overview',
                            isCompleted: !!(roleData?.name && roleData?.phone && roleData?.bio && roleData?.branch && roleData?.current_year && roleData?.graduation_year && roleData?.cgpa),
                        },
                        {
                            name: 'Education',
                            isCompleted: !!(roleData?.education?.class10?.school_name && roleData?.education?.class12?.school_name && roleData?.education?.college?.college_name),
                        },
                        {
                            name: 'Skills',
                            isCompleted: skillsData.length > 0,
                        },
                        {
                            name: 'Projects',
                            isCompleted: projectsData.length > 0,
                        },
                        {
                            name: 'Work Experience',
                            isCompleted: Array.isArray(roleData?.experience) && roleData.experience.length > 0,
                        },
                        {
                            name: 'Certificates',
                            isCompleted: certificatesData.length > 0,
                        },
                        {
                            name: 'Resume',
                            isCompleted: !!roleData?.resume_url,
                        }
                    ];

                    const completedCount = sections.filter(s => s.isCompleted).length;
                    const totalCount = sections.length;
                    const percentage = Math.round((completedCount / totalCount) * 100);

                    const dismissed = sessionStorage.getItem('placify_onboarding_dismissed');
                    if (percentage === 0 || (percentage < 50 && !dismissed)) {
                        setShowOnboardingModal(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [role, roleData]);

    const statCards = role === 'admin' ? [
        { label: 'Total Students', value: stats.totalStudents, icon: Users, gradient: 'from-blue-500 to-indigo-500', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/admin/students' },
        { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, gradient: 'from-emerald-500 to-teal-500', color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/jobs' },
        { label: 'Applications', value: stats.applications, icon: BookOpen, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/admin/applicants' },
        { label: 'Students Placed', value: stats.placed, icon: Award, gradient: 'from-amber-500 to-orange-500', color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/admin/students?filter=placed' },
    ] : [
        { label: 'Open Positions', value: stats.activeJobs, icon: Briefcase, gradient: 'from-blue-500 to-indigo-500', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/jobs' },
        { label: 'My Applications', value: stats.applications, icon: BookOpen, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/my-applications' },
        { label: 'Total Companies', value: stats.totalJobs, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/jobs' },
        { label: 'Placement Rate', value: stats.totalStudents > 0 ? `${Math.round((stats.placed / stats.totalStudents) * 100)}%` : '0%', icon: Award, gradient: 'from-amber-500 to-orange-500', color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/alumni' },
    ];

    const quickActions = role === 'admin' ? [
        { title: 'Post a New Job', desc: 'Create a new on-campus or off-campus job posting.', icon: Briefcase, path: '/admin/post-job', gradient: 'from-blue-500 to-indigo-500' },
        { title: 'Manage Students', desc: 'View student profiles, resumes, and tracking.', icon: Users, path: '/admin/students', gradient: 'from-purple-500 to-pink-500' },
        { title: 'View Analytics', desc: 'Analyze placement trends and platform usage.', icon: TrendingUp, path: '/admin/analytics', gradient: 'from-emerald-500 to-teal-500' },
        { title: 'Review Applications', desc: 'Track and update student application statuses.', icon: BookOpen, path: '/admin/applicants', gradient: 'from-amber-500 to-orange-500' },
        { title: 'Manage Off-Campus', desc: 'Approve, reject, or moderate off-campus opportunities.', icon: Briefcase, path: '/admin/off-campus', gradient: 'from-rose-500 to-red-500' },
        { title: 'Post Off-Campus Job', desc: 'Directly publish a new off-campus opportunity.', icon: Plus, path: '/admin/off-campus', state: { openCreate: true }, gradient: 'from-cyan-500 to-blue-500' },
        { title: 'Mentor Verification', desc: 'Review applications and verify alumni mentor documents.', icon: UserCheck, path: '/admin/mentor-verification', gradient: 'from-violet-500 to-indigo-500' },
    ] : [
        { title: 'Explore OffCampus Jobs', desc: 'Search and apply to verified off-campus opportunities.', icon: Briefcase, path: '/off-campus', gradient: 'from-blue-500 to-indigo-500' },
        { title: 'Build My Resume', desc: 'Create an ATS-friendly professional resume.', icon: FileText, path: '/resume-builder', gradient: 'from-purple-500 to-pink-500' },
        { title: 'Browse Mentors', desc: 'Connect with alumni mentors and verify guides.', icon: Users, path: '/alumni', gradient: 'from-emerald-500 to-teal-500' },
        { title: 'Discussion Forum', desc: 'Ask questions, share advice, and talk with peers.', icon: MessageSquare, path: '/forum', gradient: 'from-amber-500 to-orange-500' },
        { title: 'DSA Practice Sheets', desc: 'Solve company-wise curated list of problems.', icon: CheckCircle2, path: '/dsa-sheets', gradient: 'from-rose-500 to-red-500' },
        { title: 'Interactive Simulator', desc: 'Run and test code using our built-in simulator.', icon: Zap, path: '/code-simulator', gradient: 'from-cyan-500 to-blue-500' },
    ];

    const placementPercent = stats.totalStudents > 0 ? Math.round((stats.placed / stats.totalStudents) * 100) : 0;
    const userName = roleData?.name || user?.email?.split('@')[0] || 'User';

    const getCompanyColor = (companyName: string) => {
        const colors = [
            'from-blue-500 to-indigo-500',
            'from-purple-500 to-pink-500',
            'from-emerald-500 to-teal-500',
            'from-amber-500 to-orange-500',
            'from-rose-500 to-red-500',
            'from-cyan-500 to-blue-500',
        ];
        let hash = 0;
        for (let i = 0; i < companyName.length; i++) {
            hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // ─── RECRUITER DASHBOARD (dedicated early return) ──────────────────────────
    if (role === 'recruiter') {
        const companyName = getRecruiterCompanyName(roleData);
        let companyInfo: any = {};
        try {
            if (roleData?.company?.trim().startsWith('{')) {
                companyInfo = JSON.parse(roleData.company);
            }
        } catch (_) {}

        const recruiterStatCards = [
            {
                label: 'Active Jobs',
                value: stats.activeJobs,
                subLabel: `${stats.totalJobs} total posted`,
                icon: Briefcase,
                gradient: 'from-blue-500 to-indigo-600',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                path: '/jobs',
            },
            {
                label: 'Total Applicants',
                value: stats.applications,
                subLabel: `${stats.appsThisMonth} in last 30 days`,
                icon: Users,
                gradient: 'from-violet-500 to-purple-600',
                color: 'text-violet-500',
                bg: 'bg-violet-500/10',
                border: 'border-violet-500/20',
                path: '/admin/applicants',
            },
            {
                label: 'Shortlisted',
                value: stats.interviews,
                subLabel: stats.applications > 0 ? `${Math.round((stats.interviews / stats.applications) * 100)}% conversion` : '0% conversion',
                icon: UserCheck,
                gradient: 'from-cyan-500 to-teal-600',
                color: 'text-cyan-500',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/20',
                path: '/admin/applicants',
            },
            {
                label: 'Offers Sent',
                value: stats.offers,
                subLabel: stats.applications > 0 ? `${Math.round((stats.offers / stats.applications) * 100)}% offer rate` : '0% offer rate',
                icon: Trophy,
                gradient: 'from-emerald-500 to-green-600',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                path: '/admin/applicants',
            },
        ];

        const getStatusBadge = (status: string) => {
            const map: Record<string, { label: string; cls: string }> = {
                pending:     { label: 'Applied',      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                under_review:{ label: 'Applied',      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                shortlisted: { label: 'Shortlisted',  cls: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
                interview_scheduled: { label: 'Interviewing', cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
                selected:    { label: 'Selected',     cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                accepted:    { label: 'Selected',     cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                rejected:    { label: 'Rejected',     cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
                withdrawn:   { label: 'Withdrawn',    cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
            };
            return map[status] || { label: status, cls: 'bg-muted text-muted-foreground border-border' };
        };

        const logoUrl = roleData?.profile_photo_url || companyInfo.logoUrl || '';
        const logoInitials = (companyName || 'CO').substring(0, 2).toUpperCase();

        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <style>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(14px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in   { animation: fadeInUp 0.45s ease-out both; }
                    .rec-card-hover    { transition: all 0.22s ease; }
                    .rec-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
                    .dark .rec-card-hover:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
                `}</style>

                {/* ── HERO SECTION ─────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[26px] border border-border/50
                    bg-gradient-to-br from-blue-600/8 via-indigo-600/6 to-violet-600/8
                    dark:from-blue-950/25 dark:via-indigo-950/20 dark:to-violet-950/25
                    p-7 lg:p-10 shadow-sm backdrop-blur-xl animate-fade-in">
                    <div className="absolute top-0 right-0 w-80 h-80 -mt-16 -mr-16 rounded-full bg-blue-500/6 blur-[90px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 -mb-12 -ml-12 rounded-full bg-violet-500/8 blur-[80px] pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Left: company info */}
                        <div className="flex items-center gap-5">
                            <div className="relative shrink-0">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={companyName} className="w-16 h-16 rounded-2xl object-contain bg-white border border-border/60 shadow-md" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                                        {logoInitials}
                                    </div>
                                )}
                                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background" title="Active" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground">
                                        {companyName || 'Your Company'}
                                    </h1>
                                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                        Recruiter Portal
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Welcome back, <span className="text-foreground font-bold">{userName}</span>{companyInfo.recruiterDesignation ? ` · ${companyInfo.recruiterDesignation}` : ''}
                                </p>
                                {companyInfo.industry && (
                                    <p className="text-xs text-muted-foreground">
                                        {companyInfo.industry}{companyInfo.headquarters ? ` · ${companyInfo.headquarters}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right: CTA buttons */}
                        <div className="flex flex-wrap gap-3 shrink-0">
                            <Button
                                onClick={() => { window.scrollTo(0, 0); navigate('/admin/post-job'); }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 px-5 rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> Post a Job
                            </Button>
                            <Button
                                onClick={() => { window.scrollTo(0, 0); navigate('/admin/applicants'); }}
                                variant="outline"
                                className="border-border/70 dark:border-white/10 hover:bg-muted font-bold h-10 px-5 rounded-xl transition-all duration-200 backdrop-blur-md"
                            >
                                <Users className="w-4 h-4 mr-1.5" /> View Applicants
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {recruiterStatCards.map((card, i) => (
                        <div
                            key={i}
                            onClick={() => { window.scrollTo(0, 0); navigate(card.path); }}
                            className={`rec-card-hover relative overflow-hidden rounded-2xl border ${card.border} bg-card/60 backdrop-blur-sm cursor-pointer p-5 space-y-3 select-none`}
                            style={{ animationDelay: `${i * 0.07}s` }}
                        >
                            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />
                            <div className="flex items-center justify-between">
                                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center border ${card.border}`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <div>
                                <p className="text-3xl font-black font-heading text-foreground tracking-tight">
                                    {loading ? '—' : <AnimatedCounter value={typeof card.value === 'number' ? card.value : 0} />}
                                </p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{card.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{card.subLabel}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MAIN GRID ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Column 1+2: Recent Jobs & Recent Applicants */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Recent Job Postings */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <Briefcase className="w-4.5 h-4.5 text-primary" /> Recent Job Postings
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => { window.scrollTo(0, 0); navigate('/jobs'); }} className="text-xs font-bold text-primary hover:text-primary/80 h-7">
                                    View All <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="px-6 pb-5">
                                {loading ? (
                                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />)}</div>
                                ) : recentJobs.length === 0 ? (
                                    <div className="text-center py-10 space-y-2">
                                        <Briefcase className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                                        <p className="text-sm text-muted-foreground font-medium">No job postings yet.</p>
                                        <Button size="sm" onClick={() => { window.scrollTo(0, 0); navigate('/admin/post-job'); }} className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-8 px-4 rounded-lg text-xs">
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Post First Job
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recentJobs.map((job: any) => {
                                            const grad = getCompanyColor(job.company || 'C');
                                            const isActive = job.status === 'active';
                                            return (
                                                <div
                                                    key={job.id}
                                                    className="rec-card-hover flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card/40 hover:bg-card/80 dark:hover:bg-zinc-800/40 cursor-pointer group"
                                                    onClick={() => { window.scrollTo(0, 0); navigate(`/jobs/${job.id}`); }}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-xs shadow shrink-0 group-hover:scale-105 transition-transform`}>
                                                            {(job.company || 'CO').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{job.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                                                                    {isActive ? 'Active' : job.status}
                                                                </span>
                                                                {job.job_type && (
                                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{job.job_type}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="hidden sm:block text-right">
                                                            <p className="text-xs font-black text-foreground">
                                                                {job.ctc ? `₹${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Competitive'}
                                                            </p>
                                                            {job.application_deadline && (
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {new Date(job.application_deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-border/60 hover:bg-primary/5 hover:border-primary/30"
                                                            onClick={e => { e.stopPropagation(); window.scrollTo(0, 0); navigate('/admin/applicants'); }}
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" /> Applicants
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Applicants */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <Users className="w-4.5 h-4.5 text-primary" /> Recent Applicants
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => { window.scrollTo(0, 0); navigate('/admin/applicants'); }} className="text-xs font-bold text-primary hover:text-primary/80 h-7">
                                    View All <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="px-6 pb-5">
                                {loading ? (
                                    <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>
                                ) : recApps.length === 0 ? (
                                    <div className="text-center py-10 space-y-1">
                                        <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                                        <p className="text-sm text-muted-foreground font-medium">No applicants yet.</p>
                                        <p className="text-xs text-muted-foreground">Applications will appear here once candidates apply.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recApps.map((app: any, idx: number) => {
                                            const sb = getStatusBadge(app.status);
                                            const name = app.students?.name || 'Candidate';
                                            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                                            const appliedAt = app.created_at ? new Date(app.created_at) : null;
                                            const timeAgo = appliedAt ? (() => {
                                                const diff = Math.floor((Date.now() - appliedAt.getTime()) / 1000);
                                                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                                                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                                                return appliedAt.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                            })() : '';
                                            const avatarGrads = ['from-violet-500 to-purple-600','from-blue-500 to-indigo-600','from-emerald-500 to-teal-600','from-orange-500 to-amber-600','from-rose-500 to-pink-600'];
                                            const avatarGrad = avatarGrads[idx % avatarGrads.length];
                                            return (
                                                <div
                                                    key={app.id || idx}
                                                    className="rec-card-hover flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/80 dark:hover:bg-zinc-800/40 cursor-pointer group"
                                                    onClick={() => { window.scrollTo(0, 0); navigate('/admin/applicants'); }}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{name}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{app.jobs?.title || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${sb.cls}`}>{sb.label}</span>
                                                        <span className="text-[10px] text-muted-foreground hidden sm:block">{timeAgo}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 3: Analytics + Activity */}
                    <div className="space-y-6">

                        {/* Application Funnel */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-5 pt-5 pb-3">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <BarChart3 className="w-4.5 h-4.5 text-primary" /> Application Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                                <InteractiveDonutChart data={pieData} />
                            </CardContent>
                        </Card>

                        {/* Hiring Funnel Quick Stats */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-5 pt-5 pb-3">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <Target className="w-4.5 h-4.5 text-primary" /> Hiring Pipeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 space-y-3">
                                {[
                                    { label: 'Applied',      value: stats.applications, color: 'bg-blue-500',    pct: 100 },
                                    { label: 'Shortlisted',  value: stats.interviews,   color: 'bg-cyan-500',    pct: stats.applications > 0 ? Math.round((stats.interviews / stats.applications) * 100) : 0 },
                                    { label: 'Offers Sent',  value: stats.offers,       color: 'bg-emerald-500', pct: stats.applications > 0 ? Math.round((stats.offers / stats.applications) * 100) : 0 },
                                ].map((row, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold text-foreground">{row.label}</span>
                                            <span className="font-black text-foreground">{loading ? '—' : row.value}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${row.color} rounded-full transition-all duration-700 ease-out`}
                                                style={{ width: loading ? '0%' : `${row.pct}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-5 pt-5 pb-3">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <Activity className="w-4.5 h-4.5 text-primary" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                                {loading ? (
                                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted/50 rounded-xl animate-pulse" />)}</div>
                                ) : (
                                    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/50">
                                        {recentActivities.map((act: any, idx: number) => {
                                            const ActIcon = act.icon;
                                            return (
                                                <div key={idx} className="relative flex flex-col gap-0.5 text-xs hover:translate-x-0.5 transition-transform">
                                                    <span className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border border-background shadow-sm ${act.color}`}>
                                                        <ActIcon className="w-3 h-3" />
                                                    </span>
                                                    <div className="flex justify-between items-baseline gap-2">
                                                        <span className="font-bold text-foreground leading-snug">{act.title}</span>
                                                        <span className="text-[9px] text-muted-foreground shrink-0">{act.timeLabel}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                            <CardHeader className="px-5 pt-5 pb-3">
                                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                                    <Zap className="w-4.5 h-4.5 text-primary" /> Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 space-y-2.5">
                                {[
                                    { label: 'Post a Job', desc: 'Create a new job opening', icon: Plus, path: '/admin/post-job', gradient: 'from-blue-500 to-indigo-600' },
                                    { label: 'Manage Applicants', desc: 'Review & update statuses', icon: Users, path: '/admin/applicants', gradient: 'from-violet-500 to-purple-600' },
                                    { label: 'View All Jobs', desc: 'See your posted listings', icon: Briefcase, path: '/jobs', gradient: 'from-emerald-500 to-teal-600' },
                                ].map((action, i) => (
                                    <div
                                        key={i}
                                        onClick={() => { window.scrollTo(0, 0); navigate(action.path); }}
                                        className="rec-card-hover flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/80 dark:hover:bg-zinc-800/40 cursor-pointer group"
                                    >
                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform`}>
                                            <action.icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    // ─── END RECRUITER DASHBOARD ───────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Custom Embedded CSS */}
            <style>{`
                @keyframes gradient-bg {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-bg {
                    background-size: 200% 200%;
                    animation: gradient-bg 8s ease infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 5s ease-in-out infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.4; }
                    50% { transform: scale(1.05); opacity: 0.7; }
                    100% { transform: scale(0.95); opacity: 0.4; }
                }
                .animate-pulse-ring {
                    animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-stagger > div {
                    opacity: 0;
                    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-stagger > div:nth-child(1) { animation-delay: 0.05s; }
                .animate-stagger > div:nth-child(2) { animation-delay: 0.1s; }
                .animate-stagger > div:nth-child(3) { animation-delay: 0.15s; }
                .animate-stagger > div:nth-child(4) { animation-delay: 0.2s; }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Welcome Hero Section */}
            <div className="relative overflow-hidden rounded-[28px] border border-border/50 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-xl animate-fade-in-up">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />
                
                <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-8 space-y-6">
                        <div className="space-y-2.5">
                            <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight text-foreground">
                                Welcome back, {userName} 📈
                            </h1>
                            <p className="text-sm lg:text-base text-muted-foreground max-w-xl font-medium leading-relaxed">
                                Track applications, discover opportunities, and accelerate your career journey.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3.5">
                            {role === 'admin' ? (
                                <>
                                    <Button 
                                        onClick={() => { window.scrollTo(0, 0); navigate('/admin/post-job'); }} 
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Post Job
                                    </Button>
                                    <Button 
                                        onClick={() => { window.scrollTo(0, 0); navigate('/student-explorer'); }} 
                                        variant="outline" 
                                        className="border-border/80 dark:border-white/10 hover:bg-muted font-bold h-11 px-6 rounded-xl transition-all duration-300 backdrop-blur-md"
                                    >
                                        Explore Students
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        onClick={() => { window.scrollTo(0, 0); navigate('/jobs'); }} 
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Explore Jobs
                                    </Button>
                                    <Button 
                                        onClick={() => { window.scrollTo(0, 0); navigate('/resume-builder'); }} 
                                        variant="outline" 
                                        className="border-border/80 dark:border-white/10 hover:bg-muted font-bold h-11 px-6 rounded-xl transition-all duration-300 backdrop-blur-md"
                                    >
                                        Build Resume
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:flex md:col-span-4 justify-center items-center">
                        <div className="relative w-44 h-44 flex items-center justify-center">
                            <div className="absolute -top-2 -left-2 w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 blur-sm animate-float" style={{ animationDelay: '0s' }} />
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-sm animate-float" style={{ animationDelay: '2s' }} />
                            
                            <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-spin" style={{ animationDuration: '60s' }} />
                            <div className="absolute inset-3 rounded-full border border-dashed border-accent/25 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
                            
                            <div className="relative p-6 rounded-3xl bg-card/60 border border-white/20 dark:border-white/5 shadow-2xl backdrop-blur-xl animate-float">
                                <TrendingUp className="w-16 h-16 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger">
                {statCards.map((stat, i) => (
                    <Card 
                        key={i} 
                        className="relative overflow-hidden premium-stat-card border-none cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => {
                            if (stat.path) {
                                window.scrollTo(0, 0);
                                navigate(stat.path);
                            }
                        }}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} rounded-t-[24px]`} />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <span className="text-4xl font-black font-heading text-foreground tracking-tight shrink-0">
                                        {loading ? '—' : stat.value}
                                    </span>
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 shadow-inner`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Interactive Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Main dynamic content */}
                <div className="lg:col-span-2 space-y-6">
                    {role === 'admin' ? (
                        /* Admin Quick Actions Grid */
                        <Card className="premium-stat-card border-none p-6">
                            <CardHeader className="px-0 pt-0 pb-4">
                                <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" /> Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quickActions.map((action, i) => (
                                        <div 
                                            key={i}
                                            onClick={() => {
                                                window.scrollTo(0, 0);
                                                navigate(action.path, action.state ? { state: action.state } : undefined);
                                            }}
                                            className="p-5 rounded-2xl border border-border/50 bg-card/35 hover:bg-card/90 dark:hover:bg-zinc-800/40 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)] cursor-pointer flex items-start gap-4 group"
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${action.gradient} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                                <action.icon className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-200">{action.title}</h3>
                                                <p className="text-xs text-muted-foreground leading-normal">{action.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Student Opportunities Upgrade */
                        <Card className="premium-stat-card border-none p-6">
                            <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-primary" /> Recent Opportunities
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => { window.scrollTo(0, 0); navigate('/jobs'); }} className="text-xs font-bold text-primary hover:text-primary/80">
                                    View All <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 bg-muted/60 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : recentJobs.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">No active job listings currently found</p>
                                ) : (
                                    <div className="space-y-3.5">
                                        {recentJobs.map((job) => {
                                            const companyStyle = getCompanyColor(job.company);
                                            const initials = job.company.substring(0, 2).toUpperCase();
                                            return (
                                                <div
                                                    key={job.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/90 dark:hover:bg-zinc-800/40 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)] cursor-pointer group"
                                                    onClick={() => { window.scrollTo(0, 0); navigate(`/jobs/${job.id}`); }}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${companyStyle} flex items-center justify-center text-white font-black text-sm shadow-md transition-transform duration-300 group-hover:scale-105`}>
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors duration-200">{job.title}</p>
                                                            <p className="text-xs font-semibold text-muted-foreground truncate">{job.company}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="hidden sm:flex flex-col items-end gap-1.5">
                                                            <span className="text-xs font-black text-foreground">
                                                                {job.ctc ? `₹${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Competitive'}
                                                            </span>
                                                            <div className="flex items-center text-[10px] font-semibold text-muted-foreground bg-muted/65 px-2.5 py-0.5 rounded-full border border-border/40">
                                                                <Clock className="w-3 h-3 mr-1 text-primary/70" />
                                                                {new Date(job.application_deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge className={`uppercase text-[9px] font-black tracking-wider ${
                                                                job.job_type === 'internship' 
                                                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10' 
                                                                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/10'
                                                            }`}>
                                                                {job.job_type}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground font-semibold sm:hidden">
                                                                {job.ctc ? `₹${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Competitive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Donut Chart / Statistics Section */}
                    <Card className="premium-stat-card border-none p-6">
                        <CardHeader className="px-0 pt-0 pb-4">
                            <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" /> Application Metrics & Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <InteractiveDonutChart data={pieData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Sidebar Placement Progress & Recent Activity */}
                <div className="space-y-6">
                    {/* Platform Placement Progress Circle */}
                    <Card className="premium-stat-card border-none p-6">
                        <CardHeader className="px-0 pt-0 pb-4">
                            <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" /> Platform Placement Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-0 space-y-6">
                            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-primary/5 blur-md animate-pulse-ring" />
                                
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#3B82F6" />
                                            <stop offset="100%" stopColor="#8B5CF6" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="38"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        className="text-muted/30"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="38"
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="6.5"
                                        strokeLinecap="round"
                                        strokeDasharray="238.76"
                                        strokeDashoffset={238.76 - (238.76 * placementPercent) / 100}
                                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black font-heading bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                        {placementPercent}%
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Placed</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 pt-2">
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Students</p>
                                        <p className="text-sm font-extrabold">{stats.totalStudents}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate">Placed</p>
                                        <p className="text-sm font-extrabold text-emerald-500">{stats.placed}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate">Unplaced</p>
                                        <p className="text-sm font-extrabold text-amber-500">{Math.max(0, stats.totalStudents - stats.placed)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Jobs</p>
                                        <p className="text-sm font-extrabold text-purple-500">{stats.activeJobs}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline Activity Component */}
                    <Card className="premium-stat-card border-none p-6">
                        <CardHeader className="px-0 pt-0 pb-4">
                            <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-10 bg-muted/60 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                                    {recentActivities.map((act, idx) => {
                                        const ActIcon = act.icon;
                                        return (
                                            <div key={idx} className="relative flex flex-col gap-1 text-xs transition-all duration-200 hover:translate-x-1">
                                                <span className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border border-background shadow-sm ${act.color}`}>
                                                    <ActIcon className="w-3.5 h-3.5" />
                                                </span>
                                                <div className="flex justify-between items-baseline gap-2">
                                                    <span className="font-bold text-foreground leading-snug">{act.title}</span>
                                                    <span className="text-[9px] font-semibold text-muted-foreground shrink-0">{act.timeLabel}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Student Quick Actions Grid (rendered at bottom for student/recruiter role layout) */}
            {role !== 'admin' && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-heading font-black tracking-tight flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> Quick Actions
                        </h2>
                        <p className="text-xs text-muted-foreground">Quick access routes to platform components.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickActions.map((action, i) => (
                            <div 
                                key={i}
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                    navigate(action.path, action.state ? { state: action.state } : undefined);
                                }}
                                className={`p-5 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/90 dark:hover:bg-zinc-800/40 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)] cursor-pointer items-start gap-4 group ${action.path === '/code-simulator' ? 'hidden md:flex' : 'flex'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${action.gradient} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-200">{action.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-normal">{action.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showOnboardingModal && createPortal(
                <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
                        {/* Decorative Background Glows */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                        
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-heading font-extrabold text-white flex items-center justify-center gap-2">
                                🎉 Welcome to Placify
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed text-left">
                                Complete your profile to unlock placements, coding sheets, recruiter opportunities, and personalized recommendations.
                            </p>
                        </div>
                        
                        <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest text-left">Key Benefits</h4>
                            <ul className="space-y-2.5 text-xs text-slate-300 text-left">
                                <li className="flex items-center gap-2 font-medium">
                                    <span className="text-emerald-500 font-extrabold">✓</span> Apply for Placement Drives
                                </li>
                                <li className="flex items-center gap-2 font-medium">
                                    <span className="text-emerald-500 font-extrabold">✓</span> Build Professional Profile
                                </li>
                                <li className="flex items-center gap-2 font-medium">
                                    <span className="text-emerald-500 font-extrabold">✓</span> Get Discovered by Recruiters
                                </li>
                                <li className="flex items-center gap-2 font-medium">
                                    <span className="text-emerald-500 font-extrabold">✓</span> Access DSA Sheets
                                </li>
                                <li className="flex items-center gap-2 font-medium">
                                    <span className="text-emerald-500 font-extrabold">✓</span> Track Opportunities
                                </li>
                            </ul>
                        </div>
                        
                        <div className="flex flex-col gap-2.5 pt-2">
                            <Button
                                onClick={() => {
                                    setShowOnboardingModal(false);
                                    navigate('/profile?edit=true');
                                }}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                            >
                                Complete Profile
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowOnboardingModal(false);
                                    sessionStorage.setItem('placify_onboarding_dismissed', 'true');
                                }}
                                className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-11 rounded-xl font-semibold cursor-pointer"
                            >
                                Maybe Later
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

