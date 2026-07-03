import React, { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Building2, LogOut, Loader2 } from 'lucide-react';

export default function RecruiterOnboarding() {
    const { user } = useUser();
    const { roleData, refreshRole } = useRole();

    const [onboardForm, setOnboardForm] = useState({
        companyName: '',
        logoUrl: '',
        industry: '',
        description: '',
        website: '',
        companyEmail: '',
        recruiterName: '',
        recruiterDesignation: '',
        companySize: '',
        headquarters: '',
        linkedin: '',
        verificationDoc: ''
    });
    const [onboardStep, setOnboardStep] = useState(1);
    const [isSavingOnboard, setIsSavingOnboard] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    useEffect(() => {
        if (roleData) {
            let initialCompany = '';
            if (roleData.company) {
                if (roleData.company.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(roleData.company);
                        setOnboardForm({
                            companyName: parsed.companyName || '',
                            logoUrl: roleData.profile_photo_url || parsed.logoUrl || '',
                            industry: parsed.industry || '',
                            description: parsed.description || '',
                            website: parsed.website || '',
                            companyEmail: parsed.companyEmail || '',
                            recruiterName: parsed.recruiterName || roleData.name || '',
                            recruiterDesignation: parsed.recruiterDesignation || '',
                            companySize: parsed.companySize || '',
                            headquarters: parsed.headquarters || '',
                            linkedin: parsed.linkedin || '',
                            verificationDoc: parsed.verificationDoc || ''
                        });
                        return;
                    } catch (e) {
                        initialCompany = roleData.company;
                    }
                } else {
                    initialCompany = roleData.company;
                }
            }
            setOnboardForm(prev => ({
                ...prev,
                companyName: initialCompany,
                recruiterName: roleData.name || user?.profile?.name || '',
                logoUrl: roleData.profile_photo_url || ''
            }));
        }
    }, [roleData, user]);

    const calculateProgress = () => {
        const requiredFields = [
            onboardForm.companyName,
            onboardForm.logoUrl,
            onboardForm.industry,
            onboardForm.description,
            onboardForm.website,
            onboardForm.companyEmail,
            onboardForm.recruiterName,
            onboardForm.recruiterDesignation,
            onboardForm.companySize,
            onboardForm.headquarters,
            onboardForm.linkedin
        ];
        const filled = requiredFields.filter(f => f && f.trim() !== '').length;
        if (filled === 0) return 20;
        if (filled <= 3) return 40;
        if (filled <= 6) return 60;
        if (filled <= 10) return 80;
        return 100;
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setUploadingLogo(true);
        try {
            const { data, error } = await insforge.storage
                .from('profile-images')
                .upload(`${roleData.id}/logo_${Date.now()}_${file.name}`, file);
            if (error) throw error;
            if (data?.url) {
                setOnboardForm(prev => ({ ...prev, logoUrl: data.url }));
            }
        } catch (err) {
            console.error("Logo upload error:", err);
            alert("Failed to upload logo. Please try again.");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setUploadingDoc(true);
        try {
            const { data, error } = await insforge.storage
                .from('profile-images')
                .upload(`${roleData.id}/doc_${Date.now()}_${file.name}`, file);
            if (error) throw error;
            if (data?.url) {
                setOnboardForm(prev => ({ ...prev, verificationDoc: data.url }));
            }
        } catch (err) {
            console.error("Doc upload error:", err);
            alert("Failed to upload document. Please try again.");
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleOnboardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (calculateProgress() < 100) {
            alert("Please complete all required fields (100% progress) before continuing.");
            return;
        }
        setIsSavingOnboard(true);
        try {
            const companyJson = JSON.stringify(onboardForm);
            const { error } = await insforge.database
                .from('recruiters')
                .update({
                    company: companyJson,
                    name: onboardForm.recruiterName,
                    profile_photo_url: onboardForm.logoUrl
                })
                .eq('id', roleData.id);

            if (error) throw error;
            await refreshRole();
        } catch (err: any) {
            console.error("Onboarding submission failed:", err);
            alert("Failed to save profile: " + err.message);
        } finally {
            setIsSavingOnboard(false);
        }
    };

    const progress = calculateProgress();

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-background p-4 lg:p-8 overflow-y-auto">
            {/* Blurred mockup background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none blur-[16px] opacity-40 scale-105 grid grid-cols-12 gap-6 p-10 bg-background">
                {/* Simulated Sidebar */}
                <div className="col-span-3 bg-card border rounded-2xl h-[90vh] p-6 space-y-4">
                    <div className="w-24 h-8 bg-muted rounded-lg" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-full h-10 bg-muted/60 rounded-xl" />
                        ))}
                    </div>
                </div>
                {/* Simulated Content */}
                <div className="col-span-9 space-y-6">
                    <div className="w-full h-40 bg-muted/45 rounded-3xl" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-card rounded-2xl border" />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 h-80 bg-card rounded-2xl border" />
                        <div className="h-80 bg-card rounded-2xl border" />
                    </div>
                </div>
            </div>

            {/* Onboarding Card */}
            <div className="relative z-10 w-full max-w-2xl bg-card border border-border/80 shadow-2xl rounded-3xl p-6 lg:p-8 backdrop-blur-xl animate-fade-in space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-primary" /> Recruiter Onboarding
                        </h2>
                        <p className="text-xs text-muted-foreground">Please complete your company profile to activate dashboard access.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="text-xs border-border hover:bg-muted font-semibold rounded-lg"
                        onClick={async () => {
                            await insforge.auth.signOut();
                            window.location.href = '/';
                        }}
                    >
                        <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                    </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Profile Completion</span>
                        <span className="text-primary font-black">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden border">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Steps indicators */}
                <div className="flex gap-2">
                    {[1, 2, 3].map(stepNum => (
                        <button
                            key={stepNum}
                            type="button"
                            onClick={() => setOnboardStep(stepNum)}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all",
                                onboardStep === stepNum
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/70"
                            )}
                        >
                            Step {stepNum}: {stepNum === 1 ? "Brand & Contact" : stepNum === 2 ? "Company Info" : "Recruiter Profile"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleOnboardSubmit} className="space-y-5">
                    {onboardStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Company Name *</Label>
                                    <Input
                                        required
                                        value={onboardForm.companyName}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, companyName: e.target.value }))}
                                        placeholder="e.g. Stripe Inc"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Company Website *</Label>
                                    <Input
                                        required
                                        type="url"
                                        value={onboardForm.website}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="e.g. https://stripe.com"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Company Email *</Label>
                                    <Input
                                        required
                                        type="email"
                                        value={onboardForm.companyEmail}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, companyEmail: e.target.value }))}
                                        placeholder="e.g. hiring@stripe.com"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        Company Logo *
                                        {uploadingLogo && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        {onboardForm.logoUrl ? (
                                            <img src={onboardForm.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border bg-white" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground"><Building2 className="w-5 h-5" /></div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="rounded-xl border-border bg-muted/20 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {onboardStep === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Industry *</Label>
                                    <select
                                        required
                                        value={onboardForm.industry}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, industry: e.target.value }))}
                                        className="w-full rounded-xl border border-input bg-muted/20 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Select industry</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Consulting">Consulting</option>
                                        <option value="Education">Education</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Company Size *</Label>
                                    <select
                                        required
                                        value={onboardForm.companySize}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, companySize: e.target.value }))}
                                        className="w-full rounded-xl border border-input bg-muted/20 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10 employees">1-10 employees</option>
                                        <option value="11-50 employees">11-50 employees</option>
                                        <option value="51-200 employees">51-200 employees</option>
                                        <option value="201-500 employees">201-500 employees</option>
                                        <option value="501-1000 employees">501-1000 employees</option>
                                        <option value="1000+ employees">1000+ employees</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Headquarters Location *</Label>
                                    <Input
                                        required
                                        value={onboardForm.headquarters}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, headquarters: e.target.value }))}
                                        placeholder="e.g. San Francisco, CA"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">Company Description *</Label>
                                <textarea
                                    required
                                    value={onboardForm.description}
                                    onChange={e => setOnboardForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Tell us about your organization's mission and culture..."
                                    rows={4}
                                    className="w-full rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {onboardStep === 3 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Recruiter Name *</Label>
                                    <Input
                                        required
                                        value={onboardForm.recruiterName}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, recruiterName: e.target.value }))}
                                        placeholder="e.g. John Doe"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">Recruiter Designation *</Label>
                                    <Input
                                        required
                                        value={onboardForm.recruiterDesignation}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, recruiterDesignation: e.target.value }))}
                                        placeholder="e.g. Senior Talent Partner"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground">LinkedIn Profile *</Label>
                                    <Input
                                        required
                                        type="url"
                                        value={onboardForm.linkedin}
                                        onChange={e => setOnboardForm(prev => ({ ...prev, linkedin: e.target.value }))}
                                        placeholder="e.g. https://linkedin.com/in/johndoe"
                                        className="rounded-xl border-border bg-muted/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        Verification Documents (Optional)
                                        {uploadingDoc && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        {onboardForm.verificationDoc ? (
                                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Doc Uploaded</span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border">No doc</span>
                                        )}
                                        <Input
                                            type="file"
                                            onChange={handleDocUpload}
                                            className="rounded-xl border-border bg-muted/20 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between gap-4 pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={onboardStep === 1}
                            onClick={() => setOnboardStep(prev => prev - 1)}
                            className="text-xs hover:bg-muted font-bold rounded-lg px-4 h-9"
                        >
                            Back
                        </Button>
                        {onboardStep < 3 ? (
                            <Button
                                type="button"
                                onClick={() => setOnboardStep(prev => prev + 1)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg px-4 h-9 shadow-sm"
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSavingOnboard || progress < 100}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg px-6 h-9 shadow-[0_4px_12px_rgba(59,130,246,0.25)] transition-all"
                            >
                                {isSavingOnboard ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Complete Profile to Continue"
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
