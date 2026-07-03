import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ShieldCheck, Loader2, LogOut, Lock, Check, User, 
    GraduationCap, Shield, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'react-router-dom';
import PlacifyLogo from '@/components/ui/PlacifyLogo';

export default function VerifyOTP() {
    const { role, roleData, otpCode, refreshRole } = useRole();
    const { resolvedTheme, setTheme } = useTheme();
    const status = role === 'student' ? (roleData?.status || 'pending') : (roleData?.verification_status || roleData?.status || 'Pending');
    const isApproved = role === 'student' 
        ? false // Students bypass OTP activation phase entirely
        : (roleData?.verification_status === 'Approved' || roleData?.status === 'Approved');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    React.useEffect(() => {
        if (role === 'student' && status === 'verified') {
            window.location.href = '/student/dashboard';
        }
    }, [role, status]);

    React.useEffect(() => {
        if (role === 'student' && status === 'pending') {
            const interval = setInterval(() => {
                refreshRole();
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [role, status, refreshRole]);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        
        if (otp.trim() !== otpCode) {
            setError('Invalid OTP code. Please check and try again.');
            return;
        }

        setLoading(true);
        try {
            if (role === 'student') {
                const { error: err } = await insforge.database
                    .from('students')
                    .update({ account_status: 'Active', status: 'verified' })
                    .eq('user_id', roleData.user_id);
                if (err) throw err;
            } else if (role === 'recruiter') {
                const { error: err } = await insforge.database
                    .from('recruiters')
                    .update({ status: 'Verified' })
                    .eq('user_id', roleData.user_id);
                if (err) throw err;
            } else if (role === 'admin') {
                const { error: err } = await insforge.database
                    .from('admins')
                    .update({ status: 'Active' })
                    .eq('user_id', roleData.user_id);
                if (err) throw err;
            }

            // Audit Log
            await insforge.database.from('audit_logs').insert([{
                performed_by: roleData.name || roleData.email,
                action: 'Self Verification Completed',
                affected_user: roleData.email,
                device_info: navigator.userAgent
            }]);

            setSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSignOut() {
        await insforge.auth.signOut();
        window.location.href = '/';
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
                            Verification Pending
                        </span>
                        <h2 className="text-3xl font-heading font-black tracking-tight leading-tight">
                            {role === 'student' ? 'Account Awaiting Admin Approval' : 'Reviewing Recruiter Registration'}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {role === 'student' 
                                ? 'Your profile details and credentials have been submitted. Once approved by the Placement Officer, your dashboard will unlock.'
                                : 'Your partner credentials have been submitted. The Super Admin is reviewing your company details.'}
                        </p>
                    </div>

                    {/* Onboarding Milestones Checklist */}
                    <div className="border rounded-2xl bg-card/75 backdrop-blur-md p-5 border-border/80 shadow-lg space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-primary animate-pulse" />
                                Onboarding Milestones
                            </span>
                            <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Under Review
                            </span>
                        </div>
                        
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-3 text-xs">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Account Registered</p>
                                    <p className="text-[10px] text-muted-foreground">Credentials confirmed successfully</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Profile Details Completed</p>
                                    <p className="text-[10px] text-muted-foreground">Form details registered successfully</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                                <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">Placement Officer Approval</p>
                                    <p className="text-[10px] text-muted-foreground">Verification pending coordinator review</p>
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

            {/* RIGHT COLUMN (Status / OTP form) */}
            <div className="w-full lg:w-1/2 min-h-screen bg-background/45 backdrop-blur-[3px] flex flex-col justify-between p-6 sm:p-8 md:p-12 relative z-10 overflow-y-auto transition-colors duration-300">
                
                {/* Mobile-only background mesh decoration */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse lg:hidden" />
                
                {/* Theme Toggle */}
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

                {/* Main Card container */}
                <div className="max-w-md w-full mx-auto my-auto pt-6 pb-6 relative z-10">
                    {/* Mobile-Only Logo */}
                    <div className="flex flex-col items-center text-center lg:hidden mb-6">
                        <PlacifyLogo iconClassName="text-primary w-10 h-10" textClassName="h-6" />
                    </div>

                    <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                            <Lock className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-heading font-extrabold text-foreground tracking-tight">
                            Account Pending Approval
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                            {role === 'student' 
                                ? 'Your profile has been submitted and is currently under review by your college coordinators.'
                                : 'Your recruiter application has been submitted to the Super Admin.'}
                        </p>
                    </div>

                    <Card className="border border-border/80 bg-card/75 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden p-6">
                        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
                        
                        <div className="space-y-4">
                            {/* Live Verification Status Box */}
                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                                <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0 mt-0.5" />
                                <div className="space-y-1.5 flex-1">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Application Under Review</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {role === 'student' 
                                            ? 'Please do not re-submit. The placement cell is verifying your student details. The page will auto-unlock once approved.'
                                            : 'Please do not re-submit. Once the platform owner approves, you will be able to verify with the activation OTP.'}
                                    </p>
                                </div>
                            </div>

                            {/* Live checking visual text */}
                            {role === 'student' && (
                                <div className="flex items-center justify-center gap-2 p-1.5 bg-muted/40 rounded-lg text-[10px] font-bold text-primary tracking-wider uppercase">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    <span>Real-time approval monitor active</span>
                                </div>
                            )}

                            {/* Recruiter / Admin Activation OTP input block */}
                            {isApproved && otpCode && (
                                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center text-xs">
                                    <p className="font-semibold text-emerald-500">💡 Testing OTP Code:</p>
                                    <code className="text-foreground font-mono bg-slate-900/10 dark:bg-slate-950 px-2.5 py-1 rounded text-sm font-bold block mt-1.5 w-fit mx-auto border border-emerald-500/20">
                                        {otpCode}
                                    </code>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">
                                        (Use this verification OTP to activate recruiter access)
                                    </p>
                                </div>
                            )}

                            {success ? (
                                <div className="text-center py-4 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-base font-bold text-foreground">Activation Successful!</h2>
                                    <p className="text-xs text-muted-foreground">Unlocking your recruitment dashboard...</p>
                                </div>
                            ) : (
                                isApproved && (
                                    <form onSubmit={handleVerify} className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                                                Enter 4-Digit Activation OTP
                                            </label>
                                            <Input
                                                type="text"
                                                maxLength={4}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="0000"
                                                disabled={!otpCode || loading}
                                                className="h-12 text-center text-xl font-bold tracking-[0.5em] rounded-xl border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                required
                                            />
                                        </div>

                                        {error && (
                                            <p className="text-xs text-destructive text-center font-medium bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl">
                                                ⚠️ {error}
                                            </p>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={!otpCode || otp.length < 4 || loading}
                                            className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>
                                            ) : (
                                                'Verify Account'
                                            )}
                                        </Button>
                                    </form>
                                )
                            )}
                        </div>
                    </Card>
                </div>

                {/* Footer and Sign Out details */}
                <div className="relative z-10 text-[11px] text-muted-foreground/80 flex justify-between pt-6 border-t border-border/40 mt-8 max-w-md w-full mx-auto">
                    <span>Role: <strong className="text-foreground capitalize">{role}</strong></span>
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-1.5 font-semibold text-red-500 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
