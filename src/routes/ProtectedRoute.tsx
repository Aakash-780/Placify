import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import LoadingScreen from '@/components/loaders/LoadingScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { role, roleData, loading, accountStatus, profileCompleted, verificationStatus } = useRole();
    const location = useLocation();
    const currentPath = location.pathname;

    if (loading) {
        return <LoadingScreen />;
    }

    // 1. If not authenticated (no role is loaded and loading is finished)
    if (!role) {
        if (currentPath !== '/select-role') {
            return <Navigate to="/select-role" replace />;
        }
        return <>{children}</>;
    }

    // Platform Owner, Organization Admin, and SubAdmin skip onboarding and verification
    if (role === 'PLATFORM_OWNER' || role === 'organization_admin' || role === 'admin') {
        if (currentPath === '/select-role' || currentPath === '/awaiting-approval' || currentPath === '/verification-rejected') {
            return <Navigate to="/dashboard" replace />;
        }
        return <>{children}</>;
    }

    // Suspended check
    if (accountStatus === 'Suspended') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#030712] text-white font-body select-none">
                <div className="max-w-md w-full border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl text-center space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-heading font-extrabold text-white">Access Denied</h1>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            This organization has been suspended by Placify.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            await insforge.auth.signOut();
                            window.location.href = '/';
                        }}
                        className="inline-flex items-center justify-center w-full h-11 px-4 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    const normStatus = verificationStatus?.toLowerCase() || 'pending';

    // 2. If profile is not completed, redirect to Complete Profile page
    if (!profileCompleted) {
        if (currentPath !== '/select-role') {
            return <Navigate to="/select-role" replace />;
        }
        return <>{children}</>;
    }

    // 3. Student flow using status column only
    if (role === 'student') {
        if (roleData?.force_password_change) {
            if (currentPath !== '/change-password') {
                return <Navigate to="/change-password" replace />;
            }
            return <>{children}</>;
        }

        if (currentPath === '/change-password') {
            return <>{children}</>;
        }

        if (normStatus === 'rejected') {
            if (currentPath !== '/verification-rejected') {
                return <Navigate to="/verification-rejected" replace />;
            }
            return <>{children}</>;
        }
        
        if (normStatus === 'pending') {
            if (currentPath !== '/awaiting-approval') {
                return <Navigate to="/awaiting-approval" replace />;
            }
            return <>{children}</>;
        }
        
        if (normStatus === 'verified') {
            if (currentPath === '/select-role' || currentPath === '/awaiting-approval' || currentPath === '/verification-rejected') {
                return <Navigate to="/student/dashboard" replace />;
            }
            return <>{children}</>;
        }
    }

    // 4. Recruiter legacy flow handling
    if (role === 'recruiter') {
        if (normStatus === 'rejected') {
            if (currentPath !== '/verification-rejected') {
                return <Navigate to="/verification-rejected" replace />;
            }
            return <>{children}</>;
        }
        if (normStatus === 'pending' || normStatus === 'approved' || accountStatus === 'Pending') {
            if (currentPath !== '/awaiting-approval') {
                return <Navigate to="/awaiting-approval" replace />;
            }
            return <>{children}</>;
        }
        if (normStatus === 'verified' || normStatus === 'active') {
            if (currentPath === '/select-role' || currentPath === '/awaiting-approval' || currentPath === '/verification-rejected') {
                return <Navigate to="/dashboard" replace />;
            }
            return <>{children}</>;
        }
    }

    return <>{children}</>;
}
