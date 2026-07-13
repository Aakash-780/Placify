import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import PlacifyLogo from '@/components/ui/PlacifyLogo';
import LoadingScreen from '@/components/loaders/LoadingScreen';
import { Wrench, ShieldAlert, Cpu } from 'lucide-react';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
    const [checking, setChecking] = useState<boolean>(true);

    useEffect(() => {
        let active = true;

        async function checkMaintenance() {
            try {
                const { data, error } = await insforge.database
                    .from('platform_settings')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .maybeSingle();

                if (error) {
                    console.error('[MaintenanceGuard] Error checking maintenance mode:', error);
                    return;
                }

                if (active && data) {
                    // Extract value from JSONB column
                    const val = typeof data.value === 'string' ? data.value === 'true' : !!data.value;
                    setIsMaintenance(val);
                }
            } catch (err) {
                console.error('[MaintenanceGuard] Unexpected error:', err);
            } finally {
                if (active) {
                    setChecking(false);
                }
            }
        }

        // Initial check
        checkMaintenance();

        // Check every 5 seconds for updates
        const interval = setInterval(checkMaintenance, 5000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    if (checking) {
        return <LoadingScreen />;
    }

    if (isMaintenance) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 font-sans text-slate-200">
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-8px); }
                    }
                    @keyframes spin-slow {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse-ring {
                        0% { transform: scale(0.95); opacity: 0.5; }
                        50% { transform: scale(1.05); opacity: 1; }
                        100% { transform: scale(0.95); opacity: 0.5; }
                    }
                    .animate-float {
                        animation: float 4s ease-in-out infinite;
                    }
                    .animate-spin-slow {
                        animation: spin-slow 12s linear infinite;
                    }
                    .animate-pulse-ring {
                        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>

                {/* Glowing backgrounds */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Main Content */}
                <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
                    
                    {/* Header Logo */}
                    <div className="mb-10 animate-float flex justify-center">
                        <PlacifyLogo iconClassName="w-12 h-12 text-white" textClassName="h-8" />
                    </div>

                    {/* Glassmorphic Maintenance Card */}
                    <div className="w-full rounded-3xl border border-white/10 bg-slate-900/40 p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        
                        {/* Status Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse-ring">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                Maintenance Mode Active
                            </div>
                        </div>

                        {/* Centered Graphic / Icon Group */}
                        <div className="relative flex items-center justify-center h-28 w-28 mx-auto mb-6 bg-slate-800/30 rounded-full border border-white/5">
                            <Cpu className="absolute w-12 h-12 text-slate-600 animate-spin-slow" />
                            <Wrench className="absolute w-8 h-8 text-red-500 translate-x-2 -translate-y-2 animate-bounce" style={{ animationDuration: '2s' }} />
                            <ShieldAlert className="absolute w-6 h-6 text-slate-400 -translate-x-3 translate-y-3" />
                        </div>

                        {/* Messages */}
                        <h2 className="text-center text-xl md:text-2xl font-bold text-white tracking-tight mb-4 font-heading">
                            Temporary System Maintenance
                        </h2>
                        
                        <p className="text-center text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                            We are currently upgrading our servers and performing scheduled system tuning to enhance stability and performance.
                        </p>

                        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 mb-6">
                            <div className="flex gap-3 items-start text-left">
                                <span className="text-red-400 text-sm mt-0.5">⚠️</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    <strong>Inconvenience Message:</strong> All portal accesses (Student, Recruiter, and Admin) are locked. We sincerely apologize for any inconvenience caused and expect to be back online shortly.
                                </p>
                            </div>
                        </div>

                        {/* Animated Shimmer Bar */}
                        <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-red-500 to-red-400 animate-[shimmer_2s_infinite_linear]" style={{
                                backgroundImage: 'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #ef4444 100%)',
                                backgroundSize: '200% 100%',
                            }} />
                        </div>

                    </div>

                    {/* Support footer */}
                    <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">
                        Powered by Placify Engine
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
