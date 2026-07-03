import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, LogOut, ShieldAlert } from 'lucide-react';
import { insforge } from '@/lib/insforge';
import Footer from '@/components/layout/Footer';

export default function VerificationRejected() {
    async function handleSignOut() {
        await insforge.auth.signOut();
        window.location.href = '/';
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-body">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
                    {/* Rejected Icon */}
                    <div className="relative mx-auto w-fit">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-destructive/10 to-red-500/10 border border-destructive/20 flex items-center justify-center mx-auto shadow-lg shadow-destructive/5">
                            <XCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4 text-destructive" />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-heading font-extrabold text-foreground">Verification Rejected</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Your account registration request has been rejected by the placement cell or organization administrator.
                        </p>
                    </div>

                    {/* Notification Card */}
                    <Card className="bg-destructive/[0.02] border-destructive/20 border-dashed">
                        <CardContent className="p-4 text-sm text-muted-foreground leading-relaxed">
                            Please contact your placement cell or university administration for further information regarding this decision.
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button 
                            variant="destructive"
                            size="lg" 
                            className="w-full text-base font-bold shadow-md shadow-destructive/10"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
