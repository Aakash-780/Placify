import React, { useEffect, useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, Building2, Calendar, CheckCircle2, Clock, 
    XCircle, ChevronRight, Eye, AlertCircle, Search, Sparkles
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

export default function MyApplications() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'under_review' | 'interview_scheduled' | 'selected' | 'rejected'>('all');

    useEffect(() => {
        async function fetchApplications() {
            if (!roleData?.id) return;
            try {
                setLoading(true);
                setError(null);
                const { data, error } = await insforge.database
                    .from('job_applications')
                    .select('*, jobs(*)')
                    .eq('student_id', roleData.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setApplications(data || []);
            } catch (err: any) {
                console.error("Error fetching applications:", err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        }
        fetchApplications();
    }, [roleData]);

    // Calculate stats
    const totalApplied = applications.length;
    const underReview = applications.filter(a => a.status === 'under_review' || a.status === 'applied').length;
    const interviews = applications.filter(a => a.status === 'interview_scheduled').length;
    const selected = applications.filter(a => a.status === 'selected').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;

    // Filter applications
    const filteredApps = applications.filter(app => {
        const matchesTab = 
            activeTab === 'all' || 
            (activeTab === 'applied' && app.status === 'applied') ||
            (activeTab === 'under_review' && app.status === 'under_review') ||
            (activeTab === 'interview_scheduled' && app.status === 'interview_scheduled') ||
            (activeTab === 'selected' && app.status === 'selected') ||
            (activeTab === 'rejected' && app.status === 'rejected');

        const company = app.jobs?.company?.toLowerCase() || '';
        const title = app.jobs?.title || app.jobs?.role || '';
        const matchesSearch = 
            company.includes(searchQuery.toLowerCase()) || 
            title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const statusBadgeConfig: Record<string, { label: string; variant: string; className: string; icon: any }> = {
        applied: {
            label: 'Applied',
            variant: 'secondary',
            className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/25',
            icon: Clock
        },
        under_review: {
            label: 'Under Review',
            variant: 'warning',
            className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25',
            icon: Eye
        },
        shortlisted: {
            label: 'Shortlisted',
            variant: 'default',
            className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/25',
            icon: Sparkles
        },
        interview_scheduled: {
            label: 'Interview Scheduled',
            variant: 'default',
            className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/25',
            icon: Calendar
        },
        selected: {
            label: 'Selected',
            variant: 'success',
            className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25',
            icon: CheckCircle2
        },
        rejected: {
            label: 'Rejected',
            variant: 'destructive',
            className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/25',
            icon: XCircle
        },
        withdrawn: {
            label: 'Withdrawn',
            variant: 'outline',
            className: 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20 hover:bg-zinc-500/25',
            icon: XCircle
        },
        pending: {
            label: 'Pending',
            variant: 'secondary',
            className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/25',
            icon: Clock
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-foreground pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-heading font-black tracking-tight text-foreground">
                    My Applications
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                    Track the real-time status and hiring stages of your job applications
                </p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Applied', value: totalApplied, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/15', bg: 'from-blue-500/5 to-transparent' },
                    { label: 'Under Review', value: underReview, color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/15', bg: 'from-amber-500/5 to-transparent' },
                    { label: 'Interviews', value: interviews, color: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/15', bg: 'from-purple-500/5 to-transparent' },
                    { label: 'Selected', value: selected, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/15', bg: 'from-emerald-500/5 to-transparent' },
                    { label: 'Rejected', value: rejected, color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/15', bg: 'from-rose-500/5 to-transparent' },
                ].map((stat, i) => (
                    <Card key={i} className={`bg-card dark:bg-slate-900/60 border border-border/60 ${stat.border} backdrop-blur-md bg-gradient-to-br ${stat.bg} shadow-md overflow-hidden relative group`}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                {stat.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className={`text-3xl font-black ${stat.color} tracking-tight`}>
                                {loading ? '—' : <AnimatedCounter value={stat.value} />}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filtering & Search Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card dark:bg-slate-900/40 p-3 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'applied', label: 'Applied' },
                        { id: 'under_review', label: 'Under Review' },
                        { id: 'interview_scheduled', label: 'Interviews' },
                        { id: 'selected', label: 'Selected' },
                        { id: 'rejected', label: 'Rejected' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search company or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                </div>
            </div>

            {/* Applications List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="h-24 bg-card dark:bg-slate-900/50 animate-pulse border border-border/40" />
                    ))}
                </div>
            ) : error ? (
                <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
                    <CardContent className="p-8 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                        <p className="text-base font-bold text-rose-300">Error Loading Applications</p>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
                    </CardContent>
                </Card>
            ) : filteredApps.length === 0 ? (
                <Card className="bg-card border border-border/40 backdrop-blur-md">
                    <CardContent className="p-16 text-center space-y-4">
                        <Briefcase className="w-12 h-12 text-muted-foreground/60 mx-auto" />
                        <div className="space-y-1">
                            <p className="text-lg font-bold">No Applications Found</p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                {searchQuery ? "No records match your search query." : "You haven't submitted any job applications yet."}
                            </p>
                        </div>
                        {!searchQuery && (
                            <Button 
                                size="sm" 
                                className="bg-primary hover:bg-primary/95 text-xs font-bold px-5 py-2 rounded-xl transition-all"
                                onClick={() => navigate('/jobs')}
                            >
                                Browse Jobs
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredApps.map((app) => {
                        const job = app.jobs || {};
                        const statusConfig = statusBadgeConfig[app.status] || statusBadgeConfig.pending;
                        const StatusIcon = statusConfig.icon;
                        const dateFormatted = app.created_at ? new Date(app.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }) : 'N/A';

                        return (
                            <Card 
                                key={app.id} 
                                className="bg-card dark:bg-slate-900/50 hover:bg-muted/10 dark:hover:bg-slate-900/85 border-border/40 hover:border-border/60 shadow-md transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer"
                                onClick={() => navigate(`/my-applications/${app.id}`)}
                            >
                                <CardContent className="p-5 flex flex-col md:flex-row items-center md:items-center justify-between gap-5">
                                    {/* Company & Role Details */}
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40 flex items-center justify-center shrink-0">
                                            {job.logo_url ? (
                                                <img src={job.logo_url} alt={job.company} className="w-7 h-7 object-contain rounded" />
                                            ) : (
                                                <Building2 className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-heading font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors">
                                                {job.title || job.role || 'Software Developer'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-semibold">
                                                {job.company}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Meta info & Status & Action Row */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto">
                                        {/* Date Applied */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <Calendar className="w-4 h-4 text-muted-foreground/60" />
                                            <span>Applied: <strong className="text-foreground/80">{dateFormatted}</strong></span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2">
                                            <Badge variant={statusConfig.variant as any} className={`flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full border ${statusConfig.className}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                <span>{statusConfig.label}</span>
                                            </Badge>
                                        </div>

                                        {/* Details CTA */}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full sm:w-auto text-xs font-bold text-primary group-hover:bg-primary/10 border border-transparent group-hover:border-primary/10 hover:text-primary px-4 py-2 rounded-xl transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/my-applications/${app.id}`);
                                            }}
                                        >
                                            View Details
                                            <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
