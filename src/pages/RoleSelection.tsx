import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import PlacifyLogo from '@/components/ui/PlacifyLogo';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    GraduationCap, Building2, Shield, ArrowRight, ArrowLeft, Loader2, 
    Upload, User, Mail, Phone, BookOpen, AlertCircle, Check, FileText,
    Sun, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoleSelection() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { role, profileCompleted, refreshRole } = useRole();
    const { theme, resolvedTheme, setTheme } = useTheme();

    // Bypass Role selection: determine the role from useRole() or localStorage
    const signupRole = (role || localStorage.getItem('signup_role') || 'student') as 'student' | 'recruiter';
    
    useEffect(() => {
        if (role && profileCompleted) {
            navigate('/dashboard', { replace: true });
        }
    }, [role, profileCompleted, navigate]);

    // Student wizard steps: 1 (Personal Info), 2 (Academic Info)
    const [studentStep, setStudentStep] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Step 1: Personal Info
    const [name, setName] = useState(user?.profile?.name || '');
    const [phone, setPhone] = useState('');
    const [personalEmail, setPersonalEmail] = useState(user?.email || '');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Step 2: Academic Info
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [collegeEmail, setCollegeEmail] = useState(user?.email || '');
    const [course, setCourse] = useState('B.Tech');
    const [branch, setBranch] = useState('CSE');
    const [year, setYear] = useState('3');
    const [graduationYear, setGraduationYear] = useState((new Date().getFullYear() + 1).toString());

    // Recruiter Specific Form State
    const [company, setCompany] = useState('');

    // Error tracking for steps
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Keep graduation year updated when current year changes
    useEffect(() => {
        const yearInt = parseInt(year);
        if (!isNaN(yearInt)) {
            const currentYearNum = new Date().getFullYear();
            setGraduationYear((currentYearNum + (4 - yearInt) + 1).toString());
        }
    }, [year]);

    function validateStep(stepNum: number) {
        const errs: Record<string, string> = {};
        if (signupRole === 'student') {
            if (stepNum === 1) {
                if (!name.trim()) errs.name = 'Full name is required';
                if (!personalEmail.trim()) {
                    errs.personalEmail = 'Personal email is required';
                } else if (!/\S+@\S+\.\S+/.test(personalEmail)) {
                    errs.personalEmail = 'Enter a valid personal email';
                }
                if (phone.trim()) {
                    const digits = phone.replace(/[\s\-+()]/g, '');
                    if (!/^\d{10,13}$/.test(digits)) {
                        errs.phone = 'Enter a valid phone number (10-13 digits)';
                    }
                }
            } else if (stepNum === 2) {
                if (!registrationNumber.trim()) errs.registrationNumber = 'Registration number is required';
                if (!collegeEmail.trim()) {
                    errs.collegeEmail = 'College email is required';
                } else if (!/\S+@\S+\.\S+/.test(collegeEmail)) {
                    errs.collegeEmail = 'Enter a valid college email';
                }
            }
        } else {
            // Recruiter validation
            if (!name.trim()) errs.name = 'Full name is required';
            if (!company.trim()) errs.company = 'Company name is required';
        }
        return errs;
    }

    const handleNextStep = () => {
        const errs = validateStep(studentStep);
        setErrors(errs);
        
        // Mark all fields in current step as touched
        if (studentStep === 1) {
            setTouched({ name: true, phone: true, personalEmail: true });
        } else if (studentStep === 2) {
            setTouched({ registrationNumber: true, collegeEmail: true });
        }

        if (Object.keys(errs).length === 0) {
            setStudentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setStudentStep(prev => prev - 1);
    };

    // Upload files handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo') => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        if (type === 'photo') {
            setUploadingPhoto(true);
            try {
                const { data, error } = await insforge.storage
                    .from('profile-images')
                    .upload(`${user.id}/avatar_${Date.now()}_${file.name}`, file);
                if (error) throw error;
                if (data?.url) setProfilePhotoUrl(data.url);
            } catch (err: any) {
                alert('Profile Photo upload failed: ' + (err.message || err));
            } finally {
                setUploadingPhoto(false);
            }
        }
    };

    async function handleComplete() {
        const errs = validateStep(signupRole === 'student' ? 2 : 1);
        setErrors(errs);
        if (Object.keys(errs).length > 0 || !user) return;

        setSubmitting(true);
        setSubmitError('');
        try {
            if (!user?.id) {
                throw new Error('Session error: user ID is missing.');
            }

            const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            const cachedOrgId = localStorage.getItem('signup_organization_id') || '00000000-0000-0000-0000-000000000001';
            const cachedCollegeId = registrationNumber.trim() || localStorage.getItem('signup_college_id') || null;

            if (signupRole === 'student') {
                const regNo = registrationNumber.trim();
                if (regNo) {
                    // Check if another student already registered this college ID
                    const { data: duplicateReg } = await insforge.database
                        .from('students')
                        .select('id, user_id')
                        .eq('college_id', regNo)
                        .maybeSingle();

                    if (duplicateReg && duplicateReg.user_id !== user.id) {
                        throw new Error('A student with this Registration Number already exists. If this is correct, please contact the Administration Cell.');
                    }
                }

                const educationData = {
                    personal_email: personalEmail.trim(),
                    college_email: collegeEmail.trim(),
                    course: course,
                    profile_photo_url: profilePhotoUrl
                };

                // Check by user_id first, then email
                const { data: existingByUid } = await insforge.database
                    .from('students')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                let existing = existingByUid;
                if (!existing) {
                    const { data: existingByEmail } = await insforge.database
                        .from('students')
                        .select('*')
                        .eq('email', user.email)
                        .maybeSingle();
                    existing = existingByEmail;
                }

                if (existing) {
                    const { error } = await insforge.database
                        .from('students')
                        .update({
                            user_id: user.id,
                            name: name.trim(),
                            phone: phone.trim() || null,
                            otp: otpCode,
                            account_status: 'Pending',
                            status: 'pending',
                            verification_status: 'Pending',
                            organization_id: cachedOrgId,
                            college_id: cachedCollegeId,
                            branch,
                            current_year: parseInt(year),
                            graduation_year: parseInt(graduationYear),
                            profile_photo_url: profilePhotoUrl || null,
                            education: educationData,
                            profile_completed: true
                        })
                        .eq('id', existing.id);
                    if (error) throw error;
                } else {
                    const { error } = await insforge.database.from('students').insert([{
                        user_id: user.id,
                        name: name.trim(),
                        email: user.email,
                        phone: phone.trim() || null,
                        branch,
                        current_year: parseInt(year),
                        graduation_year: parseInt(graduationYear),
                        cgpa: 0,
                        backlogs: 0,
                        placement_status: 'not_placed',
                        account_status: 'Pending',
                        status: 'pending',
                        verification_status: 'Pending',
                        otp: otpCode,
                        organization_id: cachedOrgId,
                        college_id: cachedCollegeId,
                        profile_photo_url: profilePhotoUrl || null,
                        education: educationData,
                        profile_completed: true
                    }]);
                    if (error) throw error;
                }
            } else if (signupRole === 'recruiter') {
                const { data: existing } = await insforge.database
                    .from('recruiters')
                    .select('*')
                    .eq('email', user.email)
                    .maybeSingle();

                if (existing) {
                    const { error } = await insforge.database
                        .from('recruiters')
                        .update({
                            user_id: user.id,
                            name: name.trim(),
                            company: company.trim(),
                            otp: otpCode,
                            status: 'Pending',
                            verification_status: 'Pending',
                            organization_id: cachedOrgId,
                            profile_completed: true
                        })
                        .eq('id', existing.id);
                    if (error) throw error;
                } else {
                    const { error } = await insforge.database.from('recruiters').insert([{
                        user_id: user.id,
                        name: name.trim(),
                        email: user.email,
                        company: company.trim(),
                        status: 'Pending',
                        verification_status: 'Pending',
                        otp: otpCode,
                        organization_id: cachedOrgId,
                        profile_completed: true
                    }]);
                    if (error) throw error;
                }
            }

            // Create notification for Super Admin
            await insforge.database.from('notifications').insert([{
                user_id: '00000000-0000-0000-0000-000000000000',
                title: 'New Registration Request',
                message: `New ${signupRole} registration request from ${name.trim()} (${user.email}). OTP generated: ${otpCode}`,
                type: 'info',
                is_read: false
            }]);

            // Persist the role in profile metadata/custom fields
            await insforge.auth.setProfile({
                role: (signupRole as string) === 'admin' ? 'subadmin' : signupRole
            });

            setIsSubmitted(true);
            setTimeout(() => {
                // Force full page reload so RoleContext re-initializes from DB fresh
                window.location.href = '/dashboard';
            }, 1200);
        } catch (err: any) {
            console.error('Registration completion error:', err);
            let friendlyMsg = err?.message || 'Registration failed. Please try again.';
            if (
                friendlyMsg.includes('students_user_id_key') ||
                friendlyMsg.includes('duplicate key') ||
                friendlyMsg.includes('unique constraint') ||
                friendlyMsg.includes('violates unique constraint')
            ) {
                friendlyMsg = 'A student with this Registration Number or account already exists. If this is correct, please contact the Administration Cell.';
            }
            setSubmitError(friendlyMsg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex select-none overflow-hidden relative font-body transition-colors duration-300">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes float-slow-1 {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(35px, -55px) scale(1.12); }
                    66% { transform: translate(-25px, 25px) scale(0.92); }
                }
                @keyframes float-slow-2 {
                    0%, 100% { transform: translate(0px, 0px) scale(1.08); }
                    50% { transform: translate(-45px, 35px) scale(0.88); }
                }
                @keyframes float-slow-3 {
                    0%, 100% { transform: translate(0px, 0px) scale(0.96); }
                    50% { transform: translate(25px, -25px) scale(1.06); }
                }
                .animate-float-1 { animation: float-slow-1 22s ease-in-out infinite; }
                .animate-float-2 { animation: float-slow-2 26s ease-in-out infinite; }
                .animate-float-3 { animation: float-slow-3 24s ease-in-out infinite; }
                
                .mesh-grid {
                    background-image: 
                        radial-gradient(circle at 15% 20%, var(--grid-glow-1, rgba(59,130,246,0.08)), transparent 40%),
                        radial-gradient(circle at 85% 80%, var(--grid-glow-2, rgba(139,92,246,0.06)), transparent 40%),
                        radial-gradient(circle at 50% 50%, var(--grid-glow-3, rgba(245,158,11,0.04)), transparent 35%);
                }
                
                .theme-grid-lines {
                    background-image: 
                        linear-gradient(to right, var(--grid-line-color, rgba(0,0,0,0.02)) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--grid-line-color, rgba(0,0,0,0.02)) 1px, transparent 1px);
                    background-size: 32px 32px;
                }
                
                .dark .theme-grid-lines {
                    --grid-line-color: rgba(255, 255, 255, 0.02);
                }
                .dark .mesh-grid {
                    --grid-glow-1: rgba(59,130,246,0.14);
                    --grid-glow-2: rgba(139,92,246,0.09);
                    --grid-glow-3: rgba(245,158,11,0.07);
                }
            `}} />

            {/* Ambient Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
                {/* Mesh Grids */}
                <div className="absolute inset-0 mesh-grid opacity-75 transition-all duration-500" />
                <div className="absolute inset-0 theme-grid-lines opacity-100 transition-all duration-500" />
                
                {/* Floating Glow Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/8 dark:bg-primary/15 blur-[120px] animate-float-1" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-accent/6 dark:bg-accent/12 blur-[110px] animate-float-2" />
                <div className="absolute top-[35%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-violet-500/4 dark:bg-violet-500/8 blur-[100px] animate-float-3" />
            </div>
            
            {/* LEFT COLUMN (Visual Panel - Desktop Only) */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-50/50 dark:bg-slate-950/45 backdrop-blur-[4px] border-r border-border/60 relative p-12 text-foreground dark:text-white overflow-hidden select-none transition-colors duration-300 z-10">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/3 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/2 dark:bg-accent/3 rounded-full blur-[90px] pointer-events-none" />

                {/* Header branding */}
                <div className="relative z-10 flex items-center justify-between">
                    <Link to="/">
                        <PlacifyLogo iconClassName="text-foreground dark:text-white w-9 h-9" textClassName="h-6" />
                    </Link>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30">
                        Verification Portal
                    </span>
                </div>

                {/* Content Panel */}
                <div className="relative z-10 max-w-md mx-auto my-auto space-y-8 flex flex-col justify-center text-left animate-fade-in">
                    <div className="space-y-3">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-accent uppercase bg-accent/10 border border-accent/20 rounded-full">
                            Placement Officer Review
                        </span>
                        <h2 className="text-3xl font-heading font-black tracking-tight leading-tight">
                            {signupRole === 'student' ? 'Placement Admin Approval Required' : 'Partner with Us to Hire Top Talent'}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {signupRole === 'student' 
                                ? 'Submit your college credentials and ID card. Your registration must be manually approved by the Placement Officer to unlock placements, drives, and coding sheets.'
                                : 'Establish your verified recruiter profile to post placement drives, view ATS-graded candidates, and select top graduates.'}
                        </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-3">
                        {signupRole === 'student' ? (
                            <>
                                <div className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/75 hover:border-primary/20 transition-all duration-300 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Shield className="w-4 h-4 text-primary" /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">Placement Officer Verification</h4>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Your College Admin manually approves your registration details to ensure trusted candidate profiles.</p>
                                    </div>
                                </div>
                                <div className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/75 hover:border-primary/20 transition-all duration-300 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><BookOpen className="w-4 h-4 text-primary" /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">Campus Drive Activation</h4>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Once approved by your admin, you get instant access to apply for all active job drives.</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/75 hover:border-primary/20 transition-all duration-300 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Building2 className="w-4 h-4 text-primary" /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">Direct Student Discovery</h4>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Search and filter active candidates by CGPA, branch, or code test history.</p>
                                    </div>
                                </div>
                                <div className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card/30 hover:bg-card/75 hover:border-primary/20 transition-all duration-300 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Check className="w-4 h-4 text-primary" /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">Comprehensive Job Pipeline</h4>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Create drives, customize filters, and evaluate candidates in a single dashboard.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Verification / Account Onboarding Timeline Checklist */}
                    <div className="border rounded-2xl bg-card/75 backdrop-blur-md p-5 border-border/80 shadow-lg space-y-4 transition-all duration-300 hover:shadow-primary/5 hover:border-primary/30">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-primary animate-pulse" />
                                Onboarding Milestones
                            </span>
                            <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Pending Verification
                            </span>
                        </div>
                        
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-3 text-xs">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Account Registered</p>
                                    <p className="text-[10px] text-muted-foreground">Credentials confirmed successfully</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs">
                                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Complete Profile Details</p>
                                    <p className="text-[10px] text-muted-foreground">Please fill personal & academic details</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs opacity-60">
                                <div className="w-5 h-5 rounded-full bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                                    <User className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Placement Officer Approval</p>
                                    <p className="text-[10px] text-muted-foreground">SubAdmin checks registration number & branch</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs opacity-60">
                                <div className="w-5 h-5 rounded-full bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                                    <GraduationCap className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Placify Access Unlocked</p>
                                    <p className="text-[10px] text-muted-foreground">Apply to job drives & coding sheets</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer legal */}
                <div className="relative z-10 text-[10px] text-muted-foreground flex justify-between">
                    <span>© {new Date().getFullYear()} Placify Ecosystem</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Secured verification</span>
                </div>
            </div>

            {/* RIGHT COLUMN (Form Panel - Mobile & Desktop) */}
            <div className="w-full lg:w-1/2 min-h-screen bg-background/45 backdrop-blur-[3px] flex flex-col justify-between p-6 sm:p-8 md:p-12 relative z-10 overflow-y-auto transition-colors duration-300">
                
                {/* Mobile-only background mesh decoration */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse lg:hidden" />
                
                {/* Floating Theme Toggle */}
                <div className="flex justify-end items-center w-full relative z-20 mb-4 lg:mb-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    >
                        {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </Button>
                </div>

                {/* Main Content Form Card */}
                <div className="max-w-xl w-full mx-auto my-auto pt-6 pb-6 relative z-10">
                    {/* Mobile-Only Logo */}
                    <div className="flex flex-col items-center text-center lg:hidden mb-6">
                        <PlacifyLogo iconClassName="text-primary w-10 h-10" textClassName="h-6" />
                    </div>

                    <div className="text-center mb-6 lg:text-left">
                        <h1 className="text-3xl font-heading font-bold text-foreground">Welcome to Placify</h1>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                            {signupRole === 'student' ? 'Complete your details for Placement Admin Approval' : 'Complete your Recruiter Profile'}
                        </p>
                    </div>

                    {isSubmitted ? (
                        <Card className="border border-border/80 bg-card/75 backdrop-blur-xl shadow-xl rounded-2xl p-8 text-center space-y-6 relative overflow-hidden animate-scale-in">
                            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                                <Check className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Your details have been successfully sent to the Placement Officer.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                                <Loader2 className="w-4 h-4 animate-spin animate-pulse" />
                                <span>Redirecting to Awaiting Review panel...</span>
                            </div>
                        </Card>
                    ) : signupRole === 'student' ? (
                        <Card className="border border-border/80 bg-card/75 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
                            
                            {/* Step Progress Bar */}
                            <div className="px-6 pt-6 pb-2 border-b border-border/40">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        Step {studentStep} of 2
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {studentStep === 1 && 'Personal Details'}
                                        {studentStep === 2 && 'Academic Details'}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                                        style={{ width: `${(studentStep / 2) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-5">
                                {studentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 text-xs text-primary flex gap-2">
                                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <p>These verification details will be reviewed and approved by the Placement Officer (SubAdmin) to activate your account.</p>
                                        </div>

                                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/10">
                                            <div className="relative group">
                                                <div className="w-20 h-20 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden">
                                                    {profilePhotoUrl ? (
                                                        <img src={profilePhotoUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-10 h-10 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity text-white text-[10px] font-semibold text-center p-1">
                                                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={e => handleFileUpload(e, 'photo')}
                                                        disabled={uploadingPhoto}
                                                    />
                                                </label>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold">Profile Photo</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">Please upload a formal profile photo for placement cards.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Full Name *</Label>
                                            <Input
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="John Doe"
                                                className={cn(touched.name && errors.name && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {touched.name && errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Personal Email Address *</Label>
                                            <Input
                                                value={personalEmail}
                                                onChange={e => setPersonalEmail(e.target.value)}
                                                placeholder="john.doe@gmail.com"
                                                className={cn(touched.personalEmail && errors.personalEmail && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {touched.personalEmail && errors.personalEmail && <p className="text-xs text-destructive">{errors.personalEmail}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="+91 9876543210"
                                                className={cn(touched.phone && errors.phone && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {touched.phone && errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                                        </div>
                                    </div>
                                )}

                                {studentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label>Registration / University Roll Number *</Label>
                                            <Input
                                                value={registrationNumber}
                                                onChange={e => setRegistrationNumber(e.target.value)}
                                                placeholder="e.g. 2021CSE102"
                                                className={cn(touched.registrationNumber && errors.registrationNumber && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {touched.registrationNumber && errors.registrationNumber && <p className="text-xs text-destructive">{errors.registrationNumber}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <Label>College Email Address *</Label>
                                            <Input
                                                value={collegeEmail}
                                                onChange={e => setCollegeEmail(e.target.value)}
                                                placeholder="name@university.edu"
                                                className={cn(touched.collegeEmail && errors.collegeEmail && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {touched.collegeEmail && errors.collegeEmail && <p className="text-xs text-destructive">{errors.collegeEmail}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Course</Label>
                                                <Select value={course} onValueChange={setCourse}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA', 'BBA', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Branch</Label>
                                                <Select value={branch} onValueChange={setBranch}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AI', 'DS', 'Other'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Current Year</Label>
                                                <Select value={year} onValueChange={setYear}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {['1', '2', '3', '4'].map(y => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Expected Graduation Year</Label>
                                                <Input
                                                    type="number"
                                                    value={graduationYear}
                                                    onChange={e => setGraduationYear(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {submitError && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                        ⚠️ {submitError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    {studentStep > 1 && (
                                        <Button variant="outline" onClick={handlePrevStep} className="flex-1">
                                            Back
                                        </Button>
                                    )}
                                    {studentStep < 2 ? (
                                        <Button className="flex-1" onClick={handleNextStep}>
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button className="flex-1" onClick={handleComplete} disabled={submitting}>
                                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing...</> : 'Submit details'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border border-border/80 bg-card/75 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
                            <CardHeader>
                                <CardTitle>Your Details</CardTitle>
                                <CardDescription>Fill in your information to create your Recruiter account</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Full Name *</Label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label>Company Name *</Label>
                                    <Input
                                        value={company}
                                        onChange={e => setCompany(e.target.value)}
                                        placeholder="Google, Microsoft..."
                                    />
                                </div>

                                {submitError && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                        ⚠️ {submitError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button className="w-full" onClick={handleComplete} disabled={submitting}>
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Complete Signup'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer legal */}
                <div className="relative z-10 text-[10.5px] text-muted-foreground/80 flex justify-between pt-6 border-t border-border/40 mt-6 max-w-xl w-full mx-auto">
                    <span>© {new Date().getFullYear()} Placify Portal</span>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> SSL Encrypted Connection</span>
                </div>
            </div>
        </div>
    );
}

