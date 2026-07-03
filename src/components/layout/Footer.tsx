import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import PlacifyLogo from '@/components/ui/PlacifyLogo';

const footerLinks = {
    Platform: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Job Portal', to: '/jobs' },
        { label: 'Alumni Network', to: '/alumni' },
        { label: 'Community Forum', to: '/forum' },
    ],
    Resources: [
        { label: 'DSA Sheets', to: '/dsa-sheets' },
        { label: 'Code Simulator', to: '/code-simulator' },
        { label: 'Resume Builder', to: '/resume-builder' },
        { label: 'Off-Campus Jobs', to: '/off-campus' },
    ],
    Legal: [
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Terms of Service', to: '/terms' },
        { label: 'Cookie Policy', to: '/cookies' },
    ],
    Support: [
        { label: 'Contact Us', to: '/contact' },
        { label: 'FAQs', to: '/faqs' },
        { label: 'Report a Bug', to: '/contact' },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t bg-card/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer */}
                <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <PlacifyLogo className="mb-4" iconClassName="w-8 h-8 text-primary" textClassName="h-5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your all-in-one platform for campus placements, career growth, and coding practice.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <a href="#" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="mailto:support@careerbridge.com" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Link Groups */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="font-heading font-semibold text-sm mb-4 text-foreground">{title}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Bottom Bar */}
                <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Placify. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
