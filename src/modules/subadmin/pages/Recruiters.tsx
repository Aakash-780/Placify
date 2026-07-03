import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Building2, Search, Mail, ExternalLink, Globe, MapPin, Users, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type TabType = 'recruiters' | 'approvals';

export default function Recruiters() {
    const [activeTab, setActiveTab] = useState<TabType>('recruiters');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Operational Lists
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [pendingRecruiters, setPendingRecruiters] = useState<any[]>([]);

    async function loadData() {
        setLoading(true);
        try {
            // Load Recruiters (Verified/Active)
            const { data: recData } = await insforge.database
                .from('recruiters')
                .select('*')
                .eq('verification_status', 'Verified')
                .order('name');
            setRecruiters(recData || []);

            // Load Pending recruiters waiting for verification
            const { data: pendingRecs } = await insforge.database
                .from('recruiters')
                .select('*')
                .eq('verification_status', 'Pending');

            setPendingRecruiters(pendingRecs || []);
        } catch (err) {
            console.error('Error loading recruiter directories:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Helper to parse company details safely
    const parseCompany = (companyStr: string) => {
        if (!companyStr) return { name: 'N/A' };
        try {
            if (companyStr.trim().startsWith('{')) {
                const parsed = JSON.parse(companyStr);
                return {
                    name: parsed.companyName || 'N/A',
                    logoUrl: parsed.logoUrl || '',
                    industry: parsed.industry || '',
                    description: parsed.description || '',
                    website: parsed.website || '',
                    companyEmail: parsed.companyEmail || '',
                    recruiterName: parsed.recruiterName || '',
                    recruiterDesignation: parsed.recruiterDesignation || '',
                    companySize: parsed.companySize || '',
                    headquarters: parsed.headquarters || '',
                    linkedin: parsed.linkedin || '',
                    verificationDoc: parsed.verificationDoc || ''
                };
            }
        } catch (_) {}
        return { name: companyStr };
    };

    // Approval Actions
    async function handleApprove(user: any) {
        try {
            const otpCode = user.otp || Math.floor(1000 + Math.random() * 9000).toString();

            const { error } = await insforge.database
                .from('recruiters')
                .update({ status: 'Active', verification_status: 'Verified', otp: otpCode })
                .eq('id', user.id);
            if (error) throw error;

            // Create notification containing OTP
            await insforge.database.from('notifications').insert([{
                user_id: user.user_id || '00000000-0000-0000-0000-000000000000',
                title: 'Account Approved',
                message: `Your Placify account request is approved. Use activation code ${otpCode} to verify your session.`,
                type: 'info',
                is_read: false
            }]);

            // Refresh directory
            await loadData();
        } catch (err: any) {
            console.error('Approve failed:', err);
            alert(err.message || 'Approval failed.');
        }
    }

    async function handleReject(user: any) {
        if (!confirm(`Are you sure you want to reject and remove ${user.name || user.email}?`)) return;
        try {
            await insforge.database.from('recruiters').delete().eq('id', user.id);
            await loadData();
        } catch (err: any) {
            console.error('Reject failed:', err);
            alert(err.message || 'Rejection failed.');
        }
    }

    // Filtering Lists
    const filteredRecruiters = recruiters.filter(r => {
        const companyObj = parseCompany(r.company);
        return !search ||
            r.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.email?.toLowerCase().includes(search.toLowerCase()) ||
            companyObj.name?.toLowerCase().includes(search.toLowerCase());
    });

    const filteredPending = pendingRecruiters.filter(u => {
        const companyObj = parseCompany(u.company);
        return !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            companyObj.name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-fade-in font-body">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Recruiter Directory</h1>
                    <p className="text-muted-foreground mt-1">Manage recruiters inside your organization.</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-border/80 gap-6 select-none">
                {(['recruiters', 'approvals'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setSearch(''); }}
                        className={cn(
                            'pb-3 font-semibold text-sm transition-all border-b-2 relative',
                            activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <span className="capitalize">{tab === 'recruiters' ? 'Verified Partners' : 'Pending Approvals'}</span>
                        {tab === 'approvals' && pendingRecruiters.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                                {pendingRecruiters.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={`Search by name, email or company...`}
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-muted/30" />)}</div>
            ) : (
                <div className="space-y-3 animate-stagger">
                    {/* RECRUITERS TAB */}
                    {activeTab === 'recruiters' && (
                        <>
                            {filteredRecruiters.map(r => {
                                const comp = parseCompany(r.company);
                                return (
                                    <Dialog key={r.id}>
                                        <DialogTrigger asChild>
                                            <Card className="hover:bg-muted/30 transition-colors cursor-pointer border-transparent hover:border-primary/20">
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <Avatar className="w-10 h-10">
                                                        {comp.logoUrl ? <AvatarImage src={comp.logoUrl} /> : null}
                                                        <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-bold">{r.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground">{r.name}</p>
                                                        <p className="text-xs text-muted-foreground">{r.email} &bull; Company: <strong className="text-foreground font-semibold">{comp.name}</strong></p>
                                                    </div>
                                                    <Badge 
                                                        variant={r.status === 'Active' || r.status === 'Verified' ? 'default' : 'destructive'} 
                                                        className="text-[10px] font-bold px-2 py-0.5"
                                                    >
                                                        {r.status}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
                                            <DialogHeader>
                                                <DialogTitle>Recruiter Profile Details</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 mt-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-16 h-16 border-2 border-muted">
                                                        {comp.logoUrl ? <AvatarImage src={comp.logoUrl} /> : null}
                                                        <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-bold">{r.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h2 className="text-2xl font-semibold text-foreground">{r.name}</h2>
                                                        <p className="text-muted-foreground text-sm">{r.email}</p>
                                                        <div className="mt-2 flex gap-2">
                                                            <Badge 
                                                                className={cn(
                                                                    "border text-[10px] font-bold",
                                                                    (r.status === 'Active' || r.status === 'Verified') 
                                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                                                )}
                                                            >
                                                                {r.status}
                                                            </Badge>
                                                            {comp.industry && <Badge variant="outline">{comp.industry}</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                        Company Information
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm bg-muted/30 p-4 rounded-lg">
                                                        <div><span className="text-muted-foreground block mb-1">Company Name</span> <span className="font-medium">{comp.name}</span></div>
                                                        <div><span className="text-muted-foreground block mb-1">Industry</span> <span className="font-medium">{comp.industry || 'N/A'}</span></div>
                                                        <div><span className="text-muted-foreground block mb-1">Company Size</span> <span className="font-medium">{comp.companySize || 'N/A'}</span></div>
                                                        <div><span className="text-muted-foreground block mb-1">Headquarters</span> <span className="font-medium">{comp.headquarters || 'N/A'}</span></div>
                                                        <div className="col-span-2"><span className="text-muted-foreground block mb-1">About Company</span> <span className="font-medium text-xs block leading-relaxed">{comp.description || 'No description provided.'}</span></div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                                        <Globe className="w-5 h-5 text-primary" />
                                                        Professional & Verification Details
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 text-sm p-4 border rounded-lg">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-muted-foreground">Company Website</span>
                                                            {comp.website ? <a href={comp.website} className="text-blue-500 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">website <ExternalLink className="w-3 h-3"/></a> : 'Not provided'}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-muted-foreground">LinkedIn</span>
                                                            {comp.linkedin ? <a href={comp.linkedin} className="text-blue-500 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">linkedin <ExternalLink className="w-3 h-3"/></a> : 'Not provided'}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-muted-foreground">Validation Document</span>
                                                            {comp.verificationDoc ? <a href={comp.verificationDoc} className="text-orange-500 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">Download Document <ExternalLink className="w-3 h-3"/></a> : 'Not uploaded'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                );
                            })}
                            {filteredRecruiters.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No recruiters found</CardContent></Card>}
                        </>
                    )}

                    {/* APPROVALS TAB */}
                    {activeTab === 'approvals' && (
                        <>
                            {filteredPending.map(u => {
                                const comp = parseCompany(u.company);
                                return (
                                    <Card key={u.id} className="border-yellow-500/20 bg-yellow-500/[0.01]">
                                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-sm text-foreground">{u.name || 'Anonymous Recruiter'}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5" /> {u.email}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Role: <Badge variant="outline" className="text-[10px] py-0">RECRUITER</Badge>
                                                        &bull; Company: <strong className="text-foreground font-semibold">{comp.name}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const info = prompt(`Enter information requested from ${u.name || u.email}:`);
                                                        if (info) {
                                                            insforge.database.from('notifications').insert([{
                                                                user_id: u.user_id || '00000000-0000-0000-0000-000000000000',
                                                                title: 'Information Required',
                                                                message: `Placement Cell requested: "${info}"`,
                                                                type: 'warning',
                                                                is_read: false
                                                            }]);
                                                            alert('Information request sent to user notifications!');
                                                        }
                                                    }}
                                                    className="h-8 rounded-lg text-xs"
                                                >
                                                    Request Info
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleApprove(u)}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleReject(u)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {filteredPending.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No pending onboarding approvals</CardContent></Card>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
