import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Users, Briefcase, TrendingUp, Award, BarChart3, DollarSign, Target, Activity, CheckCircle2, FileText, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const STATUS_COLORS: Record<string, string> = {
    'Pending': '#f59e0b',
    'Under Review': '#3b82f6',
    'Shortlisted': '#8b5cf6',
    'Accepted': '#10b981',
    'Rejected': '#ef4444',
};

// Custom pie label renderer to prevent overflow
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ── Rolling number hook ──────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, decimals = 0, enabled = true) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || target === 0) {
            setDisplay(target);
            return;
        }
        setDisplay(0);
        startRef.current = null;

        const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const tick = (now: number) => {
            if (startRef.current === null) startRef.current = now;
            const elapsed = now - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setDisplay(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setDisplay(target);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, duration, decimals, enabled]);

    return display;
}
// ────────────────────────────────────────────────────────────────────

// Sub-component: animated KPI integer card
function KpiCard({ card, loading }: { card: any; loading: boolean }) {
    const animated = useCountUp(card.value, 1400, 0, !loading);
    return (
        <Card className={`card-hover ${card.bg} border-0`}>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.iconBg} ${card.color} flex-shrink-0`}>
                    {card.icon}
                </div>
                <div>
                    <p className="text-2xl font-heading font-bold tabular-nums">
                        {loading ? '—' : animated}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Sub-component: animated salary card with ₹ and 2 decimals
function SalaryCard({ label, value, color, loading }: { label: string; value: number; color: string; loading: boolean }) {
    const animated = useCountUp(value, 1600, 2, !loading);
    return (
        <Card className="card-hover">
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-3xl font-heading font-bold mt-1 tabular-nums ${color}`}>
                    {loading ? '—' : value > 0 ? `₹${animated.toFixed(2)}` : '0'}
                </p>
            </CardContent>
        </Card>
    );
}

