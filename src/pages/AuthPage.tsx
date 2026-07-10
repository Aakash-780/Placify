import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PlacifyLogo from '@/components/ui/PlacifyLogo';
import { insforge } from '@/lib/insforge';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Search,
  CheckCircle, ArrowRight, BookOpen, GraduationCap, Cpu, ShieldCheck, AlertCircle, Sun, Moon,
  Building2, Upload, Globe, ChevronLeft, ChevronRight, Check, AlertTriangle, FileText, Download, ShieldAlert, BadgeCheck, Building, Shield
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sha256, encryptPassword } from '@/utils/crypto';

const SLIDES = [
  {
    title: "Smart Placement Portal",
    desc: "Cross-reference live job requirements against your academic profile. Filter by CGPA, branch, and active backlog criteria automatically.",
    badge: "Database Eligibility Checking",
    color: "from-blue-500/20 to-cyan-500/20",
    element: (
      <div className="border rounded-xl bg-card/75 backdrop-blur-sm p-4 space-y-3 font-sans text-left text-xs border-border/80 shadow-md">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-semibold text-foreground">LIVE ELIGIBILITY</span>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] hover:bg-emerald-500/10">Eligible ✅</Badge>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between"><span>CGPA Target:</span> <strong className="text-foreground font-semibold">8.5 / 10.0</strong></div>
          <div className="flex justify-between"><span>Active Backlogs:</span> <strong className="text-foreground font-semibold">0 Allowed</strong></div>
          <div className="flex justify-between"><span>Branches:</span> <strong className="text-foreground font-semibold">CSE, ECE</strong></div>
        </div>
      </div>
    )
  },
  {
    title: "AI ATS Resume Grader",
    desc: "Grade your resumes against structural benchmarks. Highlight keywords, inject improvements, and optimize your overall scoring grade.",
    badge: "NLP Semantics Analyzer",
    color: "from-purple-500/20 to-pink-500/20",
    element: (
      <div className="border rounded-xl bg-card/75 backdrop-blur-sm p-4 flex items-center gap-4 text-left border-border/80 shadow-md">
        <div className="w-11 h-11 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-500">
          88%
        </div>
        <div className="space-y-0.5 text-xs">
          <strong className="text-foreground font-semibold">Resume Parsed Successfully</strong>
          <p className="text-[10px] text-muted-foreground">ATS formatting compliant</p>
        </div>
      </div>
    )
  },
  {
    title: "DSA & Code Simulator",
    desc: "Prep systematically for coding tests using target company problem sheets. Validate solutions in a secure execution sandbox.",
    badge: "Sandboxed Compiler Runtime",
    color: "from-emerald-500/20 to-teal-500/20",
    element: (
      <div className="border rounded-xl bg-[#0c0c0c] p-3 text-left font-mono text-[10px] text-emerald-400 border-slate-800 shadow-md">
        <span className="text-slate-500">// solution.js execution</span> <br />
        <span className="text-slate-300">✔ Test Case 1 Passed ("hello" {"->"} "olleh")</span> <br />
        <span className="text-emerald-400 font-bold">🎉 All 3 test cases completed successfully!</span>
      </div>
    )
  }
];

