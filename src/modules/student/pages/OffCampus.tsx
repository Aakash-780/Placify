import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    ExternalLink, MapPin, Search, Briefcase, Clock, IndianRupee, Building2, Plus, Edit, Trash2, Check, X, ShieldAlert, AlertCircle, ArrowUpRight
} from 'lucide-react';

const initialForm = {
    title: '',
    company: '',
    location: '',
    job_type: 'full_time',
    stipend: '',
    ctc: '',
    deadline: '',
    apply_link: '',
    description: ''
};

export default function OffCampus() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const { user } = useUser();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');

    // Add/Edit Modal States
    const [isOpen, setIsOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<any | null>(null);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Tab for admin or user views
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'listings' | 'my_listings' | 'admin') || 'listings';
    const setActiveTab = (tab: 'listings' | 'my_listings' | 'admin') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    // Admin Rejection Dialog States
    const [rejectJobId, setRejectJobId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            let query = insforge.database.from('off_campus_jobs').select('*');

            // If recruiter or student, fetch approved jobs + their own listings
            if (role !== 'admin' && roleData?.id) {
                query = query.or(`status.eq.approved,created_by.eq.${roleData.id}`);
            } else if (role !== 'admin') {
                query = query.eq('status', 'approved');
            }
            // Admins can query everything (no filter needed)

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error('Failed to load off campus jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [role, roleData?.id]);

    const validateJob = (data: typeof initialForm) => {
        const errs: Record<string, string> = {};
        if (!data.title.trim()) errs.title = "Job Title is required.";
        if (!data.company.trim()) errs.company = "Company Name is required.";
        if (!data.job_type) errs.job_type = "Job Type is required.";
        if (!data.description.trim()) errs.description = "Description is required.";

        if (!data.apply_link.trim()) {
            errs.apply_link = "Application Link is required.";
        } else {
            try {
                new URL(data.apply_link);
            } catch (_) {
                errs.apply_link = "Please enter a valid URL (e.g. https://careers.company.com).";
            }
        }

        if (data.deadline) {
            const deadDate = new Date(data.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (deadDate < today) {
                errs.deadline = "Deadline cannot be in the past.";
            }
        }
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleData?.id) {
            alert('Please select a role first.');
            return;
        }

        const valErrors = validateJob(form);
        if (Object.keys(valErrors).length > 0) {
            setErrors(valErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                title: form.title,
                company: form.company,
                location: form.location || null,
                job_type: form.job_type,
                stipend: form.stipend || 'N/A',
                ctc: form.ctc || 'N/A',
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                apply_link: form.apply_link,
                description: form.description,
                created_by: roleData.id,
                created_by_role: role,
                status: role === 'admin' ? 'approved' : 'pending',
                approved_by_admin: role === 'admin'
            };
            if (role !== 'admin') {
                payload.rejection_reason = null;
            }

            if (editingJob) {
                if (role !== 'admin' && editingJob.status !== 'pending' && editingJob.status !== 'rejected') {
                    alert("This opportunity has already been approved and can no longer be modified.");
                    throw new Error('Approved listings cannot be edited');
                }
                const { error } = await insforge.database
                    .from('off_campus_jobs')
                    .update(payload)
                    .eq('id', editingJob.id);

                if (error) throw error;

                if (role !== 'admin' && editingJob.status === 'rejected') {
                    // Send resubmission notification
                    await insforge.database.from('notifications').insert({
                        user_id: roleData.id,
                        message: `Your opportunity has been resubmitted for review.`,
                        type: 'info'
                    });
                }
                alert('Opportunity updated successfully.');
            } else {
                const { error } = await insforge.database
                    .from('off_campus_jobs')
                    .insert([payload]);

                if (error) throw error;
                alert(role === 'admin' ? 'Opportunity posted successfully.' : 'Opportunity submitted successfully. It will be visible once approved by an Admin.');
            }

            setIsOpen(false);
            setForm(initialForm);
            setEditingJob(null);
            setErrors({});
            fetchJobs();
        } catch (err) {
            console.error('Submission error:', err);
            alert('An error occurred during submission.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (job && role !== 'admin' && job.status !== 'pending') {
            alert("Approved or rejected opportunities cannot be deleted.");
            throw new Error('Approved listings cannot be deleted');
        }
        if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .delete()
                .eq('id', jobId);

            if (error) throw error;
            alert('Opportunity deleted successfully.');
            fetchJobs();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete opportunity.');
        }
    };

    const handleStatusChange = async (jobId: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            const updatePayload: any = {
                status: status,
                approved_by_admin: status === 'approved'
            };
            if (status === 'rejected') {
                updatePayload.rejection_reason = reason || null;
            } else {
                updatePayload.rejection_reason = null;
            }

            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update(updatePayload)
                .eq('id', jobId);

            if (error) throw error;

            // Send notification
            const job = jobs.find(j => j.id === jobId);
            if (job) {
                if (status === 'approved') {
                    await insforge.database.from('notifications').insert({
                        user_id: job.created_by,
                        message: `Your opportunity has been approved and is now publicly visible.`,
                        type: 'success'
                    });
                } else if (status === 'rejected') {
                    await insforge.database.from('notifications').insert({
                        user_id: job.created_by,
                        message: `Your Off-Campus Opportunity has been rejected.\n\nReason:\n${reason}`,
                        type: 'error'
                    });
                }
            }

            alert(`Opportunity successfully ${status === 'approved' ? 'approved' : 'rejected'}.`);
            fetchJobs();
        } catch (err) {
            console.error('Status update error:', err);
            alert('Failed to update status.');
        }
    };

    const handleResubmit = async (jobId: string) => {
        try {
            const { error } = await insforge.database
                .from('off_campus_jobs')
                .update({
                    status: 'pending',
                    rejection_reason: null
                })
                .eq('id', jobId);

            if (error) throw error;

            // Send notification
            await insforge.database.from('notifications').insert({
                user_id: roleData?.id,
                message: `Your opportunity has been resubmitted for review.`,
                type: 'info'
            });

            alert('Your opportunity has been resubmitted for review.');
            fetchJobs();
        } catch (err) {
            console.error('Resubmit error:', err);
            alert('Failed to resubmit opportunity.');
        }
    };

    const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return '';
        return dateStr.substring(0, 10);
    };

    const getCreatorLabel = (roleStr: string) => {
        if (roleStr === 'admin') return 'Admin';
        if (roleStr === 'recruiter') return 'Recruiter';
        if (roleStr === 'student') return 'Student';
        return 'Community User';
    };

    // Filters for approved/listings view
    const filteredListings = jobs
        .filter(j => {
            if (activeTab === 'my_listings') {
                return roleData?.id && j.created_by === roleData.id;
            }
            return j.status === 'approved';
        })
        .filter(j =>
            !search ||
            j.company.toLowerCase().includes(search.toLowerCase()) ||
            j.title.toLowerCase().includes(search.toLowerCase())
        );

    // Filters for Admin queue tab
    const filteredAdminListings = jobs
        .filter(j => statusFilter === 'all' || j.status === statusFilter)
        .filter(j =>
            !search ||
            j.company.toLowerCase().includes(search.toLowerCase()) ||
            j.title.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Off-Campus Opportunities</h1>
                    <p className="text-muted-foreground mt-1">Explore off-campus job and internship openings</p>
                </div>
                {roleData?.id && (
                    <div>
                        <Button 
                            className="w-full sm:w-auto font-bold rounded-xl"
                            onClick={() => { setEditingJob(null); setForm(initialForm); setErrors({}); setIsOpen(true); }}
                        >
                            <Plus className="w-4 h-4 mr-2" />Add Opportunity
                        </Button>
                    </div>
                )}
            </div>

            {/* Navigation tabs */}
            {roleData?.id && (
                <div className="flex border-b border-border/40 gap-4 mb-4">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={cn(
                            "pb-2 font-semibold text-sm border-b-2 transition-all",
                            activeTab === 'listings' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active Openings
                    </button>
                    {role === 'admin' ? (
                        <button
                            onClick={() => navigate('/admin/off-campus')}
                            className={cn(
                                "pb-2 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5",
                                activeTab === 'admin' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ShieldAlert className="w-4 h-4" /> Off-Campus Management
                        </button>
                    ) : (
                        <button
                            onClick={() => setActiveTab('my_listings')}
                            className={cn(
                                "pb-2 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5",
                                activeTab === 'my_listings' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Briefcase className="w-4 h-4" /> My Listings
                        </button>
                    )}
                </div>
            )}

            {/* Search and filter header */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by company or role..."
                        className="pl-10"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {role === 'admin' && activeTab === 'admin' && (
                    <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Submissions</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Card key={i} className="h-36 animate-pulse bg-muted/50" />)}
                </div>
            ) : activeTab === 'admin' && role === 'admin' ? (
                // Admin Management List
                filteredAdminListings.length === 0 ? (
                    <Card><CardContent className="p-12 text-center"><Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p>No submissions found.</p></CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {filteredAdminListings.map(job => (
                            <Card key={job.id} className="border-border/40 bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-heading font-bold text-lg text-foreground">{job.title}</h3>
                                            <Badge variant={job.job_type === 'internship' ? 'warning' : 'secondary'} className="capitalize">{job.job_type || 'Job'}</Badge>
                                            {job.created_by_role === 'admin' && (
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold py-0.5">
                                                    ✓ Official
                                                </Badge>
                                            )}
                                            <Badge className={cn(
                                                "text-[10px] py-0 px-2 font-semibold border",
                                                job.status === 'active' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                job.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                job.status === 'rejected' && "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-muted-foreground">{job.company} — <span className="font-normal">{job.location || 'Remote'}</span></p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                                        <div className="text-[11px] text-muted-foreground flex gap-3 mt-1.5 flex-wrap">
                                            <span>Stipend: {job.stipend || 'N/A'}</span>
                                            <span>CTC: {job.ctc || 'N/A'}</span>
                                            <span>Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Submitted by: <span className="font-medium text-foreground/85 capitalize">{job.created_by_role}</span> ({job.created_by})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                                        {job.status === 'pending' && (
                                            <>
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-grow md:flex-none" onClick={() => handleStatusChange(job.id, 'approved')}>
                                                    <Check className="w-4 h-4 mr-1.5" /> Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" className="flex-grow md:flex-none" onClick={() => {
                                                    setRejectJobId(job.id);
                                                    setRejectionReason('');
                                                    setIsRejectOpen(true);
                                                }}>
                                                    <X className="w-4 h-4 mr-1.5" /> Reject
                                                </Button>
                                            </>
                                        )}
                                        {(job.status === 'approved' || job.status === 'active') && (
                                            <Button size="sm" variant="outline" className="flex-grow md:flex-none" onClick={() => {
                                                setRejectJobId(job.id);
                                                setRejectionReason('');
                                                setIsRejectOpen(true);
                                            }}>
                                                <X className="w-4 h-4 mr-1.5" /> Reject / Deactivate
                                            </Button>
                                        )}
                                        {job.status === 'rejected' && (
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-grow md:flex-none" onClick={() => handleStatusChange(job.id, 'approved')}>
                                                <Check className="w-4 h-4 mr-1.5" /> Approve / Reactivate
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(job.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                // Active listings view
                filteredListings.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-lg font-medium">No off-campus jobs found</p>
                            <p className="text-sm text-muted-foreground">Check back later for new opportunities</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
                        {filteredListings.map(job => (
                            <Card key={job.id} className="card-hover relative border border-border/40 bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-5 h-5 text-violet-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-heading font-semibold text-foreground truncate">{job.title}</h3>
                                                    <p className="text-sm text-muted-foreground truncate">{job.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Badge variant={job.job_type === 'internship' ? 'warning' : 'secondary'} className="capitalize">{job.job_type || 'Job'}</Badge>
                                                {job.created_by_role === 'admin' && (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] py-0.5 px-1.5 font-semibold">
                                                        ✓ Official
                                                    </Badge>
                                                )}
                                                {roleData?.id && job.created_by === roleData.id && (
                                                    <Badge className={cn(
                                                        "text-[9px] py-0.2 px-1.5 border font-semibold",
                                                        (job.status === 'approved' || job.status === 'active') && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                        job.status === 'pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                        job.status === 'rejected' && "bg-red-500/10 text-red-500 border-red-500/20",
                                                        job.status === 'closed' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                                    )}>
                                                        {job.status === 'approved' || job.status === 'active' ? 'Status: Approved ✓' : job.status === 'pending' ? 'Pending Review' : job.status === 'closed' ? 'Status: Closed ✓' : 'Status: Rejected'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                                            {job.description}
                                        </p>

                                        {job.status === 'rejected' && job.rejection_reason && (
                                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs space-y-1">
                                                <div className="font-semibold text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Rejected by Admin
                                                </div>
                                                <p className="text-muted-foreground">
                                                    <strong>Reason:</strong> {job.rejection_reason}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            {job.location && <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5" />{job.location}</div>}
                                            {job.job_type === 'internship' ? (
                                                <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" />₹{job.stipend || 'N/A'}/mo</div>
                                            ) : (
                                                <div className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" />{job.ctc || 'N/A'} LPA</div>
                                            )}
                                            {job.deadline && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(job.deadline).toLocaleDateString()}</div>}
                                        </div>

                                        <p className="text-[11px] text-muted-foreground mt-3 pt-2.5 border-t border-border/10">
                                            Listed by: <span className="font-semibold text-foreground/80 capitalize">{getCreatorLabel(job.created_by_role)}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {job.apply_link && (
                                            <Button size="sm" className="w-full text-xs font-semibold" asChild>
                                                <a href={job.apply_link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Apply Externally
                                                </a>
                                            </Button>
                                        )}

                                        {(role === 'admin' || (roleData?.id && job.created_by === roleData.id && (job.status === 'pending' || job.status === 'rejected'))) && (
                                            <div className="flex gap-2 pt-2 border-t border-border/10">
                                                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => {
                                                    if (role !== 'admin' && job.status !== 'pending' && job.status !== 'rejected') {
                                                        alert("This opportunity has already been approved and can no longer be modified.");
                                                        return;
                                                    }
                                                    setEditingJob(job);
                                                    setForm({
                                                        title: job.title,
                                                        company: job.company,
                                                        location: job.location || '',
                                                        job_type: job.job_type || 'full_time',
                                                        stipend: job.stipend || '',
                                                        ctc: job.ctc || '',
                                                        deadline: formatDateForInput(job.deadline),
                                                        apply_link: job.apply_link,
                                                        description: job.description || ''
                                                    });
                                                    setErrors({});
                                                    setIsOpen(true);
                                                }}>
                                                    <Edit className="w-3.5 h-3.5 mr-1" />Edit
                                                </Button>
                                                {role === 'admin' || job.status === 'pending' ? (
                                                    <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => handleDelete(job.id)}>
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                                                    </Button>
                                                ) : job.status === 'rejected' ? (
                                                    <Button size="sm" className="flex-1 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleResubmit(job.id)}>
                                                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />Resubmit For Review
                                                    </Button>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            )}

            {/* Admin Rejection Reason Dialog */}
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
                                if (rejectJobId && rejectionReason.trim()) {
                                    setIsRejectOpen(false);
                                    await handleStatusChange(rejectJobId, 'rejected', rejectionReason.trim());
                                }
                            }}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Form */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
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

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : editingJob ? 'Save Changes' : 'Submit Opportunity'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
