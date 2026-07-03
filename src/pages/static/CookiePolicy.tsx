import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cookie, Shield, BarChart3, Settings, Info } from 'lucide-react';
import Footer from '@/components/layout/Footer';

const cookieTypes = [
    {
        icon: Shield,
        name: 'Essential Cookies',
        badge: 'Required',
        badgeVariant: 'default' as const,
        description: 'These cookies are necessary for the platform to function properly. They enable core features like user authentication, session management, and security. These cannot be disabled.',
        examples: ['Session ID', 'Authentication token', 'CSRF protection', 'Security preferences'],
    },
    {
        icon: BarChart3,
        name: 'Analytics Cookies',
        badge: 'Optional',
        badgeVariant: 'secondary' as const,
        description: 'These cookies help us understand how you use Placify, which pages you visit most, and where you encounter errors. This data is anonymized and used solely to improve the platform.',
        examples: ['Page view tracking', 'Feature usage metrics', 'Error reporting', 'Performance monitoring'],
    },
    {
        icon: Settings,
        name: 'Preference Cookies',
        badge: 'Optional',
        badgeVariant: 'secondary' as const,
        description: 'These cookies remember your preferences and settings, such as theme choice (light/dark mode), sidebar state, and language preferences, to personalize your experience.',
        examples: ['Theme preference', 'Sidebar collapse state', 'Language setting', 'Notification preferences'],
    },
];

export default function CookiePolicy() {
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <Cookie className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-heading font-bold">Cookie Policy</h1>
                                <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            This policy explains how Placify uses cookies and similar technologies to provide, protect, and improve our platform.
                        </p>
                    </div>

                    {/* What are cookies */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-heading font-semibold mb-1">What are cookies?</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and activity, improving your experience on return visits.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cookie Types */}
                    <div className="space-y-4">
                        {cookieTypes.map((cookie, i) => (
                            <Card key={i} className="transition-all hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <cookie.icon className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-heading font-semibold">{cookie.name}</h3>
                                                <Badge variant={cookie.badgeVariant}>{cookie.badge}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{cookie.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cookie.examples.map((ex) => (
                                                    <Badge key={ex} variant="outline" className="text-xs">{ex}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Managing cookies */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-heading font-semibold mb-2">Managing Your Cookies</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                You can control and manage cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may prevent you from using certain features of Placify. Consult your browser's help section for instructions on managing cookie settings.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Questions about our cookie usage? Contact us at{' '}
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
