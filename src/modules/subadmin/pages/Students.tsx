import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    GraduationCap, Search, ExternalLink, Mail
} from 'lucide-react';

type TabType = 'students' | 'approvals';

export default function Students() {
    const { roleData } = useRole();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('tab') === 'approvals' ? 'approvals' : 'students';
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam === 'approvals') {
            setActiveTab('approvals');
        } else if (tabParam === 'students') {
            setActiveTab('students');
        }
    }, [location.search]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Operational Lists
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);

    async function loadData() {
        setLoading(true);
        try {
            // Load Students (Active)
            const { data: stdData } = await insforge.database
                .from('students')
                .select('*')
                .eq('status', 'verified')
                .order('name');

            // Load Pending students waiting for verification
            const { data: pendingStds } = await insforge.database
                .from('students')
                .select('*')
                .eq('status', 'pending');

            // Fetch admin/subadmin names to map approvals
            const { data: adminsList } = await insforge.database
                .from('admins')
                .select('id, name');

            const { data: orgAdminsList } = await insforge.database
                .from('organization_admins')
                .select('id, name');

            // Create a lookup map of id -> name
            const verifiersMap: Record<string, string> = {};
            if (Array.isArray(adminsList)) {
                adminsList.forEach(a => { if (a.id && a.name) verifiersMap[a.id] = a.name; });
            }
            if (Array.isArray(orgAdminsList)) {
                orgAdminsList.forEach(oa => { if (oa.id && oa.name) verifiersMap[oa.id] = oa.name; });
            }

            // Map approved_by_name into student data
            const mappedStudents = (stdData || []).map(s => ({
                ...s,
                approved_by_name: s.verified_by ? verifiersMap[s.verified_by] || 'Admin' : null
            }));

            const mappedPending = (pendingStds || []).map(s => ({
                ...s,
                approved_by_name: s.verified_by ? verifiersMap[s.verified_by] || 'Admin' : null
            }));

            setStudents(mappedStudents);
            setPendingStudents(mappedPending);
        } catch (err) {
            console.error('Error loading student directories:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Approval Actions
    async function handleApprove(user: any) {
        try {
            const otpCode = user.otp || Math.floor(1000 + Math.random() * 9000).toString();

            const { error } = await insforge.database
                .from('students')
                .update({
                    status: 'verified',
                    verification_status: 'Approved',
                    otp: otpCode,
                    verified_by: roleData?.id || null,
                    verified_at: new Date().toISOString()
                })
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
            await insforge.database.from('students').delete().eq('id', user.id);
            await loadData();
        } catch (err: any) {
            console.error('Reject failed:', err);
            alert(err.message || 'Rejection failed.');
        }
    }

    // Filtering Lists
    const filteredStudents = students.filter(s =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.branch?.toLowerCase().includes(search.toLowerCase()) ||
        s.college_id?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredPending = pendingStudents.filter(u =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in font-body">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Student Directory</h1>
                    <p className="text-muted-foreground mt-1">Manage students inside your organization.</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-border/80 gap-6 select-none">
                {(['students', 'approvals'] as TabType[]).map(tab => (
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
                        <span className="capitalize">{tab === 'students' ? 'Enrolled Students' : 'Pending Approvals'}</span>
                        {tab === 'approvals' && pendingStudents.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                                {pendingStudents.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={`Search by name, email or branch...`}
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-muted/30" />)}</div>
            ) : (
                <div className="space-y-3 animate-stagger">
                    {/* STUDENTS TAB */}
                    {activeTab === 'students' && (
                        <>
                            {filteredStudents.map(s => (
                                <Dialog key={s.id}>
                                    <DialogTrigger asChild>
                                        <Card className="hover:bg-muted/30 transition-colors cursor-pointer border-transparent hover:border-primary/20">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <Avatar className="w-10 h-10">
                                                    {s.profile_photo_url ? <AvatarImage src={s.profile_photo_url} /> : null}
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{s.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-foreground">{s.name}</p>
                                                    <p className="text-xs text-muted-foreground">{s.email} &bull; ID: {s.college_id || 'N/A'}</p>
                                                </div>
                                                <div className="text-right hidden sm:block text-xs text-muted-foreground mr-4">
                                                    <p>{s.branch} &bull; Year {s.current_year}</p>
                                                    <p>CGPA: {s.cgpa} &bull; Backlogs: {s.backlogs}</p>
                                                    {s.approved_by_name && (
                                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                                            Approved by {s.approved_by_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={s.placement_status === 'placed' ? 'success' : 'warning'}>
                                                    {s.placement_status === 'placed' ? 'Placed' : 'Not Placed'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
                                        <DialogHeader>
                                            <DialogTitle>Student Profile Details</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 mt-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-16 h-16 border-2 border-muted">
                                                    {s.profile_photo_url ? <AvatarImage src={s.profile_photo_url} /> : null}
                                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{s.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h2 className="text-2xl font-semibold text-foreground">{s.name}</h2>
                                                    <p className="text-muted-foreground text-sm">{s.email}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Badge variant={s.placement_status === 'placed' ? 'success' : 'secondary'}>
                                                            {s.placement_status === 'placed' ? 'Placed' : 'Not Placed'}
                                                        </Badge>
                                                        {s.branch && <Badge variant="outline">{s.branch}</Badge>}
                                                        {s.approved_by_name && (
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                                                                ✓ Approved by {s.approved_by_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                                    <GraduationCap className="w-5 h-5 text-primary" />
                                                    Academic Information
                                                </h3>
                                                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm bg-muted/30 p-4 rounded-lg">
                                                    <div><span className="text-muted-foreground block mb-1">College ID</span> <span className="font-medium">{s.college_id || 'N/A'}</span></div>
                                                    <div><span className="text-muted-foreground block mb-1">Branch</span> <span className="font-medium">{s.branch || 'N/A'}</span></div>
                                                    <div><span className="text-muted-foreground block mb-1">Current Year</span> <span className="font-medium">Year {s.current_year || 'N/A'}</span></div>
                                                    <div><span className="text-muted-foreground block mb-1">Graduation Year</span> <span className="font-medium">{s.graduation_year || 'N/A'}</span></div>
                                                    <div><span className="text-muted-foreground block mb-1">Current CGPA</span> <span className="font-medium">{s.cgpa || 'N/A'}</span></div>
                                                    <div><span className="text-muted-foreground block mb-1">Active Backlogs</span> <span className="font-medium text-destructive">{s.backlogs || 0}</span></div>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                                    <ExternalLink className="w-5 h-5 text-primary" />
                                                    Professional Links
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm p-4 border rounded-lg">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground">LinkedIn</span>
                                                        {s.linkedin_url ? <a href={s.linkedin_url} className="text-blue-500 hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer">profile <ExternalLink className="w-3 h-3" /></a> : 'Not provided'}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground">GitHub</span>
                                                        {s.github_url ? <a href={s.github_url} className="text-emerald-500 hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer">github <ExternalLink className="w-3 h-3" /></a> : 'Not provided'}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground">Resume</span>
                                                        {s.resume_url ? <a href={s.resume_url} className="text-orange-500 hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer">Download PDF <ExternalLink className="w-3 h-3" /></a> : 'Not uploaded'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ))}
                            {filteredStudents.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No students found</CardContent></Card>}
                        </>
                    )}

                    {/* APPROVALS TAB */}
                    {activeTab === 'approvals' && (
                        <>
                            {filteredPending.map(u => {
                                let educationObj: any = {};
                                if (u.education) {
                                    if (typeof u.education === 'string') {
                                        try {
                                            educationObj = JSON.parse(u.education);
                                        } catch (e) {
                                            console.error('Failed to parse education data:', e);
                                        }
                                    } else {
                                        educationObj = u.education;
                                    }
                                }

                                const personalEmail = educationObj.personal_email || educationObj.personalEmail || 'N/A';
                                const collegeEmail = educationObj.college_email || educationObj.collegeEmail || u.email;
                                const course = educationObj.course || 'N/A';
                                const idCardUrl = educationObj.id_card_url || educationObj.idCardUrl || '';
                                const profilePhotoUrl = u.profile_photo_url || educationObj.profile_photo_url || educationObj.profilePhotoUrl || '';

                                return (
                                    <Dialog key={u.id}>
                                        <DialogTrigger asChild>
                                            <Card className="border-yellow-500/20 bg-yellow-500/[0.01] hover:bg-muted/30 transition-colors cursor-pointer border hover:border-yellow-500/40">
                                                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-10 h-10 border border-amber-500/20">
                                                            {profilePhotoUrl ? <AvatarImage src={profilePhotoUrl} className="object-cover" /> : null}
                                                            <AvatarFallback className="bg-amber-500/10 text-amber-500 text-sm font-bold">
                                                                {(u.name || u.email).charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-sm text-foreground">{u.name || 'Anonymous Student'}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="w-3.5 h-3.5" /> {u.email}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Course: {course} &bull; Branch: {u.branch || 'N/A'} &bull; Year {u.current_year || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 rounded-lg text-xs"
                                                            >
                                                                Review Details
                                                            </Button>
                                                        </DialogTrigger>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => handleApprove(u)}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </DialogTrigger>

                                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
                                            <DialogHeader>
                                                <DialogTitle>Verification Review: {u.name || 'Anonymous Student'}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 mt-4">
                                                {/* Profile photo and primary details */}
                                                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-muted/20 p-4 rounded-xl">
                                                    <Avatar className="w-20 h-20 border-2 border-primary/20">
                                                        {profilePhotoUrl ? (
                                                            <AvatarImage src={profilePhotoUrl} className="object-cover" />
                                                        ) : null}
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                                            {(u.name || u.email).charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-bold text-foreground">{u.name || 'Anonymous Student'}</h3>
                                                        <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                                                            <Mail className="w-4 h-4" /> {u.email}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold">
                                                                Pending Verification
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                {u.branch || 'Branch N/A'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Verification Info Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Personal Details */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Personal Info</h4>
                                                        <div className="space-y-2 text-sm bg-muted/10 p-4 rounded-xl border border-border/40">
                                                            <div>
                                                                <span className="text-xs text-muted-foreground block">Personal Email</span>
                                                                <span className="font-medium">{personalEmail}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-muted-foreground block">Phone Number</span>
                                                                <span className="font-medium">{u.phone || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Academic Details */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Academic Info</h4>
                                                        <div className="space-y-2 text-sm bg-muted/10 p-4 rounded-xl border border-border/40">
                                                            <div>
                                                                <span className="text-xs text-muted-foreground block">Registration / Roll Number</span>
                                                                <span className="font-medium">{u.college_id || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-muted-foreground block">College Email</span>
                                                                <span className="font-medium">{collegeEmail}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <span className="text-xs text-muted-foreground block">Course</span>
                                                                    <span className="font-medium">{course}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-muted-foreground block">Graduation Year</span>
                                                                    <span className="font-medium">{u.graduation_year || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                {/* Action Controls */}
                                                <div className="flex items-center justify-end gap-3 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            const info = prompt(`Enter changes/information requested from ${u.name || u.email}:`);
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
                                                    >
                                                        Request Changes
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => handleReject(u)}
                                                    >
                                                        Reject / Delete
                                                    </Button>
                                                    <Button
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                        onClick={() => handleApprove(u)}
                                                    >
                                                        Approve Student
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
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
