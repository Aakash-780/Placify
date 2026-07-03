import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ScrollText, CheckCircle, XCircle, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import Footer from '@/components/layout/Footer';

const sections = [
    {
        icon: CheckCircle,
        title: 'Acceptance of Terms',
        content: `By creating an account or using Placify, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. We may update these terms from time to time, and continued use after changes constitutes acceptance.`,
    },
    {
        icon: Scale,
        title: 'Use of the Platform',
        content: `Placify is provided for educational and career development purposes. You agree to: provide accurate information in your profile, use the platform responsibly and ethically, not share false or misleading information, not attempt to scrape or misuse the platform's data, and respect other users in community forums.`,
    },
    {
        icon: ScrollText,
        title: 'User Content',
        content: `You retain ownership of content you submit (resumes, projects, forum posts). By posting content, you grant Placify a non-exclusive license to display and distribute it within the platform. You are responsible for ensuring your content does not infringe on third-party rights.`,
    },
    {
        icon: XCircle,
        title: 'Prohibited Activities',
        content: `Users must not: create fake profiles or impersonate others, post spam or promotional content in forums, share confidential interview questions or proprietary company information, use automated tools to access the platform, or engage in harassment or discriminatory behavior towards other users.`,
    },
    {
        icon: AlertTriangle,
        title: 'Limitation of Liability',
        content: `Placify provides job listings and career tools on an "as is" basis. We do not guarantee employment outcomes or the accuracy of job listings posted by recruiters. We are not liable for any damages arising from the use of our platform or reliance on information provided.`,
    },
    {
        icon: RefreshCw,
        title: 'Account Termination',
        content: `We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your profile settings. Upon deletion, your personal data will be removed according to our Privacy Policy, though some anonymized data may be retained.`,
    },
];

export default function TermsOfService() {
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                <ScrollText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-heading font-bold">Terms of Service</h1>
                                <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms govern your use of the Placify platform. Please read them carefully before using our services.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section, i) => (
                            <Card key={i} className="transition-all hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <section.icon className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-heading font-semibold mb-2">{section.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Questions about these terms? Contact us at{' '}
                                <a href="mailto:legal@careerbridge.com" className="text-primary hover:underline">legal@careerbridge.com</a>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
}
