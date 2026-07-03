import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Footer from '@/components/layout/Footer';

const faqCategories = [
    {
        category: 'Getting Started',
        color: 'bg-blue-500/10 text-blue-500',
        questions: [
            {
                q: 'How do I create an account on Placify?',
                a: 'Click the "Get Started" button on the homepage. You can sign up using your email, Google, or GitHub account. After signing up, you\'ll be asked to select your role (Student, Recruiter, or Admin) and fill in your profile details.',
            },
            {
                q: 'What roles are available on the platform?',
                a: 'Placify has three roles: Student (access to job portal, resume builder, DSA sheets, forums), Recruiter (post jobs and view applicants), and Admin (manage the platform, view analytics, and manage students).',
            },
            {
                q: 'Is Placify free to use?',
                a: 'Yes! Placify is completely free for students. It\'s a platform built to help students with campus placements and career growth.',
            },
        ],
    },
    {
        category: 'Job Portal',
        color: 'bg-emerald-500/10 text-emerald-500',
        questions: [
            {
                q: 'How do I apply for a job?',
                a: 'Navigate to the Job Portal, find a job you\'re interested in, and click on it. If you\'re eligible based on criteria like CGPA, branch, and backlogs, you\'ll see an "Apply Now" button. Your profile and resume are shared with the recruiter.',
            },
            {
                q: 'Why am I not eligible for certain jobs?',
                a: 'Eligibility is determined by the recruiter\'s criteria, which may include minimum CGPA, allowed branches, maximum backlogs, and current year. You can see the specific reasons on the job detail page.',
            },
            {
                q: 'What are off-campus jobs?',
                a: 'Off-campus jobs are positions not posted through your college\'s placement cell. Placify aggregates these opportunities so you can explore and apply to them via external application links.',
            },
        ],
    },
    {
        category: 'Resume & Career',
        color: 'bg-purple-500/10 text-purple-500',
        questions: [
            {
                q: 'How does the AI Resume Builder work?',
                a: 'Enter your skills and experience and our AI (powered by InsForge\'s AI integration) will generate professional resume content. You can also run ATS (Applicant Tracking System) scans to check your resume\'s compatibility with job requirements.',
            },
            {
                q: 'How do I update my CGPA and academic details?',
                a: 'Go to your Profile page and click "Edit Profile." You can update your CGPA, current year, graduation year, placement status, and other academic details.',
            },
        ],
    },
    {
        category: 'Community',
        color: 'bg-amber-500/10 text-amber-500',
        questions: [
            {
                q: 'How do I post in the community forum?',
                a: 'Navigate to the Community Forum section, choose a category, and click "New Thread." You can share questions, tips, experiences, and more with other students.',
            },
            {
                q: 'How does the alumni referral system work?',
                a: 'Visit the Alumni & Referrals page to browse alumni profiles. You can request referrals from alumni working at companies you\'re interested in. Alumni may or may not accept referral requests.',
            },
        ],
    },
    {
        category: 'DSA & Coding',
        color: 'bg-red-500/10 text-red-500',
        questions: [
            {
                q: 'What are DSA Sheets?',
                a: 'DSA (Data Structures & Algorithms) Sheets are curated collections of coding problems organized by company and topic. They help you prepare for technical interviews at specific companies like Google, Amazon, Microsoft, etc.',
            },
            {
                q: 'How does the Code Simulator work?',
                a: 'The Code Simulator provides an in-browser coding environment where you can write and analyze code. AI-powered feedback helps you understand time/space complexity and suggests improvements.',
            },
        ],
    },
];

export default function FAQs() {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (key: string) => {
        setOpenItems(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const filteredCategories = faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
            q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(cat => cat.questions.length > 0);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1">
                <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
                    <div>
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <HelpCircle className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-heading font-bold">Frequently Asked Questions</h1>
                                <p className="text-sm text-muted-foreground">{faqCategories.reduce((sum, c) => sum + c.questions.length, 0)} questions across {faqCategories.length} categories</p>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search FAQs..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* FAQ Categories */}
                    {filteredCategories.length === 0 ? (
                        <Card className="bg-muted/30">
                            <CardContent className="p-8 text-center">
                                <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery('')}>Clear search</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredCategories.map((cat) => (
                            <div key={cat.category} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge className={cat.color}>{cat.category}</Badge>
                                    <span className="text-xs text-muted-foreground">{cat.questions.length} questions</span>
                                </div>
                                <div className="space-y-2">
                                    {cat.questions.map((faq, i) => {
                                        const key = `${cat.category}-${i}`;
                                        const isOpen = openItems.has(key);
                                        return (
                                            <Card key={i} className="transition-all hover:shadow-sm">
                                                <CardContent className="p-0">
                                                    <button
                                                        className="w-full flex items-center justify-between p-4 text-left"
                                                        onClick={() => toggleItem(key)}
                                                    >
                                                        <span className="text-sm font-medium pr-4">{faq.q}</span>
                                                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-4 pb-4 animate-fade-in">
                                                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}

                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Still have questions?{' '}
                                <Link to="/contact" className="text-primary hover:underline">Contact us</Link> and we'll be happy to help.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
}
