import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractAndStoreResumeMetadata } from '@/lib/geminiResume';
import { generateStudentSummary } from '@/utils/studentSummaryGenerator';
import {
    User, Mail, Phone, GraduationCap, Award, FileText, Upload,
    Link, Github, Linkedin, Globe, Plus, X, Save, Pencil, Trash2,
    CheckCircle2, AlertCircle, Info, Calendar, Loader2, ExternalLink,
    Camera, Check, ChevronsUpDown, Search, Image, Briefcase,
    ZoomIn, ZoomOut, Maximize2, Minimize2, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CANONICAL_BRANCHES } from '@/constants/branches';
import { getYearDisplay } from '@/constants/years';
import RecruiterProfile from '@/modules/recruiter/pages/RecruiterProfile';

export default function Profile() {
    const { role, roleData, refreshRole } = useRole();
    const { user } = useUser();
    const formatCGPA = (cgpa: any) => {
        const val = parseFloat(cgpa);
        if (isNaN(val) || val <= 0) return '—';
        const str = val.toString();
        if (!str.includes('.')) {
            return val.toFixed(1);
        }
        return str;
    };

    const getEquivalentPercentage = (cgpa: any) => {
        const val = parseFloat(cgpa);
        if (isNaN(val) || val <= 0) return '—';
        const pct = Math.round(val * 10 * 10) / 10;
        return `${pct}%`;
    };
    const [editing, setEditing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [saving, setSaving] = useState(false);
    const [addingProject, setAddingProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
    const [projectSaving, setProjectSaving] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [certificatesLoading, setCertificatesLoading] = useState(false);
    const [declarationAccepted, setDeclarationAccepted] = useState(false);
    const [declarationModalOpen, setDeclarationModalOpen] = useState(false);

    // Cover Image & Searchable Dropdown States
    const [coverUploading, setCoverUploading] = useState(false);
    const [previewState, setPreviewState] = useState<{
        isOpen: boolean;
        url: string;
        title: string;
        type: 'pdf' | 'image' | 'unknown';
    }>({ isOpen: false, url: '', title: '', type: 'unknown' });
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

    // Work Experience State
    const [addingExperience, setAddingExperience] = useState(false);
    const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
    const [experienceSaving, setExperienceSaving] = useState(false);
    const [newExperience, setNewExperience] = useState({
        id: '',
        company_name: '',
        role: '',
        employment_type: 'Intern',
        start_date: '',
        end_date: '',
        currently_working: false,
        location: '',
        description: '',
        technologies_used: '',
        certificate_url: '',
        certificate_key: '',
        certificate_title: '',
        certificate_issuer: ''
    });
    const [expCertUploading, setExpCertUploading] = useState(false);

    // Education Edit Modal State
    const [editEducationOpen, setEditEducationOpen] = useState(false);
    const [editEducationLevel, setEditEducationLevel] = useState<'college' | 'class12' | 'class10'>('college');
    const [editEduForm, setEditEduForm] = useState<any>(null);

    // Tabbed Layout State
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'about';
    const setActiveTab = (tab: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            setEditing(true);
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('edit');
                return next;
            }, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const calculateProfileCompletion = () => {
        const sections = [
            {
                name: 'Overview',
                id: 'about',
                isCompleted: !!(profile?.name && profile?.phone && profile?.bio && profile?.branch && profile?.current_year && profile?.graduation_year && profile?.cgpa),
            },
            {
                name: 'Education',
                id: 'education',
                isCompleted: !!(profile?.education?.class10?.school_name && profile?.education?.class12?.school_name && profile?.education?.college?.college_name),
            },
            {
                name: 'Skills',
                id: 'skills',
                isCompleted: skills.length > 0,
            },
            {
                name: 'Projects',
                id: 'projects',
                isCompleted: projects.length > 0,
            },
            {
                name: 'Work Experience',
                id: 'experience',
                isCompleted: Array.isArray(profile?.experience) && profile.experience.length > 0,
            },
            {
                name: 'Certificates',
                id: 'certificates',
                isCompleted: certificates.length > 0,
            },
            {
                name: 'Resume',
                id: 'resume',
                isCompleted: !!profile?.resume_url,
            }
        ];

        const completedCount = sections.filter(s => s.isCompleted).length;
        const totalCount = sections.length;
        const percentage = Math.round((completedCount / totalCount) * 100);

        // Find next recommended section (first incomplete one)
        const nextRecommended = sections.find(s => !s.isCompleted);

        return {
            percentage,
            completedCount,
            totalCount,
            nextRecommended,
            sections
        };
    };

    const getTabCompletionState = (tabId: string) => {
        if (tabId === 'about') {
            const fields = [profile?.name, profile?.phone, profile?.bio, profile?.branch, profile?.current_year, profile?.graduation_year, profile?.cgpa];
            const present = fields.filter(Boolean).length;
            if (present === fields.length) return 'completed';
            if (present > 0) return 'partially';
            return 'not_started';
        }
        if (tabId === 'education') {
            const has10 = !!profile?.education?.class10?.school_name;
            const has12 = !!profile?.education?.class12?.school_name;
            const hasColl = !!profile?.education?.college?.college_name;
            const count = [has10, has12, hasColl].filter(Boolean).length;
            if (count === 3) return 'completed';
            if (count > 0) return 'partially';
            return 'not_started';
        }
        if (tabId === 'skills') {
            return skills.length > 0 ? 'completed' : 'not_started';
        }
        if (tabId === 'projects') {
            return projects.length > 0 ? 'completed' : 'not_started';
        }
        if (tabId === 'experience') {
            const hasExp = Array.isArray(profile?.experience) && profile.experience.length > 0;
            return hasExp ? 'completed' : 'not_started';
        }
        if (tabId === 'certificates') {
            return certificates.length > 0 ? 'completed' : 'not_started';
        }
        if (tabId === 'resume') {
            return profile?.resume_url ? 'completed' : 'not_started';
        }
        return 'not_started';
    };



    async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setCoverUploading(true);
        console.log("[Profile] Cover photo upload started. File name:", file.name, "student_id:", roleData.id);
        try {
            const { data, error } = await insforge.storage.from('profile-images').upload(`${roleData.id}/cover_${Date.now()}_${file.name}`, file);
            console.log("[Profile] Cover storage upload response:", { data, error });
            if (error) {
                console.error("[Profile] Cover storage upload failed:", error);
                showToast(`Cover upload failed: ${error.message}`, "error");
                return;
            }
            if (data) {
                const dbRes = await insforge.database.from('students').update({
                    cover_photo_url: data.url,
                    cover_photo_key: data.key,
                }).eq('id', roleData.id);
                console.log("[Profile] Cover database update response:", dbRes);
                if (dbRes.error) {
                    console.error("[Profile] Cover db update failed:", dbRes.error);
                    showToast(`Failed to update cover reference: ${dbRes.error.message}`, "error");
                } else {
                    showToast("Cover photo updated!", "success");
                    refreshRole();
                }
            }
        } catch (err: any) {
            console.error("[Profile] Cover upload exception:", err);
            showToast("Unexpected error updating cover photo", "error");
        } finally {
            setCoverUploading(false);
        }
    }

    async function removeCoverPhoto() {
        if (!roleData?.id) return;
        try {
            const dbRes = await insforge.database.from('students').update({
                cover_photo_url: null,
                cover_photo_key: null,
            }).eq('id', roleData.id);
            if (dbRes.error) {
                console.error("[Profile] Cover deletion failed:", dbRes.error);
                showToast(`Failed to remove cover: ${dbRes.error.message}`, "error");
            } else {
                showToast("Cover photo removed", "success");
                refreshRole();
            }
        } catch (err: any) {
            console.error("[Profile] Cover delete exception:", err);
            showToast("Unexpected error removing cover photo", "error");
        }
    }

    async function removeProfilePhoto() {
        if (!roleData?.id) return;
        try {
            const table = 
                role === 'admin' ? 'admins' : 
                role === 'organization_admin' ? 'organization_admins' : 
                role === 'recruiter' ? 'recruiters' : 
                'students';
            const dbRes = await insforge.database.from(table).update({
                profile_photo_url: null,
                profile_photo_key: null,
            }).eq('id', roleData.id);
            if (dbRes.error) {
                console.error("[Profile] Photo removal failed:", dbRes.error);
                showToast(`Failed to remove photo: ${dbRes.error.message}`, "error");
            } else {
                showToast("Profile photo removed", "success");
                refreshRole();
            }
        } catch (err: any) {
            console.error("[Profile] Photo removal exception:", err);
            showToast("Unexpected error removing profile photo", "error");
        }
    }

    // Toast notifications state
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

    // Certificates state
    const [addingCertificate, setAddingCertificate] = useState(false);
    const [certificateSaving, setCertificateSaving] = useState(false);
    const [newCertificate, setNewCertificate] = useState({
        name: '',
        issuer: '',
        issue_date: '',
        credential_url: '',
    });
    const [certificateFileUploading, setCertificateFileUploading] = useState(false);
    const [uploadedCertFileName, setUploadedCertFileName] = useState('');

    useEffect(() => {
        if (roleData) {
            setProfile({ ...roleData });
            fetchExtras();
        }
    }, [roleData]);

    useEffect(() => {
        setDeclarationAccepted(false);
    }, [editing]);

    async function fetchExtras() {
        if (!roleData?.id || role !== 'student') return;
        
        console.log("[Profile] fetchExtras started. roleData.id:", roleData.id, "auth user.id:", user?.id);
        setProjectsLoading(true);
        setCertificatesLoading(true);

        try {
            const [skillsRes, projRes, certRes] = await Promise.all([
                insforge.database.from('student_skills').select('*').eq('student_id', roleData.id),
                insforge.database.from('student_projects').select('*').eq('student_id', roleData.id),
                insforge.database.from('student_certificates').select('*').eq('student_id', roleData.id),
            ]);

            console.log("[Profile] fetchExtras raw responses:", {
                skills: skillsRes,
                projects: projRes,
                certificates: certRes
            });

            if (skillsRes.error) {
                console.error("[Profile] Error fetching skills:", skillsRes.error);
                showToast("Failed to load skills", "error");
            }
            if (projRes.error) {
                console.error("[Profile] Error fetching projects:", projRes.error);
                showToast("Failed to load projects", "error");
            }
            if (certRes.error) {
                console.error("[Profile] Error fetching certificates:", certRes.error);
                showToast("Failed to load certificates", "error");
            }

            setSkills(skillsRes.data || []);
            setProjects(projRes.data || []);
            setCertificates(certRes.data || []);
        } catch (err: any) {
            console.error("[Profile] Exception inside fetchExtras:", err);
            showToast("Unexpected error loading user records", "error");
        } finally {
            setProjectsLoading(false);
            setCertificatesLoading(false);
        }
    }

    const handleSaveClick = () => {
        if (role === 'student') {
            setDeclarationAccepted(false);
            setDeclarationModalOpen(true);
        } else {
            saveProfile();
        }
    };

    async function saveProfile() {
        if (!profile || !roleData?.id) return;
        if (role === 'student' && !declarationAccepted) {
            showToast("Please accept the Profile Declaration before saving your profile.", "error");
            return;
        }
        setSaving(true);
        try {
            if (role === 'student') {
                const { error } = await insforge.database.from('students').update({
                    name: profile.name,
                    phone: profile.phone,
                    bio: profile.bio,
                    cgpa: profile.cgpa ? parseFloat(profile.cgpa) : 0,
                    graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
                    current_year: profile.current_year ? parseInt(profile.current_year) : null,
                    placement_status: profile.placement_status,
                    linkedin_url: profile.linkedin_url,
                    github_url: profile.github_url,
                    portfolio_url: profile.portfolio_url,
                    branch: profile.branch,
                    backlogs: profile.backlogs ? parseInt(profile.backlogs) : 0,
                    education: profile.education || null,
                    experience: profile.experience || null
                }).eq('id', roleData.id);

                if (error) {
                    console.error("[Profile] Failed to update student profile:", error);
                    showToast(`Failed to save profile: ${error.message}`, "error");
                } else {
                    showToast("Profile updated successfully!", "success");
                    setEditing(false);
                    refreshRole();
                    generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
                }
            } else if (role === 'organization_admin') {
                const { error } = await insforge.database.from('organization_admins').update({
                    name: profile.name
                }).eq('id', roleData.id);

                if (error) {
                    console.error("[Profile] Failed to update org admin profile:", error);
                    showToast(`Failed to save profile: ${error.message}`, "error");
                } else {
                    showToast("Profile updated successfully!", "success");
                    setEditing(false);
                    refreshRole();
                }
            } else if (role === 'admin') {
                const { error } = await insforge.database.from('admins').update({
                    name: profile.name,
                    employee_id: profile.employee_id,
                    designation: profile.designation,
                    department: profile.department,
                    college_name: profile.college_name,
                    campus_name: profile.campus_name,
                    placement_cell_name: profile.placement_cell_name,
                    office_contact: profile.office_contact,
                }).eq('id', roleData.id);

                if (error) {
                    console.error("[Profile] Failed to update admin profile:", error);
                    showToast(`Failed to save profile: ${error.message}`, "error");
                } else {
                    showToast("Profile updated successfully!", "success");
                    setEditing(false);
                    refreshRole();
                }
            }
        } catch (err: any) {
            console.error("[Profile] Exception in saveProfile:", err);
            showToast("Unexpected error occurred while updating profile", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setSaving(true);
        console.log("[Profile] handleResumeUpload started. File name:", file.name, "student_id:", roleData.id);
        try {
            const { data, error } = await insforge.storage.from('resumes').upload(`${roleData.id}/${file.name}`, file);
            console.log("[Profile] Resume storage upload response:", { data, error });
            if (error) {
                console.error("[Profile] Resume storage upload failed:", error);
                showToast(`Resume file upload failed: ${error.message}`, "error");
                return;
            }
            if (data) {
                const dbRes = await insforge.database.from('students').update({
                    resume_url: data.url,
                    resume_key: data.key,
                }).eq('id', roleData.id);
                console.log("[Profile] Resume database update response:", dbRes);
                if (dbRes.error) {
                    console.error("[Profile] Resume db update failed:", dbRes.error);
                    showToast(`Failed to update resume reference: ${dbRes.error.message}`, "error");
                } else {
                    showToast("Resume uploaded and referenced successfully!", "success");
                    // Also trigger AI extraction so fields like 10th_percentage are ready to go
                    try {
                        console.log("[Profile] Triggering resume metadata analysis...");
                        await extractAndStoreResumeMetadata(roleData.id, data.url);
                        console.log("[Profile] Resume metadata analysis completed.");
                    } catch (aiErr) {
                        console.error("[Profile] Resume AI analysis failed:", aiErr);
                        showToast("Resume uploaded, but AI metadata extraction failed", "info");
                    }
                    refreshRole();
                    generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
                }
            }
        } catch(err: any) {
            console.error('Resume upload failed with exception', err);
            showToast("Unexpected error during resume upload", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setAvatarMenuOpen(false);
        console.log("[Profile] Photo upload started. File name:", file.name);
        try {
            const { data, error } = await insforge.storage.from('profile-images').upload(`${roleData.id}/${file.name}`, file);
            console.log("[Profile] Photo storage upload response:", { data, error });
            if (error) {
                console.error("[Profile] Photo storage upload failed:", error);
                showToast(`Photo upload failed: ${error.message}`, "error");
                return;
            }
            if (data) {
                const table = 
                    role === 'admin' ? 'admins' : 
                    role === 'organization_admin' ? 'organization_admins' : 
                    role === 'recruiter' ? 'recruiters' : 
                    'students';
                const dbRes = await insforge.database.from(table).update({
                    profile_photo_url: data.url,
                    profile_photo_key: data.key,
                }).eq('id', roleData.id);
                console.log("[Profile] Photo database update response:", dbRes);
                if (dbRes.error) {
                    console.error("[Profile] Photo db update failed:", dbRes.error);
                    showToast(`Failed to update photo reference: ${dbRes.error.message}`, "error");
                } else {
                    showToast("Profile photo updated!", "success");
                    refreshRole();
                }
            }
        } catch (err: any) {
            console.error("[Profile] Photo upload exception:", err);
            showToast("Unexpected error updating profile photo", "error");
        }
    }

    async function addSkill() {
        if (!newSkill.trim() || !roleData?.id) return;
        try {
            const { data, error } = await insforge.database.from('student_skills').insert([{ student_id: roleData.id, skill: newSkill.trim() }]).select();
            if (error) {
                console.error("[Profile] Failed to add skill:", error);
                showToast(`Failed to add skill: ${error.message}`, "error");
            } else if (data) {
                showToast("Skill added successfully!", "success");
                setSkills(prev => [...prev, ...data]);
                setNewSkill('');
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] addSkill exception:", err);
            showToast("Unexpected error adding skill", "error");
        }
    }

    async function addProject() {
        if (!newProject.title.trim() || !roleData?.id) {
            console.warn("[Profile] Cannot add project: missing title or student ID", { title: newProject.title, id: roleData?.id });
            return;
        }
        setProjectSaving(true);
        const techArray = newProject.tech_stack
            ? newProject.tech_stack.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        console.log("[Profile] addProject payload:", {
            student_id: roleData.id,
            title: newProject.title.trim(),
            description: newProject.description.trim(),
            technologies: techArray,
            project_url: newProject.live_url.trim() || null,
            github_url: newProject.github_url.trim() || null
        });

        try {
            const { data, error } = await insforge.database.from('student_projects').insert([{
                student_id: roleData.id,
                title: newProject.title.trim(),
                description: newProject.description.trim(),
                technologies: techArray,
                project_url: newProject.live_url.trim() || null,
                github_url: newProject.github_url.trim() || null,
            }]).select();

            console.log("[Profile] Project Insert Response:", { data, error });

            if (error) {
                console.error("[Profile] Project insert failed:", error);
                showToast(`Failed to save project: ${error.message}`, "error");
            } else if (data && data.length > 0) {
                showToast("Project saved successfully!", "success");
                setProjects(prev => [...prev, ...data]);
                setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
                setAddingProject(false);
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            } else {
                showToast("Project saved successfully", "success");
                fetchExtras();
                setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
                setAddingProject(false);
            }
        } catch (err: any) {
            console.error("[Profile] addProject exception:", err);
            showToast("Unexpected error occurred while saving the project", "error");
        } finally {
            setProjectSaving(false);
        }
    }

    async function removeSkill(id: string) {
        try {
            const { error } = await insforge.database.from('student_skills').delete().eq('id', id);
            if (error) {
                console.error("[Profile] Skill delete failed:", error);
                showToast(`Failed to delete skill: ${error.message}`, "error");
            } else {
                showToast("Skill removed", "success");
                setSkills(prev => prev.filter(s => s.id !== id));
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] removeSkill exception:", err);
            showToast("Unexpected error deleting skill", "error");
        }
    }

    // Certificates Tab handlers
    async function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setCertificateFileUploading(true);
        console.log("[Profile] Certificate file upload started. File name:", file.name, "student_id:", roleData.id);
        try {
            const { data, error } = await insforge.storage.from('certificates').upload(`${roleData.id}/${Date.now()}_${file.name}`, file);
            console.log("[Profile] Certificate file storage upload response:", { data, error });
            if (error) {
                console.error("[Profile] Certificate file storage upload failed:", error);
                showToast(`Certificate file upload failed: ${error.message}`, "error");
                return;
            }
            if (data) {
                showToast("Certificate file uploaded successfully!", "success");
                setNewCertificate(prev => ({ ...prev, credential_url: data.url }));
                setUploadedCertFileName(file.name);
            }
        } catch(err: any) {
            console.error('Certificate file upload failed with exception', err);
            showToast("Unexpected error during certificate upload", "error");
        } finally {
            setCertificateFileUploading(false);
        }
    }

    async function addCertificate() {
        if (!newCertificate.name.trim() || !newCertificate.issuer.trim() || !roleData?.id) {
            console.warn("[Profile] Cannot add certificate: missing required fields", { name: newCertificate.name, issuer: newCertificate.issuer, id: roleData?.id });
            return;
        }
        setCertificateSaving(true);
        console.log("[Profile] addCertificate payload:", {
            student_id: roleData.id,
            name: newCertificate.name.trim(),
            issuer: newCertificate.issuer.trim(),
            issue_date: newCertificate.issue_date || null,
            credential_url: newCertificate.credential_url.trim() || null,
        });

        try {
            const { data, error } = await insforge.database.from('student_certificates').insert([{
                student_id: roleData.id,
                name: newCertificate.name.trim(),
                issuer: newCertificate.issuer.trim(),
                issue_date: newCertificate.issue_date || null,
                credential_url: newCertificate.credential_url.trim() || null,
            }]).select();

            console.log("[Profile] Certificate Insert Response:", { data, error });

            if (error) {
                console.error("[Profile] Certificate insert failed:", error);
                showToast(`Failed to save certificate: ${error.message}`, "error");
            } else if (data && data.length > 0) {
                showToast("Certificate saved successfully!", "success");
                setCertificates(prev => [...prev, ...data]);
                setNewCertificate({ name: '', issuer: '', issue_date: '', credential_url: '' });
                setUploadedCertFileName('');
                setAddingCertificate(false);
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            } else {
                showToast("Certificate saved successfully", "success");
                fetchExtras();
                setNewCertificate({ name: '', issuer: '', issue_date: '', credential_url: '' });
                setUploadedCertFileName('');
                setAddingCertificate(false);
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] addCertificate exception:", err);
            showToast("Unexpected error occurred while saving the certificate", "error");
        } finally {
            setCertificateSaving(false);
        }
    }

    async function removeCertificate(id: string) {
        try {
            const { error } = await insforge.database.from('student_certificates').delete().eq('id', id);
            if (error) {
                console.error("[Profile] Certificate delete failed:", error);
                showToast(`Failed to delete certificate: ${error.message}`, "error");
            } else {
                showToast("Certificate deleted successfully", "success");
                setCertificates(prev => prev.filter(c => c.id !== id));
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] removeCertificate exception:", err);
            showToast("Unexpected error deleting certificate", "error");
        }
    }

    if (!profile) return (
        <div className="text-center py-20">
            <p className="text-muted-foreground">Loading profile...</p>
        </div>
    );

    // Recruiter gets their own dedicated company profile — not the student portfolio
    if (role === 'recruiter') {
        return <RecruiterProfile />;
    }

    if (role === 'admin' || role === 'organization_admin') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-3xl font-heading font-bold">{role === 'organization_admin' ? 'Org Admin Profile' : 'Admin Profile'}</h1>
                    {!editing ? (
                        <Button onClick={() => setEditing(true)}><Pencil className="w-4 h-4 mr-2" />Edit Profile</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setEditing(false); setProfile({ ...roleData }); }}>Cancel</Button>
                            <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Basic Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="relative group shrink-0">
                                <Avatar className="w-32 h-32">
                                    <AvatarImage src={profile.profile_photo_url} />
                                    <AvatarFallback className="text-4xl font-heading">{profile.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="w-6 h-6 text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Full Name</Label>
                                    {editing ? <Input value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} /> : <p className="mt-1 font-semibold">{profile.name || '—'}</p>}
                                </div>
                                <div>
                                    <Label>Official Email</Label>
                                    {editing ? <Input type="email" value={profile.email || ''} onChange={e => setProfile({ ...profile, email: e.target.value })} disabled /> : <p className="mt-1 text-muted-foreground">{profile.email || '—'}</p>}
                                </div>
                                {role !== 'organization_admin' && (
                                    <>
                                        <div>
                                            <Label>Employee ID / Staff ID</Label>
                                            {editing ? <Input value={profile.employee_id || ''} onChange={e => setProfile({ ...profile, employee_id: e.target.value })} placeholder="e.g. EMP-1024" /> : <p className="mt-1">{profile.employee_id || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label>Designation</Label>
                                            {editing ? <Input value={profile.designation || ''} onChange={e => setProfile({ ...profile, designation: e.target.value })} placeholder="e.g. Training & Placement Officer" /> : <p className="mt-1">{profile.designation || '—'}</p>}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label>Department</Label>
                                            {editing ? <Input value={profile.department || ''} onChange={e => setProfile({ ...profile, department: e.target.value })} placeholder="e.g. Computer Science" /> : <p className="mt-1">{profile.department || '—'}</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Organization Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {role === 'organization_admin' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Organization Name</Label>
                                    <p className="mt-1 font-semibold">{roleData?.organizations?.name || '—'}</p>
                                </div>
                                <div>
                                    <Label>Organization Code</Label>
                                    <p className="mt-1">{roleData?.organizations?.code || '—'}</p>
                                </div>
                                <div>
                                    <Label>Website</Label>
                                    <p className="mt-1 text-primary hover:underline">
                                        {roleData?.organizations?.website ? (
                                            <a href={roleData.organizations.website} target="_blank" rel="noopener noreferrer">{roleData.organizations.website}</a>
                                        ) : '—'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Address</Label>
                                    <p className="mt-1 text-muted-foreground">{roleData?.organizations?.address || '—'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>College Name</Label>
                                    {editing ? <Input value={profile.college_name || ''} onChange={e => setProfile({ ...profile, college_name: e.target.value })} /> : <p className="mt-1">{profile.college_name || '—'}</p>}
                                </div>
                                <div>
                                    <Label>Campus Name</Label>
                                    {editing ? <Input value={profile.campus_name || ''} onChange={e => setProfile({ ...profile, campus_name: e.target.value })} /> : <p className="mt-1">{profile.campus_name || '—'}</p>}
                                </div>
                                <div>
                                    <Label>Placement Cell Name</Label>
                                    {editing ? <Input value={profile.placement_cell_name || ''} onChange={e => setProfile({ ...profile, placement_cell_name: e.target.value })} placeholder="e.g. Training & Placement Cell" /> : <p className="mt-1">{profile.placement_cell_name || '—'}</p>}
                                </div>
                                <div>
                                    <Label>Office Contact Number</Label>
                                    {editing ? <Input value={profile.office_contact || ''} onChange={e => setProfile({ ...profile, office_contact: e.target.value })} /> : <p className="mt-1">{profile.office_contact || '—'}</p>}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Toasts overlay list container for Admin */}
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 ${
                                t.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                    : t.type === 'error'
                                    ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                                    : 'bg-slate-50 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/30 text-slate-800 dark:text-slate-200'
                            }`}
                        >
                            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                            {t.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                            <span className="text-xs font-semibold">{t.message}</span>
                            <button
                                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                                className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 pointer-events-auto"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const categorizeSkills = (skillsList: any[]) => {
        const categories: Record<string, any[]> = {
            'Languages': [],
            'Frontend & Design': [],
            'Backend & Databases': [],
            'Cloud & DevOps': [],
            'Other Skills': []
        };
        
        const languageKeywords = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css'];
        const frontendKeywords = ['react', 'next', 'angular', 'vue', 'tailwind', 'redux', 'svelte', 'figma', 'sass', 'bootstrap', 'design', 'ui', 'ux'];
        const backendKeywords = ['node', 'express', 'django', 'flask', 'spring', 'postgres', 'mongo', 'mysql', 'firebase', 'redis', 'graphql', 'nest'];
        const devopsKeywords = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'linux', 'ci/cd', 'jenkins'];

        skillsList.forEach(s => {
            const name = s.skill.toLowerCase();
            if (languageKeywords.some(kw => name.includes(kw))) {
                categories['Languages'].push(s);
            } else if (frontendKeywords.some(kw => name.includes(kw))) {
                categories['Frontend & Design'].push(s);
            } else if (backendKeywords.some(kw => name.includes(kw))) {
                categories['Backend & Databases'].push(s);
            } else if (devopsKeywords.some(kw => name.includes(kw))) {
                categories['Cloud & DevOps'].push(s);
            } else {
                categories['Other Skills'].push(s);
            }
        });

        return Object.fromEntries(Object.entries(categories).filter(([_, list]) => list.length > 0));
    };

    const defaultEducation = {
        class10: { school_name: '', board: 'CBSE', passing_year: '', score: '', location: '' },
        class12: { school_name: '', board: 'CBSE', stream: 'Science', passing_year: '', score: '', location: '' },
        college: { college_name: '', university_name: '', degree: 'B.Tech', branch: '', current_year: '', graduation_year: '', cgpa: '', backlogs: '0', location: '' }
    };

    const getEducationData = () => {
        if (!profile?.education) return defaultEducation;
        return {
            class10: { ...defaultEducation.class10, ...(profile.education.class10 || {}) },
            class12: { ...defaultEducation.class12, ...(profile.education.class12 || {}) },
            college: { ...defaultEducation.college, ...(profile.education.college || {}) }
        };
    };

    async function saveEducation(level: 'college' | 'class12' | 'class10', data: any) {
        if (!roleData?.id) return;
        try {
            const currentEdu = getEducationData();
            const updatedEdu = {
                ...currentEdu,
                [level]: data
            };

            const updatePayload: any = {
                education: updatedEdu
            };

            // If college is being updated, sync to root columns
            if (level === 'college') {
                updatePayload.branch = data.branch || '';
                updatePayload.current_year = data.current_year ? parseInt(data.current_year) : null;
                updatePayload.graduation_year = data.graduation_year ? parseInt(data.graduation_year) : null;
                updatePayload.cgpa = data.cgpa ? parseFloat(data.cgpa) : 0;
                updatePayload.backlogs = data.backlogs ? parseInt(data.backlogs) : 0;
            }

            const { error } = await insforge.database.from('students')
                .update(updatePayload)
                .eq('id', roleData.id);

            if (error) {
                console.error("[Profile] Save education error:", error);
                showToast(`Failed to save education: ${error.message}`, "error");
            } else {
                showToast("Education details saved successfully!", "success");
                // Update local state
                setProfile((prev: any) => ({
                    ...prev,
                    education: updatedEdu,
                    ...(level === 'college' ? {
                        branch: data.branch || '',
                        current_year: data.current_year ? parseInt(data.current_year) : null,
                        graduation_year: data.graduation_year ? parseInt(data.graduation_year) : null,
                        cgpa: data.cgpa ? parseFloat(data.cgpa) : 0,
                        backlogs: data.backlogs ? parseInt(data.backlogs) : 0,
                    } : {})
                }));
                refreshRole();
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] Save education exception:", err);
            showToast("An error occurred while saving education.", "error");
        }
    }

    const openEditEducation = (level?: 'college' | 'class12' | 'class10' | null) => {
        const activeLevel = level || 'college';
        setEditEducationLevel(activeLevel);
        const currentEdu = getEducationData();
        setEditEduForm(currentEdu[activeLevel] || {});
        setEditEducationOpen(true);
    };


    async function saveExperience() {
        if (!newExperience.company_name.trim() || !newExperience.role.trim() || !roleData?.id) return;
        setExperienceSaving(true);
        try {
            const currentExp = [...(profile.experience || [])];
            if (editingExperienceId) {
                const idx = currentExp.findIndex(e => e.id === editingExperienceId);
                if (idx !== -1) {
                    currentExp[idx] = { ...newExperience, id: editingExperienceId };
                }
            } else {
                currentExp.push({ 
                    ...newExperience, 
                    id: Math.random().toString(36).substring(2, 9) 
                });
            }

            const { error } = await insforge.database.from('students').update({
                experience: currentExp
            }).eq('id', roleData.id);

            if (error) {
                console.error("[Profile] Save experience error:", error);
                showToast(`Failed to save experience: ${error.message}`, "error");
            } else {
                showToast("Work experience updated!", "success");
                setProfile({ ...profile, experience: currentExp });
                setAddingExperience(false);
                setEditingExperienceId(null);
                setNewExperience({
                    id: '',
                    company_name: '',
                    role: '',
                    employment_type: 'Intern',
                    start_date: '',
                    end_date: '',
                    currently_working: false,
                    location: '',
                    description: '',
                    technologies_used: '',
                    certificate_url: '',
                    certificate_key: '',
                    certificate_title: '',
                    certificate_issuer: ''
                });
                refreshRole();
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] saveExperience exception:", err);
            showToast("Unexpected error occurred while updating experience", "error");
        } finally {
            setExperienceSaving(false);
        }
    }

    async function handleExperienceCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setExpCertUploading(true);
        console.log("[Profile] Experience certificate upload started. File name:", file.name, "student_id:", roleData.id);
        try {
            const { data, error } = await insforge.storage.from('certificates').upload(`${roleData.id}/experience_${Date.now()}_${file.name}`, file);
            console.log("[Profile] Experience certificate storage upload response:", { data, error });
            if (error) {
                console.error("[Profile] Experience certificate storage upload failed:", error);
                showToast(`Certificate upload failed: ${error.message}`, "error");
                return;
            }
            if (data) {
                showToast("Certificate file uploaded successfully!", "success");
                setNewExperience(prev => ({ 
                    ...prev, 
                    certificate_url: data.url, 
                    certificate_key: data.key,
                    certificate_title: file.name.split('.').slice(0, -1).join('.')
                }));
            }
        } catch(err: any) {
            console.error('Experience certificate file upload failed with exception', err);
            showToast("Unexpected error during certificate upload", "error");
        } finally {
            setExpCertUploading(false);
        }
    }

    async function deleteExperience(id: string) {
        if (!roleData?.id) return;
        try {
            const currentExp = (profile.experience || []).filter((e: any) => e.id !== id);
            const { error } = await insforge.database.from('students').update({
                experience: currentExp
            }).eq('id', roleData.id);

            if (error) {
                console.error("[Profile] Delete experience error:", error);
                showToast(`Failed to delete experience: ${error.message}`, "error");
            } else {
                showToast("Work experience removed", "success");
                setProfile({ ...profile, experience: currentExp });
                refreshRole();
                generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
            }
        } catch (err: any) {
            console.error("[Profile] deleteExperience exception:", err);
            showToast("Unexpected error deleting experience", "error");
        }
    }

    const openDocumentPreview = (url: string, title: string) => {
        let type: 'pdf' | 'image' | 'unknown' = 'unknown';
        if (url.toLowerCase().match(/\.(pdf)/i) || url.includes('/resumes/') || url.includes('/certificates/')) {
            type = url.toLowerCase().match(/\.(png|jpe?g|gif|webp)/i) ? 'image' : 'pdf';
        } else if (url.toLowerCase().match(/\.(png|jpe?g|gif|webp)/i)) {
            type = 'image';
        } else {
            type = url.endsWith('.pdf') ? 'pdf' : 'image';
        }
        setPreviewState({
            isOpen: true,
            url,
            title,
            type
        });
        setZoom(100);
        setIsFullscreen(false);
    };

    const DocumentPreviewModal = () => {
        const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);
        const { url, title, type, isOpen } = previewState;

        useEffect(() => {
            if (!isOpen || !url) return;
            let active = true;
            setLoading(true);

            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error("Fetch failed");
                    return res.blob();
                })
                .then(blob => {
                    if (!active) return;
                    let mimeType = 'application/pdf';
                    if (url.toLowerCase().match(/\.(png|jpe?g|gif|webp)/i)) {
                        mimeType = url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                    }
                    const cleanBlob = new Blob([blob], { type: mimeType });
                    const localUrl = URL.createObjectURL(cleanBlob);
                    setLocalObjectUrl(localUrl);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("[Profile] Fetch as blob failed, using fallback URL", err);
                    if (active) {
                        setLocalObjectUrl(url);
                        setLoading(false);
                    }
                });

            return () => {
                active = false;
                if (localObjectUrl && localObjectUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(localObjectUrl);
                }
                setLocalObjectUrl(null);
            };
        }, [isOpen, url]);

        if (!isOpen) return null;

        const handleDownload = async () => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = title || 'document';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error("Download failed", err);
                window.open(url, '_blank');
            }
        };

        const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
        const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
        const handleResetZoom = () => setZoom(100);

        return createPortal(
            <div 
                className={cn(
                    "fixed inset-0 z-[9999] flex flex-col bg-zinc-950/95 text-white transition-opacity duration-300 animate-in fade-in",
                    isFullscreen ? "p-0" : "p-4 sm:p-6"
                )}
            >
                <div className={cn(
                    "flex flex-col w-full h-full bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl transition-all duration-300",
                    isFullscreen ? "rounded-none border-none" : "rounded-2xl"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-heading font-bold text-sm sm:text-base truncate max-w-[150px] sm:max-w-xs">{title}</span>
                            <Badge variant="outline" className="text-[10px] text-zinc-400 border-white/10 shrink-0">
                                {type.toUpperCase()}
                            </Badge>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-zinc-800/80 border border-white/5 rounded-lg px-2 py-1 shrink-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleZoomOut} 
                                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </Button>
                            <button 
                                onClick={handleResetZoom}
                                className="text-[11px] font-mono px-1.5 font-bold text-zinc-300 hover:text-white"
                                title="Reset Zoom"
                            >
                                {zoom}%
                            </button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleZoomIn} 
                                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                                title="Zoom In"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsFullscreen(!isFullscreen)} 
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleDownload} 
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                title="Download"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-5 bg-white/10 mx-1" />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                    setPreviewState(prev => ({ ...prev, isOpen: false }));
                                    setIsFullscreen(false);
                                    setZoom(100);
                                }} 
                                className="h-8 w-8 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-rose-600 rounded-lg"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Preview Viewport */}
                    <div className="flex-1 overflow-auto bg-zinc-950/40 p-4 sm:p-8 flex items-center justify-center relative select-none">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-50">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}
                        
                        <div 
                            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                            style={{ 
                                transform: `scale(${zoom / 100})`,
                                width: type === 'pdf' ? '100%' : 'auto',
                                height: type === 'pdf' ? '100%' : 'auto',
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                        >
                            {type === 'pdf' ? (
                                <iframe 
                                    src={localObjectUrl || undefined} 
                                    className="w-full h-full min-h-[70vh] rounded-lg border border-white/10 shadow-2xl bg-white"
                                />
                            ) : (
                                <img 
                                    src={localObjectUrl || undefined} 
                                    alt={title}
                                    className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/5 shadow-2xl"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const edu = getEducationData();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* My Portfolio Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-heading font-bold tracking-tight">My Portfolio</h1>
                {!editing ? (
                    <Button onClick={() => setEditing(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200 text-white"><Pencil className="w-4 h-4 mr-2" />Edit Profile</Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-border text-foreground hover:bg-muted transition-all duration-200" onClick={() => { setEditing(false); setProfile({ ...roleData }); }}>Cancel</Button>
                        <Button onClick={handleSaveClick} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-200 text-white"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                )}
            </div>

            {/* Profile Main Header Card */}
            <Card className="relative z-20">
                {/* LinkedIn Style Cover Image */}
                <div className="relative group/cover h-20 sm:h-24 w-full overflow-hidden bg-muted border-b rounded-t-lg">
                    {/* Fallback Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent" />
                            
                            {/* Uploaded Cover Image with fade-in transition */}
                            {profile.cover_photo_url && (
                                <img
                                    src={profile.cover_photo_url}
                                    alt="Cover Banner"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-105 cursor-pointer animate-in fade-in duration-500"
                                    onClick={() => profile.cover_photo_url && openDocumentPreview(profile.cover_photo_url, "Cover Photo")}
                                
                                />
                            )}
                            
                            {/* Cover image controls - visible on hover */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover/cover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex gap-2">
                                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow border border-white/10 cursor-pointer transition-all hover:scale-[1.02] active:scale-95">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>{profile.cover_photo_url ? 'Change Cover' : 'Upload Cover'}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
                                </label>
                                {profile.cover_photo_url && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => profile.cover_photo_url && openDocumentPreview(profile.cover_photo_url, "Cover Photo")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow border border-white/10 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Preview</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={removeCoverPhoto}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-700 text-white shadow transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Remove</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {coverUploading && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                            )}
                </div>
                
                <CardContent className="p-6 pt-0 relative">
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-4">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                                    {/* Profile Avatar with Menu on Click */}
                                    <div className="relative shrink-0 border-4 border-background rounded-full bg-zinc-900 shadow-xl -mt-10 sm:-mt-12 z-10">
                                        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => profile.profile_photo_url && openDocumentPreview(profile.profile_photo_url, "Profile Photo")}>
                                            <AvatarImage src={profile.profile_photo_url} />
                                            <AvatarFallback className="text-4xl font-bold font-heading bg-zinc-800 text-white">{profile.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setAvatarMenuOpen(!avatarMenuOpen); }}
                                            className="absolute bottom-0 right-0 p-1.5 bg-card hover:bg-muted border shadow-md rounded-full cursor-pointer hover:scale-105 transition-all text-card-foreground"
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                        </button>
                                        
                                        {/* Action Dropdown Menu */}
                                        {avatarMenuOpen && (
                                            <>
                                                {/* Click away backdrop */}
                                                <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} />
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-40 bg-popover text-popover-foreground border shadow-2xl rounded-lg p-1 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                                                    {!profile.profile_photo_url ? (
                                                        <label className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors">
                                                            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>Upload Photo</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                        </label>
                                                    ) : (
                                                        <>
                                                            <label className="flex w-full items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors">
                                                                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span>Replace Photo</span>
                                                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    openDocumentPreview(profile.profile_photo_url, "Profile Photo");
                                                                    setAvatarMenuOpen(false);
                                                                }}
                                                                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span>Preview Photo</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    removeProfilePhoto();
                                                                    setAvatarMenuOpen(false);
                                                                }}
                                                                className="flex w-full items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                                <span>Remove Photo</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pt-3 sm:pt-6 pb-1">
                                        {editing ? (
                                            <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="text-xl font-bold mb-2 h-9 bg-background border-input text-foreground focus-visible:ring-ring" />
                                        ) : (
                                            <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground">{profile.name}</h2>
                                        )}
                                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                                        
                                        {/* Upgraded Card badges */}
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                                            <Badge variant="secondary" className="text-xs py-1 px-3 rounded-md flex items-center gap-1.5">
                                                <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="font-semibold">{profile.branch || 'General'}</span>
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs py-1 px-3 rounded-md flex items-center gap-1.5">
                                                <span className="font-semibold">{getYearDisplay(profile.current_year)}</span>
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs py-1 px-3 rounded-md flex items-center gap-1.5">
                                                <span className="font-semibold">
                                                    CGPA: {formatCGPA(profile.cgpa)}
                                                    {parseFloat(profile.cgpa) > 0 && ` (${getEquivalentPercentage(profile.cgpa)})`}
                                                </span>
                                            </Badge>
                                            
                                            {editing ? (
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "text-xs py-1 px-3 rounded-md flex items-center gap-1.5 shadow-sm border transition-all duration-300 hover:scale-[1.02] active:scale-95 font-semibold",
                                                        profile.placement_status === 'placed'
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                                                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                                                    )}
                                                    onClick={() => setProfile({ ...profile, placement_status: profile.placement_status === 'placed' ? 'not_placed' : 'placed' })}
                                                >
                                                    {profile.placement_status === 'placed' ? '✓ Placed' : 'Seeking Placement'} (Toggle)
                                                </button>
                                            ) : (
                                                <div
                                                    className={cn(
                                                        "text-xs py-1 px-3 rounded-md flex items-center gap-1.5 shadow-sm border font-semibold",
                                                        profile.placement_status === 'placed'
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                                                    )}
                                                >
                                                    {profile.placement_status === 'placed' ? 'Placed' : 'Seeking Placement'}
                                                </div>
                                            )}

                                            {profile.portfolio_url && (
                                                <a
                                                    href={profile.portfolio_url.startsWith('http') ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs py-1 px-3 rounded-md flex items-center gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border transition-all duration-300 hover:scale-[1.02] active:scale-95 font-semibold cursor-pointer"
                                                >
                                                    <Globe className="w-3.5 h-3.5 shrink-0 text-primary" />
                                                    <span>Portfolio</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
                        <Card 
                            onClick={() => setActiveTab('skills')}
                            className="card-hover cursor-pointer hover:shadow-md transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Skills Added</p>
                                        <p className="text-3xl font-heading font-bold mt-1">{skills.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Award className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card 
                            onClick={() => setActiveTab('projects')}
                            className="card-hover cursor-pointer hover:shadow-md transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Projects</p>
                                        <p className="text-3xl font-heading font-bold mt-1">{projects.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <Globe className="w-6 h-6 text-purple-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card 
                            onClick={() => setActiveTab('certificates')}
                            className="card-hover cursor-pointer hover:shadow-md transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Certificates</p>
                                        <p className="text-3xl font-heading font-bold mt-1">{certificates.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Award className="w-6 h-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card 
                            onClick={() => setActiveTab('resume')}
                            className="card-hover cursor-pointer hover:shadow-md transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Resume Status</p>
                                        <div className="mt-1 h-9 flex items-center">
                                            {profile.resume_url ? (
                                                <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 font-bold uppercase rounded-md">Uploaded</Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-0.5 font-bold uppercase rounded-md">Missing</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </div>

            {/* Premium Profile Completion Card */}
            {role === 'student' && (() => {
                const { percentage, completedCount, totalCount, nextRecommended } = calculateProfileCompletion();
                return (
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-950/60 dark:to-slate-900/60 backdrop-blur-xl p-6 shadow-xl animate-fade-in">
                        {/* Decorative Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                {/* Radial progress ring */}
                                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="34"
                                            className="stroke-slate-200 dark:stroke-slate-800"
                                            strokeWidth="6"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="34"
                                            className="stroke-primary transition-all duration-500 ease-out"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 34}
                                            strokeDashoffset={2 * Math.PI * 34 * (1 - percentage / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-lg font-heading font-extrabold text-slate-900 dark:text-white">{percentage}%</span>
                                </div>
                                
                                <div className="space-y-1 text-left">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        🚀 Complete Your Profile
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        You have completed <span className="text-slate-900 dark:text-white font-bold">{completedCount} of {totalCount}</span> profile sections.
                                    </p>
                                    {nextRecommended && (
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                            Next recommended section: <span className="text-primary font-semibold">{nextRecommended.name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {nextRecommended && (
                                <Button
                                    onClick={() => {
                                        setActiveTab(nextRecommended.id);
                                        if (nextRecommended.id === 'about') {
                                            setEditing(true);
                                        } else if (nextRecommended.id === 'projects') {
                                            setAddingProject(true);
                                        } else if (nextRecommended.id === 'experience') {
                                            setAddingExperience(true);
                                        } else if (nextRecommended.id === 'certificates') {
                                            setAddingCertificate(true);
                                        }
                                    }}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 shrink-0 self-start md:self-center hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                >
                                    Fill {nextRecommended.name}
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Sticky Navigation Tabs for Scrolling */}
            <div className="sticky top-0 z-35 w-full bg-card/85 backdrop-blur-md border shadow-sm rounded-lg p-1.5 flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300">
                {[
                    { label: 'Overview', id: 'about' },
                    { label: 'Education', id: 'education' },
                    { label: 'Skills', id: 'skills' },
                    { label: 'Projects', id: 'projects' },
                    { label: 'Work Experience', id: 'experience' },
                    { label: 'Certificates', id: 'certificates' },
                    { label: 'Resume', id: 'resume' },
                ].map(tab => {
                    const state = role === 'student' ? getTabCompletionState(tab.id) : 'completed';
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all active:scale-95 border whitespace-nowrap flex items-center justify-center gap-2",
                                activeTab === tab.id
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent hover:border-border"
                            )}
                        >
                            {role === 'student' && (
                                <>
                                    {state === 'completed' && <span className="text-emerald-500 font-bold">✓</span>}
                                    {state === 'partially' && <span className="text-amber-500 font-bold">⚠</span>}
                                    {state === 'not_started' && <span className="text-muted-foreground/40 font-bold">○</span>}
                                </>
                            )}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Overview / About Section */}
            {activeTab === 'about' && (
                <Card id="about" className="scroll-mt-24">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground">
                            <User className="w-4.5 h-4.5 text-primary shrink-0" />
                            Overview & About
                        </CardTitle>
                    </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</Label>
                            {editing ? (
                                <Input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring" />
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{profile.phone || '—'}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Academic CGPA</Label>
                            {editing ? (
                                <Input type="number" step="0.01" min="0" max="10" value={profile.cgpa || ''} onChange={e => {
                                    const val = e.target.value;
                                    const currentEdu = getEducationData();
                                    const updatedEdu = { ...currentEdu, college: { ...currentEdu.college, cgpa: val } };
                                    setProfile({ ...profile, cgpa: val, education: updatedEdu });
                                }} className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring" placeholder="e.g. 8.5" />
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{formatCGPA(profile.cgpa)}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Equivalent Percentage</Label>
                            <p className="mt-1 text-sm font-semibold text-foreground">{getEquivalentPercentage(profile.cgpa)}</p>
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Current Academic Year</Label>
                            {editing ? (
                                <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={profile.current_year || ''} onChange={e => {
                                    const val = e.target.value ? parseInt(e.target.value) : '';
                                    const currentEdu = getEducationData();
                                    const updatedEdu = { ...currentEdu, college: { ...currentEdu.college, current_year: val } };
                                    setProfile({ ...profile, current_year: val, education: updatedEdu });
                                }}>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{getYearDisplay(profile.current_year)}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Graduation Year</Label>
                            {editing ? (
                                <Input type="number" min="2020" max="2035" value={profile.graduation_year || ''} onChange={e => {
                                    const val = e.target.value ? parseInt(e.target.value) : '';
                                    const currentEdu = getEducationData();
                                    const updatedEdu = { ...currentEdu, college: { ...currentEdu.college, graduation_year: val } };
                                    setProfile({ ...profile, graduation_year: val, education: updatedEdu });
                                }} className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring" placeholder="e.g. 2027" />
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{profile.graduation_year || '—'}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Active Backlogs</Label>
                            {editing ? (
                                <Input type="number" min="0" max="20" value={profile.backlogs ?? 0} onChange={e => {
                                    const val = e.target.value ? parseInt(e.target.value) : 0;
                                    const currentEdu = getEducationData();
                                    const updatedEdu = { ...currentEdu, college: { ...currentEdu.college, backlogs: val } };
                                    setProfile({ ...profile, backlogs: val, education: updatedEdu });
                                }} className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring" placeholder="e.g. 0" />
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{profile.backlogs ?? 0}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Branch / Program</Label>
                            {editing ? (
                                <div className="relative mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground text-left font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <span>{profile.branch || 'Select Branch/Program...'}</span>
                                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                                    </button>
                                    {branchDropdownOpen && (
                                        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover text-popover-foreground p-1 shadow-2xl animate-in fade-in-50 slide-in-from-top-1 duration-150">
                                            <div className="flex items-center border-b border-border px-2 pb-1.5 pt-1">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                                                <input
                                                    className="flex h-7 w-full bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground text-foreground"
                                                    placeholder="Search program..."
                                                    value={branchSearch}
                                                    onChange={e => setBranchSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="py-1">
                                                {CANONICAL_BRANCHES
                                                    .filter(opt => opt.toLowerCase().includes(branchSearch.toLowerCase()))
                                                    .map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                const currentEdu = getEducationData();
                                                                const updatedEdu = { ...currentEdu, college: { ...currentEdu.college, branch: opt } };
                                                                setProfile({ ...profile, branch: opt, education: updatedEdu });
                                                                setBranchDropdownOpen(false);
                                                                setBranchSearch('');
                                                            }}
                                                            className={cn(
                                                                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs outline-none hover:bg-muted text-left transition-colors",
                                                                profile.branch === opt ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                                                            )}
                                                        >
                                                            <span>{opt}</span>
                                                            {profile.branch === opt && <Check className="h-3.5 w-3.5 text-primary" />}
                                                        </button>
                                                    ))
                                                }
                                                {[
                                                    'CSE', 'IT', 'AIML', 'Data Science', 'ECE', 'Electrical', 
                                                    'Mechanical', 'Civil', 'BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'M.Tech', 'Other'
                                                ].filter(opt => opt.toLowerCase().includes(branchSearch.toLowerCase())).length === 0 && (
                                                    <p className="text-center text-xs text-muted-foreground py-2">No programs found.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-foreground">{profile.branch || '—'}</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t">
                        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Biography / Summary</Label>
                        {editing ? (
                            <Textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="mt-1.5 resize-none bg-background border-input text-foreground focus-visible:ring-ring" placeholder="Write a short summary about your background, career interests, and skills..." rows={4} />
                        ) : (
                            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio || 'No bio added yet. Click edit profile to add one.'}</p>
                        )}
                    </div>

                    <div className="pt-4 border-t">
                        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5 block">Social Platforms & Personal Links</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-3.5 border rounded-lg bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Linkedin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> LinkedIn</span>
                                {editing ? (
                                    <Input value={profile.linkedin_url || ''} onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })} className="mt-1.5 h-8 text-xs bg-background border-input text-foreground focus-visible:ring-ring" placeholder="https://linkedin.com/in/..." />
                                ) : profile.linkedin_url ? (
                                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-full">
                                        Visit LinkedIn <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    <p className="mt-1.5 text-xs text-muted-foreground font-medium">—</p>
                                )}
                            </div>
                            <div className="p-3.5 border rounded-lg bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Github className="w-3.5 h-3.5 text-foreground shrink-0" /> GitHub</span>
                                {editing ? (
                                    <Input value={profile.github_url || ''} onChange={e => setProfile({ ...profile, github_url: e.target.value })} className="mt-1.5 h-8 text-xs bg-background border-input text-foreground focus-visible:ring-ring" placeholder="https://github.com/..." />
                                ) : profile.github_url ? (
                                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-full">
                                        Visit GitHub <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    <p className="mt-1.5 text-xs text-muted-foreground font-medium">—</p>
                                )}
                            </div>
                            <div className="p-3.5 border rounded-lg bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Portfolio Website</span>
                                {editing ? (
                                    <Input value={profile.portfolio_url || ''} onChange={e => setProfile({ ...profile, portfolio_url: e.target.value })} className="mt-1.5 h-8 text-xs bg-background border-input text-foreground focus-visible:ring-ring" placeholder="https://..." />
                                ) : profile.portfolio_url ? (
                                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 truncate max-w-full">
                                        Visit Portfolio <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    <p className="mt-1.5 text-xs text-muted-foreground font-medium">—</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            )}
            {role === 'student' && activeTab === 'education' && (
                <Card id="education" className="scroll-mt-24 shadow-sm border hover:border-primary/20 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                            Education History
                        </CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditEducation(null)}
                            className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 h-8 flex items-center gap-1.5 font-semibold transition-all active:scale-95 text-xs px-3"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Education</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="relative border-l-2 border-primary/20 ml-4 pl-6 space-y-8">
                            {/* College Timeline Node */}
                            <div className="relative group">
                                <div className="absolute -left-[31px] top-1.5 bg-background border-2 border-primary rounded-full w-4 h-4 flex items-center justify-center transition-colors group-hover:bg-primary">
                                    <div className="w-1.5 h-1.5 bg-primary group-hover:bg-background rounded-full" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-heading font-bold text-base text-foreground leading-snug">
                                                {edu.college?.degree || 'Degree Program'} - {profile.branch || 'Specialization'}
                                            </h4>
                                            <p className="text-sm font-semibold text-primary mt-1">
                                                {edu.college?.college_name || 'College Name'} {edu.college?.university_name ? `(${edu.college.university_name})` : ''}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditEducation('college')}
                                            className="text-muted-foreground hover:text-primary hover:bg-muted text-xs h-7 px-2.5 flex items-center gap-1 font-semibold border border-transparent hover:border-border shrink-0"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit</span>
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">Graduation: {profile.graduation_year || '—'}</span>
                                        <span>•</span>
                                        <span>CGPA: {profile.cgpa || '—'}</span>
                                        <span>•</span>
                                        <span>Backlogs: {profile.backlogs ?? 0}</span>
                                        {edu.college?.location && (
                                            <>
                                                <span>•</span>
                                                <span>{edu.college.location}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Class 12 Timeline Node */}
                            <div className="relative group">
                                <div className="absolute -left-[31px] top-1.5 bg-background border-2 border-zinc-400 rounded-full w-4 h-4 flex items-center justify-center transition-colors group-hover:bg-zinc-400">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 group-hover:bg-background rounded-full" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-heading font-bold text-sm text-foreground leading-snug">
                                                Class 12 / Higher Secondary Education ({edu.class12?.stream || 'General'})
                                            </h4>
                                            <p className="text-xs font-semibold text-muted-foreground mt-1">
                                                {edu.class12?.school_name || 'School Name'} | {edu.class12?.board || 'Board'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditEducation('class12')}
                                            className="text-muted-foreground hover:text-primary hover:bg-muted text-xs h-7 px-2.5 flex items-center gap-1 font-semibold border border-transparent hover:border-border shrink-0"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit</span>
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                        <span>Passing Year: {edu.class12?.passing_year || '—'}</span>
                                        <span>•</span>
                                        <span className="text-primary font-bold">Percentage: {edu.class12?.score || '—'}%</span>
                                        {edu.class12?.location && (
                                            <>
                                                <span>•</span>
                                                <span>{edu.class12.location}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Class 10 Timeline Node */}
                            <div className="relative group">
                                <div className="absolute -left-[31px] top-1.5 bg-background border-2 border-zinc-400 rounded-full w-4 h-4 flex items-center justify-center transition-colors group-hover:bg-zinc-400">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 group-hover:bg-background rounded-full" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-heading font-bold text-sm text-foreground leading-snug">
                                                Class 10 / Secondary Education
                                            </h4>
                                            <p className="text-xs font-semibold text-muted-foreground mt-1">
                                                {edu.class10?.school_name || 'School Name'} | {edu.class10?.board || 'Board'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditEducation('class10')}
                                            className="text-muted-foreground hover:text-primary hover:bg-muted text-xs h-7 px-2.5 flex items-center gap-1 font-semibold border border-transparent hover:border-border shrink-0"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit</span>
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                        <span>Passing Year: {edu.class10?.passing_year || '—'}</span>
                                        <span>•</span>
                                        <span className="text-primary font-bold">Score: {edu.class10?.score || '—'}</span>
                                        {edu.class10?.location && (
                                            <>
                                                <span>•</span>
                                                <span>{edu.class10.location}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Skills Section */}
            {activeTab === 'skills' && (
                <Card id="skills" className="scroll-mt-24">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-primary shrink-0" />
                        Skills & Expertise
                        <Badge className="ml-2 text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full font-bold">{skills.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                    {/* Add Skill Input */}
                    <div className="flex gap-2">
                        <Input placeholder="Add a skill (e.g. React, Node.js, C++)..." value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} className="h-9 bg-background border-input text-foreground focus-visible:ring-ring" />
                        <Button onClick={addSkill} size="sm" className="shrink-0 text-white"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                    </div>

                    {/* Categorized Skills Render */}
                    {skills.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">No skills added yet. Type above to add skills.</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(categorizeSkills(skills)).map(([category, list]) => (
                                <div key={category} className="border rounded-lg p-3.5 bg-muted/30 space-y-2">
                                    <h5 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">{category}</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {list.map(s => (
                                            <Badge
                                                key={s.id}
                                                variant="secondary"
                                                className="group text-foreground bg-muted border text-xs py-1 px-3.5 gap-1.5 rounded-full hover:bg-primary/20 hover:text-white dark:hover:text-white transition-all duration-300 hover:scale-105"
                                            >
                                                {s.skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(s.id)}
                                                    className="opacity-50 hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Projects Section */}
            {activeTab === 'projects' && (
                <Card id="projects" className="scroll-mt-24">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="w-4.5 h-4.5 text-primary shrink-0" />
                        Projects Portfolio
                        <Badge className="ml-2 text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full font-bold">{projects.length}</Badge>
                    </CardTitle>
                    {!addingProject && (
                        <Button size="sm" onClick={() => setAddingProject(true)} className="h-8 text-white">
                            <Plus className="w-4 h-4 mr-1" /> Add Project
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                    {/* Add Project Form */}
                    {addingProject && (
                        <div className="border rounded-lg p-5 bg-muted/30 space-y-4 animate-in fade-in-50 duration-200">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">New Project Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold">Project Title *</Label>
                                    <Input
                                        placeholder="e.g. E-Commerce Dashboard"
                                        value={newProject.title}
                                        onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Technologies (comma separated)</Label>
                                    <Input
                                        placeholder="e.g. React, MongoDB, Express"
                                        value={newProject.tech_stack}
                                        onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">Description</Label>
                                <Textarea
                                    placeholder="Explain key features, functionalities, and what problems this project solves..."
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    className="mt-1 resize-none bg-background border-input text-foreground focus-visible:ring-ring"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold"><Github className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" /> GitHub Repository URL</Label>
                                    <Input
                                        placeholder="https://github.com/username/project"
                                        value={newProject.github_url}
                                        onChange={e => setNewProject({ ...newProject, github_url: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold"><Globe className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" /> Live Demo URL</Label>
                                    <Input
                                        placeholder="https://project-demo.vercel.app"
                                        value={newProject.live_url}
                                        onChange={e => setNewProject({ ...newProject, live_url: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1.5 justify-end">
                                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted" onClick={() => { setAddingProject(false); setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' }); }}>
                                    Cancel
                                </Button>
                                <Button onClick={addProject} size="sm" className="text-white" disabled={projectSaving || !newProject.title.trim()}>
                                    {projectSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save Project</>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {projectsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/80 rounded-xl bg-card/40 backdrop-blur-sm space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-purple-500" />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-sm text-foreground">Add your first project</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">Showcase your coding skills, web apps, or personal experiments to stand out to recruiters.</p>
                            </div>
                            <Button onClick={() => setAddingProject(true)} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                                <Plus className="w-4 h-4 mr-1.5" /> Add Project
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    className="p-5 border rounded-lg group bg-card hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
                                    >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{p.title}</h4>
                                            <button
                                                type="button"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted"
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await insforge.database.from('student_projects').delete().eq('id', p.id);
                                                        if (error) {
                                                            console.error("[Profile] Project deletion error:", error);
                                                            showToast(`Failed to delete project: ${error.message}`, "error");
                                                        } else {
                                                            showToast("Project deleted successfully", "success");
                                                            setProjects(prev => prev.filter(pr => pr.id !== p.id));
                                                            generateStudentSummary(roleData.id).catch(err => console.error("[Profile] Summary generation failed:", err));
                                                        }
                                                    } catch (err: any) {
                                                        console.error("[Profile] Exception during project delete:", err);
                                                        showToast("Unexpected error deleting project", "error");
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {p.technologies && p.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {p.technologies.map((t: string) => (
                                                    <Badge key={t} variant="outline" className="text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-md">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-4 pt-2.5 border-t">
                                            {p.github_url && (
                                                <a
                                                    href={p.github_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5"
                                                >
                                                    <Github className="w-4 h-4 text-muted-foreground" />
                                                    Code Repository
                                                </a>
                                            )}
                                            {p.project_url && (
                                                <a
                                                    href={p.project_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5"
                                                >
                                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                                    Live Demo <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Work Experience Section */}
            {role === 'student' && activeTab === 'experience' && (
                <Card id="experience" className="scroll-mt-24 shadow-sm border hover:border-primary/20 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary shrink-0" />
                            Work Experience
                            <Badge className="ml-2 text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full font-bold">
                                {(profile.experience || []).length}
                            </Badge>
                        </CardTitle>
                        {!addingExperience && (
                            <Button size="sm" onClick={() => {
                                setEditingExperienceId(null);
                                setNewExperience({
                                    id: '',
                                    company_name: '',
                                    role: '',
                                    employment_type: 'Intern',
                                    start_date: '',
                                    end_date: '',
                                    currently_working: false,
                                    location: '',
                                    description: '',
                                    technologies_used: '',
                                    certificate_url: '',
                                    certificate_key: '',
                                    certificate_title: '',
                                    certificate_issuer: ''
                                });
                                setAddingExperience(true);
                            }} className="h-8 text-white">
                                <Plus className="w-4 h-4 mr-1" /> Add Experience
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        {/* Add / Edit Experience Form */}
                        {addingExperience && (
                            <div className="border rounded-lg p-5 bg-muted/30 space-y-4 animate-in fade-in-50 duration-200">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                    {editingExperienceId ? 'Edit Work Experience' : 'New Work Experience'}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-semibold">Company Name *</Label>
                                        <Input
                                            placeholder="e.g. Google"
                                            value={newExperience.company_name}
                                            onChange={e => setNewExperience({ ...newExperience, company_name: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Role *</Label>
                                        <Input
                                            placeholder="e.g. Software Engineering Intern"
                                            value={newExperience.role}
                                            onChange={e => setNewExperience({ ...newExperience, role: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Employment Type</Label>
                                        <select
                                            value={newExperience.employment_type}
                                            onChange={e => setNewExperience({ ...newExperience, employment_type: e.target.value })}
                                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Freelance">Freelance</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Location</Label>
                                        <Input
                                            placeholder="e.g. Mountain View, CA"
                                            value={newExperience.location}
                                            onChange={e => setNewExperience({ ...newExperience, location: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Start Date *</Label>
                                        <Input
                                            type="month"
                                            value={newExperience.start_date}
                                            onChange={e => setNewExperience({ ...newExperience, start_date: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">End Date</Label>
                                        <Input
                                            type="month"
                                            value={newExperience.end_date}
                                            onChange={e => setNewExperience({ ...newExperience, end_date: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                            disabled={newExperience.currently_working}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center gap-2 pb-1">
                                        <input
                                            id="currently_working_checkbox"
                                            type="checkbox"
                                            checked={newExperience.currently_working}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setNewExperience({
                                                    ...newExperience,
                                                    currently_working: checked,
                                                    end_date: checked ? '' : newExperience.end_date
                                                });
                                            }}
                                            className="w-4 h-4 rounded border-input bg-background text-primary"
                                        />
                                        <Label htmlFor="currently_working_checkbox" className="text-xs cursor-pointer select-none">
                                            I am currently working in this role
                                        </Label>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-xs font-semibold">Technologies Used (comma separated)</Label>
                                        <Input
                                            placeholder="e.g. React, Node.js, AWS"
                                            value={newExperience.technologies_used}
                                            onChange={e => setNewExperience({ ...newExperience, technologies_used: e.target.value })}
                                            className="mt-1 h-9 bg-background"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-xs font-semibold">Description</Label>
                                        <Textarea
                                            placeholder="Worked on building backend APIs, designing schemas, and improving search optimization..."
                                            value={newExperience.description}
                                            onChange={e => setNewExperience({ ...newExperience, description: e.target.value })}
                                            className="mt-1 resize-none bg-background"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 border-t border-border pt-4 mt-2 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-primary" />
                                            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                                                Experience Certificate (Optional)
                                            </h5>
                                        </div>

                                        {newExperience.certificate_url ? (
                                            <div className="p-4 border border-border rounded-lg bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                                            {newExperience.certificate_title || 'Certificate'}
                                                        </p>
                                                        {newExperience.certificate_issuer && (
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                Issued by: {newExperience.certificate_issuer}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 shrink-0 items-center">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDocumentPreview(newExperience.certificate_url, newExperience.certificate_title || "Certificate")}
                                                        className="h-8 text-xs font-medium cursor-pointer"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Preview
                                                    </Button>
                                                    <label className="cursor-pointer">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 text-xs font-medium pointer-events-none"
                                                        >
                                                            <span>Replace</span>
                                                        </Button>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,image/png,image/jpeg,image/jpg"
                                                            className="hidden"
                                                            onChange={handleExperienceCertificateUpload}
                                                        />
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNewExperience(prev => ({
                                                            ...prev,
                                                            certificate_url: '',
                                                            certificate_key: '',
                                                            certificate_title: '',
                                                            certificate_issuer: ''
                                                        }))}
                                                        className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/10 text-center">
                                                {expCertUploading ? (
                                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                ) : (
                                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                )}
                                                <div className="mt-1">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {expCertUploading ? 'Uploading Certificate...' : 'Upload Experience Certificate'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        PDF, PNG, JPG, or JPEG up to 10MB
                                                    </p>
                                                </div>
                                                <label className="cursor-pointer mt-3">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        asChild
                                                        disabled={expCertUploading}
                                                        className="h-8 text-xs font-medium pointer-events-none text-white bg-primary hover:bg-primary/95"
                                                    >
                                                        <span>Select File</span>
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,image/png,image/jpeg,image/jpg"
                                                        className="hidden"
                                                        onChange={handleExperienceCertificateUpload}
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        {newExperience.certificate_url && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs font-semibold">Certificate Title</Label>
                                                    <Input
                                                        placeholder="e.g. Internship Completion Certificate"
                                                        value={newExperience.certificate_title || ''}
                                                        onChange={e => setNewExperience({ ...newExperience, certificate_title: e.target.value })}
                                                        className="mt-1 h-9 bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-semibold">Certificate Issuer</Label>
                                                    <Input
                                                        placeholder="e.g. Google India"
                                                        value={newExperience.certificate_issuer || ''}
                                                        onChange={e => setNewExperience({ ...newExperience, certificate_issuer: e.target.value })}
                                                        className="mt-1 h-9 bg-background"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1.5 justify-end">
                                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted" onClick={() => { setAddingExperience(false); setEditingExperienceId(null); }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={saveExperience} size="sm" className="text-white" disabled={experienceSaving || !newExperience.company_name.trim() || !newExperience.role.trim() || !newExperience.start_date}>
                                        {experienceSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save Experience</>}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Experience List */}
                        {!(profile.experience && profile.experience.length > 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-lg">
                                No work experience listed. Click 'Add Experience' to showcase your professional record.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {(profile.experience as any[]).map(exp => {
                                    const startDateFormatted = exp.start_date ? new Date(exp.start_date + "-02").toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '';
                                    const endDateFormatted = exp.currently_working ? 'Present' : (exp.end_date ? new Date(exp.end_date + "-02").toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '');
                                    return (
                                        <div
                                            key={exp.id}
                                            className="p-5 border rounded-lg group bg-card hover:shadow-md transition-all duration-300 relative text-left"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="p-2.5 border border-border bg-muted/50 text-primary rounded-lg shrink-0 mt-1">
                                                        <Briefcase className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                                                            {exp.role}
                                                        </h4>
                                                        <p className="text-sm font-semibold text-primary mt-1">
                                                            {exp.company_name} <span className="text-xs text-muted-foreground font-medium">• {exp.employment_type}</span>
                                                        </p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                                            <span>{startDateFormatted} – {endDateFormatted}</span>
                                                            {exp.location && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{exp.location}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Experience row actions */}
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                                        onClick={() => {
                                                            setEditingExperienceId(exp.id);
                                                            setNewExperience({
                                                                id: exp.id || '',
                                                                company_name: exp.company_name || '',
                                                                role: exp.role || '',
                                                                employment_type: exp.employment_type || 'Intern',
                                                                start_date: exp.start_date || '',
                                                                end_date: exp.end_date || '',
                                                                currently_working: exp.currently_working || false,
                                                                location: exp.location || '',
                                                                description: exp.description || '',
                                                                technologies_used: exp.technologies_used || '',
                                                                certificate_url: exp.certificate_url || '',
                                                                certificate_key: exp.certificate_key || '',
                                                                certificate_title: exp.certificate_title || '',
                                                                certificate_issuer: exp.certificate_issuer || ''
                                                            });
                                                            setAddingExperience(true);
                                                        }}
                                                        title="Edit Experience"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted"
                                                        onClick={() => deleteExperience(exp.id)}
                                                        title="Delete Experience"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {exp.description && (
                                                <p className="text-xs text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap pl-1.5 border-l-2 border-border/50">
                                                    {exp.description}
                                                </p>
                                            )}

                                            {exp.technologies_used && (
                                                <div className="mt-4 flex flex-wrap gap-1.5">
                                                    {exp.technologies_used.split(',').map((tech: string) => (
                                                        <Badge key={tech} variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground font-medium px-2 py-0.5 rounded-md border-border/50">
                                                            {tech.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {exp.certificate_url && (
                                                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="text-xs font-semibold">
                                                            Certificate Available
                                                            {exp.certificate_issuer && ` (${exp.certificate_issuer})`}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDocumentPreview(exp.certificate_url, exp.certificate_title || 'Certificate')}
                                                        className="h-7 text-[11px] font-semibold text-primary border-primary/20 hover:bg-primary/5 cursor-pointer animate-in fade-in duration-200"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Certificate
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Certificates Section */}
            {activeTab === 'certificates' && (
                <Card id="certificates" className="scroll-mt-24">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-primary shrink-0" />
                        Certificates & Badges
                        <Badge className="ml-2 text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full font-bold">{certificates.length}</Badge>
                    </CardTitle>
                    {!addingCertificate && (
                        <Button size="sm" onClick={() => setAddingCertificate(true)} className="h-8 text-white">
                            <Plus className="w-4 h-4 mr-1" /> Add Certificate
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                    {/* Add Certificate Form */}
                    {addingCertificate && (
                        <div className="border rounded-lg p-5 bg-muted/30 space-y-4 animate-in fade-in-50 duration-200">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">New Certificate Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold">Certificate Name *</Label>
                                    <Input
                                        placeholder="e.g. AWS Certified Developer"
                                        value={newCertificate.name}
                                        onChange={e => setNewCertificate({ ...newCertificate, name: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Issuing Organization *</Label>
                                    <Input
                                        placeholder="e.g. Amazon Web Services"
                                        value={newCertificate.issuer}
                                        onChange={e => setNewCertificate({ ...newCertificate, issuer: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold">Issue Date</Label>
                                    <Input
                                        type="date"
                                        value={newCertificate.issue_date}
                                        onChange={e => setNewCertificate({ ...newCertificate, issue_date: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Credential / Info URL</Label>
                                    <Input
                                        placeholder="https://credly.com/..."
                                        value={newCertificate.credential_url}
                                        onChange={e => setNewCertificate({ ...newCertificate, credential_url: e.target.value })}
                                        className="mt-1 h-9 bg-background border-input text-foreground focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="block mb-1 text-xs font-semibold">Or Upload Certificate File (PDF / Image)</Label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-muted text-sm font-medium transition-colors text-foreground">
                                            {certificateFileUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            <span>{certificateFileUploading ? 'Uploading...' : 'Choose File'}</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="hidden"
                                            onChange={handleCertificateUpload}
                                            disabled={certificateFileUploading}
                                        />
                                    </label>
                                    {uploadedCertFileName && (
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            Uploaded: {uploadedCertFileName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1.5 justify-end">
                                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted" onClick={() => { setAddingCertificate(false); setNewCertificate({ name: '', issuer: '', issue_date: '', credential_url: '' }); setUploadedCertFileName(''); }}>
                                    Cancel
                                </Button>
                                <Button onClick={addCertificate} size="sm" className="text-white" disabled={certificateSaving || !newCertificate.name.trim() || !newCertificate.issuer.trim() || certificateFileUploading}>
                                    {certificateSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save Certificate</>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {certificatesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading certificates...</span>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/80 rounded-xl bg-card/40 backdrop-blur-sm space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Award className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-sm text-foreground">Upload your achievements</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">Add your course certifications, hackathon awards, or competition milestones.</p>
                            </div>
                            <Button onClick={() => setAddingCertificate(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                <Plus className="w-4 h-4 mr-1.5" /> Add Certificate
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certificates.map(c => (
                                <div
                                    key={c.id}
                                    className="p-5 border rounded-lg group bg-card hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 border border-border bg-muted/50 text-primary rounded-lg shrink-0 mt-0.5">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground leading-snug truncate max-w-[200px] sm:max-w-xs">{c.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{c.issuer}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted"
                                                onClick={() => removeCertificate(c.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between pt-3 border-b">
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {c.issue_date ? new Date(c.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'}
                                        </span>
                                        {c.credential_url && (
                                            <button
                                                type="button"
                                                onClick={() => openDocumentPreview(c.credential_url, c.name)}
                                                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 hover:underline cursor-pointer"
                                            >
                                                Preview <ExternalLink className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}
 
            {/* Resume Section */}
            {activeTab === 'resume' && (
                <Card id="resume" className="scroll-mt-24">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        Professional Resume Portfolio
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {profile.resume_url ? (
                        <div className="p-5 border rounded-lg bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-colors duration-300">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl shrink-0">
                                    <FileText className="w-9 h-9" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-foreground">Verified Resume Attachment</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Your resume is ready for recruiters and review boards</p>
                                    {profile.resume_key && (
                                        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono truncate max-w-xs sm:max-w-md bg-muted px-2 py-0.5 rounded border inline-block">
                                            File: {profile.resume_key.split('/').pop()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5 shrink-0 items-center">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => openDocumentPreview(profile.resume_url, "Resume")} 
                                    className="h-8 text-xs font-semibold cursor-pointer"
                                >
                                    <ExternalLink className="w-4 h-4 text-muted-foreground mr-1.5" /> Preview Resume
                                </Button>
                                <label className="cursor-pointer">
                                    <Button variant="default" size="sm" asChild className="h-8 text-xs font-semibold pointer-events-none">
                                        <span><Upload className="w-4 h-4 mr-1.5" /> Replace File</span>
                                    </Button>
                                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/80 rounded-xl bg-card/40 backdrop-blur-sm space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-amber-500 animate-bounce" />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-sm text-foreground">Upload your resume</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">Make your profile discoverable to top recruiters and unlock fast job applications.</p>
                            </div>
                            <label className="cursor-pointer inline-block">
                                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                                    <span><Upload className="w-4 h-4 mr-1.5" /> Upload Resume</span>
                                </Button>
                                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                            </label>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}
 
            {editing && role === 'student' && (
                <div className="flex justify-end gap-3 pt-2 mt-6">
                    <Button variant="outline" className="border-border text-foreground hover:bg-muted transition-all duration-200" onClick={() => { setEditing(false); setProfile({ ...roleData }); setDeclarationAccepted(false); }}>Cancel</Button>
                    <Button
                        onClick={handleSaveClick}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-200 text-white font-medium animate-in fade-in-50 duration-200"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            )}
 
            {/* Profile Declaration Modal */}
            {declarationModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setDeclarationModalOpen(false); setDeclarationAccepted(false); }}>
                    <div className="relative max-w-md w-full bg-card border shadow-2xl rounded-lg p-6 animate-in scale-in duration-200 space-y-6 text-left" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 pb-3 border-b">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <h3 className="text-lg font-bold text-foreground">⚠️ Profile Declaration</h3>
                        </div>
                        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <p className="text-foreground/90 font-semibold">
                                Before saving your profile, please confirm that all information provided in your profile, academic records, resume, projects, certifications, skills, and personal details is accurate and genuine.
                            </p>
                            <p>
                                Recruiters and placement authorities may verify the submitted information. Any false, misleading, incomplete, or inconsistent information may result in disqualification from placement opportunities, internships, or job offers.
                            </p>
                            <p>
                                Placify serves only as a facilitation platform. Responsibility for the authenticity and accuracy of submitted information rests solely with the student.
                            </p>
                        </div>
                        
                        <div className="pt-4 border-t flex items-center gap-2.5">
                            <input
                                id="modal-declaration-checkbox"
                                type="checkbox"
                                checked={declarationAccepted}
                                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-ring cursor-pointer"
                            />
                            <Label
                                htmlFor="modal-declaration-checkbox"
                                className="text-sm font-medium text-foreground cursor-pointer select-none"
                            >
                                I have read and agree to the Profile Declaration.
                            </Label>
                        </div>
 
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="border-border text-foreground hover:bg-muted transition-all duration-200"
                                onClick={() => { setDeclarationModalOpen(false); setDeclarationAccepted(false); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    saveProfile();
                                    setDeclarationModalOpen(false);
                                }}
                                disabled={!declarationAccepted}
                                className={cn(
                                    "shadow-lg transition-all duration-200 text-white font-medium bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
                                    declarationAccepted ? "hover:-translate-y-0.5" : "opacity-50 pointer-events-none"
                                )}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Agree & Save Profile
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
 
            {/* Education Edit Modal Dialog */}
            {editEducationOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setEditEducationOpen(false); setEditEduForm(null); }}>
                    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Edit Education Details
                            </h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => { setEditEducationOpen(false); setEditEduForm(null); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        {/* Modal Body: Tab Selectors */}
                        <div className="p-6">
                            <div className="flex border-b border-border mb-6">
                                {(['college', 'class12', 'class10'] as const).map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => {
                                            setEditEducationLevel(level);
                                            const currentEdu = getEducationData();
                                            setEditEduForm(currentEdu[level] || {});
                                        }}
                                        className={cn(
                                            "flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all capitalize",
                                            editEducationLevel === level
                                                ? "border-primary text-primary"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {level === 'college' ? 'College' : level === 'class12' ? 'Class 12' : 'Class 10'}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Form Fields for Active Tab */}
                            {editEduForm && (
                                <div className="space-y-4">
                                    {editEducationLevel === 'college' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs font-semibold">College Name *</Label>
                                                <Input
                                                    value={editEduForm.college_name || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, college_name: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. Delhi Technological University"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">University Name</Label>
                                                <Input
                                                    value={editEduForm.university_name || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, university_name: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. DTU"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Degree Program *</Label>
                                                <Input
                                                    value={editEduForm.degree || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, degree: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. Bachelor of Technology"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Branch / Specialization *</Label>
                                                <select
                                                    value={editEduForm.branch || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, branch: e.target.value })}
                                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none"
                                                >
                                                    <option value="">Select branch...</option>
                                                    {CANONICAL_BRANCHES.map(branch => (
                                                        <option key={branch} value={branch}>{branch}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Current Academic Year</Label>
                                                <select
                                                    value={editEduForm.current_year || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, current_year: e.target.value })}
                                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none"
                                                >
                                                    <option value="">Select current year...</option>
                                                    <option value="1">1st Year</option>
                                                    <option value="2">2nd Year</option>
                                                    <option value="3">3rd Year</option>
                                                    <option value="4">4th Year</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Graduation Year *</Label>
                                                <Input
                                                    type="number"
                                                    value={editEduForm.graduation_year || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, graduation_year: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 2027"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Current CGPA *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={editEduForm.cgpa || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, cgpa: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 8.5"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Active Backlogs</Label>
                                                <Input
                                                    type="number"
                                                    value={editEduForm.backlogs ?? 0}
                                                    onChange={e => setEditEduForm({ ...editEduForm, backlogs: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 0"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label className="text-xs font-semibold">College Location</Label>
                                                <Input
                                                    value={editEduForm.location || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, location: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. New Delhi, Delhi"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {editEducationLevel === 'class12' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs font-semibold">School Name *</Label>
                                                <Input
                                                    value={editEduForm.school_name || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, school_name: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. St. Xavier's School"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Board</Label>
                                                <select
                                                    value={editEduForm.board || 'CBSE'}
                                                    onChange={e => setEditEduForm({ ...editEduForm, board: e.target.value })}
                                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none"
                                                >
                                                    <option value="CBSE">CBSE</option>
                                                    <option value="ICSE">ICSE / ISC</option>
                                                    <option value="State Board">State Board</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Stream *</Label>
                                                <Input
                                                    value={editEduForm.stream || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, stream: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. Science"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Passing Year *</Label>
                                                <Input
                                                    type="number"
                                                    value={editEduForm.passing_year || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, passing_year: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 2023"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Percentage (%) *</Label>
                                                <Input
                                                    value={editEduForm.score || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, score: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 89"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">School Location</Label>
                                                <Input
                                                    value={editEduForm.location || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, location: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. New Delhi"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {editEducationLevel === 'class10' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs font-semibold">School Name *</Label>
                                                <Input
                                                    value={editEduForm.school_name || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, school_name: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. St. Xavier's School"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Board</Label>
                                                <select
                                                    value={editEduForm.board || 'CBSE'}
                                                    onChange={e => setEditEduForm({ ...editEduForm, board: e.target.value })}
                                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none"
                                                >
                                                    <option value="CBSE">CBSE</option>
                                                    <option value="ICSE">ICSE</option>
                                                    <option value="State Board">State Board</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Passing Year *</Label>
                                                <Input
                                                    type="number"
                                                    value={editEduForm.passing_year || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, passing_year: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 2021"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Percentage / CGPA *</Label>
                                                <Input
                                                    value={editEduForm.score || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, score: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. 91"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label className="text-xs font-semibold">School Location</Label>
                                                <Input
                                                    value={editEduForm.location || ''}
                                                    onChange={e => setEditEduForm({ ...editEduForm, location: e.target.value })}
                                                    className="mt-1 h-9 bg-background"
                                                    placeholder="e.g. New Delhi"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="flex gap-2 justify-end p-5 border-t border-border bg-muted/20">
                            <Button variant="outline" onClick={() => { setEditEducationOpen(false); setEditEduForm(null); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (editEducationLevel && editEduForm) {
                                        saveEducation(editEducationLevel, editEduForm);
                                        setEditEducationOpen(false);
                                        setEditEduForm(null);
                                    }
                                }}
                                className="text-white"
                                disabled={!editEduForm || (editEducationLevel === 'college' && (!editEduForm.college_name?.trim() || !editEduForm.degree?.trim() || !editEduForm.branch?.trim() || !editEduForm.graduation_year)) || (editEducationLevel !== 'college' && (!editEduForm.school_name?.trim() || !editEduForm.passing_year))}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Unified Preview Modal */}
            <DocumentPreviewModal />
 
            {/* Toasts overlay list container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">


                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 ${
                            t.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                : t.type === 'error'
                                ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                                : 'bg-slate-50 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/30 text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                        {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                        {t.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        <span className="text-xs font-semibold">{t.message}</span>
                        <button
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 pointer-events-auto"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
