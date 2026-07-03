import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, LogIn, ArrowLeft, Shield } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function LoginRequired() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
                    {/* Lock Icon */}
                    <div className="relative mx-auto w-fit">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center mx-auto">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-heading font-bold">Login Required</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            You need to sign in or create an account to access this page. Join Placify to unlock all features.
                        </p>
                    </div>

                    {/* Requested Path */}
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">You're trying to access</p>
                            <p className="font-mono text-sm text-foreground font-medium">{location.pathname}</p>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Link to="/auth">
                            <Button size="lg" className="w-full text-base">
                                <LogIn className="w-5 h-5 mr-2" />
                                Sign In to Continue
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </div>

                    {/* Perks */}
                    <div className="grid grid-cols-2 gap-3 text-left">
                        {[
                            { label: 'Job Portal', desc: 'Browse & apply to placements' },
                            { label: 'Resume Builder', desc: 'AI-powered resume tools' },
                            { label: 'DSA Sheets', desc: 'Company-wise practice' },
                            { label: 'Community', desc: 'Forums & alumni network' },
                        ].map((perk) => (
                            <div key={perk.label} className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                <p className="text-sm font-medium">{perk.label}</p>
                                <p className="text-xs text-muted-foreground">{perk.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
