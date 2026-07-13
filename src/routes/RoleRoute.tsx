import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import LoadingScreen from '@/components/loaders/LoadingScreen';

interface RouteProps {
    children: React.ReactNode;
}

export function StudentRoute({ children }: RouteProps) {
    const { role, loading } = useRole();
    if (loading) return <LoadingScreen />;
    if (role === 'recruiter') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

export function RecruiterRoute({ children }: RouteProps) {
    const { role, loading } = useRole();
    if (loading) return <LoadingScreen />;
    if (role === 'student') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

export function AdminRoute({ children }: RouteProps) {
    const { role, loading } = useRole();
    if (loading) return <LoadingScreen />;
    if (role !== 'admin' && role !== 'organization_admin') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

export function OrgAdminRoute({ children }: RouteProps) {
    const { role, loading } = useRole();
    if (loading) return <LoadingScreen />;
    if (role !== 'organization_admin') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}
