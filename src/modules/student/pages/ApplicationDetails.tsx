import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Briefcase, Building2, Calendar, Clock, Video, ArrowLeft,
    CheckCircle2, XCircle, AlertCircle, Sparkles, MessageSquare,
    User, HelpCircle, AlertTriangle, ExternalLink, MapPin, IndianRupee, GraduationCap, Cpu, Terminal
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const parseArrayDisplay = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    return [val];
};

const TIMELINE_STAGES = [
    { key: 'applied', label: 'Applied' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview_scheduled', label: 'Interview Scheduled' },
    { key: 'selected', label: 'Selected' }
];

export default function ApplicationDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { roleData } = useRole();
    const [application, setApplication] = useState<any>(null);
    const [rounds, setRounds] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    const job = application?.jobs || {};
    const currentStatus = application?.status;

    // Dynamically calculate selection rounds from job postings
    const activeStageInfo = React.useMemo(() => {
        let selectionRounds: any[] = [];
        if (job?.selection_rounds) {
            try {
                let parsed: any = null;
                if (Array.isArray(job.selection_rounds)) {
                    parsed = job.selection_rounds;
                } else if (typeof job.selection_rounds === 'string') {
                    parsed = JSON.parse(job.selection_rounds);
                }
                
                if (Array.isArray(parsed)) {
                    selectionRounds = parsed.filter(r => r && typeof r === 'object');
                }
            } catch (e) {
                console.error("Failed to parse selection_rounds:", e);
            }
        }

        // Build list of stages dynamically
        let stages = [...TIMELINE_STAGES];
        const hasCompanyRounds = selectionRounds && selectionRounds.length > 0;
        
        if (hasCompanyRounds) {
            stages = [
                { key: 'applied', label: 'Applied' },
                { key: 'under_review', label: 'Under Review' },
            ];
            
            // Sort by round_number
            const sortedRounds = [...selectionRounds].sort((a, b) => (Number(a.round_number) || 0) - (Number(b.round_number) || 0));
            sortedRounds.forEach(r => {
                stages.push({
                    key: `round_${r.round_number}`,
                    label: r.name || `Round ${r.round_number}`
                });
            });
            
            stages.push({ key: 'selected', label: 'Selected' });
        }

        // Determine active stage key
        let activeKey = 'applied';
        const isTerminated = currentStatus === 'rejected' || currentStatus === 'withdrawn';
        
        if (isTerminated) {
            const lastStatus = (history || []).find(h => h && h.status !== 'rejected' && h.status !== 'withdrawn')?.status || 'applied';
            
            if (hasCompanyRounds) {
                const failedRound = (rounds || []).find(r => r && r.status === 'failed');
                if (failedRound) {
                    activeKey = `round_${failedRound.round_number}`;
                } else if (lastStatus === 'under_review') {
                    activeKey = 'under_review';
                } else if (lastStatus === 'shortlisted' || lastStatus === 'interview_scheduled') {
                    const sortedRounds = [...selectionRounds].sort((a, b) => (Number(a.round_number) || 0) - (Number(b.round_number) || 0));
                    const activeRound = sortedRounds.find(r => {
                        if (!r) return false;
                        const sr = (rounds || []).find(s => s && (s.round_number === r.round_number || s.round_name === r.name));
                        return !sr || sr.status !== 'passed';
                    });
                    activeKey = activeRound ? `round_${activeRound.round_number}` : `round_1`;
                } else if (lastStatus === 'selected') {
                    activeKey = 'selected';
                } else {
                    activeKey = 'applied';
                }
            } else {
                activeKey = lastStatus === 'pending' ? 'applied' : lastStatus;
            }
        } else {
            if (currentStatus === 'selected') {
                activeKey = 'selected';
            } else if (currentStatus === 'under_review') {
                activeKey = 'under_review';
            } else if (currentStatus === 'shortlisted' || currentStatus === 'interview_scheduled') {
                if (hasCompanyRounds) {
                    const scheduledRound = (rounds || []).find(r => r && r.status === 'scheduled');
                    if (scheduledRound) {
                        activeKey = `round_${scheduledRound.round_number}`;
                    } else {
                        const sortedRounds = [...selectionRounds].sort((a, b) => (Number(a.round_number) || 0) - (Number(b.round_number) || 0));
                        const activeRound = sortedRounds.find(r => {
                            if (!r) return false;
                            const sr = (rounds || []).find(s => s && (s.round_number === r.round_number || s.round_name === r.name));
                            return !sr || sr.status !== 'passed';
                        });
                        activeKey = activeRound ? `round_${activeRound.round_number}` : `round_1`;
                    }
                } else {
                    activeKey = currentStatus;
                }
            } else {
                activeKey = 'applied';
            }
        }

        const activeIndex = Math.max(0, stages.findIndex(s => s && s.key === activeKey));

        return {
            stages,
            activeKey,
            activeIndex,
            isTerminated
        };
    }, [job, currentStatus, rounds, history]);

    const isTerminated = activeStageInfo.isTerminated;

    const getStageState = (index: number) => {
        const { activeIndex, isTerminated } = activeStageInfo;
        if (isTerminated) {
            if (index < activeIndex) return 'completed';
            if (index === activeIndex) return 'terminated';
            return 'upcoming';
        }
        if (index < activeIndex) return 'completed';
        if (index === activeIndex) return 'current';
        return 'upcoming';
    };

    const fetchData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);

            // Fetch application details
            const { data: appData, error: appErr } = await insforge.database
                .from('job_applications')
                .select('*, jobs(*)')
                .eq('id', id)
                .single();

            if (appErr) throw appErr;
            setApplication(appData);

            // Fetch interview rounds
            const { data: roundsData } = await insforge.database
                .from('interview_rounds')
                .select('*')
                .eq('application_id', id)
                .order('round_number', { ascending: true });
            setRounds(roundsData || []);

            // Fetch status history
            const { data: historyData } = await insforge.database
                .from('application_status_history')
                .select('*')
                .eq('application_id', id)
                .order('created_at', { ascending: false });
            setHistory(historyData || []);

        } catch (err: any) {
            console.error("Error fetching application details:", err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleWithdraw = async () => {
        if (!id || !application) return;
        try {
            setWithdrawing(true);
            
            // Update status in job_applications
            const { error: updateErr } = await insforge.database
                .from('job_applications')
                .update({ status: 'withdrawn' })
                .eq('id', id);

            if (updateErr) throw updateErr;

            // Log status history
            await insforge.database.from('application_status_history').insert([{
                application_id: id,
                status: 'withdrawn',
                notes: 'Application withdrawn by student.'
            }]);

            // Notify student
            await insforge.database.from('notifications').insert([{
                user_id: application.student_id,
                title: 'Application Withdrawn',
                message: `You have successfully withdrawn your application for the ${application.jobs?.title} position at ${application.jobs?.company}.`,
                type: 'info'
            }]);

            // Notify recruiters
            try {
                const { data: allRecs } = await insforge.database
                    .from('recruiters')
                    .select('id, company');
                
                const matchingRecs = (allRecs || []).filter(r => {
                    if (!r.company) return false;
                    if (r.company.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(r.company);
                            return parsed.companyName === application.jobs?.company;
                        } catch (e) {
                            return false;
                        }
                    }
                    return r.company === application.jobs?.company;
                });

                const studentName = roleData?.name || 'A student';
                for (const rec of matchingRecs) {
                    await insforge.database.from('notifications').insert([{
                        user_id: rec.id,
                        title: 'Application Withdrawn',
                        message: `${studentName} has withdrawn their application for the ${application.jobs?.title} position.`,
                        type: 'warning',
                        entity_type: 'job_application',
                        entity_id: id
                    }]);
                }
            } catch (recNotifErr) {
                console.error("Failed to notify recruiter on withdraw:", recNotifErr);
            }

            setWithdrawOpen(false);
            alert("Application withdrawn successfully.");
            fetchData();
        } catch (err: any) {
            console.error("Error withdrawing application:", err);
            alert("Failed to withdraw application: " + err.message);
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 text-foreground pb-12 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded-xl" />
                <div className="h-48 bg-card rounded-2xl border border-border/45" />
                <div className="h-64 bg-card rounded-2xl border border-border/45" />
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="text-foreground space-y-4 max-w-lg mx-auto py-12 text-center">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
                <h2 className="text-xl font-bold">Failed to Load Details</h2>
                <p className="text-sm text-muted-foreground">{error || "Application not found."}</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/my-applications')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Applications
                </Button>
            </div>
        );
    }



    return (
        <div className="space-y-6 text-foreground pb-16 animate-fade-in">
            {/* Top Bar Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/my-applications')}
                    className="text-muted-foreground hover:text-foreground transition-all text-xs font-bold"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to My Applications
                </Button>
                
                {!isTerminated && currentStatus !== 'selected' && (
                    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="sm"
                                className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition-all px-4 rounded-xl"
                            >
                                Withdraw Application
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-popover border border-border text-foreground rounded-2xl max-w-sm">
                            <DialogHeader className="space-y-2">
                                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <DialogTitle className="text-center font-bold text-lg">Withdraw Application?</DialogTitle>
                                <DialogDescription className="text-center text-xs text-muted-foreground">
                                    Are you sure you want to withdraw your application for <strong>{job.title}</strong> at <strong>{job.company}</strong>? This action is permanent and cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
                                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setWithdrawOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1 text-xs bg-rose-600 hover:bg-rose-700" onClick={handleWithdraw} disabled={withdrawing}>
                                    {withdrawing ? 'Withdrawing...' : 'Confirm'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Job Profile Overview Card */}
            <Card className="bg-card dark:bg-slate-900/60 border border-border/40 dark:border-white/5 backdrop-blur-md overflow-hidden rounded-2xl relative shadow-xl">
                <div className="absolute top-0 right-0 p-5">
                    {isTerminated ? (
                        <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-rose-500/20 capitalize font-bold text-xs px-3.5 py-1">
                            {currentStatus}
                        </Badge>
                    ) : currentStatus === 'selected' ? (
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 capitalize font-bold text-xs px-3.5 py-1">
                            Offer Selected
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 capitalize font-bold text-xs px-3.5 py-1">
                            {currentStatus?.replace('_', ' ') || 'Applied'}
                        </Badge>
                    )}
                </div>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/40 dark:border-white/10 flex items-center justify-center shrink-0 shadow-md">
                            {job.logo_url ? (
                                <img src={job.logo_url} alt={job.company} className="w-10 h-10 object-contain rounded" />
                            ) : (
                                <Building2 className="w-8 h-8 text-primary" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-heading font-black tracking-tight">{job.title || job.role}</h2>
                                <p className="text-sm text-primary font-bold">{job.company}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-semibold">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-muted-foreground/60" /> {job.job_type || 'Full-time'}</span>
                                <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-muted-foreground/60" /> {job.work_mode || 'On-site'}</span>
                                {job.ctc && <span className="text-foreground dark:text-white bg-muted dark:bg-white/5 border border-border dark:border-white/10 px-2 py-0.5 rounded-md">CTC: {job.ctc} LPA</span>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Application Progress Tracker (Timeline) */}
            <Card className="bg-card dark:bg-slate-900/60 border border-border/40 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-xl">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Application Status Tracker
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Visual summary of your current progress in the selection lifecycle
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    {/* Visual Timeline Bar */}
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 w-full select-none">
                        {/* Connecting Line (Desktop Only) */}
                        <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-muted dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0" />
                        {/* Active Line (Desktop Only) */}
                        {!activeStageInfo.isTerminated && activeStageInfo.activeIndex > 0 && (
                            <div 
                                className="absolute top-1/2 left-[10%] h-0.5 bg-gradient-to-r from-blue-500 to-primary -translate-y-1/2 hidden md:block z-0 transition-all duration-500" 
                                style={{ width: `${(activeStageInfo.activeIndex / Math.max(1, activeStageInfo.stages.length - 1)) * 80}%` }}
                            />
                        )}

                        {activeStageInfo.stages.map((stage, idx) => {
                            const state = getStageState(idx);
                            
                            // Determine text color and dot styling
                            let dotStyle = "border-border bg-card text-muted-foreground/60 dark:border-slate-800 dark:bg-slate-900";
                            let textStyle = "text-muted-foreground/60";
                            let subtitleStyle = "text-muted-foreground/45";
                            const dotContent = 
                                state === 'completed' ? <CheckCircle2 className="w-5 h-5 text-blue-400" /> :
                                state === 'current' ? <div className="w-3.5 h-3.5 rounded-full bg-primary" /> :
                                state === 'terminated' ? <XCircle className="w-5 h-5 text-rose-400" /> :
                                <div className="w-2.5 h-2.5 rounded-full bg-muted dark:bg-slate-700" />;

                            if (state === 'completed') {
                                dotStyle = "border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]";
                                textStyle = "text-foreground dark:text-white font-bold";
                            } else if (state === 'current') {
                                dotStyle = "border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] animate-pulse";
                                textStyle = "text-primary font-black";
                            } else if (state === 'terminated') {
                                dotStyle = "border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]";
                                textStyle = "text-rose-600 dark:text-rose-400 font-bold";
                            }

                            // Handle specific labels on the timeline
                            let stageLabel = stage?.label || '';
                            if (idx === activeStageInfo.activeIndex && currentStatus === 'withdrawn') {
                                stageLabel = 'Withdrawn';
                            } else if (idx === activeStageInfo.activeIndex && currentStatus === 'rejected') {
                                if (stage?.key && !stage.key.startsWith('round_')) {
                                    stageLabel = 'Not Shortlisted';
                                }
                            }

                            return (
                                <div key={stage?.key || idx} className="flex md:flex-col items-center gap-4 md:gap-3 z-10 w-full md:flex-1 md:w-auto md:text-center">
                                    {/* Circular node */}
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${dotStyle}`}>
                                        {dotContent}
                                    </div>
                                    
                                    {/* Text Labels */}
                                    <div className="space-y-0.5 md:space-y-1">
                                        <p className={`text-xs md:text-sm font-semibold tracking-tight uppercase md:normal-case ${textStyle}`}>
                                            {stageLabel}
                                        </p>
                                        <p className={`text-[10px] md:text-xs font-medium ${subtitleStyle}`}>
                                            {state === 'completed' ? 'Completed' : state === 'current' ? 'Active Stage' : state === 'terminated' ? 'Ended' : 'Upcoming'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Timeline / Rounds Tracker */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Company & Job Details */}
                    <Card className="bg-card dark:bg-slate-900/60 border border-border/40 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Company & Job Details
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Overview of the hiring company and position requirements
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Company Name & Description */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground tracking-tight">{job.company || 'Not Specified'}</h3>
                                    {job.title && <p className="text-sm text-primary font-medium">{job.title}</p>}
                                </div>
                                {job.description ? (
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium bg-muted/30 p-4 rounded-xl border border-border/40">
                                        {job.description}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-xl border border-border/40">
                                        No company description provided.
                                    </p>
                                )}
                            </div>

                            {/* Job Specification Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Compensation info */}
                                <div className="p-4 rounded-xl bg-muted/35 border border-border/40 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Compensation</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            CTC: <strong className="text-foreground font-semibold">{job.ctc ? `${job.ctc} LPA` : 'Not Specified'}</strong>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Stipend: <strong className="text-foreground font-semibold">{job.stipend ? `${job.stipend}` : 'None'}</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* Location & Work Mode */}
                                <div className="p-4 rounded-xl bg-muted/35 border border-border/40 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Location & Work Mode</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            Location: <strong className="text-foreground font-semibold">{parseArrayDisplay(job.location).join(', ') || 'Not Specified'}</strong>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Mode: <strong className="text-foreground font-semibold">{job.work_mode || 'On-site'} ({job.job_type || 'Full-time'})</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Requirements */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Eligibility & Requirements</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-muted/35 border border-border/40 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <GraduationCap className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Academic Cutoffs
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <p className="text-muted-foreground">Min CGPA: <strong className="text-foreground font-bold">{job.min_cgpa || '0'}</strong></p>
                                            <p className="text-muted-foreground">Max Active Backlogs: <strong className="text-foreground font-bold">{job.max_backlogs ?? '0'}</strong></p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/35 border border-border/40 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <GraduationCap className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Allowed Branches
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {parseArrayDisplay(job.allowed_branches).length > 0 ? (
                                                parseArrayDisplay(job.allowed_branches).map((branch: string) => (
                                                    <Badge key={branch} className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5">
                                                        {branch}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-medium">All Branches</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Tech Stack */}
                            {(job.required_skills || job.tech_stack) && (
                                <div className="space-y-4 pt-2 border-t border-border/40">
                                    {job.required_skills && parseArrayDisplay(job.required_skills).length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Required Skills</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {parseArrayDisplay(job.required_skills).map((skill: string) => (
                                                    <Badge key={skill} variant="outline" className="text-[10px] font-semibold text-muted-foreground dark:text-white/80 border-border dark:border-white/10 bg-muted dark:bg-white/5 px-2 py-0.5">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {job.tech_stack && parseArrayDisplay(job.tech_stack).length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tech Stack</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {parseArrayDisplay(job.tech_stack).map((tech: string) => (
                                                    <Badge key={tech} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Feedback Section */}
                    {application.application_form?.feedback || rounds.some(r => r.feedback) ? (
                        <Card className="bg-card dark:bg-slate-900/60 border border-border/40 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-xl">
                            <CardHeader className="p-6 pb-2">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    Recruiter Remarks & Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {application.application_form?.feedback && (
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40 dark:bg-slate-950/40 dark:border-white/5 space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">General Remarks</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{application.application_form?.feedback}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}
                </div>

                {/* Right Side: Status History Log */}
                <div className="space-y-6">
                    {/* Status Log */}
                    <Card className="bg-card dark:bg-slate-900/60 border border-border/40 dark:border-white/5 backdrop-blur-md rounded-2xl shadow-xl">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Status History
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Detailed chronological log of application updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {history.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center">No historic status changes recorded.</p>
                            ) : (
                                <div className="relative pl-4 border-l border-border dark:border-slate-800 space-y-5">
                                    {history.map((log, idx) => {
                                        const logDate = log.created_at ? new Date(log.created_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        }) : 'N/A';

                                        return (
                                            <div key={log.id || idx} className="relative space-y-1">
                                                {/* History Dot */}
                                                <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card dark:border-slate-900" />
                                                
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-foreground dark:text-white uppercase tracking-tight">{log.status?.replace('_', ' ')}</span>
                                                    <span className="text-[10px] text-muted-foreground/80 font-medium">{logDate}</span>
                                                </div>
                                                {log.notes && (
                                                    <p className="text-xs text-muted-foreground leading-tight font-semibold pl-0.5">
                                                        {log.notes}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
