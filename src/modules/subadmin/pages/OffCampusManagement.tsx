import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { 
    Briefcase, Search, Check, X, Trash2, Calendar, MapPin, 
    IndianRupee, Eye, AlertCircle, ArrowUpRight, Archive, 
    RotateCcw, TrendingUp, Sparkles, Clock, Plus 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Polymorphic author helper to batch query students, admins, and recruiters
async function fetchAuthors(items: { author_id: string; author_type: string }[]) {
    const studentIds = Array.from(new Set(items.filter(i => i.author_type === 'student' && i.author_id).map(i => i.author_id)));
    const adminIds = Array.from(new Set(items.filter(i => i.author_type === 'admin' && i.author_id).map(i => i.author_id)));
    const recruiterIds = Array.from(new Set(items.filter(i => i.author_type === 'recruiter' && i.author_id).map(i => i.author_id)));

    const authorMap: Record<string, { name: string; avatar_url: string | null; role: string }> = {};
    const queries: Promise<any>[] = [];

    if (studentIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('students')
                    .select('id, name, profile_photo_url')
                    .in('id', studentIds)
            ).then(({ data }) => {
                (data || []).forEach((s: any) => {
                    authorMap[s.id] = {
                        name: s.name,
                        avatar_url: s.profile_photo_url,
                        role: 'Student',
                    };
                });
            })
        );
    }

    if (adminIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('admins')
                    .select('id, name, profile_photo_url')
                    .in('id', adminIds)
            ).then(({ data }) => {
                (data || []).forEach((a: any) => {
                    authorMap[a.id] = {
                        name: a.name,
                        avatar_url: a.profile_photo_url,
                        role: 'Admin',
                    };
                });
            })
        );
    }

    if (recruiterIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('recruiters')
                    .select('id, name, profile_photo_url')
                    .in('id', recruiterIds)
            ).then(({ data }) => {
                (data || []).forEach((r: any) => {
                    authorMap[r.id] = {
                        name: r.name,
                        avatar_url: r.profile_photo_url,
                        role: 'Recruiter',
                    };
                });
            })
        );
    }

    try {
        await Promise.all(queries);
    } catch (err) {
        console.error("Error batch fetching authors:", err);
    }

    return authorMap;
}

