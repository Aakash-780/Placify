import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft, Building2, MapPin, IndianRupee, Calendar, Briefcase,
    Code2, Clock, CheckCircle, AlertCircle, Bookmark, Send,
    FileText, Globe, Eye, Download, Check, XCircle, ClipboardList,
    Terminal, Cpu, UserCheck, MessageSquare, BookOpen, HelpCircle,
    Linkedin, Github, Paperclip, UploadCloud, Loader2, User, GraduationCap, Info,
    X, ZoomIn, ZoomOut, RotateCcw, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkJobEligibility } from '@/utils/checkJobEligibility';
import { getYearDisplay } from '@/constants/years';
import { getCanonicalBranch } from '@/constants/branches';
import { useDropzone } from 'react-dropzone';

export default function ApplyJob() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role, roleData, refreshRole } = useRole();
    const [job, setJob] = useState<any>(null);
    const [applied, setApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [acknowledged, setAcknowledged] = useState(false);

    // Document Preview states
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [previewDocName, setPreviewDocName] = useState<string>('');
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<boolean>(false);
    const [previewZoom, setPreviewZoom] = useState<number>(100);

    const isImageFile = (name: string, url: string, mimeType?: string) => {
        if (mimeType && mimeType.startsWith('image/')) return true;
        const lowerName = (name || '').toLowerCase();
        const lowerUrl = (url || '').toLowerCase();
        return /\.(png|jpe?g|webp|gif|svg|bmp|ico)(\?.*)?$/i.test(lowerName) || 
               /\.(png|jpe?g|webp|gif|svg|bmp|ico)(\?.*)?$/i.test(lowerUrl) ||
               lowerUrl.startsWith('data:image/');
    };

    const handleOpenPreview = async (url: string, name: string) => {
        if (!url) return;
        setPreviewDocUrl(url);
        setPreviewDocName(name);
        setPreviewZoom(100);
        setPreviewLoading(true);
        setPreviewError(false);
        
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }

        const targetUrl = url || '/sample_jd.pdf';

        try {
            console.log('[DocPreview] Fetching document via URL:', targetUrl);
            let response = await fetch(targetUrl);
            
            let fetchedBlob: Blob;

            if (!response.ok) {
                console.warn(`[DocPreview] Primary fetch returned ${response.status}, falling back to sample JD PDF`);
                const fallbackResp = await fetch('/sample_jd.pdf');
                fetchedBlob = await fallbackResp.blob();
                setPreviewDocUrl('/sample_jd.pdf');
            } else {
                fetchedBlob = await response.blob();
                
                // Inspect if the body is an error JSON response like {"error":"STORAGE_NOT_FOUND"}
                if (fetchedBlob.type.includes('json') || fetchedBlob.type.includes('text/plain')) {
                    const text = await fetchedBlob.text();
                    if (text.includes('STORAGE_NOT_FOUND') || text.includes('Object not found') || text.includes('error')) {
                        console.warn('[DocPreview] Received STORAGE_NOT_FOUND payload, falling back to sample JD PDF');
                        const fallbackResp = await fetch('/sample_jd.pdf');
                        fetchedBlob = await fallbackResp.blob();
                        setPreviewDocUrl('/sample_jd.pdf');
                    } else {
                        // Re-create blob from text if it was valid text
                        fetchedBlob = new Blob([text], { type: 'application/pdf' });
                    }
                }
            }

            const isImg = isImageFile(name, targetUrl, fetchedBlob.type);
            let finalBlob = fetchedBlob;
            if (!fetchedBlob.type || fetchedBlob.type === 'application/octet-stream') {
                finalBlob = new Blob([fetchedBlob], { type: isImg ? 'image/png' : 'application/pdf' });
            } else if (!isImg && !fetchedBlob.type.includes('pdf')) {
                finalBlob = new Blob([fetchedBlob], { type: 'application/pdf' });
            }
            
            const bUrl = URL.createObjectURL(finalBlob);
            setPreviewBlobUrl(bUrl);
        } catch (err: any) {
            console.error('[DocPreview] Fetch failed, falling back to sample JD PDF:', err);
            try {
                const fallbackResp = await fetch('/sample_jd.pdf');
                const fallbackBlob = await fallbackResp.blob();
                const bUrl = URL.createObjectURL(fallbackBlob);
                setPreviewBlobUrl(bUrl);
                setPreviewDocUrl('/sample_jd.pdf');
            } catch {
                setPreviewError(true);
            }
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleClosePreview = () => {
        setPreviewDocUrl(null);
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }
    };

    const handleDownload = () => {
        if (!previewDocUrl) return;
        const link = document.createElement('a');
        link.href = previewDocUrl;
        link.download = previewDocName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [previewBlobUrl]);

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(1);
    const [studentAiProfile, setStudentAiProfile] = useState<any>(null);
    const [resumeSource, setResumeSource] = useState<'profile' | 'uploaded'>('profile');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Form fields values
    const [formValues, setFormValues] = useState({
        fullName: '',
        rollNumber: '',
        gender: '',
        dob: '',
        collegeEmail: '',
        personalEmail: '',
        mobileNumber: '',
        altMobileNumber: '',
        branch: '',
        semester: '',
        gradYear: '',
        cgpa: '',
        tenthPercent: '',
        twelfthPercent: '',
        activeBacklogs: '',
        historyBacklogs: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        preferredLocation: '',
        currentOfferStatus: '',
        resumeUrl: '',
        resumeKey: '',
        acknowledged: false
    });

    const getProfileResumeName = () => {
        if (!roleData?.resume_url) return '';
        try {
            const urlObj = new URL(roleData.resume_url);
            const pathSegments = urlObj.pathname.split('/');
            const rawName = pathSegments[pathSegments.length - 1];
            return decodeURIComponent(rawName);
        } catch (e) {
            return roleData.resume_url.split('/').pop() || 'profile_resume.pdf';
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }

        setUploadingResume(true);
        try {
            const fileKey = `${roleData.id}/resume_${Date.now()}_${file.name}`;
            const { data, error } = await insforge.storage.from('resumes').upload(fileKey, file);
            
            if (error) {
                console.error("Resume upload error:", error);
                alert(`Upload failed: ${error.message}`);
            } else if (data) {
                setFormValues(prev => ({
                    ...prev,
                    resumeUrl: data.url,
                    resumeKey: data.key
                }));
                setResumeSource('uploaded');
            }
        } catch (err: any) {
            console.error("Resume upload exception:", err);
            alert("An unexpected error occurred during resume upload.");
        } finally {
            setUploadingResume(false);
        }
    }, [roleData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    const validateStep = (step: number) => {
        const errors: Record<string, string> = {};
        if (step === 1) {
            if (!formValues.fullName?.trim()) errors.fullName = 'Full Name is required';
            if (!formValues.rollNumber?.trim()) errors.rollNumber = 'Registration Number is required';
            if (!formValues.gender?.trim()) errors.gender = 'Gender is required';
            if (!formValues.dob?.trim()) errors.dob = 'Date of Birth is required';
            if (!formValues.collegeEmail?.trim()) errors.collegeEmail = 'College Email is required';
            if (!formValues.mobileNumber?.trim()) errors.mobileNumber = 'Mobile Number is required';
            if (!formValues.branch?.trim()) errors.branch = 'Branch is required';
            if (!formValues.semester?.trim()) errors.semester = 'Semester is required';
            if (!formValues.cgpa?.trim()) errors.cgpa = 'CGPA is required';
            if (!formValues.tenthPercent?.trim()) errors.tenthPercent = '10th Percentage is required';
            if (!formValues.twelfthPercent?.trim()) errors.twelfthPercent = '12th Percentage is required';
            if (!formValues.activeBacklogs?.trim()) errors.activeBacklogs = 'Active Backlogs field is required';
        } else if (step === 2) {
            if (resumeSource === 'profile' && !formValues.resumeUrl) {
                errors.resume = 'No resume found in your profile. Please upload a resume.';
            } else if (resumeSource === 'uploaded' && !formValues.resumeUrl) {
                errors.resume = 'Please upload a resume file.';
            }
        } else if (step === 3) {
            if (!formValues.acknowledged) {
                errors.acknowledged = 'You must accept the declaration to submit.';
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            setFormErrors({});
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setFormErrors({});
    };

    useEffect(() => {
        async function fetch() {
            const { data: foundJob } = await insforge.database
                .from('jobs')
                .select('*, job_documents(*)')
                .eq('id', id)
                .maybeSingle();

            setJob(foundJob || null);

            if (foundJob && role === 'student' && roleData?.id) {
                const { data: app } = await insforge.database
                    .from('job_applications')
                    .select('id')
                    .eq('job_id', id)
                    .eq('student_id', roleData.id)
                    .maybeSingle();
                setApplied(!!app);

                const { data: aiProfile } = await insforge.database
                    .from('student_ai_profiles')
                    .select('*')
                    .eq('student_id', roleData.id)
                    .maybeSingle();
                if (aiProfile) {
                    setStudentAiProfile(aiProfile);
                }
            }
            setLoading(false);
        }
        fetch();
    }, [id, role, roleData]);

    // Auto-fill from student profile
    useEffect(() => {
        if (roleData) {
            setFormValues(prev => ({
                ...prev,
                fullName: prev.fullName || roleData.name || '',
                rollNumber: prev.rollNumber || roleData.roll_number || '',
                gender: prev.gender || roleData.gender || '',
                dob: prev.dob || roleData.dob || '',
                collegeEmail: prev.collegeEmail || roleData.email || '',
                mobileNumber: prev.mobileNumber || roleData.phone || '',
                branch: prev.branch || roleData.branch || '',
                gradYear: prev.gradYear || roleData.graduation_year?.toString() || '',
                cgpa: prev.cgpa || roleData.cgpa?.toString() || '',
                activeBacklogs: prev.activeBacklogs || roleData.backlogs?.toString() || '0',
                resumeUrl: prev.resumeUrl || roleData.resume_url || '',
                resumeKey: prev.resumeKey || roleData.resume_key || '',
                linkedinUrl: prev.linkedinUrl || roleData.linkedin_url || '',
                githubUrl: prev.githubUrl || roleData.github_url || '',
                portfolioUrl: prev.portfolioUrl || roleData.portfolio_url || ''
            }));
            
            setResumeSource(roleData.resume_url ? 'profile' : 'uploaded');
        }
    }, [roleData]);

    // Auto-fill AI Profile data
    useEffect(() => {
        if (studentAiProfile) {
            setFormValues(prev => ({
                ...prev,
                tenthPercent: prev.tenthPercent || studentAiProfile.tenth_percentage?.toString() || '',
                twelfthPercent: prev.twelfthPercent || studentAiProfile.twelfth_percentage?.toString() || ''
            }));
        }
    }, [studentAiProfile]);

    // Load saved draft from local storage
    useEffect(() => {
        if (id) {
            const savedDraft = localStorage.getItem(`job_draft_${id}`);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormValues(prev => ({ ...prev, ...parsed }));
                    if (parsed.resumeSource) {
                        setResumeSource(parsed.resumeSource);
                    }
                } catch (e) {
                    console.error("Failed to parse form draft:", e);
                }
            }
        }
    }, [id]);

    const handleSaveDraft = () => {
        try {
            const draftPayload = {
                ...formValues,
                resumeSource
            };
            localStorage.setItem(`job_draft_${id}`, JSON.stringify(draftPayload));
            alert("Draft saved successfully! You can resume filling later.");
        } catch (e) {
            console.error("Failed to save draft:", e);
            alert("Failed to save draft.");
        }
    };

    const renderStepper = () => {
        return (
            <div className="mb-8 px-2">
                <div className="flex items-center justify-between relative">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center z-10 relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300",
                            currentStep === 1
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                                : currentStep > 1
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}>
                            {currentStep > 1 ? <Check className="w-5 h-5" /> : "1"}
                        </div>
                        <span className={cn("text-[11px] font-semibold mt-2", currentStep === 1 ? "text-primary font-bold" : "text-muted-foreground")}>Profile & Academics</span>
                    </div>

                    {/* Progress Line 1 */}
                    <div className="flex-1 h-0.5 mx-2 bg-muted relative -mt-5">
                        <div className={cn(
                            "absolute inset-y-0 left-0 bg-primary transition-all duration-300",
                            currentStep > 1 ? "w-full bg-emerald-500" : "w-0"
                        )} />
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center z-10 relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300",
                            currentStep === 2
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                                : currentStep > 2
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}>
                            {currentStep > 2 ? <Check className="w-5 h-5" /> : "2"}
                        </div>
                        <span className={cn("text-[11px] font-semibold mt-2", currentStep === 2 ? "text-primary font-bold" : "text-muted-foreground")}>Resume & Links</span>
                    </div>

                    {/* Progress Line 2 */}
                    <div className="flex-1 h-0.5 mx-2 bg-muted relative -mt-5">
                        <div className={cn(
                            "absolute inset-y-0 left-0 bg-primary transition-all duration-300",
                            currentStep > 2 ? "w-full bg-emerald-500" : "w-0"
                        )} />
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center z-10 relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300",
                            currentStep === 3
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                                : "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}>
                            3
                        </div>
                        <span className={cn("text-[11px] font-semibold mt-2", currentStep === 3 ? "text-primary font-bold" : "text-muted-foreground")}>Review & Submit</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep1 = () => {
        return (
            <div className="space-y-6">
                {/* Profile Auto-filled Alert Banner */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex gap-2.5 items-start">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm text-foreground">Auto-filled from your profile</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Please verify all academic details. Keep your main profile updated to apply smoothly.</p>
                        </div>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
                        onClick={() => window.open('/profile', '_blank')}
                    >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                    </Button>
                </div>

                {/* Form Inputs Grid - Two column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Personal Details</h3>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Full Name *</Label>
                            <Input 
                                value={formValues.fullName} 
                                onChange={e => setFormValues(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter your full name" 
                                required 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Registration / Roll Number *</Label>
                            <Input 
                                value={formValues.rollNumber} 
                                onChange={e => setFormValues(prev => ({ ...prev, rollNumber: e.target.value }))}
                                placeholder="Enter roll number" 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Gender *</Label>
                                <Input 
                                    value={formValues.gender} 
                                    onChange={e => setFormValues(prev => ({ ...prev, gender: e.target.value }))}
                                    placeholder="Male/Female/Other" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Date of Birth *</Label>
                                <Input 
                                    type="date" 
                                    value={formValues.dob} 
                                    onChange={e => setFormValues(prev => ({ ...prev, dob: e.target.value }))}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Official College Email *</Label>
                            <Input 
                                type="email" 
                                value={formValues.collegeEmail} 
                                onChange={e => setFormValues(prev => ({ ...prev, collegeEmail: e.target.value }))}
                                placeholder="name@college.edu" 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Mobile Number *</Label>
                                <Input 
                                    type="tel" 
                                    value={formValues.mobileNumber} 
                                    onChange={e => setFormValues(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                    placeholder="10 digit number" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Alternate Number</Label>
                                <Input 
                                    type="tel" 
                                    value={formValues.altMobileNumber} 
                                    onChange={e => setFormValues(prev => ({ ...prev, altMobileNumber: e.target.value }))}
                                    placeholder="Alternative number" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Personal Email *</Label>
                            <Input 
                                type="email" 
                                value={formValues.personalEmail} 
                                onChange={e => setFormValues(prev => ({ ...prev, personalEmail: e.target.value }))}
                                placeholder="personal@gmail.com" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Academic Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Academic Details</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Branch *</Label>
                                <Input 
                                    value={formValues.branch} 
                                    onChange={e => setFormValues(prev => ({ ...prev, branch: e.target.value }))}
                                    placeholder="e.g. CSE" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Current Semester *</Label>
                                <Input 
                                    value={formValues.semester} 
                                    onChange={e => setFormValues(prev => ({ ...prev, semester: e.target.value }))}
                                    placeholder="e.g. 6" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Graduation Year</Label>
                                <Input 
                                    value={formValues.gradYear} 
                                    disabled 
                                    className="bg-muted text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Current CGPA *</Label>
                                <Input 
                                    value={formValues.cgpa} 
                                    onChange={e => setFormValues(prev => ({ ...prev, cgpa: e.target.value }))}
                                    placeholder="e.g. 9.1" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">10th Percentage *</Label>
                                <Input 
                                    value={formValues.tenthPercent} 
                                    onChange={e => setFormValues(prev => ({ ...prev, tenthPercent: e.target.value }))}
                                    placeholder="e.g. 92.4" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">12th / Diploma % *</Label>
                                <Input 
                                    value={formValues.twelfthPercent} 
                                    onChange={e => setFormValues(prev => ({ ...prev, twelfthPercent: e.target.value }))}
                                    placeholder="e.g. 88.5" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Active Backlogs *</Label>
                                <Input 
                                    type="number" 
                                    value={formValues.activeBacklogs} 
                                    onChange={e => setFormValues(prev => ({ ...prev, activeBacklogs: e.target.value }))}
                                    placeholder="0" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Backlog History</Label>
                                <Input 
                                    type="number" 
                                    value={formValues.historyBacklogs} 
                                    onChange={e => setFormValues(prev => ({ ...prev, historyBacklogs: e.target.value }))}
                                    placeholder="0" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2 = () => {
        return (
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Resume *</Label>
                    
                    {roleData?.resume_url && (
                        <div className="p-4 rounded-xl border border-border bg-card/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground">Resume found in your profile</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[250px]">{getProfileResumeName()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(roleData.resume_url, '_blank')}
                                >
                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Button>
                                <a
                                    href={roleData.resume_url}
                                    download={getProfileResumeName()}
                                    className="py-1.5 px-3 text-xs border border-border bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-1 font-semibold"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Selector options */}
                    {roleData?.resume_url ? (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div 
                                onClick={() => {
                                    setResumeSource('profile');
                                    setFormValues(prev => ({ ...prev, resumeUrl: roleData.resume_url, resumeKey: roleData.resume_key }));
                                }}
                                className={cn(
                                    "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                    resumeSource === 'profile'
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                        : "border-border hover:border-border/80 bg-card/25"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                    resumeSource === 'profile' ? "border-primary" : "border-muted-foreground"
                                )}>
                                    {resumeSource === 'profile' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold">Use Profile Resume</p>
                                </div>
                            </div>
                            
                            <div 
                                onClick={() => {
                                    setResumeSource('uploaded');
                                    setFormValues(prev => ({ ...prev, resumeUrl: '', resumeKey: '' }));
                                }}
                                className={cn(
                                    "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                    resumeSource === 'uploaded'
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                        : "border-border hover:border-border/80 bg-card/25"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                    resumeSource === 'uploaded' ? "border-primary" : "border-muted-foreground"
                                )}>
                                    {resumeSource === 'uploaded' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold">Upload Custom Resume</p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Drag & Drop Area */}
                    {(resumeSource === 'uploaded' || !roleData?.resume_url) && (
                        <div className="mt-3">
                            {formValues.resumeUrl && resumeSource === 'uploaded' ? (
                                <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✓ Custom resume uploaded</p>
                                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{formValues.resumeKey.split('/').pop() || 'uploaded_resume.pdf'}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={() => setFormValues(prev => ({ ...prev, resumeUrl: '', resumeKey: '' }))}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ) : (
                                <div 
                                    {...getRootProps()} 
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                                        isDragActive 
                                            ? "border-primary bg-primary/5 shadow-inner scale-[0.99]" 
                                            : "border-border/80 hover:border-primary/50 bg-card/10"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {uploadingResume ? (
                                        <>
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <div>
                                                <p className="text-sm font-semibold">Uploading your resume...</p>
                                                <p className="text-xs text-muted-foreground">This will only take a moment</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div>
                                                <p className="text-sm font-semibold">Drag & drop your resume here, or <span className="text-primary hover:underline">browse</span></p>
                                                <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOC, DOCX up to 5MB</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Professional Profiles & Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn URL
                            </Label>
                            <Input 
                                type="url"
                                value={formValues.linkedinUrl} 
                                onChange={e => setFormValues(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                placeholder="https://linkedin.com/in/username" 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Github className="w-3.5 h-3.5 text-foreground" /> GitHub URL
                            </Label>
                            <Input 
                                type="url"
                                value={formValues.githubUrl} 
                                onChange={e => setFormValues(prev => ({ ...prev, githubUrl: e.target.value }))}
                                placeholder="https://github.com/username" 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-primary" /> Portfolio URL
                            </Label>
                            <Input 
                                type="url"
                                value={formValues.portfolioUrl} 
                                onChange={e => setFormValues(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                placeholder="https://myportfolio.com" 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Preferred Location</Label>
                            <Input 
                                value={formValues.preferredLocation} 
                                onChange={e => setFormValues(prev => ({ ...prev, preferredLocation: e.target.value }))}
                                placeholder="e.g. Bangalore, Noida, Remote" 
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-semibold">Current Placement Offer Status</Label>
                            <Input 
                                value={formValues.currentOfferStatus} 
                                onChange={e => setFormValues(prev => ({ ...prev, currentOfferStatus: e.target.value }))}
                                placeholder="e.g. No active offers / Placed in company X (with details)" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        return (
            <div className="space-y-6">
                <div className="p-5 rounded-xl bg-card border border-border space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Application Summary Review
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Personal Information</p>
                            <div className="space-y-1">
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-semibold">{formValues.fullName}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Roll No:</span>
                                    <span className="font-semibold">{formValues.rollNumber}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Gender / DOB:</span>
                                    <span className="font-semibold">{formValues.gender} ({formValues.dob})</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Official Email:</span>
                                    <span className="font-semibold">{formValues.collegeEmail}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-semibold">{formValues.mobileNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Academic Metrics</p>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Branch / Semester:</span>
                                    <span className="font-semibold">{formValues.branch} (Sem {formValues.semester})</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">Graduation Year:</span>
                                    <span className="font-semibold">{formValues.gradYear || roleData?.graduation_year}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">CGPA:</span>
                                    <span className="font-semibold">{formValues.cgpa}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/25 py-1">
                                    <span className="text-muted-foreground">10th / 12th %:</span>
                                    <span className="font-semibold">{formValues.tenthPercent}% / {formValues.twelfthPercent}%</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Active / History Backlogs:</span>
                                    <span className="font-semibold text-destructive">{formValues.activeBacklogs} / {formValues.historyBacklogs || '0'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Selected Resume</p>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-5 h-5 text-primary shrink-0" />
                                    <span className="font-semibold truncate text-xs">
                                        {resumeSource === 'profile' ? 'Profile Resume' : (formValues.resumeKey?.split('/').pop() || 'Uploaded Custom Resume')}
                                    </span>
                                </div>
                                <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 capitalize font-bold text-[9px] tracking-wider shrink-0">
                                    {resumeSource === 'profile' ? 'Profile' : 'Uploaded'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Links & Location</p>
                            <div className="space-y-1 text-xs">
                                {formValues.linkedinUrl && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">LinkedIn:</span>
                                        <span className="font-semibold truncate max-w-[180px] text-right">{formValues.linkedinUrl}</span>
                                    </div>
                                )}
                                {formValues.githubUrl && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">GitHub:</span>
                                        <span className="font-semibold truncate max-w-[180px] text-right">{formValues.githubUrl}</span>
                                    </div>
                                )}
                                {formValues.preferredLocation && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location Pref:</span>
                                        <span className="font-semibold text-right">{formValues.preferredLocation}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mandatory Declaration Checkbox Card */}
                <div className={cn(
                    "p-4 rounded-xl border-2 transition-all flex items-start gap-3",
                    formValues.acknowledged 
                        ? "border-emerald-500/30 bg-emerald-500/5" 
                        : "border-border/80 hover:border-border/90 bg-card/10"
                )}>
                    <input 
                        type="checkbox" 
                        id="modalDeclarationAck"
                        checked={formValues.acknowledged}
                        onChange={e => setFormValues(prev => ({ ...prev, acknowledged: e.target.checked }))}
                        className="h-4.5 w-4.5 rounded accent-primary cursor-pointer shrink-0 mt-0.5"
                    />
                    <label htmlFor="modalDeclarationAck" className="text-xs font-bold text-foreground cursor-pointer select-none leading-normal">
                        I hereby declare that all the information submitted above is true, complete, and correct to the best of my knowledge. I understand that any false or inaccurate details may lead to immediate disqualification from the placement process. *
                    </label>
                </div>
            </div>
        );
    };

    const interviewRounds = useMemo(() => {
        if (!job?.selection_rounds) return [];
        try {
            if (Array.isArray(job.selection_rounds)) return job.selection_rounds;
            if (typeof job.selection_rounds === 'string') return JSON.parse(job.selection_rounds);
        } catch (e) {
            console.error("Failed to parse selection_rounds:", e);
        }
        return [];
    }, [job]);

    // Parser for DB array strings
    const parseArrayDisplay = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
        return [val];
    };

    const checkEligibility = () => {
        if (!job || role !== 'student' || !roleData) return { eligible: true, status: 'eligible', reasons: [] as string[] };
        const res = checkJobEligibility(roleData, job);
        return {
            eligible: res.status === 'eligible',
            status: res.status,
            reasons: res.reasons
        };
    };

    const getEligibilityDetails = () => {
        if (!roleData || !job) return [];
        
        const details: any[] = [];
        
        const parseArray = (val: any) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
            }
            return [val];
        };

        const studentBranch = getCanonicalBranch(roleData.branch);
        const studentYear = Number(roleData.current_year);
        const studentGraduationYear = Number(roleData.graduation_year);
        const studentCgpa = parseFloat(roleData.cgpa) || 0;
        const studentBacklogs = parseInt(roleData.backlogs, 10) || 0;

        // 1. CGPA
        const minCgpa = parseFloat(job.min_cgpa) || 0;
        const cgpaPassed = studentCgpa >= minCgpa;
        details.push({
            name: 'CGPA',
            passed: cgpaPassed,
            studentValue: studentCgpa.toString(),
            requiredValue: `${minCgpa.toFixed(1)}+`,
            label: 'CGPA not eligible',
            studentLabel: 'Your CGPA',
            requiredLabel: 'Required'
        });

        // 2. Max Backlogs
        const maxBacklogs = job.max_backlogs !== null && job.max_backlogs !== undefined ? parseInt(job.max_backlogs, 10) : null;
        const backlogsPassed = maxBacklogs === null || studentBacklogs <= maxBacklogs;
        details.push({
            name: 'Backlogs',
            passed: backlogsPassed,
            studentValue: studentBacklogs.toString(),
            requiredValue: maxBacklogs !== null ? `Max ${maxBacklogs}` : 'No limit',
            label: 'Backlog limit exceeded',
            studentLabel: 'Your Backlogs',
            requiredLabel: 'Required'
        });

        // 3. Branch
        const rawBranches = parseArray(job.allowed_branches);
        const hasAllBranch = rawBranches.some((b: any) => String(b).trim().toLowerCase() === 'all');
        const allowedBranches = rawBranches.map((b: any) => getCanonicalBranch(b));
        const branchPassed = allowedBranches.length === 0 || hasAllBranch || allowedBranches.includes(studentBranch);
        details.push({
            name: 'Branch',
            passed: branchPassed,
            studentValue: roleData.branch || 'Not specified',
            requiredValue: hasAllBranch ? 'All Branches' : rawBranches.join(', ') || 'All',
            label: 'Branch not eligible',
            studentLabel: 'Your Branch',
            requiredLabel: 'Allowed Branches'
        });

        // 4. Year
        const rawYears = parseArray(job.allowed_years);
        const hasAllYear = rawYears.some((y: any) => String(y).trim().toLowerCase() === 'all');
        const allowedYears = rawYears.map((y: any) => Number(y)).filter((y: any) => !isNaN(y));
        const yearPassed = allowedYears.length === 0 || hasAllYear || allowedYears.includes(studentYear);
        details.push({
            name: 'Year',
            passed: yearPassed,
            studentValue: getYearDisplay(studentYear),
            requiredValue: hasAllYear ? 'All Years' : rawYears.map((y: any) => getYearDisplay(y)).join(', ') || 'All',
            label: 'Year not eligible',
            studentLabel: 'Your Year',
            requiredLabel: 'Required'
        });

        return details;
    };

    const handleApply = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!roleData?.id || !job) return;
        if (!validateStep(3)) return;
        setApplying(true);

        const application_form = {
            fullName: formValues.fullName,
            rollNumber: formValues.rollNumber,
            gender: formValues.gender,
            dob: formValues.dob,
            collegeEmail: formValues.collegeEmail,
            personalEmail: formValues.personalEmail,
            mobileNumber: formValues.mobileNumber,
            altMobileNumber: formValues.altMobileNumber,
            branch: formValues.branch,
            semester: formValues.semester,
            graduationYear: formValues.gradYear || roleData.graduation_year?.toString(),
            cgpa: formValues.cgpa,
            tenthPercentage: formValues.tenthPercent,
            twelfthPercentage: formValues.twelfthPercent,
            activeBacklogs: formValues.activeBacklogs,
            historyBacklogs: formValues.historyBacklogs,
            linkedInUrl: formValues.linkedinUrl,
            githubUrl: formValues.githubUrl,
            portfolioUrl: formValues.portfolioUrl,
            preferredLocation: formValues.preferredLocation,
            currentOfferStatus: formValues.currentOfferStatus,
            resumeUrl: formValues.resumeUrl,
            resumeKey: formValues.resumeKey,
            resumeSource: resumeSource
        };

        const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn', 'pending'];
        const targetStatus = 'applied';
        
        if (!validStatuses.includes(targetStatus)) {
            alert("Application Error: The status configured for insertion is invalid.");
            return;
        }

        // Validate all steps defensively before database insert
        if (!validateStep(1)) {
            setCurrentStep(1);
            return;
        }
        if (!validateStep(2)) {
            setCurrentStep(2);
            return;
        }
        if (!validateStep(3)) {
            return;
        }

        setApplying(true);

        const isJobExpired = job.status === 'expired' || (job.application_deadline ? new Date(job.application_deadline) < new Date() : false);
        if (isJobExpired) {
            alert("Applications are closed for this job listing.");
            setApplying(false);
            return;
        }

        try {
            const { error } = await insforge.database.from('job_applications').insert([{
                job_id: job.id,
                student_id: roleData.id,
                status: targetStatus,
                application_form: application_form
            }]);
            
            if (error) throw new Error(error.message);
            
            // Log application status history
            let newAppId: string | null = null;
            try {
                const { data: newApp } = await insforge.database
                    .from('job_applications')
                    .select('id')
                    .eq('job_id', job.id)
                    .eq('student_id', roleData.id)
                    .maybeSingle();

                if (newApp) {
                    newAppId = newApp.id;
                    await insforge.database.from('application_status_history').insert([{
                        application_id: newApp.id,
                        status: 'applied',
                        notes: 'Application submitted successfully.'
                    }]);
                }
            } catch (historyErr) {
                console.error("Failed to write to application_status_history:", historyErr);
            }

            // Create notification for student
            try {
                await insforge.database.from('notifications').insert([{
                    user_id: roleData.id,
                    title: 'Application Submitted',
                    message: `Your application for the ${job.title} position at ${job.company} has been submitted successfully.`,
                    type: 'success',
                    entity_type: 'job_application',
                    entity_id: newAppId
                }]);
            } catch (notifErr) {
                console.error("Failed to create student notification:", notifErr);
            }

            // Create notification for recruiters of this company
            try {
                const { data: allRecs } = await insforge.database
                    .from('recruiters')
                    .select('id, company');
                
                const matchingRecs = (allRecs || []).filter(r => {
                    if (!r.company) return false;
                    if (r.company.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(r.company);
                            return parsed.companyName === job.company;
                        } catch (e) {
                            return false;
                        }
                    }
                    return r.company === job.company;
                });

                const studentName = roleData?.name || 'A student';
                for (const rec of matchingRecs) {
                    await insforge.database.from('notifications').insert([{
                        user_id: rec.id,
                        title: 'New Application Received',
                        message: `${studentName} applied for the ${job.title} position.`,
                        type: 'info',
                        entity_type: 'job_application',
                        entity_id: newAppId
                    }]);
                }
            } catch (recNotifErr) {
                console.error("Failed to create recruiter notifications:", recNotifErr);
            }

            // Clear draft
            localStorage.removeItem(`job_draft_${id}`);
            
            setApplied(true);
            setFormOpen(false);
            alert("Application submitted successfully!");
        } catch (err: any) {
            console.error(err);
            let friendlyMsg = "Failed to apply for the job. Please try again later.";
            if (err.message) {
                if (err.message.includes("violates check constraint")) {
                    friendlyMsg = "Application submission failed: The status is invalid or not accepted by the database.";
                } else if (err.message.includes("duplicate key") || err.message.includes("unique")) {
                    friendlyMsg = "You have already submitted an application for this job.";
                } else {
                    friendlyMsg = `Failed to apply: ${err.message}`;
                }
            }
            alert(friendlyMsg);
        } finally {
            setApplying(false);
        }
    };

    const handleExternalApply = async () => {
        if (!roleData?.id || !job) return;
        setApplying(true);
        const isJobExpired = job.status === 'expired' || (job.application_deadline ? new Date(job.application_deadline) < new Date() : false);
        if (isJobExpired) {
            alert("Applications are closed for this job listing.");
            setApplying(false);
            return;
        }
        try {
            // Check if already applied to prevent duplicate rows
            const { data: existing } = await insforge.database
                .from('job_applications')
                .select('id')
                .eq('job_id', job.id)
                .eq('student_id', roleData.id)
                .maybeSingle();

            if (!existing) {
                const { error } = await insforge.database.from('job_applications').insert([{
                    job_id: job.id,
                    student_id: roleData.id,
                    status: 'applied',
                    application_form: { 
                        note: 'Applied externally via company website.',
                        resumeUrl: roleData.resume_url || null,
                        resumeKey: roleData.resume_key || null
                    }
                }]);
                if (error) throw new Error(error.message);

                // Log application status history
                let newAppId: string | null = null;
                try {
                    const { data: newApp } = await insforge.database
                        .from('job_applications')
                        .select('id')
                        .eq('job_id', job.id)
                        .eq('student_id', roleData.id)
                        .maybeSingle();

                    if (newApp) {
                        newAppId = newApp.id;
                        await insforge.database.from('application_status_history').insert([{
                            application_id: newApp.id,
                            status: 'applied',
                            notes: 'Applied externally via company website.'
                        }]);
                    }
                } catch (historyErr) {
                    console.error("Failed to write to application_status_history:", historyErr);
                }

                // Create notification with title for student
                try {
                    await insforge.database.from('notifications').insert([{
                        user_id: roleData.id,
                        title: 'Application Submitted',
                        message: `Your application for the ${job.title} position at ${job.company} has been registered.`,
                        type: 'success',
                        entity_type: 'job_application',
                        entity_id: newAppId
                    }]);
                } catch (notifErr) {
                    console.error("Failed to create student notification:", notifErr);
                }

                // Create notification for recruiters of this company
                try {
                    const { data: allRecs } = await insforge.database
                        .from('recruiters')
                        .select('id, company');
                    
                    const matchingRecs = (allRecs || []).filter(r => {
                        if (!r.company) return false;
                        if (r.company.trim().startsWith('{')) {
                            try {
                                const parsed = JSON.parse(r.company);
                                return parsed.companyName === job.company;
                            } catch (e) {
                                return false;
                            }
                        }
                        return r.company === job.company;
                    });

                    const studentName = roleData?.name || 'A student';
                    for (const rec of matchingRecs) {
                        await insforge.database.from('notifications').insert([{
                            user_id: rec.id,
                            title: 'New Application Received',
                            message: `${studentName} applied for the ${job.title} position (External).`,
                            type: 'info',
                            entity_type: 'job_application',
                            entity_id: newAppId
                        }]);
                    }
                } catch (recNotifErr) {
                    console.error("Failed to create recruiter notifications:", recNotifErr);
                }

                setApplied(true);
            }
            // Open external url
            window.open(job.external_application_url, '_blank', 'noopener,noreferrer');
        } catch (err: any) {
            console.error(err);
            let friendlyMsg = "Failed to register external application.";
            if (err.message) {
                friendlyMsg = `External application error: ${err.message}`;
            }
            alert(friendlyMsg);
        } finally {
            setApplying(false);
        }
    };

    if (loading) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded-lg" />
        </div>
    );

    if (!job) return (
        <div className="text-center py-20">
            <p className="text-lg font-medium">Job not found</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </div>
    );

    const { eligible, status, reasons } = checkEligibility();
    const expired = job.status === 'expired' || (job.application_deadline ? new Date(job.application_deadline) < new Date() : false);
    const hasRequiredDocs = job.job_documents?.some((d: any) => d.is_required);
    const applyButtonDisabled = hasRequiredDocs ? !acknowledged : false;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <Button variant="ghost" onClick={() => navigate('/jobs')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Button>

            <Card>
                <CardContent className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-heading font-bold">{job.title}</h1>
                                <p className="text-lg text-muted-foreground">{job.company}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={job.job_type === 'internship' ? 'warning' : 'default'}>{job.job_type}</Badge>
                                    {job.work_mode && <Badge variant="secondary">{job.work_mode}</Badge>}
                                    {expired && <Badge variant="destructive">Closed</Badge>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                        <div className="text-center">
                            <IndianRupee className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">CTC / Stipend</p>
                            <p className="font-semibold">{job.ctc ? `₹${job.ctc} LPA` : job.stipend ? `₹${job.stipend}/mo` : '—'}</p>
                        </div>
                        <div className="text-center">
                            <MapPin className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-semibold">{parseArrayDisplay(job.location).join(', ') || '—'}</p>
                        </div>
                        <div className="text-center">
                            <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Deadline</p>
                            <p className="font-semibold">{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Rolling'}</p>
                        </div>
                        <div className="text-center">
                            <Briefcase className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Rounds</p>
                            <p className="font-semibold">{interviewRounds.length > 0 ? interviewRounds.length : (job.num_rounds || '—')}</p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Eligibility Criteria */}
                    <div className="mb-8 space-y-4">
                        <h3 className="text-lg font-heading font-bold flex items-center gap-2 text-foreground">
                            <GraduationCap className="w-5 h-5 text-primary" /> Eligibility Criteria
                        </h3>

                        {/* Top Metrics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Min CGPA Required</span>
                                    <span className="text-base font-bold text-foreground">{job.min_cgpa ? `${job.min_cgpa}` : 'None'}</span>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    CGPA
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Max Allowed Backlogs</span>
                                    <span className="text-base font-bold text-foreground">{job.max_backlogs !== null && job.max_backlogs !== undefined ? job.max_backlogs : 'No limit'}</span>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    Backlogs
                                </div>
                            </div>
                        </div>

                        {/* Allowed Academic Years */}
                        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-sm space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Allowed Academic Years</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {parseArrayDisplay(job.allowed_years).length > 0 ? (
                                    parseArrayDisplay(job.allowed_years).map((y: any) => (
                                        <Badge key={y} variant="secondary" className="px-2.5 py-1 text-xs font-semibold border border-border/40">
                                            {getYearDisplay(y)}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">All Years</Badge>
                                )}
                            </div>
                        </div>

                        {/* Allowed Branches */}
                        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-sm space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Allowed Branches / Disciplines</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {parseArrayDisplay(job.allowed_branches).length > 0 ? (
                                    parseArrayDisplay(job.allowed_branches).map((b: string) => (
                                        <Badge key={b} variant="outline" className="px-2.5 py-1 text-xs font-semibold bg-muted/30 border-border/60">
                                            {b}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold">All Branches</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Eligibility Status for Student */}
                    {role === 'student' && (
                        status === 'eligible' ? (
                            <div className="p-4 rounded-xl mb-6 bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">You are eligible for this position!</span>
                                </div>
                            </div>
                        ) : status === 'incomplete' ? (
                            <div className="p-4 rounded-xl mb-6 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-amber-700 dark:text-amber-400">Complete your profile to check eligibility.</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 shrink-0 font-bold"
                                    onClick={() => navigate('/profile')}
                                >
                                    Complete Profile
                                </Button>
                            </div>
                        ) : (
                            (() => {
                                const details = getEligibilityDetails();
                                const failedCriteria = details.filter(d => !d.passed);
                                const passedCriteria = details.filter(d => d.passed);

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fade-in">
                                        {/* Failed Requirements Section */}
                                        {failedCriteria.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 shadow-lg shadow-destructive/5 space-y-4">
                                                    <div className="flex items-center gap-2.5 pb-3 border-b border-destructive/15">
                                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                                                        <h4 className="font-heading font-bold text-destructive text-sm tracking-wide uppercase">Eligibility Mismatches</h4>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {failedCriteria.map((crit) => (
                                                            <div key={crit.name} className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/[0.08] transition-all duration-200">
                                                                <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-2.5">
                                                                    <XCircle className="w-4 h-4 shrink-0" />
                                                                    <span>{crit.label}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    <div className="space-y-0.5 bg-background/30 p-2 rounded-lg border border-border/10">
                                                                        <span className="text-muted-foreground/80 block font-medium">{crit.studentLabel}</span>
                                                                        <strong className="text-destructive font-bold text-sm">{crit.studentValue}</strong>
                                                                    </div>
                                                                    <div className="space-y-0.5 bg-background/30 p-2 rounded-lg border border-border/10">
                                                                        <span className="text-muted-foreground/80 block font-medium">{crit.requiredLabel}</span>
                                                                        <strong className="text-foreground font-bold text-sm">{crit.requiredValue}</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Passed Requirements Section */}
                                        {passedCriteria.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-lg shadow-emerald-500/[0.02] space-y-4">
                                                    <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-500/15">
                                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                                        <h4 className="font-heading font-bold text-emerald-500 text-sm tracking-wide uppercase">Requirements Met</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {passedCriteria.map((crit) => (
                                                            <div key={crit.name} className="p-3 px-3.5 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/5 flex items-center justify-between gap-3 text-xs hover:bg-emerald-500/[0.04] transition-all">
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <span className="text-muted-foreground font-medium block truncate">{crit.name}</span>
                                                                    <span className="text-foreground/80 font-bold block truncate">{crit.studentValue}</span>
                                                                </div>
                                                                <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 capitalize py-0.5 shrink-0 flex items-center gap-0.5 font-bold text-[9px] tracking-wider">
                                                                    <Check className="w-2.5 h-2.5" /> Met
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )
                    )}

                    {/* Description */}
                    {job.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-heading font-semibold mb-3">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                        </div>
                    )}

                    {/* Skills & Tech */}
                    {(job.required_skills?.length > 0 || job.tech_stack?.length > 0) && (
                        <div className="mb-6">
                            <h3 className="text-lg font-heading font-semibold mb-3">Required Skills & Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {parseArrayDisplay(job.required_skills).map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
                                {parseArrayDisplay(job.tech_stack).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                            </div>
                        </div>
                    )}

                    {/* Interview Process Timeline */}
                    {interviewRounds.length > 0 && (
                        <div className="mb-6 animate-fade-in">
                            <h3 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2 text-foreground">
                                <Briefcase className="w-5 h-5 text-primary" /> Selection & Interview Process
                            </h3>
                            <div className="relative border-l-2 border-border/40 pl-6 ml-3 space-y-6">
                                {interviewRounds.map((round: any, index: number) => {
                                    const getRoundIcon = (type: string) => {
                                        const t = type.toLowerCase();
                                        if (t.includes('assessment') || (t.includes('test') && !t.includes('coding'))) return <ClipboardList className="w-3.5 h-3.5 text-blue-500" />;
                                        if (t.includes('coding')) return <Terminal className="w-3.5 h-3.5 text-amber-500" />;
                                        if (t.includes('technical') || t.includes('design') || t.includes('system')) return <Cpu className="w-3.5 h-3.5 text-indigo-500" />;
                                        if (t.includes('hr') || t.includes('behavioral') || t.includes('managerial') || t.includes('interview')) return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
                                        if (t.includes('group') || t.includes('discussion') || t.includes('gd')) return <MessageSquare className="w-3.5 h-3.5 text-pink-500" />;
                                        if (t.includes('case') || t.includes('study')) return <BookOpen className="w-3.5 h-3.5 text-violet-500" />;
                                        return <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />;
                                    };

                                    return (
                                        <div key={round.round_number || index} className="relative group transition-all duration-300 hover:translate-x-1">
                                            {/* Timeline Dot Indicator */}
                                            <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border/80 flex items-center justify-center shadow-md group-hover:border-primary group-hover:scale-110 transition-all">
                                                {getRoundIcon(round.type || '')}
                                            </div>
                                            {/* Round Detail Card */}
                                            <div className="p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/75 transition-colors shadow-sm space-y-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                                                            Round {round.round_number}
                                                        </span>
                                                        <h4 className="font-heading font-bold text-sm text-foreground">
                                                            {round.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-medium">
                                                        <span className="px-2 py-0.5 rounded-full bg-muted border border-border/50 text-[10px]">
                                                            {round.type}
                                                        </span>
                                                        {round.duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                                {round.duration} mins
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {round.description && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pl-0.5 pt-1.5 border-t border-border/5 mt-1.5">
                                                        {round.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Resources */}
                    {job.job_documents && job.job_documents.length > 0 && (
                        <div className="mb-6 bg-muted/20 border border-border/40 p-4 rounded-2xl">
                            <h3 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2 text-foreground">
                                <FileText className="w-5 h-5 text-primary" /> Resources & Documents
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {job.job_documents.map((doc: any) => {
                                    const formattedSize = doc.file_size
                                        ? (doc.file_size / (1024 * 1024)).toFixed(2) + " MB"
                                        : "Unknown size";
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card shadow-sm gap-2">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <FileText className="w-6 h-6 text-primary shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate pr-3 text-foreground" title={doc.file_name}>
                                                        {doc.file_name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                                                        <span>{formattedSize}</span>
                                                        {doc.is_required && (
                                                            <Badge variant="destructive" className="py-0 px-1 text-[8px] font-extrabold uppercase shrink-0">
                                                                Must Read
                                                            </Badge>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button
                                                    type="button"
                                                    onClick={() => handleOpenPreview(doc.file_url, doc.file_name)}
                                                    className="h-7 py-1 px-2 text-[10px] font-bold border border-border bg-transparent hover:bg-muted rounded-lg flex items-center gap-1 text-foreground"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Preview
                                                </Button>
                                                <a
                                                    href={(!doc.file_url || doc.file_url.includes('undefined')) ? '/sample_jd.pdf' : doc.file_url}
                                                    download={doc.file_name || 'Job_Specification.pdf'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-1 px-2 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Required Document Acknowledgement */}
                    {role === 'student' && eligible && !applied && !expired && job.job_documents?.some((d: any) => d.is_required) && (
                        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="requiredDocAck"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                                className="h-4.5 w-4.5 rounded accent-primary cursor-pointer shrink-0"
                            />
                            <label htmlFor="requiredDocAck" className="text-xs font-bold text-foreground cursor-pointer select-none leading-normal">
                                I have read all required documents and instructions. *
                            </label>
                        </div>
                    )}

                    <Separator className="my-6" />

                    {/* Actions */}
                    {role === 'student' && (
                        <div className="space-y-4">
                            {applied ? (
                                <Button disabled className="w-full">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Already Applied
                                </Button>
                            ) : expired ? (
                                <Button disabled className="w-full">Applications Closed</Button>
                            ) : status === 'incomplete' ? (
                                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={() => navigate('/profile')}>
                                    Complete Profile to Apply
                                </Button>
                            ) : !eligible ? (
                                <Button disabled className="w-full">Not Eligible</Button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    {(job.application_mode === 'internal' || job.application_mode === 'both' || !job.application_mode) && (
                                        <Dialog open={formOpen} onOpenChange={(open) => {
                                            setFormOpen(open);
                                            if (open) {
                                                setCurrentStep(1);
                                                setFormErrors({});
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button className="flex-1" disabled={applyButtonDisabled || applying}>
                                                    <Send className="w-4 h-4 mr-2" /> 
                                                    {job.application_mode === 'both' ? 'Apply Internally' : 'Apply Now'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background border border-border/80 rounded-2xl">
                                                {/* Dialog Header */}
                                                <div className="p-6 border-b border-border/40 flex items-center justify-between bg-card/50 shrink-0">
                                                    <div>
                                                        <DialogTitle className="text-xl font-heading font-bold">Job Application Form</DialogTitle>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Apply for {job.title} at {job.company}</p>
                                                    </div>
                                                    {localStorage.getItem(`job_draft_${id}`) && (
                                                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 flex items-center gap-1.5 px-2.5 py-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                            Draft Loaded
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Form Body - Scrollable */}
                                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                                    {renderStepper()}

                                                    {/* Validation Errors Panel */}
                                                    {Object.keys(formErrors).length > 0 && (
                                                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                                                            <p className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                                                                <AlertCircle className="w-4 h-4" /> Please correct the following errors:
                                                            </p>
                                                            <ul className="list-disc pl-5 space-y-0.5 font-medium">
                                                                {Object.values(formErrors).map((err, idx) => (
                                                                    <li key={idx}>{err}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Step Contents */}
                                                    {currentStep === 1 && renderStep1()}
                                                    {currentStep === 2 && renderStep2()}
                                                    {currentStep === 3 && renderStep3()}
                                                </div>

                                                {/* Sticky Glassmorphic Footer */}
                                                <div className="p-4 border-t border-border/40 bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleSaveDraft}
                                                            className="border-dashed border-primary/40 text-primary hover:bg-primary/5 font-semibold"
                                                        >
                                                            <Bookmark className="w-4 h-4 mr-2" /> Save Draft
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {currentStep > 1 && (
                                                            <Button type="button" variant="ghost" onClick={handleBack} disabled={applying} className="font-semibold">
                                                                Back
                                                            </Button>
                                                        )}
                                                        
                                                        {currentStep < 3 ? (
                                                            <Button type="button" onClick={handleNext} className="font-semibold">
                                                                Next Step
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                type="button" 
                                                                onClick={() => handleApply()} 
                                                                disabled={applying || !formValues.acknowledged} 
                                                                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-primary-foreground font-bold px-6"
                                                            >
                                                                {applying ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Send className="w-4 h-4 mr-2" /> Confirm Application
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {(job.application_mode === 'external' || job.application_mode === 'both') && (
                                        <Button
                                            onClick={handleExternalApply}
                                            disabled={applyButtonDisabled || applying}
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                        >
                                            <Globe className="w-4 h-4 mr-2" />
                                            {job.application_mode === 'both' ? 'Open Company Website' : 'Open Company Application'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Document Preview Dialog */}
            <Dialog open={!!previewDocUrl} onOpenChange={(open) => { if (!open) handleClosePreview(); }}>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] h-[85vh] flex flex-col p-4 bg-card border-border dark:bg-slate-900 dark:border-white/10 text-foreground dark:text-slate-100 rounded-xl shadow-2xl overflow-hidden [&>button]:hidden">
                    {/* Accessibility requirements */}
                    <div className="sr-only">
                        <DialogTitle>Document Preview: {previewDocName}</DialogTitle>
                        <DialogDescription>Interactive PDF viewer modal with zoom controls</DialogDescription>
                    </div>

                    {/* Header Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border dark:border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            <h3 className="font-bold text-base truncate max-w-[150px] sm:max-w-xs text-foreground dark:text-slate-100">{previewDocName}</h3>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 text-[10px] uppercase font-bold py-0.5 tracking-wide">
                                {isImageFile(previewDocName, previewDocUrl || '') ? 'IMAGE' : 'PDF'}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Zoom controls */}
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
                                    asChild
                                    title="Open in New Tab"
                                >
                                    <a href={previewDocUrl || undefined} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-white/5 rounded-lg"
                                    onClick={handleDownload}
                                    title="Download Document"
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

                    {/* Preview Body */}
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
                                        <a href={previewDocUrl || undefined} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                                        </a>
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleDownload} className="bg-background border-border text-foreground hover:bg-muted dark:bg-slate-900 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">
                                        <Download className="w-4 h-4 mr-2" /> Download
                                    </Button>
                                </div>
                            </div>
                        )}
                        {(previewBlobUrl || previewDocUrl) && !previewError && (
                            isImageFile(previewDocName, previewDocUrl || '') ? (
                                <div className="w-full h-full overflow-auto flex justify-center items-center p-4">
                                    <img 
                                        src={previewBlobUrl || previewDocUrl || ''} 
                                        alt={previewDocName} 
                                        style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'center center' }}
                                        className="max-w-full max-h-full object-contain rounded-md shadow-xl transition-transform duration-200"
                                        onLoad={() => setPreviewLoading(false)}
                                        onError={() => { setPreviewError(true); setPreviewLoading(false); }}
                                    />
                                </div>
                            ) : (
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
                                            src={`${previewBlobUrl || previewDocUrl}#toolbar=0`}
                                            className="w-full h-full border-0 rounded-md bg-white shadow-xl"
                                            onLoad={() => setPreviewLoading(false)}
                                            onError={() => { setPreviewError(true); setPreviewLoading(false); }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
