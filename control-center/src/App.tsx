import React, { useState, useEffect } from 'react';
import { createClient } from '@insforge/sdk';
import { 
  ShieldCheck, Loader2, LogOut, Settings, Activity, AlertCircle, 
  BarChart3, Bell, RefreshCw, X, Plus, Search, Calendar, Building2, 
  Key, Lock, Check, CheckCircle, Sun, Moon,
  Mail, FileText, Building, User, ExternalLink, Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Initialize InsForge Client
const insforge = createClient({
    baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
    anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
});

function decryptPassword(encrypted: string): string {
    const decoded = atob(encrypted);
    const key = "placify_key";
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

function getCompanyName(companyVal: any): string {
  if (!companyVal) return '';
  const trimmed = companyVal.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.companyName || parsed.name || trimmed;
    } catch (e) {
      return trimmed;
    }
  }
  return trimmed;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sub_admin:            { label: 'Sub Admin',          color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  placement_officer:    { label: 'Placement Officer',  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  tpo:                  { label: 'TPO',                color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  hr:                   { label: 'HR',                 color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
  coordinator:          { label: 'Coordinator',        color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20' },
  organization_admin:   { label: 'Org Admin',          color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
};
function formatRole(role: string | undefined) {
  const key = (role || '').toLowerCase().replace(/-/g, '_');
  const meta = ROLE_LABELS[key];
  if (meta) return meta;
  // Fallback: title-case the snake_case string
  const label = (role || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' };
}

type TabType = 'dashboard' | 'organizations' | 'pending_orgs' | 'analytics' | 'logs' | 'settings' | 'emails' | 'users';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Global App State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    pendingOnboardings: 0,
    platformHealth: 'Good',
    totalStudentsCount: 0,
    totalRecruitersCount: 0,
    totalJobsCount: 0,
    totalApplicationsCount: 0,
    requestsPending: 0,
    requestsUnderReview: 0,
    requestsApproved: 0,
    requestsRejected: 0,
    requestsNeedMoreInfo: 0
  });
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Organization Onboarding States
  const [orgRequests, setOrgRequests] = useState<any[]>([]);
  const [mockEmails, setMockEmails] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [remarksInput, setRemarksInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Loading & Toast State
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Modals & Action States
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showResetCredsModal, setShowResetCredsModal] = useState<any | null>(null);
  const [showViewOrgModal, setShowViewOrgModal] = useState<any | null>(null);
  const [isEditingOrgDetails, setIsEditingOrgDetails] = useState(false);

  // Org Creation Fields
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgAdminName, setOrgAdminName] = useState('');
  const [orgAdminEmail, setOrgAdminEmail] = useState('');
  const [orgAdminPassword, setOrgAdminPassword] = useState('');
  const [orgCreateError, setOrgCreateError] = useState('');
  const [orgCreating, setOrgCreating] = useState(false);

  // Org Edit Fields
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [orgEditingError, setOrgEditingError] = useState('');
  const [orgEditing, setOrgEditing] = useState(false);

  // Reset Credentials Fields
  const [newTempPassword, setNewTempPassword] = useState('');
  const [credsResetError, setCredsResetError] = useState('');
  const [credsResetting, setCredsResetting] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{ email: string; pass: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [analyticsOrgSearchTerm, setAnalyticsOrgSearchTerm] = useState('');
  const [selectedAnalyticsOrgId, setSelectedAnalyticsOrgId] = useState<string>('');
  const [activeMetricDetail, setActiveMetricDetail] = useState<'subadmins' | 'students' | 'recruiters' | 'companies' | null>(null);
  const [showAllStudentsModal, setShowAllStudentsModal] = useState(false);

  // Dashboard Org-wise Analytics states
  const [dashboardOrgSearchTerm, setDashboardOrgSearchTerm] = useState('');
  const [selectedDashboardOrgId, setSelectedDashboardOrgId] = useState<string>('');
  const [dashboardActiveMetricDetail, setDashboardActiveMetricDetail] = useState<'subadmins' | 'students' | 'recruiters' | 'companies' | null>(null);
  const [orgStatusFilter, setOrgStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'Pending'>('all');

  // Subscription setup modal states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionRequest, setSubscriptionRequest] = useState<any | null>(null);
  const [subType, setSubType] = useState<'Trial' | 'Monthly' | 'Lifetime' | 'Testing'>('Trial');
  const [subMonths, setSubMonths] = useState<number>(1);
  const [subConfirmVerified, setSubConfirmVerified] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [approvedOrgName, setApprovedOrgName] = useState('');

  // Student Management Modal States
  const [showStudentModal, setShowStudentModal] = useState<any | null>(null);
  const [studentNewPassword, setStudentNewPassword] = useState('');
  const [studentCredsError, setStudentCredsError] = useState('');
  const [studentCredsResetting, setStudentCredsResetting] = useState(false);
  const [studentCredsSuccess, setStudentCredsSuccess] = useState<{ email: string; pass: string } | null>(null);
  const [studentStatusUpdating, setStudentStatusUpdating] = useState(false);

  // Subadmin Management Modal States
  const [showSubadminModal, setShowSubadminModal] = useState<any | null>(null);
  const [subadminNewPassword, setSubadminNewPassword] = useState('');
  const [subadminCredsError, setSubadminCredsError] = useState('');
  const [subadminCredsResetting, setSubadminCredsResetting] = useState(false);
  const [subadminCredsSuccess, setSubadminCredsSuccess] = useState<{ email: string; pass: string } | null>(null);
  const [subadminStatusUpdating, setSubadminStatusUpdating] = useState(false);

  // Detail panel search
  const [detailSearchTerm, setDetailSearchTerm] = useState('');

  // User Management Tab States
  const [umSearch, setUmSearch] = useState('');
  const [umRoleFilter, setUmRoleFilter] = useState<'all' | 'admin' | 'subadmin' | 'student' | 'recruiter'>('all');
  const [umOrgFilter, setUmOrgFilter] = useState<string>('all');
  const [selectedUmUser, setSelectedUmUser] = useState<any | null>(null);
  const [umNewPassword, setUmNewPassword] = useState('');
  const [umCredsError, setUmCredsError] = useState('');
  const [umCredsResetting, setUmCredsResetting] = useState(false);
  const [umCredsSuccess, setUmCredsSuccess] = useState<{ email: string; pass: string } | null>(null);
  const [umStatusUpdating, setUmStatusUpdating] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState<any | null>(null);

  // Editing organization subscription states
  const [editingOrgSubId, setEditingOrgSubId] = useState<string | null>(null);
  const [editSubType, setEditSubType] = useState<'Trial' | 'Monthly' | 'Lifetime'>('Trial');
  const [editSubMonths, setEditSubMonths] = useState<number>(1);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  function generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  // Keep selected dashboard org in sync with filtered list
  useEffect(() => {
    const filtered = organizations.filter(o => 
      o.name.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      const isStillPresent = filtered.some(o => o.id === selectedDashboardOrgId);
      if (!isStillPresent) {
        setSelectedDashboardOrgId(filtered[0].id);
      }
    } else {
      setSelectedDashboardOrgId('');
    }
  }, [dashboardOrgSearchTerm, organizations, selectedDashboardOrgId]);

  // Keep selected analytics org in sync with filtered list
  useEffect(() => {
    const filtered = organizations.filter(o => 
      o.name.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      const isStillPresent = filtered.some(o => o.id === selectedAnalyticsOrgId);
      if (!isStillPresent) {
        setSelectedAnalyticsOrgId(filtered[0].id);
      }
    } else {
      setSelectedAnalyticsOrgId('');
    }
  }, [analyticsOrgSearchTerm, organizations, selectedAnalyticsOrgId]);

  // Check auth on startup
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          const { data: superAdmin } = await insforge.database
            .from('super_admins')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();
            
          if (superAdmin) {
            setSession(data);
            setCurrentUser(superAdmin);
            await loadData();
          } else {
            await insforge.auth.signOut();
            setLoginError('403 Unauthorized: Restricted to Platform Owners (PLATFORM_OWNER) only.');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      const { data, error } = await insforge.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });
      if (error) throw error;
      
      if (data?.user) {
        const { data: superAdmin } = await insforge.database
          .from('super_admins')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (superAdmin) {
          setSession(data);
          setCurrentUser(superAdmin);
          await loadData();
          showToast('Placify Control Center initialized.', 'success');
        } else {
          await insforge.auth.signOut();
          setLoginError('403 Unauthorized: Restricted to Platform Owners (PLATFORM_OWNER) only.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials or connection error.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await insforge.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    showToast('Signed out of Control Center securely.', 'info');
  }

  // Fetch all SaaS management statistics and records
  async function loadData() {
    setDataLoading(true);
    try {
      // 1. Fetch Organizations
      const { data: orgsData } = await insforge.database.from('organizations').select('*').order('created_at', { ascending: false });
      const organizationsList = orgsData || [];
      setOrganizations(organizationsList);

      // 2. Fetch Primary Admins
      const { data: admData } = await insforge.database.from('admins').select('*').eq('role', 'organization_admin');
      setAdmins(admData || []);

      // 2b. Fetch Subadmins
      const { data: subAdmData } = await insforge.database.from('admins').select('*').neq('role', 'organization_admin');
      setSubAdmins(subAdmData || []);

      // 3. Fetch Students Count / List
      const { data: stdData } = await insforge.database.from('students').select('id, name, email, branch, graduation_year, cgpa, organization_id, account_status');
      setStudents(stdData || []);

      // 4. Fetch Recruiters Count / List
      const { data: recData } = await insforge.database.from('recruiters').select('id, name, email, company, organization_id, status');
      setRecruiters(recData || []);

      // 5. Fetch Platform Audit Logs
      const { data: logData } = await insforge.database.from('audit_logs').select('*').order('created_at', { ascending: false });
      setAuditLogs(logData || []);

      // 6. Fetch Global Settings
      const { data: settsData } = await insforge.database.from('platform_settings').select('*');
      const settingsMap: Record<string, any> = {};
      (settsData || []).forEach(row => {
        settingsMap[row.key] = row.value;
      });
      setSettings(settingsMap);

      // 7. Fetch Jobs & Applications totals
      const { data: jobsData } = await insforge.database.from('jobs').select('id, organization_id, company');
      setJobs(jobsData || []);
      const { data: apps } = await insforge.database.from('job_applications').select('id, organization_id');

      // 8. System alerts for Control Center
      const { data: notifData } = await insforge.database
        .from('notifications')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false });
      setNotifications(notifData || []);

      // 9. Fetch Onboarding Requests
      const { data: reqsData } = await insforge.database
        .from('organization_requests')
        .select('*')
        .order('submitted_at', { ascending: false });
      const requestsList = reqsData || [];
      setOrgRequests(requestsList);

      // 10. Fetch Mock Email Logs
      const { data: emailLogsData } = await insforge.database
        .from('mock_emails')
        .select('*')
        .order('sent_at', { ascending: false });
      setMockEmails(emailLogsData || []);

      // Set platform analytics stats
      setStats({
        totalOrganizations: organizationsList.length,
        activeOrganizations: organizationsList.filter(o => o.status === 'Active').length,
        suspendedOrganizations: organizationsList.filter(o => o.status === 'Suspended').length,
        pendingOnboardings: requestsList.filter(r => r.status === 'Pending').length,
        platformHealth: 'Good',
        totalStudentsCount: (stdData || []).length,
        totalRecruitersCount: (recData || []).length,
        totalJobsCount: (jobsData || []).length,
        totalApplicationsCount: (apps || []).length,
        requestsPending: requestsList.filter(r => r.status === 'Pending').length,
        requestsUnderReview: requestsList.filter(r => r.status === 'Under Review').length,
        requestsApproved: requestsList.filter(r => r.status === 'Approved').length,
        requestsRejected: requestsList.filter(r => r.status === 'Rejected').length,
        requestsNeedMoreInfo: requestsList.filter(r => r.status === 'Need More Information').length
      });

      // Default selected analytics org if not set
      if (!selectedAnalyticsOrgId && organizationsList.length > 0) {
        setSelectedAnalyticsOrgId(organizationsList[0].id);
      }
      if (!selectedDashboardOrgId && organizationsList.length > 0) {
        setSelectedDashboardOrgId(organizationsList[0].id);
      }
    } catch (err) {
      console.error('Error loading SaaS variables:', err);
      showToast('Error synchronizing platform node data.', 'error');
    } finally {
      setDataLoading(false);
    }
  }

  // Create Organization & Primary Admin Flow
  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault();
    setOrgCreateError('');
    if (!orgName.trim() || !orgCode.trim() || !orgAdminName.trim() || !orgAdminEmail.trim() || !orgAdminPassword.trim()) {
      setOrgCreateError('All required fields must be populated.');
      return;
    }

    setOrgCreating(true);
    let createdOrgId = '';
    try {
      // 1. Insert organization
      const { data: newOrg, error: orgErr } = await insforge.database
        .from('organizations')
        .insert([{
          name: orgName.trim(),
          code: orgCode.trim().toUpperCase(),
          website: orgWebsite.trim() || null,
          address: orgAddress.trim() || null,
          logo_url: orgLogoUrl.trim() || null,
          status: 'Active'
        }])
        .select()
        .single();

      if (orgErr) throw orgErr;
      createdOrgId = newOrg.id;

      // 2. Provision Primary Admin Account using tempClient (isServerMode: true)
      const tempClient = createClient({
        baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
        anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
        isServerMode: true
      });

      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: orgAdminEmail.trim(),
        password: orgAdminPassword,
        name: orgAdminName.trim()
      });

      if (authErr) throw authErr;

      // 3. Associate with admins table
      const { error: adminErr } = await insforge.database.from('admins').insert([{
        user_id: authData.user.id,
        name: orgAdminName.trim(),
        email: orgAdminEmail.trim(),
        status: 'Active',
        role: 'organization_admin',
        organization_id: createdOrgId,
        permissions: ['Manage Students', 'Manage Jobs', 'Manage Applications', 'View Analytics']
      }]);

      if (adminErr) throw adminErr;

      // Log audit
      await writeAuditLog(`Created tenant organization: ${orgName.trim()} with code ${orgCode.trim()}`, orgAdminEmail.trim());

      // Reset fields
      setOrgName('');
      setOrgCode('');
      setOrgLogoUrl('');
      setOrgWebsite('');
      setOrgAddress('');
      setOrgAdminName('');
      setOrgAdminEmail('');
      setOrgAdminPassword('');
      setShowCreateOrgModal(false);
      showToast('Tenant organization and primary admin created successfully!');
      await loadData();
    } catch (err: any) {
      console.error('Organization setup failed:', err);
      if (createdOrgId) {
        await insforge.database.from('organizations').delete().eq('id', createdOrgId);
      }
      setOrgCreateError(err.message || 'Failed to initialize organization.');
    } finally {
      setOrgCreating(false);
    }
  }

  // Edit Tenant Details
  async function handleEditOrganization(orgId: string) {
    setOrgEditingError('');
    if (!editName.trim()) {
      setOrgEditingError('Organization name is required.');
      return;
    }

    setOrgEditing(true);
    try {
      const { error } = await insforge.database
        .from('organizations')
        .update({
          name: editName.trim(),
          website: editWebsite.trim() || null,
          address: editAddress.trim() || null,
          logo_url: editLogoUrl.trim() || null
        })
        .eq('id', orgId);

      if (error) throw error;

      // Also update the primary admin's name/email if changed
      const primaryAdmin = admins.find((a: any) => a.organization_id === orgId);
      if (primaryAdmin && (editAdminName.trim() || editAdminEmail.trim())) {
        const adminUpdates: any = {};
        if (editAdminName.trim() && editAdminName.trim() !== primaryAdmin.name) {
          adminUpdates.name = editAdminName.trim();
        }
        if (editAdminEmail.trim() && editAdminEmail.trim() !== primaryAdmin.email) {
          adminUpdates.email = editAdminEmail.trim();
        }
        if (Object.keys(adminUpdates).length > 0) {
          // Update admins table
          await insforge.database.from('admins').update(adminUpdates).eq('id', primaryAdmin.id);
          // Also update organization_admins table to keep them in sync
          await insforge.database.from('organization_admins')
            .update(adminUpdates)
            .eq('organization_id', orgId);
        }
      }

      await writeAuditLog(`Updated organization details: ${editName.trim()}`, showViewOrgModal.code);
      showToast('Organization details updated successfully.');
      setIsEditingOrgDetails(false);
      await loadData();
      
      // Refresh local showViewOrgModal details
      const { data: updatedOrg } = await insforge.database
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();
      if (updatedOrg) {
        setShowViewOrgModal(updatedOrg);
      }
    } catch (err: any) {
      setOrgEditingError(err.message || 'Failed to update organization details.');
    } finally {
      setOrgEditing(false);
    }
  }

  // Toggle Organization Status
  async function handleToggleOrgStatus(org: any) {
    const newStatus = org.status === 'Active' ? 'Suspended' : 'Active';
    const nextSubStatus = newStatus === 'Active' ? 'Active' : 'Suspended';
    try {
      const updateData: any = { 
        status: newStatus,
        subscription_status: nextSubStatus
      };
      if (newStatus === 'Suspended') {
        updateData.last_suspended_at = new Date().toISOString();
      }
      
      const { error } = await insforge.database
        .from('organizations')
        .update(updateData)
        .eq('id', org.id);

      if (error) throw error;

      await writeAuditLog(`Toggled status of ${org.name} to ${newStatus}`, org.code);
      showToast(`Organization is now ${newStatus}`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update organization status.', 'error');
    }
  }

  // Update/Extend Organization Subscription
  const [subscriptionEditLoading, setSubscriptionEditLoading] = useState(false);
  
  async function handleUpdateOrgSubscription(orgId: string, type: 'Trial' | 'Monthly' | 'Lifetime', months: number) {
    setSubscriptionEditLoading(true);
    try {
      const startDate = new Date();
      let endDate: Date | null = null;
      let autoSuspend = true;

      if (type === 'Trial') {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 15);
      } else if (type === 'Monthly') {
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
      } else if (type === 'Lifetime') {
        endDate = null;
        autoSuspend = false;
      }

      const { error } = await insforge.database
        .from('organizations')
        .update({
          subscription_type: type,
          subscription_status: 'Active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate ? endDate.toISOString() : null,
          auto_suspend: autoSuspend,
          status: 'Active' // Reactivate if it was suspended/expired!
        })
        .eq('id', orgId);

      if (error) throw error;

      showToast('Subscription updated successfully!');
      await loadData();
      
      // Update local state of showViewOrgModal if currently open to reflect change immediately
      if (showViewOrgModal && showViewOrgModal.id === orgId) {
        const { data: updatedOrg } = await insforge.database
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .maybeSingle();
        if (updatedOrg) {
          setShowViewOrgModal(updatedOrg);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription.', 'error');
    } finally {
      setSubscriptionEditLoading(false);
    }
  }

  // Approve Pending Organization Request
  async function handleApprovePendingRequest(req: any, subDetails: { type: 'Trial' | 'Monthly' | 'Lifetime' | 'Testing'; months: number }) {
    setActionLoading(true);
    setSubscriptionActionLoading(true);
    let createdOrgId = '';
    try {
      // 1. Decrypt plaintext password
      const plainPass = decryptPassword(req.temp_password);

      // 2. Compute subscription dates
      const startDate = new Date();
      let endDate: Date | null = null;
      let autoSuspend = true;

      if (subDetails.type === 'Trial') {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 15);
      } else if (subDetails.type === 'Monthly') {
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + subDetails.months);
      } else if (subDetails.type === 'Lifetime') {
        endDate = null;
        autoSuspend = false;
      } else if (subDetails.type === 'Testing') {
        endDate = new Date();
        endDate.setMinutes(endDate.getMinutes() + 5);
      }

      // 3. Insert into organizations
      const { data: newOrg, error: orgErr } = await insforge.database
        .from('organizations')
        .insert([{
          name: req.organization_name,
          code: req.generated_org_code,
          website: req.website || null,
          address: req.address || null,
          logo_url: req.logo_url || null,
          status: 'Active',
          subscription_type: subDetails.type,
          subscription_status: 'Active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate ? endDate.toISOString() : null,
          trial_used: subDetails.type === 'Trial',
          auto_suspend: autoSuspend,
          approved_by: currentUser?.name || 'Super Admin',
          approved_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (orgErr) throw orgErr;
      createdOrgId = newOrg.id;

      // 3. Provision Admin in Auth
      let signupUserId = '';
      const tempClient = createClient({
        baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL || 'https://39s3r2sh.ap-southeast.insforge.app',
        anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
        isServerMode: true
      });

      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: req.admin_email,
        password: plainPass,
        name: req.admin_name
      });

      if (authErr) {
        const errStr = authErr.message || '';
        if (errStr.toLowerCase().includes('already registered') || errStr.toLowerCase().includes('already exists') || errStr.toLowerCase().includes('unique constraint') || errStr.toLowerCase().includes('duplicate')) {
          // Retrieve the existing user ID from auth.users via RPC helper
          const { data: existingUserId, error: rpcErr } = await insforge.database.rpc('get_user_id_by_email', { email_addr: req.admin_email });
          if (rpcErr || !existingUserId) {
            throw new Error(`User account already exists, but we failed to retrieve their ID: ${rpcErr?.message || 'Not found'}`);
          }
          signupUserId = existingUserId;
        } else {
          throw authErr;
        }
      } else if (authData?.user?.id) {
        signupUserId = authData.user.id;
      } else {
        throw new Error('User provisioning failed: no user data returned.');
      }

      // 4. Create or update record in admins
      const { data: existingAdminRecord } = await insforge.database
        .from('admins')
        .select('id')
        .eq('user_id', signupUserId)
        .maybeSingle();

      if (existingAdminRecord) {
        const { error: adminErr } = await insforge.database
          .from('admins')
          .update({
            name: req.admin_name,
            email: req.admin_email,
            status: 'Active',
            role: 'organization_admin',
            organization_id: createdOrgId,
            permissions: ['Manage Students', 'Manage Jobs', 'Manage Applications', 'View Analytics']
          })
          .eq('id', existingAdminRecord.id);
        if (adminErr) throw adminErr;
      } else {
        const { error: adminErr } = await insforge.database.from('admins').insert([{
          user_id: signupUserId,
          name: req.admin_name,
          email: req.admin_email,
          status: 'Active',
          role: 'organization_admin',
          organization_id: createdOrgId,
          permissions: ['Manage Students', 'Manage Jobs', 'Manage Applications', 'View Analytics']
        }]);
        if (adminErr) throw adminErr;
      }

      // 4b. Create or update record in organization_admins
      const { data: existingOrgAdminRecord } = await insforge.database
        .from('organization_admins')
        .select('id')
        .eq('user_id', signupUserId)
        .maybeSingle();

      if (existingOrgAdminRecord) {
        const { error: orgAdminErr } = await insforge.database
          .from('organization_admins')
          .update({
            name: req.admin_name,
            email: req.admin_email,
            organization_id: createdOrgId,
            password_hash: req.password_hash,
            is_active: true
          })
          .eq('id', existingOrgAdminRecord.id);
        if (orgAdminErr) throw orgAdminErr;
      } else {
        const { error: orgAdminErr } = await insforge.database.from('organization_admins').insert([{
          user_id: signupUserId,
          name: req.admin_name,
          email: req.admin_email,
          organization_id: createdOrgId,
          password_hash: req.password_hash,
          is_active: true,
          must_change_password: true
        }]);
        if (orgAdminErr) throw orgAdminErr;
      }

      // 5. Update request status & NULL out credentials for safety
      const { error: updateErr } = await insforge.database
        .from('organization_requests')
        .update({
          status: 'Approved',
          temp_password: null,
          remarks: 'Request approved by Platform Owner.'
        })
        .eq('id', req.id);

      if (updateErr) throw updateErr;

      // 6. Write notification logs in mock_emails
      await insforge.database.from('mock_emails').insert([{
        sender: 'onboarding@placify.dev',
        recipient: req.admin_email,
        subject: `Welcome to Placify! Onboarding Approved for ${req.organization_name}`,
        body: `Hello ${req.admin_name},\n\nWe are pleased to inform you that the onboarding request for '${req.organization_name}' has been approved by the platform administrators.\n\nYour tenant dashboard is ready at the organization domain. Use the credentials configured during signup to log in.\n\nTenant Code: ${req.generated_org_code}\nAdmin Email: ${req.admin_email}\n\nBest Regards,\nPlacify Onboarding Team`
      }]);

      await writeAuditLog(`Approved onboarding request for: ${req.organization_name}`, req.generated_org_code);
      setApprovedOrgName(req.organization_name);
      setShowApprovalSuccess(true);
      await loadData();
    } catch (err: any) {
      console.error('Approve onboarding request failed:', err);
      // Clean up organization if it was created but user provisioning failed
      if (createdOrgId) {
        await insforge.database.from('organizations').delete().eq('id', createdOrgId);
      }
      showToast(err.message || 'Onboarding approval failed.', 'error');
    } finally {
      setActionLoading(false);
      setSubscriptionActionLoading(false);
    }
  }

  async function handleRejectRequest(req: any) {
    if (!remarksInput.trim()) {
      showToast('Please enter remarks specifying the rejection reason.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to REJECT the onboarding request for '${req.organization_name}'?`)) return;
    setActionLoading(true);
    try {
      const { error } = await insforge.database
        .from('organization_requests')
        .update({
          status: 'Rejected',
          remarks: remarksInput.trim(),
          temp_password: null
        })
        .eq('id', req.id);

      if (error) throw error;

      await insforge.database.from('mock_emails').insert([{
        sender: 'onboarding@placify.dev',
        recipient: req.admin_email,
        subject: `Onboarding Request Rejected - ${req.organization_name}`,
        body: `Hello ${req.admin_name},\n\nThank you for your interest in Placify. Unfortunately, your onboarding request for '${req.organization_name}' has been rejected by the platform administrators.\n\nReason/Remarks:\n"${remarksInput.trim()}"\n\nIf you have any questions, you can reply directly to this mail.\n\nBest Regards,\nPlacify Onboarding Team`
      }]);

      await writeAuditLog(`Rejected onboarding request for: ${req.organization_name}`, req.generated_org_code);
      showToast(`Onboarding request for '${req.organization_name}' has been rejected.`);
      setRemarksInput('');
      setShowRequestDetail(false);
      setSelectedRequest(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestMoreInfo(req: any) {
    if (!remarksInput.trim()) {
      showToast('Please enter remarks specifying the information required.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await insforge.database
        .from('organization_requests')
        .update({
          status: 'Need More Information',
          remarks: remarksInput.trim()
        })
        .eq('id', req.id);

      if (error) throw error;

      await insforge.database.from('mock_emails').insert([{
        sender: 'onboarding@placify.dev',
        recipient: req.admin_email,
        subject: `Clarification Needed: Onboarding Request for ${req.organization_name}`,
        body: `Hello ${req.admin_name},\n\nThe platform onboarding team has reviewed your request for '${req.organization_name}' and requires additional details before approval.\n\nRequired Clarification:\n"${remarksInput.trim()}"\n\nPlease log in to the status checking portal using your onboarding admin email and password to edit and resubmit your request.\n\nBest Regards,\nPlacify Onboarding Team`
      }]);

      await writeAuditLog(`Requested clarification for request: ${req.organization_name}`, req.generated_org_code);
      showToast('Information request sent to organization successfully.');
      setRemarksInput('');
      setShowRequestDetail(false);
      setSelectedRequest(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // Reset Credentials for Primary Admin via RPC
  async function handleResetCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredsResetError('');
    if (!newTempPassword.trim()) {
      setCredsResetError('Please enter a temporary password.');
      return;
    }

    setCredsResetting(true);
    try {
      const adminEmail = showResetCredsModal.email;
      
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: adminEmail,
        new_password: newTempPassword.trim()
      });

      if (error) throw error;

      await writeAuditLog(`Reset primary admin credentials for org admin: ${adminEmail}`, showResetCredsModal.name);
      setResetSuccessData({ email: adminEmail, pass: newTempPassword.trim() });
      setNewTempPassword('');
      showToast('Admin password updated successfully.');
    } catch (err: any) {
      setCredsResetError(err.message || 'Credentials update failed.');
    } finally {
      setCredsResetting(false);
    }
  }

  // Write Audit Log Utility
  async function writeAuditLog(action: string, affectedUser?: string) {
    try {
      await insforge.database.from('audit_logs').insert([{
        performed_by: currentUser.name,
        action,
        affected_user: affectedUser || 'System Node',
        device_info: navigator.userAgent
      }]);
      // Reload logs
      const { data: logData } = await insforge.database.from('audit_logs').select('*').order('created_at', { ascending: false });
      setAuditLogs(logData || []);
    } catch (err) {
      console.error('Audit trace error:', err);
    }
  }

  // Reset Student Password via RPC
  async function handleStudentResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setStudentCredsError('');
    if (!studentNewPassword.trim()) { setStudentCredsError('Please enter a password.'); return; }
    setStudentCredsResetting(true);
    try {
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: showStudentModal.email,
        new_password: studentNewPassword.trim()
      });
      if (error) throw error;
      await writeAuditLog(`Reset password for student: ${showStudentModal.email}`, showStudentModal.name);
      setStudentCredsSuccess({ email: showStudentModal.email, pass: studentNewPassword.trim() });
      setStudentNewPassword('');
      showToast('Student password updated successfully.');
    } catch (err: any) {
      setStudentCredsError(err.message || 'Password reset failed.');
    } finally {
      setStudentCredsResetting(false);
    }
  }

  // Update Student Account Status or Delete
  async function handleStudentStatusChange(newStatus: 'Active' | 'Suspended' | '__delete__') {
    if (newStatus === '__delete__') {
      if (!confirm(`Permanently delete ${showStudentModal.name || showStudentModal.email}? This cannot be undone.`)) return;
    }
    setStudentStatusUpdating(true);
    try {
      if (newStatus === '__delete__') {
        const { error } = await insforge.database.from('students').delete().eq('id', showStudentModal.id);
        if (error) throw error;
        await writeAuditLog(`Deleted student account: ${showStudentModal.email}`, showStudentModal.name);
        showToast('Student account permanently deleted.');
        setShowStudentModal(null);
      } else {
        const { error } = await insforge.database.from('students').update({ account_status: newStatus }).eq('id', showStudentModal.id);
        if (error) throw error;
        await writeAuditLog(`Changed student status to ${newStatus}: ${showStudentModal.email}`, showStudentModal.name);
        setShowStudentModal({ ...showStudentModal, account_status: newStatus });
        showToast(`Student account ${newStatus === 'Active' ? 'activated' : 'suspended'}.`);
      }
      const { data: stdData } = await insforge.database.from('students').select('id, name, email, branch, graduation_year, cgpa, organization_id, account_status');
      setStudents(stdData || []);
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setStudentStatusUpdating(false);
    }
  }

  // Reset Subadmin Password via RPC
  async function handleSubadminResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setSubadminCredsError('');
    if (!subadminNewPassword.trim()) { setSubadminCredsError('Please enter a password.'); return; }
    setSubadminCredsResetting(true);
    try {
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: showSubadminModal.email,
        new_password: subadminNewPassword.trim()
      });
      if (error) throw error;
      await writeAuditLog(`Reset password for subadmin: ${showSubadminModal.email}`, showSubadminModal.name);
      setSubadminCredsSuccess({ email: showSubadminModal.email, pass: subadminNewPassword.trim() });
      setSubadminNewPassword('');
      showToast('Subadmin password updated successfully.');
    } catch (err: any) {
      setSubadminCredsError(err.message || 'Password reset failed.');
    } finally {
      setSubadminCredsResetting(false);
    }
  }

  // Update Subadmin Account Status or Delete
  async function handleSubadminStatusChange(newStatus: 'Active' | 'Suspended' | '__delete__') {
    if (newStatus === '__delete__') {
      if (!confirm(`Permanently delete ${showSubadminModal.name || showSubadminModal.email}? This cannot be undone.`)) return;
    }
    setSubadminStatusUpdating(true);
    try {
      if (newStatus === '__delete__') {
        const { error } = await insforge.database.from('admins').delete().eq('id', showSubadminModal.id);
        if (error) throw error;
        await writeAuditLog(`Deleted subadmin account: ${showSubadminModal.email}`, showSubadminModal.name);
        showToast('Subadmin account permanently deleted.');
        setShowSubadminModal(null);
      } else {
        const { error } = await insforge.database.from('admins').update({ status: newStatus }).eq('id', showSubadminModal.id);
        if (error) throw error;
        await writeAuditLog(`Changed subadmin status to ${newStatus}: ${showSubadminModal.email}`, showSubadminModal.name);
        setShowSubadminModal({ ...showSubadminModal, status: newStatus });
        showToast(`Subadmin account ${newStatus === 'Active' ? 'activated' : 'suspended'}.`);
      }
      const { data: subAdmData } = await insforge.database.from('admins').select('*').neq('role', 'organization_admin');
      setSubAdmins(subAdmData || []);
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setSubadminStatusUpdating(false);
    }
  }

  // User Management: Reset Password
  async function handleUmResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setUmCredsError('');
    if (!umNewPassword.trim()) { setUmCredsError('Please enter a password.'); return; }
    setUmCredsResetting(true);
    try {
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: selectedUmUser.email,
        new_password: umNewPassword.trim()
      });
      if (error) throw error;
      await writeAuditLog(`Reset password for user: ${selectedUmUser.email}`, selectedUmUser.name);
      setUmCredsSuccess({ email: selectedUmUser.email, pass: umNewPassword.trim() });
      setUmNewPassword('');
      showToast('Password updated successfully.');
    } catch (err: any) {
      setUmCredsError(err.message || 'Password reset failed.');
    } finally {
      setUmCredsResetting(false);
    }
  }

  // User Management: Change Status / Delete
  async function handleUmStatusChange(newStatus: 'Active' | 'Suspended' | '__delete__') {
    if (newStatus === '__delete__') {
      if (!confirm(`Permanently delete ${selectedUmUser.name || selectedUmUser.email}? This cannot be undone.`)) return;
    }
    setUmStatusUpdating(true);
    const table = selectedUmUser._type === 'student' ? 'students'
                 : selectedUmUser._type === 'recruiter' ? 'recruiters'
                 : 'admins';
    const statusField = selectedUmUser._type === 'student' ? 'account_status' : 'status';
    try {
      if (newStatus === '__delete__') {
        const { error } = await insforge.database.from(table).delete().eq('id', selectedUmUser.id);
        if (error) throw error;
        await writeAuditLog(`Deleted ${selectedUmUser._type} account: ${selectedUmUser.email}`, selectedUmUser.name);
        showToast('User account permanently deleted.');
        setSelectedUmUser(null);
      } else {
        const { error } = await insforge.database.from(table).update({ [statusField]: newStatus }).eq('id', selectedUmUser.id);
        if (error) throw error;
        await writeAuditLog(`Changed ${selectedUmUser._type} status to ${newStatus}: ${selectedUmUser.email}`, selectedUmUser.name);
        setSelectedUmUser({ ...selectedUmUser, [statusField]: newStatus });
        showToast(`User account ${newStatus === 'Active' ? 'activated' : 'suspended'}.`);
      }
      // Reload relevant data
      const { data: admData } = await insforge.database.from('admins').select('*').eq('role', 'organization_admin');
      setAdmins(admData || []);
      const { data: subAdmData } = await insforge.database.from('admins').select('*').neq('role', 'organization_admin');
      setSubAdmins(subAdmData || []);
      const { data: stdData } = await insforge.database.from('students').select('id, name, email, branch, graduation_year, cgpa, organization_id, account_status');
      setStudents(stdData || []);
      const { data: recData } = await insforge.database.from('recruiters').select('id, name, email, company, organization_id, status');
      setRecruiters(recData || []);
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setUmStatusUpdating(false);
    }
  }

  // Global settings update

  async function handleSaveSettings(key: string, value: any) {
    try {
      const { error } = await insforge.database.from('platform_settings').upsert({
        key,
        value: value
      });
      if (error) throw error;
      await writeAuditLog(`Updated global platform setting key: ${key}`);
      showToast(`Global configuration '${key}' updated.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Configuration save failed.', 'error');
    }
  }

  // Clear Alert Notification
  async function handleClearNotification(notifId: string) {
    try {
      await insforge.database.from('notifications').delete().eq('id', notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      showToast('Alert cleared.');
    } catch (err) {
      console.error(err);
    }
  }

  // Export ledger to CSV
  function handleExportLogs() {
    const headers = ['Performer', 'Action', 'Target Node', 'Timestamp', 'Device Profile'];
    const rows = auditLogs.map(log => [
      log.performed_by,
      log.action,
      log.affected_user,
      new Date(log.created_at).toLocaleString(),
      log.device_info.replace(/,/g, ' ')
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placify_saas_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Platform audit logs exported.');
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#030712] font-body text-slate-400">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs tracking-wider uppercase font-bold text-slate-300 animate-pulse">Initializing SaaS Command Center...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#030712] relative overflow-hidden font-body">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all z-50"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-600" />
            
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-white tracking-tight">Placify Control Center</h1>
              <p className="text-xs text-slate-400 mt-2">Platform Owner (Super Admin) Organization Management Portal.</p>
            </div>

            {loginError && (
              <div className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Platform Owner Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@placify.in"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Security Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-500/15"
              >
                {authLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Keys...</> : 'Open Command Deck'}
              </button>
            </form>
            
            <p className="text-[10px] text-slate-500 text-center mt-6">
              Restricted Area. Connection metadata and IP traces recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter logs or orgs list based on search
  const filteredOrgs = organizations.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const activeOrgsList = filteredOrgs.filter(o => {
    if (orgStatusFilter === 'all') return o.status !== 'Pending';
    return o.status === orgStatusFilter;
  });

  const filteredPendingOrgs = orgRequests
    .filter(r => r.status === 'Pending')
    .filter(r => 
      r.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.generated_org_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.affected_user && log.affected_user.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (logFilter === 'all') return matchesSearch;
    return matchesSearch && log.action.toLowerCase().includes(logFilter);
  });

  // Calculate selected org analytics data
  const selectedOrg = organizations.find(o => o.id === selectedAnalyticsOrgId);
  const selectedOrgStudents = students.filter(s => s.organization_id === selectedAnalyticsOrgId);
  const selectedOrgRecruiters = recruiters.filter(r => r.organization_id === selectedAnalyticsOrgId);
  const selectedOrgAdmin = admins.find(a => a.organization_id === selectedAnalyticsOrgId);
  const selectedOrgSubAdmins = subAdmins.filter(sa => sa.organization_id === selectedAnalyticsOrgId);
  const selectedOrgJobs = jobs.filter(j => j.organization_id === selectedAnalyticsOrgId);
  const selectedOrgCompaniesCount = new Set([
    ...selectedOrgJobs.map(j => j.company?.trim()),
    ...selectedOrgRecruiters.map(r => getCompanyName(r.company))
  ].filter(Boolean)).size;

  // Calculate selected org dashboard data
  const selectedDashboardOrg = organizations.find(o => o.id === selectedDashboardOrgId);
  const selectedDashboardOrgStudents = students.filter(s => s.organization_id === selectedDashboardOrgId);
  const selectedDashboardOrgRecruiters = recruiters.filter(r => r.organization_id === selectedDashboardOrgId);
  const selectedDashboardOrgAdmin = admins.find(a => a.organization_id === selectedDashboardOrgId);
  const selectedDashboardOrgSubAdmins = subAdmins.filter(sa => sa.organization_id === selectedDashboardOrgId);
  const selectedDashboardOrgJobs = jobs.filter(j => j.organization_id === selectedDashboardOrgId);
  const selectedDashboardOrgCompaniesCount = new Set([
    ...selectedDashboardOrgJobs.map(j => j.company?.trim()),
    ...selectedDashboardOrgRecruiters.map(r => getCompanyName(r.company))
  ].filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#030712] font-body flex relative overflow-hidden text-slate-200">
      
      {/* Toast Popup */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-[9999] p-4 rounded-xl border border-blue-500/20 bg-slate-900/90 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl text-white backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="flex items-center">
              <style>{`
                @keyframes laptop-code-pulse {
                  0%, 100% {
                    opacity: 0.95;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 0.4;
                    transform: scale(0.95);
                  }
                }
                .laptop-code-symbol {
                  transform-origin: 50px 61px;
                  animation: laptop-code-pulse 2.5s ease-in-out infinite;
                }
              `}</style>
              <svg
                viewBox="0 0 100 100"
                className="w-9 h-9 flex-shrink-0 transition-all duration-300 text-blue-500"
              >
                <defs>
                  <mask id="coder-torso-mask-cc">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <rect x="10" y="40" width="80" height="42" fill="black" />
                  </mask>
                  <mask id="laptop-screen-mask-cc">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <circle cx="50" cy="61" r="14" fill="black" />
                  </mask>
                </defs>

                <circle
                  cx="50"
                  cy="18"
                  r="16"
                  className="fill-current"
                />
                <path
                  d="M 20 62 C 20 34, 80 34, 80 62 Z"
                  mask="url(#coder-torso-mask-cc)"
                  className="fill-current"
                />
                <rect
                  x="14"
                  y="44"
                  width="72"
                  height="34"
                  rx="4"
                  mask="url(#laptop-screen-mask-cc)"
                  className="fill-current"
                />
                <rect
                  x="6"
                  y="82"
                  width="88"
                  height="6"
                  rx="3"
                  className="fill-current"
                />
                <rect
                  x="12"
                  y="90"
                  width="76"
                  height="6"
                  rx="3"
                  className="fill-current"
                />
                <g className="laptop-code-symbol">
                  <path
                    d="M 45 56.5 L 39 61.5 L 45 66.5 M 55 56.5 L 61 61.5 L 55 66.5 M 51.5 55.5 L 48.5 67.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{ fill: 'none' }}
                  />
                </g>
              </svg>
            </div>
            <div>
              <span className="font-heading font-extrabold text-white text-sm tracking-tight leading-none block">Placify Control</span>
              <span className="text-[9px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">Control Center</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Command Desk', icon: Activity },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'pending_orgs', label: 'Pending Requests', icon: CheckCircle, badge: stats.pendingOnboardings },
              { id: 'emails', label: 'Email Logs', icon: Mail },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'analytics', label: 'Org Analytics', icon: BarChart3 },
              { id: 'logs', label: 'Audit Logs', icon: Settings },
              { id: 'settings', label: 'System Settings', icon: Lock },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as TabType); setSearchTerm(''); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all group ${
                  activeTab === item.id 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/15' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 font-heading">
              SA
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-slate-200 block truncate">{currentUser.name}</span>
              <span className="text-[9px] font-bold text-slate-500 block">PLATFORM_OWNER</span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full h-9 rounded-xl border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 text-slate-400 hover:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10 p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* HEADER BAR */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-white capitalize">
              {activeTab === 'dashboard' ? 'Placify Command Desk'
                : activeTab === 'users' ? 'User Management'
                : activeTab.replace(/_/g, ' ')}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {activeTab === 'users'
                ? 'Search, filter, and manage all users across every organization from one place.'
                : 'Platform owner settings node. Scoped to multi-tenant organization directory variables.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              disabled={dataLoading}
              className="h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
              Sync Node
            </button>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center relative transition-all"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl p-4 space-y-3 z-50 animate-scale-in">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold text-white">System Alerts</span>
                    {notifications.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-semibold">{notifications.length} pending</span>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5">
                    {notifications.map(notif => (
                      <div key={notif.id} className="p-2.5 rounded-lg border border-slate-900 bg-slate-900/10 space-y-1 relative">
                        <button
                          onClick={() => handleClearNotification(notif.id)}
                          className="absolute top-1.5 right-1.5 p-0.5 text-slate-500 hover:text-white rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <h4 className="text-[11px] font-bold text-slate-200 pr-4">{notif.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{notif.message}</p>
                        <span className="text-[8px] text-slate-500 block">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No pending system alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="h-10 px-4 rounded-xl border border-slate-900 bg-slate-950 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* ─── COMMAND DESK TAB ────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* SaaS Banner */}
            <div className="relative border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-500/15 to-transparent pointer-events-none" />
              <h2 className="text-xl font-heading font-bold text-white">Platform Owner Command Desk</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                Create and configure colleges and organizations inside Placify. Maintain tenants, verify onboarding requests, monitor system logs, and inspect platform analytics globally.
              </p>
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { title: 'Total Organizations', value: stats.totalOrganizations, label: 'Registered tenants' },
                { title: 'Active Organizations', value: stats.activeOrganizations, label: 'Running instances', color: 'border-emerald-500/20 text-emerald-400' },
                { title: 'Suspended Organizations', value: stats.suspendedOrganizations, label: 'Suspension lockout active', color: 'border-red-500/20 text-red-400' },
                { title: 'Pending Onboardings', value: stats.pendingOnboardings, label: 'Requests queue', color: 'border-amber-500/20 text-amber-400' },
                { title: 'Platform Health', value: stats.platformHealth, label: 'Database & Node API normal', color: 'border-blue-500/20 text-blue-400' }
              ].map((stat, i) => (
                <div key={i} className={`p-5 rounded-2xl border bg-slate-900/30 backdrop-blur-md relative ${stat.color || 'border-slate-900'}`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{stat.title}</span>
                  <div className="text-3xl font-heading font-extrabold mt-2">{stat.value}</div>
                  <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Platform statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Students Count', value: stats.totalStudentsCount, label: 'Cross-tenant student profiles' },
                { title: 'Total Recruiters Count', value: stats.totalRecruitersCount, label: 'Registered recruiter profiles' },
                { title: 'Total Job Postings', value: stats.totalJobsCount, label: 'Active vacancy offers' },
                { title: 'Applications Processed', value: stats.totalApplicationsCount, label: 'Total recruitment pipelines' }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (stat.title === 'Total Students Count') {
                      setShowAllStudentsModal(true);
                    }
                  }}
                  className={`p-5 rounded-2xl border bg-slate-900/10 transition-all ${
                    stat.title === 'Total Students Count' 
                      ? 'border-blue-500/30 hover:border-blue-500 cursor-pointer hover:bg-blue-500/[0.02] shadow-lg shadow-blue-500/5' 
                      : 'border-slate-900'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{stat.title}</span>
                  <div className="text-2xl font-heading font-extrabold text-white mt-2">{stat.value}</div>
                  <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* TENANT SPECIFIC INSIGHTS */}
            <div className="border border-slate-900 bg-slate-950 p-6 rounded-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Tenant Specific Insight</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Inspect metrics scoped to a specific organization.</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search tenant..."
                      value={dashboardOrgSearchTerm}
                      onChange={(e) => {
                        setDashboardOrgSearchTerm(e.target.value);
                        setDashboardActiveMetricDetail(null);
                      }}
                      className="h-9 pl-9 pr-3 rounded-xl border border-slate-900 bg-slate-900/30 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-44 md:w-56"
                    />
                  </div>

                  {/* Dropdown select */}
                  <select
                    value={selectedDashboardOrgId}
                    onChange={(e) => {
                      setSelectedDashboardOrgId(e.target.value);
                      setDashboardActiveMetricDetail(null);
                    }}
                    className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    {organizations
                      .filter(o => 
                        o.name.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase()) ||
                        o.code.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase())
                      )
                      .map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                      ))}
                    {organizations.filter(o => 
                      o.name.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase()) ||
                      o.code.toLowerCase().includes(dashboardOrgSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <option value="">No matching tenants</option>
                    )}
                  </select>
                </div>
              </div>

              {selectedDashboardOrg ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Organization general details */}
                    <div className="border border-slate-900 bg-slate-900/10 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        {selectedDashboardOrg.logo_url ? (
                          <img src={selectedDashboardOrg.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-slate-900 border border-slate-800" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-base font-heading">
                            {selectedDashboardOrg.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-white">{selectedDashboardOrg.name}</h4>
                          <span className="text-[10px] text-slate-500 block font-mono">{selectedDashboardOrg.code}</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs border-t border-slate-900/60 pt-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Instance Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            selectedDashboardOrg.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>{selectedDashboardOrg.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Website:</span>
                          <a href={selectedDashboardOrg.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate max-w-[150px]">{selectedDashboardOrg.website || 'N/A'}</a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Primary Admin:</span>
                          <span className="text-slate-300 font-medium">{selectedDashboardOrgAdmin ? selectedDashboardOrgAdmin.name : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Admin Email:</span>
                          <span className="text-slate-300 font-mono truncate max-w-[150px]">{selectedDashboardOrgAdmin ? selectedDashboardOrgAdmin.email : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Organization Counts */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                      {[
                        { key: 'subadmins', title: 'Subadmins Registered', value: selectedDashboardOrgSubAdmins.length, label: 'Staff accounts with portal access' },
                        { key: 'students', title: 'Students Enrolled', value: selectedDashboardOrgStudents.length, label: 'Profile cards inside tenant' },
                        { key: 'recruiters', title: 'Recruiters Linked', value: selectedDashboardOrgRecruiters.length, label: 'Active employer accounts' },
                        { key: 'companies', title: 'Companies Listed', value: selectedDashboardOrgCompaniesCount, label: 'Unique recruiting companies' }
                      ].map((metric, i) => (
                        <div 
                          key={i} 
                          onClick={() => setDashboardActiveMetricDetail(dashboardActiveMetricDetail === metric.key ? null : metric.key as any)}
                          className={`border p-5 rounded-2xl cursor-pointer transition-all ${
                            dashboardActiveMetricDetail === metric.key 
                              ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5' 
                              : 'border-slate-900 bg-slate-900/10 hover:border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{metric.title}</span>
                          <div className="text-2xl font-heading font-extrabold text-white mt-2">{metric.value}</div>
                          <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detail table inside dashboard */}
                  {dashboardActiveMetricDetail && (
                    <div className="border border-slate-900 bg-slate-900/10 p-5 rounded-2xl animate-fade-in space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-900 gap-3 flex-wrap">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                            {dashboardActiveMetricDetail === 'subadmins' && `Subadmins in ${selectedDashboardOrg.name}`}
                            {dashboardActiveMetricDetail === 'students' && `Students Enrolled in ${selectedDashboardOrg.name}`}
                            {dashboardActiveMetricDetail === 'recruiters' && `Recruiters Linked to ${selectedDashboardOrg.name}`}
                            {dashboardActiveMetricDetail === 'companies' && `Companies Listed under ${selectedDashboardOrg.name}`}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          {(dashboardActiveMetricDetail === 'subadmins' || dashboardActiveMetricDetail === 'students') && (
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                              <input
                                type="text"
                                value={detailSearchTerm}
                                onChange={e => setDetailSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="h-7 pl-7 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 w-40"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => { setDashboardActiveMetricDetail(null); setDetailSearchTerm(''); }}
                            className="h-7 px-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white text-[10px] font-bold transition-all"
                          >
                            Close Details
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        {dashboardActiveMetricDetail === 'subadmins' && (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                                <th className="p-3">Staff Member</th>
                                <th className="p-3">Designation</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-xs">
                              {selectedDashboardOrgSubAdmins
                                .filter((sa: any) => !detailSearchTerm || sa.name?.toLowerCase().includes(detailSearchTerm.toLowerCase()) || sa.email?.toLowerCase().includes(detailSearchTerm.toLowerCase()))
                                .map((sa: any) => (
                                <tr key={sa.id} onClick={() => { setShowSubadminModal(sa); setSubadminCredsSuccess(null); setSubadminCredsError(''); setSubadminNewPassword(''); }} className="hover:bg-blue-500/5 cursor-pointer transition-colors group">
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{sa.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{sa.email}</div>
                                  </td>
                                  <td className="p-3 text-slate-300">{sa.designation || 'N/A'}</td>
                                  <td className="p-3 text-slate-300">{sa.department || 'N/A'}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${(sa.status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{sa.status || 'Active'}</span>
                                  </td>
                                </tr>
                              ))}
                              {selectedDashboardOrgSubAdmins.length === 0 && (
                                <tr><td colSpan={4} className="p-6 text-center text-xs text-slate-500">No subadmins registered.</td></tr>
                              )}
                            </tbody>
                          </table>
                        )}

                        {dashboardActiveMetricDetail === 'students' && (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                                <th className="p-3">Student</th>
                                <th className="p-3">Branch</th>
                                <th className="p-3">Grad Year</th>
                                <th className="p-3">CGPA</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-xs">
                              {selectedDashboardOrgStudents
                                .filter((s: any) => !detailSearchTerm || s.name?.toLowerCase().includes(detailSearchTerm.toLowerCase()) || s.email?.toLowerCase().includes(detailSearchTerm.toLowerCase()))
                                .map((s: any) => (
                                <tr key={s.id} onClick={() => { setShowStudentModal(s); setStudentCredsSuccess(null); setStudentCredsError(''); setStudentNewPassword(''); }} className="hover:bg-blue-500/5 cursor-pointer transition-colors group">
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name || 'N/A'}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{s.email || ''}</div>
                                  </td>
                                  <td className="p-3 text-slate-300">{s.branch || 'N/A'}</td>
                                  <td className="p-3 text-slate-300 font-mono">{s.graduation_year || 'N/A'}</td>
                                  <td className="p-3 text-emerald-400 font-bold font-mono">{s.cgpa || '0.0'}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ (s.account_status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }`}>{s.account_status || 'Active'}</span>
                                  </td>
                                </tr>
                              ))}
                              {selectedDashboardOrgStudents.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-6 text-center text-xs text-slate-500">
                                    No students enrolled.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )}

                        {dashboardActiveMetricDetail === 'recruiters' && (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Company</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-xs">
                              {selectedDashboardOrgRecruiters.map((r: any) => (
                                <tr
                                  key={r.id}
                                  onClick={() => {
                                    setSelectedUmUser({ ...r, _type: 'recruiter', _status: r.status || 'Active' });
                                    setUmCredsSuccess(null);
                                    setUmCredsError('');
                                    setUmNewPassword('');
                                  }}
                                  className="hover:bg-blue-500/5 cursor-pointer transition-colors group"
                                >
                                  <td className="p-3 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{r.name || 'N/A'}</td>
                                  <td className="p-3 font-mono text-slate-400">{r.email || 'N/A'}</td>
                                  <td className="p-3 text-slate-300">{getCompanyName(r.company) || 'N/A'}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      (r.status || 'Active') === 'Active' || (r.status || 'Active') === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    }`}>{r.status || 'Active'}</span>
                                  </td>
                                </tr>
                              ))}
                              {selectedDashboardOrgRecruiters.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-xs text-slate-500">
                                    No recruiters linked.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )}

                        {dashboardActiveMetricDetail === 'companies' && (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                                <th className="p-3">Company Name</th>
                                <th className="p-3">Jobs Offered</th>
                                <th className="p-3">Recruiters Associated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 text-xs">
                              {Array.from(new Set([
                                ...selectedDashboardOrgJobs.map(j => j.company?.trim()),
                                ...selectedDashboardOrgRecruiters.map(r => getCompanyName(r.company))
                              ].filter(Boolean))).map((companyName, idx) => {
                                const companyJobsCount = selectedDashboardOrgJobs.filter(j => j.company?.trim() === companyName).length;
                                const companyRecCount = selectedDashboardOrgRecruiters.filter(r => getCompanyName(r.company) === companyName).length;
                                return (
                                  <tr
                                    key={idx}
                                    onClick={() => {
                                      setShowCompanyModal({ companyName, recruitersCount: companyRecCount, jobsCount: companyJobsCount });
                                    }}
                                    className="hover:bg-blue-500/5 cursor-pointer transition-colors group"
                                  >
                                    <td className="p-3 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{companyName}</td>
                                    <td className="p-3 text-slate-300 font-mono">{companyJobsCount}</td>
                                    <td className="p-3 text-slate-300 font-mono">{companyRecCount}</td>
                                  </tr>
                                );
                              })}
                              {selectedDashboardOrgCompaniesCount === 0 && (
                                <tr>
                                  <td colSpan={3} className="p-6 text-center text-xs text-slate-500">
                                    No companies listed.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-900 rounded-2xl">
                  No organization selected. Please select a tenant to view metrics.
                </div>
              )}
            </div>

            {/* Acquisition Trends & Node updates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-slate-900 bg-slate-950 p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">Tenant Registrations Graph</h3>
                  <p className="text-[10px] text-slate-500">Visual trend representation of active organizations onboarded.</p>
                </div>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Jan', orgs: 1 },
                        { name: 'Feb', orgs: 2 },
                        { name: 'Mar', orgs: 2 },
                        { name: 'Apr', orgs: 3 },
                        { name: 'May', orgs: 4 },
                        { name: 'Jun', orgs: organizations.length },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#cbd5e1' : '#1f2937'} />
                      <XAxis dataKey="name" stroke={theme === 'light' ? '#475569' : '#6b7280'} fontSize={10} />
                      <YAxis stroke={theme === 'light' ? '#475569' : '#6b7280'} fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#ffffff' : '#111827', borderColor: theme === 'light' ? '#e2e8f0' : '#1f2937', color: theme === 'light' ? '#0f172a' : '#f3f4f6' }} />
                      <Area type="monotone" dataKey="orgs" name="Organizations" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrgs)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-900 bg-slate-950 p-6 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">Control Center Logs</h3>
                    <p className="text-[10px] text-slate-500">Live ledger of administrative updates.</p>
                  </div>
                  
                  <div className="space-y-3">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-900 flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-200 leading-tight">{log.action}</p>
                          <span className="text-[9px] font-semibold text-slate-500 block mt-1">
                            {new Date(log.created_at).toLocaleTimeString()} · By: {log.performed_by}
                          </span>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center text-xs text-slate-500 py-10">No activities logged.</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('logs')}
                  className="w-full h-9 bg-slate-900 hover:bg-slate-900/80 rounded-xl text-xs font-bold text-slate-300 transition-colors mt-4"
                >
                  Inspect Audit Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Search Bar */}
        {activeTab !== 'dashboard' && activeTab !== 'settings' && activeTab !== 'analytics' && activeTab !== 'users' && (
          <div className="relative animate-fade-in">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search organizations, codes, or audit logs...`}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-900 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* ─── ORGANIZATIONS TAB ──────────────────────────────────────── */}
        {activeTab === 'organizations' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="text-sm font-bold text-white font-heading">Registered Organizations</h3>
                <div className="flex bg-slate-900/50 p-1 border border-slate-900 rounded-xl gap-1">
                  {(['all', 'Active', 'Suspended', 'Pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrgStatusFilter(status)}
                      className={`h-7 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                        orgStatusFilter === status
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setOrgCreateError(''); setShowCreateOrgModal(true); }}
                className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/15"
              >
                <Plus className="w-4 h-4" /> Create Organization
              </button>
            </div>

            <div className="border border-slate-900 bg-slate-950 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                      <th className="p-4">Logo</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Primary Admin</th>
                      <th className="p-4">Students</th>
                      <th className="p-4">Recruiters</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs">
                    {orgStatusFilter === 'Pending' ? (
                      filteredPendingOrgs.map(req => (
                        <tr 
                          key={req.id} 
                          onClick={() => {
                            setSelectedRequest(req);
                            setRemarksInput(req.remarks || '');
                            setShowRequestDetail(true);
                          }}
                          className="hover:bg-slate-900/25 transition-colors cursor-pointer"
                        >
                          <td className="p-4">
                            {req.logo_url ? (
                              <img src={req.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-800" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm font-heading">
                                {req.organization_name[0]}
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-slate-200">
                            <div>
                              <span>{req.organization_name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{req.organization_type}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-400 font-bold">{req.generated_org_code}</td>
                          <td className="p-4">
                            <div>
                              <span className="text-slate-300 font-medium block">{req.admin_name}</span>
                              <span className="text-[10px] text-slate-500 block font-mono">{req.admin_email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-mono">N/A</td>
                          <td className="p-4 text-slate-500 font-mono">N/A</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10">
                              Pending
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{new Date(req.submitted_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRemarksInput(req.remarks || '');
                                  setShowRequestDetail(true);
                                }}
                                className="px-2.5 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-[10px] font-bold transition-colors text-white"
                              >
                                Review Request
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      activeOrgsList.map(org => {
                        const primaryAdmin = admins.find(a => a.organization_id === org.id);
                        const orgStudents = students.filter(s => s.organization_id === org.id);
                        const orgRecruiters = recruiters.filter(r => r.organization_id === org.id);
                        
                        return (
                          <tr 
                            key={org.id} 
                            onClick={() => {
                              setShowViewOrgModal(org);
                              setIsEditingOrgDetails(false);
                              setEditName(org.name);
                              setEditWebsite(org.website || '');
                              setEditAddress(org.address || '');
                              setEditLogoUrl(org.logo_url || '');
                              setEditAdminName(primaryAdmin?.name || '');
                              setEditAdminEmail(primaryAdmin?.email || '');
                              setOrgEditingError('');
                            }}
                            className="hover:bg-slate-900/25 transition-colors cursor-pointer"
                          >
                            <td className="p-4">
                              {org.logo_url ? (
                                <img src={org.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-800" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm font-heading">
                                  {org.name[0]}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-semibold text-slate-200">{org.name}</td>
                            <td className="p-4 font-mono text-slate-400 font-bold">{org.code}</td>
                            <td className="p-4">
                              {primaryAdmin ? (
                                <div>
                                  <span className="text-slate-300 font-medium block">{primaryAdmin.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-mono">{primaryAdmin.email}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500">No Admin linked</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-300 font-semibold font-mono">{orgStudents.length}</td>
                            <td className="p-4 text-slate-300 font-semibold font-mono">{orgRecruiters.length}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                org.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                'bg-red-500/10 text-red-400 border border-red-500/10'
                              }`}>
                                {org.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400">{new Date(org.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleToggleOrgStatus(org)}
                                  className={`px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-bold transition-colors ${
                                    org.status === 'Active' ? 'text-yellow-500 hover:bg-yellow-500/5' : 'text-emerald-400 hover:bg-emerald-500/5'
                                  }`}
                                >
                                  {org.status === 'Active' ? 'Suspend' : 'Activate'}
                                </button>
                                {primaryAdmin && (
                                  <button
                                    onClick={() => {
                                      setNewTempPassword(generateTempPassword());
                                      setCredsResetError('');
                                      setResetSuccessData(null);
                                      setShowResetCredsModal(primaryAdmin);
                                    }}
                                    className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold transition-colors text-purple-400 flex items-center gap-1"
                                    title="Reset Admin Credentials"
                                  >
                                    <Key className="w-3.5 h-3.5" /> Credentials
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {orgStatusFilter === 'Pending' && filteredPendingOrgs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                          No pending onboarding requests found.
                        </td>
                      </tr>
                    )}

                    {orgStatusFilter !== 'Pending' && activeOrgsList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                          No organizations registered matching search and filter options.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── PENDING ORGANIZATION REQUESTS TAB ───────────────────────── */}
        {activeTab === 'pending_orgs' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Onboarding Pipeline Control</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Manage, review, and provision enterprise tenant onboarding requests.</p>
              </div>
              <div className="flex gap-2">
                {/* Statistics overview */}
                <div className="flex gap-4 bg-slate-950 px-4 py-2 border border-slate-900 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Pending</span>
                    <strong className="text-xs font-bold text-yellow-500">{stats.requestsPending}</strong>
                  </div>
                  <div className="border-l border-slate-900" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Clarification</span>
                    <strong className="text-xs font-bold text-purple-500">{stats.requestsNeedMoreInfo}</strong>
                  </div>
                  <div className="border-l border-slate-900" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Approved</span>
                    <strong className="text-xs font-bold text-emerald-500">{stats.requestsApproved}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Table container */}
            <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold select-none">
                      <th className="p-4">Organization</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Primary Contact</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs">
                    {orgRequests.filter((r: any) => r.status !== 'Approved' && r.status !== 'Rejected').map((req: any) => (
                      <tr
                        key={req.id}
                        onClick={() => {
                          setSelectedRequest(req);
                          setRemarksInput(req.remarks || '');
                          setShowRequestDetail(true);
                        }}
                        className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            {req.logo_url ? (
                              <img src={req.logo_url} alt="Logo" className="w-6 h-6 rounded object-contain bg-slate-900 border border-slate-850" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                                {req.organization_name[0]}
                              </div>
                            )}
                            <span>{req.organization_name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-400">{req.generated_org_code}</td>
                        <td className="p-4">
                          <div>{req.primary_contact_name || req.admin_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{req.primary_contact_email || req.admin_email}</div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400">{req.organization_type}</td>
                        <td className="p-4 text-[11px] text-slate-400">{new Date(req.submitted_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                              : req.status === 'Rejected'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                                : req.status === 'Need More Information'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setRemarksInput(req.remarks || '');
                              setShowRequestDetail(true);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orgRequests.filter((r: any) => r.status !== 'Approved' && r.status !== 'Rejected').length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                          No active onboarding requests pending approval.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── EMAIL TRANSACTIONS LOGS TAB ─────────────────────────────── */}
        {activeTab === 'emails' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Transactional Mail Dispatcher</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Audit system notifications generated dynamically by the BaaS server node.</p>
            </div>

            <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold select-none">
                      <th className="p-4">Sent At</th>
                      <th className="p-4">Sender</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs font-mono">
                    {mockEmails.map((email: any) => (
                      <tr key={email.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 text-[10px] text-slate-400 whitespace-nowrap">{new Date(email.sent_at).toLocaleString()}</td>
                        <td className="p-4 text-slate-500">{email.sender}</td>
                        <td className="p-4 text-blue-400">{email.recipient}</td>
                        <td className="p-4 text-slate-200 font-sans font-bold">{email.subject}</td>
                        <td className="p-4 font-sans text-slate-400 whitespace-pre-wrap max-w-md break-words">{email.body}</td>
                      </tr>
                    ))}
                    {mockEmails.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 text-xs font-sans">
                          No transactional logs recorded in mock_emails mailer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── USER MANAGEMENT TAB ─────────────────────────────────────── */}
        {activeTab === 'users' && (() => {
          const orgAdmins     = admins.map((u: any) => ({ ...u, _type: 'admin',     _status: u.status || 'Active' }));
          const subAdminUsers = subAdmins.map((u: any) => ({ ...u, _type: 'subadmin', _status: u.status || 'Active' }));
          const studentUsers  = students.map((u: any) => ({ ...u, _type: 'student',  _status: u.account_status || 'Active' }));
          const recruiterUsers = recruiters.map((u: any) => ({ ...u, _type: 'recruiter', _status: u.status || 'Active' }));
          const allUsers = [...orgAdmins, ...subAdminUsers, ...studentUsers, ...recruiterUsers];

          const filtered = allUsers.filter(u => {
            const matchRole = umRoleFilter === 'all' || u._type === umRoleFilter;
            const matchOrg  = umOrgFilter === 'all' || u.organization_id === umOrgFilter;
            const q = umSearch.toLowerCase();
            const orgName = (organizations.find((o: any) => o.id === u.organization_id)?.name || '').toLowerCase();
            return matchRole && matchOrg && (!q || (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || orgName.includes(q));
          });

          type UType = 'admin'|'subadmin'|'student'|'recruiter';
          const TC: Record<UType, { label: string; color: string; bg: string; border: string }> = {
            admin:     { label: 'Org Admin',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
            subadmin:  { label: 'Sub Admin',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25' },
            student:   { label: 'Student',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
            recruiter: { label: 'Recruiter',  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25' },
          };

          const FILTERS: { key: 'all'|UType; label: string }[] = [
            { key: 'all',       label: `All (${allUsers.length})` },
            { key: 'admin',     label: `Org Admins (${orgAdmins.length})` },
            { key: 'subadmin',  label: `Sub Admins (${subAdminUsers.length})` },
            { key: 'student',   label: `Students (${studentUsers.length})` },
            { key: 'recruiter', label: `Recruiters (${recruiterUsers.length})` },
          ];

          return (
            <div className="space-y-6 animate-fade-in font-sans">
              {/* Search Bar (Spans full width like organizations) */}
              <div className="relative animate-fade-in">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={umSearch}
                  onChange={(e) => setUmSearch(e.target.value)}
                  placeholder="Search users by name, email, or organization..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-900 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {[
                  { title: 'Org Admins', value: orgAdmins.length, desc: 'Enterprise tenant owners', theme: TC.admin },
                  { title: 'Sub Admins', value: subAdminUsers.length, desc: 'Platform staff accounts', theme: TC.subadmin },
                  { title: 'Students', value: studentUsers.length, desc: 'Enrolled portal students', theme: TC.student },
                  { title: 'Recruiters', value: recruiterUsers.length, desc: 'Active employer accounts', theme: TC.recruiter }
                ].map((stat, idx) => (
                  <div key={idx} className="border border-slate-900 bg-slate-900/10 p-4 rounded-2xl">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{stat.title}</span>
                    <div className="text-2xl font-heading font-extrabold text-white mt-1.5">{stat.value}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{stat.desc}</span>
                  </div>
                ))}
              </div>

              {/* Title & Filter Pills */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h3 className="text-sm font-bold text-white font-heading">Registered Users</h3>
                  
                  {/* Role selection pills */}
                  <div className="flex bg-slate-900/50 p-1 border border-slate-900 rounded-xl gap-1 overflow-x-auto animate-fade-in">
                    {FILTERS.map(f => (
                      <button
                        key={f.key}
                        onClick={() => { setUmRoleFilter(f.key); setSelectedUmUser(null); }}
                        className={`h-7 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                          umRoleFilter === f.key
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f.key === 'all' ? 'All' : TC[f.key]?.label || f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Organization Selection Filter */}
                <div className="flex items-center gap-3">
                  <select
                    value={umOrgFilter}
                    onChange={e => { setUmOrgFilter(e.target.value); setSelectedUmUser(null); }}
                    className="h-9 px-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Organizations</option>
                    {organizations.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>

                  {(umSearch || umOrgFilter !== 'all' || umRoleFilter !== 'all') && (
                    <button
                      onClick={() => { setUmSearch(''); setUmOrgFilter('all'); setUmRoleFilter('all'); setSelectedUmUser(null); }}
                      className="text-xs text-blue-400 hover:underline font-bold"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-900 bg-slate-950 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                        <th className="p-4">Avatar</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-xs">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                            No users registered matching search and filter options.
                          </td>
                        </tr>
                      ) : (
                        filtered.map(u => {
                          const tc = TC[u._type as UType];
                          const orgName = organizations.find((o: any) => o.id === u.organization_id)?.name || 'Platform';

                          return (
                            <tr
                              key={`${u._type}-${u.id}`}
                              onClick={() => { setSelectedUmUser(u); setUmCredsSuccess(null); setUmCredsError(''); setUmNewPassword(''); }}
                              className="hover:bg-slate-900/25 transition-colors cursor-pointer"
                            >
                              <td className="p-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${tc.bg} ${tc.color}`}>
                                  {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-200">{u.name || '—'}</td>
                              <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${tc.bg} ${tc.color} ${tc.border}`}>
                                  {tc.label}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300 font-semibold">{orgName}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u._status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                                  {u._status}
                                </span>
                              </td>
                              <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 justify-end">
                                  {/* Toggle Status Action */}
                                  {u._status === 'Active' ? (
                                    <button
                                      onClick={() => { setSelectedUmUser(u); handleUmStatusChange('Suspended'); }}
                                      className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-bold transition-colors text-yellow-500 hover:bg-yellow-500/5 border border-slate-800"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => { setSelectedUmUser(u); handleUmStatusChange('Active'); }}
                                      className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-bold transition-colors text-emerald-400 hover:bg-emerald-500/5 border border-slate-800"
                                    >
                                      Activate
                                    </button>
                                  )}

                                  {/* Reset Password Modal Action */}
                                  <button
                                    onClick={() => { setSelectedUmUser(u); setUmCredsSuccess(null); setUmCredsError(''); setUmNewPassword(''); }}
                                    className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold transition-colors text-purple-400 flex items-center gap-1 border border-slate-800"
                                    title="Reset Password"
                                  >
                                    <Key className="w-3.5 h-3.5" /> Credentials
                                  </button>

                                  {/* Delete Action */}
                                  <button
                                    onClick={() => { setSelectedUmUser(u); handleUmStatusChange('__delete__'); }}
                                    className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold transition-colors text-red-400 flex items-center gap-1 border border-slate-800"
                                    title="Delete User"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── ORGANIZATION ANALYTICS TAB ─────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Tenant Metrics Node</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Inspect metrics scoped to a specific organization.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search bar */}
                <div className="relative font-sans">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tenant..."
                    value={analyticsOrgSearchTerm}
                    onChange={(e) => {
                      setAnalyticsOrgSearchTerm(e.target.value);
                      setActiveMetricDetail(null);
                    }}
                    className="h-9 pl-9 pr-3 rounded-xl border border-slate-900 bg-slate-900/30 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-44 md:w-56"
                  />
                </div>

                {/* Dropdown select */}
                <select
                  value={selectedAnalyticsOrgId}
                  onChange={(e) => {
                    setSelectedAnalyticsOrgId(e.target.value);
                    setActiveMetricDetail(null);
                  }}
                  className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  {organizations
                    .filter(o => 
                      o.name.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase()) ||
                      o.code.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase())
                    )
                    .map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  {organizations.filter(o => 
                    o.name.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase()) ||
                    o.code.toLowerCase().includes(analyticsOrgSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <option value="">No matching tenants</option>
                  )}
                </select>
              </div>
            </div>

            {selectedOrg ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Organization Variables overview */}
                  <div className="border border-slate-900 bg-slate-950 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedOrg.logo_url ? (
                        <img src={selectedOrg.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-slate-900 border border-slate-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-base font-heading">
                          {selectedOrg.name[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white">{selectedOrg.name}</h4>
                        <span className="text-[10px] text-slate-500 block font-mono">{selectedOrg.code}</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs border-t border-slate-900/60 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Instance Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          selectedOrg.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{selectedOrg.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Website:</span>
                        <a href={selectedOrg.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{selectedOrg.website || 'N/A'}</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Primary Admin:</span>
                        <span className="text-slate-300 font-medium">{selectedOrgAdmin ? selectedOrgAdmin.name : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Admin Email:</span>
                        <span className="text-slate-300 font-mono">{selectedOrgAdmin ? selectedOrgAdmin.email : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Organization Counts */}
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    {[
                      { key: 'subadmins', title: 'Subadmins Registered', value: selectedOrgSubAdmins.length, label: 'Staff accounts with portal access' },
                      { key: 'students', title: 'Students Enrolled', value: selectedOrgStudents.length, label: 'Profile cards inside tenant' },
                      { key: 'recruiters', title: 'Recruiters Linked', value: selectedOrgRecruiters.length, label: 'Active employer accounts' },
                      { key: 'companies', title: 'Companies Listed', value: selectedOrgCompaniesCount, label: 'Unique recruiting companies' }
                    ].map((metric, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveMetricDetail(activeMetricDetail === metric.key ? null : metric.key as any)}
                        className={`border p-5 rounded-2xl cursor-pointer transition-all ${
                          activeMetricDetail === metric.key 
                            ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5' 
                            : 'border-slate-900 bg-slate-950 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{metric.title}</span>
                        <div className="text-2xl font-heading font-extrabold text-white mt-2">{metric.value}</div>
                        <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{metric.label}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Metric Detail Table */}
                {activeMetricDetail && (
                  <div className="border border-slate-900 bg-slate-950 p-6 rounded-2xl animate-fade-in space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-900 gap-3 flex-wrap">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                          {activeMetricDetail === 'subadmins' && `Subadmins in ${selectedOrg.name}`}
                          {activeMetricDetail === 'students' && `Students Enrolled in ${selectedOrg.name}`}
                          {activeMetricDetail === 'recruiters' && `Recruiters Linked to ${selectedOrg.name}`}
                          {activeMetricDetail === 'companies' && `Companies Listed under ${selectedOrg.name}`}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {activeMetricDetail === 'subadmins' && 'List of staff members with portal administration access.'}
                          {activeMetricDetail === 'students' && 'List of students currently registered inside this tenant.'}
                          {activeMetricDetail === 'recruiters' && 'List of active recruiters linked to this tenant.'}
                          {activeMetricDetail === 'companies' && 'List of recruiting companies active inside this tenant.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {(activeMetricDetail === 'subadmins' || activeMetricDetail === 'students') && (
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                              type="text"
                              value={detailSearchTerm}
                              onChange={e => setDetailSearchTerm(e.target.value)}
                              placeholder="Search..."
                              className="h-8 pl-8 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-44"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => { setActiveMetricDetail(null); setDetailSearchTerm(''); }}
                          className="h-8 px-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition-all"
                        >
                          Close Details
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {activeMetricDetail === 'subadmins' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Staff Member</th>
                              <th className="p-3">Designation</th>
                              <th className="p-3">Department</th>
                              <th className="p-3">Role</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {selectedOrgSubAdmins
                              .filter((sa: any) => !detailSearchTerm || sa.name?.toLowerCase().includes(detailSearchTerm.toLowerCase()) || sa.email?.toLowerCase().includes(detailSearchTerm.toLowerCase()))
                              .map((sa: any) => (
                              <tr key={sa.id} onClick={() => { setShowSubadminModal(sa); setSubadminCredsSuccess(null); setSubadminCredsError(''); setSubadminNewPassword(''); }} className="hover:bg-blue-500/5 cursor-pointer transition-colors group">
                                <td className="p-3">
                                  <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{sa.name}</div>
                                  <div className="text-[10px] font-mono text-slate-500">{sa.email}</div>
                                </td>
                                <td className="p-3 text-slate-300">{sa.designation || 'N/A'}</td>
                                <td className="p-3 text-slate-300">{sa.department || 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${formatRole(sa.role).bg} ${formatRole(sa.role).color} ${formatRole(sa.role).border}`}>{formatRole(sa.role).label}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${(sa.status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{sa.status || 'Active'}</span>
                                </td>
                              </tr>
                            ))}
                            {selectedOrgSubAdmins.length === 0 && (
                              <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-500">No subadmins registered for this organization.</td></tr>
                            )}
                          </tbody>
                        </table>
                      )}

                      {activeMetricDetail === 'students' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Student</th>
                              <th className="p-3">Branch</th>
                              <th className="p-3">Grad Year</th>
                              <th className="p-3">CGPA</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {selectedOrgStudents
                              .filter((s: any) => !detailSearchTerm || s.name?.toLowerCase().includes(detailSearchTerm.toLowerCase()) || s.email?.toLowerCase().includes(detailSearchTerm.toLowerCase()))
                              .map((s: any) => (
                              <tr key={s.id} onClick={() => { setShowStudentModal(s); setStudentCredsSuccess(null); setStudentCredsError(''); setStudentNewPassword(''); }} className="hover:bg-blue-500/5 cursor-pointer transition-colors group">
                                <td className="p-3">
                                  <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name || 'N/A'}</div>
                                  <div className="text-[10px] font-mono text-slate-500">{s.email || ''}</div>
                                </td>
                                <td className="p-3 text-slate-300">{s.branch || 'N/A'}</td>
                                <td className="p-3 text-slate-300 font-mono">{s.graduation_year || 'N/A'}</td>
                                <td className="p-3 text-emerald-400 font-bold font-mono">{s.cgpa || '0.0'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ (s.account_status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }`}>{s.account_status || 'Active'}</span>
                                </td>
                              </tr>
                            ))}
                            {selectedOrgStudents.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                                  No students enrolled in this organization.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}

                      {activeMetricDetail === 'recruiters' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Name</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Company</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {selectedOrgRecruiters.map((r: any) => (
                              <tr
                                key={r.id}
                                onClick={() => {
                                  setSelectedUmUser({ ...r, _type: 'recruiter', _status: r.status || 'Active' });
                                  setUmCredsSuccess(null);
                                  setUmCredsError('');
                                  setUmNewPassword('');
                                }}
                                className="hover:bg-blue-500/5 cursor-pointer transition-colors group"
                              >
                                <td className="p-3 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{r.name || 'N/A'}</td>
                                <td className="p-3 font-mono text-slate-400">{r.email || 'N/A'}</td>
                                <td className="p-3 text-slate-300 font-bold">{getCompanyName(r.company) || 'N/A'}</td>
                              </tr>
                            ))}
                            {selectedOrgRecruiters.length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-xs text-slate-500">
                                  No recruiters linked to this organization.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}

                      {activeMetricDetail === 'companies' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Company Name</th>
                              <th className="p-3">Linked Recruiters</th>
                              <th className="p-3">Jobs Posted</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {Array.from(new Set([
                              ...selectedOrgJobs.map((j: any) => j.company?.trim()),
                              ...selectedOrgRecruiters.map((r: any) => getCompanyName(r.company))
                            ].filter(Boolean))).map((companyName: string, idx: number) => {
                              const recruitersCount = selectedOrgRecruiters.filter((r: any) => getCompanyName(r.company) === companyName).length;
                              const jobsCount = selectedOrgJobs.filter((j: any) => j.company?.trim() === companyName).length;
                              return (
                                <tr
                                  key={idx}
                                  onClick={() => {
                                    setShowCompanyModal({ companyName, recruitersCount, jobsCount });
                                  }}
                                  className="hover:bg-blue-500/5 cursor-pointer transition-colors group"
                                >
                                  <td className="p-3 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{companyName}</td>
                                  <td className="p-3 text-slate-300 font-mono">{recruitersCount} recruiters</td>
                                  <td className="p-3 text-blue-400 font-mono font-bold">{jobsCount} postings</td>
                                </tr>
                              );
                            })}
                            {Array.from(new Set([
                              ...selectedOrgJobs.map((j: any) => j.company?.trim()),
                              ...selectedOrgRecruiters.map((r: any) => getCompanyName(r.company))
                            ].filter(Boolean))).length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-xs text-slate-500">
                                  No companies listed for this organization.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-slate-900 p-8 rounded-2xl text-center text-xs text-slate-500">
                Please select an organization to view analytics.
              </div>
            )}
          </div>
        )}

        {/* ─── AUDIT LEDGER TAB ───────────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-white font-heading">Platform System Ledger</h3>
                
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="h-8 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 focus:outline-none"
                >
                  <option value="all">All Logs</option>
                  <option value="tenant">Tenant Changes</option>
                  <option value="credentials">Credentials</option>
                  <option value="toggled">Suspension Toggles</option>
                </select>
              </div>

              <button
                onClick={handleExportLogs}
                className="h-9 px-4 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all animate-fade-in"
              >
                Export Ledger (CSV)
              </button>
            </div>

            <div className="border border-slate-900 bg-slate-950 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Performer</th>
                      <th className="p-4">Target Node</th>
                      <th className="p-4">System Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs font-mono">
                    {filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/25 transition-colors">
                        <td className="p-4 text-slate-500 text-[10px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold text-slate-200">{log.action}</td>
                        <td className="p-4 text-blue-400 font-sans font-semibold">{log.performed_by}</td>
                        <td className="p-4 text-slate-400 text-[11px]">{log.affected_user}</td>
                        <td className="p-4 text-slate-500 font-sans text-[9px] truncate max-w-xs" title={log.device_info}>
                          {log.device_info}
                        </td>
                      </tr>
                    ))}

                    {filteredAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500 font-sans">
                          No audit entries found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── SYSTEM CONFIGS TAB ─────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <h3 className="text-sm font-bold text-white font-heading">Global Platform Configurations</h3>

            <div className="border border-slate-900 bg-slate-950 p-6 rounded-2xl space-y-6">
              
              {/* Brand settings */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400">Branding Variables</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Portal Brand Name</label>
                    <input
                      type="text"
                      defaultValue={settings.platform_name || 'Placify'}
                      onBlur={(e) => handleSaveSettings('platform_name', e.target.value)}
                      className="w-full h-10 px-3 border border-slate-900 bg-slate-900/30 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Portal Logo Source</label>
                    <input
                      type="text"
                      defaultValue={settings.platform_logo || '/logo.png'}
                      onBlur={(e) => handleSaveSettings('platform_logo', e.target.value)}
                      className="w-full h-10 px-3 border border-slate-900 bg-slate-900/30 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance mode toggle */}
              <div className="space-y-4 border-t border-slate-900 pt-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400">Service Maintenance</h4>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-900 bg-slate-900/10">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Deploy Maintenance Mode</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Locks all Student, Recruiter, and Admin portal accesses.</p>
                  </div>
                  <button
                    onClick={() => handleSaveSettings('maintenance_mode', !settings.maintenance_mode)}
                    className={`h-8 px-4 rounded-lg text-xs font-bold transition-all ${
                      settings.maintenance_mode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {settings.maintenance_mode ? 'ON (Lockout)' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* smtp credentials */}
              <div className="space-y-4 border-t border-slate-900 pt-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400">SMTP Notification Servers</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Outgoing Mail Sender</label>
                    <input
                      type="text"
                      defaultValue={settings.email_config?.sender || 'notifications@placify.in'}
                      className="w-full h-10 px-3 border border-slate-900 bg-slate-900/30 rounded-xl text-xs text-slate-200 focus:outline-none"
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Host Endpoint</label>
                    <input
                      type="text"
                      defaultValue={settings.email_config?.smtp_server || 'smtp.gmail.com'}
                      className="w-full h-10 px-3 border border-slate-900 bg-slate-900/30 rounded-xl text-xs text-slate-200 focus:outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── ONBOARDING REQUEST DETAIL DRAWER ───────────────────────────── */}
      {showRequestDetail && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in font-sans">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-900 h-full flex flex-col shadow-2xl relative animate-slide-in text-slate-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
              <div className="flex items-center gap-3">
                {selectedRequest.logo_url ? (
                  <img src={selectedRequest.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-950 border border-slate-880" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-sm font-heading">
                    {selectedRequest.organization_name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">{selectedRequest.organization_name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Code: {selectedRequest.generated_org_code}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRequestDetail(false);
                  setSelectedRequest(null);
                }}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors border border-slate-850 hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Alert Badge Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl">
                <span className="text-xs font-bold text-slate-400">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedRequest.status === 'Approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                    : selectedRequest.status === 'Rejected'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                      : selectedRequest.status === 'Need More Information'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>

              {/* Section 1: Org Information */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-1">
                  <Building className="w-3.5 h-3.5" /> Organization Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>Type: <strong className="text-slate-200">{selectedRequest.organization_type}</strong></div>
                  <div>Website: {selectedRequest.website ? <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{selectedRequest.website}</a> : <strong className="text-slate-500">N/A</strong>}</div>
                  <div>Official Email: <strong className="text-slate-200 font-mono">{selectedRequest.organization_email}</strong></div>
                  <div>Reg. Number: <strong className="text-slate-200">{selectedRequest.registration_number}</strong></div>
                  <div>Phone: <strong className="text-slate-200">{selectedRequest.contact_phone || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Section 2: Contact & Admin Account */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-1">
                  <User className="w-3.5 h-3.5" /> Primary Contact & Admin Account
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>Name: <strong className="text-slate-200">{selectedRequest.primary_contact_name || selectedRequest.admin_name}</strong></div>
                  <div>Designation: <strong className="text-slate-200">{selectedRequest.primary_contact_designation || 'N/A'}</strong></div>
                  <div>Official Email: <strong className="text-slate-200 font-mono">{selectedRequest.primary_contact_email || selectedRequest.admin_email}</strong></div>
                  <div>Phone: <strong className="text-slate-200">{selectedRequest.primary_contact_phone || selectedRequest.admin_phone || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Section 3: Documents */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-1">
                  <FileText className="w-3.5 h-3.5" /> Verification Documents
                </h4>
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { label: 'Registration Certificate', url: selectedRequest.registration_certificate },
                    { label: 'GST Registration Certificate', url: selectedRequest.gst_certificate }
                  ].map((doc, idx) => (
                    <div key={idx} className="p-3 border border-slate-900 rounded-xl bg-slate-950 flex flex-col gap-1.5 justify-between border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{doc.label}</span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1"
                        >
                          View Document <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-semibold italic">N/A</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks Textarea (Rejection / Need More Info Reason) */}
              {selectedRequest.status !== 'Approved' && (
                <div className="space-y-2 border-t border-slate-900 pt-5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
                    Platform Owner Remarks / Feedback *
                  </label>
                  <textarea
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    placeholder="Enter rejection details or specify clarification required for Need More Information action..."
                    className="w-full p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs h-20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                  />
                  {selectedRequest.remarks && (
                    <p className="text-[10px] text-purple-400 italic">Previous Remarks: "{selectedRequest.remarks}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            {selectedRequest.status !== 'Approved' && (
              <div className="p-6 border-t border-slate-900 bg-slate-900/10 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubscriptionRequest(selectedRequest);
                    setSubType('Trial');
                    setSubMonths(1);
                    setSubConfirmVerified(false);
                    setShowSubscriptionModal(true);
                  }}
                  disabled={actionLoading}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve & Provision
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRequestMoreInfo(selectedRequest)}
                  disabled={actionLoading}
                  className="h-10 px-4 border border-slate-800 hover:bg-purple-950/20 text-purple-400 rounded-xl text-xs font-bold transition-all"
                >
                  Need Info
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectRequest(selectedRequest)}
                  disabled={actionLoading}
                  className="h-10 px-4 border border-slate-800 hover:bg-red-950/20 text-red-400 rounded-xl text-xs font-bold transition-all"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CREATE ORGANIZATION MODAL ─────────────────────────────────── */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowCreateOrgModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-white font-heading">Register New Tenant Organization</h3>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Organization Name *</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Manipal University Jaipur"
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Unique Org Code *</label>
                  <input
                    type="text"
                    value={orgCode}
                    onChange={e => setOrgCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    placeholder="e.g. MUJ"
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Website URL</label>
                  <input
                    type="url"
                    value={orgWebsite}
                    onChange={e => setOrgWebsite(e.target.value)}
                    placeholder="https://jaipur.manipal.edu"
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Location Address</label>
                  <input
                    type="text"
                    value={orgAddress}
                    onChange={e => setOrgAddress(e.target.value)}
                    placeholder="Jaipur, Rajasthan, India"
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Logo Image URL</label>
                <input
                  type="text"
                  value={orgLogoUrl}
                  onChange={e => setOrgLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-900/80 pt-4">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">Primary Admin Account Credentials</h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Admin Name *</label>
                    <input
                      type="text"
                      value={orgAdminName}
                      onChange={e => setOrgAdminName(e.target.value)}
                      placeholder="e.g. Dean / Placement Cell Head"
                      className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Admin Email Address *</label>
                      <input
                        type="email"
                        value={orgAdminEmail}
                        onChange={e => setOrgAdminEmail(e.target.value)}
                        placeholder="tpo@jaipur.manipal.edu"
                        className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400">Temporary Password *</label>
                        <button
                          type="button"
                          onClick={() => setOrgAdminPassword(generateTempPassword())}
                          className="text-[9px] font-bold text-blue-400 hover:underline"
                        >
                          Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        value={orgAdminPassword}
                        onChange={e => setOrgAdminPassword(e.target.value)}
                        placeholder="Type or click Generate"
                        className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {orgCreateError && (
                <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400">
                  ⚠️ {orgCreateError}
                </div>
              )}

              <button
                type="submit"
                disabled={orgCreating}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {orgCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Organization...
                  </>
                ) : (
                  'Create Organization & Admin'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT ORGANIZATION MODAL ───────────────────────────────────── */}


      {/* ─── SUBADMIN MANAGEMENT MODAL ───────────────────────────────────── */}
      {showSubadminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-950 rounded-2xl relative animate-scale-in shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {(showSubadminModal.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading leading-tight">{showSubadminModal.name || 'Unknown Staff'}</h3>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{showSubadminModal.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${(showSubadminModal.status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {showSubadminModal.status || 'Active'}
                </span>
                <button onClick={() => { setShowSubadminModal(null); setSubadminCredsSuccess(null); setSubadminCredsError(''); setSubadminNewPassword(''); }} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-3 gap-0 border-b border-slate-900 text-center">
              <div className="py-3 px-2 border-r border-slate-900">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Designation</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{showSubadminModal.designation || 'N/A'}</p>
              </div>
              <div className="py-3 px-2 border-r border-slate-900">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Department</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{showSubadminModal.department || 'N/A'}</p>
              </div>
                <div className="py-3 px-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Role</p>
                  <span className={`inline-flex items-center mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${formatRole(showSubadminModal.role).bg} ${formatRole(showSubadminModal.role).color} ${formatRole(showSubadminModal.role).border}`}>
                    {formatRole(showSubadminModal.role).label}
                  </span>
                </div>
            </div>

            <div className="p-6 space-y-5">
              {/* ── Credentials ─────────────────────── */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-purple-500/5 border-b border-slate-800">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Reset Password</span>
                </div>
                <div className="p-4">
                  {subadminCredsSuccess ? (
                    <div className="space-y-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-[11px] text-slate-400">Password updated. Copy the credentials below.</p>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs font-mono text-left">
                        <div>Email: <span className="text-white select-all">{subadminCredsSuccess.email}</span></div>
                        <div>Password: <span className="text-white select-all">{subadminCredsSuccess.pass}</span></div>
                      </div>
                      <button onClick={() => setSubadminCredsSuccess(null)} className="text-[11px] text-purple-400 hover:underline">Reset another</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubadminResetPassword} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subadminNewPassword}
                          onChange={e => setSubadminNewPassword(e.target.value)}
                          placeholder="New password..."
                          className="flex-1 h-9 px-3 border border-slate-800 bg-slate-900/50 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                        <button type="button" onClick={() => setSubadminNewPassword(generateTempPassword())} className="px-3 h-9 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-purple-400 transition-colors whitespace-nowrap">
                          Generate
                        </button>
                      </div>
                      {subadminCredsError && <p className="text-[10px] text-red-400">⚠️ {subadminCredsError}</p>}
                      <button type="submit" disabled={subadminCredsResetting} className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2">
                        {subadminCredsResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        {subadminCredsResetting ? 'Updating...' : 'Set Password'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ── Account Control ─────────────────── */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border-b border-slate-800">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-white">Account Control</span>
                </div>
                <div className="p-4 space-y-2">
                  {(showSubadminModal.status || 'Active') === 'Active' ? (
                    <button
                      onClick={() => handleSubadminStatusChange('Suspended')}
                      disabled={subadminStatusUpdating}
                      className="w-full h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {subadminStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubadminStatusChange('Active')}
                      disabled={subadminStatusUpdating}
                      className="w-full h-9 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {subadminStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Activate Account
                    </button>
                  )}
                  <button
                    onClick={() => handleSubadminStatusChange('__delete__')}
                    disabled={subadminStatusUpdating}
                    className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {subadminStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Delete Account Permanently
                  </button>
                  <p className="text-[9px] text-slate-600 text-center pt-1">Suspended staff members cannot log in. Deletion is irreversible.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STUDENT MANAGEMENT MODAL ────────────────────────────────────── */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-950 rounded-2xl relative animate-scale-in shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                  {(showStudentModal.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading leading-tight">{showStudentModal.name || 'Unknown Student'}</h3>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{showStudentModal.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${(showStudentModal.account_status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {showStudentModal.account_status || 'Active'}
                </span>
                <button onClick={() => { setShowStudentModal(null); setStudentCredsSuccess(null); setStudentCredsError(''); setStudentNewPassword(''); }} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-3 gap-0 border-b border-slate-900 text-center">
              <div className="py-3 px-2 border-r border-slate-900">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Branch</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{showStudentModal.branch || 'N/A'}</p>
              </div>
              <div className="py-3 px-2 border-r border-slate-900">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Grad Year</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{showStudentModal.graduation_year || 'N/A'}</p>
              </div>
              <div className="py-3 px-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">CGPA</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{showStudentModal.cgpa || '0.0'}</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* ── Column 1: Credentials ─────────────────────── */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-purple-500/5 border-b border-slate-800">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Reset Password</span>
                </div>
                <div className="p-4">
                  {studentCredsSuccess ? (
                    <div className="space-y-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-[11px] text-slate-400">Password updated. Copy the credentials below.</p>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs font-mono text-left">
                        <div>Email: <span className="text-white select-all">{studentCredsSuccess.email}</span></div>
                        <div>Password: <span className="text-white select-all">{studentCredsSuccess.pass}</span></div>
                      </div>
                      <button onClick={() => setStudentCredsSuccess(null)} className="text-[11px] text-purple-400 hover:underline">Reset another</button>
                    </div>
                  ) : (
                    <form onSubmit={handleStudentResetPassword} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={studentNewPassword}
                          onChange={e => setStudentNewPassword(e.target.value)}
                          placeholder="New password..."
                          className="flex-1 h-9 px-3 border border-slate-800 bg-slate-900/50 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                        <button type="button" onClick={() => setStudentNewPassword(generateTempPassword())} className="px-3 h-9 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-purple-400 transition-colors whitespace-nowrap">
                          Generate
                        </button>
                      </div>
                      {studentCredsError && <p className="text-[10px] text-red-400">⚠️ {studentCredsError}</p>}
                      <button type="submit" disabled={studentCredsResetting} className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2">
                        {studentCredsResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        {studentCredsResetting ? 'Updating...' : 'Set Password'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ── Column 2: Account Control ─────────────────── */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border-b border-slate-800">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-white">Account Control</span>
                </div>
                <div className="p-4 space-y-2">
                  {(showStudentModal.account_status || 'Active') === 'Active' ? (
                    <button
                      onClick={() => handleStudentStatusChange('Suspended')}
                      disabled={studentStatusUpdating}
                      className="w-full h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {studentStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStudentStatusChange('Active')}
                      disabled={studentStatusUpdating}
                      className="w-full h-9 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {studentStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Activate Account
                    </button>
                  )}
                  <button
                    onClick={() => handleStudentStatusChange('__delete__')}
                    disabled={studentStatusUpdating}
                    className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {studentStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Delete Account Permanently
                  </button>
                  <p className="text-[9px] text-slate-600 text-center pt-1">Suspended students cannot log in. Deletion is irreversible.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET ADMIN CREDENTIALS MODAL ──────────────────────────────── */}
      {showResetCredsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl">
            <button
              onClick={() => { setShowResetCredsModal(null); setResetSuccessData(null); }}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-bold text-white font-heading">Reset Admin Credentials</h3>
            </div>

            {resetSuccessData ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Password Updated Successfully!</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Please copy the new temporary login credentials.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs font-mono text-left">
                  <div>Email: <span className="text-white select-all">{resetSuccessData.email}</span></div>
                  <div>Password: <span className="text-white select-all">{resetSuccessData.pass}</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowResetCredsModal(null); setResetSuccessData(null); }}
                  className="w-full h-10 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-white transition-colors"
                >
                  Close Panel
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetCredentials} className="space-y-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 leading-normal">
                  You are resetting the password for the primary admin account: <br />
                  <strong className="text-white font-mono">{showResetCredsModal.name} ({showResetCredsModal.email})</strong>.
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400">Temporary Password *</label>
                    <button
                      type="button"
                      onClick={() => setNewTempPassword(generateTempPassword())}
                      className="text-[9px] font-bold text-purple-400 hover:underline"
                    >
                      Generate New
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newTempPassword}
                    onChange={e => setNewTempPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                {credsResetError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400">
                    ⚠️ {credsResetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={credsResetting}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  {credsResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Password Reset'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW ORGANIZATION DETAILS MODAL ───────────────────────────── */}
      {showViewOrgModal && (() => {
        const subType = showViewOrgModal.subscription_type || 'Trial';
        const subStatus = showViewOrgModal.subscription_status || 'Active';
        const subStart = showViewOrgModal.subscription_start_date;
        const subEnd = showViewOrgModal.subscription_end_date;
        const daysRemaining = subEnd ? Math.ceil((new Date(subEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

        const startDateStr = subStart ? new Date(subStart).toLocaleDateString() : 'N/A';
        const endDateStr = subType === 'Lifetime' ? 'No Expiry' : (subEnd ? new Date(subEnd).toLocaleDateString() : 'N/A');
        const remainingStr = subType === 'Lifetime' ? 'Unlimited' : (daysRemaining !== null ? (daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days`) : 'N/A');

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-slate-300">
            <div className="w-full max-w-lg border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl space-y-4">
              <button
                onClick={() => {
                  setShowViewOrgModal(null);
                  setEditingOrgSubId(null);
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-white font-heading">Organization File Summary</h3>
              </div>

              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {isEditingOrgDetails ? (
                  /* Edit Details Form */
                  <div className="space-y-4 pt-1 animate-fade-in text-xs font-sans">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Organization Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          placeholder="e.g. Sharda University"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Website URL</label>
                          <input
                            type="text"
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                            className="w-full h-9 px-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            placeholder="e.g. https://sharda.ac.in"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Logo URL</label>
                          <input
                            type="text"
                            value={editLogoUrl}
                            onChange={(e) => setEditLogoUrl(e.target.value)}
                            className="w-full h-9 px-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            placeholder="Logo Image Link"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Address</label>
                        <textarea
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          rows={2}
                          className="w-full p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs resize-none"
                          placeholder="Organization physical address"
                        />
                      </div>

                      <div className="border-t border-slate-900/60 my-2 pt-3 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Primary Admin Details</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Admin Name</label>
                            <input
                              type="text"
                              value={editAdminName}
                              onChange={(e) => setEditAdminName(e.target.value)}
                              className="w-full h-9 px-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Admin Email</label>
                            <input
                              type="text"
                              value={editAdminEmail}
                              onChange={(e) => setEditAdminEmail(e.target.value)}
                              className="w-full h-9 px-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {orgEditingError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400">
                        ⚠️ {orgEditingError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingOrgDetails(false)}
                        className="flex-1 h-9 border border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={orgEditing}
                        onClick={() => handleEditOrganization(showViewOrgModal.id)}
                        className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        {orgEditing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Save Details
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Static View & Control panel */
                  <div className="space-y-4">
                    {/* Logo & Basic Info */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl">
                      <div className="flex items-center gap-3">
                        {showViewOrgModal.logo_url ? (
                          <img src={showViewOrgModal.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-slate-950 border border-slate-800" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-base font-heading">
                            {showViewOrgModal.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-white">{showViewOrgModal.name}</h4>
                          <span className="text-[10px] text-slate-500 block font-mono">Code: {showViewOrgModal.code}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingOrgDetails(true)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-[10px] font-bold text-blue-450 hover:text-white transition-colors"
                      >
                        Edit Details
                      </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 border border-slate-900 rounded-xl bg-slate-900/10 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Instance Status</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          showViewOrgModal.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>{showViewOrgModal.status}</span>
                      </div>

                      <div className="p-3 border border-slate-900 rounded-xl bg-slate-900/10 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Enrolled Students</span>
                        <span className="text-white font-bold">{students.filter(s => s.organization_id === showViewOrgModal.id).length}</span>
                      </div>

                      <div className="p-3 border border-slate-900 rounded-xl bg-slate-900/10 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Website</span>
                        {showViewOrgModal.website ? (
                          <a href={showViewOrgModal.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">{showViewOrgModal.website}</a>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </div>

                      <div className="p-3 border border-slate-900 rounded-xl bg-slate-900/10 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Address</span>
                        <span className="text-slate-300 truncate block">{showViewOrgModal.address || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Primary Admin account */}
                    <div className="p-4 border border-slate-900 rounded-xl bg-slate-900/10 space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Primary Admin Account</span>
                      {admins.find(a => a.organization_id === showViewOrgModal.id) ? (
                        <div className="space-y-1 text-xs">
                          <div>Name: <span className="text-slate-200 font-medium">{admins.find(a => a.organization_id === showViewOrgModal.id).name}</span></div>
                          <div>Email: <span className="text-slate-200 font-mono">{admins.find(a => a.organization_id === showViewOrgModal.id).email}</span></div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">No primary administrator linked to this tenant organization.</span>
                      )}
                    </div>

                    {/* Subscription Details Node */}
                    <div className="p-4 border border-slate-900 rounded-xl bg-slate-900/10 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Subscription Details</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          subStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          subStatus === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/25 shadow-lg shadow-red-500/5' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}>
                          {subStatus}
                        </span>
                      </div>

                      {editingOrgSubId === showViewOrgModal.id ? (
                        /* Plan Editing Form */
                        <div className="space-y-4 pt-1 animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wide block">Plan Type</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['Trial', 'Monthly', 'Lifetime'].map((plan) => (
                                <button
                                  key={plan}
                                  type="button"
                                  onClick={() => setEditSubType(plan as any)}
                                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                                    editSubType === plan
                                      ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                      : 'border-slate-800 bg-slate-950 text-slate-400'
                                  }`}
                                >
                                  {plan}
                                </button>
                              ))}
                            </div>
                          </div>

                          {editSubType === 'Monthly' && (
                            <div className="space-y-2">
                              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wide block">Duration (Months)</label>
                              <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 6, 12].map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setEditSubMonths(m)}
                                    className={`py-1 px-2 rounded-md text-xs font-bold border transition-all text-center ${
                                      editSubMonths === m
                                        ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                        : 'border-slate-800 bg-slate-950 text-slate-400'
                                    }`}
                                  >
                                    {m} Mo
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingOrgSubId(null)}
                              className="flex-1 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-[10px] font-bold transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={subscriptionEditLoading}
                              onClick={async () => {
                                await handleUpdateOrgSubscription(showViewOrgModal.id, editSubType, editSubMonths);
                                setEditingOrgSubId(null);
                              }}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                            >
                              {subscriptionEditLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                              Save Plan
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Plan Info Details */
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2 text-slate-300">
                            <div>Plan Type: <strong className="text-white">{subType}</strong></div>
                            <div>Days Left: <strong className="text-blue-450 font-mono">{remainingStr}</strong></div>
                            <div>Start Date: <span className="text-slate-400 font-mono">{startDateStr}</span></div>
                            <div>Expiry Date: <span className="text-slate-400 font-mono">{endDateStr}</span></div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrgSubId(showViewOrgModal.id);
                                setEditSubType(subType as any);
                                setEditSubMonths(1);
                              }}
                              className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                            >
                              Change Plan / Extend Subscription
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instance Toggle Action (Suspend / Reactivate) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to ${showViewOrgModal.status === 'Active' ? 'SUSPEND' : 'REACTIVATE'} organization '${showViewOrgModal.name}'?`)) {
                            await handleToggleOrgStatus(showViewOrgModal);
                            // Refresh the view modal state from DB immediately
                            const { data: updatedOrg } = await insforge.database
                              .from('organizations')
                              .select('*')
                              .eq('id', showViewOrgModal.id)
                              .maybeSingle();
                            if (updatedOrg) {
                              setShowViewOrgModal(updatedOrg);
                            }
                          }
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          showViewOrgModal.status === 'Active'
                            ? 'border-yellow-600/30 hover:bg-yellow-600/10 text-yellow-500'
                            : 'border-emerald-600/30 hover:bg-emerald-600/10 text-emerald-500'
                        }`}
                      >
                        {showViewOrgModal.status === 'Active' ? 'Suspend Organization Tenant' : 'Reactivate Organization Tenant'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── SUBSCRIPTION SETUP MODAL ────────────────────────────────────── */}
      {showSubscriptionModal && subscriptionRequest && (() => {
        const computeExpiryDate = () => {
          const d = new Date();
          if (subType === 'Trial') {
            d.setDate(d.getDate() + 15);
            return d.toLocaleDateString();
          }
          if (subType === 'Monthly') {
            d.setMonth(d.getMonth() + subMonths);
            return d.toLocaleDateString();
          }
          if (subType === 'Testing') {
            d.setMinutes(d.getMinutes() + 5);
            return d.toLocaleTimeString() + ' (5 Minutes)';
          }
          return 'No Expiry (Lifetime)';
        };

        return (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in text-slate-300">
            <div className="w-full max-w-md border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl space-y-5">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSubscriptionRequest(null);
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-white font-heading">Activate Organization Subscription</h3>
              </div>

              {/* Organization Info (Read Only) */}
              <div className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Organization Summary</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="truncate">Name: <strong className="text-white block truncate">{subscriptionRequest.organization_name}</strong></div>
                  <div>Code: <strong className="text-white font-mono block">{subscriptionRequest.generated_org_code}</strong></div>
                  <div className="col-span-2 truncate">Admin Email: <span className="text-slate-400 font-mono block truncate">{subscriptionRequest.admin_email}</span></div>
                </div>
              </div>

              {/* Plan Selection Cards */}
              <div className="space-y-2 font-sans">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wide block">Select Subscription Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'Trial', label: 'Trial', desc: '15 Days access' },
                    { type: 'Monthly', label: 'Monthly', desc: 'Recurring terms' },
                    { type: 'Lifetime', label: 'Lifetime', desc: 'No expiry date' }
                  ].map((plan) => (
                    <button
                      key={plan.type}
                      type="button"
                      onClick={() => setSubType(plan.type as any)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                        subType === plan.type
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/5'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black">{plan.label}</span>
                      <span className={`text-[9px] font-medium leading-tight ${subType === plan.type ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-500'}`}>{plan.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Duration Selection */}
              {subType === 'Monthly' && (
                <div className="space-y-2 animate-fade-in font-sans">
                  <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wide block">Subscription Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSubMonths(m)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                          subMonths === m
                            ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {m} {m === 1 ? 'Mo' : 'Mos'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Block */}
              <div className="p-3.5 bg-slate-900/10 border border-slate-900 rounded-xl space-y-2 text-xs font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Subscription Summary</span>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Plan Type:</span>
                    <strong className="text-white">{subType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-mono">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiry Date:</span>
                    <span className="font-mono text-blue-450 font-bold">{computeExpiryDate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Suspend on Expiry:</span>
                    <span>{subType === 'Lifetime' ? 'Disabled' : 'Enabled'}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer p-1 font-sans">
                <input
                  type="checkbox"
                  checked={subConfirmVerified}
                  onChange={(e) => setSubConfirmVerified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] text-slate-400 font-medium leading-normal select-none">
                  I have verified this organization and want to activate this subscription.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSubscriptionRequest(null);
                  }}
                  className="flex-1 h-9 border border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!subConfirmVerified || subscriptionActionLoading}
                  onClick={() => handleApprovePendingRequest(subscriptionRequest, { type: subType, months: subMonths })}
                  className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {subscriptionActionLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve & Activate
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── ONBOARDING APPROVAL SUCCESS OVERLAY ───────────────────────── */}
      {showApprovalSuccess && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in text-slate-300">
          <div className="w-full max-w-sm border border-slate-900 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
              <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-black text-white font-heading">Onboarding Request Approved!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The onboarding request for <strong className="text-white block mt-1">{approvedOrgName}</strong> has been successfully approved and set up.
              </p>
              <div className="text-[10px] text-slate-500 font-medium">
                The organization has been provisioned and its administrator account registered.
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowApprovalSuccess(false);
                setApprovedOrgName('');
                setShowSubscriptionModal(false);
                setSubscriptionRequest(null);
                setShowRequestDetail(false);
                setSelectedRequest(null);
              }}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10"
            >
              Great, close desk
            </button>
          </div>
        </div>
      )}


      {/* ─── ALL STUDENTS LIST MODAL (COMMAND DESK) ────────────────────── */}
      {showAllStudentsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-3xl border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-fade-in">
            <button
              onClick={() => setShowAllStudentsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Cross-Tenant Student Directory</h3>
                <p className="text-[10px] text-slate-500">Overview of all students registered on the platform across all college tenants.</p>
              </div>
            </div>

            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-900/10">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-900">
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Graduation Year</th>
                      <th className="p-3">Organization (College)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs">
                    {students.map((s: any) => {
                      const org = organizations.find((o: any) => o.id === s.organization_id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-3 font-semibold text-slate-200">{s.name || 'N/A'}</td>
                          <td className="p-3 font-mono text-slate-400">{s.email || 'N/A'}</td>
                          <td className="p-3 text-slate-300">{s.branch || 'N/A'}</td>
                          <td className="p-3 text-slate-300 font-mono">{s.graduation_year || 'N/A'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 font-medium">
                              {org ? `${org.name} (${org.code})` : 'Unknown Tenant'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                          No student records loaded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── USER MANAGEMENT DETAIL / CREDENTIALS MODAL ────────────────── */}
      {selectedUmUser && (() => {
        const orgName = organizations.find((o: any) => o.id === selectedUmUser.organization_id)?.name || 'Platform';
        const tc = {
          admin:     { label: 'Org Admin',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
          subadmin:  { label: 'Sub Admin',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25' },
          student:   { label: 'Student',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
          recruiter: { label: 'Recruiter',  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25' }
        }[selectedUmUser._type as 'admin'|'subadmin'|'student'|'recruiter'] || { label: 'User', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in text-slate-300">
            <div className="w-full max-w-lg border border-slate-800 bg-slate-950 rounded-2xl relative animate-scale-in shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold ${tc.bg} ${tc.color}`}>
                    {(selectedUmUser.name || selectedUmUser.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading leading-tight">{selectedUmUser.name || '—'}</h3>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{selectedUmUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${tc.bg} ${tc.color} border-slate-800`}>
                    {tc.label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${(selectedUmUser._status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {selectedUmUser._status || 'Active'}
                  </span>
                  <button onClick={() => { setSelectedUmUser(null); setUmCredsSuccess(null); setUmCredsError(''); setUmNewPassword(''); }} className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Strip */}
              <div className="grid grid-cols-3 gap-0 border-b border-slate-900 text-center">
                {selectedUmUser._type === 'student' && (<>
                  <div className="py-3 px-2 border-r border-slate-900">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Branch</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{selectedUmUser.branch || 'N/A'}</p>
                  </div>
                  <div className="py-3 px-2 border-r border-slate-900">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Grad Year</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{selectedUmUser.graduation_year || 'N/A'}</p>
                  </div>
                  <div className="py-3 px-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">CGPA</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">{selectedUmUser.cgpa || '0.0'}</p>
                  </div>
                </>)}
                {selectedUmUser._type === 'subadmin' && (<>
                  <div className="py-3 px-2 border-r border-slate-900">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Designation</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{selectedUmUser.designation || 'N/A'}</p>
                  </div>
                  <div className="py-3 px-2 border-r border-slate-900">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Department</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{selectedUmUser.department || 'N/A'}</p>
                  </div>
                  <div className="py-3 px-2 flex items-center justify-center">
                    <span className={`px-2.5 py-1 rounded text-[9px] font-bold border ${formatRole(selectedUmUser.role).bg} ${formatRole(selectedUmUser.role).color} ${formatRole(selectedUmUser.role).border}`}>{formatRole(selectedUmUser.role).label}</span>
                  </div>
                </>)}
                {selectedUmUser._type === 'recruiter' && (<>
                  <div className="py-3 px-2 border-r border-slate-900 col-span-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Company</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{getCompanyName(selectedUmUser.company) || 'N/A'}</p>
                  </div>
                  <div className="py-3 px-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Status</p>
                    <p className="text-xs font-bold text-indigo-400 mt-0.5">{selectedUmUser.status || 'Active'}</p>
                  </div>
                </>)}
                {selectedUmUser._type === 'admin' && (<>
                  <div className="py-3 px-2 border-r border-slate-900 col-span-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Admin For</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{orgName}</p>
                  </div>
                  <div className="py-3 px-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Role</p>
                    <p className="text-xs font-bold text-amber-400 mt-0.5">Org Admin</p>
                  </div>
                </>)}
              </div>

              <div className="p-6 space-y-5">
                {/* Credentials Panel */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-purple-500/5 border-b border-slate-800">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Reset Password</span>
                  </div>
                  <div className="p-4 bg-slate-950">
                    {umCredsSuccess ? (
                      <div className="space-y-3 text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] text-slate-400">Password updated. Copy the credentials below.</p>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs font-mono text-left">
                          <div>Email: <span className="text-white select-all">{umCredsSuccess.email}</span></div>
                          <div>Password: <span className="text-white select-all">{umCredsSuccess.pass}</span></div>
                        </div>
                        <button onClick={() => setUmCredsSuccess(null)} className="text-[11px] text-purple-400 hover:underline">Reset another</button>
                      </div>
                    ) : (
                      <form onSubmit={handleUmResetPassword} className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={umNewPassword}
                            onChange={e => setUmNewPassword(e.target.value)}
                            placeholder="New password..."
                            className="flex-1 h-9 px-3 border border-slate-800 bg-slate-900/50 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                          />
                          <button type="button" onClick={() => setUmNewPassword(generateTempPassword())} className="px-3 h-9 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-purple-400 transition-colors whitespace-nowrap">
                            Generate
                          </button>
                        </div>
                        {umCredsError && <p className="text-[10px] text-red-400">⚠️ {umCredsError}</p>}
                        <button type="submit" disabled={umCredsResetting} className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2">
                          {umCredsResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                          {umCredsResetting ? 'Updating...' : 'Set Password'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Account Control Panel */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border-b border-slate-800">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-white">Account Control</span>
                  </div>
                  <div className="p-4 space-y-2 bg-slate-950">
                    {selectedUmUser._status === 'Active' ? (
                      <button
                        onClick={() => handleUmStatusChange('Suspended')}
                        disabled={umStatusUpdating}
                        className="w-full h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        {umStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUmStatusChange('Active')}
                        disabled={umStatusUpdating}
                        className="w-full h-9 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        {umStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Activate Account
                      </button>
                    )}
                    <button
                      onClick={() => handleUmStatusChange('__delete__')}
                      disabled={umStatusUpdating}
                      className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {umStatusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Delete Account Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── COMPANY DETAILS MODAL ────────────────────────────────────── */}
      {showCompanyModal && (() => {
        const companyRecs = recruiters.filter((r: any) => getCompanyName(r.company) === showCompanyModal.companyName);
        const companyJobs = selectedOrgJobs.filter((j: any) => j.company?.trim() === showCompanyModal.companyName);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in text-slate-300">
            <div className="w-full max-w-2xl border border-slate-800 bg-slate-950 rounded-2xl relative animate-scale-in shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-900 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading leading-tight">{showCompanyModal.companyName}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Enterprise Employer Profile Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompanyModal(null)}
                  className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Summary strip */}
              <div className="grid grid-cols-2 gap-0 border-b border-slate-900 text-center flex-shrink-0">
                <div className="py-3 px-2 border-r border-slate-900">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Recruiters Linked</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{companyRecs.length} accounts</p>
                </div>
                <div className="py-3 px-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Job Postings</p>
                  <p className="text-xs font-bold text-blue-400 mt-0.5">{companyJobs.length} postings</p>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Linked Recruiters section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Linked Recruiters</h4>
                  <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-900/10 divide-y divide-slate-900/60">
                    {companyRecs.map((r: any) => (
                      <div key={r.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-[10px]">
                            {(r.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{r.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{r.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            (r.status || 'Active') === 'Active' || (r.status || 'Active') === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>{r.status || 'Active'}</span>
                          <button
                            onClick={() => {
                              setSelectedUmUser({ ...r, _type: 'recruiter', _status: r.status || 'Active' });
                              setUmCredsSuccess(null);
                              setUmCredsError('');
                              setUmNewPassword('');
                              setShowCompanyModal(null);
                            }}
                            className="h-7 px-2.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 font-bold rounded-lg text-[10px] transition-colors"
                          >
                            Manage Credentials
                          </button>
                        </div>
                      </div>
                    ))}
                    {companyRecs.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-500">No recruiters currently associated with this company name.</p>
                    )}
                  </div>
                </div>

                {/* Job Postings section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Active Job Postings</h4>
                  <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-900/10 divide-y divide-slate-900/60">
                    {companyJobs.map((j: any) => (
                      <div key={j.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{j.title || 'Untitled Role'}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {j.id}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/10">Active</span>
                      </div>
                    ))}
                    {companyJobs.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-500">No active job listings under this company in the current tenant.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
