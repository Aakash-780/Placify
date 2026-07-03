import React, { useEffect, useState, useMemo } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useNavigate } from 'react-router-dom';
import { getYearDisplay } from '@/constants/years';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Briefcase, Plus, Search, Archive, RotateCcw, Trash2,
    Users, Eye, Clock, CheckCircle, MoreVertical, Calendar,
    IndianRupee, ChevronRight, AlertCircle, Pencil, Building2,
    MapPin, FileText, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const getRecruiterCompanyName = (roleData: any): string => {
    if (!roleData?.company) return '';
    try {
        if (roleData.company.trim().startsWith('{')) {
            return JSON.parse(roleData.company).companyName || '';
        }
    } catch (_) {}
    return roleData.company;
};

const parseArr = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string')
        return val.replace(/[{}]/g, '').split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
    return [String(val)];
};

/* ─── component ─────────────────────────────────────────────────────────── */

export default function RecruiterJobs() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();

    const [jobs, setJobs] = useState<any[]>([]);
    const [appCounts, setAppCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [previewJob, setPreviewJob] = useState<any | null>(null);

    const companyName = getRecruiterCompanyName(roleData);

    /* fetch jobs scoped to recruiter's company */
    useEffect(() => {
        if (!companyName) return;
        async function load() {
            setLoading(true);
            const { data, error } = await insforge.database
                .from('jobs')
                .select('*, job_documents(*)')
                .eq('company', companyName)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[RecruiterJobs] fetch error:', error);
                setLoading(false);
                return;
            }
            const fetched = data || [];
            setJobs(fetched);
            setLastUpdated(new Date());

            /* fetch application counts per job */
            if (fetched.length > 0) {
                const ids = fetched.map((j: any) => j.id);
                const { data: apps } = await insforge.database
                    .from('job_applications')
                    .select('job_id')
                    .in('job_id', ids);
                const counts: Record<string, number> = {};
                (apps || []).forEach((a: any) => {
                    counts[a.job_id] = (counts[a.job_id] || 0) + 1;
                });
                setAppCounts(counts);
            }
            setLoading(false);
        }
        load();
    }, [companyName]);

    /* stats */
    const stats = useMemo(() => ({
        total:    jobs.length,
        active:   jobs.filter(j => j.status === 'active').length,
        draft:    jobs.filter(j => j.status === 'draft').length,
        archived: jobs.filter(j => j.status === 'archived').length,
    }), [jobs]);

    /* filtered list */
    const filtered = useMemo(() => jobs.filter(job => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (job.title || '').toLowerCase().includes(q) ||
            (job.role || '').toLowerCase().includes(q) ||
            parseArr(job.required_skills).some((s: string) => s.toLowerCase().includes(q));
        const matchType   = typeFilter === 'all' || job.job_type === typeFilter;
        const matchStatus = statusFilter === 'all' || job.status === statusFilter;
        return matchSearch && matchType && matchStatus;
    }), [jobs, search, typeFilter, statusFilter]);

    /* actions */
    const handleArchiveToggle = async (job: any) => {
        if (job.company !== companyName) return;
        const next = job.status === 'archived' ? 'active' : 'archived';
        await insforge.database.from('jobs').update({ status: next }).eq('id', job.id);
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: next } : j));
    };

    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;
        const target = jobs.find(j => j.id === jobToDelete);
        if (!target || target.company !== companyName) return;
        await insforge.database.from('jobs').delete().eq('id', jobToDelete);
        setJobs(prev => prev.filter(j => j.id !== jobToDelete));
        setShowDeleteDialog(false);
        setJobToDelete(null);
    };

    const isExpired = (deadline: string) => deadline && new Date(deadline) < new Date();

    /* status badge config */
    const statusCfg: Record<string, { label: string; cls: string }> = {
        active:   { label: 'Active',   cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
        draft:    { label: 'Draft',    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' },
        archived: { label: 'Archived', cls: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/25' },
    };

    /* ─── render ─────────────────────────────────────────────────────── */
    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <style>{`
                @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                .animate-fade-in { animation: fadeInUp .4s ease-out both; }
                .rec-row:hover { background: var(--muted); }
            `}</style>

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-primary" />
                        My Jobs
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All job postings for <span className="font-bold text-foreground">{companyName || 'your company'}</span>
                        {' · '}Last updated: <span className="font-semibold">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                </div>
                <Button
                    onClick={() => { window.scrollTo(0, 0); navigate('/admin/post-job'); }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 px-5 rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] self-start"
                >
                    <Plus className="w-4 h-4 mr-1.5" /> Post a Job
                </Button>
            </div>

            {/* ── STAT CARDS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Total',    value: stats.total,    color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20',    icon: Briefcase,    filter: 'all'      },
                    { label: 'Active',   value: stats.active,   color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle, filter: 'active'   },
                    { label: 'Draft',    value: stats.draft,    color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: Clock,        filter: 'draft'    },
                    { label: 'Archived', value: stats.archived, color: 'text-zinc-500',    bg: 'bg-zinc-500/10 border-zinc-500/20',     icon: Archive,      filter: 'archived' },
                ].map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setStatusFilter(s.filter as any)}
                        className={cn(
                            'text-left p-4 rounded-2xl border transition-all duration-200 bg-card hover:bg-muted/40',
                            statusFilter === s.filter ? 'ring-2 ring-primary border-transparent' : 'border-border/50'
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', s.bg)}>
                                <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                            </div>
                        </div>
                        <p className={cn('text-2xl font-black font-heading tracking-tight', s.color)}>
                            {loading ? '—' : s.value}
                        </p>
                    </button>
                ))}
            </div>

            {/* ── FILTERS ────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 bg-card/40 border border-border/50 p-3 rounded-2xl backdrop-blur-sm">
                {/* Status tabs */}
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/10">
                    {(['all', 'active', 'draft', 'archived'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap capitalize',
                                statusFilter === s
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {s === 'all' ? 'All' : s === 'active' ? 'Active' : s === 'draft' ? 'Drafts' : 'Archived'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, role, or skills..."
                        className="pl-9 h-9 rounded-xl"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Type filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-xl">
                        <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── JOB LIST ───────────────────────────────────────────────── */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-muted/40 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="border-border/40 bg-card/40 rounded-2xl">
                    <CardContent className="p-14 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-lg text-foreground">
                                {jobs.length === 0 ? "You haven't posted any jobs yet." : "No jobs match your filters."}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {jobs.length === 0
                                    ? "Post your first job opening to start receiving applications."
                                    : "Try clearing your search or changing the status filter."}
                            </p>
                        </div>
                        {jobs.length === 0 && (
                            <Button
                                onClick={() => { window.scrollTo(0, 0); navigate('/admin/post-job'); }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-10 px-6 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Post First Job
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(job => {
                        const expired = isExpired(job.application_deadline);
                        const sc      = statusCfg[job.status] || statusCfg.draft;
                        const appCount = appCounts[job.id] || 0;
                        const locations = parseArr(job.location);

                        return (
                            <Card
                                key={job.id}
                                className="border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200"
                            >
                                <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                    {/* Left: job info */}
                                    <div 
                                        className="space-y-2 flex-1 min-w-0 cursor-pointer group"
                                        onClick={() => setPreviewJob(job)}
                                    >
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                                                {job.title}
                                            </h3>
                                            <Badge className={cn(
                                                'text-[9px] font-black uppercase tracking-wider border',
                                                job.job_type === 'internship'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            )}>
                                                {job.job_type || 'Job'}
                                            </Badge>
                                            <Badge className={cn('text-[9px] font-black uppercase tracking-wider border', sc.cls)}>
                                                {sc.label}
                                            </Badge>
                                            {expired && (
                                                <Badge className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    <Clock className="w-3 h-3 mr-0.5" /> Expired
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                                                <strong>{job.ctc ? `${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Competitive'}</strong>
                                            </span>
                                            {locations.length > 0 && (
                                                <span>{locations.join(', ')}</span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                {job.application_deadline
                                                    ? `Deadline: ${new Date(job.application_deadline).toLocaleDateString('en-IN')}`
                                                    : 'Rolling'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                                                <span className="font-bold text-foreground">{appCount}</span>
                                                {' '}application{appCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto border-t md:border-0 border-border/10 pt-3 md:pt-0">
                                        {/* View Applicants (primary) */}
                                        <Button
                                            size="sm"
                                            onClick={() => { window.scrollTo(0, 0); navigate(`/admin/applicants?jobId=${job.id}`); }}
                                            className="h-9 text-xs px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center gap-1.5 flex-1 md:flex-none justify-center shadow"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            Applicants
                                            {appCount > 0 && (
                                                <span className="bg-white/20 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black ml-0.5">
                                                    {appCount}
                                                </span>
                                            )}
                                        </Button>

                                        {/* Edit */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { window.scrollTo(0, 0); navigate(`/admin/edit-job/${job.id}`); }}
                                            className="h-9 px-3 rounded-xl text-xs font-bold border-border/60 hover:bg-muted hover:border-primary/30"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* More dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-9 w-9 rounded-xl hover:bg-muted"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/50">
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-xs py-2 flex items-center gap-2"
                                                    onClick={() => setPreviewJob(job)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={cn(
                                                        'cursor-pointer text-xs py-2 flex items-center gap-2',
                                                        job.status === 'archived'
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-amber-600 dark:text-amber-400'
                                                    )}
                                                    onClick={() => handleArchiveToggle(job)}
                                                >
                                                    {job.status === 'archived'
                                                        ? <><RotateCcw className="w-3.5 h-3.5" /> Restore</>
                                                        : <><Archive className="w-3.5 h-3.5" /> Archive</>}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-xs py-2 text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 flex items-center gap-2"
                                                    onClick={() => { setJobToDelete(job.id); setShowDeleteDialog(true); }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── DELETE DIALOG ───────────────────────────────────────────── */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-black text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-500" /> Delete Job Posting?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            This will permanently delete the job listing and may remove all associated application records. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => { setShowDeleteDialog(false); setJobToDelete(null); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl font-bold"
                            onClick={handleDeleteConfirm}
                        >
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── JOB PREVIEW DIALOG ───────────────────────────────────────── */}
            <Dialog open={!!previewJob} onOpenChange={() => setPreviewJob(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-primary/20 text-foreground rounded-2xl p-0 shadow-2xl">
                    {previewJob && (() => {
                        const locations = parseArr(previewJob.location);
                        const skills = parseArr(previewJob.required_skills);
                        const techStack = parseArr(previewJob.tech_stack);
                        const branches = parseArr(previewJob.allowed_branches);
                        const years = parseArr(previewJob.allowed_years);
                        const gradYears = parseArr(previewJob.allowed_graduation_years);
                        const isJobExpired = isExpired(previewJob.application_deadline);
                        const sc = statusCfg[previewJob.status] || statusCfg.draft;

                        // Parse selection rounds
                        const selectionRounds = Array.isArray(previewJob.selection_rounds)
                            ? previewJob.selection_rounds
                            : (typeof previewJob.selection_rounds === 'string'
                                ? JSON.parse(previewJob.selection_rounds)
                                : []);

                        return (
                            <div className="text-foreground font-sans">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {previewJob.logo_url ? (
                                            <img src={previewJob.logo_url} alt={previewJob.company} className="w-12 h-12 rounded-xl object-contain border bg-white" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-primary/25 flex items-center justify-center text-primary font-bold text-lg">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-xl font-heading font-bold text-white">{previewJob.title || 'Role Title'}</h2>
                                            <p className="text-sm text-muted-foreground font-semibold">{previewJob.company || 'Company Name'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="capitalize text-xs font-bold px-3 py-1 bg-primary/20 text-primary border border-primary/30">
                                            {previewJob.job_type}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1 font-semibold">{(previewJob.work_mode || '').toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-xl text-center">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Compensation</p>
                                            <p className="font-bold text-sm text-foreground mt-0.5">
                                                {previewJob.job_type === 'internship' ? `₹${previewJob.stipend || '—'}/mo` : `₹${previewJob.ctc || '—'} LPA`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Locations</p>
                                            <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                                                {locations.join(', ') || '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Eligibility</p>
                                            <p className="font-bold text-sm text-foreground mt-0.5">
                                                {previewJob.min_cgpa || '0'} CGPA | {previewJob.max_backlogs ?? '0'} Backlog
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Deadline</p>
                                            <p className="font-bold text-sm text-amber-600 mt-0.5">
                                                {previewJob.application_deadline ? new Date(previewJob.application_deadline).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Job Description</h3>
                                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{previewJob.description || 'No description provided.'}</p>
                                    </div>

                                    {/* Eligibility & Skills Split */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Eligibility Details</h3>
                                            <div className="space-y-1.5 text-sm">
                                                <p><span className="text-muted-foreground">Branches:</span> <span className="font-medium text-foreground">{branches.join(', ') || 'All Branches'}</span></p>
                                                <p><span className="text-muted-foreground">Allowed Years:</span> <span className="font-medium text-foreground">{years.map(y => getYearDisplay(Number(y))).join(', ') || 'None selected'}</span></p>
                                                <p><span className="text-muted-foreground">Graduation Years:</span> <span className="font-medium text-foreground">{gradYears.join(', ') || 'None selected'}</span></p>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Required Skills & Tech</h3>
                                            <div className="flex flex-wrap gap-1.5">
                                                {skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                                                {techStack.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Selection Process */}
                                    {selectionRounds.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">Selection Process</h3>
                                            <div className="space-y-3">
                                                {selectionRounds.map((r: any) => (
                                                    <div key={r.round_number} className="flex gap-3 items-start border-l-2 border-primary/30 pl-4 py-1">
                                                        <div className="bg-primary/10 text-primary text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                                            {r.round_number}
                                                        </div>
                                                        <div>
                                                            <div className="flex gap-2 items-center flex-wrap">
                                                                <span className="font-bold text-sm text-foreground">{r.name || `Round ${r.round_number}`}</span>
                                                                <Badge className="text-[9px] scale-90 bg-muted text-muted-foreground uppercase">{r.type}</Badge>
                                                                {r.duration && <span className="text-xs text-muted-foreground">({r.duration}m)</span>}
                                                            </div>
                                                            {r.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Job Documents */}
                                    {previewJob.job_documents && previewJob.job_documents.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Attachments & Resources</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {previewJob.job_documents.map((doc: any) => (
                                                        <a
                                                            key={doc.id}
                                                            href={doc.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 p-3 rounded-xl bg-muted/15 border border-border/30 hover:bg-muted/25 transition-all text-xs font-semibold text-blue-400 hover:text-blue-300"
                                                        >
                                                            <FileText className="w-4 h-4 text-orange-500" />
                                                            <span className="truncate flex-1">{doc.file_name || 'Attached PDF'}</span>
                                                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Footer Actions */}
                                    <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl text-xs font-bold"
                                            onClick={() => setPreviewJob(null)}
                                        >
                                            Close Preview
                                        </Button>
                                        <Button
                                            className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                                            onClick={() => {
                                                setPreviewJob(null);
                                                window.scrollTo(0, 0);
                                                navigate(`/admin/edit-job/${previewJob.id}`);
                                            }}
                                        >
                                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
