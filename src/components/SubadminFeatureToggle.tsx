import React from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubadminFeatureToggleProps {
    featureKey: string;
    featureLabel?: string;
}

export default function SubadminFeatureToggle({ featureKey, featureLabel }: SubadminFeatureToggleProps) {
    const { role, roleData, refreshRole } = useRole();

    if (role !== 'organization_admin') return null;

    const disabledFeatures = roleData?.organizations?.disabled_features || [];
    const isFeatureDisabled = disabledFeatures.includes(featureKey);

    const toggleFeature = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!roleData?.organization_id) return;
        const nextFeatures = isFeatureDisabled
            ? disabledFeatures.filter((f: string) => f !== featureKey)
            : [...disabledFeatures, featureKey];

        try {
            const { error } = await insforge.database
                .from('organizations')
                .update({ disabled_features: nextFeatures })
                .eq('id', roleData.organization_id);

            if (error) throw error;
            if (refreshRole) {
                await refreshRole();
            }
        } catch (err) {
            console.error(`Failed to toggle subadmin feature ${featureKey}:`, err);
            alert("Failed to update feature settings.");
        }
    };

    return (
        <button
            type="button"
            onClick={toggleFeature}
            className={cn(
                "group flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border shadow-sm relative overflow-hidden flex-shrink-0",
                isFeatureDisabled
                    ? "bg-emerald-500/[0.06] text-emerald-600 border-emerald-200 hover:bg-emerald-500/[0.12] hover:border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30"
                    : "bg-rose-500/[0.06] text-rose-600 border-rose-200 hover:bg-rose-500/[0.12] hover:border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
            )}
        >
            {/* Ambient backdrop glow */}
            <span className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r pointer-events-none",
                isFeatureDisabled 
                    ? "from-emerald-500/[0.04] to-transparent" 
                    : "from-rose-500/[0.04] to-transparent"
            )} />
            
            {/* Pulsing indicator dot */}
            <span className="relative flex h-2 w-2">
                <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isFeatureDisabled ? "bg-emerald-400" : "bg-rose-400"
                )} />
                <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isFeatureDisabled ? "bg-emerald-500" : "bg-rose-500"
                )} />
            </span>
            
            <Shield className={cn(
                "w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12",
                isFeatureDisabled ? "text-emerald-500" : "text-rose-500"
            )} />
            
            <span className="relative z-10">
                {isFeatureDisabled ? `Enable for Subadmins` : `Disable for Subadmins`}
            </span>
        </button>
    );
}
