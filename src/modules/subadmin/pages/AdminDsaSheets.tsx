import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Building2, BookOpen, ShieldCheck, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';

export default function AdminDsaSheets() {
    const { role } = useRole();
    const { user } = useUser();
    const [companies, setCompanies] = useState<any[]>([]);
    const [newCompany, setNewCompany] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCompany = searchParams.get('company') || '';
    const setSelectedCompany = (company: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (company) {
                next.set('company', company);
            } else {
                next.delete('company');
            }
            return next;
        });
    };
    const [questions, setQuestions] = useState<any[]>([]);

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
        }, 4000);
    };

    useEffect(() => {
        if (role === 'admin') {
            fetchCompanies();
        }
    }, [role]);

    useEffect(() => {
        if (selectedCompany) fetchQuestions();
        else setQuestions([]);
    }, [selectedCompany]);

    async function fetchCompanies() {
        try {
            const { data } = await insforge.database.from('dsa_companies').select('*').order('name');
            setCompanies((data || []).map(c => ({ ...c, is_verified: true })));
        } catch (err: any) {
            console.error("Error fetching companies:", err);
            showToast("Failed to fetch companies", "error");
        }
    }

    async function fetchQuestions() {
        try {
            const { data } = await insforge.database.from('dsa_questions')
                .select('*')
                .eq('company_id', selectedCompany)
                .order('created_at', { ascending: false });
            setQuestions(data || []);
        } catch (err: any) {
            console.error("Error fetching questions:", err);
            showToast("Failed to fetch questions", "error");
        }
    }

    async function handleAddCompany() {
        if (!newCompany.trim()) {
            showToast("Company name is required", "error");
            return;
        }

        const nameLower = newCompany.trim().toLowerCase();
        const duplicate = companies.some(c => c.name.toLowerCase() === nameLower);
        if (duplicate) {
            showToast("A company with this name already exists", "error");
            return;
        }

        try {
            const { data, error } = await insforge.database.from('dsa_companies').insert([{
                name: newCompany.trim(),
                category: 'Product',
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
                setCompanies(prev => [...prev, { ...data[0], is_verified: true }].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCompany('');
                showToast("Company added successfully!", "success");
            }
        } catch (err: any) {
            console.error("Error adding company:", err);
            showToast("Unexpected error adding company", "error");
        }
    }


    async function handleDeleteCompany(id: string) {
        if (!window.confirm("Are you sure? This will delete all associated questions.")) return;
        try {
            await insforge.database.from('dsa_companies').delete().eq('id', id);
            setCompanies(companies.filter(c => c.id !== id));
            showToast("Company deleted successfully", "success");
            if (selectedCompany === id) setSelectedCompany('');
        } catch (err: any) {
            console.error("Error deleting company:", err);
            showToast("Failed to delete company", "error");
        }
    }

    async function handleAddQuestion() {
        if (!newQ.title.trim() || !selectedCompany) {
            showToast("Question title is required", "error");
            return;
        }

        const titleLower = newQ.title.trim().toLowerCase();
        const duplicate = questions.some(q => q.title.toLowerCase() === titleLower);
        if (duplicate) {
            showToast("This question is already added for this company", "error");
            return;
        }

        try {
            const { data, error } = await insforge.database.from('dsa_questions').insert([{
                company_id: selectedCompany,
                title: newQ.title.trim(),
                leetcode_url: newQ.link.trim() || null,
                difficulty: newQ.difficulty ? (newQ.difficulty.charAt(0).toUpperCase() + newQ.difficulty.slice(1)) : 'Medium',
                topic: newQ.topic.trim() || null
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
                setNewQ({ title: '', link: '', difficulty: 'medium', topic: '' });
                showToast("Question added successfully!", "success");
            }
        } catch (err: any) {
            console.error("Error adding question:", err);
            showToast("Unexpected error adding question", "error");
        }
    }

    async function handleDeleteQuestion(id: string) {
        try {
            await insforge.database.from('dsa_questions').delete().eq('id', id);
            setQuestions(questions.filter(q => q.id !== id));
            showToast("Question deleted", "success");
        } catch (err: any) {
            console.error("Error deleting question:", err);
            showToast("Failed to delete question", "error");
        }
    }

    if (role !== 'admin' && role !== 'organization_admin') {
        return <div className="p-8 text-center text-destructive">Unauthorized: Admin access required</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Manage DSA Sheets</h1>
                    <p className="text-muted-foreground mt-1">Add or remove test preparation companies and coding questions.</p>
                </div>
                <SubadminFeatureToggle featureKey="dsa" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" /> Companies</CardTitle>
                        <CardDescription>Manage target companies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Input placeholder="Company Name (e.g. Google)" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
                            <Button onClick={handleAddCompany}><Plus className="w-4 h-4 mr-2" /> Add Company</Button>
                        </div>
                        <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2">
                            {companies.map(c => (
                                <div
                                    key={c.id}
                                    className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${selectedCompany === c.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                    onClick={() => setSelectedCompany(c.id)}
                                >
                                    <div className="flex flex-col gap-1 min-w-0 flex-1 mr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-sm truncate">{c.name}</span>
                                            {c.is_verified && (
                                                <span title="Verified Company">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                </span>
                                            )}
                                        </div>
                                        {c.category && (
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{c.category}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCompany(c.id); }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {companies.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No companies found.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> Questions</CardTitle>
                        <CardDescription>{selectedCompany ? `Manage questions for ${companies.find(c => c.id === selectedCompany)?.name}` : 'Select a company first'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedCompany ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
                                    <div className="col-span-2">
                                        <Label>Question Title <span className="text-destructive">*</span></Label>
                                        <Input placeholder="e.g. Two Sum" value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Topic</Label>
                                        <Input placeholder="e.g. Arrays, Hash Map" value={newQ.topic} onChange={e => setNewQ({ ...newQ, topic: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Difficulty</Label>
                                        <Select value={newQ.difficulty} onValueChange={v => setNewQ({ ...newQ, difficulty: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>External Link (Optional)</Label>
                                        <Input placeholder="https://leetcode.com/..." value={newQ.link} onChange={e => setNewQ({ ...newQ, link: e.target.value })} />
                                    </div>
                                    <Button className="col-span-2 mt-2" onClick={handleAddQuestion} disabled={!newQ.title.trim()}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Question
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {questions.map(q => (
                                        <div key={q.id} className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium text-sm">{q.title}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${q.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-500/10 text-emerald-500' : q.difficulty?.toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{q.difficulty}</span>
                                                    {q.topic && <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{q.topic}</span>}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {questions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No questions added for this company yet.</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                <p>Please select a company from the left panel to view and manage its questions.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
