import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Mail, Phone, Globe, Pencil, Save, X, Upload,
    MapPin, Users, Briefcase, CheckCircle2, AlertCircle, Info,
    ExternalLink, User, Shield, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const getCompanyInfo = (roleData: any) => {
    if (!roleData?.company) return {};
    try {
        if (roleData.company.trim().startsWith('{')) return JSON.parse(roleData.company);
    } catch (_) {}
    return { companyName: roleData.company };
};

/* ─── component ─────────────────────────────────────────────────────────── */
export default function RecruiterProfile() {
    const { roleData, refreshRole } = useRole();
    const { user } = useUser();

    const companyInfo = getCompanyInfo(roleData);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Form state mirrors the JSON stored in recruiters.company column
    const [form, setForm] = useState({
        companyName:           companyInfo.companyName           || '',
        industry:              companyInfo.industry              || '',
        description:           companyInfo.description           || '',
        website:               companyInfo.website               || '',
        companyEmail:          companyInfo.companyEmail          || '',
        companyPhone:          companyInfo.companyPhone          || '',
        headquarters:          companyInfo.headquarters          || '',
        companySize:           companyInfo.companySize           || '',
        linkedinUrl:           companyInfo.linkedinUrl           || '',
        recruiterName:         companyInfo.recruiterName         || roleData?.name || '',
        recruiterDesignation:  companyInfo.recruiterDesignation  || '',
    });

    interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).slice(2, 9);
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    /* save company profile */
    const handleSave = async () => {
        if (!roleData?.id) return;
        setSaving(true);
        try {
            const newCompanyJson = JSON.stringify({
                ...companyInfo,
                ...form,
            });
            const { error } = await insforge.database
                .from('recruiters')
                .update({ company: newCompanyJson, name: form.recruiterName })
                .eq('id', roleData.id);

            if (error) {
                showToast(`Failed to save: ${error.message}`, 'error');
            } else {
                showToast('Profile saved successfully!', 'success');
                setEditing(false);
                refreshRole();
            }
        } catch (err: any) {
            showToast('Unexpected error while saving', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* avatar upload */
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roleData?.id) return;
        setAvatarUploading(true);
        try {
            const { data, error } = await insforge.storage
                .from('profile-images')
                .upload(`${roleData.id}/${Date.now()}_${file.name}`, file);
            if (error) { showToast(`Upload failed: ${error.message}`, 'error'); return; }
            if (data) {
                await insforge.database
                    .from('recruiters')
                    .update({ profile_photo_url: data.url, profile_photo_key: data.key })
                    .eq('id', roleData.id);
                showToast('Photo updated!', 'success');
                refreshRole();
            }
        } catch {
            showToast('Unexpected error uploading photo', 'error');
        } finally {
            setAvatarUploading(false);
        }
    };

    const logoInitials = (form.companyName || roleData?.name || 'CO').substring(0, 2).toUpperCase();
    const logoUrl = roleData?.profile_photo_url || '';

    /* ─── field helpers ─────────────────────────────────────────────── */
    const Field = ({
        label, value, onChange, placeholder = '', type = 'text', disabled = false,
    }: {
        label: string; value: string; onChange?: (v: string) => void;
        placeholder?: string; type?: string; disabled?: boolean;
    }) => (
        <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
            {editing && onChange ? (
                <Input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="h-9 rounded-xl"
                />
            ) : (
                <p className={cn('text-sm font-semibold text-foreground', !value && 'text-muted-foreground italic')}>
                    {value || '—'}
                </p>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground">
                        Company Profile
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your company details visible to students and placement teams.
                    </p>
                </div>
                {!editing ? (
                    <Button
                        onClick={() => setEditing(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 px-5 rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)]"
                    >
                        <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="h-10 px-4 rounded-xl font-bold"
                            onClick={() => { setEditing(false); setForm({ companyName: companyInfo.companyName || '', industry: companyInfo.industry || '', description: companyInfo.description || '', website: companyInfo.website || '', companyEmail: companyInfo.companyEmail || '', companyPhone: companyInfo.companyPhone || '', headquarters: companyInfo.headquarters || '', companySize: companyInfo.companySize || '', linkedinUrl: companyInfo.linkedinUrl || '', recruiterName: companyInfo.recruiterName || roleData?.name || '', recruiterDesignation: companyInfo.recruiterDesignation || '' }); }}
                        >
                            <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-10 px-5 rounded-xl"
                        >
                            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* ── HERO BANNER ────────────────────────────────────────────── */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden">
                {/* Cover gradient */}
                <div className="h-28 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-violet-600/20 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.15),transparent_60%)]" />
                </div>

                <CardContent className="p-6 -mt-12">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        {/* Logo / Avatar */}
                        <div className="relative group shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={form.companyName}
                                    className="w-20 h-20 rounded-2xl object-contain bg-white border-4 border-background shadow-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl border-4 border-background shadow-lg">
                                    {logoInitials}
                                </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                {avatarUploading
                                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Camera className="w-5 h-5 text-white" />}
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>

                        {/* Name + Badges */}
                        <div className="flex-1 space-y-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-heading font-black text-foreground">
                                    {form.companyName || 'Your Company'}
                                </h2>
                                <Badge className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                    Recruiter Portal
                                </Badge>
                            </div>
                            {form.industry && (
                                <p className="text-sm text-muted-foreground font-medium">{form.industry}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {form.headquarters && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> {form.headquarters}
                                    </span>
                                )}
                                {form.companySize && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> {form.companySize} employees
                                    </span>
                                )}
                                {form.website && (
                                    <a
                                        href={form.website.startsWith('http') ? form.website : `https://${form.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Globe className="w-3.5 h-3.5" /> {form.website.replace(/^https?:\/\//, '')}
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── COMPANY INFO ──────────────────────────────────────────── */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 pt-5 pb-3">
                    <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Company Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                            label="Company Name"
                            value={form.companyName}
                            onChange={v => setForm(f => ({ ...f, companyName: v }))}
                            placeholder="e.g. Acme Corp"
                        />
                        <Field
                            label="Industry"
                            value={form.industry}
                            onChange={v => setForm(f => ({ ...f, industry: v }))}
                            placeholder="e.g. Technology / SaaS"
                        />
                        <Field
                            label="Headquarters"
                            value={form.headquarters}
                            onChange={v => setForm(f => ({ ...f, headquarters: v }))}
                            placeholder="e.g. Bangalore, India"
                        />
                        <Field
                            label="Company Size"
                            value={form.companySize}
                            onChange={v => setForm(f => ({ ...f, companySize: v }))}
                            placeholder="e.g. 500-1000"
                        />
                        <Field
                            label="Company Website"
                            value={form.website}
                            onChange={v => setForm(f => ({ ...f, website: v }))}
                            placeholder="https://yourcompany.com"
                            type="url"
                        />
                        <Field
                            label="LinkedIn Page"
                            value={form.linkedinUrl}
                            onChange={v => setForm(f => ({ ...f, linkedinUrl: v }))}
                            placeholder="https://linkedin.com/company/..."
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Company Description
                        </Label>
                        {editing ? (
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Brief description of what your company does…"
                                rows={4}
                                className="rounded-xl resize-none"
                            />
                        ) : (
                            <p className={cn('text-sm leading-relaxed', !form.description && 'text-muted-foreground italic')}>
                                {form.description || '—'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── CONTACT DETAILS ──────────────────────────────────────── */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 pt-5 pb-3">
                    <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" /> Contact Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                            label="Company Email"
                            value={form.companyEmail}
                            onChange={v => setForm(f => ({ ...f, companyEmail: v }))}
                            placeholder="careers@company.com"
                            type="email"
                        />
                        <Field
                            label="Company Phone"
                            value={form.companyPhone}
                            onChange={v => setForm(f => ({ ...f, companyPhone: v }))}
                            placeholder="+91 98765 43210"
                            type="tel"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── RECRUITER (YOU) ──────────────────────────────────────── */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-6 pt-5 pb-3">
                    <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Recruiter Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                            label="Your Name"
                            value={form.recruiterName}
                            onChange={v => setForm(f => ({ ...f, recruiterName: v }))}
                            placeholder="Your full name"
                        />
                        <Field
                            label="Your Designation"
                            value={form.recruiterDesignation}
                            onChange={v => setForm(f => ({ ...f, recruiterDesignation: v }))}
                            placeholder="e.g. HR Manager / Talent Acquisition"
                        />
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Login Email</Label>
                            <p className="text-sm font-semibold text-muted-foreground">{user?.email || '—'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Status</Label>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── SECURITY INFO ────────────────────────────────────────── */}
            <Card className="border-border/50 bg-amber-500/5 border-amber-500/20 rounded-2xl">
                <CardContent className="px-6 py-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-foreground">Data Access Scope</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            Your account is scoped exclusively to <strong>{form.companyName || 'your company'}</strong>.
                            You can only view jobs, applicants, and analytics tied to your company's postings.
                            No student-level platform data is accessible from this account.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ── TOAST STACK ─────────────────────────────────────────── */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={cn(
                            'pointer-events-auto p-4 rounded-xl shadow-xl border flex items-center gap-3 transition-all duration-300 backdrop-blur-sm',
                            t.type === 'success' && 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
                            t.type === 'error'   && 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200',
                            t.type === 'info'    && 'bg-slate-50 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/30 text-slate-800 dark:text-slate-200',
                        )}
                    >
                        {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                        {t.type === 'error'   && <AlertCircle  className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                        {t.type === 'info'    && <Info         className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        <span className="text-xs font-semibold flex-1">{t.message}</span>
                        <button onClick={() => setToasts(p => p.filter(item => item.id !== t.id))} className="ml-auto text-current/40 hover:text-current transition-colors shrink-0 pl-2">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
