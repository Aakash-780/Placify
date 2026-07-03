import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    Building2, Briefcase, GraduationCap, Clock, Sparkles, CheckCircle,
    AlertCircle, Trash2, Plus, ArrowLeft, ArrowRight, HelpCircle,
    ChevronUp, ChevronDown, Save, Eye, EyeOff, Sparkle, RotateCcw,
    FileText, Upload, Download, Loader2, Link2, Check, X, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CANONICAL_BRANCHES } from '@/constants/branches';
import { CANONICAL_YEARS, getYearDisplay } from '@/constants/years';
import { checkJobEligibility } from '@/utils/checkJobEligibility';

interface SelectionRound {
    round_number: number;
    name: string;
    type: string;
    duration: number;
    description: string;
}

export interface JobDocument {
    id?: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    is_required: boolean;
    // local states for progress tracking
    progress?: number;
    uploading?: boolean;
    error?: string;
    tempId?: string;
}

class DocumentsErrorBoundary extends React.Component<
    { children: React.ReactNode; onRetry: () => void },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Documents Step Error Boundary caught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-center space-y-4 animate-scale-in">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">Something went wrong while loading documents.</h4>
                        <p className="text-xs text-muted-foreground">This could be caused by invalid local states or storage errors.</p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false });
                            this.props.onRetry();
                        }}
                        className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2 rounded-xl"
                    >
                        Retry
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

interface FormState {
    company: string;
    logo_url: string;
    role: string;
    description: string;
    job_type: string; // 'full-time' | 'internship' | 'ppo' | 'contract'
    work_mode: string; // 'on-site' | 'hybrid' | 'remote'
    ctc: string;
    stipend: string;
    location: string[];
    min_cgpa: string;
    max_backlogs: string;
    allowed_branches: string[];
    allowed_years: number[];
    allowed_graduation_years: number[];
    application_deadline: string;
    selection_rounds: SelectionRound[];
    required_skills: string[];
    tech_stack: string[];
    status: string; // 'active' | 'draft' | 'archived'
    application_mode: 'internal' | 'external' | 'both';
    external_application_url: string;
    has_external_documents: boolean;
    documents: JobDocument[];
}

const INITIAL_FORM: FormState = {
    company: '',
    logo_url: '',
    role: '',
    description: '',
    job_type: 'full-time',
    work_mode: 'on-site',
    ctc: '',
    stipend: '',
    location: [],
    min_cgpa: '0',
    max_backlogs: '0',
    allowed_branches: [],
    allowed_years: [],
    allowed_graduation_years: [],
    application_deadline: '',
    selection_rounds: [
        { round_number: 1, name: 'Online Assessment', type: 'Assessment', duration: 90, description: '' }
    ],
    required_skills: [],
    tech_stack: [],
    status: 'active',
    application_mode: 'internal',
    external_application_url: '',
    has_external_documents: false,
    documents: []
};

const BRANCH_OPTIONS = CANONICAL_BRANCHES;
const YEAR_OPTIONS = CANONICAL_YEARS;
const GRAD_YEAR_OPTIONS = [2026, 2027, 2028, 2029, 2030, 2031];
const ROUND_TYPES = ['Assessment', 'Coding Test', 'Technical Interview', 'Managerial Interview', 'HR Interview', 'Behavioral', 'System Design', 'Other'];

const AUTOSAVE_KEY = 'post_job_autosave';

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