export default function Analytics() {
    const [data, setData] = useState({
        totalStudents: 0,
        placed: 0,
        totalJobs: 0,
        totalApps: 0,
        branchWise: [] as any[],
        monthlyTrend: [] as any[],
        packages: { highest: 0, lowest: 0, average: 0, median: 0 },
        funnelData: [] as any[],
        companyHiring: [] as any[],
        statusDistribution: [] as any[],
        roundSuccess: { screening: 0, shortlisting: 0, selection: 0 },
        pendingApprovalsCount: 0
    });
    const [loading, setLoading] = useState(true);

    const PLACEMENT_GOAL = 90; // Target placement goal in %

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                // Fetch all data in parallel - scoped to on-campus jobs only
                const [studentsRes, jobsRes, appsRes] = await Promise.all([
                    insforge.database.from('students').select('*'),
                    insforge.database.from('jobs').select('*', { count: 'exact' }),
                    insforge.database.from('job_applications').select('*, jobs(*)'),
                ]);

                const students = studentsRes.data || [];
                const verifiedStudents = students.filter((s: any) => s.status === 'verified');
                const pendingCount = students.filter((s: any) => s.status === 'pending').length;
                const placed = verifiedStudents.filter((s: any) => s.placement_status === 'placed').length;
                const totalStudents = verifiedStudents.length;

                // Only on-campus jobs (jobs table = on-campus)
                const jobs = jobsRes.data || [];
                const totalJobs = jobsRes.count || jobs.length;

                // Applications are for on-campus jobs only (job_applications → jobs)
                const apps = appsRes.data || [];

                // 1. Placement Funnel (from actual DB records)
                const totalApplied = apps.length;
                const totalUnderReview = apps.filter((a: any) =>
                    ['under_review', 'shortlisted', 'accepted'].includes(a.status)
                ).length;
                const totalShortlisted = apps.filter((a: any) =>
                    ['shortlisted', 'accepted'].includes(a.status)
                ).length;
                const totalAccepted = apps.filter((a: any) => a.status === 'accepted').length;

                const funnelData = [
                    { stage: 'Total Students', count: totalStudents },
                    { stage: 'Applied', count: totalApplied },
                    { stage: 'Under Review', count: totalUnderReview },
                    { stage: 'Shortlisted', count: totalShortlisted },
                    { stage: 'Accepted', count: totalAccepted },
                ];

                // 2. Company-wise Hiring (from accepted applications on on-campus jobs)
                const companyMap: Record<string, number> = {};
                apps.forEach((app: any) => {
                    if (app.status === 'accepted') {
                        const company = app.jobs?.company || 'Unknown';
                        companyMap[company] = (companyMap[company] || 0) + 1;
                    }
                });
                const companyHiring = Object.entries(companyMap)
                    .map(([name, hires]) => ({ name, hires }))
                    .sort((a, b) => b.hires - a.hires)
                    .slice(0, 8);

                // 3. Package Analytics from on-campus jobs (CTC in LPA)
                const ctcs = jobs
                    .map((j: any) => parseFloat(j.ctc || 0))
                    .filter((ctc: number) => ctc > 0)
                    .sort((a: number, b: number) => a - b);

                const highest = ctcs.length > 0 ? Math.max(...ctcs) : 0;
                const lowest = ctcs.length > 0 ? Math.min(...ctcs) : 0;
                const average = ctcs.length > 0 ? ctcs.reduce((a: number, b: number) => a + b, 0) / ctcs.length : 0;
                const median = ctcs.length > 0 ? ctcs[Math.floor(ctcs.length / 2)] : 0;

                // 4. Application Status Distribution (actual DB statuses)
                const statusCounts: Record<string, number> = {
                    pending: 0,
                    under_review: 0,
                    shortlisted: 0,
                    accepted: 0,
                    rejected: 0,
                };
                apps.forEach((app: any) => {
                    const status = app.status || 'pending';
                    if (statusCounts.hasOwnProperty(status)) {
                        statusCounts[status]++;
                    }
                });
                const statusDistribution = Object.entries(statusCounts)
                    .map(([key, value]) => ({
                        name: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        value,
                    }))
                    .filter(item => item.value > 0);

                // 5. Workflow Progression Rates
                const roundSuccess = {
                    screening: apps.length > 0 ? Math.round((totalUnderReview / apps.length) * 100) : 0,
                    shortlisting: totalUnderReview > 0 ? Math.round((totalShortlisted / totalUnderReview) * 100) : 0,
                    selection: totalShortlisted > 0 ? Math.round((totalAccepted / totalShortlisted) * 100) : 0,
                };

                // 6. Branch-wise placement stats (from students table)
                const branchMap: Record<string, { total: number; placed: number }> = {};
                verifiedStudents.forEach((s: any) => {
                    const branch = s.branch || 'Unknown';
                    if (!branchMap[branch]) branchMap[branch] = { total: 0, placed: 0 };
                    branchMap[branch].total++;
                    if (s.placement_status === 'placed') branchMap[branch].placed++;
                });
                const branchWise = Object.entries(branchMap)
                    .map(([branch, val]) => ({ branch, ...val }))
                    .sort((a, b) => b.total - a.total);

                // 7. Monthly Trend (from job_applications created_at)
                const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyTrendMap: Record<string, { placements: number; applications: number }> = {};
                apps.forEach((app: any) => {
                    if (!app.created_at) return;
                    const date = new Date(app.created_at);
                    const monthName = date.toLocaleString('en-US', { month: 'short' });
                    if (!monthlyTrendMap[monthName]) {
                        monthlyTrendMap[monthName] = { placements: 0, applications: 0 };
                    }
                    monthlyTrendMap[monthName].applications++;
                    if (app.status === 'accepted') {
                        monthlyTrendMap[monthName].placements++;
                    }
                });
                const monthlyTrend = MONTH_ORDER
                    .filter(m => monthlyTrendMap[m])
                    .map(month => ({
                        month,
                        placements: monthlyTrendMap[month].placements,
                        applications: monthlyTrendMap[month].applications,
                    }));

                setData({
                    totalStudents, placed, totalJobs, totalApps: apps.length,
                    branchWise, monthlyTrend,
                    packages: { highest, lowest, average, median },
                    funnelData, companyHiring, statusDistribution, roundSuccess,
                    pendingApprovalsCount: pendingCount
                });
            } catch (e) {
                console.error('Error fetching analytics:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    const placementPercent = data.totalStudents > 0 ? Math.round((data.placed / data.totalStudents) * 100) : 0;
    const remainingGoal = Math.max(0, PLACEMENT_GOAL - placementPercent);

    const statCards = [
        {
            label: 'Total Students',
            value: data.totalStudents,
            icon: <Users className="w-5 h-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        },
        {
            label: 'On-Campus Jobs',
            value: data.totalJobs,
            icon: <Briefcase className="w-5 h-5" />,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40',
        },
        {
            label: 'Total Applications',
            value: data.totalApps,
            icon: <FileText className="w-5 h-5" />,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        },
        {
            label: 'Students Placed',
            value: data.placed,
            icon: <Award className="w-5 h-5" />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-heading font-bold">Placement Analytics</h1>
                <p className="text-muted-foreground mt-1">On-campus placement metrics derived from live database records</p>
            </div>

            {/* Pending Approvals Warning Banner */}
            {!loading && data.pendingApprovalsCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Action Required: Pending Approvals</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                There are <span className="font-bold">{data.pendingApprovalsCount}</span> student registration(s) waiting for your verification.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/admin/students?tab=approvals"
                        className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Review Approvals
                    </Link>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <KpiCard key={card.label} card={card} loading={loading} />
                ))}
            </div>

            {/* Placement Goal Tracker */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-[250px]">
                        <div className="p-4 bg-primary/10 rounded-full flex-shrink-0">
                            <Target className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Goal Tracker</h3>
                            <p className="text-sm text-muted-foreground">Target Placement: {PLACEMENT_GOAL}%</p>
                        </div>
                    </div>
                    <div className="flex-grow space-y-3 w-full">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-muted-foreground">Current Progress</span>
                            <div className="text-right">
                                <span className="font-bold text-2xl text-primary">{loading ? '—' : `${placementPercent}%`}</span>
                                <span className="text-sm text-muted-foreground ml-1">Placed</span>
                            </div>
                        </div>
                        <Progress value={PLACEMENT_GOAL > 0 ? (placementPercent / PLACEMENT_GOAL) * 100 : 0} className="h-3" />
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">0%</span>
                            <span className="text-amber-600 font-semibold">{remainingGoal}% Remaining</span>
                            <span className="text-emerald-600">{PLACEMENT_GOAL}% Goal</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Salary Insights */}
            <div>
                <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Salary Insights — On-Campus Jobs (LPA)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Highest Package', value: data.packages.highest, color: 'text-emerald-600' },
                        { label: 'Average Package', value: data.packages.average, color: 'text-blue-600' },
                        { label: 'Median Package', value: data.packages.median, color: 'text-purple-600' },
                        { label: 'Lowest Package', value: data.packages.lowest, color: 'text-amber-600' },
                    ].map(({ label, value, color }) => (
                        <SalaryCard key={label} label={label} value={value} color={color} loading={loading} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Placement Conversion Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 opacity-70" /> Placement Funnel
                        </CardTitle>
                        <CardDescription>Drop-off analysis: students → accepted (on-campus)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.funnelData.length === 0 || data.funnelData.every(item => item.count === 0) ? (
                            <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground text-sm font-medium">
                                No Data Available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={data.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="stage" type="category" width={115} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {data.funnelData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Application Status Distribution — Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> Application Status Distribution
                        </CardTitle>
                        <CardDescription>Live breakdown of application statuses across on-campus jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.statusDistribution.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground text-sm font-medium">
                                No Data Available
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.statusDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={65}
                                            outerRadius={105}
                                            paddingAngle={3}
                                            dataKey="value"
                                            labelLine={false}
                                            label={renderCustomLabel}
                                        >
                                            {data.statusDistribution.map((entry, i) => (
                                                <Cell
                                                    key={`cell-${i}`}
                                                    fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => [`${value} applications`, 'Count']} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={10}
                                            formatter={(value) => (
                                                <span style={{ fontSize: 12 }}>{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Company-wise Hiring */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 opacity-70" /> Company-wise Hiring
                        </CardTitle>
                        <CardDescription>Top recruiting companies by accepted applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.companyHiring.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm font-medium">
                                No Data Available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data.companyHiring} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-40} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                                    <Bar dataKey="hires" fill="#10b981" name="Hires" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Workflow Progression Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Workflow Progression Rates
                        </CardTitle>
                        <CardDescription>Conversion probability between application stages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {data.totalApps === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground text-sm font-medium">
                                No Data Available
                            </div>
                        ) : (
                            <>
                                {[
                                    {
                                        label: 'Application → Under Review',
                                        value: data.roundSuccess.screening,
                                        color: 'text-blue-600',
                                        barColor: 'bg-blue-500',
                                    },
                                    {
                                        label: 'Under Review → Shortlisted',
                                        value: data.roundSuccess.shortlisting,
                                        color: 'text-purple-600',
                                        barColor: 'bg-purple-500',
                                    },
                                    {
                                        label: 'Shortlisted → Accepted',
                                        value: data.roundSuccess.selection,
                                        color: 'text-emerald-600',
                                        barColor: 'bg-emerald-500',
                                    },
                                ].map(({ label, value, color, barColor }) => (
                                    <div key={label} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`font-medium ${color}`}>{label}</span>
                                            <span className="font-bold">{value}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div
                                                className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                                                style={{ width: `${Math.min(value, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Branch-wise Placement Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 opacity-70" /> Branch-wise Placement Stats
                    </CardTitle>
                    <CardDescription>Total students vs placed students by branch</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.branchWise.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm font-medium">
                            No Data Available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.branchWise} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="branch" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                                <Legend verticalAlign="top" />
                                <Bar dataKey="total" name="Total Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="placed" name="Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Monthly Application & Placement Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 opacity-70" /> Monthly Application & Placement Trend
                    </CardTitle>
                    <CardDescription>Applications submitted and acceptances over time (on-campus)</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.monthlyTrend.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm font-medium">
                            No Data Available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Applications" />
                                <Line type="monotone" dataKey="placements" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Accepted" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
