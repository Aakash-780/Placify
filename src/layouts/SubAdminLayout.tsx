import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/navbar/Navbar';
import SubAdminFooter from '@/components/layout/SubAdminFooter';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import LockedFeatureView from '@/components/LockedFeatureView';
import {
    LayoutDashboard, GraduationCap, Building2, Briefcase, Users,
    Sparkles, ExternalLink, BookMarked, MessageSquare, UserCheck, BarChart2
} from 'lucide-react';

const subAdminNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: GraduationCap, label: 'Students' },
    { to: '/admin/recruiters', icon: Building2, label: 'Recruiters' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/admin/applicants', icon: Users, label: 'Applications' },
    { to: '/student-explorer', icon: Sparkles, label: 'AI Explorer' },
    { to: '/admin/off-campus', icon: ExternalLink, label: 'Manage Off-Campus Job' },
    { to: '/admin/manage-dsa', icon: BookMarked, label: 'DSA Sheets' },
    { to: '/forum', icon: MessageSquare, label: 'Community Forum' },
    { to: '/admin/mentor-verification', icon: UserCheck, label: 'Mentor Verification' },
];

export default function SubAdminLayout() {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        async function fetchPendingCount() {
            try {
                const { count, error } = await insforge.database
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                if (!error && count !== null) {
                    setPendingCount(count);
                }
            } catch (err) {
                console.error('Failed to fetch pending student count:', err);
            }
        }
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 10000);
        return () => clearInterval(interval);
    }, []);

    const location = useLocation();
    const { roleData } = useRole();
    const disabledFeatures = roleData?.organizations?.disabled_features || [];

    const getFeatureKey = (path: string) => {
        if (path.startsWith('/admin/students')) return 'students';
        if (path.startsWith('/admin/recruiters')) return 'recruiters';
        if (path === '/jobs' || path.startsWith('/admin/post-job') || path.startsWith('/admin/edit-job')) return 'jobs';
        if (path.startsWith('/admin/applicants')) return 'applications';
        if (path.startsWith('/subadmin/dashboard') || path === '/dashboard') return 'analytics';
        if (path.startsWith('/forum')) return 'community';
        if (path.startsWith('/admin/manage-dsa')) return 'dsa';
        if (path.startsWith('/admin/mentor-verification')) return 'mentor';
        if (path.startsWith('/admin/off-campus')) return 'off_campus';
        if (path.startsWith('/student-explorer')) return 'ai_explorer';
        return '';
    };

    const navItems = subAdminNav.map(item => {
        const featureKey = getFeatureKey(item.to);
        const isLocked = featureKey ? disabledFeatures.includes(featureKey) : false;
        
        if (item.to === '/admin/students') {
            return { ...item, isLocked, badgeCount: pendingCount };
        }
        return { ...item, isLocked };
    });

    const activeFeatureKey = getFeatureKey(location.pathname);
    const isPageBlocked = activeFeatureKey ? disabledFeatures.includes(activeFeatureKey) : false;

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <Sidebar
                navItems={navItems}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <Navbar onMenuClick={() => setMobileOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem-200px)]">
                        {isPageBlocked ? <LockedFeatureView /> : <Outlet />}
                    </div>
                    <SubAdminFooter />
                </main>
            </div>
        </div>
    );
}
