import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Bell, Briefcase, ListChecks, ExternalLink,
    User, FileText, Users, MessageSquare, Code2, Terminal
} from 'lucide-react';

const studentNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/jobs', icon: Briefcase, label: 'On-Campus Jobs' },
    { to: '/my-applications', icon: ListChecks, label: 'My Applications' },
    { to: '/off-campus', icon: ExternalLink, label: 'Off-Campus Jobs' },
    { to: '/profile', icon: User, label: 'My Profile' },
    { to: '/resume-builder', icon: FileText, label: 'Resume Builder' },
    { to: '/alumni', icon: Users, label: 'Career Network' },
    { to: '/forum', icon: MessageSquare, label: 'Community Forum' },
    { to: '/dsa-sheets', icon: Code2, label: 'DSA Sheets' },
    { to: '/code-simulator', icon: Terminal, label: 'Code Simulator' },
];

export default function StudentLayout() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    // Auto-detect if user is currently solving a coding problem
    const searchParams = new URLSearchParams(location.search);
    const hasProblem = searchParams.has('problem');
    const isCodeSimulator = location.pathname === '/code-simulator';
    const isSolving = isCodeSimulator && hasProblem;

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <Sidebar
                navItems={studentNav}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                {!isSolving && (
                    <Navbar onMenuClick={() => setMobileOpen(true)} />
                )}

                {/* Page Content */}
                <main className={cn("flex-1 overflow-y-auto", isSolving && "overflow-hidden flex flex-col h-full bg-background")}>
                    <div className={cn(
                        "p-4 lg:p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem-200px)]",
                        isSolving && "p-2 lg:p-3 max-w-none min-h-0 h-full w-full flex flex-col"
                    )}>
                        <Outlet />
                    </div>
                    {!isSolving && <Footer />}
                </main>
            </div>
        </div>
    );
}
