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
  Building2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [intendedRole, setIntendedRole] = useState<'student' | 'recruiter'>('student');
  const [collegeId, setCollegeId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Searchable Organization Selector States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchCache, setSearchCache] = useState<Record<string, any[]>>({});
  const orgSelectorRef = useRef<HTMLDivElement>(null);

  // Auto transition slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
    if (selectedOrgId) {
      const selectedOrg = searchResults.find(o => o.id === selectedOrgId) || 
                          Object.values(searchCache).flat().find(o => o.id === selectedOrgId);
      if (selectedOrg && searchQuery === `${selectedOrg.name} (${selectedOrg.code})`) {
        return;
      }
    }

    // Check Cache
    if (searchCache[trimmedQuery]) {
      setSearchResults(searchCache[trimmedQuery]);
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
        setSearchCache(prev => ({ ...prev, [trimmedQuery]: data }));
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
  }, [searchQuery, searchCache, selectedOrgId, searchResults]);

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
    setSearchQuery(`${org.name} (${org.code})`);
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
      if (!selectedOrgId && email.trim() !== 'sahilsrivastava8962@gmail.com') {
        setError('Please select an Organization.');
        return;
      }
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

        // Standard user login: Lookup organization first
        const { data: org, error: orgErr } = await insforge.database
          .from('organizations')
          .select('*')
          .eq('id', selectedOrgId)
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
                      className={`px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
                        isSelected 
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
            Ecosystem v1.0
          </Badge>
        </div>

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
      <div className="w-full lg:w-1/2 min-h-screen bg-background/50 flex flex-col justify-between p-6 sm:p-8 md:p-12 relative z-10 transition-colors duration-300">
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
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                    mode === 'signin' 
                      ? 'bg-background shadow text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                    mode === 'signup' 
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
                  {email.trim() !== 'sahilsrivastava8962@gmail.com' && renderOrgSelector('signin')}

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
                      {['student', 'recruiter'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setIntendedRole(r as any); setError(''); }}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                            intendedRole === r
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border/80 bg-background/30 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {r.toUpperCase()}
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

            {/* Enterprise OAuth dividers */}
            <div className="space-y-4 pt-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <span className="relative bg-card px-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Or Connect With
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="h-10 rounded-xl text-xs font-semibold hover:bg-muted/40 border-border bg-background/25 hover:text-foreground hover:shadow-sm"
                  onClick={() => setError("Federated Sign-In is disabled for security compliance. Sign in using credential schemas.")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="h-10 rounded-xl text-xs font-semibold hover:bg-muted/40 border-border bg-background/25 hover:text-foreground hover:shadow-sm"
                  onClick={() => setError("Federated Sign-In is disabled for security compliance. Sign in using credential schemas.")}
                >
                  <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  GitHub
                </Button>
              </div>
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
    </div>
  );
}