export default function AuthPage() {
  const navigate = useNavigate();
  const rightColRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');

  // Multi-tenant States
  const [orgCode, setOrgCode] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [intendedRole, setIntendedRole] = useState<'student' | 'recruiter' | 'organization'>('student');
  const [collegeId, setCollegeId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Organization Onboarding States
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isEditingResubmission, setIsEditingResubmission] = useState(false);
  const [resubmitRequestId, setResubmitRequestId] = useState('');


  const [orgForm, setOrgForm] = useState({
    // Section 1: Org Info
    name: '',
    type: 'University',
    website: '',
    email: '',
    phone: '',
    altPhone: '',
    country: 'India',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    gstNumber: '',
    regNumber: '',
    accreditation: 'UGC',
    logoUrl: '',

    // Section 2: Primary Contact
    contactName: '',
    contactDesignation: '',
    contactEmail: '',
    contactPhone: '',

    // Section 3: Primary Admin
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    adminConfirmPassword: '',

    // Section 4: Placement Details
    studentStrength: '',
    recruiterStrength: '',
    placementOfficerName: '',
    placementCellEmail: '',
    placementCellPhone: '',
    expectedCompanies: '',

    // Section 5: Documents (Urls)
    regCertUrl: '',
    govApprUrl: '',
    acercCertUrl: '',
    gstCertUrl: '',

    // Section 6: Terms
    certifyCorrect: false,
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  // Status check states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusRole, setStatusRole] = useState<'organization' | 'student' | 'recruiter'>('organization');
  const [statusEmail, setStatusEmail] = useState('');
  const [statusPassword, setStatusPassword] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState('');

  // Searchable Organization Selector States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchCacheRef = useRef<Record<string, any[]>>({});
  const selectedOrgNameRef = useRef<string>('');
  const orgSelectorRef = useRef<HTMLDivElement>(null);

  // Auto transition slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('placify_onboarding_draft');
    if (saved) {
      try {
        const { form, code, step } = JSON.parse(saved);
        if (form) setOrgForm(form);
        if (code) setGeneratedCode(code);
        if (step) setOnboardingStep(step);
      } catch (e) {
        console.error("Error loading onboarding draft:", e);
      }
    }
  }, []);

  // Save draft whenever form details change
  useEffect(() => {
    if (intendedRole === 'organization') {
      localStorage.setItem('placify_onboarding_draft', JSON.stringify({
        form: orgForm,
        code: generatedCode,
        step: onboardingStep
      }));
    }
  }, [orgForm, generatedCode, onboardingStep, intendedRole]);

  // Scroll right column to top when error is set to make sure it is visible
  useEffect(() => {
    if (error && rightColRef.current) {
      rightColRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Hashing and domain validation helpers
  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return null;
  };

  const validateOfficialEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleOrgNameBlur = () => {
    if (orgForm.name.trim()) {
      generateAndCheckCode(orgForm.name.trim());
    }
  };

  const generateAndCheckCode = async (orgName: string) => {
    if (!orgName.trim()) {
      setGeneratedCode('');
      return;
    }
    const words = orgName.split(/[\s\-_,\.]+/)
      .map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase())
      .filter(Boolean);

    let prefix = '';
    if (words.length >= 3) {
      prefix = words[0][0] + words[1][0] + words[2][0];
    } else if (words.length === 2) {
      prefix = words[0][0] + words[1][0] + 'X';
    } else if (words.length === 1) {
      const single = words[0];
      if (single.length >= 3) {
        prefix = single.substring(0, 3);
      } else if (single.length === 2) {
        prefix = single + 'X';
      } else if (single.length === 1) {
        prefix = single + 'XX';
      } else {
        prefix = 'ORG';
      }
    } else {
      prefix = 'ORG';
    }

    let isUnique = false;
    let code = '';
    let attempts = 0;

    while (!isUnique && attempts < 15) {
      attempts++;
      const chars = '0123456789';
      let suffix = '';
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `${prefix}${suffix}`;

      try {
        const { count: orgCount } = await insforge.database
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('code', code);

        const { count: reqCount } = await insforge.database
          .from('organization_requests')
          .select('*', { count: 'exact', head: true })
          .eq('generated_org_code', code);

        if (orgCount === 0 && reqCount === 0) {
          isUnique = true;
        }
      } catch (e) {
        console.error("Code check failed:", e);
        isUnique = true;
      }
    }
    setGeneratedCode(code);
  };

  const handleFileUpload = async (field: string, bucket: string, file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (file.size > maxSize) {
      setUploadError(prev => ({ ...prev, [field]: 'File size exceeds 5MB limit.' }));
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setUploadError(prev => ({ ...prev, [field]: 'Only PDF, PNG, and JPEG files are allowed.' }));
      return;
    }

    setUploadError(prev => ({ ...prev, [field]: '' }));
    setUploadProgress(prev => ({ ...prev, [field]: 10 }));

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[field] || 0;
        if (current >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [field]: current + 15 };
      });
    }, 150);

    try {
      const storagePath = `org-onboarding/${Date.now()}_${file.name}`;
      const { data, error } = await insforge.storage.from(bucket).upload(storagePath, file);

      clearInterval(progressInterval);
      if (error) throw error;

      const urlResult = insforge.storage.from(bucket).getPublicUrl(storagePath);
      // getPublicUrl returns { data: { publicUrl: string } } — extract the string
      const fileUrl: string =
        (urlResult as any)?.data?.publicUrl ||
        (urlResult as any)?.publicUrl ||
        (urlResult as any)?.data?.url ||
        String(urlResult);

      setUploadProgress(prev => ({ ...prev, [field]: 100 }));
      setOrgForm(prev => ({ ...prev, [field]: fileUrl }));

      if (field === 'logo') {
        setOrgForm(prev => ({ ...prev, logoUrl: fileUrl }));
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      setUploadError(prev => ({ ...prev, [field]: err.message || 'Upload failed. Please try again.' }));
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setStatusResult(null);
    setStatusLoading(true);

    try {
      if (statusRole === 'organization') {
        const { data, error } = await insforge.database
          .from('organization_requests')
          .select('*')
          .eq('admin_email', statusEmail.trim())
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setStatusError('No onboarding request found with this admin email.');
          setStatusLoading(false);
          return;
        }

        const inputHash = await sha256(statusPassword);
        if (inputHash !== data.password_hash) {
          setStatusError('Invalid credentials. Password check failed.');
          setStatusLoading(false);
          return;
        }

        setStatusResult({
          role: 'organization',
          status: data.status,
          organization_name: data.organization_name,
          generated_org_code: data.generated_org_code,
          submitted_at: data.submitted_at,
          remarks: data.remarks
        });
      } else {
        // Authenticate student/recruiter via GoTrue first to verify ownership
        const { data: authData, error: authErr } = await insforge.auth.signInWithPassword({
          email: statusEmail.trim(),
          password: statusPassword
        });

        if (authErr) {
          throw new Error(authErr.message || 'Invalid email or password.');
        }

        if (!authData?.user) {
          throw new Error('Could not verify account profile ownership.');
        }

        if (statusRole === 'student') {
          const { data: student, error: stdErr } = await insforge.database
            .from('students')
            .select('status, name, college_id, created_at, organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (stdErr) throw stdErr;
          if (!student) {
            throw new Error('Student registration profile record not found.');
          }

          let orgName = 'Independent User';
          if (student.organization_id) {
            const { data: org } = await insforge.database
              .from('organizations')
              .select('name')
              .eq('id', student.organization_id)
              .maybeSingle();
            if (org) orgName = org.name;
          }

          setStatusResult({
            role: 'student',
            status: student.status,
            name: student.name,
            organization_name: orgName,
            generated_org_code: student.college_id || 'N/A',
            submitted_at: student.created_at
          });
        } else if (statusRole === 'recruiter') {
          const { data: recruiter, error: recErr } = await insforge.database
            .from('recruiters')
            .select('verification_status, name, company, created_at, organization_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (recErr) throw recErr;
          if (!recruiter) {
            throw new Error('Recruiter registration profile record not found.');
          }

          let orgName = 'Independent Recruiter';
          if (recruiter.organization_id) {
            const { data: org } = await insforge.database
              .from('organizations')
              .select('name')
              .eq('id', recruiter.organization_id)
              .maybeSingle();
            if (org) orgName = org.name;
          }

          setStatusResult({
            role: 'recruiter',
            status: recruiter.verification_status,
            name: recruiter.name,
            organization_name: orgName,
            generated_org_code: recruiter.company || 'N/A',
            submitted_at: recruiter.created_at
          });
        }

        // Always log out immediately so check doesn't pollute session state
        await insforge.auth.signOut();
      }
    } catch (err: any) {
      setStatusError(err.message || 'Status check failed.');
      try {
        await insforge.auth.signOut();
      } catch { }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEditResubmissionRequest = (req: any) => {
    setOrgForm({
      name: req.organization_name,
      type: req.organization_type,
      website: req.website || '',
      email: req.organization_email,
      phone: req.contact_phone || '',
      altPhone: req.alternate_phone || '',
      country: req.country || 'India',
      state: req.state || '',
      city: req.city || '',
      address: req.address || '',
      postalCode: req.postal_code || '',
      gstNumber: req.gst_number || '',
      regNumber: req.registration_number,
      accreditation: req.accreditation || 'UGC',
      logoUrl: req.logo_url || '',

      contactName: req.primary_contact_name || '',
      contactDesignation: req.primary_contact_designation || '',
      contactEmail: req.primary_contact_email || '',
      contactPhone: req.primary_contact_phone || '',

      adminName: req.admin_name || '',
      adminEmail: req.admin_email,
      adminPhone: req.admin_phone || '',
      adminPassword: '', // do not display
      adminConfirmPassword: '',

      studentStrength: req.student_strength ? String(req.student_strength) : '',
      recruiterStrength: '',
      placementOfficerName: req.placement_officer || '',
      placementCellEmail: req.placement_email || '',
      placementCellPhone: req.placement_phone || '',
      expectedCompanies: req.expected_companies || '',

      regCertUrl: req.registration_certificate || '',
      govApprUrl: req.government_certificate || '',
      acercCertUrl: req.accreditation_certificate || '',
      gstCertUrl: req.gst_certificate || '',

      certifyCorrect: true,
      agreeTerms: true,
      agreePrivacy: true,
    });
    setGeneratedCode(req.generated_org_code);
    setIsEditingResubmission(true);
    setResubmitRequestId(req.id);
    setOnboardingStep(1);
    setIntendedRole('organization');
    setShowStatusModal(false);
  };

  // Handle click outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgSelectorRef.current && !orgSelectorRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search Query handler (Debounced and Cached)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const trimmedQuery = searchQuery.trim().toLowerCase();

    // Check if the query matches the currently selected organization name to prevent triggering requests
    if (selectedOrgId && searchQuery === selectedOrgNameRef.current) {
      return;
    }

    // Check Cache
    if (searchCacheRef.current[trimmedQuery]) {
      setSearchResults(searchCacheRef.current[trimmedQuery]);
      setShowSuggestions(true);
      return;
    }

    setSearchLoading(true);

    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`/api/organizations/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.status === 429) {
          setError('Too many requests. Please slow down.');
          setSearchLoading(false);
          return;
        }
        const data = await response.json();

        // Cache the result
        searchCacheRef.current[trimmedQuery] = data;
        setSearchResults(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to search organizations:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, selectedOrgId]);

  // Keyboard navigation & handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < searchResults.length) {
        selectOrg(searchResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const selectOrg = (org: any) => {
    setSelectedOrgId(org.id);
    const orgNameStr = `${org.name} (${org.code})`;
    selectedOrgNameRef.current = orgNameStr;
    setSearchQuery(orgNameStr);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setError('');
  };

  async function handleResendCode() {
    if (!email.trim()) {
      setError('Please enter your email to resend the code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const { error: resendErr } = await insforge.auth.resendVerificationEmail({
        email: email.trim()
      });
      if (resendErr) throw resendErr;
      setSuccessMsg('Verification email resent successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  }

  const handleOrganizationSubmit = async () => {
    setError('');
    setSuccessMsg('');

    if (!orgForm.certifyCorrect || !orgForm.agreeTerms || !orgForm.agreePrivacy) {
      setError('Please certify accuracy and agree to terms & privacy policy.');
      return;
    }

    if (!orgForm.name.trim() || !orgForm.email.trim() || !orgForm.phone.trim() || !orgForm.logoUrl || !orgForm.contactEmail.trim() || !orgForm.contactName.trim()) {
      setError('All required fields must be populated.');
      return;
    }

    if (!validateOfficialEmail(orgForm.email)) {
      setError('Please enter a valid organization email address.');
      return;
    }
    if (!validateOfficialEmail(orgForm.contactEmail)) {
      setError('Please enter a valid primary contact email address.');
      return;
    }

    if (!isEditingResubmission) {
      const passErr = validatePassword(orgForm.adminPassword);
      if (passErr) {
        setError(passErr);
        return;
      }
      if (orgForm.adminPassword !== orgForm.adminConfirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Uniqueness checks
      const { count: orgNameCount } = await insforge.database
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .ilike('name', orgForm.name.trim());
      const { count: reqNameCount } = await insforge.database
        .from('organization_requests')
        .select('*', { count: 'exact', head: true })
        .neq('id', isEditingResubmission ? resubmitRequestId : '00000000-0000-0000-0000-000000000000')
        .neq('status', 'Rejected')
        .ilike('organization_name', orgForm.name.trim());
      if (orgNameCount > 0 || reqNameCount > 0) {
        throw new Error('An organization with this name already exists or onboarding is in progress.');
      }

      if (orgForm.website.trim()) {
        const { count: orgWebCount } = await insforge.database
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('website', orgForm.website.trim());
        const { count: reqWebCount } = await insforge.database
          .from('organization_requests')
          .select('*', { count: 'exact', head: true })
          .neq('id', isEditingResubmission ? resubmitRequestId : '00000000-0000-0000-0000-000000000000')
          .neq('status', 'Rejected')
          .eq('website', orgForm.website.trim());
        if (orgWebCount > 0 || reqWebCount > 0) {
          throw new Error('An organization with this website is already registered or requested.');
        }
      }

      // Check if organization email is already requested
      const { count: reqOrgEmailCount } = await insforge.database
        .from('organization_requests')
        .select('*', { count: 'exact', head: true })
        .neq('id', isEditingResubmission ? resubmitRequestId : '00000000-0000-0000-0000-000000000000')
        .neq('status', 'Rejected')
        .eq('organization_email', orgForm.email.trim());
      if (reqOrgEmailCount > 0) {
        throw new Error('This organization email address is already associated with an onboarding request in progress.');
      }

      const { count: adminEmailCount } = await insforge.database
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('email', orgForm.contactEmail.trim());
      const { count: reqAdminEmailCount } = await insforge.database
        .from('organization_requests')
        .select('*', { count: 'exact', head: true })
        .neq('id', isEditingResubmission ? resubmitRequestId : '00000000-0000-0000-0000-000000000000')
        .neq('status', 'Rejected')
        .eq('admin_email', orgForm.contactEmail.trim());
      if (adminEmailCount > 0 || reqAdminEmailCount > 0) {
        throw new Error('An admin account or onboarding request is already using this admin email address.');
      }

      let passHash = '';
      let passEnc = '';
      if (orgForm.adminPassword) {
        passHash = await sha256(orgForm.adminPassword);
        passEnc = encryptPassword(orgForm.adminPassword);
      }

      const payload: any = {
        organization_name: orgForm.name.trim(),
        generated_org_code: generatedCode,
        organization_type: orgForm.type,
        website: orgForm.website.trim() || null,
        organization_email: orgForm.email.trim(),
        contact_phone: orgForm.phone.trim() || null,
        alternate_phone: null,
        country: null,
        state: null,
        city: null,
        address: null,
        postal_code: null,
        gst_number: null,
        registration_number: 'REG-' + generatedCode,
        accreditation: null,
        logo_url: orgForm.logoUrl || null,

        primary_contact_name: orgForm.contactName.trim() || null,
        primary_contact_designation: orgForm.contactDesignation.trim() || null,
        primary_contact_email: orgForm.contactEmail.trim() || null,
        primary_contact_phone: orgForm.contactPhone.trim() || null,

        admin_name: orgForm.contactName.trim() || null,
        admin_email: orgForm.contactEmail.trim(),
        admin_phone: orgForm.contactPhone.trim() || null,

        student_strength: null,
        placement_officer: null,
        placement_email: null,
        placement_phone: null,
        expected_companies: null,

        registration_certificate: orgForm.regCertUrl || null,
        government_certificate: null,
        accreditation_certificate: null,
        gst_certificate: orgForm.gstCertUrl || null,
        status: 'Pending',
        remarks: null,
      };

      if (passHash && passEnc) {
        payload.password_hash = passHash;
        payload.temp_password = passEnc;
      }

      if (isEditingResubmission) {
        payload.submitted_at = new Date().toISOString();
        const { error: resubErr } = await insforge.database
          .from('organization_requests')
          .update(payload)
          .eq('id', resubmitRequestId);
        if (resubErr) throw resubErr;
        setSuccessMsg('Onboarding request resubmitted successfully! Platform Owner will review your changes.');
      } else {
        const { error: insertErr } = await insforge.database
          .from('organization_requests')
          .insert([payload]);
        if (insertErr) throw insertErr;
        setSuccessMsg('Onboarding request submitted successfully! Your credentials will be active after approval.');
      }

      localStorage.removeItem('placify_onboarding_draft');
      setIsEditingResubmission(false);
      setResubmitRequestId('');
      setOnboardingStep(1);
      setGeneratedCode('');
      setOrgForm({
        name: '', type: 'University', website: '', email: '', phone: '', altPhone: '',
        country: 'India', state: '', city: '', address: '', postalCode: '', gstNumber: '',
        regNumber: '', accreditation: 'UGC', logoUrl: '',
        contactName: '', contactDesignation: '', contactEmail: '', contactPhone: '',
        adminName: '', adminEmail: '', adminPhone: '', adminPassword: '', adminConfirmPassword: '',
        studentStrength: '', recruiterStrength: '', placementOfficerName: '', placementCellEmail: '',
        placementCellPhone: '', expectedCompanies: '', regCertUrl: '', govApprUrl: '',
        acercCertUrl: '', gstCertUrl: '', certifyCorrect: false, agreeTerms: false, agreePrivacy: false
      });

      setTimeout(() => {
        setMode('signin');
        setSuccessMsg('');
      }, 5000);
    } catch (err: any) {
      let friendlyError = err.message || 'Onboarding submission failed. Please verify inputs and try again.';
      if (typeof friendlyError === 'string') {
        if (friendlyError.includes('organization_requests_organization_email_key')) {
          friendlyError = 'An onboarding request has already been submitted for this organization email. Please check your existing request status.';
        } else if (friendlyError.includes('organization_requests_admin_email_key')) {
          friendlyError = 'An onboarding request or admin account is already using this primary contact email address.';
        } else if (friendlyError.includes('organization_requests_generated_org_code_key')) {
          friendlyError = 'A code collision occurred. Please try submitting again to regenerate your tenant code.';
        } else if (friendlyError.includes('organization_requests_registration_number_key')) {
          friendlyError = 'This organization registration code is already registered.';
        } else if (friendlyError.includes('organization_requests_website_key')) {
          friendlyError = 'This organization website is already associated with another onboarding request.';
        }
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'verify') {
      if (!email.trim() || !verificationCode.trim()) {
        setError('Please enter your email and verification code.');
        return;
      }
    } else if (mode === 'signin') {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your credentials.');
        return;
      }
    } else {
      if (!selectedOrgId) {
        setError('Please select an Organization.');
        return;
      }
      if (intendedRole === 'student' && !collegeId.trim()) {
        setError('Please enter your College ID.');
        return;
      }
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'verify') {
        const { data: verifyData, error: verifyErr } = await insforge.auth.verifyEmail({
          email: email.trim(),
          otp: verificationCode.trim()
        });
        if (verifyErr) throw verifyErr;

        localStorage.setItem('placify_session_active', 'true');
        setSuccessMsg('Email verified successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else if (mode === 'signin') {
        let resolvedEmail = email.trim();
        let orgId = '';

        // Platform Owner bypass
        if (resolvedEmail === 'sahilsrivastava8962@gmail.com') {
          const { error: err } = await insforge.auth.signInWithPassword({ email: resolvedEmail, password });
          if (err?.message) throw err;
          localStorage.setItem('placify_session_active', 'true');
          localStorage.removeItem('placify_organization_id');
          window.location.href = '/dashboard';
          return;
        }

        // CRITICAL: Clear any stale organization_id from a previous session BEFORE
        // queries run so the databaseProxy doesn't inject a wrong org filter.
        localStorage.removeItem('placify_organization_id');

        // Resolve the organization for this email/college_id using a SECURITY DEFINER
        // RPC function. Direct table queries (admins/recruiters/students) are blocked by
        // RLS for unauthenticated users — auth.uid() is null pre-login — so they always
        // return empty. The RPC function runs with elevated DB privileges and bypasses RLS.
        const { data: orgMatches, error: orgLookupErr } = await insforge.database.rpc(
          'resolve_user_org_by_email',
          { p_email: resolvedEmail }
        );

        console.log('[AUTH DEBUG] resolve_user_org_by_email RPC result:', {
          email: resolvedEmail,
          orgMatches,
          orgLookupErr,
        });

        if (orgLookupErr) throw orgLookupErr;

        if (orgMatches && orgMatches.length > 0) {
          orgId = orgMatches[0].organization_id;
        }

        if (!orgId) {
          setError('No account found for this email address or College ID. Please check your credentials or contact your administrator.');
          setLoading(false);
          return;
        }

        // Check if organization is suspended
        const { data: org, error: orgErr } = await insforge.database
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .maybeSingle();

        if (orgErr || !org) {
          setError('Organization not found.');
          setLoading(false);
          return;
        }

        if (org.status === 'Suspended') {
          setError('This organization has been suspended by Placify.');
          setLoading(false);
          return;
        }

        orgId = org.id;

        // ─── DEBUG: Login Trace ────────────────────────────────────────────────
        const storedOrgId = localStorage.getItem('placify_organization_id');
        console.log('[AUTH DEBUG] Login trace:', {
          enteredOrgCode: org?.code,
          resolvedOrg: org,
          resolvedOrgId: orgId,
          storedOrgId,
          storedOrgIdMismatch: storedOrgId !== null && storedOrgId !== orgId,
          email: resolvedEmail,
        });
        // ──────────────────────────────────────────────────────────────────────

        // FIX: Clear stale organization_id from localStorage BEFORE user-lookup
        // queries so the multi-tenant Proxy does not inject a conflicting
        // organization_id filter that makes all lookups return null.
        // The correct orgId is set again after successful signIn (line ~269).
        localStorage.removeItem('placify_organization_id');

        // Resolve user in organization (handles both email and college_id logins via RPC to bypass RLS)
        const { data: matchedUsers, error: lookupErr } = await insforge.database.rpc('check_user_exists_in_org', {
          p_email: resolvedEmail,
          p_org_id: orgId
        });

        console.log('[AUTH DEBUG] User check in organization via RPC:', {
          orgId,
          query: resolvedEmail,
          matchedUsers,
          lookupErr
        });

        const isEmail = resolvedEmail.includes('@');
        const hasMatch = Array.isArray(matchedUsers) && matchedUsers.length > 0;

        if (lookupErr || !hasMatch) {
          if (!isEmail) {
            setError('Student with this College ID not found in this organization.');
          } else {
            setError('Account not found in this organization.');
          }
          setLoading(false);
          return;
        }

        const matchedUser = (matchedUsers as any[])[0];
        resolvedEmail = matchedUser.resolved_email;

        // Call InsForge Auth with resolved email
        const { error: err } = await insforge.auth.signInWithPassword({ email: resolvedEmail, password });
        if (err?.message) throw err;

        // Cache the active organization ID and clear stale signup keys so they
        // cannot contaminate role resolution for any user logging in on this browser.
        localStorage.setItem('placify_session_active', 'true');
        localStorage.setItem('placify_organization_id', orgId);
        localStorage.removeItem('signup_role');
        localStorage.removeItem('signup_organization_id');
        localStorage.removeItem('signup_college_id');
        window.location.href = '/dashboard';
      } else {
        // Mode is signup
        // Call InsForge Auth signUp
        const { data: signUpData, error: err } = await insforge.auth.signUp({ email: email.trim(), password });
        if (err?.message) throw err;

        // Cache details in localStorage for RoleSelection.tsx
        localStorage.setItem('signup_organization_id', selectedOrgId);
        localStorage.setItem('signup_role', intendedRole);
        localStorage.setItem('placify_organization_id', selectedOrgId);
        if (intendedRole === 'student') {
          localStorage.setItem('signup_college_id', collegeId.trim());
        } else {
          localStorage.removeItem('signup_college_id');
        }

        // Create placeholder database record immediately so validation check on login passes!
        const userId = signUpData?.user?.id;
        if (userId) {
          const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
          if (intendedRole === 'student') {
            await insforge.database.from('students').insert([{
              user_id: userId,
              name: email.trim().split('@')[0],
              email: email.trim(),
              cgpa: 0,
              backlogs: 0,
              placement_status: 'not_placed',
              account_status: 'Pending',
              status: 'pending',
              verification_status: 'Pending',
              otp: otpCode,
              organization_id: selectedOrgId,
              college_id: collegeId.trim() || null,
              profile_completed: false
            }]);
          } else if (intendedRole === 'recruiter') {
            await insforge.database.from('recruiters').insert([{
              user_id: userId,
              name: email.trim().split('@')[0],
              email: email.trim(),
              status: 'Pending',
              verification_status: 'Pending',
              otp: otpCode,
              organization_id: selectedOrgId,
              profile_completed: false
            }]);
          }
        }

        if (signUpData?.requireEmailVerification) {
          setSuccessMsg('Account created! Please check your email for the 6-digit verification code.');
          setMode('verify');
        } else {
          setSuccessMsg('Account created successfully! Please sign in.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.error || JSON.stringify(err);
      if (mode === 'verify') {
        if (msg?.toLowerCase().includes('invalid') || msg?.toLowerCase().includes('expired') || msg?.toLowerCase().includes('otp') || msg?.toLowerCase().includes('code')) {
          setError('Invalid or expired verification code. Please try again.');
        } else {
          setError(msg || 'Verification failed. Please try again.');
        }
      } else {
        if (msg?.toLowerCase().includes('invalid') || msg?.toLowerCase().includes('credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (msg?.toLowerCase().includes('already') || msg?.toLowerCase().includes('exist')) {
          setError('An account with this email already exists. Please sign in instead.');
          setMode('signin');
        } else if (msg?.toLowerCase().includes('confirm') || msg?.toLowerCase().includes('verify') || msg?.toLowerCase().includes('not verified') || msg?.toLowerCase().includes('not confirmed')) {
          setSuccessMsg('Email is not verified. Enter the 6-digit verification code below.');
          setMode('verify');
        } else {
          setError(msg || 'Something went wrong. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Render Searchable Organization Selector
  const renderOrgSelector = (idPrefix: string) => {
    return (
      <div ref={orgSelectorRef} className="space-y-1.5 relative">
        <Label htmlFor={`${idPrefix}Org`} className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
          Organization
        </Label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 z-10" />
          <Input
            id={`${idPrefix}Org`}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedOrgId(''); // Clear selection on type
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchQuery.trim().length >= 3) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search your university/organization..."
            className="pl-10 pr-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm w-full"
            autoComplete="off"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          )}
        </div>

        {/* Suggestion list */}
        {showSuggestions && searchQuery.trim().length >= 3 && (
          <div className="absolute left-0 right-0 z-50 mt-1 bg-popover/95 backdrop-blur-md border border-border/85 rounded-xl shadow-lg max-h-56 overflow-y-auto font-sans">
            {searchResults.length > 0 ? (
              <ul className="py-1.5">
                {searchResults.map((org, index) => {
                  const isSelected = selectedOrgId === org.id;
                  const isActive = activeIndex === index;
                  return (
                    <li
                      key={org.id}
                      onClick={() => selectOrg(org)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${isSelected
                        ? 'bg-primary/20 text-primary'
                        : isActive
                          ? 'bg-muted/60 text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{org.name}</span>
                        <span className="text-[10px] opacity-60 font-sans">({org.code})</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              !searchLoading && (
                <div className="px-4 py-3 text-xs font-bold text-rose-500/80 leading-relaxed bg-rose-500/5">
                  No organization found. Contact your organization administrator.
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const handleNextStep = () => {
    setError('');
    if (onboardingStep === 1) {
      if (!orgForm.name.trim() || !orgForm.email.trim() || !orgForm.phone.trim()) {
        setError('Please populate all required organization fields.');
        return;
      }
      if (!orgForm.logoUrl) {
        setError('Organization logo is required.');
        return;
      }
      if (!validateOfficialEmail(orgForm.email)) {
        setError('Please enter a valid organization email address.');
        return;
      }
      if (!generatedCode) {
        setError('Generating organization code, please stand by...');
        generateAndCheckCode(orgForm.name);
        return;
      }
    } else if (onboardingStep === 2) {
      if (!orgForm.contactName.trim() || !orgForm.contactDesignation.trim() || !orgForm.contactEmail.trim() || !orgForm.contactPhone.trim()) {
        setError('Please fill in all primary contact and admin fields.');
        return;
      }
      if (!validateOfficialEmail(orgForm.contactEmail)) {
        setError('Please enter a valid official email address.');
        return;
      }
      if (!isEditingResubmission) {
        const passErr = validatePassword(orgForm.adminPassword);
        if (passErr) {
          setError(passErr);
          return;
        }
        if (orgForm.adminPassword !== orgForm.adminConfirmPassword) {
          setError('Passwords do not match.');
          return;
        }
      }
    }
    setOnboardingStep(prev => prev + 1);
  };

  const renderOrganizationWizard = () => {
    const stepsList = [
      { num: 1, label: 'Info' },
      { num: 2, label: 'Admin' },
      { num: 3, label: 'Documents' },
      { num: 4, label: 'Terms' }
    ];

    const isUploading = Object.values(uploadProgress).some(p => p > 0 && p < 100);

    return (
      <div className="space-y-6 font-sans">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b pb-4 border-border/60">
          <div className="flex gap-2 items-center">
            <Building className="w-5 h-5 text-primary" />
            <span className="text-sm font-extrabold text-foreground font-heading">
              {isEditingResubmission ? 'Resubmit Onboarding' : 'Organization Setup'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Draft saved locally
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative flex items-center justify-between px-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((onboardingStep - 1) / 3) * 100}%` }}
          />
          {stepsList.map(step => (
            <button
              key={step.num}
              type="button"
              disabled={step.num > onboardingStep && !isEditingResubmission}
              onClick={() => { setError(''); setOnboardingStep(step.num); }}
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${onboardingStep === step.num
                ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-md shadow-primary/15'
                : onboardingStep > step.num
                  ? 'bg-background text-primary border-primary'
                  : 'bg-muted text-muted-foreground border-border'
                }`}
            >
              {step.num}
            </button>
          ))}
        </div>

        {/* STEP 1: ORGANIZATION DETAILS */}
        {onboardingStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="orgName" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgForm.name}
                  onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                  onBlur={handleOrgNameBlur}
                  placeholder="e.g. Manipal University Jaipur"
                  className="h-10 rounded-xl bg-background/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Organization Type *</Label>
                <Select
                  value={orgForm.type}
                  onValueChange={val => setOrgForm({ ...orgForm, type: val })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background/30 border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {['University', 'College', 'Institute', 'Training Center', 'Company', 'Government Organization', 'Other'].map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgWebsite" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="orgWebsite"
                    value={orgForm.website}
                    onChange={e => setOrgForm({ ...orgForm, website: e.target.value })}
                    placeholder="https://example.edu"
                    className="h-10 rounded-xl pl-9 bg-background/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="orgEmail" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Official Email *</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  value={orgForm.email}
                  onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                  placeholder="admin@university.edu"
                  className="h-10 rounded-xl bg-background/30"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="orgPhone" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Phone Number *</Label>
                <div className="flex h-10 rounded-xl overflow-hidden border border-input bg-background/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                  <span className="flex items-center px-3 text-xs font-bold text-muted-foreground bg-muted/40 border-r border-input select-none whitespace-nowrap">+91</span>
                  <input
                    id="orgPhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={orgForm.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setOrgForm({ ...orgForm, phone: val });
                    }}
                    placeholder="9876543210"
                    className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>



              {/* Unique Generated Code and Logo Upload */}
              <div className="space-y-1.5 col-span-2 border-t border-border/40 pt-4 mt-2">
                <Label className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground block">Organization Code (Auto-Generated)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    value={generatedCode || 'Provide name to generate code...'}
                    disabled
                    className="h-10 rounded-xl bg-muted/40 font-mono text-sm tracking-wider font-extrabold uppercase text-slate-400 border-border/80 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateAndCheckCode(orgForm.name)}
                    className="h-10 px-4 rounded-xl text-xs font-bold border-border/85"
                    disabled={!orgForm.name}
                  >
                    Regenerate
                  </Button>
                </div>
                <span className="text-[9px] text-muted-foreground">Unique code generated using prefix from org name and a random alphanumeric key.</span>
              </div>

              <div className="space-y-2 col-span-2 border-t border-border/40 pt-4">
                <Label className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Organization Logo *</Label>
                <div className="flex items-center gap-4">
                  {orgForm.logoUrl ? (
                    <div className="relative group border rounded-xl overflow-hidden w-16 h-16 border-border bg-white">
                      <img
                        src={orgForm.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                        onError={e => { (e.target as HTMLImageElement).src = ''; }}
                      />
                      <button
                        type="button"
                        onClick={() => setOrgForm({ ...orgForm, logoUrl: '', logo: '' } as any)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-border/80 flex items-center justify-center text-muted-foreground bg-muted/10">
                      <Building className="w-5 h-5 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        id="logoUploadInput"
                        onChange={e => e.target.files && handleFileUpload('logo', 'profile-images', e.target.files[0])}
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logoUploadInput')?.click()}
                        className="h-9 text-xs font-bold border-border"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        {orgForm.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {uploadProgress['logo'] !== undefined && uploadProgress['logo'] < 100 && uploadProgress['logo'] > 0 && (
                        <div className="text-[10px] mt-1 text-primary font-bold">Uploading: {uploadProgress['logo']}%</div>
                      )}
                      {uploadError['logo'] && (
                        <div className="text-[10px] mt-1 text-destructive font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {uploadError['logo']}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PRIMARY ADMIN & CONTACT DETAILS */}
        {onboardingStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-primary leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Primary Contact & Admin Account
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                This person will act as the primary contact and their account will be configured as the master administrator for your tenant organization dashboard upon approval.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Contact Person Name *</Label>
              <Input
                id="contactName"
                value={orgForm.contactName}
                onChange={e => setOrgForm({ ...orgForm, contactName: e.target.value })}
                placeholder="Full Name"
                className="h-10 rounded-xl bg-background/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactDesignation" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Designation *</Label>
              <Input
                id="contactDesignation"
                value={orgForm.contactDesignation}
                onChange={e => setOrgForm({ ...orgForm, contactDesignation: e.target.value })}
                placeholder="e.g. Dean of Placements, Coordinator"
                className="h-10 rounded-xl bg-background/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Official Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={orgForm.contactEmail}
                onChange={e => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                placeholder="name@university.edu"
                className="h-10 rounded-xl bg-background/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Phone Number *</Label>
              <div className="flex h-10 rounded-xl overflow-hidden border border-input bg-background/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                <span className="flex items-center px-3 text-xs font-bold text-muted-foreground bg-muted/40 border-r border-input select-none whitespace-nowrap">+91</span>
                <input
                  id="contactPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={orgForm.contactPhone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setOrgForm({ ...orgForm, contactPhone: val });
                  }}
                  placeholder="9000000001"
                  className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            {!isEditingResubmission && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPass" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Password *</Label>
                  <Input
                    id="adminPass"
                    type="password"
                    value={orgForm.adminPassword}
                    onChange={e => setOrgForm({ ...orgForm, adminPassword: e.target.value })}
                    placeholder="Enter strong password"
                    className="h-10 rounded-xl bg-background/30"
                    required
                  />
                  {orgForm.adminPassword && (
                    <div className="text-[9px] text-muted-foreground leading-tight space-y-1 bg-muted/20 border border-border/30 rounded-lg p-2 mt-1">
                      <div className="font-bold text-slate-500 uppercase">Enterprise Policy:</div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${orgForm.adminPassword.length >= 6 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span>Min. 6 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(orgForm.adminPassword) ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span>At least one uppercase character (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(orgForm.adminPassword) ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span>At least one lowercase character (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(orgForm.adminPassword) ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span>At least one numeric digit (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?\":{}|<>]/.test(orgForm.adminPassword) ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <span>At least one special character</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminConfirmPass" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Confirm Password *</Label>
                  <Input
                    id="adminConfirmPass"
                    type="password"
                    value={orgForm.adminConfirmPassword}
                    onChange={e => setOrgForm({ ...orgForm, adminConfirmPassword: e.target.value })}
                    placeholder="Verify password"
                    className="h-10 rounded-xl bg-background/30"
                    required
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: DOCUMENTS UPLOADER */}
        {onboardingStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-[11px] text-muted-foreground">
              Please upload verifying documents of the organization. Only PDF, PNG, and JPEG documents under 5MB are accepted. (All uploads are optional)
            </p>

            {[
              { id: 'regCertUrl', label: 'Registration Certificate (Optional)', fieldName: 'regCertUploadInput' },
              { id: 'gstCertUrl', label: 'GST Registration Certificate (Optional)', fieldName: 'gstCertUploadInput' }
            ].map(doc => (
              <div key={doc.id} className="p-3.5 border border-dashed rounded-xl bg-muted/5 space-y-2 border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{doc.label}</span>
                  {orgForm[doc.id as keyof typeof orgForm] && (
                    <span className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Uploaded
                    </span>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    id={doc.fieldName}
                    onChange={e => e.target.files && handleFileUpload(doc.id, 'certificates', e.target.files[0])}
                    accept="application/pdf, image/png, image/jpeg"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(doc.fieldName)?.click()}
                    className="h-8 text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload File
                  </Button>

                  {orgForm[doc.id as keyof typeof orgForm] && (
                    <a
                      href={orgForm[doc.id as keyof typeof orgForm] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary font-bold hover:underline truncate max-w-52"
                    >
                      View Uploaded Document
                    </a>
                  )}
                </div>

                {uploadProgress[doc.id] !== undefined && uploadProgress[doc.id] < 100 && uploadProgress[doc.id] > 0 && (
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress[doc.id]}%` }} />
                  </div>
                )}
                {uploadError[doc.id] && (
                  <div className="text-[10px] text-destructive font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {uploadError[doc.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: TERMS */}
        {onboardingStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-3.5 border rounded-2xl bg-slate-950/20 border-slate-800 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Legal Declarations & Authorizations
              </h4>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgForm.certifyCorrect}
                    onChange={e => setOrgForm({ ...orgForm, certifyCorrect: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded accent-primary border-slate-700 bg-background"
                  />
                  <span className="text-[11px] text-slate-400 font-medium leading-tight select-none">
                    I certify that all details, coordinates, and uploaded certificates provided in this onboarding request are correct and valid. *
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgForm.agreeTerms}
                    onChange={e => setOrgForm({ ...orgForm, agreeTerms: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded accent-primary border-slate-700 bg-background"
                  />
                  <span className="text-[11px] text-slate-400 font-medium leading-tight select-none">
                    I represent the college/institution placement cell and agree to the Placify Enterprise Terms of Service. *
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgForm.agreePrivacy}
                    onChange={e => setOrgForm({ ...orgForm, agreePrivacy: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded accent-primary border-slate-700 bg-background"
                  />
                  <span className="text-[11px] text-slate-400 font-medium leading-tight select-none">
                    I authorize Placify to audit the institution credentials and verify organization details per the Privacy Policy. *
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action CTA Buttons */}
        <div className="flex justify-between gap-3 border-t border-border/40 pt-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError('');
              if (onboardingStep > 1) {
                setOnboardingStep(prev => prev - 1);
              } else {
                setIntendedRole('student');
              }
            }}
            className="h-10 px-4 text-xs font-bold border-border/85"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {onboardingStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="h-10 px-5 text-xs font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleOrganizationSubmit}
              disabled={loading || isUploading}
              className="h-10 px-6 text-xs font-extrabold shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <><Loader2 className="w-4.5 h-4.5 mr-1.5 animate-spin" /> Submitting...</>
              ) : (
                isEditingResubmission ? 'Resubmit Onboarding' : 'Submit Onboarding Request'
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex select-none overflow-hidden relative font-body transition-colors duration-300">

      {/* LEFT COLUMN (Visual Panel - Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-50 dark:bg-slate-950 border-r border-border/60 relative p-12 text-foreground dark:text-white overflow-hidden select-none transition-colors duration-300">

        {/* Ambient Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/3 dark:bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <PlacifyLogo iconClassName="text-foreground dark:text-white w-9 h-9" textClassName="h-6" />
          </Link>
          <Badge className="bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 dark:border-primary/30 font-semibold px-3 py-1 rounded-full text-xs">
            Ecosystem w1.0
          </Badge>
        </div>

        {error && (
          <div className="relative z-10 mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2.5 animate-scale-in max-w-md mx-auto w-full shadow-md bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[9px] tracking-wider text-red-700 dark:text-red-300 block">System Alert / Error</span>
              <p className="font-medium text-xs leading-normal">{error}</p>
            </div>
          </div>
        )}

        {/* Mid Carousel Slider */}
        <div className="relative z-10 max-w-md mx-auto my-auto space-y-8 flex flex-col justify-center">
          <div className="space-y-4 text-center">
            <Badge variant="outline" className="px-3 py-0.5 border-border/40 dark:border-white/10 text-[10px] text-accent uppercase tracking-wider font-semibold">
              {SLIDES[activeSlide].badge}
            </Badge>
            <h2 className="text-3xl font-heading font-extrabold tracking-tight transition-all duration-300">
              {SLIDES[activeSlide].title}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed font-sans transition-all duration-300">
              {SLIDES[activeSlide].desc}
            </p>
          </div>

          {/* Embedded widget */}
          <div className="w-full max-w-sm mx-auto p-1 rounded-2xl border border-border/40 dark:border-white/5 bg-slate-100/30 dark:bg-white/[0.02] backdrop-blur-sm transition-all duration-500">
            {SLIDES[activeSlide].element}
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-primary' : 'w-2.5 bg-muted-foreground/20 dark:bg-slate-800'}`}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-muted-foreground dark:text-slate-500 flex justify-between">
          <span>© {new Date().getFullYear()} Placify Portal</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Encrypted Session</span>
        </div>
      </div>

      {/* RIGHT COLUMN (Form Panel - Mobile & Desktop) */}
      <div 
        ref={rightColRef}
        className="w-full lg:w-1/2 h-screen overflow-y-auto bg-background/50 flex flex-col justify-between p-6 sm:p-8 md:p-12 relative z-10 transition-colors duration-300"
      >
        {/* Background mesh decoration in right column */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        {/* Floating Back Button & Theme Toggle */}
        <div className="flex justify-between items-center w-full">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 py-1.5 px-3.5 rounded-full border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
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
        <div className="max-w-md w-full mx-auto my-auto pt-6 pb-6">
          <Card className="border border-border/80 bg-card/65 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 relative overflow-hidden rounded-2xl">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />

            {/* Mobile-Only Logo */}
            <div className="flex flex-col items-center text-center lg:hidden mb-6">
              <PlacifyLogo iconClassName="text-primary w-10 h-10" textClassName="h-6" />
            </div>

            {/* Typography Header */}
            <div className="space-y-1.5 text-center sm:text-left mb-6">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {mode === 'signin' ? 'Sign In to Portal' : mode === 'signup' ? 'Register Account' : 'Verify Email'}
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mode === 'signin'
                  ? 'Access your analytics dashboards and placement listings.'
                  : mode === 'signup'
                    ? 'Configure credentials to kick off your student preparing journey.'
                    : 'Enter the 6-digit OTP code sent to your registered email address.'}
              </p>
            </div>

            {/* Switch Tab selector */}
            {mode !== 'verify' && (
              <div className="flex bg-muted/60 rounded-xl p-1 relative border border-border/40 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${mode === 'signin'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${mode === 'signup'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Interactive feedback alert messages */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2 mb-4 animate-scale-in">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2 mb-4 animate-scale-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            {/* Auth Form input structure */}
            {mode === 'signup' && intendedRole === 'organization' ? (
              renderOrganizationWizard()
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'verify' ? (
                  <>
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(''); }}
                          placeholder="name@university.edu"
                          className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* OTP Verification Code */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="verificationCode" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                          6-Digit OTP Code
                        </Label>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-[10px] sm:text-xs text-primary font-semibold hover:underline"
                          disabled={loading}
                        >
                          Resend Code
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          id="verificationCode"
                          type="text"
                          value={verificationCode}
                          onChange={e => { setVerificationCode(e.target.value); setError(''); }}
                          placeholder="e.g. 759864"
                          className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm font-mono tracking-widest text-center text-lg font-bold"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99] transition-all"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 className="w-4.5 h-4.5 mr-2 animate-spin" /> Verifying...</>
                      ) : (
                        'Verify & Sign In'
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    {/* Organization Dropdown */}
                    {/* Email or College ID */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                        {email.trim() === 'sahilsrivastava8962@gmail.com' ? 'Email Address' : 'Email Address or College ID'}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          id="email"
                          type="text"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(''); }}
                          placeholder={email.trim() === 'sahilsrivastava8962@gmail.com' ? "name@university.edu" : "Email or College ID"}
                          className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm"
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Organization Dropdown */}
                    {renderOrgSelector('signup')}

                    {/* Register As Role */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                        Register As
                      </Label>
                      <div className="flex gap-2">
                        {['student', 'recruiter', 'organization'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { setIntendedRole(r as any); setError(''); }}
                            className={`flex-1 py-2.5 text-[10px] sm:text-xs font-extrabold rounded-xl border transition-all uppercase tracking-wider ${intendedRole === r
                              ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/5'
                              : 'border-border/85 bg-background/30 text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* College ID (Student only) */}
                    {intendedRole === 'student' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="collegeId" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                          College ID
                        </Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            id="collegeId"
                            type="text"
                            value={collegeId}
                            onChange={e => { setCollegeId(e.target.value); setError(''); }}
                            placeholder="Enter your College Roll No / ID"
                            className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Personal Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                        Personal Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(''); }}
                          placeholder="name@gmail.com"
                          className="pl-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password (for non-verify modes only) */}
                {mode !== 'verify' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                        Password
                      </Label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setError("For password resets, please contact the Placement Coordinator.")}
                          className="text-[10px] sm:text-xs text-primary font-semibold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                        className="pl-10 pr-10 h-11 rounded-xl border-border/80 focus-visible:ring-primary/20 bg-background/30 font-sans text-sm"
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength checklist */}
                    {mode === 'signup' && (
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1.5 px-2.5 py-1.5 bg-muted/20 border rounded-lg border-border/30">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${password.length >= 6 ? 'bg-emerald-500 scale-125 shadow shadow-emerald-500/50' : 'bg-muted-foreground/40'}`} />
                        <span>Password must contain at least 6 characters</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit CTA (for non-verify modes only) */}
                {mode !== 'verify' && (
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99] transition-all"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="w-4.5 h-4.5 mr-2 animate-spin" /> Authenticating...</>
                    ) : (
                      mode === 'signin' ? 'Sign In' : 'Register Account'
                    )}
                  </Button>
                )}
              </form>
            )}

            <div className="text-center pt-4 border-t border-border/40 mt-4">
              <button
                type="button"
                onClick={() => {
                  setStatusError('');
                  setStatusResult(null);
                  setStatusEmail('');
                  setStatusPassword('');
                  setShowStatusModal(true);
                }}
                className="text-xs text-primary font-bold hover:underline transition-colors"
              >
                Check Onboarding Request Status
              </button>
            </div>

          </Card>
        </div>

        {/* Footer legal security badge */}
        <div className="space-y-3 pt-6 border-t border-muted/50 text-center max-w-sm mx-auto w-full">
          <div className="flex items-center gap-1.5 justify-center text-[10px] text-muted-foreground/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure SSL Encrypted Connection</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            <span>By signing in, you consent to our </span>
            <Link to="/terms" className="text-primary hover:underline font-semibold">Terms</Link>
            <span> & </span>
            <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>
            <span>.</span>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-popover border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-foreground">
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-base font-extrabold text-foreground font-heading flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Check Account Status
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {statusRole === 'organization'
                ? 'Enter the primary admin email and password specified during organization request submission.'
                : `Enter your ${statusRole} account email and password to verify your profile approval status.`}
            </p>

            {statusError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            {!statusResult ? (
              <form onSubmit={handleCheckStatus} className="space-y-3.5">
                {/* Role Switcher */}
                <div className="flex bg-muted/35 p-1 rounded-xl border border-border/40 gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusRole('organization');
                      setStatusResult(null);
                      setStatusError('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all ${statusRole === 'organization'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusRole('student');
                      setStatusResult(null);
                      setStatusError('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all ${statusRole === 'student'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusRole('recruiter');
                      setStatusResult(null);
                      setStatusError('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-all ${statusRole === 'recruiter'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Recruiter
                  </button>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="statusEmail" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                    {statusRole === 'organization' ? 'Admin Email' : 'Account Email'}
                  </Label>
                  <Input
                    id="statusEmail"
                    type="email"
                    value={statusEmail}
                    onChange={e => setStatusEmail(e.target.value)}
                    placeholder={statusRole === 'organization' ? 'admin@university.edu' : 'your-email@domain.com'}
                    className="h-10 rounded-xl bg-background/30"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="statusPass" className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">Password</Label>
                  <Input
                    id="statusPass"
                    type="password"
                    value={statusPassword}
                    onChange={e => setStatusPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 rounded-xl bg-background/30"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={statusLoading}
                  className="w-full h-10 rounded-xl font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
                >
                  {statusLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 border-t border-border/40 pt-4">
                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border/30">
                  <span className="text-xs font-bold text-muted-foreground">Account Status:</span>
                  <Badge className={`font-semibold text-xs px-2.5 py-0.5 rounded-full uppercase ${statusResult.status === 'Approved' || statusResult.status === 'Verified' || statusResult.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : statusResult.status === 'Rejected' || statusResult.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500 border-red-500/20'
                      : statusResult.status === 'Need More Information'
                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 animate-pulse'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                    {statusResult.status}
                  </Badge>
                </div>

                <div className="text-xs space-y-1.5">
                  {statusResult.role === 'organization' ? (
                    <>
                      <div>Organization: <strong className="text-foreground">{statusResult.organization_name}</strong></div>
                      <div>Code: <strong className="text-foreground font-mono">{statusResult.generated_org_code}</strong></div>
                      <div>Submitted: <strong className="text-foreground">{new Date(statusResult.submitted_at).toLocaleString()}</strong></div>
                    </>
                  ) : statusResult.role === 'student' ? (
                    <>
                      <div>Name: <strong className="text-foreground">{statusResult.name}</strong></div>
                      <div>College: <strong className="text-foreground">{statusResult.organization_name}</strong></div>
                      <div>College ID: <strong className="text-foreground font-mono">{statusResult.generated_org_code}</strong></div>
                      <div>Registered: <strong className="text-foreground">{new Date(statusResult.submitted_at).toLocaleString()}</strong></div>
                    </>
                  ) : (
                    <>
                      <div>Name: <strong className="text-foreground">{statusResult.name}</strong></div>
                      <div>College/Organization: <strong className="text-foreground">{statusResult.organization_name}</strong></div>
                      <div>Company: <strong className="text-foreground">{statusResult.generated_org_code}</strong></div>
                      <div>Registered: <strong className="text-foreground">{new Date(statusResult.submitted_at).toLocaleString()}</strong></div>
                    </>
                  )}
                </div>

                {statusResult.remarks && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-650 dark:text-purple-400 space-y-1 leading-relaxed">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-purple-500" /> Platform Owner Remarks:
                    </span>
                    <p className="pl-4.5 text-[11px] text-muted-foreground italic">"{statusResult.remarks}"</p>
                  </div>
                )}

                {statusResult.status === 'Need More Information' && (
                  <Button
                    type="button"
                    onClick={() => handleEditResubmissionRequest(statusResult)}
                    className="w-full h-10 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/15"
                  >
                    Edit & Resubmit Request
                  </Button>
                )}

                {(statusResult.status === 'Approved' || statusResult.status === 'Verified' || statusResult.status === 'verified') && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center flex items-center gap-2 justify-center animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    <span>Your account is active! Please sign in.</span>
                  </div>
                )}

                {(statusResult.status === 'Rejected' || statusResult.status === 'rejected') && (
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-650 dark:text-red-400 text-xs font-semibold text-center flex items-center gap-2 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>Your registration request was rejected by administrators.</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusResult(null)}
                  className="w-full h-10 rounded-xl font-bold border-border"
                >
                  Verify Another Account
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
