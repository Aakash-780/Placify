import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure local worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();
import {
    FileText, Upload, Sparkles, AlertTriangle, Zap, Target,
    ArrowLeft, Plus, X, Download, Eye, Edit3, GraduationCap,
    Briefcase, Code2, FolderOpen, User, Mail, Phone, MapPin,
    Linkedin, Github, Globe, Trash2, Wand2, RefreshCw, FileUp, FileDown,
    CheckCircle2, AlertCircle, Info, Lightbulb, Check
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface Education {
    institution: string; degree: string; field: string;
    startYear: string; endYear: string; grade: string;
}
interface Experience {
    company: string; role: string; startDate: string;
    endDate: string; description: string;
}
interface Project { name: string; description: string; techStack: string; link: string; }
interface ResumeData {
    name: string; email: string; phone: string; location: string;
    linkedin: string; github: string; portfolio: string; summary: string;
    education: Education[]; experience: Experience[]; skills: string;
    projects: Project[];
}

const emptyResume: ResumeData = {
    name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '', summary: '',
    education: [{ institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' }],
    experience: [{ company: '', role: '', startDate: '', endDate: '', description: '' }],
    skills: '',
    projects: [{ name: '', description: '', techStack: '', link: '' }],
};

const RESUME_TEMPLATES = [
    { id: 'classic', name: 'Classic Professional', desc: 'Clean, traditional layout. Great for corporate roles.', color: 'from-blue-500 to-blue-600' },
    { id: 'modern', name: 'Modern Minimal', desc: 'Sleek and minimal. Perfect for all the technical roles.', color: 'from-purple-500 to-pink-500' },
    { id: 'creative', name: 'Creative Impact', desc: 'Bold sections with visual hierarchy. Ideal for design/creative roles.', color: 'from-amber-500 to-red-500' },
];

// ─── Classic Template ───────────────────────────────────────────────
function ClassicPreview({ data }: { data: ResumeData }) {
    const skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    return (
        <div className="bg-white text-black p-8 min-h-[800px] font-[Georgia,serif] text-[11px] leading-relaxed">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
                <h1 className="text-2xl font-bold tracking-wide uppercase">{data.name || 'Your Name'}</h1>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1.5 text-[10px] text-gray-600">
                    {data.email && <span>{data.email}</span>}
                    {data.phone && <span>{data.phone}</span>}
                    {data.location && <span>{data.location}</span>}
                    {data.linkedin && <span>LinkedIn: {data.linkedin}</span>}
                    {data.github && <span>GitHub: {data.github}</span>}
                </div>
            </div>
            {/* Summary */}
            {data.summary && (
                <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5">Professional Summary</h2>
                    <p className="text-gray-700">{data.summary}</p>
                </div>
            )}
            {/* Education */}
            {data.education.some(e => e.institution) && (
                <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5">Education</h2>
                    {data.education.filter(e => e.institution).map((edu, i) => (
                        <div key={i} className="mb-2">
                            <div className="flex justify-between">
                                <span className="font-bold">{edu.institution}</span>
                                <span className="text-gray-500">{edu.startYear} – {edu.endYear || 'Present'}</span>
                            </div>
                            <div className="text-gray-600">{edu.degree} {edu.field && `in ${edu.field}`} {edu.grade && `| ${edu.grade}`}</div>
                        </div>
                    ))}
                </div>
            )}
            {/* Experience */}
            {data.experience.some(e => e.company) && (
                <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5">Experience</h2>
                    {data.experience.filter(e => e.company).map((exp, i) => (
                        <div key={i} className="mb-2">
                            <div className="flex justify-between">
                                <span className="font-bold">{exp.role}</span>
                                <span className="text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
                            </div>
                            <div className="text-gray-600 italic">{exp.company}</div>
                            {exp.description && <p className="mt-0.5 text-gray-700">{exp.description}</p>}
                        </div>
                    ))}
                </div>
            )}
            {/* Projects */}
            {data.projects.some(p => p.name) && (
                <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5">Projects</h2>
                    {data.projects.filter(p => p.name).map((proj, i) => (
                        <div key={i} className="mb-2">
                            <span className="font-bold">{proj.name}</span>
                            {proj.techStack && <span className="text-gray-500 ml-2">({proj.techStack})</span>}
                            {proj.description && <p className="text-gray-700 mt-0.5">{proj.description}</p>}
                        </div>
                    ))}
                </div>
            )}
            {/* Skills */}
            {skills.length > 0 && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5">Skills</h2>
                    <p className="text-gray-700">{skills.join(' • ')}</p>
                </div>
            )}
        </div>
    );
}

// ─── Modern Template ────────────────────────────────────────────────
function ModernPreview({ data }: { data: ResumeData }) {
    const skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    return (
        <div className="bg-white text-black min-h-[800px] font-['Inter',sans-serif] text-[11px] leading-relaxed flex">
            {/* Left sidebar */}
            <div className="w-[35%] bg-slate-900 text-white p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold mb-2">
                        {data.name ? data.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h1 className="text-lg font-bold">{data.name || 'Your Name'}</h1>
                </div>
                {/* Contact */}
                <div className="mb-5">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 border-b border-slate-700 pb-1">Contact</h3>
                    <div className="space-y-1.5 text-slate-300 text-[10px]">
                        {data.email && <p>✉ {data.email}</p>}
                        {data.phone && <p>☎ {data.phone}</p>}
                        {data.location && <p>📍 {data.location}</p>}
                        {data.linkedin && <p>in {data.linkedin}</p>}
                        {data.github && <p>⌨ {data.github}</p>}
                        {data.portfolio && <p>🌐 {data.portfolio}</p>}
                    </div>
                </div>
                {/* Skills */}
                {skills.length > 0 && (
                    <div className="mb-5">
                        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 border-b border-slate-700 pb-1">Skills</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-300">{s}</span>
                            ))}
                        </div>
                    </div>
                )}
                {/* Education */}
                {data.education.some(e => e.institution) && (
                    <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 border-b border-slate-700 pb-1">Education</h3>
                        {data.education.filter(e => e.institution).map((edu, i) => (
                            <div key={i} className="mb-3">
                                <p className="font-semibold text-white text-[11px]">{edu.degree}</p>
                                <p className="text-slate-400 text-[10px]">{edu.institution}</p>
                                <p className="text-slate-500 text-[9px]">{edu.startYear} – {edu.endYear || 'Present'}</p>
                                {edu.grade && <p className="text-slate-400 text-[9px]">{edu.grade}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Right content */}
            <div className="flex-1 p-6">
                {data.summary && (
                    <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />About
                        </h2>
                        <p className="text-gray-600">{data.summary}</p>
                    </div>
                )}
                {data.experience.some(e => e.company) && (
                    <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Experience
                        </h2>
                        {data.experience.filter(e => e.company).map((exp, i) => (
                            <div key={i} className="mb-3 pl-3 border-l-2 border-purple-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800">{exp.role}</p>
                                        <p className="text-purple-600 text-[10px]">{exp.company}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{exp.startDate} – {exp.endDate || 'Present'}</span>
                                </div>
                                {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
                {data.projects.some(p => p.name) && (
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Projects
                        </h2>
                        {data.projects.filter(p => p.name).map((proj, i) => (
                            <div key={i} className="mb-3 pl-3 border-l-2 border-purple-200">
                                <p className="font-bold text-slate-800">{proj.name}</p>
                                {proj.techStack && <p className="text-purple-600 text-[10px]">{proj.techStack}</p>}
                                {proj.description && <p className="text-gray-600 mt-0.5">{proj.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Creative Template ──────────────────────────────────────────────
function CreativePreview({ data }: { data: ResumeData }) {
    const skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    return (
        <div className="bg-white text-black min-h-[800px] font-['Inter',sans-serif] text-[11px] leading-relaxed">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-amber-500 to-red-500 text-white p-8 pb-10 relative">
                <h1 className="text-2xl font-black">{data.name || 'Your Name'}</h1>
                {data.summary && <p className="text-amber-100 mt-1 text-[11px] max-w-[80%]">{data.summary}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-amber-100">
                    {data.email && <span>✉ {data.email}</span>}
                    {data.phone && <span>☎ {data.phone}</span>}
                    {data.location && <span>📍 {data.location}</span>}
                    {data.linkedin && <span>in {data.linkedin}</span>}
                    {data.github && <span>⌨ {data.github}</span>}
                </div>
            </div>
            <div className="p-6 space-y-5 -mt-4">
                {/* Skills Pills */}
                {skills.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">Skills</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-full text-[10px] font-medium text-amber-800">{s}</span>
                            ))}
                        </div>
                    </div>
                )}
                {/* Experience */}
                {data.experience.some(e => e.company) && (
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">Experience</h2>
                        {data.experience.filter(e => e.company).map((exp, i) => (
                            <div key={i} className="mb-3 bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-800">{exp.role} <span className="font-normal text-amber-600">@ {exp.company}</span></span>
                                    <span className="text-[9px] text-gray-400">{exp.startDate} – {exp.endDate || 'Now'}</span>
                                </div>
                                {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
                {/* Education */}
                {data.education.some(e => e.institution) && (
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">Education</h2>
                        {data.education.filter(e => e.institution).map((edu, i) => (
                            <div key={i} className="mb-2 bg-gray-50 rounded-lg p-3">
                                <span className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</span>
                                <span className="text-gray-500 ml-2">{edu.institution} ({edu.startYear}–{edu.endYear || 'Present'})</span>
                                {edu.grade && <span className="text-amber-600 ml-1">| {edu.grade}</span>}
                            </div>
                        ))}
                    </div>
                )}
                {/* Projects */}
                {data.projects.some(p => p.name) && (
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">Projects</h2>
                        {data.projects.filter(p => p.name).map((proj, i) => (
                            <div key={i} className="mb-2 bg-gray-50 rounded-lg p-3">
                                <span className="font-bold">{proj.name}</span>
                                {proj.techStack && <span className="text-amber-600 text-[10px] ml-2">{proj.techStack}</span>}
                                {proj.description && <p className="text-gray-600 mt-0.5">{proj.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Resume Editor Form ─────────────────────────────────────────────
function ResumeEditor({
    data, setData, onBack, onGenerateSummary, generating, templateId
}: {
    data: ResumeData; setData: (d: ResumeData) => void;
    onBack: () => void; onGenerateSummary: () => void;
    generating: boolean; templateId: string;
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = (searchParams.get('mode') as 'edit' | 'preview') || 'edit';
    const setViewMode = (mode: 'edit' | 'preview') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('mode', mode);
            return next;
        });
    };
    const previewRef = useRef<HTMLDivElement>(null);

    const updateEdu = (i: number, field: keyof Education, val: string) => {
        const arr = [...data.education]; arr[i] = { ...arr[i], [field]: val }; setData({ ...data, education: arr });
    };
    const updateExp = (i: number, field: keyof Experience, val: string) => {
        const arr = [...data.experience]; arr[i] = { ...arr[i], [field]: val }; setData({ ...data, experience: arr });
    };
    const updateProj = (i: number, field: keyof Project, val: string) => {
        const arr = [...data.projects]; arr[i] = { ...arr[i], [field]: val }; setData({ ...data, projects: arr });
    };

    const handlePrint = () => {
        const content = previewRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html><head><title>${data.name || 'Resume'}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', Georgia, serif; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
            <script src="https://cdn.tailwindcss.com"><\/script>
            </head><body>${content.innerHTML}</body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
    };

    const PreviewComponent = templateId === 'classic' ? ClassicPreview : templateId === 'modern' ? ModernPreview : CreativePreview;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back to Templates</Button>
                <div className="flex gap-2">
                    <Button variant={viewMode === 'edit' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('edit')}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                    </Button>
                    <Button variant={viewMode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('preview')}>
                        <Eye className="w-4 h-4 mr-1" />Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePrint}>
                        <Download className="w-4 h-4 mr-1" />Download PDF
                    </Button>
                </div>
            </div>

            {viewMode === 'edit' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Editor */}
                    <div className="space-y-4">
                        {/* Personal Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div><Label>Full Name *</Label><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="John Doe" /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><Label><Mail className="w-3 h-3 inline mr-1" />Email</Label><Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="john@example.com" /></div>
                                    <div><Label><Phone className="w-3 h-3 inline mr-1" />Phone</Label><Input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                                </div>
                                <div><Label><MapPin className="w-3 h-3 inline mr-1" />Location</Label><Input value={data.location} onChange={e => setData({ ...data, location: e.target.value })} placeholder="Indore, India" /></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><Label><Linkedin className="w-3 h-3 inline mr-1" />LinkedIn</Label><Input value={data.linkedin} onChange={e => setData({ ...data, linkedin: e.target.value })} placeholder="linkedin.com/in/..." /></div>
                                    <div><Label><Github className="w-3 h-3 inline mr-1" />GitHub</Label><Input value={data.github} onChange={e => setData({ ...data, github: e.target.value })} placeholder="github.com/..." /></div>
                                    <div><Label><Globe className="w-3 h-3 inline mr-1" />Portfolio</Label><Input value={data.portfolio} onChange={e => setData({ ...data, portfolio: e.target.value })} placeholder="yoursite.com" /></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Professional Summary</CardTitle>
                                    <Button variant="outline" size="sm" onClick={onGenerateSummary} disabled={generating}>
                                        <Wand2 className="w-3.5 h-3.5 mr-1" />{generating ? 'Generating...' : 'AI Generate'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Textarea rows={3} value={data.summary} onChange={e => setData({ ...data, summary: e.target.value })} placeholder="A brief 2-3 line summary of your career and goals..." />
                            </CardContent>
                        </Card>

                        {/* Education */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-4 h-4" />Education</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setData({ ...data, education: [...data.education, { institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' }] })}>
                                        <Plus className="w-4 h-4 mr-1" />Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/40 relative">
                                        {data.education.length > 1 && (
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 w-6 h-6" onClick={() => setData({ ...data, education: data.education.filter((_, j) => j !== i) })}>
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        )}
                                        <div><Label>Institution</Label><Input value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} placeholder="SVVV Indore" /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label>Degree</Label><Input value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="B.Tech" /></div>
                                            <div><Label>Field of Study</Label><Input value={edu.field} onChange={e => updateEdu(i, 'field', e.target.value)} placeholder="Computer Science" /></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><Label>Start Year</Label><Input value={edu.startYear} onChange={e => updateEdu(i, 'startYear', e.target.value)} placeholder="2021" /></div>
                                            <div><Label>End Year</Label><Input value={edu.endYear} onChange={e => updateEdu(i, 'endYear', e.target.value)} placeholder="2025" /></div>
                                            <div><Label>Grade/CGPA</Label><Input value={edu.grade} onChange={e => updateEdu(i, 'grade', e.target.value)} placeholder="8.5 CGPA" /></div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Experience */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" />Experience</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setData({ ...data, experience: [...data.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }] })}>
                                        <Plus className="w-4 h-4 mr-1" />Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.experience.map((exp, i) => (
                                    <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/40 relative">
                                        {data.experience.length > 1 && (
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 w-6 h-6" onClick={() => setData({ ...data, experience: data.experience.filter((_, j) => j !== i) })}>
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label>Company</Label><Input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Google" /></div>
                                            <div><Label>Role</Label><Input value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)} placeholder="SDE Intern" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label>Start Date</Label><Input value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)} placeholder="Jun 2024" /></div>
                                            <div><Label>End Date</Label><Input value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)} placeholder="Aug 2024 or Present" /></div>
                                        </div>
                                        <div><Label>Description</Label><Textarea rows={2} value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)} placeholder="Describe your key achievements and responsibilities..." /></div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2"><Code2 className="w-4 h-4" />Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input value={data.skills} onChange={e => setData({ ...data, skills: e.target.value })} placeholder="React, Node.js, Python, SQL, Git, Docker, AWS..." />
                                <p className="text-xs text-muted-foreground mt-1">Separate skills with commas</p>
                            </CardContent>
                        </Card>

                        {/* Projects */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" />Projects</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setData({ ...data, projects: [...data.projects, { name: '', description: '', techStack: '', link: '' }] })}>
                                        <Plus className="w-4 h-4 mr-1" />Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.projects.map((proj, i) => (
                                    <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/40 relative">
                                        {data.projects.length > 1 && (
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 w-6 h-6" onClick={() => setData({ ...data, projects: data.projects.filter((_, j) => j !== i) })}>
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label>Project Name</Label><Input value={proj.name} onChange={e => updateProj(i, 'name', e.target.value)} placeholder="Placify" /></div>
                                            <div><Label>Tech Stack</Label><Input value={proj.techStack} onChange={e => updateProj(i, 'techStack', e.target.value)} placeholder="React, Node.js" /></div>
                                        </div>
                                        <div><Label>Description</Label><Textarea rows={2} value={proj.description} onChange={e => updateProj(i, 'description', e.target.value)} placeholder="What does this project do?" /></div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Live Preview (side-by-side on large screens) */}
                    <div className="hidden lg:block sticky top-4">
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4" />Live Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div ref={previewRef} className="origin-top-left scale-[0.55] w-[182%] -ml-[0%]">
                                    <PreviewComponent data={data} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* Full Preview Mode */
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div ref={previewRef} className="max-w-[800px] mx-auto shadow-xl">
                            <PreviewComponent data={data} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}










async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
    console.log("PDF File:", file);
    if (file.size > 10 * 1024 * 1024) {
        throw new Error("PDF exceeds supported size limit.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }
    return { text: fullText, pages: pdf.numPages };
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ResumeBuilder() {
    const { roleData } = useRole();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'templates';
    const setActiveTab = (tab: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    const selectedTemplate = searchParams.get('template') || null;
    const setSelectedTemplate = (template: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (template) {
                next.set('template', template);
            } else {
                next.delete('template');
            }
            return next;
        });
    };
    const [resumeData, setResumeData] = useState<ResumeData>({ ...emptyResume });
    const [generating, setGenerating] = useState(false);

    // Toasts State
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

    // Mount-time CloudConvert API Authentication Audit
    useEffect(() => {
        const auditCloudConvert = async () => {
            const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY || import.meta.env.VITE_CONVERT_API_SECRET;
            console.log("--- CLOUDCONVERT TEST REPORT ---");
            console.log("Checking environment variables...");
            if (!apiKey) {
                console.log("VITE_CLOUDCONVERT_API_KEY present: false");
                console.log("VITE_CONVERT_API_SECRET present: false");
                console.log("Result: Authentication Failed (Keys are missing)");
                console.log("--------------------------------");
                return;
            }

            console.log(`VITE_CLOUDCONVERT_API_KEY present: ${!!import.meta.env.VITE_CLOUDCONVERT_API_KEY}`);
            console.log(`VITE_CONVERT_API_SECRET present: ${!!import.meta.env.VITE_CONVERT_API_SECRET}`);
            console.log(`API Key (censored): ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`);

            try {
                const res = await fetch("https://api.cloudconvert.com/v2/users/me", {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Authentication Response Status:", res.status);
                    console.log("Authentication Result: Success");
                    console.log("Authenticated User Name:", data.data?.name || "Unknown");
                } else {
                    console.log("Authentication Response Status:", res.status);
                    let errMsg = "Authentication Failed";
                    try {
                        const errData = await res.json();
                        errMsg += `: ${errData.message || JSON.stringify(errData)}`;
                    } catch (jsonErr) {
                        const rawText = await res.text();
                        errMsg += `: ${rawText || "No response body"}`;
                    }
                    console.log("Result:", errMsg);
                }
            } catch (err: any) {
                console.log("Result: Network Connection Error during authentication", err);
            }
            console.log("--------------------------------");
        };

        auditCloudConvert();
    }, []);

    // ATS State
    const [resumeText, setResumeText] = useState('');
    const [atsPdfPayload, setAtsPdfPayload] = useState<{ base64: string, name: string } | null>(null);
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [atsFeedback, setAtsFeedback] = useState<string>('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [checking, setChecking] = useState(false);

    interface AtsFileMetadata {
        name: string;
        size: number;
        type: string;
        pages: number;
        wordCount: number;
        uploadTime: string;
    }
    const [atsFileMetadata, setAtsFileMetadata] = useState<AtsFileMetadata | null>(null);

    interface BreakdownData {
        keywordMatch: number;
        actionVerbs: number;
        resumeLength: number;
        formatting: number;
        projects: number;
        experience: number;
    }
    const [atsBreakdown, setAtsBreakdown] = useState<BreakdownData | null>(null);

    interface InsightsData {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    }
    const [atsInsights, setAtsInsights] = useState<InsightsData | null>(null);

    // Converters State
    const [convertFile, setConvertFile] = useState<File | null>(null);
    const [convertMode, setConvertMode] = useState<'pdf-to-docx' | 'docx-to-pdf'>('pdf-to-docx');
    const [converting, setConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string>('');
    const [convertedFileName, setConvertedFileName] = useState<string>('');
    const [conversionStatus, setConversionStatus] = useState<'idle' | 'uploading' | 'converting' | 'preparing' | 'ready' | 'error'>('idle');
    const [converterError, setConverterError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => {
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const allowedExt = convertMode === 'pdf-to-docx' ? '.pdf' : '.docx';
            if (file.name.endsWith(allowedExt)) {
                setConvertFile(file);
                setDownloadUrl('');
                setConvertedFileName('');
                setConversionStatus('idle');
                setConverterError(null);
            } else {
                showToast(`Invalid file type. Please upload a ${allowedExt} file.`, "error");
            }
        }
    };

    function handleSelectTemplate(id: string) {
        setSelectedTemplate(id);
        // Pre-fill from profile if available
        if (roleData) {
            setResumeData(prev => ({
                ...prev,
                name: roleData.name || '',
                email: roleData.email || '',
                phone: roleData.phone || '',
                linkedin: roleData.linkedin_url || '',
                github: roleData.github_url || '',
                portfolio: roleData.portfolio_url || '',
            }));
        }
    }

    async function handleGenerateSummary() {
        setGenerating(true);
        try {
            const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
            if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') throw new Error('API key needed');
            const prompt = `You are a professional resume writer. Generate a concise 2-3 sentence professional summary based on the user's details. Return ONLY the summary text, no quotes or labels.\n\nName: ${resumeData.name}\nSkills: ${resumeData.skills}\nEducation: ${resumeData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join(', ')}\nExperience: ${resumeData.experience.map(e => `${e.role} at ${e.company}`).join(', ')}\nProjects: ${resumeData.projects.map(p => p.name).join(', ')}`;

            const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
                try {
                    const res = await fetch(url, options);
                    if ((res.status === 503 || res.status === 429) && retries > 0) {
                        console.warn(`Gemini API returned ${res.status}. Retrying in ${delay}ms... (${retries} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return fetchWithRetry(url, options, retries - 1, delay * 2);
                    }
                    return res;
                } catch (err) {
                    if (retries > 0) {
                        console.warn(`Gemini API fetch failed:`, err, `Retrying in ${delay}ms... (${retries} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return fetchWithRetry(url, options, retries - 1, delay * 2);
                    }
                    throw err;
                }
            };

            const res = await fetchWithRetry(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
                    }),
                }
            );
            if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
            const data = await res.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) setResumeData(prev => ({ ...prev, summary: content.trim().replace(/^["']|["']$/g, '') }));
        } catch (err) { console.error(err); }
        finally { setGenerating(false); }
    }

    async function handleResumeUploadForATS(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("PDF File:", file);
        showToast("Uploading resume...", "info");

        let extractedText = '';
        let pagesCount = 1;

        if (file.type === 'application/pdf') {
            setAtsPdfPayload({ base64: '', name: file.name });
            setResumeText('Extracting text from PDF locally...');
            try {
                // Try local extraction first
                const { text: localText, pages } = await extractPdfText(file);
                extractedText = localText;
                pagesCount = pages;

                if (extractedText.trim().length < 50) {
                    setResumeText(extractedText);
                    setAtsPdfPayload(null);
                    showToast("PDF contains mostly images. ATS score may be inaccurate.", "info");
                } else {
                    setResumeText(extractedText);
                    setAtsPdfPayload(null);
                    showToast(`Successfully extracted ${pages} pages.`, "success");
                }
            } catch (localErr) {
                console.warn("Local PDF extraction failed. Falling back to CloudConvert...", localErr);
                showToast("Local extraction failed, attempting CloudConvert fallback...", "info");

                const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY || import.meta.env.VITE_CONVERT_API_SECRET;
                console.log("CloudConvert API Key Exists:", !!apiKey);

                if (file.size > 10 * 1024 * 1024) {
                    setResumeText("PDF exceeds supported size limit.");
                    setAtsPdfPayload(null);
                    showToast("PDF exceeds supported size limit of 10MB.", "error");
                    return;
                }

                if (!apiKey || apiKey === 'your_secret_here') {
                    setResumeText("CloudConvert API Key is missing.");
                    setAtsPdfPayload(null);
                    showToast("CloudConvert API Key is missing.", "error");
                    return;
                }

                try {
                    console.log("Creating CloudConvert Job (ATS Fallback)...");
                    const jobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            tasks: {
                                'upload-file': { operation: 'import/upload' },
                                'convert-file': {
                                    operation: 'convert',
                                    input: 'upload-file',
                                    input_format: 'pdf',
                                    output_format: 'txt'
                                },
                                'export-url': {
                                    operation: 'export/url',
                                    input: 'convert-file'
                                }
                            }
                        })
                    });

                    if (!jobRes.ok) {
                        let errorDetail = '';
                        try {
                            const errData = await jobRes.json();
                            errorDetail = errData.message || JSON.stringify(errData);
                        } catch {
                            errorDetail = await jobRes.text();
                        }
                        console.log(`CloudConvert Error: HTTP ${jobRes.status} - ${errorDetail}`);
                        throw new Error(`Job creation failed: ${errorDetail}`);
                    }

                    const jobData = await jobRes.json();
                    console.log("CloudConvert Task Created");

                    const uploadTask = jobData.data?.tasks?.find((t: any) => t.name === 'upload-file');
                    if (!uploadTask || !uploadTask.result?.form) {
                        throw new Error("Upload form parameters missing.");
                    }

                    const uploadUrl = uploadTask.result.form.url;
                    const uploadParams = uploadTask.result.form.parameters;

                    console.log("Uploading file to CloudConvert (ATS Fallback)...");
                    const uploadFormData = new FormData();
                    for (const key in uploadParams) {
                        uploadFormData.append(key, uploadParams[key]);
                    }
                    uploadFormData.append('file', file);

                    const uploadRes = await fetch(uploadUrl, {
                        method: 'POST',
                        body: uploadFormData
                    });

                    if (!uploadRes.ok) {
                        let errorDetail = '';
                        try {
                            errorDetail = await uploadRes.text();
                        } catch { }
                        console.log(`CloudConvert Error: HTTP ${uploadRes.status} - Upload failed. ${errorDetail}`);
                        throw new Error(`Upload failed. Status: ${uploadRes.status}`);
                    }
                    console.log("Upload Complete");

                    const jobId = jobData.data.id;
                    let txtUrl = '';
                    const maxRetries = 60;
                    for (let i = 0; i < maxRetries; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`
                            }
                        });

                        if (!pollRes.ok) {
                            let errorDetail = '';
                            try {
                                errorDetail = await pollRes.text();
                            } catch { }
                            console.log(`CloudConvert Error: HTTP ${pollRes.status} - Polling failed. ${errorDetail}`);
                            throw new Error(`Polling failed. Status: ${pollRes.status}`);
                        }

                        const pollData = await pollRes.json();
                        const tasks = pollData.data?.tasks || [];
                        const failedTask = tasks.find((t: any) => t.status === 'failed');
                        if (failedTask) {
                            const taskErr = failedTask.message || `Task failed`;
                            console.log(`CloudConvert Error: ${taskErr}`);
                            throw new Error(taskErr);
                        }

                        const exportTask = tasks.find((t: any) => t.name === 'export-url');
                        if (exportTask && exportTask.status === 'finished') {
                            txtUrl = exportTask.result?.files?.[0]?.url;
                            break;
                        }
                    }

                    if (!txtUrl) {
                        throw new Error("Conversion timed out.");
                    }

                    console.log("Conversion Complete");

                    const txtContentRes = await fetch(txtUrl);
                    if (!txtContentRes.ok) {
                        throw new Error(`Failed to download converted text file. Status: ${txtContentRes.status}`);
                    }

                    const extractedTextContent = await txtContentRes.text();
                    console.log("Download URL Generated");

                    extractedText = extractedTextContent;
                    pagesCount = 1;

                    if (extractedText.trim().length < 50) {
                        setResumeText(extractedText);
                        showToast("PDF contains mostly images. ATS score may be inaccurate.", "info");
                    } else {
                        setResumeText(extractedText);
                        showToast(`Successfully extracted pages.`, "success");
                    }
                    setAtsPdfPayload(null);
                } catch (ccErr: any) {
                    console.error("CloudConvert Fallback Error:", ccErr);
                    console.log("CloudConvert Error");
                    setResumeText("Unable to extract text via CloudConvert fallback.");
                    setAtsPdfPayload(null);
                    showToast("Error during CloudConvert fallback extraction.", "error");
                }
            }
        } else if (file.name.endsWith('.docx')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedText = result.value;
                setResumeText(extractedText);
                setAtsPdfPayload(null);
                showToast("DOCX file uploaded successfully.", "success");
            } catch (docxErr) {
                console.error("DOCX extraction error:", docxErr);
                showToast("Failed to parse DOCX file.", "error");
            }
        } else {
            try {
                const text = await file.text();
                extractedText = text;
                setResumeText(text);
                setAtsPdfPayload(null);
                showToast("Text file uploaded successfully.", "success");
            } catch (txtErr) {
                console.error("TXT extraction error:", txtErr);
                showToast("Failed to parse file.", "error");
            }
        }

        if (extractedText) {
            const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
            const uploadTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setAtsFileMetadata({
                name: file.name,
                size: file.size,
                type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.docx') ? 'DOCX' : 'TXT',
                pages: pagesCount,
                wordCount,
                uploadTime
            });
            showToast("Resume uploaded successfully", "success");
        }

        setActiveTab('ats');
    }

    async function checkATS() {
        if (!resumeText.trim()) return;
        setChecking(true);
        setAtsScore(null);
        setKeywords([]);
        setAtsFeedback('');
        setAtsBreakdown(null);
        setAtsInsights(null);

        const text = resumeText.toLowerCase();

        // 1. HEURISTIC CALCULATION (Score & Keywords)
        const actionVerbs = ['developed', 'managed', 'created', 'led', 'designed', 'implemented', 'orchestrated', 'built', 'improved', 'reduced', 'increased', 'optimized', 'spearheaded', 'resolved', 'architected'];
        let verbsFound = actionVerbs.filter(v => text.includes(v)).length;

        const techKeywords = ['react', 'node', 'python', 'java', 'aws', 'docker', 'kubernetes', 'typescript', 'sql', 'nosql', 'agile', 'git', 'ci/cd', 'machine learning', 'api', 'rest', 'graphql', 'c++', 'linux', 'azure'];
        const foundTech = techKeywords.filter(kw => text.includes(kw));
        const missingTech = techKeywords.filter(kw => !text.includes(kw));

        let score = 40;
        const wordsCount = text.split(/\s+/).length;
        if (wordsCount > 250 && wordsCount < 800) score += 20;
        else if (wordsCount >= 800) score += 10;
        else score += 5;

        score += Math.min(20, verbsFound * 2.5);
        score += Math.min(20, foundTech.length * 2.5);

        let finalScore = Math.min(100, Math.floor(score));

        setAtsScore(finalScore);
        const topMissing = missingTech.slice(0, 4);
        setKeywords(topMissing);

        // Calculate Breakdown Scores
        const keywordMatchPercent = Math.min(100, Math.floor((foundTech.length / 8) * 100));
        const actionVerbsPercent = Math.min(100, Math.floor((verbsFound / 6) * 100));

        let resumeLengthPercent = 40;
        if (wordsCount >= 300 && wordsCount <= 700) resumeLengthPercent = 100;
        else if (wordsCount >= 200 && wordsCount <= 900) resumeLengthPercent = 75;
        else if (wordsCount > 0) resumeLengthPercent = 50;

        let formattingPercent = 50;
        const hasEdu = text.includes('education') || text.includes('university') || text.includes('college') || text.includes('school');
        const hasExp = text.includes('experience') || text.includes('work') || text.includes('history') || text.includes('employment');
        const hasProj = text.includes('project') || text.includes('portfolio');
        const sectionsCount = [hasEdu, hasExp, hasProj].filter(Boolean).length;
        if (sectionsCount === 3) formattingPercent = 100;
        else if (sectionsCount === 2) formattingPercent = 75;
        else if (sectionsCount === 1) formattingPercent = 60;

        let projectsPercent = 40;
        const projCount = (text.match(/project/g) || []).length;
        if (projCount >= 3) projectsPercent = 100;
        else if (projCount === 2) projectsPercent = 80;
        else if (projCount === 1) projectsPercent = 60;

        let experiencePercent = 40;
        const expCount = (text.match(/experience|intern|work|engineer|developer/g) || []).length;
        if (expCount >= 5) experiencePercent = 100;
        else if (expCount >= 3) experiencePercent = 80;
        else if (expCount >= 1) experiencePercent = 60;

        setAtsBreakdown({
            keywordMatch: keywordMatchPercent,
            actionVerbs: actionVerbsPercent,
            resumeLength: resumeLengthPercent,
            formatting: formattingPercent,
            projects: projectsPercent,
            experience: experiencePercent
        });

        // Calculate Strengths, Weaknesses, Recommendations
        const strengthsList: string[] = [];
        const weaknessesList: string[] = [];
        const recsList: string[] = [];

        if (resumeLengthPercent >= 75) {
            strengthsList.push(`Optimal word count (${wordsCount} words) suitable for ATS parsing.`);
        } else {
            weaknessesList.push(`Sub-optimal resume length (${wordsCount} words). A professional resume should contain between 300 to 700 words.`);
            recsList.push("Expand or condense your content to achieve the standard length of 300-700 words.");
        }

        if (actionVerbsPercent >= 75) {
            strengthsList.push(`Strong action verbs usage (${verbsFound} found) demonstrating leadership and action.`);
        } else {
            weaknessesList.push(`Weak action verbs utilization (${verbsFound} found). Bullet points might read passively.`);
            recsList.push("Start experience bullet points with strong verbs (e.g., 'orchestrated', 'spearheaded', 'optimized').");
        }

        if (keywordMatchPercent >= 75) {
            strengthsList.push("Excellent keyword density matching core technical requirements.");
        } else {
            weaknessesList.push("Low keyword match score. Missing key industry skills and technologies.");
            recsList.push("Incorporate relevant technical keywords such as " + topMissing.join(", ") + " contextually.");
        }

        if (formattingPercent === 100) {
            strengthsList.push("Well-structured with all standard sections (Education, Experience, Projects).");
        } else {
            weaknessesList.push("Incomplete sections. Missing key organizational parts.");
            recsList.push("Ensure your resume has dedicated and labeled sections for Education, Projects, and Experience.");
        }

        if (projectsPercent >= 80) {
            strengthsList.push("Good representation of software/technical projects.");
        } else {
            weaknessesList.push("Lack of robust projects detail or technical descriptors.");
            recsList.push("Detail at least 2-3 technical projects including the technologies used and live links.");
        }

        if (experiencePercent >= 80) {
            strengthsList.push("Comprehensive professional or internship history details.");
        } else {
            weaknessesList.push("Limited professional description details.");
            recsList.push("Use the STAR method (Situation, Task, Action, Result) with quantifiable metrics to describe experience.");
        }

        setAtsInsights({
            strengths: strengthsList.slice(0, 3),
            weaknesses: weaknessesList.slice(0, 3),
            recommendations: recsList.slice(0, 3)
        });

        setAtsFeedback('Generating Hybrid AI feedback...\n');

        try {
            // 2. GEMINI AI FEEDBACK (Robust Authenticated API)
            const prompt = `You are an expert HR ATS Resume Analyzer. I calculated the candidate's ATS baseline metric score to be ${finalScore}/100 and identified these missing technical keywords: ${topMissing.join(', ')}. Write a short, highly professional feedback block telling the candidate how to improve their resume structure, specifically instructing them to add these keywords. Additionally, explicitly list any vital missing resume content that is usually expected (e.g., quantifiable metrics, contact info, education, project links, or experience). Return ONLY plain text, absolutely no markdown formatting. Keep it concise. Resume snippet context:\n\n${resumeText.substring(0, 1500)}`;

            const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
            const GROK_KEY = import.meta.env.VITE_GROK_API_KEY;

            if (!GEMINI_KEY && !GROK_KEY) {
                throw new Error('Either Gemini or Grok API key needed for advanced feedback');
            }

            let aiFeedbackText = "";
            let geminiErrMessage = "";

            try {
                if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') throw new Error('No Gemini API Key');

                let geminiSuccess = false;
                let retries = 0;
                let res: Response | null = null;

                while (retries < 3 && !geminiSuccess) {
                    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.5 }
                        })
                    });

                    if (res.ok) {
                        geminiSuccess = true;
                    } else if (res.status === 429 || res.status === 503) {
                        retries++;
                        if (retries < 3) {
                            console.warn(`Gemini ${res.status}, waiting 10s before retry...`);
                            await new Promise(resolve => setTimeout(resolve, 10000));
                        }
                    } else {
                        break;
                    }
                }

                if (!geminiSuccess && res) {
                    throw new Error(`Gemini AI Error ${res.status}`);
                }

                const data = await res?.json();
                aiFeedbackText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!aiFeedbackText) throw new Error('Empty Gemini AI response');
            } catch (geminiErr: any) {
                console.warn("Gemini ATS Failed, attempting Grok Fallback", geminiErr);
                geminiErrMessage = geminiErr.message || String(geminiErr);
                if (!GROK_KEY) throw geminiErr; // If no Grok key, throw the Gemini error to UI

                const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROK_KEY}`
                    },
                    body: JSON.stringify({
                        messages: [{ role: "user", content: prompt }],
                        model: "grok-2",
                        temperature: 0.5
                    })
                });

                if (!grokRes.ok) {
                    const errData = await grokRes.json().catch(() => null);
                    const msg = errData?.error || errData?.message || `Grok AI Error ${grokRes.status}`;
                    throw new Error(`Gemini failed (${geminiErrMessage}) AND Grok failed: ${msg}`);
                }

                const grokData = await grokRes.json();
                aiFeedbackText = grokData.choices?.[0]?.message?.content;
                if (!aiFeedbackText) throw new Error('Empty Grok AI response');
            }

            setAtsFeedback(aiFeedbackText.trim());
            showToast("ATS analysis completed", "success");

            if (roleData?.id) {
                const { error } = await insforge.database.from('ats_scans').insert([{
                    student_id: roleData.id,
                    score: finalScore,
                    feedback: aiFeedbackText.trim(),
                    missing_keywords: topMissing
                }]);
                if (error) console.warn("Failed to save ATS history:", error);
            }
        } catch (err: any) {
            console.error('ATS check error:', err);
            showToast("ATS analysis completed with fallbacks", "info");

            // Comprehensive Heuristic Fallback Feedback
            const wordCount = text.split(/\s+/).length;
            let fb = '• **ATS Core Engine Analysis Active:** AI generation is temporarily unreachable, falling back to heuristic parsing.\n\n';

            // Length Check
            if (wordCount < 250) fb += `• **Length:** Your resume is too short (${wordCount} words). Recruiters expect more detail and quantifiable metrics.\n`;
            else if (wordCount > 800) fb += `• **Length:** Your resume may be too long (${wordCount} words). Ensure it uses concise bullet points rather than paragraphs.\n`;
            else fb += `• **Length:** Excellent length (${wordCount} words). This usually parses well into standard ATS templates.\n`;

            // Action Verbs
            if (verbsFound < 5) fb += `• **Action Verbs (Weak):** We only found ${verbsFound} strong action verbs (e.g., 'developed', 'led', 'optimized'). Start your bullet points with high-impact action verbs to demonstrate leadership and execution.\n`;
            else fb += `• **Action Verbs (Strong):** You effectively utilized ${verbsFound} high-impact action verbs to describe your experience.\n`;

            // Keywords
            if (foundTech.length > 0) fb += `• **Keywords Found:** The system successfully extracted core technical keywords: ${foundTech.slice(0, 5).join(', ')}.\n`;
            if (missingTech.length > 0) fb += `• **Keywords Missing:** To improve visibility, strategically embed missing technical keywords like: ${missingTech.slice(0, 4).join(', ')}.\n`;

            // General Advice
            if (atsScore !== null && atsScore >= 80) fb += '\n• **Summary:** Great structure and keyword density! Looking highly compatible for ATS parsers.';
            else fb += '\n• **Summary:** Review the missing metrics above and restructure your bullet points. Make sure you highlight quantifiable achievements (e.g., "Increased server speed by 20%").';

            setAtsFeedback(fb + '\n\n(AI System Error: ' + (err.message || String(err)) + ')');
        } finally {
            setChecking(false);
        }
    }

    // If template is selected, show the editor
    if (selectedTemplate) {
        return (
            <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Resume Builder</h1>
                    <p className="text-muted-foreground mt-1">
                        Template: <Badge variant="secondary">{RESUME_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</Badge>
                    </p>
                </div>
                <ResumeEditor
                    data={resumeData}
                    setData={setResumeData}
                    onBack={() => setSelectedTemplate(null)}
                    onGenerateSummary={handleGenerateSummary}
                    generating={generating}
                    templateId={selectedTemplate}
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-heading font-bold">Resume Builder & ATS Checker</h1>
                <p className="text-muted-foreground mt-1">Build ATS-friendly resumes and check your score</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
                    <TabsTrigger value="ats"><Sparkles className="w-4 h-4 mr-2" />ATS Checker</TabsTrigger>
                    <TabsTrigger value="converters"><RefreshCw className="w-4 h-4 mr-2" />Converters</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {RESUME_TEMPLATES.map((t) => (
                            <Card key={t.id} className="card-hover cursor-pointer overflow-hidden group" onClick={() => handleSelectTemplate(t.id)}>
                                <div className={`h-32 bg-gradient-to-br ${t.color} flex items-center justify-center relative overflow-hidden`}>
                                    <FileText className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-heading font-semibold">{t.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                                    <Button size="sm" className="w-full mt-3">Use Template</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="ats" className="mt-4 space-y-4">
                    <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white"><Target className="w-5 h-5 text-primary" />ATS Resume Checker</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Upload or paste your resume to get an ATS compatibility score powered by AI</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Uploaded Resume Preview Card & Metadata Section */}
                            {atsFileMetadata && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Uploaded Resume Preview Card */}
                                    <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
                                        <CardContent className="p-4 flex items-start gap-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary flex items-center justify-center shrink-0">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate text-slate-800 dark:text-white">{atsFileMetadata.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-muted-foreground font-mono">Size: {(atsFileMetadata.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Uploaded Successfully</span>
                                                </div>
                                                <p className="text-[10px] text-slate-450 dark:text-muted-foreground mt-1">Uploaded at {atsFileMetadata.uploadTime}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-destructive dark:text-muted-foreground dark:hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    setResumeText('');
                                                    setAtsFileMetadata(null);
                                                    setAtsPdfPayload(null);
                                                    setAtsScore(null);
                                                    setAtsFeedback('');
                                                    setKeywords([]);
                                                    setAtsBreakdown(null);
                                                    setAtsInsights(null);
                                                    showToast("Resume removed", "info");
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Resume Metadata Section */}
                                    <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
                                        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Resume Metadata</h4>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                                    <span className="text-slate-500 dark:text-muted-foreground">Resume Name:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-100 truncate">{atsFileMetadata.name}</span>
                                                    <span className="text-slate-500 dark:text-muted-foreground">File Type:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-100">{atsFileMetadata.type}</span>
                                                    <span className="text-slate-500 dark:text-muted-foreground">Pages:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-100">{atsFileMetadata.pages}</span>
                                                    <span className="text-slate-500 dark:text-muted-foreground">Words Extracted:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-100">{atsFileMetadata.wordCount}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {!atsFileMetadata && (
                                <div className="flex gap-3">
                                    <label className="flex-1">
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-8 text-center hover:border-primary/50 dark:hover:border-primary/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-950/20">
                                            <Upload className="w-8 h-8 mx-auto text-slate-400 dark:text-muted-foreground mb-2" />
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Upload Resume (PDF, DOCX, TXT)</p>
                                            <p className="text-xs text-slate-500 dark:text-muted-foreground">Click to browse</p>
                                        </div>
                                        <input type="file" accept=".txt,.md,.pdf,.docx" className="hidden" onChange={handleResumeUploadForATS} />
                                    </label>
                                </div>
                            )}

                            <div className="text-center text-xs text-slate-400 dark:text-muted-foreground font-medium">— or edit resume text below —</div>
                            <Textarea
                                placeholder={atsPdfPayload ? `PDF Uploaded: ${atsPdfPayload.name}\nReady for analysis.` : "Paste your resume content here..."}
                                rows={8}
                                value={resumeText}
                                onChange={e => setResumeText(e.target.value)}
                                className="bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-primary shadow-sm"
                            />

                            <Button
                                onClick={checkATS}
                                disabled={checking || (!resumeText.trim() && !atsPdfPayload)}
                                className="w-full bg-primary hover:bg-primary/95 text-white font-medium"
                            >
                                <Zap className="w-4 h-4 mr-2" />{checking ? 'Analyzing...' : 'Check ATS Score'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ATS Analysis Loading Header */}
                    {checking && (
                        <Card className="p-6 text-center animate-pulse border border-primary/20 bg-primary/5">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <Zap className="w-8 h-8 text-primary animate-bounce" />
                                <h3 className="text-base font-bold text-white">Analyzing Resume:</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> {atsFileMetadata?.name || 'Uploaded Resume'}
                                </p>
                                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                                    <div className="w-1/2 h-full bg-primary animate-infinite-scroll rounded-full" />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* ATS Results Dashboard */}
                    {atsScore !== null && !checking && (
                        <Card className="animate-scale-in border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/35 overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg text-slate-900 dark:text-white">ATS Score Analysis Dashboard</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">Comprehensive metrics, insights, and recommendations</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200"
                                    onClick={() => {
                                        setResumeText('');
                                        setAtsFileMetadata(null);
                                        setAtsPdfPayload(null);
                                        setAtsScore(null);
                                        setAtsFeedback('');
                                        setKeywords([]);
                                        setAtsBreakdown(null);
                                        setAtsInsights(null);
                                        showToast("Ready to upload another resume", "info");
                                    }}
                                >
                                    Upload Another Resume
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Circular ATS Score */}
                                    <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center p-6 text-center shadow-sm">
                                        <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="2.5" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                                    stroke={atsScore >= 90 ? '#10b981' : atsScore >= 80 ? '#14b8a6' : atsScore >= 70 ? '#f59e0b' : atsScore >= 60 ? '#f97316' : '#ef4444'}
                                                    strokeWidth="3"
                                                    strokeDasharray={`${atsScore}, 100`}
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-heading font-black text-slate-900 dark:text-white">{atsScore}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">/100</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">ATS Rating</h4>
                                            <div className="mt-1">
                                                <Badge
                                                    className={`font-semibold px-2.5 py-0.5 border ${atsScore >= 90 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                                            atsScore >= 80 ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                                                                atsScore >= 70 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                                    atsScore >= 60 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                                                                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                        }`}
                                                >
                                                    {atsScore >= 95 ? 'Excellent' :
                                                        atsScore >= 80 ? 'Very Good' :
                                                            atsScore >= 70 ? 'Good' :
                                                                atsScore >= 60 ? 'Needs Improvement' : 'Poor'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* ATS Breakdown Cards */}
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {atsBreakdown && (
                                            <>
                                                {[
                                                    { title: 'Keyword Match', score: atsBreakdown.keywordMatch },
                                                    { title: 'Action Verbs', score: atsBreakdown.actionVerbs },
                                                    { title: 'Resume Length', score: atsBreakdown.resumeLength },
                                                    { title: 'Formatting', score: atsBreakdown.formatting },
                                                    { title: 'Projects', score: atsBreakdown.projects },
                                                    { title: 'Experience', score: atsBreakdown.experience }
                                                ].map((item, idx) => (
                                                    <Card key={idx} className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 shadow-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.title}</span>
                                                            <span className="text-xs font-bold text-primary">{item.score}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-primary h-full rounded-full transition-all duration-1000"
                                                                style={{ width: `${item.score}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">
                                                            {Array.from({ length: 12 }).map((_, i) => i < Math.round(item.score / 8.3) ? '█' : '░').join('')}
                                                        </div>
                                                    </Card>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ATS Insights Section */}
                                {atsInsights && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                                        {/* Strengths */}
                                        <Card className="bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20 p-4 space-y-3 shadow-sm">
                                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="w-4.5 h-4.5" />
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Strengths</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {atsInsights.strengths.map((str, i) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                                        <span>{str}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Card>

                                        {/* Weaknesses */}
                                        <Card className="bg-rose-50/30 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20 p-4 space-y-3 shadow-sm">
                                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                                                <AlertCircle className="w-4.5 h-4.5" />
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-400">Weaknesses</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {atsInsights.weaknesses.map((weak, i) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-rose-400 font-bold shrink-0">✗</span>
                                                        <span>{weak}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Card>

                                        {/* Recommendations */}
                                        <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20 p-4 space-y-3 shadow-sm">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                <Lightbulb className="w-4.5 h-4.5 animate-pulse" />
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-400">Recommendations</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {atsInsights.recommendations.map((rec, i) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-blue-400 font-bold shrink-0">➔</span>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Card>
                                    </div>
                                )}

                                {/* Missing Keywords Section */}
                                {keywords.length > 0 && (
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-2.5">
                                        <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                            <AlertTriangle className="w-4 h-4" /> Strategic Keywords to Add
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Strategically integrate these terms into your skills or experience sections to improve resume filtering matching:</p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {keywords.map((kw, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 px-3 py-1 text-xs font-semibold rounded-full"
                                                >
                                                    + {kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ATS Feedback Section */}
                                {atsFeedback && (
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-3">
                                        <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                {atsScore === null ? 'Diagnostic Notes' : 'AI Expert Feedback'}
                                            </h4>
                                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans">
                                                {atsFeedback}
                                            </p>
                                        </Card>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="converters" className="mt-4 space-y-4">
                    <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white"><RefreshCw className="w-5 h-5 text-primary" />File Format Converters</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Convert your files to ensure compatibility with different platforms.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={convertMode} onValueChange={(v) => {
                                setConvertMode(v as any);
                                setConvertFile(null);
                                setDownloadUrl('');
                                setConvertedFileName('');
                                setConversionStatus('idle');
                                setConverterError(null);
                            }}>
                                <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-950/60 p-1 border border-slate-200 dark:border-slate-800">
                                    <TabsTrigger value="pdf-to-docx" className="data-[state=active]:bg-primary data-[state=active]:text-white">PDF to Word</TabsTrigger>
                                    <TabsTrigger value="docx-to-pdf" className="data-[state=active]:bg-primary data-[state=active]:text-white">Word to PDF</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Converter Error Card */}
                            {converterError && (
                                <Card className="bg-rose-50/50 dark:bg-rose-950/15 border-rose-200 dark:border-rose-500/20 p-4 shadow-sm">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                        <div className="space-y-1">
                                            <h5 className="font-semibold text-sm text-rose-800 dark:text-rose-300">Conversion Failed</h5>
                                            <p className="text-xs text-rose-700 dark:text-rose-200/80">{converterError}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Conversion Success Card */}
                            {conversionStatus === 'ready' && downloadUrl && (
                                <Card className="bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-scale-in shadow-sm">
                                    <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-bold text-emerald-800 dark:text-white">✓ Conversion Complete</h4>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Your file is ready to download</p>
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800/80 w-full max-w-sm text-left text-xs space-y-2 shadow-inner">
                                        <div className="flex justify-between text-slate-500 dark:text-muted-foreground">
                                            <span>Original File:</span>
                                            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{convertFile?.name}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 dark:text-muted-foreground">
                                            <span>Converted File:</span>
                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[200px]">{convertedFileName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full justify-center">
                                        <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                                            <a href={downloadUrl} download={convertedFileName}>
                                                <Download className="w-4 h-4 mr-2" /> Download Converted File
                                            </a>
                                        </Button>
                                        <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => {
                                            setConvertFile(null);
                                            setDownloadUrl('');
                                            setConvertedFileName('');
                                            setConversionStatus('idle');
                                            setConverterError(null);
                                        }}>
                                            Convert Another
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {/* Conversion Process Progress Card */}
                            {conversionStatus !== 'idle' && conversionStatus !== 'ready' && (
                                <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-pulse shadow-sm">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                                        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                            {conversionStatus === 'uploading' && 'Uploading File...'}
                                            {conversionStatus === 'converting' && 'Converting File...'}
                                            {conversionStatus === 'preparing' && 'Preparing Download...'}
                                        </h4>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full bg-primary transition-all duration-500 ${conversionStatus === 'uploading' ? 'w-1/3' :
                                                    conversionStatus === 'converting' ? 'w-2/3' : 'w-[90%]'
                                                }`}
                                        />
                                    </div>
                                    {/* Detailed steps list */}
                                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 dark:text-muted-foreground">
                                        <div className={conversionStatus === 'uploading' ? 'text-primary font-bold' : ''}>1. Uploading</div>
                                        <div className={conversionStatus === 'converting' ? 'text-primary font-bold' : ''}>2. Converting</div>
                                        <div className={conversionStatus === 'preparing' ? 'text-primary font-bold' : ''}>3. Finalizing</div>
                                    </div>
                                </Card>
                            )}

                            {/* Idle states: Upload Zone or selected file preview */}
                            {conversionStatus === 'idle' && (
                                <>
                                    {!convertFile ? (
                                        /* Empty State drag & drop */
                                        <div
                                            className={`p-10 border-2 border-dashed rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('file-convert-upload')?.click()}
                                        >
                                            <input id="file-convert-upload" type="file" className="hidden" accept={convertMode === 'pdf-to-docx' ? '.pdf' : '.docx'} onChange={e => {
                                                const file = e.target.files?.[0] || null;
                                                if (file) {
                                                    setConvertFile(file);
                                                    setConverterError(null);
                                                }
                                            }} />
                                            {convertMode === 'pdf-to-docx' ? (
                                                <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            ) : (
                                                <FileDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            )}
                                            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Drag & Drop your file here</p>
                                            <p className="text-sm text-muted-foreground mt-1">OR</p>
                                            <Button size="sm" variant="secondary" className="mt-3">Click to Upload</Button>
                                            <div className="flex justify-center gap-2 mt-4">
                                                <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                                                    {convertMode === 'pdf-to-docx' ? 'Supported: PDF ➔ DOCX' : 'Supported: DOCX ➔ PDF'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Modern File Preview Card */
                                        <Card className="bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-primary/10 rounded-lg text-primary flex items-center justify-center shrink-0">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate text-slate-800 dark:text-white">{convertFile.name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-muted-foreground">Size: {(convertFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    <p className="text-xs text-slate-500 dark:text-muted-foreground">Type: {convertFile.name.endsWith('.pdf') ? 'PDF Document' : 'Word Document'}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                                                    onClick={() => {
                                                        setConvertFile(null);
                                                        setConverterError(null);
                                                    }}
                                                >
                                                    Change File
                                                </Button>
                                            </div>

                                            <Button className="w-full bg-primary hover:bg-primary/95 text-white font-medium" size="lg" onClick={async () => {
                                                setConversionStatus('uploading');
                                                setConverterError(null);

                                                let auditKeyLoaded = 'FAIL';
                                                let auditAuth = 'FAIL';
                                                let auditJobCreation = 'FAIL';
                                                let auditUpload = 'FAIL';
                                                let auditConversion = 'FAIL';
                                                let auditDownloadUrl = 'FAIL';
                                                let auditError = '';

                                                const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY;

                                                // TASK 1: VERIFY ENVIRONMENT VARIABLE
                                                console.log("CloudConvert Key Exists:", !!apiKey);
                                                console.log("CloudConvert Key Length:", apiKey?.length);

                                                if (!apiKey || apiKey === 'your_secret_here') {
                                                    auditError = "CloudConvert API key not found in environment variables.";
                                                    setConverterError(auditError);
                                                    setConversionStatus('idle');
                                                    showToast(auditError, 'error');

                                                    console.log(`
========================
CLOUDCONVERT AUDIT
========================
API Key Loaded: FAIL
Authentication: FAIL
Job Creation: FAIL
File Upload: FAIL
Conversion: FAIL
Download URL: FAIL

Error Details:
${auditError}
========================
`);
                                                    return;
                                                }
                                                auditKeyLoaded = 'PASS';

                                                try {
                                                    // TASK 2: VERIFY AUTHENTICATION
                                                    try {
                                                        const authRes = await fetch("https://api.cloudconvert.com/v2/users/me", {
                                                            headers: {
                                                                "Authorization": `Bearer ${apiKey}`
                                                            }
                                                        });

                                                        console.log("Auth Status:", authRes.status);

                                                        let authData: any = null;
                                                        const authText = await authRes.text();
                                                        try {
                                                            authData = JSON.parse(authText);
                                                        } catch (e) { }

                                                        console.log("Auth Response:", authData || authText);

                                                        if (!authRes.ok) {
                                                            const exactMsg = authData?.message || authData?.error || authText || "Unauthenticated";
                                                            auditError = `CloudConvert Authentication Failed: ${exactMsg}`;
                                                            throw new Error(auditError);
                                                        }
                                                        auditAuth = 'PASS';
                                                    } catch (authErr: any) {
                                                        if (!authErr.message.startsWith("CloudConvert Authentication Failed")) {
                                                            auditError = `CloudConvert Authentication Failed: ${authErr.message}`;
                                                            throw new Error(auditError);
                                                        }
                                                        throw authErr;
                                                    }

                                                    // TASK 3: VERIFY JOB CREATION
                                                    const from = convertMode === 'pdf-to-docx' ? 'pdf' : 'docx';
                                                    const to = convertMode === 'pdf-to-docx' ? 'docx' : 'pdf';

                                                    const jobPayload = {
                                                        tasks: {
                                                            'upload-file': { operation: 'import/upload' },
                                                            'convert-file': {
                                                                operation: 'convert',
                                                                input: 'upload-file',
                                                                input_format: from,
                                                                output_format: to
                                                            },
                                                            'export-url': {
                                                                operation: 'export/url',
                                                                input: 'convert-file'
                                                            }
                                                        }
                                                    };

                                                    console.log("Creating CloudConvert Job...");
                                                    console.log("Payload:", jobPayload);

                                                    const jobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${apiKey}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify(jobPayload)
                                                    });

                                                    let jobData: any = null;
                                                    const jobText = await jobRes.text();
                                                    try {
                                                        jobData = JSON.parse(jobText);
                                                    } catch (e) { }

                                                    console.log("Job Response:", jobData || jobText);

                                                    if (!jobRes.ok) {
                                                        const exactMsg = jobData?.message || jobData?.error || jobText || "Job Creation Failed";
                                                        auditError = `Job Creation Failed: ${exactMsg}`;
                                                        throw new Error(auditError);
                                                    }

                                                    auditJobCreation = 'PASS';

                                                    const uploadTask = jobData.data?.tasks?.find((t: any) => t.name === 'upload-file');
                                                    if (!uploadTask || !uploadTask.result?.form) {
                                                        auditError = "Upload task form data was not returned by CloudConvert.";
                                                        throw new Error(auditError);
                                                    }

                                                    const uploadUrl = uploadTask.result.form.url;
                                                    const uploadParams = uploadTask.result.form.parameters;

                                                    // TASK 4: VERIFY FILE UPLOAD
                                                    console.log("Upload URL:", uploadUrl);
                                                    console.log("Upload Parameters:", uploadParams);

                                                    const uploadFormData = new FormData();
                                                    for (const key in uploadParams) {
                                                        uploadFormData.append(key, uploadParams[key]);
                                                    }
                                                    uploadFormData.append('file', convertFile);

                                                    const uploadRes = await fetch(uploadUrl, {
                                                        method: 'POST',
                                                        body: uploadFormData
                                                    });

                                                    if (!uploadRes.ok) {
                                                        let errorDetail = '';
                                                        try {
                                                            errorDetail = await uploadRes.text();
                                                        } catch { }
                                                        auditError = `File Upload Failed: Status ${uploadRes.status} - ${errorDetail || "No response body"}`;
                                                        throw new Error(auditError);
                                                    }

                                                    console.log("Upload Complete");
                                                    auditUpload = 'PASS';
                                                    setConversionStatus('converting');

                                                    // TASK 5: VERIFY CONVERSION
                                                    const convertTask = jobData.data?.tasks?.find((t: any) => t.name === 'convert-file');
                                                    const taskId = convertTask?.id;

                                                    console.log("Starting Conversion...");
                                                    console.log("Task ID:", taskId);

                                                    const jobId = jobData.data.id;
                                                    console.log(`Polling CloudConvert Job: ${jobId}`);

                                                    const maxRetries = 60;
                                                    let finalUrl = '';
                                                    for (let i = 0; i < maxRetries; i++) {
                                                        await new Promise(resolve => setTimeout(resolve, 1500));

                                                        const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
                                                            headers: {
                                                                'Authorization': `Bearer ${apiKey}`
                                                            }
                                                        });

                                                        let pollData: any = null;
                                                        const pollText = await pollRes.text();
                                                        try {
                                                            pollData = JSON.parse(pollText);
                                                        } catch (e) { }

                                                        if (!pollRes.ok) {
                                                            const exactMsg = pollData?.message || pollText || `HTTP status ${pollRes.status}`;
                                                            auditError = `Polling Failed: ${exactMsg}`;
                                                            throw new Error(auditError);
                                                        }

                                                        const tasks = pollData.data?.tasks || [];

                                                        const currentConvertTask = tasks.find((t: any) => t.name === 'convert-file');
                                                        const status = currentConvertTask?.status || 'unknown';
                                                        console.log("Conversion Status:", status);

                                                        const failedTask = tasks.find((t: any) => t.status === 'failed');
                                                        if (failedTask) {
                                                            const taskErr = failedTask.message || `Task ${failedTask.name} failed`;
                                                            auditError = `Conversion Failed: ${taskErr}`;
                                                            throw new Error(taskErr);
                                                        }

                                                        const exportTask = tasks.find((t: any) => t.name === 'export-url');
                                                        if (exportTask && exportTask.status === 'finished') {
                                                            const file = exportTask.result?.files?.[0];
                                                            if (file && file.url) {
                                                                finalUrl = file.url;
                                                                break;
                                                            }
                                                            auditError = "Download URL not found in export task.";
                                                            throw new Error(auditError);
                                                        }
                                                    }

                                                    if (!finalUrl) {
                                                        auditError = "Conversion Failed: timed out after 90 seconds.";
                                                        throw new Error(auditError);
                                                    }

                                                    console.log("Conversion Complete");
                                                    auditConversion = 'PASS';
                                                    setConversionStatus('preparing');

                                                    // TASK 6: VERIFY DOWNLOAD URL
                                                    console.log("Download URL:", finalUrl);
                                                    console.log(`Downloading converted file from: ${finalUrl}`);

                                                    const fileDlRes = await fetch(finalUrl);
                                                    if (!fileDlRes.ok) {
                                                        auditError = `Download URL Failure: Failed to download converted file. Status: ${fileDlRes.status}`;
                                                        throw new Error(auditError);
                                                    }

                                                    const blob = await fileDlRes.blob();
                                                    const localDownloadUrl = URL.createObjectURL(blob);
                                                    const outputName = convertFile.name.replace(`.${from}`, `.${to}`);

                                                    setDownloadUrl(localDownloadUrl);
                                                    setConvertedFileName(outputName);
                                                    setConversionStatus('ready');
                                                    auditDownloadUrl = 'PASS';
                                                    console.log("Download URL Generated");
                                                    showToast("Conversion successful", "success");

                                                } catch (err: any) {
                                                    console.error("CloudConvert Error Details:", err);
                                                    console.log("CloudConvert Error");

                                                    if (!auditError) {
                                                        auditError = err.message || "Conversion failed.";
                                                    }

                                                    let finalErrorMsg = auditError;
                                                    if (!finalErrorMsg.startsWith("CloudConvert Error:")) {
                                                        finalErrorMsg = `CloudConvert Error: ${finalErrorMsg}`;
                                                    }

                                                    setConverterError(finalErrorMsg);
                                                    setConversionStatus('idle');
                                                    showToast(finalErrorMsg, "error");
                                                } finally {
                                                    // TASK 8: CREATE CONSOLE AUDIT REPORT
                                                    console.log(`
========================
CLOUDCONVERT AUDIT
========================
API Key Loaded: ${auditKeyLoaded}
Authentication: ${auditAuth}
Job Creation: ${auditJobCreation}
File Upload: ${auditUpload}
Conversion: ${auditConversion}
Download URL: ${auditDownloadUrl}

Error Details:
${auditError || "None"}
========================
`);
                                                }
                                            }}>
                                                <RefreshCw className="w-4 h-4 mr-2" /> Convert Now
                                            </Button>
                                        </Card>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 pointer-events-auto"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
