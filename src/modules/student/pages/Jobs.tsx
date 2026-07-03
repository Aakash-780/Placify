import React, { useEffect, useState, useMemo } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    Briefcase, MapPin, Clock, Search, Heart, Filter, IndianRupee,
    Building2, Calendar, ChevronRight, Bookmark, AlertCircle, CheckCircle,
    FileText, Globe, Plus, Trash2, RotateCcw, TrendingUp, Sparkles, Eye,
    ArrowUpRight, Archive, XCircle, Users, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
    DropdownMenuItem, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { checkJobEligibility } from '@/utils/checkJobEligibility';
import { getYearDisplay } from '@/constants/years';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

export default function Jobs() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const [jobs, setJobs] = useState<any[]>([]);
    const [savedJobs, setSavedJobs] = useState<string[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState<'all' | 'eligible' | 'notEligible'>('all');
    const [locationFilter, setLocationFilter] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline' | 'company' | 'ctc'>('newest');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const handleArchiveToggle = async (job: any) => {
        // Recruiter can never reach this page, but keep company guard just in case
        const nextStatus = job.status === 'archived' ? 'active' : 'archived';
        try {
            const { error } = await insforge.database
                .from('jobs')
                .update({ status: nextStatus, updated_at: new Date().toISOString() })
                .eq('id', job.id);
            
            if (error) {
                console.error("Failed to archive job:", error);
                alert("Failed to update status: " + error.message);
                return;
            }
            
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j));
        } catch (err) {
            console.error("Archive toggle catch error:", err);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;
        try {
            const { error } = await insforge.database
                .from('jobs')
                .delete()
                .eq('id', jobToDelete);
            
            if (error) {
                console.error("Failed to delete job:", error);
                alert("Failed to delete job: " + error.message);
                return;
            }
            
            setJobs(prev => prev.filter(j => j.id !== jobToDelete));
        } catch (err) {
            console.error("Delete catch error:", err);
        } finally {
            setShowDeleteDialog(false);
            setJobToDelete(null);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                
                let query = insforge.database
                    .from('jobs')
                    .select('*, job_documents(*)');

                if (role === 'admin') {
                    // Admin sees all jobs unfiltered
                }
                // students see all active jobs (filtered client-side below)

                let response = await query.order('created_at', { ascending: false });
                
                console.log("Fetch jobs response:", response);
                if (response.error) {
                    console.error("Fetch jobs error:", response.error);
                    setError("Failed to fetch jobs: " + response.error.message);
                    setLoading(false);
                    return;
                }

                let fetchedJobs = response.data || [];

                setJobs(fetchedJobs);
                setLastUpdated(new Date());

                if (role === 'student' && roleData?.id) {
                    const { data: saved } = await insforge.database
                        .from('saved_jobs')
                        .select('job_id')
                        .eq('student_id', roleData.id);
                    if (saved) setSavedJobs(saved.map((d: any) => d.job_id));

                    const { data: apps } = await insforge.database
                        .from('job_applications')
                        .select('job_id')
                        .eq('student_id', roleData.id);
                    if (apps) setAppliedJobIds(apps.map((a: any) => a.job_id));
                }
            } catch (err: any) {
                console.error("Fetch jobs catch error:", err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [role, roleData]);

    const checkEligibility = (job: any) => {
        if (role !== 'student' || !roleData) return { eligible: true, status: 'eligible', reasons: [] as string[] };
        const res = checkJobEligibility(roleData, job);
        return {
            eligible: res.status === 'eligible',
            status: res.status,
            reasons: res.reasons
        };
    };

    const filteredJobs = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // today's boundary

        return jobs.filter((job) => {
            // Apply Student visibility constraints
            if (role === 'student') {
                if (job.status !== 'active') return false;
                if (job.application_deadline) {
                    const deadline = new Date(job.application_deadline);
                    if (deadline < today) return false;
                }
            }

            // Apply Search and Type filters
            const matchSearch = !search ||
                (job.company?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (job.role?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (job.title?.toLowerCase() || '').includes(search.toLowerCase());
            
            const matchType = typeFilter === 'all' || 
                (job.job_type && job.job_type.toLowerCase() === typeFilter.toLowerCase());
            
            if (!matchSearch || !matchType) return false;

            // Apply Metric Card Filter
            if (role === 'student' && jobFilter !== 'all') {
                const { eligible } = checkEligibility(job);
                if (jobFilter === 'eligible' && !eligible) return false;
                if (jobFilter === 'notEligible' && eligible) return false;
            }

            return true;
        });
    }, [jobs, search, typeFilter, jobFilter, role]);

    const toggleSave = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!roleData?.id) return;
        if (savedJobs.includes(jobId)) {
            await insforge.database.from('saved_jobs').delete().eq('student_id', roleData.id).eq('job_id', jobId);
            setSavedJobs(prev => prev.filter(id => id !== jobId));
        } else {
            await insforge.database.from('saved_jobs').insert({ student_id: roleData.id, job_id: jobId });
            setSavedJobs(prev => [...prev, jobId]);
        }
    };

    const isExpired = (deadline: string) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    // Parser for display
    const parseArrayDisplay = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
        return [val];
    };

    const stats = useMemo(() => {
        return {
            total: jobs.length,
            active: jobs.filter(j => j.status === 'active').length,
            draft: jobs.filter(j => j.status === 'draft').length,
            archived: jobs.filter(j => j.status === 'archived').length,
        };
    }, [jobs]);

    const activeThisWeek = useMemo(() => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return jobs.filter(j => j.status === 'active' && new Date(j.created_at || Date.now()) >= sevenDaysAgo).length;
    }, [jobs]);

    const activeThisMonth = useMemo(() => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return jobs.filter(j => j.status === 'active' && new Date(j.created_at || Date.now()) >= startOfMonth).length;
    }, [jobs]);

    const averageCtc = useMemo(() => {
        const activeFullTime = jobs.filter(j => j.status === 'active' && j.job_type === 'full-time' && j.ctc);
        if (activeFullTime.length === 0) return '0';
        const sum = activeFullTime.reduce((acc, j) => acc + parseFloat(j.ctc), 0);
        return (sum / activeFullTime.length).toFixed(1);
    }, [jobs]);

    const averageStipend = useMemo(() => {
        const activeInternship = jobs.filter(j => j.status === 'active' && j.job_type === 'internship' && j.stipend);
        if (activeInternship.length === 0) return 0;
        const sum = activeInternship.reduce((acc, j) => acc + parseInt(j.stipend), 0);
        return Math.round(sum / activeInternship.length);
    }, [jobs]);

    const studentStats = useMemo(() => {
        const activeUnexpiredJobs = jobs.filter(job => {
            if (job.status !== 'active') return false;
            if (job.application_deadline) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(job.application_deadline) >= today;
            }
            return true;
        });

        let eligibleCount = 0;
        let ineligibleCount = 0;

        activeUnexpiredJobs.forEach(job => {
            const { eligible } = checkEligibility(job);
            if (eligible) {
                eligibleCount++;
            } else {
                ineligibleCount++;
            }
        });

        return {
            total: activeUnexpiredJobs.length,
            eligible: eligibleCount,
            ineligible: ineligibleCount
        };
    }, [jobs, roleData]);

    const sortedAndFilteredJobs = useMemo(() => {
        const filtered = jobs.filter(job => {
            const matchSearch = !search ||
                (job.company || '').toLowerCase().includes(search.toLowerCase()) ||
                (job.role || '').toLowerCase().includes(search.toLowerCase()) ||
                (job.title || '').toLowerCase().includes(search.toLowerCase()) ||
                (job.required_skills && parseArrayDisplay(job.required_skills).some((s: string) => s.toLowerCase().includes(search.toLowerCase())));
            
            const matchType = typeFilter === 'all' || 
                (job.job_type && job.job_type.toLowerCase() === typeFilter.toLowerCase());
            
            let matchStatus = true;
            if (statusFilter !== 'all') {
                matchStatus = job.status === statusFilter;
            }
            return matchSearch && matchType && matchStatus;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            if (sortBy === 'oldest') {
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            }
            if (sortBy === 'deadline') {
                if (!a.application_deadline) return 1;
                if (!b.application_deadline) return -1;
                return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
            }
            if (sortBy === 'company') {
                return (a.company || '').localeCompare(b.company || '');
            }
            if (sortBy === 'ctc') {
                const aVal = a.job_type === 'internship' ? (parseFloat(a.stipend) / 100000 || 0) : (parseFloat(a.ctc) || 0);
                const bVal = b.job_type === 'internship' ? (parseFloat(b.stipend) / 100000 || 0) : (parseFloat(b.ctc) || 0);
                return bVal - aVal;
            }
            return 0;
        });
    }, [jobs, search, typeFilter, statusFilter, sortBy]);

    const renderAdminDashboard = () => {
        return (
            <div className="space-y-6">
                {/* Header section */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">On-Campus Jobs</h1>
                            <p className="text-muted-foreground mt-1 text-sm">Monitor, publish, edit, draft, archive, and manage placement opportunity listings.</p>
                        </div>
                        <Button 
                            onClick={() => navigate('/admin/post-job')} 
                            className="sm:w-auto self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 font-bold rounded-xl"
                        >
                            <Plus className="w-4 h-4" /> Post Opportunity
                        </Button>
                    </div>
                    {/* Summary Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground bg-muted/20 border border-border/10 rounded-xl p-3 px-4">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                            <span>Last Updated: <strong className="text-foreground font-medium">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
                        </div>
                        <div className="h-4 w-px bg-border/40 hidden sm:block" />
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Active Listings: <strong className="text-foreground font-semibold">{stats.active}</strong></span>
                        </div>
                        <div className="h-4 w-px bg-border/40 hidden sm:block" />
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Drafts: <strong className="text-foreground font-semibold">{stats.draft}</strong></span>
                        </div>
                        <div className="h-4 w-px bg-border/40 hidden sm:block" />
                        <div className="flex items-center gap-1.5">
                            <Archive className="w-3.5 h-3.5 text-gray-500" />
                            <span>Archived: <strong className="text-foreground font-semibold">{stats.archived}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={cn(
                            "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                            statusFilter === 'active' ? "ring-2 ring-primary border-transparent" : "border-border/50"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-muted-foreground">Active</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Live
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-heading tracking-tight">{stats.active}</span>
                            {activeThisWeek > 0 && (
                                <span className="text-[11px] font-semibold text-emerald-500">
                                    +{activeThisWeek} this week
                                </span>
                            )}
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setStatusFilter('draft')}
                        className={cn(
                            "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                            statusFilter === 'draft' ? "ring-2 ring-primary border-transparent" : "border-border/50"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-muted-foreground">Drafts</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Review
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-heading tracking-tight">{stats.draft}</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('archived')}
                        className={cn(
                            "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                            statusFilter === 'archived' ? "ring-2 ring-primary border-transparent" : "border-border/50"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-muted-foreground">Archived</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 flex items-center gap-0.5">
                                <Archive className="w-3 h-3" /> Hidden
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-heading tracking-tight">{stats.archived}</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('all')}
                        className={cn(
                            "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                            statusFilter === 'all' ? "ring-2 ring-primary border-transparent" : "border-border/50"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-muted-foreground">Total</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 flex items-center gap-0.5">
                                <Briefcase className="w-3 h-3" /> Combined
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-heading tracking-tight">{stats.total}</span>
                        </div>
                    </button>
                </div>

                {/* Dashboard main layout grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left side list pane (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Filters & Search Header */}
                        <div className="space-y-3 bg-card/30 p-3.5 rounded-xl border border-border/40">
                            <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg border border-border/10">
                                {(['all', 'active', 'draft', 'archived'] as const).map(status => {
                                    const label = status === 'all' ? 'All' : status === 'active' ? 'Active / Live' : status === 'draft' ? 'Drafts' : 'Archived';
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                                                statusFilter === status
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search placements by company, role, or skills..."
                                        className="pl-10 h-9"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-full sm:w-[150px] h-9">
                                        <SelectValue placeholder="Job Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="full-time">Full-Time</SelectItem>
                                        <SelectItem value="internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                                    <SelectTrigger className="w-full sm:w-[150px] h-9">
                                        <SelectValue placeholder="Sort order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="deadline">Deadline</SelectItem>
                                        <SelectItem value="company">Company Name</SelectItem>
                                        <SelectItem value="ctc">CTC / Compensation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Placements List */}
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-muted/50" />)}
                            </div>
                        ) : sortedAndFilteredJobs.length === 0 ? (
                            <Card className="border-border/40">
                                <CardContent className="p-10 text-center text-muted-foreground text-sm bg-card/10">
                                    <Briefcase className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                                    No placements found matching the selected filters.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {sortedAndFilteredJobs.map(job => {
                                    const expired = isExpired(job.application_deadline);
                                    const locations = parseArrayDisplay(job.location);
                                    const branches = parseArrayDisplay(job.allowed_branches);
                                    const years = parseArrayDisplay(job.allowed_years);
                                    const gradYears = parseArrayDisplay(job.allowed_graduation_years);

                                    return (
                                        <Card key={job.id} className="border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-sm transition-all duration-200">
                                            <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-heading font-bold text-lg text-foreground truncate">{job.title}</h3>
                                                        <Badge variant={job.job_type === 'internship' ? 'warning' : 'secondary'} className="capitalize text-[10px] font-semibold py-0.5">
                                                            {job.job_type || 'Job'}
                                                        </Badge>
                                                        {job.work_mode && (
                                                            <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                                                                {job.work_mode}
                                                            </Badge>
                                                        )}
                                                        <Badge 
                                                            className={cn(
                                                                "text-[10px] py-0.5 px-2 font-semibold border capitalize tracking-wide",
                                                                job.status === 'active' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                                job.status === 'draft' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                                job.status === 'archived' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                                            )}
                                                        >
                                                            {job.status}
                                                        </Badge>
                                                        {expired && (
                                                            <Badge variant="destructive" className="text-[10px] font-semibold py-0.5 flex items-center gap-0.5">
                                                                <Clock className="w-3 h-3" /> Expired
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-sm font-semibold text-muted-foreground">
                                                        {job.company} — <span className="font-normal text-muted-foreground/80">{locations.join(', ') || 'Not specified'}</span>
                                                    </p>

                                                    <div className="text-xs text-muted-foreground flex gap-x-4 gap-y-1 mt-1.5 flex-wrap items-center">
                                                        <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><strong>{job.ctc ? `${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Not specified'}</strong></span>
                                                        <span className="hidden sm:inline text-border/40">•</span>
                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /> Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-IN') : 'Rolling'}</span>
                                                        <span className="hidden sm:inline text-border/40">•</span>
                                                        <span>{job.num_rounds || 0} Selection Rounds</span>
                                                    </div>

                                                    <div className="text-[11px] text-muted-foreground/80 flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                                                        <span>Branches: <strong className="font-medium text-foreground/75">{branches.join(', ') || 'All'}</strong></span>
                                                        <span>•</span>
                                                        <span>Years: <strong className="font-medium text-foreground/75">{years.map(y => getYearDisplay(y)).join(', ') || 'All'}</strong></span>
                                                        {gradYears.length > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Grad Years: <strong className="font-medium text-foreground/75">{gradYears.join(', ')}</strong></span>
                                                            </>
                                                        )}
                                                        {parseFloat(job.min_cgpa) > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Min CGPA: <strong className="font-medium text-foreground/75">{job.min_cgpa}</strong></span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                 {/* Moderation Actions on the Right */}
                                                 <div className="flex items-center gap-2.5 w-full md:w-auto flex-shrink-0 pt-2 md:pt-0 border-t md:border-0 border-border/10 justify-end">
                                                     {/* 1. View Applicants (Prominent Primary Action) */}
                                                     <Button
                                                         variant="default"
                                                         size="sm"
                                                         onClick={() => navigate(`/admin/applicants?jobId=${job.id}`)}
                                                         className="h-9 text-xs px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                                                     >
                                                         <Users className="w-4 h-4" /> 
                                                         <span>Applicants</span>
                                                     </Button>
                                                     
                                                     <Button
                                                         variant="outline"
                                                         size="sm"
                                                         onClick={() => navigate(`/jobs/${job.id}`)}
                                                         className="h-9 text-xs px-3 border-border dark:border-white/10 bg-background dark:bg-slate-950/40 hover:bg-muted dark:hover:bg-white/5 text-foreground hover:text-foreground dark:text-slate-200 dark:hover:text-white font-bold transition-all"
                                                     >
                                                         <Eye className="w-4 h-4 mr-1.5 text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-slate-100" />
                                                         <span>View</span>
                                                     </Button>

                                                     <DropdownMenu>
                                                         <DropdownMenuTrigger asChild>
                                                             <Button
                                                                 variant="outline"
                                                                 size="icon"
                                                                 className="h-9 w-9 border-border dark:border-white/10 bg-background dark:bg-slate-950/40 hover:bg-muted dark:hover:bg-white/5 text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white rounded-lg transition-all"
                                                             >
                                                                 <MoreVertical className="w-4 h-4" />
                                                             </Button>
                                                         </DropdownMenuTrigger>
                                                         <DropdownMenuContent align="end" className="bg-popover border border-border dark:bg-slate-900 dark:border-white/10 text-popover-foreground dark:text-slate-200 w-40">
                                                             <DropdownMenuItem 
                                                                 onClick={() => navigate(`/admin/edit-job/${job.id}`)}
                                                                 className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground dark:focus:bg-white/5 dark:focus:text-white py-2 flex items-center gap-2"
                                                             >
                                                                 <Briefcase className="w-3.5 h-3.5 text-muted-foreground dark:text-slate-400" /> 
                                                                 <span>Edit Job</span>
                                                             </DropdownMenuItem>
                                                             
                                                             <DropdownMenuItem 
                                                                 onClick={() => handleArchiveToggle(job)}
                                                                 className={cn(
                                                                     "cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground dark:focus:bg-white/5 py-2 flex items-center gap-2",
                                                                     job.status === 'archived' ? "text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300" : "text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300"
                                                                 )}
                                                             >
                                                                 {job.status === 'archived' ? (
                                                                     <>
                                                                         <RotateCcw className="w-3.5 h-3.5" /> 
                                                                         <span>Restore</span>
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <Archive className="w-3.5 h-3.5" /> 
                                                                         <span>Archive</span>
                                                                     </>
                                                                 )}
                                                             </DropdownMenuItem>
                                                             
                                                             <DropdownMenuSeparator className="bg-border dark:bg-white/10" />
                                                             
                                                             <DropdownMenuItem 
                                                                 onClick={() => {
                                                                     setJobToDelete(job.id);
                                                                     setShowDeleteDialog(true);
                                                                 }}
                                                                 className="cursor-pointer text-xs text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 py-2 flex items-center gap-2"
                                                             >
                                                                 <Trash2 className="w-3.5 h-3.5" /> 
                                                                 <span>Delete</span>
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
                    </div>

                    {/* Right side analytics pane (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Distribution Overview Card */}
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                    <TrendingUp className="w-4 h-4 text-primary" /> Placement Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                {(() => {
                                    const totalCount = stats.total;
                                    const hasData = totalCount > 0;
                                    const chartData = [
                                        { name: 'Active', value: stats.active, status: 'active', color: '#10b981' },
                                        { name: 'Draft', value: stats.draft, status: 'draft', color: '#f59e0b' },
                                        { name: 'Archived', value: stats.archived, status: 'archived', color: '#6b7280' }
                                    ];
                                    const displayData = hasData 
                                        ? chartData.filter(d => d.value > 0)
                                        : [{ name: 'No Opportunities', value: 1, status: 'all', color: 'hsl(var(--muted))' }];

                                    return (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] flex-shrink-0 relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={displayData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={42}
                                                                outerRadius={56}
                                                                paddingAngle={hasData ? 3 : 0}
                                                                dataKey="value"
                                                                onClick={(data) => {
                                                                    if (hasData && data && data.status) {
                                                                        setStatusFilter(data.status);
                                                                    }
                                                                }}
                                                            >
                                                                {displayData.map((entry: any, index: number) => (
                                                                    <Cell 
                                                                        key={`cell-${index}`} 
                                                                        fill={entry.color} 
                                                                        style={{ cursor: hasData ? 'pointer' : 'default' }}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            {hasData && (
                                                                <Tooltip 
                                                                    content={({ active, payload }) => {
                                                                        if (active && payload && payload.length) {
                                                                            const data = payload[0].payload;
                                                                            return (
                                                                                <div className="bg-popover border border-border text-popover-foreground px-2 py-1 text-[11px] rounded shadow-md font-medium">
                                                                                    {data.name}: <span className="font-bold">{data.value}</span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }}
                                                                />
                                                            )}
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-xl font-bold font-heading leading-none">{totalCount}</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">Total</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-1.5 text-xs">
                                                    <button 
                                                        onClick={() => setStatusFilter('active')}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                            statusFilter === 'active' && "bg-muted/60 font-semibold"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-muted-foreground font-medium">Active</span>
                                                        </div>
                                                        <span className="font-bold text-foreground">{stats.active}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setStatusFilter('draft')}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                            statusFilter === 'draft' && "bg-muted/60 font-semibold"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                            <span className="text-muted-foreground font-medium">Draft</span>
                                                        </div>
                                                        <span className="font-bold text-foreground">{stats.draft}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setStatusFilter('archived')}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                            statusFilter === 'archived' && "bg-muted/60 font-semibold"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-gray-500" />
                                                            <span className="text-muted-foreground font-medium">Archived</span>
                                                        </div>
                                                        <span className="font-bold text-foreground">{stats.archived}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        {/* Placements Insights Card */}
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4 text-primary" /> Placements Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3.5">
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-border/10">
                                        <span className="text-muted-foreground">Total Opportunities</span>
                                        <span className="font-bold">{stats.total}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border/10">
                                        <span className="text-muted-foreground">Active Placements</span>
                                        <span className="font-bold text-emerald-500">{stats.active}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border/10">
                                        <span className="text-muted-foreground">Draft Placements</span>
                                        <span className="font-bold text-amber-500">{stats.draft}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border/10">
                                        <span className="text-muted-foreground">Archived Placements</span>
                                        <span className="font-bold text-gray-400">{stats.archived}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border/10">
                                        <span className="text-muted-foreground">Active This Month</span>
                                        <span className="font-bold text-emerald-500">{activeThisMonth}</span>
                                    </div>
                                    {parseFloat(averageCtc) > 0 && (
                                        <div className="flex justify-between py-1.5 border-b border-border/10">
                                            <span className="text-muted-foreground">Average CTC (Full-time)</span>
                                            <span className="font-bold text-primary">{averageCtc} LPA</span>
                                        </div>
                                    )}
                                    {averageStipend > 0 && (
                                        <div className="flex justify-between py-1.5">
                                            <span className="text-muted-foreground">Average Stipend (Internship)</span>
                                            <span className="font-bold text-primary">₹{averageStipend.toLocaleString()}/mo</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudentView = () => {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">On-Campus Jobs</h1>
                    <p className="text-muted-foreground mt-1">Browse on-campus job & internship opportunities</p>
                </div>

                {/* Dashboard Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Total Jobs */}
                    <Card 
                        onClick={() => setJobFilter('all')}
                        className={cn(
                            "border cursor-pointer select-none relative overflow-hidden group transition-all duration-300",
                            "bg-gradient-to-br from-blue-500/5 to-cyan-500/5 backdrop-blur-sm hover:-translate-y-1 active:scale-[0.98]",
                            jobFilter === 'all' 
                                ? "ring-2 ring-blue-500 border-transparent shadow-[0_0_18px_rgba(59,130,246,0.18)] scale-[1.02] bg-blue-500/[0.08]" 
                                : "border-border/40 hover:shadow-md hover:shadow-blue-500/5 hover:bg-blue-500/[0.02]"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Jobs</span>
                                {loading ? (
                                    <div className="h-9 w-16 bg-muted animate-pulse rounded-md mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold font-heading text-blue-500 tracking-tight">{studentStats.total}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">Jobs available today</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <Briefcase className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Eligible Jobs */}
                    <Card 
                        onClick={() => setJobFilter('eligible')}
                        className={cn(
                            "border cursor-pointer select-none relative overflow-hidden group transition-all duration-300",
                            "bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm hover:-translate-y-1 active:scale-[0.98]",
                            jobFilter === 'eligible' 
                                ? "ring-2 ring-emerald-500 border-transparent shadow-[0_0_18px_rgba(16,185,129,0.18)] scale-[1.02] bg-emerald-500/[0.08]" 
                                : "border-border/40 hover:shadow-md hover:shadow-emerald-500/5 hover:bg-emerald-500/[0.02]"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eligible Jobs</span>
                                {loading ? (
                                    <div className="h-9 w-16 bg-muted animate-pulse rounded-md mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold font-heading text-emerald-500 tracking-tight">{studentStats.eligible}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">You can apply now</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Not Eligible Jobs */}
                    <Card 
                        onClick={() => setJobFilter('notEligible')}
                        className={cn(
                            "border cursor-pointer select-none relative overflow-hidden group transition-all duration-300",
                            "bg-gradient-to-br from-rose-500/5 to-red-500/5 backdrop-blur-sm hover:-translate-y-1 active:scale-[0.98]",
                            jobFilter === 'notEligible' 
                                ? "ring-2 ring-rose-500 border-transparent shadow-[0_0_18px_rgba(239,68,68,0.18)] scale-[1.02] bg-rose-500/[0.08]" 
                                : "border-border/40 hover:shadow-md hover:shadow-rose-500/5 hover:bg-rose-500/[0.02]"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Not Eligible Jobs</span>
                                {loading ? (
                                    <div className="h-9 w-16 bg-muted animate-pulse rounded-md mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold font-heading text-rose-500 tracking-tight">{studentStats.ineligible}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">Requirements not met</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <XCircle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Card className="border-destructive bg-destructive/10">
                        <CardContent className="p-4 flex items-center gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="text-sm font-medium">{error}</div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search company or role..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Job Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="full-time">Full-Time</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Filter status description feed */}
                <div className="flex items-center justify-between text-xs text-muted-foreground/85 px-1 py-1 bg-muted/10 border border-border/10 rounded-lg backdrop-blur-sm animate-fade-in">
                    <span className="font-semibold flex items-center gap-1.5 pl-2.5">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {jobFilter === 'all' && `Showing all ${filteredJobs.length} ${filteredJobs.length === 1 ? 'placement opportunity' : 'placement opportunities'}`}
                        {jobFilter === 'eligible' && `Showing ${filteredJobs.length} eligible ${filteredJobs.length === 1 ? 'placement opportunity' : 'placement opportunities'}`}
                        {jobFilter === 'notEligible' && `Showing ${filteredJobs.length} ineligible ${filteredJobs.length === 1 ? 'placement opportunity' : 'placement opportunities'}`}
                    </span>
                    {(jobFilter !== 'all' || search || typeFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={() => {
                                setJobFilter('all');
                                setSearch('');
                                setTypeFilter('all');
                            }}
                            className="text-primary hover:text-primary/80 font-bold hover:underline pr-2.5 flex items-center gap-1 transition-all"
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {/* Job Listings */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-medium">No jobs found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
                        {filteredJobs.map((job) => {
                            const { eligible, status, reasons } = checkEligibility(job);
                            const expired = isExpired(job.application_deadline);
                            return (
                                <Card
                                    key={job.id}
                                    className={cn(
                                        'card-hover cursor-pointer relative overflow-hidden',
                                        status === 'ineligible' && 'opacity-80',
                                        expired && 'opacity-60'
                                    )}
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    {appliedJobIds.includes(job.id) ? (
                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg font-bold flex items-center gap-1 shadow-sm">
                                            <CheckCircle className="w-3.5 h-3.5" /> Applied
                                        </div>
                                    ) : expired ? (
                                        <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg font-bold">
                                            Closed
                                        </div>
                                    ) : null}
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-semibold text-lg leading-tight">{job.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{job.company}</p>
                                                </div>
                                            </div>
                                            {role === 'student' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="flex-shrink-0"
                                                    onClick={(e) => toggleSave(job.id, e)}
                                                >
                                                    <Bookmark className={cn('w-5 h-5', savedJobs.includes(job.id) && 'fill-primary text-primary')} />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {job.status && job.status !== 'active' && (
                                                <Badge variant={job.status === 'draft' ? 'secondary' : 'destructive'} className="uppercase font-bold text-[9px] tracking-wider">
                                                    {job.status}
                                                </Badge>
                                            )}
                                            <Badge variant={job.job_type === 'internship' ? 'warning' : 'default'}>
                                                {job.job_type}
                                            </Badge>
                                            {job.work_mode && (
                                                <Badge variant="secondary">{job.work_mode}</Badge>
                                            )}
                                            {job.job_documents && job.job_documents.length > 0 && (
                                                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                    <FileText className="w-3 h-3" /> {job.job_documents.length} {job.job_documents.length === 1 ? 'Doc' : 'Docs'} Attached
                                                </Badge>
                                            )}
                                            {job.application_mode === 'external' && (
                                                <Badge variant="outline" className="border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400 flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                    <Globe className="w-3 h-3" /> External Application Required
                                                </Badge>
                                            )}
                                            {job.application_mode === 'both' && (
                                                <Badge variant="outline" className="border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400 flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                    <Globe className="w-3 h-3" /> External Option Available
                                                </Badge>
                                            )}
                                            {role === 'student' && (
                                                appliedJobIds.includes(job.id) ? (
                                                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                        <CheckCircle className="w-3 h-3" /> Applied • Under Review
                                                    </Badge>
                                                ) : status === 'eligible' ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                        <CheckCircle className="w-3 h-3" /> Eligible to Apply
                                                    </Badge>
                                                ) : status === 'incomplete' ? (
                                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                        <AlertCircle className="w-3 h-3" /> Profile Incomplete
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                                                        <AlertCircle className="w-3 h-3" /> Ineligible
                                                    </Badge>
                                                )
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <IndianRupee className="w-4 h-4" /> 
                                                <span>{job.ctc ? `${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                <span>{parseArrayDisplay(job.location).join(', ') || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                <span>Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Rolling'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-4 h-4" />
                                                <span>{job.num_rounds || '—'} rounds</span>
                                            </div>
                                        </div>

                                        <div className="mt-3.5 pt-2.5 border-t border-border/30 text-xs flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                            <div>
                                                <span className="font-semibold text-foreground/80">Branches: </span>
                                                <span className="font-medium">{parseArrayDisplay(job.allowed_branches).join(', ') || 'All'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-foreground/80">Years: </span>
                                                <span className="font-medium">{parseArrayDisplay(job.allowed_years).map(y => getYearDisplay(y)).join(', ') || 'All'}</span>
                                            </div>
                                            {job.allowed_graduation_years && parseArrayDisplay(job.allowed_graduation_years).length > 0 && (
                                                <div>
                                                    <span className="font-semibold text-foreground/80">Grad Years: </span>
                                                    <span className="font-medium">{parseArrayDisplay(job.allowed_graduation_years).join(', ')}</span>
                                                </div>
                                            )}
                                            {parseFloat(job.min_cgpa) > 0 && (
                                                <div>
                                                    <span className="font-semibold text-foreground/80">Min CGPA: </span>
                                                    <span className="font-medium">{job.min_cgpa}</span>
                                                </div>
                                            )}
                                        </div>

                                        {role === 'student' && status === 'ineligible' && reasons.length > 0 && (
                                            <div className="mt-3 p-2 bg-destructive/5 rounded-md">
                                                <p className="text-xs text-destructive font-medium mb-1">Not Eligible:</p>
                                                {reasons.map((r, i) => (
                                                    <p key={i} className="text-xs text-destructive/80">• {r}</p>
                                                ))}
                                            </div>
                                        )}

                                        {role === 'student' && status === 'incomplete' && (
                                            <div className="mt-3 p-2.5 bg-amber-500/5 rounded-md border border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                                    Complete your profile to check eligibility.
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-bold px-2.5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 shrink-0"
                                                    onClick={() => navigate('/profile')}
                                                >
                                                    Complete Profile
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {role === 'admin' ? renderAdminDashboard() : renderStudentView()}

            {/* Admin Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Delete Job Posting?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this job listing? This action cannot be undone, and all application records related to this job may be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setJobToDelete(null); }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