export default function PostJob() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const { id } = useParams(); // URL params for editing
    const [searchParams] = useSearchParams();
    const duplicateId = searchParams.get('duplicate');
    
    const isEdit = !!id;
    const isDuplicate = !!duplicateId;
    const loadId = id || duplicateId;

    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [step, setStep] = useState(1);
    const [isDirty, setIsDirty] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showConfirmPublish, setShowConfirmPublish] = useState(false);
    const [publishVerified, setPublishVerified] = useState(false);
    const [loadingDraft, setLoadingDraft] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');
    const [gradYearSearch, setGradYearSearch] = useState('');

    // Temp tags inputs states
    const [locInput, setLocInput] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [techInput, setTechInput] = useState('');

    const [allStudents, setAllStudents] = useState<any[]>([]);

    useEffect(() => {
        if (role === 'recruiter') return;
        async function fetchStudents() {
            try {
                const { data } = await insforge.database.from('students').select('*');
                if (data) {
                    setAllStudents(data);
                }
            } catch (err) {
                console.error("Error fetching students for eligibility preview:", err);
            }
        }
        fetchStudents();
    }, [role]);

    const eligibilityStats = useMemo(() => {
        let eligible = 0;
        let ineligible = 0;
        let incomplete = 0;

        allStudents.forEach(student => {
            const result = checkJobEligibility(student, {
                ...form,
                min_cgpa: parseFloat(form.min_cgpa) || 0,
                max_backlogs: parseInt(form.max_backlogs, 10) || 0,
                allowed_branches: form.allowed_branches,
                allowed_years: form.allowed_years,
                status: form.status,
                application_deadline: form.application_deadline ? new Date(form.application_deadline).toISOString() : null
            });

            if (result.status === 'eligible') {
                eligible++;
            } else if (result.status === 'ineligible') {
                ineligible++;
            } else {
                incomplete++;
            }
        });

        return { eligible, ineligible, incomplete };
    }, [allStudents, form]);

    // Fetch existing companies for autocomplete suggestions
    useEffect(() => {
        async function fetchCompanies() {
            try {
                const { data } = await insforge.database.from('jobs').select('company');
                if (data) {
                    const unique = Array.from(new Set(data.map((j: any) => j.company).filter(Boolean))) as string[];
                    setCompanySuggestions(unique);
                }
            } catch (err) {
                console.error("Error fetching companies suggestions:", err);
            }
        }
        fetchCompanies();
    }, []);

    // Load job details in Edit / Duplicate modes
    useEffect(() => {
        if (!loadId) {
            // Check for autosaved draft if not editing or duplicating
            const saved = localStorage.getItem(AUTOSAVE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setForm({
                        ...INITIAL_FORM,
                        ...parsed,
                        documents: parsed.documents || [],
                        allowed_graduation_years: parsed.allowed_graduation_years || []
                    });
                    setIsDirty(true);
                } catch (e) {
                    console.error("Failed to load autosaved draft:", e);
                }
            }
            if (role === 'recruiter' && roleData) {
                const compName = getRecruiterCompanyName(roleData);
                setForm(prev => ({ ...prev, company: compName }));
            }
            return;
        }

        async function fetchJobDetails() {
            setLoadingDraft(true);
            try {
                const { data, error } = await insforge.database
                    .from('jobs')
                    .select('*')
                    .eq('id', loadId)
                    .maybeSingle();
                
                if (error) throw error;
                if (data) {
                    if (role === 'recruiter') {
                        const compName = getRecruiterCompanyName(roleData);
                        if (data.company !== compName) {
                            alert("Unauthorized: You cannot edit jobs of other companies.");
                            navigate('/dashboard');
                            return;
                        }
                    }
                    // Normalize database columns
                    const parsedRounds = Array.isArray(data.selection_rounds) 
                        ? data.selection_rounds 
                        : (typeof data.selection_rounds === 'string' 
                            ? JSON.parse(data.selection_rounds) 
                            : []);
                    
                    const parseArray = (val: any) => {
                        if (!val) return [];
                        if (Array.isArray(val)) return val;
                        if (typeof val === 'string') return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
                        return [val];
                    };

                    const { data: docsData } = await insforge.database
                        .from('job_documents')
                        .select('*')
                        .eq('job_id', loadId);

                    setForm({
                        company: data.company || '',
                        logo_url: data.logo_url || '',
                        role: data.role || '',
                        description: data.description || '',
                        job_type: data.job_type || 'full-time',
                        work_mode: data.work_mode || 'on-site',
                        ctc: data.ctc !== null ? data.ctc.toString() : '',
                        stipend: data.stipend !== null ? data.stipend.toString() : '',
                        location: parseArray(data.location),
                        min_cgpa: data.min_cgpa !== null ? data.min_cgpa.toString() : '0',
                        max_backlogs: data.max_backlogs !== null ? data.max_backlogs.toString() : '0',
                        allowed_branches: parseArray(data.allowed_branches),
                        allowed_years: parseArray(data.allowed_years).map((y: any) => parseInt(y, 10)).filter((y: any) => !isNaN(y)),
                        allowed_graduation_years: parseArray(data.allowed_graduation_years).map((y: any) => parseInt(y, 10)).filter((y: any) => !isNaN(y)),
                        application_deadline: data.application_deadline ? data.application_deadline.substring(0, 16) : '', // format for datetime-local
                        selection_rounds: parsedRounds.length > 0 ? parsedRounds : [
                            { round_number: 1, name: 'Online Assessment', type: 'Assessment', duration: 90, description: '' }
                        ],
                        required_skills: parseArray(data.required_skills),
                        tech_stack: parseArray(data.tech_stack),
                        status: isDuplicate ? 'active' : (data.status || 'active'),
                        application_mode: data.application_mode || 'internal',
                        external_application_url: data.external_application_url || '',
                        has_external_documents: data.has_external_documents || false,
                        documents: docsData ? docsData.map((d: any) => ({
                            id: isDuplicate ? undefined : d.id,
                            file_name: d.file_name,
                            file_url: d.file_url,
                            file_type: d.file_type,
                            file_size: d.file_size,
                            is_required: d.is_required
                        })) : []
                    });
                }
            } catch (err) {
                console.error("Error fetching job details:", err);
                alert("Failed to load job details.");
            } finally {
                setLoadingDraft(false);
            }
        }
        fetchJobDetails();
    }, [loadId, isDuplicate, role, roleData]);

    // Autosave functionality
    useEffect(() => {
        if (isDirty && !isEdit) {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
        }
    }, [form, isDirty, isEdit]);

    // Warning on Unsaved Changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const updateForm = (key: keyof FormState, val: any) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setIsDirty(true);
    };

    // Calculate deadline days count
    const daysLeft = useMemo(() => {
        if (!form.application_deadline) return null;
        const diff = new Date(form.application_deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    }, [form.application_deadline]);

    // Handle Company Autocomplete
    const handleCompanyChange = (val: string) => {
        updateForm('company', val);
        if (val.trim().length > 0) {
            const filtered = companySuggestions.filter(c =>
                c.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredCompanies(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectCompany = (val: string) => {
        updateForm('company', val);
        setShowSuggestions(false);
    };

    // Branch selection helper
    const toggleBranch = (branch: string) => {
        const current = [...(form.allowed_branches || [])];
        if (current.includes(branch)) {
            updateForm('allowed_branches', current.filter(b => b !== branch));
        } else {
            updateForm('allowed_branches', [...current, branch]);
        }
    };

    // Grad year check selector
    const toggleYear = (year: number) => {
        const current = [...(form.allowed_years || [])];
        if (current.includes(year)) {
            updateForm('allowed_years', current.filter(y => y !== year));
        } else {
            updateForm('allowed_years', [...current, year]);
        }
    };

    // Graduation Year toggler
    const toggleGraduationYear = (year: number) => {
        const current = [...(form.allowed_graduation_years || [])];
        if (current.includes(year)) {
            updateForm('allowed_graduation_years', current.filter(y => y !== year));
        } else {
            updateForm('allowed_graduation_years', [...current, year]);
        }
    };

    const handleAddCustomBranch = (customVal?: string) => {
        const valueToAdd = (customVal || branchSearch).trim();
        if (!valueToAdd) return;
        const isDuplicate = (form.allowed_branches || []).some(
            b => b.toLowerCase() === valueToAdd.toLowerCase()
        );
        if (!isDuplicate) {
            updateForm('allowed_branches', [...(form.allowed_branches || []), valueToAdd]);
        }
        setBranchSearch('');
    };

    const handleBranchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomBranch();
        }
    };

    // Graduation Year derived options and filtering
    const allGradYearOptions = useMemo(() => {
        const years = Array.from(new Set([...GRAD_YEAR_OPTIONS, ...(form.allowed_graduation_years || [])]));
        return years.sort((a, b) => a - b);
    }, [form.allowed_graduation_years]);

    const filteredGradYears = useMemo(() => {
        const query = gradYearSearch.trim().toLowerCase();
        if (!query) return allGradYearOptions;
        return allGradYearOptions.filter(y => String(y).includes(query));
    }, [allGradYearOptions, gradYearSearch]);

    const handleAddCustomGradYear = (customVal?: string) => {
        const val = (customVal || gradYearSearch).trim();
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1900 || parsed > 2100) return;
        const isDuplicate = (form.allowed_graduation_years || []).includes(parsed);
        if (!isDuplicate) {
            updateForm('allowed_graduation_years', [...(form.allowed_graduation_years || []), parsed]);
        }
        setGradYearSearch('');
    };

    const selectAllFilteredGradYears = () => {
        const toAdd = filteredGradYears.filter(y => !(form.allowed_graduation_years || []).includes(y));
        updateForm('allowed_graduation_years', [...(form.allowed_graduation_years || []), ...toAdd]);
    };

    const clearAllFilteredGradYears = () => {
        updateForm('allowed_graduation_years', (form.allowed_graduation_years || []).filter(y => !filteredGradYears.includes(y)));
    };

    // Tag list helpers
    const addTag = (key: 'location' | 'required_skills' | 'tech_stack', val: string, setVal: (s: string) => void) => {
        const trimmed = val.trim();
        if (trimmed && !form[key].includes(trimmed)) {
            updateForm(key, [...form[key], trimmed]);
            setVal('');
        }
    };

    const removeTag = (key: 'location' | 'required_skills' | 'tech_stack', index: number) => {
        updateForm(key, form[key].filter((_, i) => i !== index));
    };

    // File upload and storage helpers
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            
            if (!allowedExtensions.includes(ext)) {
                alert(`File type not allowed: ${file.name}. Allowed types are: pdf, doc, docx, ppt, pptx, png, jpg, jpeg`);
                continue;
            }
            
            if (file.size > 20 * 1024 * 1024) {
                alert(`File size exceeds 20MB: ${file.name}`);
                continue;
            }

            const tempId = Math.random().toString(36).substring(7);
            
            const newDoc: JobDocument = {
                tempId,
                file_name: file.name,
                file_url: '',
                file_type: file.type || ext,
                file_size: file.size,
                is_required: false,
                uploading: true,
                progress: 10
            };
            
            setForm(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc]
            }));

            // Mock progress interval
            const progressInterval = setInterval(() => {
                setForm(prev => {
                    const docs = prev.documents.map(d => {
                        if (d.tempId === tempId && d.uploading && (d.progress || 0) < 90) {
                            return { ...d, progress: (d.progress || 0) + 10 };
                        }
                        return d;
                    });
                    return { ...prev, documents: docs };
                });
            }, 100);

            try {
                const storagePath = `job-documents_${Date.now()}_${file.name}`;
                const { data, error } = await insforge.storage.from('job-documents').upload(storagePath, file);
                
                clearInterval(progressInterval);

                if (error) throw error;

                if (data) {
                    setForm(prev => {
                        const docs = prev.documents.map(d => {
                            if (d.tempId === tempId) {
                                return {
                                    ...d,
                                    file_url: data.url,
                                    uploading: false,
                                    progress: 100
                                };
                            }
                            return d;
                        });
                        return { ...prev, documents: docs };
                    });
                }
            } catch (err: any) {
                clearInterval(progressInterval);
                console.error("Upload failed:", err);
                setForm(prev => {
                    const docs = prev.documents.map(d => {
                        if (d.tempId === tempId) {
                            return {
                                ...d,
                                uploading: false,
                                error: err.message || "Upload failed"
                            };
                        }
                        return d;
                    });
                    return { ...prev, documents: docs };
                });
            }
        }
    };

    const replaceFile = async (index: number, file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];
        if (!allowedExtensions.includes(ext)) {
            alert(`File type not allowed: ${file.name}`);
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert(`File size exceeds 20MB: ${file.name}`);
            return;
        }

        const updatedDocs = [...(form.documents || [])];
        updatedDocs[index] = {
            ...updatedDocs[index],
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || ext,
            uploading: true,
            progress: 10,
            error: undefined
        };
        setForm(prev => ({ ...prev, documents: updatedDocs }));

        const progressInterval = setInterval(() => {
            setForm(prev => {
                const docs = [...(prev.documents || [])];
                if (docs[index] && docs[index].uploading && (docs[index].progress || 0) < 90) {
                    docs[index] = { ...docs[index], progress: (docs[index].progress || 0) + 10 };
                }
                return { ...prev, documents: docs };
            });
        }, 100);

        try {
            const storagePath = `job-documents_${Date.now()}_${file.name}`;
            const { data, error } = await insforge.storage.from('job-documents').upload(storagePath, file);
            clearInterval(progressInterval);
            if (error) throw error;
            if (data) {
                setForm(prev => {
                    const docs = [...(prev.documents || [])];
                    docs[index] = {
                        ...docs[index],
                        file_url: data.url,
                        uploading: false,
                        progress: 100
                    };
                    return { ...prev, documents: docs };
                });
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            console.error("Replacement failed:", err);
            setForm(prev => {
                const docs = [...(prev.documents || [])];
                docs[index] = {
                    ...docs[index],
                    uploading: false,
                    error: err.message || "Upload failed"
                };
                return { ...prev, documents: docs };
            });
        }
    };

    const deleteFile = (index: number) => {
        setForm(prev => ({
            ...prev,
            documents: (prev.documents || []).filter((_, i) => i !== index)
        }));
    };

    const toggleRequired = (index: number) => {
        setForm(prev => {
            const docs = [...(prev.documents || [])];
            docs[index] = { ...docs[index], is_required: !docs[index].is_required };
            return { ...prev, documents: docs };
        });
    };

    // Selection Rounds actions
    const addRound = () => {
        const rounds = [...form.selection_rounds];
        rounds.push({
            round_number: rounds.length + 1,
            name: '',
            type: 'Technical Interview',
            duration: 45,
            description: ''
        });
        updateForm('selection_rounds', rounds);
    };

    const removeRound = (index: number) => {
        let rounds = form.selection_rounds.filter((_, i) => i !== index);
        // Recalculate round numbers
        rounds = rounds.map((r, i) => ({ ...r, round_number: i + 1 }));
        updateForm('selection_rounds', rounds);
    };

    const updateRound = (index: number, field: keyof SelectionRound, val: any) => {
        const rounds = [...form.selection_rounds];
        rounds[index] = { ...rounds[index], [field]: val };
        updateForm('selection_rounds', rounds);
    };

    const moveRound = (index: number, dir: 'up' | 'down') => {
        if (dir === 'up' && index === 0) return;
        if (dir === 'down' && index === form.selection_rounds.length - 1) return;
        const rounds = [...form.selection_rounds];
        const swapIndex = dir === 'up' ? index - 1 : index + 1;
        const temp = rounds[index];
        rounds[index] = rounds[swapIndex];
        rounds[swapIndex] = temp;

        // Reassign round numbers based on position
        const updated = rounds.map((r, i) => ({ ...r, round_number: i + 1 }));
        updateForm('selection_rounds', updated);
    };

    // Validations logic
    const validationErrors = useMemo(() => {
        const errors: Record<string, string> = {};

        if (form.company.trim().length < 2) {
            errors.company = "Company Name must be at least 2 characters.";
        }
        if (form.role.trim().length < 2) {
            errors.role = "Role / Position name must be at least 2 characters.";
        }
        if (form.description.trim().length < 100) {
            errors.description = `Description must be at least 100 characters. Currently: ${form.description.trim().length}`;
        }
        if (form.job_type === 'full-time') {
            if (!form.ctc || isNaN(Number(form.ctc)) || Number(form.ctc) < 0 || Number(form.ctc) > 100) {
                errors.ctc = "CTC is required for Full-Time jobs and must be between 0 and 100 LPA.";
            }
        } else if (form.job_type === 'internship') {
            if (!form.stipend || isNaN(Number(form.stipend)) || Number(form.stipend) < 0) {
                errors.stipend = "Stipend is required for Internships and must be non-negative.";
            }
        } else {
            // For PPO and Contract, validate that either CTC or Stipend is provided
            const hasCtc = form.ctc && !isNaN(Number(form.ctc)) && Number(form.ctc) >= 0;
            const hasStipend = form.stipend && !isNaN(Number(form.stipend)) && Number(form.stipend) >= 0;
            if (!hasCtc && !hasStipend) {
                errors.compensation = "Either CTC (LPA) or Stipend (₹/month) is required.";
            }
        }
        if (isNaN(Number(form.min_cgpa)) || Number(form.min_cgpa) < 0 || Number(form.min_cgpa) > 10) {
            errors.min_cgpa = "CGPA must be between 0 and 10.";
        }
        if (!form.max_backlogs || isNaN(Number(form.max_backlogs)) || Number(form.max_backlogs) < 0) {
            errors.max_backlogs = "Max backlogs must be 0 or greater.";
        }
        if (form.allowed_branches.length === 0) {
            errors.allowed_branches = "At least one branch must be allowed.";
        }
        if (form.allowed_years.length === 0) {
            errors.allowed_years = "At least one allowed year must be selected.";
        }
        if (!form.allowed_graduation_years || form.allowed_graduation_years.length === 0) {
            errors.allowed_graduation_years = "At least one graduation year must be selected.";
        }
        if (form.location.length === 0) {
            errors.location = "At least one city/location is required.";
        }
        if (form.required_skills.length === 0) {
            errors.required_skills = "At least one skill is required.";
        }
        if (form.tech_stack.length === 0) {
            errors.tech_stack = "At least one technology must be listed.";
        }
        if (form.selection_rounds.length === 0) {
            errors.selection_rounds = "At least one selection round is required.";
        } else {
            const hasEmptyRound = form.selection_rounds.some(r => !r.name.trim() || !r.type);
            if (hasEmptyRound) {
                errors.selection_rounds_items = "All interview rounds must have a valid name and type selection.";
            }
            if (form.selection_rounds.length > 10) {
                errors.selection_rounds_items = "Maximum 10 interview rounds allowed.";
            }
        }
        if (!form.application_deadline) {
            errors.application_deadline = "Application deadline is required.";
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (new Date(form.application_deadline) < tomorrow) {
                errors.application_deadline = "Deadline must be at least tomorrow.";
            }
        }

        return errors;
    }, [form]);



    const isFormValid = Object.keys(validationErrors).length === 0;

    // Database Pub/Sub trigger submit
    const handleSubmit = async (publishStatus: 'active' | 'draft') => {
        if (publishStatus === 'active' && !isFormValid) {
            alert("Please resolve all validation errors before publishing.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                company: form.company,
                logo_url: form.logo_url || null,
                role: form.role,
                title: form.role, // satisfies NOT NULL title
                description: form.description,
                job_type: form.job_type,
                work_mode: form.work_mode,
                ctc: form.ctc ? parseFloat(form.ctc) : null,
                stipend: form.stipend ? parseInt(form.stipend) : null,
                location: form.location,
                min_cgpa: parseFloat(form.min_cgpa) || 0,
                max_backlogs: form.max_backlogs ? parseInt(form.max_backlogs) : 0,
                allowed_branches: form.allowed_branches,
                allowed_years: form.allowed_years,
                allowed_graduation_years: form.allowed_graduation_years,
                application_deadline: form.application_deadline ? new Date(form.application_deadline).toISOString() : null,
                num_rounds: form.selection_rounds.length,
                selection_rounds: form.selection_rounds,
                required_skills: form.required_skills,
                tech_stack: form.tech_stack,
                status: publishStatus,
                updated_at: new Date().toISOString(),
                application_mode: 'internal',
                external_application_url: null,
                has_external_documents: (form.documents || []).length > 0
            };

            // Determine if we should notify students (new job published or draft transitioned to active)
            let shouldNotifyStudents = false;
            if (publishStatus === 'active') {
                if (!isEdit) {
                    shouldNotifyStudents = true;
                } else {
                    const { data: oldJob } = await insforge.database
                        .from('jobs')
                        .select('status')
                        .eq('id', id)
                        .maybeSingle();
                    if (oldJob && oldJob.status === 'draft') {
                        shouldNotifyStudents = true;
                    }
                }
            }

            let response;
            if (isEdit) {
                // UPDATE query
                response = await insforge.database
                    .from('jobs')
                    .update(payload)
                    .eq('id', id)
                    .select();
            } else {
                // INSERT query (always in array format)
                response = await insforge.database
                    .from('jobs')
                    .insert([payload])
                    .select();
            }

            console.log("Database submission response:", response);

            if (response.error) {
                console.error("Database submission error:", response.error);
                alert("Failed to submit job posting: " + response.error.message);
                return;
            }

            const savedJob = response.data?.[0];
            if (!savedJob) {
                throw new Error("No data returned from database insert/update");
            }
            const jobId = savedJob.id;

            // Notify all students of the new active job opening
            if (shouldNotifyStudents) {
                try {
                    const { data: students } = await insforge.database
                        .from('students')
                        .select('id');
                    
                    if (students && students.length > 0) {
                        const ctcDisplay = payload.ctc ? `${payload.ctc} LPA` : (payload.stipend ? `₹${payload.stipend}/month` : 'Not disclosed');
                        const title = `🎉 New Job Opportunity: ${payload.company}`;
                        const message = `${payload.company} is hiring for ${payload.role}. CTC/Stipend: ${ctcDisplay}. Apply now!`;
                        
                        const notificationsPayload = students.map(s => ({
                            user_id: s.id,
                            title,
                            message,
                            type: 'success',
                            entity_type: 'job',
                            entity_id: jobId,
                            is_read: false
                        }));
                        
                        await insforge.database
                            .from('notifications')
                            .insert(notificationsPayload);
                    }
                } catch (notifErr) {
                    console.error("Failed to generate job posting notifications:", notifErr);
                }
            }

            // Sync job_documents: delete existing first, then insert all current ones
            if (isEdit) {
                const { error: delErr } = await insforge.database
                    .from('job_documents')
                    .delete()
                    .eq('job_id', jobId);
                if (delErr) {
                    console.error("Failed to clear old documents:", delErr);
                }
            }

            if (form.documents && form.documents.length > 0) {
                const docsPayload = form.documents.map(d => ({
                    job_id: jobId,
                    file_name: d.file_name,
                    file_url: d.file_url,
                    file_type: d.file_type,
                    file_size: d.file_size,
                    is_required: d.is_required
                }));
                const docRes = await insforge.database
                    .from('job_documents')
                    .insert(docsPayload);
                if (docRes.error) {
                    console.error("Failed to save documents metadata:", docRes.error);
                    alert("Job was saved, but failed to save attached documents: " + docRes.error.message);
                }
            }

            // Clean up drafts
            localStorage.removeItem(AUTOSAVE_KEY);
            setIsDirty(false);

            navigate('/jobs');
        } catch (err: any) {
            console.error("Unexpected submission error:", err);
            alert("Unexpected submission error occurred.");
        } finally {
            setSubmitting(false);
            setShowConfirmPublish(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            setShowCancelDialog(true);
        } else {
            navigate('/jobs');
        }
    };

    const clearDraft = () => {
        if (confirm("Are you sure you want to discard your draft? This cannot be undone.")) {
            localStorage.removeItem(AUTOSAVE_KEY);
            setForm(INITIAL_FORM);
            setIsDirty(false);
            setStep(1);
        }
    };

    return (
        <TooltipProvider>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
                            {isEdit ? 'Edit Placement Posting' : 'Post A New Job Opening'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isEdit ? 'Modify details of an active job listing' : 'Build a production-grade placements listing for students'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {isDirty && !isEdit && (
                            <Button variant="ghost" size="sm" onClick={clearDraft} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50">
                                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Discard Draft
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {previewMode ? 'Edit Mode' : 'Live Preview'}
                        </Button>
                    </div>
                </div>

                {loadingDraft ? (
                    <Card className="p-12 text-center animate-pulse bg-muted/20">
                        <Clock className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-semibold">Loading placement details...</p>
                    </Card>
                ) : previewMode ? (
                    /* Preview Screen UI */
                    <Card className="border border-primary/20 shadow-xl overflow-hidden rounded-2xl animate-scale-in bg-card/60 backdrop-blur-md">
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {form.logo_url ? (
                                    <img src={form.logo_url} alt={form.company} className="w-12 h-12 rounded-xl object-contain border bg-white" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-primary/25 flex items-center justify-center text-primary font-bold text-lg">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-heading font-bold">{form.role || 'Role Title'}</h2>
                                    <p className="text-sm text-muted-foreground font-semibold">{form.company || 'Company Name'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge className="capitalize text-xs font-bold px-3 py-1 bg-primary/20 text-primary border border-primary/30">
                                    {form.job_type}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">{form.work_mode.toUpperCase()}</p>
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-xl">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Compensation</p>
                                    <p className="font-bold text-sm text-foreground mt-0.5">
                                        {form.job_type === 'internship' ? `₹${form.stipend || '—'}/mo` : `₹${form.ctc || '—'} LPA`}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Locations</p>
                                    <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                                        {form.location.join(', ') || '—'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Eligibility</p>
                                    <p className="font-bold text-sm text-foreground mt-0.5">
                                        {form.min_cgpa} CGPA | {form.max_backlogs} Backlog
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Deadline</p>
                                    <p className="font-bold text-sm text-amber-600 mt-0.5">
                                        {form.application_deadline ? new Date(form.application_deadline).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Job Description</h3>
                                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{form.description || 'No description provided.'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Eligibility Details</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-muted-foreground">Branches:</span> <span className="font-medium text-foreground">{form.allowed_branches.join(', ') || 'None selected'}</span></p>
                                        <p><span className="text-muted-foreground">Allowed Years:</span> <span className="font-medium text-foreground">{form.allowed_years.map(y => getYearDisplay(y)).join(', ') || 'None selected'}</span></p>
                                        <p><span className="text-muted-foreground">Graduation Years:</span> <span className="font-medium text-foreground">{(form.allowed_graduation_years || []).join(', ') || 'None selected'}</span></p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Required Skills & Tech</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.required_skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                                        {form.tech_stack.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">Selection Process</h3>
                                <div className="space-y-3">
                                    {form.selection_rounds.map((r) => (
                                        <div key={r.round_number} className="flex gap-3 items-start border-l-2 border-primary/30 pl-4 py-1">
                                            <div className="bg-primary/10 text-primary text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                                {r.round_number}
                                            </div>
                                            <div>
                                                <div className="flex gap-2 items-center">
                                                    <span className="font-bold text-sm text-foreground">{r.name || `Round ${r.round_number}`}</span>
                                                    <Badge className="text-[9px] scale-90 bg-muted text-muted-foreground uppercase">{r.type}</Badge>
                                                    <span className="text-xs text-muted-foreground">({r.duration}m)</span>
                                                </div>
                                                {r.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Step indicators */
                    <div className="space-y-6">
                        <div className="grid grid-cols-7 gap-2 border border-border/80 p-2.5 rounded-2xl bg-card/40 backdrop-blur-sm relative shadow-inner overflow-x-auto">
                            {[
                                { stepNum: 1, label: 'Company', icon: Building2 },
                                { stepNum: 2, label: 'Details', icon: Briefcase },
                                { stepNum: 3, label: 'Eligibility', icon: GraduationCap },
                                { stepNum: 4, label: 'Rounds', icon: Clock },
                                { stepNum: 5, label: 'Skills', icon: Sparkles },
                                { stepNum: 6, label: 'Documents', icon: FileText },
                                { stepNum: 7, label: 'Publish', icon: CheckCircle }
                            ].map((item) => (
                                <button
                                    key={item.stepNum}
                                    onClick={() => setStep(item.stepNum)}
                                    className={cn(
                                        'flex flex-col md:flex-row items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 min-w-[70px]',
                                        step === item.stepNum 
                                            ? 'bg-primary text-white shadow-md' 
                                            : 'text-muted-foreground hover:bg-muted/40'
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Step 1: Company Info */}
                        {step === 1 && (
                            <Card className="animate-scale-in">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Company Information</CardTitle>
                                    <CardDescription>Enter details about the recruiting organisation</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative">
                                        <Label className="flex items-center gap-1">Company Name * 
                                            <Tooltip><TooltipTrigger><HelpCircle className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Enter the formal corporate name</TooltipContent></Tooltip>
                                        </Label>
                                        <Input
                                            required
                                            value={form.company}
                                            onChange={(e) => handleCompanyChange(e.target.value)}
                                            placeholder="e.g. Google India"
                                            disabled={role === 'recruiter'}
                                            className={cn("mt-1", validationErrors.company && "border-red-500")}
                                        />
                                        {validationErrors.company && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.company}</p>}

                                        {showSuggestions && (
                                            <div className="absolute left-0 right-0 z-50 mt-1 bg-popover border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                {filteredCompanies.map(c => (
                                                    <div
                                                        key={c}
                                                        onClick={() => selectCompany(c)}
                                                        className="px-4 py-2 hover:bg-muted cursor-pointer text-sm font-semibold transition-colors"
                                                    >
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Company Logo URL (Optional)</Label>
                                        <Input
                                            value={form.logo_url}
                                            onChange={(e) => updateForm('logo_url', e.target.value)}
                                            placeholder="https://..."
                                            className="mt-1"
                                        />
                                        {form.logo_url && (
                                            <div className="mt-3 flex items-center gap-2 border p-2 rounded-xl max-w-xs bg-muted/30">
                                                <img src={form.logo_url} alt="logo preview" className="w-8 h-8 rounded object-contain bg-white" />
                                                <span className="text-xs font-semibold text-muted-foreground truncate">Logo Preview</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Job Details */}
                        {step === 2 && (
                            <Card className="animate-scale-in">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Job details</CardTitle>
                                    <CardDescription>Configure positioning, workspace modes and compensation packages</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label>Role / Position Name *</Label>
                                        <Input
                                            required
                                            value={form.role}
                                            onChange={(e) => updateForm('role', e.target.value)}
                                            placeholder="e.g. Software Development Engineer - 1"
                                            className={cn("mt-1", validationErrors.role && "border-red-500")}
                                        />
                                        {validationErrors.role && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.role}</p>}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <Label>Job Description *</Label>
                                            <span className={cn("text-[10px] font-bold", form.description.trim().length >= 100 ? "text-emerald-500" : "text-muted-foreground")}>
                                                {form.description.trim().length} / min 100 chars
                                            </span>
                                        </div>
                                        <Textarea
                                            required
                                            value={form.description}
                                            onChange={(e) => updateForm('description', e.target.value)}
                                            placeholder="Introduce the responsibilities, expected deliverables, team dynamics..."
                                            rows={6}
                                            className={cn(validationErrors.description && "border-red-500")}
                                        />
                                        {validationErrors.description && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.description}</p>}
                                    </div>

                                    <div>
                                        <Label>Job Type *</Label>
                                        <div className="grid grid-cols-4 gap-2 border border-border/80 p-1 rounded-xl mt-1.5 bg-muted/40">
                                            {['full-time', 'internship', 'ppo', 'contract'].map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => updateForm('job_type', t)}
                                                    className={cn(
                                                        'py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all duration-200',
                                                        form.job_type === t ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted/70'
                                                    )}
                                                >
                                                    {t.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Work Mode *</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
                                            {[
                                                { mode: 'on-site', desc: 'Work directly from office premises.' },
                                                { mode: 'hybrid', desc: 'Flexible office & remote schedule.' },
                                                { mode: 'remote', desc: 'Full time work from home configuration.' }
                                            ].map((wm) => (
                                                <div
                                                    key={wm.mode}
                                                    onClick={() => updateForm('work_mode', wm.mode)}
                                                    className={cn(
                                                        'p-4 border rounded-xl cursor-pointer transition-all duration-250 select-none hover:border-primary/40',
                                                        form.work_mode === wm.mode 
                                                            ? 'border-2 border-primary bg-primary/5 shadow-md' 
                                                            : 'border-border/60'
                                                    )}
                                                >
                                                    <p className="font-bold text-sm capitalize">{wm.mode}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 font-semibold">{wm.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {form.job_type !== 'internship' && (
                                            <div>
                                                <Label>CTC (Annual, LPA) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={form.ctc}
                                                    onChange={(e) => updateForm('ctc', e.target.value)}
                                                    placeholder="e.g. 12.5"
                                                    className={cn("mt-1", validationErrors.ctc && "border-red-500")}
                                                />
                                                {validationErrors.ctc && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.ctc}</p>}
                                            </div>
                                        )}

                                        {form.job_type !== 'full-time' && (
                                            <div>
                                                <Label>Stipend (Monthly, ₹) *</Label>
                                                <Input
                                                    type="number"
                                                    value={form.stipend}
                                                    onChange={(e) => updateForm('stipend', e.target.value)}
                                                    placeholder="e.g. 45000"
                                                    className={cn("mt-1", validationErrors.stipend && "border-red-500")}
                                                />
                                                {validationErrors.stipend && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.stipend}</p>}
                                            </div>
                                        )}
                                    </div>
                                    {validationErrors.compensation && <p className="text-xs text-red-500 font-semibold">{validationErrors.compensation}</p>}

                                    {/* Location tags input */}
                                    <TagInput
                                        tags={form.location}
                                        setTags={(t) => updateForm('location', t)}
                                        placeholder="Add cities (e.g. Bangalore, Noida, Pune)"
                                        label="Locations *"
                                        error={validationErrors.location}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Eligibility Criteria */}
                        {step === 3 && (
                            <Card className="animate-scale-in border-border/80 shadow-lg bg-card/60 backdrop-blur-md">
                                <CardHeader className="border-b border-border/40 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-heading font-bold">Eligibility Criteria</CardTitle>
                                            <CardDescription className="text-xs">Configure candidate academic cutoffs, branch clearances, and target cohorts</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    
                                    {/* Section 1: Academic Cutoffs */}
                                    <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">Academic Thresholds</h3>
                                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Specify minimum grade points and backlog allowance</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* CGPA */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                                    Minimum CGPA *
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={form.min_cgpa}
                                                        onChange={(e) => updateForm('min_cgpa', e.target.value)}
                                                        className={cn("pl-3 pr-12 h-10 rounded-xl bg-background border-input", validationErrors.min_cgpa && "border-red-500")}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">/ 10.0</span>
                                                </div>
                                                
                                                {/* Presets */}
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {[
                                                        { label: 'No Limit (0.0)', val: '0' },
                                                        { label: '6.0+', val: '6' },
                                                        { label: '7.0+', val: '7' },
                                                        { label: '7.5+', val: '7.5' },
                                                        { label: '8.0+', val: '8' }
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.label}
                                                            type="button"
                                                            onClick={() => updateForm('min_cgpa', preset.val)}
                                                            className={cn(
                                                                "px-2.5 py-1 text-[10px] font-bold border rounded-lg transition-all duration-150",
                                                                form.min_cgpa === preset.val
                                                                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                                    : "bg-background text-muted-foreground border-border/80 hover:bg-muted/70"
                                                            )}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                {validationErrors.min_cgpa && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.min_cgpa}</p>}
                                            </div>

                                            {/* Backlogs */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                                    Maximum Active Backlogs Allowed *
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={form.max_backlogs}
                                                    onChange={(e) => updateForm('max_backlogs', e.target.value)}
                                                    className={cn("h-10 rounded-xl bg-background border-input", validationErrors.max_backlogs && "border-red-500")}
                                                />
                                                
                                                {/* Presets */}
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {[
                                                        { label: 'No Backlogs (0)', val: '0' },
                                                        { label: '1 Allowed', val: '1' },
                                                        { label: '2 Allowed', val: '2' },
                                                        { label: 'No Limit', val: '99' }
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.label}
                                                            type="button"
                                                            onClick={() => updateForm('max_backlogs', preset.val)}
                                                            className={cn(
                                                                "px-2.5 py-1 text-[10px] font-bold border rounded-lg transition-all duration-150",
                                                                form.max_backlogs === preset.val
                                                                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                                    : "bg-background text-muted-foreground border-border/80 hover:bg-muted/70"
                                                            )}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                {validationErrors.max_backlogs && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.max_backlogs}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Allowed Branches */}
                                    <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground">Discipline Clearances</h3>
                                                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Determine which academic courses/branches can apply</p>
                                            </div>
                                            {/* Predefined Group Selects */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = [...(form.allowed_branches || [])];
                                                        const newBranches = Array.from(new Set([...current, ...['CSE', 'IT', 'AI & ML', 'AI & DS', 'Data Science', 'Cyber Security', 'Information Science', 'MCA', 'MTech']]));
                                                        updateForm('allowed_branches', newBranches);
                                                    }}
                                                    className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg font-bold transition-all"
                                                >
                                                    💻 Select Tech
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = [...(form.allowed_branches || [])];
                                                        const newBranches = Array.from(new Set([...current, ...['ECE', 'EEE', 'Electronics and Computer Engineering', 'Robotics', 'Mechatronics', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology']]));
                                                        updateForm('allowed_branches', newBranches);
                                                    }}
                                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-lg font-bold transition-all"
                                                >
                                                    ⚙️ Select Core
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateForm('allowed_branches', [...BRANCH_OPTIONS])}
                                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-lg font-bold transition-all"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateForm('allowed_branches', [])}
                                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold transition-all"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>
                                        {validationErrors.allowed_branches && <p className="text-xs text-red-500 font-semibold">{validationErrors.allowed_branches}</p>}

                                        {/* Search & Custom Branch Add Row */}
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search canonical branches or add custom... (e.g. AI & ML)"
                                                    value={branchSearch}
                                                    onChange={(e) => setBranchSearch(e.target.value)}
                                                    onKeyDown={handleBranchKeyDown}
                                                    className="pl-9 h-10 bg-background border-input text-foreground rounded-xl"
                                                />
                                            </div>
                                            {branchSearch.trim() && (
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAddCustomBranch()}
                                                    className="bg-primary hover:bg-primary/95 text-white h-10 px-4 rounded-xl flex items-center gap-1.5 font-bold transition-all duration-200"
                                                >
                                                    <Plus className="w-4 h-4" /> Add "{branchSearch}"
                                                </Button>
                                            )}
                                        </div>

                                        {/* Grouped Branch Display */}
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 border border-border/40 bg-muted/5 rounded-xl p-3.5">
                                            {[
                                                {
                                                    name: 'Computing & Software (Tech)',
                                                    branches: ['CSE', 'IT', 'AI & ML', 'AI & DS', 'Data Science', 'Cyber Security', 'Information Science', 'MCA', 'MTech']
                                                },
                                                {
                                                    name: 'Electronics & Automation',
                                                    branches: ['ECE', 'EEE', 'Electronics and Computer Engineering', 'Robotics', 'Mechatronics']
                                                },
                                                {
                                                    name: 'Core Engineering',
                                                    branches: ['Mechanical', 'Civil', 'Chemical', 'Biotechnology']
                                                },
                                                {
                                                    name: 'Management & Others',
                                                    branches: ['MBA', 'Other']
                                                }
                                            ].map((group) => {
                                                // Filter branches in group matching search query
                                                const matchingBranches = group.branches.filter(b => 
                                                    !branchSearch.trim() || b.toLowerCase().includes(branchSearch.trim().toLowerCase())
                                                );

                                                if (matchingBranches.length === 0) return null;

                                                const allGroupSelected = matchingBranches.every(b => form.allowed_branches.includes(b));

                                                return (
                                                    <div key={group.name} className="space-y-2 border border-border/30 p-3 rounded-xl bg-card">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-xs font-bold text-foreground/80">{group.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = [...form.allowed_branches];
                                                                    if (allGroupSelected) {
                                                                        updateForm('allowed_branches', current.filter(b => !matchingBranches.includes(b)));
                                                                    } else {
                                                                        const toAdd = matchingBranches.filter(b => !current.includes(b));
                                                                        updateForm('allowed_branches', [...current, ...toAdd]);
                                                                    }
                                                                }}
                                                                className="text-[10px] text-primary hover:underline font-bold"
                                                            >
                                                                {allGroupSelected ? 'Deselect Group' : 'Select Group'}
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {matchingBranches.map((branch) => {
                                                                const selected = form.allowed_branches.includes(branch);
                                                                return (
                                                                    <button
                                                                        key={branch}
                                                                        type="button"
                                                                        onClick={() => toggleBranch(branch)}
                                                                        className={cn(
                                                                            'py-1.5 px-3 rounded-xl text-xs font-bold border transition-all duration-205 flex items-center gap-1.5 select-none',
                                                                            selected 
                                                                                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                                                : 'bg-background text-muted-foreground border-border/80 hover:border-primary/45 hover:text-foreground'
                                                                        )}
                                                                    >
                                                                        <span>{branch}</span>
                                                                        {selected ? (
                                                                            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                        ) : (
                                                                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Custom Branches */}
                                            {form.allowed_branches.filter(b => !BRANCH_OPTIONS.includes(b as any)).length > 0 && (
                                                <div className="space-y-2 border border-border/30 p-3 rounded-xl bg-card">
                                                    <span className="text-xs font-bold text-foreground/80 px-1">Custom Disciplines</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {form.allowed_branches.filter(b => !BRANCH_OPTIONS.includes(b as any)).map((branch) => (
                                                            <button
                                                                key={branch}
                                                                type="button"
                                                                onClick={() => toggleBranch(branch)}
                                                                className="py-1.5 px-3 rounded-xl text-xs font-bold border bg-primary/10 border-primary text-primary flex items-center gap-1.5"
                                                            >
                                                                <span>{branch}</span>
                                                                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Search fallback */}
                                            {branchSearch.trim() && 
                                             !BRANCH_OPTIONS.some(b => b.toLowerCase().includes(branchSearch.trim().toLowerCase())) &&
                                             form.allowed_branches.filter(b => !BRANCH_OPTIONS.includes(b as any)).filter(b => b.toLowerCase().includes(branchSearch.trim().toLowerCase())).length === 0 && (
                                                <p className="text-xs text-muted-foreground italic w-full text-center py-4 bg-background/50 rounded-xl">
                                                    No standard branches match your search. Press Enter to add "{branchSearch}" as a custom discipline.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 3: Cohorts Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* Column 1: Academic Years */}
                                        <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                            Allowed Years *
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Filter based on student current academic year</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateForm('allowed_years', [...YEAR_OPTIONS])}
                                                            className="text-primary hover:underline font-bold"
                                                        >
                                                            Select All
                                                        </button>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateForm('allowed_years', [])}
                                                            className="text-muted-foreground hover:text-foreground hover:underline font-bold"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                                {validationErrors.allowed_years && <p className="text-xs text-red-500 font-semibold">{validationErrors.allowed_years}</p>}
                                                
                                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                                    {YEAR_OPTIONS.map((year) => {
                                                        const selected = form.allowed_years.includes(year);
                                                        return (
                                                            <button
                                                                key={year}
                                                                type="button"
                                                                onClick={() => toggleYear(year)}
                                                                className={cn(
                                                                    'py-3 px-4 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-between select-none',
                                                                    selected 
                                                                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                                        : 'bg-background text-muted-foreground border-border/85 hover:border-primary/40'
                                                                )}
                                                            >
                                                                <span>{getYearDisplay(year)}</span>
                                                                {selected ? (
                                                                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Graduation Years */}
                                        <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                            Graduation Years *
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Filter based on target graduation batch</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px]">
                                                        <button
                                                            type="button"
                                                            onClick={selectAllFilteredGradYears}
                                                            className="text-primary hover:underline font-bold"
                                                        >
                                                            Select All
                                                        </button>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <button
                                                            type="button"
                                                            onClick={clearAllFilteredGradYears}
                                                            className="text-muted-foreground hover:text-foreground hover:underline font-bold"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                                {validationErrors.allowed_graduation_years && <p className="text-xs text-red-500 font-semibold">{validationErrors.allowed_graduation_years}</p>}
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-[160px] overflow-y-auto pr-1">
                                                    {filteredGradYears.map((year) => {
                                                        const selected = (form.allowed_graduation_years || []).includes(year);
                                                        return (
                                                            <button
                                                                key={year}
                                                                type="button"
                                                                onClick={() => toggleGraduationYear(year)}
                                                                className={cn(
                                                                    'py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-between select-none',
                                                                    selected 
                                                                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                                        : 'bg-background text-muted-foreground border-border/85 hover:border-primary/40'
                                                                )}
                                                            >
                                                                <span>{year}</span>
                                                                {selected ? (
                                                                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                ) : (
                                                                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Custom Grad Year Inline Add */}
                                            <div className="flex gap-2 pt-3 border-t border-border/30">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input
                                                        type="text"
                                                        placeholder="Search / Add year..."
                                                        value={gradYearSearch}
                                                        onChange={(e) => setGradYearSearch(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCustomGradYear();
                                                            }
                                                        }}
                                                        className="pl-8 h-9 text-xs bg-background border-input text-foreground rounded-xl"
                                                    />
                                                </div>
                                                {gradYearSearch.trim() && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleAddCustomGradYear()}
                                                        size="sm"
                                                        className="h-9 px-3 text-xs bg-primary text-white rounded-xl font-bold flex items-center gap-1 shrink-0"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Application Deadline */}
                                    <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">Application Schedule</h3>
                                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Determine when registrations close for students</p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">Application Deadline *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={form.application_deadline}
                                                onChange={(e) => updateForm('application_deadline', e.target.value)}
                                                className={cn("h-10 block max-w-xs rounded-xl bg-background border-input text-foreground", validationErrors.application_deadline && "border-red-500")}
                                            />
                                            {validationErrors.application_deadline && <p className="text-xs text-red-500 mt-1 font-semibold">{validationErrors.application_deadline}</p>}

                                            {daysLeft !== null && daysLeft > 0 && (
                                                <div className={cn(
                                                    "mt-3 p-3 rounded-xl border flex items-center gap-2 max-w-xs shadow-sm",
                                                    daysLeft <= 3 
                                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600" 
                                                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                                )}>
                                                    <Clock className="w-4 h-4 shrink-0" />
                                                    <span className="text-xs font-bold">
                                                        {daysLeft <= 3 
                                                            ? `Urgent: Applications close in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}!` 
                                                            : `Applications close in ${daysLeft} days`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: Selection Rounds */}
                        {step === 4 && (
                            <Card className="animate-scale-in">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Selection rounds builder</CardTitle>
                                            <CardDescription>Setup dynamic interview sequences and assessment parameters</CardDescription>
                                        </div>
                                        <Button type="button" onClick={addRound} size="sm" className="font-bold bg-primary text-white hover:bg-primary/90">
                                            <Plus className="w-4 h-4 mr-1.5" /> Add Round
                                        </Button>
                                    </div>
                                    {validationErrors.selection_rounds_items && (
                                        <p className="text-xs text-red-500 mt-2 font-bold bg-red-500/10 p-2 rounded-xl border border-red-500/30 flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4 shrink-0" /> {validationErrors.selection_rounds_items}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {form.selection_rounds.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed rounded-2xl bg-muted/20">
                                            <Clock className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-muted-foreground">No interview rounds defined yet</p>
                                            <Button type="button" onClick={addRound} size="sm" variant="outline" className="mt-3">
                                                Add First Round
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {form.selection_rounds.map((round, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="border rounded-2xl p-4 bg-card/65 relative flex flex-col gap-4 animate-scale-in shadow-sm border-border/60"
                                                >
                                                    <div className="flex justify-between items-center pb-2 border-b border-border/80">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-primary/10 text-primary text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                                                {round.round_number}
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">Interview Round Parameters</span>
                                                        </div>

                                                        {/* Round Actions */}
                                                        <div className="flex items-center gap-1">
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => moveRound(idx, 'up')}
                                                                disabled={idx === 0}
                                                                className="h-8 w-8"
                                                            >
                                                                <ChevronUp className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => moveRound(idx, 'down')}
                                                                disabled={idx === form.selection_rounds.length - 1}
                                                                className="h-8 w-8"
                                                            >
                                                                <ChevronDown className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => removeRound(idx)}
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="sm:col-span-2">
                                                            <Label className="text-xs">Round Name *</Label>
                                                            <Input
                                                                required
                                                                value={round.name}
                                                                onChange={(e) => updateRound(idx, 'name', e.target.value)}
                                                                placeholder="e.g. Coding & Aptitude Test"
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">Round Type *</Label>
                                                            <select
                                                                value={round.type}
                                                                onChange={(e) => updateRound(idx, 'type', e.target.value)}
                                                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {ROUND_TYPES.map(t => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label className="text-xs">Duration (minutes) *</Label>
                                                            <Input
                                                                type="number"
                                                                required
                                                                value={round.duration}
                                                                onChange={(e) => updateRound(idx, 'duration', parseInt(e.target.value) || 0)}
                                                                placeholder="e.g. 60"
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <Label className="text-xs">Instructions / Description</Label>
                                                            <Input
                                                                value={round.description}
                                                                onChange={(e) => updateRound(idx, 'description', e.target.value)}
                                                                placeholder="Rounds constraints, syllabus, platform to be used..."
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 5: Skills & Tech */}
                        {step === 5 && (
                            <Card className="animate-scale-in">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Skills & Technologies</CardTitle>
                                    <CardDescription>Specify standard skills, tooling, frameworks, or database languages required</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <TagInput
                                        tags={form.required_skills}
                                        setTags={(t) => updateForm('required_skills', t)}
                                        placeholder="Add skill (e.g. Problem Solving, Communication)"
                                        label="Required Skills *"
                                        error={validationErrors.required_skills}
                                    />

                                    <TagInput
                                        tags={form.tech_stack}
                                        setTags={(t) => updateForm('tech_stack', t)}
                                        placeholder="Add technology (e.g. React, Docker, Postgres)"
                                        label="Tech Stack *"
                                        error={validationErrors.tech_stack}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 6: External Documents & Application Resources */}
                        {step === 6 && (
                            <DocumentsErrorBoundary
                                onRetry={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        documents: []
                                    }));
                                }}
                            >
                                <Card className="animate-scale-in">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" /> Documents & Reference Materials
                                        </CardTitle>
                                        <CardDescription>
                                            Upload job descriptions, reference materials, brochures or guides for students.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">

                                        {/* Company Documents & Resources */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-semibold">Company Documents & Resources (Optional)</Label>
                                                <span className="text-[10px] text-muted-foreground">Allowed: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG (max 20MB)</span>
                                            </div>

                                            {(!form.documents || form.documents.length === 0) ? (
                                                <div
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                                        handleFileUpload(e.dataTransfer.files);
                                                    }}
                                                    onClick={() => document.getElementById('jobDocFileInput')?.click()}
                                                    className="border-2 border-dashed border-border/70 hover:border-primary/50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-card/20 flex flex-col items-center justify-center gap-3 animate-scale-in"
                                                >
                                                    <input
                                                        id="jobDocFileInput"
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => handleFileUpload(e.target.files)}
                                                        className="hidden"
                                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                                                    />
                                                    <FileText className="w-10 h-10 text-muted-foreground/60" />
                                                    <div className="text-sm font-semibold text-foreground">
                                                        📄 No documents uploaded yet
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Drag & Drop files here or <span className="text-primary hover:underline font-bold">Browse Files</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                                        }}
                                                        onDragLeave={(e) => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                                            handleFileUpload(e.dataTransfer.files);
                                                        }}
                                                        onClick={() => document.getElementById('jobDocFileInput')?.click()}
                                                        className="border border-dashed border-border/70 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 bg-card/10 flex items-center justify-center gap-2"
                                                    >
                                                        <input
                                                            id="jobDocFileInput"
                                                            type="file"
                                                            multiple
                                                            onChange={(e) => handleFileUpload(e.target.files)}
                                                            className="hidden"
                                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                                                        />
                                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Drag & Drop more files or <span className="text-primary hover:underline font-bold">Browse Files</span>
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {(form.documents || []).map((doc, idx) => {
                                                            const formattedSize = doc.file_size
                                                                ? (doc.file_size / (1024 * 1024)).toFixed(2) + " MB"
                                                                : "Unknown size";
                                                            return (
                                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-card shadow-sm gap-3 animate-scale-in">
                                                                    <div className="flex items-center gap-3">
                                                                        <FileText className="w-8 h-8 text-primary shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-bold truncate text-foreground pr-4" title={doc.file_name}>
                                                                                {doc.file_name}
                                                                            </p>
                                                                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                                                                {formattedSize}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-end">
                                                                        <div className="flex items-center gap-2 bg-muted/40 py-1 px-2.5 rounded-lg border border-border/40">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`req-check-${idx}`}
                                                                                checked={doc.is_required}
                                                                                onChange={() => toggleRequired(idx)}
                                                                                className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                                                                            />
                                                                            <label htmlFor={`req-check-${idx}`} className="text-[10px] font-bold text-foreground cursor-pointer select-none">
                                                                                Must Read Before Applying
                                                                            </label>
                                                                        </div>

                                                                        {doc.uploading && (
                                                                            <div className="flex items-center gap-2">
                                                                                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                                                                <span className="text-[10px] font-bold text-primary">{doc.progress}%</span>
                                                                            </div>
                                                                        )}
                                                                        {doc.error && (
                                                                            <span className="text-[10px] font-bold text-red-500">{doc.error}</span>
                                                                        )}

                                                                        <div className="flex items-center gap-1.5">
                                                                            {doc.file_url && (
                                                                                <a
                                                                                    href={doc.file_url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                                    title="Preview / Open Document"
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                </a>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const input = document.createElement('input');
                                                                                    input.type = 'file';
                                                                                    input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg';
                                                                                    input.onchange = (e) => {
                                                                                        const files = (e.target as HTMLInputElement).files;
                                                                                        if (files && files[0]) replaceFile(idx, files[0]);
                                                                                    };
                                                                                    input.click();
                                                                                }}
                                                                                className="text-[10px] text-primary hover:underline font-bold"
                                                                            >
                                                                                Replace
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteFile(idx)}
                                                                                className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                                                                title="Delete Document"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </DocumentsErrorBoundary>
                        )}

                        {/* Step 7: Review & Publish */}
                        {step === 7 && (
                            <Card className="animate-scale-in border border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Review & Publish</CardTitle>
                                    <CardDescription>Validate parameters and confirm publication verification details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Summary Validation Check */}
                                    {Object.keys(validationErrors).length > 0 ? (
                                        <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-2xl space-y-3">
                                            <p className="text-sm font-bold text-red-500 flex items-center gap-1.5">
                                                <AlertCircle className="w-5 h-5 shrink-0" /> Form Validation Check Incomplete:
                                            </p>
                                            <ul className="list-disc pl-5 text-xs text-red-500/90 font-semibold space-y-1">
                                                {Object.entries(validationErrors).map(([key, msg]) => (
                                                    <li key={key}>{msg}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-2xl flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-600">All Fields Valid!</p>
                                                <p className="text-xs text-emerald-600/90 font-semibold mt-1">
                                                    You have successfully completed all form details. Please preview the job layout and sign verification details.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action confirmation checkbox */}
                                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card/50">
                                        <input
                                            type="checkbox"
                                            id="confirmPublish"
                                            checked={publishVerified}
                                            onChange={(e) => setPublishVerified(e.target.checked)}
                                            className="h-4.5 w-4.5 rounded accent-primary cursor-pointer"
                                        />
                                        <label htmlFor="confirmPublish" className="text-xs font-bold text-foreground cursor-pointer select-none">
                                            I verify all listing details and eligibility parameters are correct.
                                        </label>
                                    </div>

                                    {/* Documents & Resources Review */}
                                    {form.documents.length > 0 && (
                                        <div className="p-4 border rounded-xl bg-card space-y-3.5 shadow-sm">
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                <FileText className="w-4 h-4 text-primary" /> Attached Documents & Reference Materials
                                            </h4>
                                            <div className="space-y-2 pt-2 border-t border-border/40">
                                                <p className="text-xs text-muted-foreground font-semibold">Attached Resources ({form.documents.length})</p>
                                                <div className="space-y-1.5 mt-1.5">
                                                    {form.documents.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                            <span className="text-foreground font-medium truncate">{doc.file_name}</span>
                                                            {doc.is_required && (
                                                                <Badge variant="destructive" className="py-0.5 px-1.5 text-[8px] font-extrabold uppercase shrink-0">
                                                                    Must Read
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Eligible Students Preview */}
                                    <div className="p-4 border rounded-xl bg-card space-y-3 shadow-sm">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                            <GraduationCap className="w-4 h-4 text-primary" /> Eligible Students Preview
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground leading-normal">
                                            This matches all registered student profiles in the database against this job's eligibility criteria (CGPA, backlogs, branch, and graduation year).
                                        </p>
                                        {role === 'recruiter' ? (
                                            <div className="p-4 bg-muted/65 rounded-xl border text-center text-xs text-muted-foreground font-semibold leading-relaxed">
                                                🔒 Candidate statistics and matching counts are hidden to protect student privacy across the platform.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                                    <p className="text-2xl font-black text-emerald-600">{eligibilityStats.eligible}</p>
                                                    <p className="text-[10px] uppercase font-bold text-emerald-700/80 mt-1">Eligible</p>
                                                </div>
                                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                                                    <p className="text-2xl font-black text-rose-600">{eligibilityStats.ineligible}</p>
                                                    <p className="text-[10px] uppercase font-bold text-rose-700/80 mt-1">Ineligible</p>
                                                </div>
                                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                                                    <p className="text-2xl font-black text-amber-600">{eligibilityStats.incomplete}</p>
                                                    <p className="text-[10px] uppercase font-bold text-amber-700/80 mt-1">Incomplete</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Sticky Footer Save Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t p-4 flex justify-between items-center gap-4 shadow-xl lg:px-8 max-w-[1400px] mx-auto">
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleCancel} disabled={submitting}>
                            Cancel
                        </Button>
                        {!isEdit && (
                            <Button 
                                variant="outline" 
                                onClick={() => handleSubmit('draft')} 
                                disabled={submitting}
                                className="font-bold flex items-center gap-1.5"
                            >
                                <Save className="w-4 h-4" /> Save Draft
                            </Button>
                        )}
                    </div>

                    {!previewMode && (
                        <div className="flex items-center gap-2">
                            {step > 1 && (
                                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                                </Button>
                            )}

                            {step < 7 ? (
                                <Button 
                                    onClick={() => setStep(step + 1)} 
                                    disabled={submitting}
                                    className="font-bold flex items-center gap-1.5"
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setShowConfirmPublish(true)}
                                    disabled={submitting || !isFormValid || !publishVerified}
                                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white font-bold flex items-center gap-1.5 shadow-md"
                                >
                                    <CheckCircle className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Publish Job'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Cancel Confirm Dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Discard Changes?</DialogTitle>
                            <DialogDescription>
                                You have unsaved draft modifications. Discarding will lose current details permanently.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Editing</Button>
                            <Button variant="destructive" onClick={() => {
                                localStorage.removeItem(AUTOSAVE_KEY);
                                navigate('/jobs');
                            }}>Discard</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Publish Confirm Dialog */}
                <Dialog open={showConfirmPublish} onOpenChange={setShowConfirmPublish}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Confirm Placement Publication</DialogTitle>
                            <DialogDescription>
                                Publishing will immediately notify and show this placement opportunity on the student portal database.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={() => setShowConfirmPublish(false)}>Review</Button>
                            <Button 
                                onClick={() => handleSubmit('active')} 
                                disabled={submitting}
                                className="bg-primary text-white font-bold"
                            >
                                {submitting ? 'Publishing...' : 'Confirm Publish'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

/* Custom Tag Input Subcomponent */
interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder: string;
    label: string;
    error?: string;
}

function TagInput({ tags, setTags, placeholder, label, error }: TagInputProps) {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmed = input.trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
                setInput('');
            }
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-1.5">
            <Label className="flex justify-between">
                <span>{label}</span>
                {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
            </Label>
            <div className={cn(
                "min-h-[44px] flex flex-wrap gap-2 p-2 border rounded-xl bg-background border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                error && "border-red-500"
            )}>
                {tags.map((tag, idx) => (
                    <Badge key={tag} className="text-xs font-semibold pl-2.5 pr-1.5 py-1 gap-1 flex items-center bg-primary/10 text-primary border border-primary/20 rounded-lg">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/20 shrink-0 font-bold"
                        >
                            ×
                        </button>
                    </Badge>
                ))}
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground min-w-[120px]"
                />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">Press Enter or comma to append item</p>
        </div>
    );
}
