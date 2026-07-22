import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Building2, Search, Plus, CheckCircle,
    ChevronRight, BookOpen, Target, CheckCircle2,
    AlertCircle, Info, X, ArrowUpDown, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DsaSheets() {
    const { role, roleData } = useRole();
    const { user } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();

    const [companies, setCompanies] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [userMap, setUserMap] = useState<Record<string, string>>({});

    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Sorting state for questions
    const [qSortBy, setQSortBy] = useState<'difficulty' | 'topic' | 'solved' | 'unsolved' | 'recent'>('recent');

    // Dialog state for adding company
    const [showAddCompany, setShowAddCompany] = useState(false);
    const [newCompanyForm, setNewCompanyForm] = useState({ name: '', logoUrl: '', category: 'Product' });

    // Dialog state for adding question
    const [showAdd, setShowAdd] = useState(false);
    const [newQ, setNewQ] = useState({ title: '', link: '', difficulty: 'medium', topic: '' });

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
        }, 4500);
    };

    const companyParam = searchParams.get('company');

    // Sync selectedCompany state with search parameters
    useEffect(() => {
        if (companyParam) {
            setSelectedCompany(companyParam);
        } else {
            setSelectedCompany(null);
        }
    }, [companyParam]);

    async function fetchData() {
        setLoading(true);
        try {
            const [compRes, qRes, studentsRes, adminsRes] = await Promise.all([
                insforge.database.from('dsa_companies').select('*').order('name'),
                insforge.database.from('dsa_questions').select('*').order('created_at', { ascending: false }),
                insforge.database.from('students').select('user_id, name'),
                insforge.database.from('admins').select('user_id, name'),
            ]);

            setCompanies((compRes.data || []).map((c: any) => ({ ...c, is_verified: true })));
            setQuestions(qRes.data || []);

            // Build contributor map
            const map: Record<string, string> = {};
            (studentsRes.data || []).forEach((s: any) => {
                if (s.user_id) map[s.user_id] = s.name;
            });
            (adminsRes.data || []).forEach((a: any) => {
                if (a.user_id) map[a.user_id] = a.name;
            });
            setUserMap(map);

            if (roleData?.id) {
                const { data } = await insforge.database.from('dsa_progress').select('*').eq('student_id', roleData.id);
                setProgress(data || []);
            }
        } catch (err: any) {
            console.error("[DsaSheets] Fetch error:", err);
            showToast("Failed to load DSA Sheets data.", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [roleData]);

    async function toggleSolved(questionId: string) {
        if (!roleData?.id) {
            showToast("Please log in as a student to track progress", "error");
            return;
        }
        try {
            const existing = progress.find(p => p.question_id === questionId);
            if (existing) {
                const { error } = await insforge.database.from('dsa_progress').delete().eq('id', existing.id);
                if (error) throw error;
                setProgress(prev => prev.filter(p => p.id !== existing.id));
                showToast("Question marked as unsolved", "info");
            } else {
                const { data, error } = await insforge.database.from('dsa_progress').insert([{
                    student_id: roleData.id,
                    question_id: questionId,
                    status: 'solved',
                }]).select();
                if (error) throw error;
                if (data) {
                    setProgress(prev => [...prev, ...data]);
                    showToast("Question solved! Great job!", "success");
                }
            }
        } catch (err: any) {
            console.error("Error toggling solved status:", err);
            showToast("Failed to update solved progress.", "error");
        }
    }

    function formatCompanyName(name: string): string {
        const trimmed = name.trim();
        if (!trimmed) return '';
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

    async function addCompany() {
        const formattedName = formatCompanyName(newCompanyForm.name);
        if (!formattedName) {
            showToast("Company name is required", "error");
            return;
        }

        const nameLower = formattedName.toLowerCase();
        const duplicate = companies.some(c => c.name.toLowerCase() === nameLower);
        if (duplicate) {
            showToast("A company with this name already exists", "error");
            return;
        }

        try {
            const { data, error } = await insforge.database.from('dsa_companies').insert([{
                name: formattedName,
                logo_url: newCompanyForm.logoUrl.trim() || null,
                category: newCompanyForm.category,
                created_by: user?.id || null
            }]).select();

            if (error) {
                if (error.message?.includes('unique') || error.code === '23505') {
                    showToast("Company name must be unique", "error");
                } else {
                    showToast(`Failed to add company: ${error.message}`, "error");
                }
                return;
            }

            if (data && data.length > 0) {
                setCompanies(prev => [...prev, { ...data[0], is_verified: true }]);
                showToast("Company added successfully!", "success");
                setShowAddCompany(false);
                setNewCompanyForm({ name: '', logoUrl: '', category: 'Product' });
            }
        } catch (err: any) {
            console.error("Exception adding company:", err);
            showToast("Unexpected error adding company", "error");
        }
    }

    async function addQuestion() {
        // Strict Validation
        if (!newQ.title.trim()) {
            showToast("Question Title is required", "error");
            return;
        }
        if (!newQ.topic.trim()) {
            showToast("Topic is required", "error");
            return;
        }
        if (!newQ.difficulty) {
            showToast("Difficulty is required", "error");
            return;
        }
        if (!newQ.link.trim()) {
            showToast("Question URL is required", "error");
            return;
        }

        // Strict URL prefix verification
        if (!newQ.link.trim().startsWith("https://")) {
            showToast("Question URL must begin with https://", "error");
            return;
        }

        if (!selectedCompany) {
            showToast("No company selected", "error");
            return;
        }

        const titleLower = newQ.title.trim().toLowerCase();
        const duplicate = questions.some(q => q.company_id === selectedCompany && q.title.toLowerCase() === titleLower);
        if (duplicate) {
            showToast("This question is already added for this company", "error");
            return;
        }

        try {
            const { data, error } = await insforge.database.from('dsa_questions').insert([{
                company_id: selectedCompany,
                title: newQ.title.trim(),
                leetcode_url: newQ.link.trim(),
                difficulty: newQ.difficulty,
                topic: newQ.topic.trim()
            }]).select();

            if (error) {
                if (error.message?.includes('unique') || error.code === '23505') {
                    showToast("A question with this title already exists under this company", "error");
                } else {
                    showToast(`Failed to add question: ${error.message}`, "error");
                }
                return;
            }

            if (data && data.length > 0) {
                setQuestions(prev => [data[0], ...prev]);
                showToast("Question added successfully!", "success");
                setShowAdd(false);
                setNewQ({ title: '', link: '', difficulty: 'medium', topic: '' });
            }
        } catch (err: any) {
            console.error("Exception adding question:", err);
            showToast("Unexpected error adding question", "error");
        }
    }

    function getCompanyLastUpdated(companyId: string, companyCreatedAt: string) {
        const companyQuestions = questions.filter(q => q.company_id === companyId);
        if (companyQuestions.length === 0) {
            return companyCreatedAt ? new Date(companyCreatedAt).toLocaleDateString() : '—';
        }
        const dates = companyQuestions.map(q => new Date(q.created_at || 0).getTime());
        const maxDate = new Date(Math.max(...dates));
        return maxDate.toLocaleDateString();
    }

    function getPlatformFromUrl(url: string) {
        if (!url) return 'External';
        const lower = url.toLowerCase();
        if (lower.includes('leetcode.com')) return 'LeetCode';
        if (lower.includes('geeksforgeeks.org') || lower.includes('gfg.org')) return 'GeeksforGeeks';
        if (lower.includes('codeforces.com')) return 'Codeforces';
        if (lower.includes('interviewbit.com')) return 'InterviewBit';
        if (lower.includes('hackerrank.com')) return 'HackerRank';
        if (lower.includes('codechef.com')) return 'CodeChef';
        return 'External';
    }

    function getContributorName(createdByUserId: string) {
        if (!createdByUserId) return 'Community';
        return userMap[createdByUserId] || 'Community';
    }

    const companyQuestions = selectedCompany ? questions.filter(q => q.company_id === selectedCompany) : [];
    const solvedIds = new Set(progress.map(p => p.question_id));

    // Search and Sort questions inside the selected company
    const difficultyOrder: Record<string, number> = {
        easy: 1,
        medium: 2,
        hard: 3,
    };

    const filteredCompQuestions = companyQuestions
        .filter(q => {
            const matchesSearch = !search ||
                q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.topic?.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        })
        .sort((a, b) => {
            if (qSortBy === 'recent') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            if (qSortBy === 'topic') {
                return (a.topic || '').localeCompare(b.topic || '');
            }
            if (qSortBy === 'difficulty') {
                const aOrder = difficultyOrder[a.difficulty?.toLowerCase()] || 99;
                const bOrder = difficultyOrder[b.difficulty?.toLowerCase()] || 99;
                return aOrder - bOrder;
            }
            if (qSortBy === 'solved') {
                const aSolved = solvedIds.has(a.id) ? 1 : 0;
                const bSolved = solvedIds.has(b.id) ? 1 : 0;
                return bSolved - aSolved;
            }
            if (qSortBy === 'unsolved') {
                const aSolved = solvedIds.has(a.id) ? 1 : 0;
                const bSolved = solvedIds.has(b.id) ? 1 : 0;
                return aSolved - bSolved;
            }
            return 0;
        });

    const difficultyColor: Record<string, string> = {
        easy: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20',
        medium: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20',
        hard: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20',
    };

    // Filter and sort companies (simple search-based filter)
    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const currentSelectedCompanyName = selectedCompany
        ? companies.find(c => c.id === selectedCompany)?.name || 'Company'
        : '';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">
                        {selectedCompany ? `${currentSelectedCompanyName} Interview Questions` : "DSA Company Sheets"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        {selectedCompany
                            ? `Community-maintained coding questions frequently asked in ${currentSelectedCompanyName} interviews.`
                            : "Company-wise coding questions for placement prep"
                        }
                    </p>
                    {selectedCompany && (
                        <div className="flex items-center gap-4 text-xs mt-3.5 text-muted-foreground bg-muted/40 px-3.5 py-2 rounded-lg w-fit border">
                            <span>Questions: <strong className="text-foreground font-semibold">{companyQuestions.length}</strong></span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                            <span>Solved: <strong className="text-foreground font-semibold">{solvedIds.size}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {!selectedCompany ? (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Companies</p><p className="text-2xl font-bold">{companies.length}</p></div></CardContent></Card>
                        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Total Questions</p><p className="text-2xl font-bold">{questions.length}</p></div></CardContent></Card>
                        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-500" /></div><div><p className="text-sm text-muted-foreground">Solved</p><p className="text-2xl font-bold">{progress.length}</p></div></CardContent></Card>
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search companies..." className="pl-10 animate-fade-in" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                            <Button onClick={() => setShowAddCompany(true)} variant="default" className="bg-primary hover:bg-primary/95 text-white">
                                <Plus className="w-4 h-4 mr-2" />Add Company
                            </Button>
                        </div>
                    </div>

                    {/* Company Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Card key={i} className="h-28 animate-pulse bg-muted/50" />)}</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-stagger">
                            {filteredCompanies.map(c => {
                                const qCount = questions.filter(q => q.company_id === c.id).length;
                                const solvedCount = questions.filter(q => q.company_id === c.id && solvedIds.has(q.id)).length;
                                const lastUpdated = getCompanyLastUpdated(c.id, c.created_at);
                                return (
                                    <Card
                                        key={c.id}
                                        className="card-hover cursor-pointer relative flex flex-col justify-between p-5 border border-muted hover:border-primary/30 transition-all bg-card"
                                        onClick={() => { setSearchParams({ company: c.id }); setSearch(''); }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {c.logo_url ? (
                                                    <img
                                                        src={c.logo_url}
                                                        alt={`${c.name} logo`}
                                                        className="w-9 h-9 rounded-lg object-contain bg-white border shrink-0"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h3 className="font-heading font-semibold truncate text-base flex items-center gap-1.5 text-foreground">
                                                        {c.name}
                                                        {c.is_verified && (
                                                            <span title="Verified Company">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            </span>
                                                        )}
                                                    </h3>
                                                    {c.category && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mt-0.5">
                                                            {c.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-1" />
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-muted/50 flex flex-col gap-1 text-xs">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Questions: <strong className="text-foreground font-semibold">{qCount}</strong></span>
                                                <span>Solved: <strong className="text-foreground font-semibold">{solvedCount}</strong></span>
                                            </div>
                                            {solvedCount > 0 && (
                                                <div className="space-y-1 mt-1">
                                                    <Progress value={(solvedCount / qCount) * 100} className="h-1.5" />
                                                </div>
                                            )}
                                            <div className="text-[10px] text-muted-foreground/85 mt-2 flex justify-between">
                                                <span>Last Updated: {lastUpdated}</span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                            {filteredCompanies.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border rounded-lg">
                                    <Building2 className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                    <p>No companies found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <Button variant="ghost" onClick={() => { setSearchParams({}); setSearch(''); }} className="mb-4">
                        ← Back to Companies
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search questions by title or topic..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
                            <Select value={qSortBy} onValueChange={(v: any) => setQSortBy(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Sort Questions</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Recently Added</SelectItem>
                                    <SelectItem value="difficulty">Difficulty</SelectItem>
                                    <SelectItem value="topic">Topic (A-Z)</SelectItem>
                                    <SelectItem value="solved">Solved First</SelectItem>
                                    <SelectItem value="unsolved">Unsolved First</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/95 text-white">
                                <Plus className="w-4 h-4 mr-2" />Add Question
                            </Button>
                        </div>
                    </div>

                    {filteredCompQuestions.length > 0 ? (
                        <div className="overflow-x-auto border rounded-lg bg-card shadow-sm">
                            <table className="w-full text-sm text-left text-muted-foreground border-collapse min-w-[700px]">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b font-semibold">
                                    <tr>
                                        <th className="p-4 w-[8%] text-center">Status</th>
                                        <th className="p-4 w-[38%]">Question</th>
                                        <th className="p-4 w-[13%]">Topic</th>
                                        <th className="p-4 w-[13%]">Difficulty</th>
                                        <th className="p-4 w-[10%]">Platform</th>
                                        <th className="p-4 w-[10%]">Added By</th>
                                        <th className="p-4 w-[8%] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/40">
                                    {filteredCompQuestions.map((q, i) => {
                                        const isSolved = solvedIds.has(q.id);
                                        const platform = getPlatformFromUrl(q.leetcode_url);
                                        const addedBy = getContributorName(q.created_by);
                                        return (
                                            <tr key={q.id} className="hover:bg-muted/15 transition-colors align-middle h-14">
                                                <td className="p-4 text-center align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSolved}
                                                        onChange={() => toggleSolved(q.id)}
                                                        className="w-4.5 h-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer align-middle"
                                                    />
                                                </td>
                                                <td className="p-4 font-medium text-foreground align-middle">
                                                    <span className={cn("align-middle text-sm", isSolved ? "line-through text-muted-foreground/60 font-normal" : "text-slate-800 dark:text-slate-200")}>
                                                        {q.title}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {q.topic ? (
                                                        <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 py-0.5 px-2 rounded font-normal">
                                                            {q.topic}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className={cn('w-16 h-6 inline-flex items-center justify-center text-[10px] font-bold uppercase rounded-full border shrink-0', difficultyColor[q.difficulty?.toLowerCase()] || 'text-slate-500 bg-slate-500/10 border-slate-500/20')}>
                                                        {q.difficulty}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{platform}</span>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{addedBy}</span>
                                                </td>
                                                <td className="p-4 text-right align-middle">
                                                    {q.leetcode_url ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(q.leetcode_url, '_blank')}
                                                            className="h-8 text-xs font-semibold px-4 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            Solve
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 border border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground font-medium mb-4">No questions available yet.</p>
                            <Button onClick={() => setShowAdd(true)} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Question
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Add Company Dialog */}
            <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add a Company</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Company Name <span className="text-destructive">*</span></Label>
                            <Input value={newCompanyForm.name} onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })} placeholder="e.g. Google" />
                        </div>
                        <div>
                            <Label>Company Category</Label>
                            <Select value={newCompanyForm.category} onValueChange={v => setNewCompanyForm({ ...newCompanyForm, category: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Product">Product</SelectItem>
                                    <SelectItem value="Service">Service</SelectItem>
                                    <SelectItem value="Startup">Startup</SelectItem>
                                    <SelectItem value="MNC">MNC</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Logo URL (Optional)</Label>
                            <Input value={newCompanyForm.logoUrl} onChange={e => setNewCompanyForm({ ...newCompanyForm, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddCompany(false)}>Cancel</Button>
                        <Button onClick={addCompany} disabled={!newCompanyForm.name.trim()}>Add Company</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Question Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Add a Question</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Question Title <span className="text-destructive">*</span></Label>
                            <Input value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} placeholder="e.g. Two Sum" />
                        </div>
                        <div>
                            <Label>Topic <span className="text-destructive">*</span></Label>
                            <Input value={newQ.topic} onChange={e => setNewQ({ ...newQ, topic: e.target.value })} placeholder="e.g. Arrays, DP, Graphs" />
                            <span className="text-[11px] text-muted-foreground block mt-1">(Example: Arrays, DP, Graphs)</span>
                        </div>
                        <div>
                            <Label>Difficulty <span className="text-destructive">*</span></Label>
                            <Select value={newQ.difficulty} onValueChange={v => setNewQ({ ...newQ, difficulty: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Question URL <span className="text-destructive">*</span></Label>
                            <Input value={newQ.link} onChange={e => setNewQ({ ...newQ, link: e.target.value })} placeholder="https://leetcode.com/problems/..." />
                            <span className="text-[11px] text-muted-foreground block mt-1">(Paste LeetCode, GFG, Codeforces, InterviewBit link)</span>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button onClick={addQuestion}>Add Question</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toasts overlay list container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 ${t.type === 'success'
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
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
