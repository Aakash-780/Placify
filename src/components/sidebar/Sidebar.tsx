import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import PlacifyLogo from '@/components/ui/PlacifyLogo';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MapPin, Lock } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

interface NavItem {
    to: string;
    icon: React.ComponentType<any>;
    label: string;
    badgeCount?: number;
    isLocked?: boolean;
}

interface SidebarProps {
    navItems: NavItem[];
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
    navItems,
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
}: SidebarProps) {
    const location = useLocation();
    const { roleData } = useRole();

    // Auto-detect if user is currently solving a coding problem
    const searchParams = new URLSearchParams(location.search);
    const hasProblem = searchParams.has('problem');
    const isCodeSimulator = location.pathname === '/code-simulator';
    const isSolving = isCodeSimulator && hasProblem;

    const [prevCollapsed, setPrevCollapsed] = useState<boolean | null>(null);

    useEffect(() => {
        if (isSolving) {
            setPrevCollapsed(collapsed);
            setCollapsed(true);
        } else if (prevCollapsed !== null) {
            setCollapsed(prevCollapsed);
            setPrevCollapsed(null);
        }
    }, [isSolving]);

    // Org data from role context
    const orgData = roleData?.organizations;
    const orgName = orgData?.name;
    const orgLogo = orgData?.logo_url;
    const orgAddress = orgData?.address || '';
    const orgStatus = orgData?.status || 'Active';

    const addressParts = orgAddress.split(',').map((s: string) => s.trim());
    const city = addressParts[0] || '';
    const state = addressParts[1] || '';
    const locationStr = [city, state].filter(Boolean).join(', ');

    return (
        <aside className={cn(
            'fixed lg:relative z-50 h-full bg-card border-r flex flex-col transition-all duration-300 ease-in-out',
            collapsed ? (isSolving ? 'w-[60px]' : 'w-[70px]') : 'w-[260px]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}>
            {/* ── Sidebar Header: Org Branding ── */}
            <div className={cn(
                'flex flex-col border-b py-4 transition-all duration-300 relative overflow-hidden',
                collapsed ? 'px-2 items-center' : 'px-4'
            )}>
                {/* Subtle primary tint — works in both modes */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

                {orgName ? (
                    collapsed ? (
                        /* Collapsed: just org logo */
                        <div className="w-10 h-10 rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
                            {orgLogo ? (
                                <img src={orgLogo} alt={orgName} className="w-full h-full object-contain p-1 bg-white" />
                            ) : (
                                <span className="text-sm font-black text-muted-foreground">{orgName[0]}</span>
                            )}
                        </div>
                    ) : (
                        /* Expanded: full org branding */
                        <div className="relative w-full">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border bg-muted flex items-center justify-center flex-shrink-0">
                                    {orgLogo ? (
                                        <img src={orgLogo} alt={orgName} className="w-full h-full object-contain p-1 bg-white" />
                                    ) : (
                                        <span className="text-sm font-black text-muted-foreground">{orgName[0]}</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-foreground leading-tight truncate">{orgName}</p>
                                    {locationStr && (
                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            {locationStr}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    /* Fallback to PlacifyLogo if orgName is not loaded */
                    <div className="flex items-center h-8 justify-center">
                        <PlacifyLogo collapsed={collapsed} iconClassName="w-8 h-8 text-primary" textClassName="h-[18px]" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                                collapsed && 'justify-center px-2',
                                isActive
                                    ? 'border border-primary/80 bg-primary/[0.08] text-primary shadow-sm shadow-primary/5'
                                    : 'border-0 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', collapsed && 'w-5 h-5')} />
                            {!collapsed && <span className="flex-grow text-left">{item.label}</span>}
                            {item.isLocked && (
                                <Lock className={cn("w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0", collapsed ? "absolute top-1.5 right-1.5" : "ml-2")} />
                            )}
                            {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                collapsed ? (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                ) : (
                                    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse">
                                        {item.badgeCount}
                                    </span>
                                )
                            )}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>

            {/* Collapse Button (Desktop) */}
            <div className="hidden lg:flex border-t p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                        const nextState = !collapsed;
                        setCollapsed(nextState);
                        localStorage.setItem('sidebarCollapsed', String(nextState));
                    }}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2">Collapse</span>}
                </Button>
            </div>
        </aside>
    );
}
