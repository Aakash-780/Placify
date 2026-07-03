import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Globe } from 'lucide-react';
import Footer from '@/components/layout/Footer';

const sections = [
    {
        icon: Eye,
        title: 'Information We Collect',
        content: `We collect information you provide directly, including your name, email address, phone number, academic details (branch, CGPA, graduation year), and professional information (resume, skills, projects). We also collect usage data such as pages visited, features used, and interaction patterns to improve our services.`,
    },
    {
        icon: Database,
        title: 'How We Use Your Information',
        content: `Your information is used to: provide and maintain the Placify platform, match you with relevant job opportunities, enable resume building and ATS scanning features, facilitate community forum interactions, connect you with alumni for referrals, and send notifications about job openings and platform updates.`,
    },
    {
        icon: UserCheck,
        title: 'Information Sharing',
        content: `We share your profile and resume information with recruiters and companies only when you apply for jobs through our platform. Forum posts and community interactions are visible to other platform users. We do not sell your personal data to third parties for marketing purposes.`,
    },
    {
        icon: Lock,
        title: 'Data Security',
        content: `We implement industry-standard security measures including encryption in transit and at rest, secure authentication via InsForge, and regular security audits. Access to your data is restricted to authorized personnel and systems that need it to provide our services.`,
    },
    {
        icon: Shield,
        title: 'Your Rights',
        content: `You have the right to access, update, or delete your personal information at any time through your profile settings. You can also request a copy of your data or ask us to restrict processing. To exercise these rights, contact us at privacy@careerbridge.com.`,
    },
    {
        icon: Globe,
        title: 'Cookies & Tracking',
        content: `We use essential cookies for authentication and session management. Analytics cookies help us understand how you use the platform. You can manage cookie preferences through your browser settings. For more details, see our Cookie Policy.`,
    },
];

export default function PrivacyPolicy() {
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
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-heading font-bold">Privacy Policy</h1>
                                <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Placify is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our platform.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section, i) => (
                            <Card key={i} className="transition-all hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <section.icon className="w-5 h-5 text-primary" />
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
                                Questions about this policy? Contact us at{' '}
                                <a href="mailto:privacy@careerbridge.com" className="text-primary hover:underline">privacy@careerbridge.com</a>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
}
