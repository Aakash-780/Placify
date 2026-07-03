import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@insforge/react';
import LoadingScreen from '@/components/loaders/LoadingScreen';
import { useRole } from '@/context/RoleContext';

// Layouts
import PlatformOwnerLayout from '@/layouts/PlatformOwnerLayout';
import OrganizationAdminLayout from '@/layouts/OrganizationAdminLayout';
import SubAdminLayout from '@/layouts/SubAdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import RecruiterLayout from '@/layouts/RecruiterLayout';

// Route Guards
import ProtectedRoute from '@/routes/ProtectedRoute';
import { StudentRoute, RecruiterRoute, AdminRoute, OrgAdminRoute } from '@/routes/RoleRoute';

// Shared/Public Pages
import Landing from '@/pages/Landing';
import RoleSelection from '@/pages/RoleSelection';
import ErrorPage from '@/pages/ErrorPage';
import AuthPage from '@/pages/AuthPage';
import LoginRequired from '@/pages/LoginRequired';
import VerifyOTP from '@/components/auth/VerifyOTP';
import VerificationRejected from '@/pages/VerificationRejected';
import ChangePassword from '@/pages/ChangePassword';

// Static Pages
import PrivacyPolicy from '@/pages/static/PrivacyPolicy';
import TermsOfService from '@/pages/static/TermsOfService';
import CookiePolicy from '@/pages/static/CookiePolicy';
import Contact from '@/pages/static/Contact';
import FAQs from '@/pages/static/FAQs';

// Modular Pages: Organization Admin
import OrgAdminDashboard from '@/modules/organization-admin/pages/OrgAdminDashboard';
import SuperAdminsPage from '@/modules/organization-admin/pages/SuperAdminsPage';
import OrgSettingsPage from '@/modules/organization-admin/pages/OrgSettingsPage';
import OrgAuditLogsPage from '@/modules/organization-admin/pages/OrgAuditLogsPage';
import OrgSubadminsPage from '@/modules/organization-admin/pages/OrgSubadminsPage';
import OrgStudentsPage from '@/modules/organization-admin/pages/OrgStudentsPage';
import OrgRecruitersPage from '@/modules/organization-admin/pages/OrgRecruitersPage';

// Modular Pages: SubAdmin
import Students from '@/modules/subadmin/pages/Students';
import Recruiters from '@/modules/subadmin/pages/Recruiters';
import Analytics from '@/modules/subadmin/pages/Analytics';
import AdminDsaSheets from '@/modules/subadmin/pages/AdminDsaSheets';
import OffCampusManagement from '@/modules/subadmin/pages/OffCampusManagement';
import MentorVerification from '@/modules/subadmin/pages/MentorVerification';
import StudentExplorer from '@/modules/subadmin/pages/StudentExplorer';
import PostJob from '@/modules/subadmin/pages/PostJob';
import Applicants from '@/modules/subadmin/pages/Applicants';

// Modular Pages: Student
import Dashboard from '@/modules/student/pages/Dashboard';
import Profile from '@/modules/student/pages/Profile';
import Jobs from '@/modules/student/pages/Jobs';
import ApplyJob from '@/modules/student/pages/ApplyJob';
import MyApplications from '@/modules/student/pages/MyApplications';
import ApplicationDetails from '@/modules/student/pages/ApplicationDetails';
import ResumeBuilder from '@/modules/student/pages/ResumeBuilder';
import Alumni from '@/modules/student/pages/Alumni';
import Forum from '@/modules/student/pages/Forum';
import ForumThread from '@/modules/student/pages/ForumThread';
import DsaSheets from '@/modules/student/pages/DsaSheets';
import OffCampus from '@/modules/student/pages/OffCampus';
import CodeSimulator from '@/modules/student/pages/CodeSimulator';
import Notifications from '@/modules/student/pages/Notifications';

// Modular Pages: Recruiter
import RecruiterJobs from '@/modules/recruiter/pages/RecruiterJobs';

function RoleLayoutSwitcher() {
    const { role } = useRole();
    if (role === 'student') return <StudentLayout />;
    if (role === 'recruiter') return <RecruiterLayout />;
    if (role === 'admin') return <SubAdminLayout />;
    if (role === 'organization_admin') return <OrganizationAdminLayout />;
    return <StudentLayout />; // Fallback
}

