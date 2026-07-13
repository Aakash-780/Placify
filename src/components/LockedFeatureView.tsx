import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LockedFeatureView() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
            <div className="relative mb-6">
                {/* Glow effects */}
                <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 bg-rose-500/[0.06] border border-rose-200/50 dark:border-rose-900/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold font-heading text-foreground mb-3">
                Access Restricted by Organization
            </h2>
            
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-8">
                This feature has been temporarily disabled for subadmins by your organization administrator. 
                Please wait for response or contact your organization administrator.
            </p>
            
            <button
                type="button"
                onClick={() => navigate('/subadmin/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm border border-transparent"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
        </div>
    );
}
