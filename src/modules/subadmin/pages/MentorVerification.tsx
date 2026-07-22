import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    ShieldCheck, Clock, FileText, CheckCircle, XCircle, HelpCircle,
    Building2, Linkedin, GraduationCap, Calendar, MessageSquare, AlertCircle, Search, DollarSign,
    Mail, CheckCircle2, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Download,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';

export default function MentorVerification() {
    const { roleData } = useRole();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterTab, searchQuery]);

    // Action dialog state
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'info_requested'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Document preview modal states
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewMimeType, setPreviewMimeType] = useState<string>(''); // actual MIME type from blob
    const [previewDocType, setPreviewDocType] = useState<string>('');   // human label (e.g. 'Offer Letter')
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewFullscreen, setPreviewFullscreen] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const handleOpenSecurePreview = async (url: string, docKey: string, docType: string) => {
        if (!url && !docKey) return;
        setPreviewError(null);
        setPreviewMimeType('');
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }
        setPreviewDocType(docType || '');
        setPreviewZoom(1);
        setPreviewFullscreen(false);
        setShowPreviewModal(true);
        setLoadingPreview(true);
        try {
            let blob: Blob;
            if (docKey) {
                console.log('[DocPreview] Downloading from storage key:', docKey);
                const { data, error } = await insforge.storage
                    .from('certificates')
                    .download(docKey);
                if (error || !data) {
                    console.error('[DocPreview] Storage download error:', error);
                    throw new Error(error?.message || 'Failed to download document from storage.');
                }
                blob = data;
            } else {
                console.log('[DocPreview] Fetching document via URL:', url);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch document: HTTP ${response.status}`);
                blob = await response.blob();
            }

            // InsForge storage returns 'binary/octet-stream' for all files.
            // Detect true MIME type from the storage key path extension.
            const GENERIC_MIME = ['binary/octet-stream', 'application/octet-stream', ''];
            let mimeType = blob.type || '';

            if (GENERIC_MIME.includes(mimeType)) {
                const source = (docKey || url || '').split('?')[0]; // strip query params
                const ext = source.split('.').pop()?.toLowerCase() || '';
                const EXT_MAP: Record<string, string> = {
                    pdf:  'application/pdf',
                    jpg:  'image/jpeg',
                    jpeg: 'image/jpeg',
                    png:  'image/png',
                    gif:  'image/gif',
                    webp: 'image/webp',
                    bmp:  'image/bmp',
                    svg:  'image/svg+xml',
                    heic: 'image/heic',
                    heif: 'image/heif',
                };
                if (EXT_MAP[ext]) {
                    mimeType = EXT_MAP[ext];
                    // Re-wrap blob with the correct MIME type for proper browser rendering
                    blob = new Blob([blob], { type: mimeType });
                    console.log('[DocPreview] Re-typed blob: ".' + ext + '" →', mimeType);
                } else {
                    console.warn('[DocPreview] Unknown extension ".' + ext + '" — cannot infer MIME type. Path:', source);
                }
            }

            console.log('[DocPreview] Final MIME type:', mimeType);
            setPreviewMimeType(mimeType);

            const blobUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(blobUrl);
        } catch (err: any) {
            console.error('[DocPreview] Preview failed:', err.message);
            setPreviewError(err.message || 'Unable to load document preview.');
            showToast(err.message || 'Unable to load document preview.', 'error');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleCloseSecurePreview = () => {
        setShowPreviewModal(false);
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }
        setPreviewMimeType('');
        setPreviewError(null);
    };

    useEffect(() => {
        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [previewBlobUrl]);

    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewRequest, setReviewRequest] = useState<any>(null);

    // Toast notifications
    interface Toast {
        id: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('mentor_verification_requests')
                .select('*, mentor_profiles(*, mentor_skills(*), mentor_availability(*))')
                .order('created_at', { ascending: false });

            if (error) {
                console.error(error);
                showToast("Failed to load verification requests", "error");
            } else if (data) {
                // Filter requests to show only those belonging to the subadmin's organization.
                // Since RLS on mentor_profiles restricts visibility, requests from other organizations
                // will have a null mentor_profiles relation.
                const visible = data.filter(req => 
                    req.mentor_profiles !== null && 
                    (!roleData?.organization_id || req.mentor_profiles.organization_id === roleData.organization_id)
                );
                setRequests(visible);
            }
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleActionClick = (req: any, type: 'approve' | 'reject' | 'info_requested') => {
        setSelectedRequest(req);
        setActionType(type);
        setAdminNotes('');
        setShowActionDialog(true);
    };

    const executeVerificationAction = async (req: any, type: 'approve' | 'reject' | 'info_requested', notes: string) => {
        if (!req) return false;
        setSubmittingAction(true);
        try {
            const isApproved = type === 'approve';
            const mentorId = req.mentor_id;

            // 1. Update mentor profile verification status
            const { error: profileError } = await insforge.database
                .from('mentor_profiles')
                .update({
                    is_verified: isApproved,
                    verification_status: isApproved ? 'approved' : type
                })
                .eq('id', mentorId);

            if (profileError) throw profileError;

            // 2. Update verification request status
            const { error: requestError } = await insforge.database
                .from('mentor_verification_requests')
                .update({
                    status: isApproved ? 'approved' : type,
                    admin_notes: notes || null,
                    reviewer_name: roleData?.name || 'Administrator'
                })
                .eq('id', req.id);

            if (requestError) throw requestError;

            showToast(
                isApproved 
                    ? "Mentor verification approved!" 
                    : type === 'reject' 
                        ? "Verification rejected." 
                        : "Information request sent to mentor.", 
                "success"
            );
            fetchRequests();
            return true;
        } catch (err: any) {
            showToast(err.message, "error");
            return false;
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleConfirmAction = async () => {
        const success = await executeVerificationAction(selectedRequest, actionType, adminNotes);
        if (success) {
            setShowActionDialog(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
            approved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30',
            rejected: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
            info_requested: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
        };
        const text: Record<string, string> = {
            pending: '⏳ Pending',
            approved: '✓ Approved',
            rejected: '✕ Rejected',
            info_requested: '✏️ Info Requested'
        };
        return <Badge variant="outline" className={styles[status] || ''}>{text[status] || status}</Badge>;
    };

    const filteredRequests = requests.filter(req => {
        const matchesTab = filterTab === 'all' || 
            (filterTab === 'pending' && req.status === 'pending') ||
            (filterTab === 'approved' && req.status === 'approved') ||
            (filterTab === 'rejected' && (req.status === 'rejected' || req.status === 'info_requested'));

        const matchesSearch = !searchQuery || 
            req.mentor_profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.mentor_profiles?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.mentor_profiles?.job_role.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in pb-12 font-sans text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Mentor Verification Portal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Verify student/alumni mentor credentials, review uploaded joining letters or IDs, and manage onboarding status.
                    </p>
                </div>
                <SubadminFeatureToggle featureKey="mentor" />
            </div>

            {/* Verification Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pending Tasks</p>
                    <h4 className="text-2xl font-bold font-heading mt-1 text-amber-600">
                        {requests.filter(r => r.status === 'pending').length}
                    </h4>
                </Card>
                <Card className="p-4 border">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Verified Mentors</p>
                    <h4 className="text-2xl font-bold font-heading mt-1 text-emerald-600">
                        {requests.filter(r => r.status === 'approved').length}
                    </h4>
                </Card>
                <Card className="p-4 border">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Rejected Requests</p>
                    <h4 className="text-2xl font-bold font-heading mt-1 text-red-500">
                        {requests.filter(r => r.status === 'rejected').length}
                    </h4>
                </Card>
                <Card className="p-4 border">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-sans">More Info Required</p>
                    <h4 className="text-2xl font-bold font-heading mt-1 text-sky-600">
                        {requests.filter(r => r.status === 'info_requested').length}
                    </h4>
                </Card>
            </div>

            {/* Filter buttons & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button size="sm" variant={filterTab === 'pending' ? 'default' : 'outline'} onClick={() => setFilterTab('pending')}>
                        Pending Verification
                    </Button>
                    <Button size="sm" variant={filterTab === 'approved' ? 'default' : 'outline'} onClick={() => setFilterTab('approved')}>
                        Approved Mentors
                    </Button>
                    <Button size="sm" variant={filterTab === 'rejected' ? 'default' : 'outline'} onClick={() => setFilterTab('rejected')}>
                        Rejected / Info Requests
                    </Button>
                    <Button size="sm" variant={filterTab === 'all' ? 'default' : 'outline'} onClick={() => setFilterTab('all')}>
                        All Applications
                    </Button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, company, or role..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/30 border-dashed" />)}
                </div>
            ) : filteredRequests.length === 0 ? (
                <Card className="border border-dashed p-12 text-center bg-card/30">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-muted-foreground font-semibold">No verification requests found matching current filters.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {(() => {
                        const ITEMS_PER_PAGE = 2;
                        const totalItems = filteredRequests.length;
                        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                        const paginatedRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                        return (
                            <>
                                <div className="space-y-4">
                                    {paginatedRequests.map(req => (
                                        <Card key={req.id} className="border border-border/80 bg-card hover:shadow-sm transition-all duration-300">
                                            <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                                <div className="space-y-3.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2.5">
                                                        <h3 className="font-heading font-bold text-lg text-foreground">{req.mentor_profiles?.name}</h3>
                                                        {getStatusBadge(req.status)}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            <span>{req.mentor_profiles?.job_role} @ {req.mentor_profiles?.company_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <GraduationCap className="w-4 h-4 shrink-0" />
                                                            <span>Branch: {req.mentor_profiles?.branch} | Batch: {req.mentor_profiles?.batch} ({req.mentor_profiles?.placement_type || 'On Campus'})</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4 shrink-0" />
                                                            <span>Applied: {new Date(req.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText className="w-4 h-4 shrink-0" />
                                                            <span>Document Type: <span className="font-bold text-foreground">{req.document_type}</span></span>
                                                        </div>
                                                        {req.company_email && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="w-4 h-4 shrink-0" />
                                                                <span>Work Email: <span className="text-primary font-mono">{req.company_email}</span></span>
                                                            </div>
                                                        )}
                                                        {req.mentor_profiles?.ctc && (
                                                            <div className="flex items-center gap-1.5">
                                                                <DollarSign className="w-4 h-4 shrink-0" />
                                                                <span>CTC: {req.mentor_profiles?.ctc}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Skills directly on card */}
                                                    {req.mentor_profiles?.mentor_skills?.length > 0 && (
                                                        <div className="text-xs pt-1 flex flex-wrap items-center gap-1.5">
                                                            <span className="font-bold text-muted-foreground mr-1 text-[10px] uppercase">Skills:</span>
                                                            {req.mentor_profiles.mentor_skills.map((s: any) => (
                                                                <Badge key={s.id} variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                                                                    {s.skill_name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Services directly on card */}
                                                    {req.mentor_profiles?.mentor_availability?.[0] && (
                                                        <div className="text-xs flex flex-wrap items-center gap-1.5">
                                                            <span className="font-bold text-muted-foreground mr-1 text-[10px] uppercase">Services Offered:</span>
                                                            {(() => {
                                                                const avail = req.mentor_profiles.mentor_availability[0];
                                                                return (
                                                                    <>
                                                                        {avail.available_for_referral && <span className="text-[10px] text-sky-600 bg-sky-50 dark:bg-sky-950/20 px-2 py-0.5 rounded border border-sky-100 font-semibold">✓ Referral</span>}
                                                                        {avail.available_for_mentorship && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 font-semibold">✓ Mentorship</span>}
                                                                        {avail.available_for_resume_review && <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100 font-semibold">✓ Resume Review</span>}
                                                                        {avail.available_for_mock_interview && <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 font-semibold">✓ Mock Interview</span>}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}

                                                    {req.mentor_profiles?.about_me && (
                                                        <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/40 italic">
                                                            "{req.mentor_profiles.about_me}"
                                                        </div>
                                                    )}

                                                    {req.admin_notes && (
                                                        <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
                                                            <p className="font-bold text-foreground">Admin Feedback / Notes:</p>
                                                            <p className="text-muted-foreground mt-1 italic">"{req.admin_notes}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-row md:flex-col justify-end items-stretch gap-2 shrink-0 md:w-48 self-end md:self-center">
                                                    <Button size="sm" className="h-9 bg-primary hover:bg-primary/95 text-white font-bold w-full flex items-center gap-1 justify-center" onClick={() => { setReviewRequest(req); setAdminNotes(''); setShowReviewDialog(true); }}>
                                                        <ShieldCheck className="w-4 h-4" /> Review Application
                                                    </Button>
                                                    {req.mentor_profiles?.linkedin_url && (
                                                        <Button size="sm" variant="outline" onClick={() => window.open(req.mentor_profiles.linkedin_url, '_blank')} className="h-8 font-semibold w-full">
                                                            <Linkedin className="w-3.5 h-3.5 mr-1 text-sky-600" /> LinkedIn Profile
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-6">
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Showing <span className="font-bold text-foreground">{Math.min(totalItems, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(totalItems, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-bold text-foreground">{totalItems}</span> mentors
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                            </Button>
                                            {Array.from({ length: totalPages }).map((_, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant={currentPage === idx + 1 ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(idx + 1)}
                                                    className="h-8 w-8 rounded-lg text-xs font-bold p-0"
                                                >
                                                    {idx + 1}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                                            >
                                                Next <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* =====================================================
                MODAL: UNIFIED APPLICATION REVIEW DIALOG
                ===================================================== */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="max-w-5xl h-[85vh] flex flex-col font-sans">
                    <DialogHeader className="border-b pb-3 shrink-0">
                        <DialogTitle className="text-lg font-bold font-heading flex items-center justify-between">
                            <span>Review Mentor Application</span>
                            <span className="text-xs font-normal text-muted-foreground mr-6">
                                Submitted: {reviewRequest && new Date(reviewRequest.created_at).toLocaleString()}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {reviewRequest ? (
                        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                            {/* Left Column: Document Preview */}
                            <div className="flex flex-col h-full space-y-2 min-h-0">
                                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                                    <span>Uploaded Verification Document</span>
                                    <span className="text-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                                        {reviewRequest.document_type}
                                    </span>
                                </div>
                                <div className="flex-1 min-h-0 bg-muted/40 border rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-6 text-center space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-full text-primary shrink-0 animate-pulse">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-foreground">Verification Document Ready</h4>
                                        <p className="text-xs text-muted-foreground max-w-xs leading-normal font-sans">
                                            To prevent unauthorized auto-downloads, you can securely open and review the document in our interactive viewer.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                                        onClick={() => handleOpenSecurePreview(reviewRequest.document_url, reviewRequest.document_key, reviewRequest.document_type)}
                                        disabled={loadingPreview}
                                    >
                                        {loadingPreview ? (
                                            <>
                                                <span className="animate-spin mr-1">⌛</span> Fetching...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4" /> View Document
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Right Column: Full Details, History, & Actions */}
                            <div className="flex flex-col h-full min-h-0 justify-between space-y-4 overflow-y-auto pr-1">
                                <div className="space-y-4">
                                    {/* Personal Profile Details */}
                                    <div className="bg-secondary/20 border rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h4 className="font-bold text-base text-foreground">
                                                {reviewRequest.mentor_profiles?.name}
                                            </h4>
                                            {getStatusBadge(reviewRequest.status)}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                            <div>
                                                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Company & Role</span>
                                                <span className="font-semibold text-foreground">
                                                    {reviewRequest.mentor_profiles?.job_role} @ {reviewRequest.mentor_profiles?.company_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Work Email</span>
                                                <span className="font-semibold text-foreground font-mono">
                                                    {reviewRequest.company_email || 'Not Provided'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Academic Info</span>
                                                <span className="font-semibold text-foreground">
                                                    Branch: {reviewRequest.mentor_profiles?.branch} | Batch: {reviewRequest.mentor_profiles?.batch}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Placement Type</span>
                                                <span className="font-semibold text-foreground">
                                                    {reviewRequest.mentor_profiles?.placement_type || 'On Campus'}
                                                </span>
                                            </div>
                                            {reviewRequest.mentor_profiles?.ctc && (
                                                <div>
                                                    <span className="text-muted-foreground uppercase font-bold text-[10px] block">CTC</span>
                                                    <span className="font-semibold text-foreground">
                                                        {reviewRequest.mentor_profiles.ctc}
                                                    </span>
                                                </div>
                                            )}
                                            {reviewRequest.mentor_profiles?.linkedin_url && (
                                                <div>
                                                    <span className="text-muted-foreground uppercase font-bold text-[10px] block">LinkedIn URL</span>
                                                    <a
                                                        href={reviewRequest.mentor_profiles.linkedin_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-primary hover:underline font-semibold block truncate"
                                                    >
                                                        {reviewRequest.mentor_profiles.linkedin_url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Skills</p>
                                        <div className="flex flex-wrap gap-1">
                                            {reviewRequest.mentor_profiles?.mentor_skills?.length > 0 ? (
                                                reviewRequest.mentor_profiles.mentor_skills.map((s: any) => (
                                                    <Badge key={s.id} variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                                                        {s.skill_name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No skills specified</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Services Offered Availability */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Services Offered</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(() => {
                                                const avail = reviewRequest.mentor_profiles?.mentor_availability?.[0] || {};
                                                return (
                                                    <>
                                                        {avail.available_for_referral && <Badge variant="outline" className="text-[10px] bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200">Referrals</Badge>}
                                                        {avail.available_for_mentorship && <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200">Mentorship</Badge>}
                                                        {avail.available_for_resume_review && <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-200">Resume Review</Badge>}
                                                        {avail.available_for_mock_interview && <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-950/20 text-purple-600 border-purple-200">Mock Interviews</Badge>}
                                                        {avail.available_for_career_guidance && <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200">Career Guidance</Badge>}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* About Section */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Bio / Profile Description</p>
                                        <p className="text-xs text-foreground/90 leading-relaxed italic bg-muted/40 p-3 rounded-lg border border-border/40">
                                            {reviewRequest.mentor_profiles?.about_me ? `"${reviewRequest.mentor_profiles.about_me}"` : '"No bio provided."'}
                                        </p>
                                    </div>

                                    {/* Verification & Resubmission History */}
                                    {(() => {
                                        const history = requests
                                            .filter(r => r.mentor_id === reviewRequest.mentor_id && r.id !== reviewRequest.id)
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                        
                                        return (
                                            <div className="space-y-2 border-t pt-3">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                                                    <span>Verification History Log</span>
                                                    <span>Resubmissions: {history.length}</span>
                                                </p>
                                                
                                                {history.length > 0 ? (
                                                    <div className="space-y-2 max-h-36 overflow-y-auto">
                                                        {history.map((h, index) => (
                                                            <div key={h.id} className="p-2.5 border rounded-lg bg-secondary/10 flex flex-col gap-1 text-[11px]">
                                                                <div className="flex justify-between items-center font-semibold">
                                                                    <span>Submission #{index + 1} ({new Date(h.created_at).toLocaleDateString()})</span>
                                                                    {getStatusBadge(h.status)}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground font-mono">Document: {h.document_type}</p>
                                                                {h.admin_notes && (
                                                                    <p className="text-foreground leading-snug">
                                                                        <span className="font-semibold text-muted-foreground">Feedback Reason:</span> "{h.admin_notes}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground italic">First-time application. No prior submission history.</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Decision Actions Panel */}
                                {reviewRequest.status === 'pending' && (
                                    <div className="space-y-3 border-t pt-3 shrink-0">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                                                <span>Admin Verification Notes / Reason</span>
                                                <span className="text-amber-600 font-bold">* Required for Reject & Info Requests</span>
                                            </label>
                                            <Textarea
                                                placeholder="Provide detailed feedback context for approval notes or rejection reason..."
                                                value={adminNotes}
                                                onChange={e => setAdminNotes(e.target.value)}
                                                className="min-h-[80px] leading-relaxed text-xs"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                                                onClick={async () => {
                                                    const success = await executeVerificationAction(reviewRequest, 'approve', adminNotes);
                                                    if (success) setShowReviewDialog(false);
                                                }}
                                                disabled={submittingAction}
                                            >
                                                Approve Mentor
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="flex-1 h-9 font-semibold text-xs"
                                                onClick={async () => {
                                                    const success = await executeVerificationAction(reviewRequest, 'reject', adminNotes);
                                                    if (success) setShowReviewDialog(false);
                                                }}
                                                disabled={submittingAction || !adminNotes.trim()}
                                            >
                                                Reject Application
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="flex-1 h-9 font-semibold text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                onClick={async () => {
                                                    const success = await executeVerificationAction(reviewRequest, 'info_requested', adminNotes);
                                                    if (success) setShowReviewDialog(false);
                                                }}
                                                disabled={submittingAction || !adminNotes.trim()}
                                            >
                                                Request More Info
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No request data loaded.
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =====================================================
                MODAL: ADMIN DECISION FORM
                ===================================================== */}
            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-bold font-heading">
                            {actionType === 'approve' && 'Confirm Mentor Approval'}
                            {actionType === 'reject' && 'Reject Mentor Application'}
                            {actionType === 'info_requested' && 'Request Additional Details'}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Applicant: {selectedRequest?.mentor_profiles?.name}
                        </p>
                    </DialogHeader>

                    <div className="space-y-4 my-2 text-xs">
                        <div className="space-y-1">
                            <label className="font-bold text-muted-foreground uppercase">
                                {actionType === 'approve' ? 'Optional Notes' : 'Reason / Requirements for applicant'}
                            </label>
                            <Textarea
                                placeholder={
                                    actionType === 'approve' 
                                        ? 'e.g. Verified joining letter copy. Welcome onboard!' 
                                        : 'Specify details like: Offer letter resolution is low, company email verification failed, etc...'
                                }
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                className="min-h-[100px] leading-relaxed"
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3">
                        <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={submittingAction}>Cancel</Button>
                        <Button 
                            onClick={handleConfirmAction} 
                            disabled={submittingAction || (actionType !== 'approve' && !adminNotes)} 
                            className={`font-semibold ${
                                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {submittingAction ? 'Processing...' : 'Confirm Action'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                MODAL: SECURE DOCUMENT PREVIEW
                ===================================================== */}
            <Dialog open={showPreviewModal} onOpenChange={(open) => { if (!open) handleCloseSecurePreview(); }}>
                <DialogContent className={`font-sans flex flex-col transition-all duration-300 ${
                    previewFullscreen ? 'max-w-[100vw] w-[100vw] h-[100vh] m-0 p-4 rounded-none' : 'max-w-4xl h-[80vh]'
                }`}>
                    <DialogHeader className="border-b pb-3 shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-base font-bold font-heading flex items-center gap-1.5">
                                <FileText className="w-5 h-5 text-primary" />
                                Document Preview &mdash; <span className="font-mono text-xs font-normal text-muted-foreground uppercase">{previewDocType || 'Document'}</span>
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 font-sans">Review credentials securely with zoom and full-screen controls.</p>
                        </div>
                    </DialogHeader>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary/20 p-2 rounded-lg border border-border/80 shrink-0 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 flex items-center gap-1 font-semibold text-[11px]"
                                onClick={() => setPreviewZoom(prev => Math.max(0.5, prev - 0.25))}
                            >
                                <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
                            </Button>
                            <span className="min-w-[40px] text-center font-mono font-bold text-foreground">
                                {Math.round(previewZoom * 100)}%
                            </span>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 flex items-center gap-1 font-semibold text-[11px]"
                                onClick={() => setPreviewZoom(prev => Math.min(3, prev + 0.25))}
                            >
                                <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 flex items-center gap-1 font-semibold text-[11px]"
                                onClick={() => setPreviewZoom(1)}
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                            </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 flex items-center gap-1 font-semibold text-[11px]"
                                onClick={() => setPreviewFullscreen(prev => !prev)}
                            >
                                {previewFullscreen ? (
                                    <>
                                        <Minimize className="w-3.5 h-3.5" /> Exit Full
                                    </>
                                ) : (
                                    <>
                                        <Maximize className="w-3.5 h-3.5" /> Fullscreen
                                    </>
                                )}
                            </Button>
                            {previewBlobUrl && (() => {
                                // Derive file extension from MIME type for the download filename
                                const ext = previewMimeType === 'application/pdf' ? 'pdf'
                                    : previewMimeType.startsWith('image/') ? previewMimeType.split('/')[1]
                                    : 'bin';
                                return (
                                    <a
                                        href={previewBlobUrl}
                                        download={`verification_${reviewRequest?.mentor_profiles?.name?.replace(/\s+/g, '_') || 'doc'}.${ext}`}
                                        className="inline-flex items-center justify-center rounded-md text-[11px] font-bold h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Preview Viewport */}
                    <div className="flex-1 min-h-0 bg-muted/30 border rounded-xl overflow-hidden relative flex items-center justify-center p-4">
                        {previewBlobUrl ? (
                            (() => {
                                // Use blob MIME type — blob: URLs never contain '.pdf'
                                // Fallback: check docKey extension if MIME type is empty
                                const isPdf = previewMimeType === 'application/pdf'
                                    || (!previewMimeType && reviewRequest?.document_key?.toLowerCase().endsWith('.pdf'));
                                const isImage = previewMimeType.startsWith('image/')
                                    || (!previewMimeType && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(reviewRequest?.document_key || ''));

                                console.log('[DocPreview] Rendering —', { isPdf, isImage, mimeType: previewMimeType, key: reviewRequest?.document_key });

                                if (isPdf) {
                                    return (
                                        <div
                                            className="w-full h-full overflow-auto flex items-center justify-center transition-all duration-200"
                                            style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center center' }}
                                        >
                                            <iframe
                                                src={previewBlobUrl}
                                                className="w-full h-full border-none rounded-lg shadow-md bg-white"
                                                title="Verification Document — PDF Viewer"
                                                onError={() => console.error('[DocPreview] iframe failed to load PDF blob URL:', previewBlobUrl)}
                                            />
                                        </div>
                                    );
                                }

                                if (isImage) {
                                    return (
                                        <div className="w-full h-full overflow-auto flex items-center justify-center">
                                            <img
                                                src={previewBlobUrl}
                                                style={{ transform: `scale(${previewZoom})`, transition: 'transform 0.15s ease-out' }}
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-md bg-white"
                                                alt="Verification Document — Image Viewer"
                                                onError={(e) => {
                                                    console.error('[DocPreview] <img> failed to render blob URL:', previewBlobUrl);
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                    (e.currentTarget.parentNode as HTMLElement).innerHTML =
                                                        '<p class="text-xs text-muted-foreground font-semibold">Unable to load document preview.</p>';
                                                }}
                                            />
                                        </div>
                                    );
                                }

                                // Unknown type — show generic download prompt
                                return (
                                    <div className="text-center p-6 space-y-3 max-w-sm">
                                        <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                                        <h4 className="font-bold text-sm text-foreground">Unable to load document preview.</h4>
                                        <p className="text-xs text-muted-foreground">
                                            File type <code className="bg-muted px-1 rounded">{previewMimeType || 'unknown'}</code> cannot be previewed inline.
                                        </p>
                                        <a
                                            href={previewBlobUrl}
                                            download
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download to view
                                        </a>
                                    </div>
                                );
                            })()
                        ) : loadingPreview ? (
                            <div className="text-center text-muted-foreground text-xs font-semibold space-y-2">
                                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                                <p>Loading secure preview...</p>
                            </div>
                        ) : previewError ? (
                            <div className="text-center p-6 space-y-3 max-w-md">
                                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                                <h4 className="font-bold text-sm text-foreground">Unable to load document preview.</h4>
                                <div className="text-xs text-left bg-muted p-3 rounded border font-mono space-y-1 overflow-x-auto">
                                    <p><strong>Error:</strong> {previewError}</p>
                                    <p><strong>Bucket:</strong> certificates</p>
                                    <p className="truncate"><strong>Key:</strong> {reviewRequest?.document_key || 'N/A'}</p>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        size="sm"
                                        onClick={() => handleOpenSecurePreview(reviewRequest?.document_url, reviewRequest?.document_key, reviewRequest?.document_type)}
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Retry
                                    </Button>
                                    {reviewRequest?.document_url && (
                                        <a
                                            href={reviewRequest.document_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                        >
                                            Open Direct URL
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground text-xs font-semibold">
                                Waiting for document...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Toasts Alert Overlay */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 text-xs font-semibold ${
                            t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200' :
                            t.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200' :
                            'bg-slate-50 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/30 text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        <span>{t.message}</span>
                        <button
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 cursor-pointer"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
