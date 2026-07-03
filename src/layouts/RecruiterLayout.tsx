import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/layout/Footer';
import RecruiterOnboarding from '@/modules/recruiter/components/RecruiterOnboarding';
import { useRole } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, PlusCircle, Users } from 'lucide-react';

const recruiterNav = [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/recruiter/jobs', icon: Briefcase,        label: 'My Jobs' },
    { to: '/admin/post-job', icon: PlusCircle,       label: 'Post Job' },
    { to: '/admin/applicants', icon: Users,          label: 'My Applicants' },
];

const isProfileIncomplete = (roleData: any) => {
    if (!roleData) return true;
    const companyRaw = roleData.company;
    if (!companyRaw || !companyRaw.trim().startsWith('{')) {
        return true;
    }
    try {
        const parsed = JSON.parse(companyRaw);
        const required = [
            'companyName',
            'industry',
            'description',
            'website',
            'companyEmail',
            'recruiterName',
            'recruiterDesignation',
            'companySize',
            'headquarters',
            'linkedin'
        ];
        const logo = roleData.profile_photo_url || parsed.logoUrl;
        if (!logo) return true;

        for (const field of required) {
            if (!parsed[field] || parsed[field].trim() === '') {
                return true;
            }
        }
        return false;
    } catch (e) {
        return true;
    }
};

export default function RecruiterLayout() {
    const { roleData } = useRole();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    const showOnboarding = isProfileIncomplete(roleData);

    if (showOnboarding) {
        return <RecruiterOnboarding />;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <Sidebar
                navItems={recruiterNav}
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
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