function DashboardRoute() {
    const { role } = useRole();
    if (role === 'PLATFORM_OWNER') {
        return <Navigate to="/platform-owner/dashboard" replace />;
    }
    if (role === 'organization_admin') {
        return <Navigate to="/organization-admin/dashboard" replace />;
    }
    if (role === 'admin') {
        return <Navigate to="/subadmin/dashboard" replace />;
    }
    if (role === 'recruiter') {
        return <Navigate to="/recruiter/dashboard" replace />;
    }
    if (role === 'student') {
        return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/select-role" replace />;
}

export default function AppRoutes() {
    const { isLoaded } = useAuth();

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={
                <>
                    <SignedOut><Landing /></SignedOut>
                    <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
                </>
            } />

            {/* Auth Page */}
            <Route path="/auth" element={
                <>
                    <SignedOut><AuthPage /></SignedOut>
                    <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
                </>
            } />

            {/* Role Selection Page */}
            <Route path="/select-role" element={
                <>
                    <SignedIn><RoleSelection /></SignedIn>
                    <SignedOut><Navigate to="/auth" replace /></SignedOut>
                </>
            } />
            <Route path="/role-selection" element={<Navigate to="/select-role" replace />} />

            {/* Public Static Pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faqs" element={<FAQs />} />

            {/* Protected routes inside Role-specific layouts */}
            <Route element={
                <>
                    <SignedIn>
                        <ProtectedRoute>
                            <RoleLayoutSwitcher />
                        </ProtectedRoute>
                    </SignedIn>
                    <SignedOut>
                        <LoginRequired />
                    </SignedOut>
                </>
            }>
                {/* ── Shared (all roles) ──────────────────────────────────────── */}
                <Route path="/dashboard" element={<DashboardRoute />} />
                <Route path="/student/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
                <Route path="/recruiter/dashboard" element={<RecruiterRoute><RecruiterJobs /></RecruiterRoute>} />
                <Route path="/subadmin/dashboard" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/change-password" element={<ChangePassword />} />

                {/* ── Student-only routes ─────────────────────────────────────── */}
                <Route path="/jobs" element={<StudentRoute><Jobs /></StudentRoute>} />
                <Route path="/jobs/:id" element={<StudentRoute><ApplyJob /></StudentRoute>} />
                <Route path="/my-applications" element={<StudentRoute><MyApplications /></StudentRoute>} />
                <Route path="/my-applications/:id" element={<StudentRoute><ApplicationDetails /></StudentRoute>} />
                <Route path="/resume-builder" element={<StudentRoute><ResumeBuilder /></StudentRoute>} />
                <Route path="/alumni" element={<StudentRoute><Alumni /></StudentRoute>} />
                <Route path="/forum" element={<StudentRoute><Forum /></StudentRoute>} />
                <Route path="/forum/:id" element={<StudentRoute><ForumThread /></StudentRoute>} />
                <Route path="/dsa-sheets" element={<StudentRoute><DsaSheets /></StudentRoute>} />
                <Route path="/off-campus" element={<StudentRoute><OffCampus /></StudentRoute>} />
                <Route path="/code-simulator" element={<StudentRoute><CodeSimulator /></StudentRoute>} />

                {/* ── Recruiter-only routes ────────────────────────────────────── */}
                <Route path="/recruiter/jobs" element={<RecruiterRoute><RecruiterJobs /></RecruiterRoute>} />

                {/* ── Recruiter + Admin shared routes ─────────────────────────── */}
                <Route path="/admin/post-job" element={<RecruiterRoute><PostJob /></RecruiterRoute>} />
                <Route path="/admin/edit-job/:id" element={<RecruiterRoute><PostJob /></RecruiterRoute>} />
                <Route path="/admin/applicants" element={<RecruiterRoute><Applicants /></RecruiterRoute>} />

                {/* ── Admin-only routes ────────────────────────────────────────── */}
                <Route path="/admin/students" element={<AdminRoute><Students /></AdminRoute>} />
                <Route path="/admin/recruiters" element={<AdminRoute><Recruiters /></AdminRoute>} />
                <Route path="/admin/super-admins" element={<AdminRoute><SuperAdminsPage /></AdminRoute>} />
                <Route path="/admin/manage-dsa" element={<AdminRoute><AdminDsaSheets /></AdminRoute>} />
                <Route path="/admin/off-campus" element={<AdminRoute><OffCampusManagement /></AdminRoute>} />
                <Route path="/admin/mentor-verification" element={<AdminRoute><MentorVerification /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><OrgSettingsPage /></AdminRoute>} />
                <Route path="/admin/audit-logs" element={<AdminRoute><OrgAuditLogsPage /></AdminRoute>} />
                <Route path="/student-explorer" element={<AdminRoute><StudentExplorer /></AdminRoute>} />
            </Route>

            {/* Organization Admin Routes */}
            <Route element={
                <SignedIn>
                    <ProtectedRoute>
                        <OrgAdminRoute>
                            <OrganizationAdminLayout />
                        </OrgAdminRoute>
                    </ProtectedRoute>
                </SignedIn>
            }>
                <Route path="/organization-admin/dashboard" element={<OrgAdminDashboard />} />
                <Route path="/organization-admin/subadmins" element={<OrgSubadminsPage />} />
                <Route path="/organization-admin/students" element={<OrgStudentsPage />} />
                <Route path="/organization-admin/recruiters" element={<OrgRecruitersPage />} />
                <Route path="/organization-admin/settings" element={<OrgSettingsPage />} />
            </Route>
            <Route path="/org-admin" element={<Navigate to="/organization-admin/dashboard" replace />} />

            {/* Platform Owner Dashboard Route */}
            <Route path="/platform-owner/dashboard" element={
                <SignedIn>
                    <ProtectedRoute>
                        <PlatformOwnerLayout />
                    </ProtectedRoute>
                </SignedIn>
            } />

            {/* Onboarding / Onboarding Status routes (no role sidebars) */}
            <Route element={
                <>
                    <SignedIn>
                        <ProtectedRoute>
                            <Outlet />
                        </ProtectedRoute>
                    </SignedIn>
                    <SignedOut>
                        <LoginRequired />
                    </SignedOut>
                </>
            }>
                <Route path="/awaiting-approval" element={<VerifyOTP />} />
                <Route path="/verification-rejected" element={<VerificationRejected />} />
            </Route>

            {/* Fallback: 404 */}
            <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Routes>
    );
}