export default function OffCampusManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const { role, roleData } = useRole();
    const [listings, setListings] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const initialForm = {
        title: '',
        company: '',
        location: '',
        job_type: 'full_time',
        stipend: '',
        ctc: '',
        deadline: '',
        apply_link: '',
        description: '',
        requirements: '',
        additional_notes: ''
    };
    const [form, setForm] = useState(initialForm);

    const parseDescription = (desc: string) => {
        let descriptionText = desc || '';
        let requirementsText = '';
        let notesText = '';

        const reqIndex = descriptionText.indexOf('\n\n--- Requirements ---\n');
        const notesIndex = descriptionText.indexOf('\n\n--- Additional Notes ---\n');

        if (notesIndex !== -1) {
            notesText = descriptionText.substring(notesIndex + '\n\n--- Additional Notes ---\n'.length);
            descriptionText = descriptionText.substring(0, notesIndex);
        }
        if (reqIndex !== -1) {
            requirementsText = descriptionText.substring(reqIndex + '\n\n--- Requirements ---\n'.length);
            descriptionText = descriptionText.substring(0, reqIndex);
        }

        return {
            description: descriptionText.trim(),
            requirements: requirementsText.trim(),
            additional_notes: notesText.trim()
        };
    };

    const handleEditClick = (job: any) => {
        const parsed = parseDescription(job.description);
        setEditingJob(job);
        setForm({
            title: job.title,
            company: job.company,
            location: job.location || '',
            job_type: job.job_type || 'full_time',
            stipend: job.stipend || '',
            ctc: job.ctc || '',
            deadline: job.deadline ? job.deadline.substring(0, 10) : '',
            apply_link: job.apply_link,
            description: parsed.description,
            requirements: parsed.requirements,
            additional_notes: parsed.additional_notes
        });
        setIsOpen(true);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = 'Job title is required';
        if (!form.company.trim()) newErrors.company = 'Company name is required';
        if (!form.apply_link.trim()) {
            newErrors.apply_link = 'Application URL is required';
        } else {
            try {
                new URL(form.apply_link);
            } catch (_) {
                newErrors.apply_link = 'Please enter a valid URL (e.g. https://...)';
            }
        }
        if (!form.description.trim()) newErrors.description = 'Job description is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !roleData?.id) return;

        setSubmitting(true);
        try {
            let fullDescription = form.description.trim();
            if (form.requirements.trim()) {
                fullDescription += `\n\n--- Requirements ---\n${form.requirements.trim()}`;
            }
            if (form.additional_notes.trim()) {
                fullDescription += `\n\n--- Additional Notes ---\n${form.additional_notes.trim()}`;
            }

            const payload: any = {
                title: form.title.trim(),
                company: form.company.trim(),
                location: form.location.trim() || 'Remote',
                job_type: form.job_type,
                stipend: form.job_type === 'internship' ? (form.stipend.trim() || 'N/A') : 'N/A',
                ctc: form.job_type !== 'internship' ? (form.ctc.trim() || 'N/A') : 'N/A',
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                apply_link: form.apply_link.trim(),
                description: fullDescription,
                created_by: roleData.id,
                created_by_role: 'admin',
                status: 'approved',
                approved_by_admin: true,
                rejection_reason: null
            };

            if (editingJob) {
                const { error } = await insforge.database
                    .from('off_campus_jobs')
                    .update(payload)
                    .eq('id', editingJob.id);

                if (error) throw error;
                alert('Opportunity updated successfully.');
            } else {
                const { error } = await insforge.database
                    .from('off_campus_jobs')
                    .insert([payload]);

                if (error) throw error;
                alert('Opportunity posted successfully.');
            }

            setIsOpen(false);
            setForm(initialForm);
            setEditingJob(null);
            setErrors({});
            fetchListings();
        } catch (err) {
            console.error('Submission error:', err);
            alert('Failed to save opportunity.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const state = location.state as any;
        if (state?.openCreate) {
            setEditingJob(null);
            setForm(initialForm);
            setErrors({});
            setIsOpen(true);
            // Clear location state to prevent reopening on reload/nav changes
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);
    const [authors, setAuthors] = useState<Record<string, { name: string; avatar_url: string | null; role: string }>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'closed'>(() => {
        const saved = localStorage.getItem("offCampusActiveTab");
        if (saved === 'all' || saved === 'approved' || saved === 'pending' || saved === 'rejected' || saved === 'closed') {
            return saved as 'all' | 'approved' | 'pending' | 'rejected' | 'closed';
        }
        return 'approved';
    });
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline' | 'company' | 'status'>('newest');
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        localStorage.setItem("offCampusActiveTab", statusFilter);
    }, [statusFilter]);

    // Rejection reason dialog states
    const [rejectJob, setRejectJob] = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('off_campus_jobs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const fetched = data || [];

            // Auto-close expired opportunities dynamically on fetch
            const now = new Date();
            const expiredJobs = fetched.filter(job => 
                job.status !== 'closed' && 
                job.deadline && 
                new Date(job.deadline) < now
            );

            if (expiredJobs.length > 0) {
                console.log(`Auto-closing ${expiredJobs.length} expired opportunities...`);
                await Promise.all(expiredJobs.map(job => 
                    insforge.database
                        .from('off_campus_jobs')
                        .update({ status: 'closed' })
                        .eq('id', job.id)
                ));
                // Refetch listings after closing
                const { data: refreshedData, error: refreshError } = await insforge.database
                    .from('off_campus_jobs')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!refreshError && refreshedData) {
                    setListings(refreshedData);
                } else {
                    setListings(fetched);
                }
            } else {
                setListings(fetched);
            }
            setLastUpdated(new Date());

            // Extract unique creators for batch lookup
            const listToLookup = expiredJobs.length > 0 ? (listings.length > 0 ? listings : fetched) : fetched;
            const authorLookups = listToLookup.map((j: any) => ({
                author_id: j.created_by,
                author_type: j.created_by_role
            }));

            if (authorLookups.length > 0) {
                const namesMap = await fetchAuthors(authorLookups);
                setAuthors(namesMap);
            }
        } catch (err) {
            console.error("Failed to load off-campus listings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'admin') {
            fetchListings();
        }
    }, [role]);

    const handleApprove = async (job: any) => {
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update({
                    status: 'approved',
                    approved_by_admin: true,
                    rejection_reason: null
                })
                .eq('id', job.id);
            
            if (error) throw error;

            // Insert notification
            await insforge.database.from('notifications').insert({
                user_id: job.created_by,
                message: `Your opportunity has been approved and is now publicly visible.`,
                type: 'success'
            });

            alert(`Opportunity "${job.title}" successfully approved.`);
            fetchListings();
        } catch (err) {
            console.error("Failed to approve job:", err);
            alert("Failed to approve opportunity.");
        }
    };

    const handleReject = async (job: any, reason: string) => {
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                })
                .eq('id', job.id);
            
            if (error) throw error;

            // Insert notification
            await insforge.database.from('notifications').insert({
                user_id: job.created_by,
                message: `Your Off-Campus Opportunity has been rejected.\n\nReason:\n${reason}`,
                type: 'error'
            });

            alert(`Opportunity "${job.title}" successfully rejected.`);
            fetchListings();
        } catch (err) {
            console.error("Failed to reject job:", err);
            alert("Failed to reject opportunity.");
        }
    };

    const handleClose = async (job: any) => {
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update({
                    status: 'closed'
                })
                .eq('id', job.id);
            
            if (error) throw error;
            alert(`Opportunity "${job.title}" successfully closed.`);
            fetchListings();
        } catch (err) {
            console.error("Failed to close job:", err);
            alert("Failed to close opportunity.");
        }
    };

    const handleRestore = async (job: any) => {
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update({
                    status: 'approved'
                })
                .eq('id', job.id);
            
            if (error) throw error;
            alert(`Opportunity "${job.title}" successfully restored and approved.`);
            fetchListings();
        } catch (err) {
            console.error("Failed to restore job:", err);
            alert("Failed to restore opportunity.");
        }
    };

    const handleDelete = async (job: any) => {
        if (!confirm(`Are you sure you want to permanently delete "${job.title}"?\n\nThis action cannot be undone.`)) return;
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .delete()
                .eq('id', job.id);
            
            if (error) throw error;

            alert(`Opportunity "${job.title}" successfully deleted.`);
            fetchListings();
            if (selectedJob?.id === job.id) {
                setIsDetailsOpen(false);
            }
        } catch (err) {
            console.error("Failed to delete job:", err);
            alert("Failed to delete opportunity.");
        }
    };

    if (role !== 'admin' && role !== 'organization_admin') {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">Only Admins are permitted to view off-campus moderation.</p>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </div>
        );
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
        total: listings.length,
        pending: listings.filter(j => j.status === 'pending').length,
        approved: listings.filter(j => j.status === 'approved' || j.status === 'active').length,
        rejected: listings.filter(j => j.status === 'rejected').length,
        closed: listings.filter(j => j.status === 'closed').length
    };

    // Calculate dynamic micro-insights
    const pendingToday = listings.filter(j => j.status === 'pending' && new Date(j.created_at) >= oneDayAgo).length;
    const approvedThisWeek = listings.filter(j => (j.status === 'approved' || j.status === 'active') && new Date(j.created_at) >= sevenDaysAgo).length;
    const rejectedThisWeek = listings.filter(j => j.status === 'rejected' && new Date(j.created_at) >= sevenDaysAgo).length;
    const totalThisWeek = listings.filter(j => new Date(j.created_at) >= sevenDaysAgo).length;

    // Monthly stats
    const approvedThisMonth = listings.filter(j => (j.status === 'approved' || j.status === 'active') && new Date(j.created_at) >= startOfMonth).length;
    const rejectedThisMonth = listings.filter(j => j.status === 'rejected' && new Date(j.created_at) >= startOfMonth).length;
    const expiredOpportunities = listings.filter(j => j.deadline && new Date(j.deadline) < now).length;

    const filtered = listings.filter(job => {
        const creator = authors[job.created_by] || { name: 'Anonymous User' };
        const matchSearch = !search ||
            job.company.toLowerCase().includes(search.toLowerCase()) ||
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            creator.name.toLowerCase().includes(search.toLowerCase());
        
        let matchStatus = false;
        if (statusFilter === 'all') {
            matchStatus = true;
        } else if (statusFilter === 'approved') {
            matchStatus = job.status === 'approved' || job.status === 'active';
        } else {
            matchStatus = job.status === statusFilter;
        }
        return matchSearch && matchStatus;
    });

    const sortedListings = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'deadline') {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'company') {
            return a.company.localeCompare(b.company);
        }
        if (sortBy === 'status') {
            return a.status.localeCompare(b.status);
        }
        return 0;
    });

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header section */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Off-Campus Job Management</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Monitor, review, approve and manage community-submitted opportunities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SubadminFeatureToggle featureKey="off_campus" />
                        <Button 
                            onClick={() => {
                                setEditingJob(null);
                                setForm(initialForm);
                                setErrors({});
                                setIsOpen(true);
                            }} 
                            className="sm:w-auto self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Post Opportunity
                        </Button>
                    </div>
                </div>
                {/* Summary Row */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground bg-muted/20 border border-border/10 rounded-xl p-3 px-4">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary/70" />
                        <span>Last Updated: <strong className="text-foreground font-medium">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
                    </div>
                    <div className="h-4 w-px bg-border/40 hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pending Reviews: <strong className="text-foreground font-semibold">{stats.pending}</strong></span>
                    </div>
                    <div className="h-4 w-px bg-border/40 hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Total Active Opportunities: <strong className="text-foreground font-semibold">{stats.approved}</strong></span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                    onClick={() => setStatusFilter('approved')}
                    className={cn(
                        "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                        statusFilter === 'approved' ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5" : "border-border/60"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground">Approved</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-heading tracking-tight">{stats.approved}</span>
                        {approvedThisWeek > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-500">
                                +{approvedThisWeek} this week
                            </span>
                        )}
                    </div>
                </button>
                
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={cn(
                        "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                        statusFilter === 'pending' ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5" : "border-border/60"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground">Pending</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Reviews
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-heading tracking-tight">{stats.pending}</span>
                        {pendingToday > 0 && (
                            <span className="text-[11px] font-semibold text-amber-500">
                                +{pendingToday} today
                            </span>
                        )}
                    </div>
                </button>

                <button
                    onClick={() => setStatusFilter('rejected')}
                    className={cn(
                        "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                        statusFilter === 'rejected' ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5" : "border-border/60"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground">Rejected</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Declined
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-heading tracking-tight">{stats.rejected}</span>
                        {rejectedThisWeek > 0 && (
                            <span className="text-[11px] font-semibold text-red-500">
                                +{rejectedThisWeek} this week
                            </span>
                        )}
                    </div>
                </button>

                <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        "text-left p-3.5 rounded-xl border transition-all duration-200 bg-card hover:bg-muted/40 shadow-sm",
                        statusFilter === 'all' ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5" : "border-border/60"
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
                        {totalThisWeek > 0 && (
                            <span className="text-[11px] font-semibold text-blue-500">
                                +{totalThisWeek} this week
                            </span>
                        )}
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
                            {(['all', 'approved', 'pending', 'rejected', 'closed'] as const).map(status => {
                                const label = status === 'all' ? 'All' : status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : status === 'rejected' ? 'Rejected' : 'Closed';
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={cn(
                                            "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                                            statusFilter === status
                                                ? "bg-background text-foreground shadow-sm animate-fade-in"
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
                                    placeholder="Search by company, title, or creator name..."
                                    className="pl-10 h-9"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                                <SelectTrigger className="w-full sm:w-[170px] h-9">
                                    <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                    <SelectItem value="company">Company Name</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Opportunities List */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-muted/50" />)}
                        </div>
                    ) : sortedListings.length === 0 ? (
                        <Card className="border-border/40">
                            <CardContent className="p-10 text-center text-muted-foreground text-sm">
                                <Briefcase className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                                No opportunities found matching the selected status or filters.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {sortedListings.map(job => {
                                const creator = authors[job.created_by] || { name: 'Anonymous User', role: 'Student' };
                                const creationDate = new Date(job.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                });

                                return (
                                    <Card key={job.id} className="border-border/40 bg-card/60 backdrop-blur-sm hover:shadow-sm transition-all duration-200">
                                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-heading font-bold text-lg text-foreground truncate">{job.title}</h3>
                                                    <Badge variant={job.job_type === 'internship' ? 'warning' : 'secondary'} className="capitalize text-[10px] font-semibold py-0.5">
                                                        {job.job_type || 'Job'}
                                                    </Badge>
                                                    {job.created_by_role === 'admin' && (
                                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold py-0.5">
                                                            ✓ Official
                                                        </Badge>
                                                    )}
                                                    <Badge 
                                                        className={cn(
                                                            "text-[10px] py-0.5 px-2 font-semibold border capitalize tracking-wide",
                                                            (job.status === 'approved' || job.status === 'active') && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                            job.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                            job.status === 'rejected' && "bg-red-500/10 text-red-500 border-red-500/20",
                                                            job.status === 'closed' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                                        )}
                                                    >
                                                        {job.status === 'approved' || job.status === 'active' ? 'Approved' : job.status === 'closed' ? 'Closed' : job.status}
                                                    </Badge>
                                                    {job.deadline && new Date(job.deadline) < now && (
                                                        <Badge variant="destructive" className="text-[10px] font-semibold py-0.5 flex items-center gap-0.5">
                                                            <Clock className="w-3 h-3" /> Expired
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    {job.company} — <span className="font-normal text-muted-foreground/80">{job.location || 'Remote'}</span>
                                                </p>

                                                <div className="text-xs text-muted-foreground flex gap-x-4 gap-y-1 mt-1 flex-wrap items-center">
                                                    <span>Creator: <strong className="font-medium text-foreground/80">{creator.name}</strong></span>
                                                    <span className="hidden sm:inline text-border/40">•</span>
                                                    <span>Role: <strong className="font-medium text-foreground/80 capitalize">{job.created_by_role}</strong></span>
                                                    <span className="hidden sm:inline text-border/40">•</span>
                                                    <span>Posted: {creationDate}</span>
                                                </div>
                                                
                                                {job.status === 'rejected' && job.rejection_reason && (
                                                    <div className="mt-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg p-2 border border-red-500/15 inline-block">
                                                        <strong>Reason:</strong> {job.rejection_reason}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-shrink-0">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedJob(job);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                    className="h-8 text-xs flex-grow md:flex-grow-0"
                                                >
                                                    <Eye className="w-4 h-4 mr-1.5" /> Details
                                                </Button>

                                                {job.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs flex-grow md:flex-grow-0"
                                                            onClick={() => handleApprove(job)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1.5" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 text-xs flex-grow md:flex-grow-0"
                                                            onClick={() => {
                                                                setRejectJob(job);
                                                                setRejectionReason('');
                                                                setIsRejectOpen(true);
                                                            }}
                                                        >
                                                            <X className="w-4 h-4 mr-1.5" /> Reject
                                                        </Button>
                                                    </>
                                                )}

                                                {(job.status === 'approved' || job.status === 'active') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border border-border flex-grow md:flex-grow-0"
                                                            onClick={() => handleEditClick(job)}
                                                        >
                                                            <Briefcase className="w-4 h-4 mr-1.5 text-muted-foreground" /> Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8 text-xs border border-border flex-grow md:flex-grow-0"
                                                            onClick={() => handleClose(job)}
                                                        >
                                                            <Archive className="w-4 h-4 mr-1.5 text-muted-foreground" /> Close Listing
                                                        </Button>
                                                    </>
                                                )}

                                                {job.status === 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs flex-grow md:flex-grow-0"
                                                        onClick={() => handleApprove(job)}
                                                    >
                                                        <Check className="w-4 h-4 mr-1.5" /> Re-Approve
                                                    </Button>
                                                )}

                                                {job.status === 'closed' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border border-border flex-grow md:flex-grow-0"
                                                            onClick={() => handleEditClick(job)}
                                                        >
                                                            <Briefcase className="w-4 h-4 mr-1.5 text-muted-foreground" /> Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs flex-grow md:flex-grow-0"
                                                            onClick={() => handleRestore(job)}
                                                        >
                                                            <RotateCcw className="w-4 h-4 mr-1.5" /> Restore
                                                        </Button>
                                                    </>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(job)}
                                                    className="h-8 flex-grow md:flex-grow-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
                    {/* Progress Overview Card */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                <TrendingUp className="w-4 h-4 text-primary" /> Progress Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            {(() => {
                                const totalCount = stats.approved + stats.pending + stats.rejected + stats.closed;
                                const hasData = totalCount > 0;
                                const chartData = [
                                    { name: 'Approved', value: stats.approved, status: 'approved', color: '#10b981' },
                                    { name: 'Pending', value: stats.pending, status: 'pending', color: '#f59e0b' },
                                    { name: 'Rejected', value: stats.rejected, status: 'rejected', color: '#ef4444' },
                                    { name: 'Closed', value: stats.closed, status: 'closed', color: '#6b7280' },
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
                                                            onClick={(data: any) => {
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
                                                    onClick={() => setStatusFilter('approved')}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                        statusFilter === 'approved' && "bg-muted/60 font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-muted-foreground font-medium">Approved</span>
                                                    </div>
                                                    <span className="font-bold text-foreground">{stats.approved}</span>
                                                </button>
                                                <button 
                                                    onClick={() => setStatusFilter('pending')}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                        statusFilter === 'pending' && "bg-muted/60 font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                        <span className="text-muted-foreground font-medium">Pending</span>
                                                    </div>
                                                    <span className="font-bold text-foreground">{stats.pending}</span>
                                                </button>
                                                <button 
                                                    onClick={() => setStatusFilter('rejected')}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                        statusFilter === 'rejected' && "bg-muted/60 font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                        <span className="text-muted-foreground font-medium">Rejected</span>
                                                    </div>
                                                    <span className="font-bold text-foreground">{stats.rejected}</span>
                                                </button>
                                                <button 
                                                    onClick={() => setStatusFilter('closed')}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-1 rounded hover:bg-muted/40 transition-colors text-left",
                                                        statusFilter === 'closed' && "bg-muted/60 font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                                                        <span className="text-muted-foreground font-medium">Closed</span>
                                                    </div>
                                                    <span className="font-bold text-foreground">{stats.closed}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Enhanced Admin Metrics Card */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-primary" /> Moderation Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3.5">
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-border/10">
                                    <span className="text-muted-foreground">Total Opportunities</span>
                                    <span className="font-bold">{stats.total}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/10">
                                    <span className="text-muted-foreground">Pending Reviews</span>
                                    <span className="font-bold text-amber-500">{stats.pending}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/10">
                                    <span className="text-muted-foreground">Approved This Month</span>
                                    <span className="font-bold text-emerald-500">{approvedThisMonth}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/10">
                                    <span className="text-muted-foreground">Rejected This Month</span>
                                    <span className="font-bold text-red-500">{rejectedThisMonth}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/10">
                                    <span className="text-muted-foreground">Expired Opportunities</span>
                                    <span className="font-bold text-gray-400">{expiredOpportunities}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-muted-foreground">Closed Opportunities</span>
                                    <span className="font-bold text-violet-400">{stats.closed}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Rejection Reason Modal */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Reason for Rejection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="rejectionReason">Reason *</Label>
                            <Textarea
                                id="rejectionReason"
                                placeholder="Describe the reason for rejection (e.g. Invalid application link, Incomplete information)..."
                                className="min-h-[100px]"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            disabled={!rejectionReason.trim()}
                            onClick={async () => {
                                if (rejectJob && rejectionReason.trim()) {
                                    setIsRejectOpen(false);
                                    await handleReject(rejectJob, rejectionReason.trim());
                                }
                            }}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Form Dialog Form */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingJob ? '✏️ Edit Opportunity' : '➕ Add Opportunity'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Software Engineer Intern"
                                    value={form.title}
                                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company">Company Name *</Label>
                                <Input
                                    id="company"
                                    placeholder="e.g. Google"
                                    value={form.company}
                                    onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                                />
                                {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g. Bangalore / Remote"
                                    value={form.location}
                                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="job_type">Job Type *</Label>
                                <Select
                                    value={form.job_type}
                                    onValueChange={(val: any) => setForm(prev => ({ ...prev, job_type: val }))}
                                >
                                    <SelectTrigger id="job_type">
                                        <SelectValue placeholder="Select Job Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="internship">Internship</SelectItem>
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.job_type && <p className="text-xs text-red-500">{errors.job_type}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="stipend">Stipend (Monthly, INR)</Label>
                                <Input
                                    id="stipend"
                                    placeholder="e.g. 50,000 or N/A"
                                    value={form.stipend}
                                    disabled={form.job_type !== 'internship'}
                                    onChange={e => setForm(prev => ({ ...prev, stipend: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ctc">CTC (Annual, LPA)</Label>
                                <Input
                                    id="ctc"
                                    placeholder="e.g. 12 or N/A"
                                    value={form.ctc}
                                    disabled={form.job_type === 'internship'}
                                    onChange={e => setForm(prev => ({ ...prev, ctc: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="deadline">Application Deadline</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={form.deadline}
                                    onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                                />
                                {errors.deadline && <p className="text-xs text-red-500">{errors.deadline}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="apply_link">Application URL *</Label>
                                <Input
                                    id="apply_link"
                                    placeholder="https://company.com/careers/job"
                                    value={form.apply_link}
                                    onChange={e => setForm(prev => ({ ...prev, apply_link: e.target.value }))}
                                />
                                {errors.apply_link && <p className="text-xs text-red-500">{errors.apply_link}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the job profile, eligibility, skills, and application process..."
                                className="min-h-[100px]"
                                value={form.description}
                                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea
                                id="requirements"
                                placeholder="Describe key eligibility requirements, required degrees, skills..."
                                className="min-h-[80px]"
                                value={form.requirements}
                                onChange={e => setForm(prev => ({ ...prev, requirements: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="additional_notes">Additional Notes</Label>
                            <Textarea
                                id="additional_notes"
                                placeholder="Any additional links, notes, or referral info..."
                                className="min-h-[80px]"
                                value={form.additional_notes}
                                onChange={e => setForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : editingJob ? 'Save Changes' : 'Submit Opportunity'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Opportunity Details</DialogTitle>
                    </DialogHeader>
                    {selectedJob && (
                        <div className="space-y-4 py-2 text-sm">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
                                <p className="text-base font-semibold text-primary">{selectedJob.company}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3.5 rounded-lg border border-border/10">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Job Type</span>
                                    <span className="font-semibold capitalize">{selectedJob.job_type}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Location</span>
                                    <span className="font-semibold">{selectedJob.location || 'Remote'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Stipend / CTC</span>
                                    <span className="font-semibold">
                                        {selectedJob.job_type === 'internship' 
                                            ? `₹${selectedJob.stipend || 'N/A'}/month` 
                                            : `${selectedJob.ctc || 'N/A'} LPA`}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Deadline</span>
                                    <span className="font-semibold">
                                        {selectedJob.deadline 
                                            ? new Date(selectedJob.deadline).toLocaleDateString('en-IN') 
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {(() => {
                                const parsed = parseDescription(selectedJob.description);
                                return (
                                    <>
                                        <div className="space-y-1">
                                            <span className="text-muted-foreground block text-xs font-bold uppercase">Description</span>
                                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/5">
                                                {parsed.description}
                                            </p>
                                        </div>
                                        {parsed.requirements && (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground block text-xs font-bold uppercase">Requirements</span>
                                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/5">
                                                    {parsed.requirements}
                                                </p>
                                            </div>
                                        )}
                                        {parsed.additional_notes && (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground block text-xs font-bold uppercase">Additional Notes</span>
                                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/5">
                                                    {parsed.additional_notes}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <div className="space-y-1 border-t border-border/15 pt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                                <div>
                                    <span>Submitted by: </span>
                                    <span className="font-semibold text-foreground/80 capitalize">{selectedJob.created_by_role}</span>
                                    <span> ({authors[selectedJob.created_by]?.name || 'Anonymous'})</span>
                                </div>
                                <div>
                                    <span>Date Posted: </span>
                                    <span className="font-semibold text-foreground/80">
                                        {new Date(selectedJob.created_at).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span>Status: </span>
                                    <Badge 
                                        className={cn(
                                            "text-[10px] py-0.5 px-2 font-semibold border capitalize tracking-wide",
                                            (selectedJob.status === 'approved' || selectedJob.status === 'active') && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                            selectedJob.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                            selectedJob.status === 'rejected' && "bg-red-500/10 text-red-500 border-red-500/20",
                                            selectedJob.status === 'closed' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                        )}
                                    >
                                        {selectedJob.status === 'approved' || selectedJob.status === 'active' ? 'Approved' : selectedJob.status === 'closed' ? 'Closed' : selectedJob.status}
                                    </Badge>
                                    {selectedJob.status === 'closed' && selectedJob.deadline && new Date(selectedJob.deadline) < new Date() && (
                                        <span className="text-xs text-red-400 font-semibold ml-2 inline-flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 mt-1 sm:mt-0">
                                            <AlertCircle className="w-3.5 h-3.5" /> Closed Automatically (Deadline Passed)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                                    Close
                                </Button>
                                {selectedJob.apply_link && (
                                    <Button asChild>
                                        <a href={selectedJob.apply_link} target="_blank" rel="noopener noreferrer">
                                            Apply Link <ArrowUpRight className="w-4 h-4 ml-1" />
                                        </a>
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
