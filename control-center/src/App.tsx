import React, { useState, useEffect } from 'react';
import { createClient } from '@insforge/sdk';
import { 
  ShieldCheck, Loader2, LogOut, Settings, Activity, AlertCircle, 
  BarChart3, Bell, RefreshCw, X, Plus, Search, Calendar, Building2, 
  Edit2, Key, Lock, Check, CheckCircle, Sun, Moon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Initialize InsForge Client
const insforge = createClient({
    baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
    anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
});

type TabType = 'dashboard' | 'organizations' | 'pending_orgs' | 'analytics' | 'logs' | 'settings';

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
    totalApplicationsCount: 0
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
  
  // Loading & Toast State
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Modals & Action States
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState<any | null>(null);
  const [showResetCredsModal, setShowResetCredsModal] = useState<any | null>(null);
  const [showViewOrgModal, setShowViewOrgModal] = useState<any | null>(null);

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
  const [selectedAnalyticsOrgId, setSelectedAnalyticsOrgId] = useState<string>('');
  const [activeMetricDetail, setActiveMetricDetail] = useState<'subadmins' | 'students' | 'recruiters' | 'companies' | null>(null);
  const [showAllStudentsModal, setShowAllStudentsModal] = useState(false);

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

      // Set platform analytics stats
      setStats({
        totalOrganizations: organizationsList.length,
        activeOrganizations: organizationsList.filter(o => o.status === 'Active').length,
        suspendedOrganizations: organizationsList.filter(o => o.status === 'Suspended').length,
        pendingOnboardings: organizationsList.filter(o => o.status === 'Pending').length,
        platformHealth: 'Good',
        totalStudentsCount: (stdData || []).length,
        totalRecruitersCount: (recData || []).length,
        totalJobsCount: (jobsData || []).length,
        totalApplicationsCount: (apps || []).length
      });

      // Default selected analytics org if not set
      if (!selectedAnalyticsOrgId && organizationsList.length > 0) {
        setSelectedAnalyticsOrgId(organizationsList[0].id);
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
  async function handleEditOrganization(e: React.FormEvent) {
    e.preventDefault();
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
        .eq('id', showEditOrgModal.id);

      if (error) throw error;

      // Also update the primary admin's name/email if changed
      const primaryAdmin = admins.find((a: any) => a.organization_id === showEditOrgModal.id);
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
            .eq('organization_id', showEditOrgModal.id);
        }
      }

      await writeAuditLog(`Updated organization details: ${editName.trim()}`, showEditOrgModal.code);
      setShowEditOrgModal(null);
      showToast('Organization details updated successfully.');
      await loadData();
    } catch (err: any) {
      setOrgEditingError(err.message || 'Failed to update organization details.');
    } finally {
      setOrgEditing(false);
    }
  }

  // Toggle Organization Status
  async function handleToggleOrgStatus(org: any) {
    const newStatus = org.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await insforge.database
        .from('organizations')
        .update({ status: newStatus })
        .eq('id', org.id);

      if (error) throw error;

      await writeAuditLog(`Toggled status of ${org.name} to ${newStatus}`, org.code);
      showToast(`Organization is now ${newStatus}`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update organization status.', 'error');
    }
  }

  // Approve Pending Organization Request
  async function handleApprovePendingOrg(org: any) {
    try {
      const { error } = await insforge.database
        .from('organizations')
        .update({ status: 'Active' })
        .eq('id', org.id);

      if (error) throw error;

      await writeAuditLog(`Approved onboarding request for: ${org.name}`, org.code);
      showToast(`Organization '${org.name}' onboarding approved!`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Approve request failed.', 'error');
    }
  }

  // Decline/Reject Organization Request
  async function handleDeclinePendingOrg(org: any) {
    if (!confirm(`Are you sure you want to DECLINE and DELETE onboarding request for ${org.name}?`)) return;
    try {
      const { error } = await insforge.database
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      await writeAuditLog(`Declined & deleted onboarding request for: ${org.name}`, org.code);
      showToast('Onboarding request declined.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Decline request failed.', 'error');
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

  const pendingOrganizationsList = filteredOrgs.filter(o => o.status === 'Pending');
  const activeOrgsList = filteredOrgs.filter(o => o.status !== 'Pending');

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
    ...selectedOrgRecruiters.map(r => r.company?.trim())
  ].filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#030712] font-body flex relative overflow-hidden text-slate-200">
      
      {/* Toast Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-blue-500/20 bg-slate-900/90 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl text-white backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between flex-shrink-0 z-30 select-none">
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
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto select-none relative z-10 p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* HEADER BAR */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-white capitalize">
              {activeTab === 'dashboard' ? 'SaaS Command Desk' : activeTab.replace(/_/g, ' ')}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Platform owner settings node. Scoped to multi-tenant organization directory variables.
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
              <h2 className="text-xl font-heading font-bold text-white">Platform Owner Command Deck</h2>
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
        {activeTab !== 'dashboard' && activeTab !== 'settings' && (
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
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-heading">Registered Organizations</h3>
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
                    {activeOrgsList.map(org => {
                      const primaryAdmin = admins.find(a => a.organization_id === org.id);
                      const orgStudents = students.filter(s => s.organization_id === org.id);
                      const orgRecruiters = recruiters.filter(r => r.organization_id === org.id);
                      
                      return (
                        <tr key={org.id} className="hover:bg-slate-900/25 transition-colors">
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
                          <td className="p-4 text-slate-300 font-semibold">{orgStudents.length}</td>
                          <td className="p-4 text-slate-300 font-semibold">{orgRecruiters.length}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              org.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                              'bg-red-500/10 text-red-400 border border-red-500/10'
                            }`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{new Date(org.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowViewOrgModal(org)}
                                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold transition-colors text-slate-300"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  const primaryAdmin = admins.find((a: any) => a.organization_id === org.id);
                                  setEditName(org.name);
                                  setEditWebsite(org.website || '');
                                  setEditAddress(org.address || '');
                                  setEditLogoUrl(org.logo_url || '');
                                  setEditAdminName(primaryAdmin?.name || '');
                                  setEditAdminEmail(primaryAdmin?.email || '');
                                  setOrgEditingError('');
                                  setShowEditOrgModal(org);
                                }}
                                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-bold transition-colors text-blue-400"
                              >
                                Edit
                              </button>
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
                    })}

                    {activeOrgsList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                          No organizations registered yet.
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
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <span>Pending Organization Requests</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                {pendingOrganizationsList.length} Queue
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrganizationsList.map(org => {
                const primaryAdmin = admins.find(a => a.organization_id === org.id);
                
                return (
                  <div key={org.id} className="border border-slate-800 bg-slate-900/30 p-5 rounded-2xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[9px] font-bold uppercase">
                        Pending Onboarding
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-slate-850" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-sm font-heading">
                          {org.name[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{org.name}</h4>
                        <span className="text-[10px] text-slate-400 block font-mono">{org.code}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-900 pt-3">
                      <div className="col-span-2">Website: <strong className="text-slate-200">{org.website || 'N/A'}</strong></div>
                      <div className="col-span-2">Location: <strong className="text-slate-200 truncate block">{org.address || 'N/A'}</strong></div>
                      {primaryAdmin && (
                        <>
                          <div>Admin: <strong className="text-slate-200 block truncate">{primaryAdmin.name}</strong></div>
                          <div>Email: <strong className="text-slate-200 block truncate font-mono">{primaryAdmin.email}</strong></div>
                        </>
                      )}
                      <div className="col-span-2">Requested: <strong className="text-slate-200">{new Date(org.created_at).toLocaleDateString()}</strong></div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprovePendingOrg(org)}
                        className="flex-1 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Approve Onboarding
                      </button>
                      <button
                        onClick={() => handleDeclinePendingOrg(org)}
                        className="h-8 px-3.5 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-xs font-bold text-slate-400 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}

              {pendingOrganizationsList.length === 0 && (
                <div className="col-span-full border border-slate-900 p-8 rounded-2xl text-center text-xs text-slate-500">
                  No pending onboarding requests.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── ORGANIZATION ANALYTICS TAB ─────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Tenant Metrics Node</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Inspect metrics scoped to a specific organization.</p>
              </div>

              <select
                value={selectedAnalyticsOrgId}
                onChange={(e) => setSelectedAnalyticsOrgId(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
              >
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                ))}
              </select>
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
                    <div className="flex justify-between items-center pb-3 border-b border-slate-900">
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
                      <button
                        onClick={() => setActiveMetricDetail(null)}
                        className="h-8 px-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition-all"
                      >
                        Close Details
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      {activeMetricDetail === 'subadmins' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Name</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Designation</th>
                              <th className="p-3">Department</th>
                              <th className="p-3">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {selectedOrgSubAdmins.map((sa: any) => (
                              <tr key={sa.id} className="hover:bg-slate-900/25 transition-colors">
                                <td className="p-3 font-semibold text-slate-200">{sa.name}</td>
                                <td className="p-3 font-mono text-slate-400">{sa.email}</td>
                                <td className="p-3 text-slate-300">{sa.designation || 'N/A'}</td>
                                <td className="p-3 text-slate-300">{sa.department || 'N/A'}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/10">
                                    {sa.role}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {selectedOrgSubAdmins.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                                  No subadmins registered for this organization.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}

                      {activeMetricDetail === 'students' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                              <th className="p-3">Name</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Branch</th>
                              <th className="p-3">Graduation Year</th>
                              <th className="p-3">CGPA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-xs">
                            {selectedOrgStudents.map((s: any) => (
                              <tr key={s.id} className="hover:bg-slate-900/25 transition-colors">
                                <td className="p-3 font-semibold text-slate-200">{s.name || 'N/A'}</td>
                                <td className="p-3 font-mono text-slate-400">{s.email || 'N/A'}</td>
                                <td className="p-3 text-slate-300">{s.branch || 'N/A'}</td>
                                <td className="p-3 text-slate-300 font-mono">{s.graduation_year || 'N/A'}</td>
                                <td className="p-3 text-emerald-400 font-bold font-mono">{s.cgpa || '0.0'}</td>
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
                              <tr key={r.id} className="hover:bg-slate-900/25 transition-colors">
                                <td className="p-3 font-semibold text-slate-200">{r.name || 'N/A'}</td>
                                <td className="p-3 font-mono text-slate-400">{r.email || 'N/A'}</td>
                                <td className="p-3 text-slate-300 font-bold">{r.company || 'N/A'}</td>
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
                              ...selectedOrgRecruiters.map((r: any) => r.company?.trim())
                            ].filter(Boolean))).map((companyName: string, idx: number) => {
                              const recruitersCount = selectedOrgRecruiters.filter((r: any) => r.company?.trim() === companyName).length;
                              const jobsCount = selectedOrgJobs.filter((j: any) => j.company?.trim() === companyName).length;
                              return (
                                <tr key={idx} className="hover:bg-slate-900/25 transition-colors">
                                  <td className="p-3 font-bold text-slate-200">{companyName}</td>
                                  <td className="p-3 text-slate-300 font-mono">{recruitersCount} recruiters</td>
                                  <td className="p-3 text-blue-400 font-mono font-bold">{jobsCount} postings</td>
                                </tr>
                              );
                            })}
                            {Array.from(new Set([
                              ...selectedOrgJobs.map((j: any) => j.company?.trim()),
                              ...selectedOrgRecruiters.map((r: any) => r.company?.trim())
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
                      settings.maintenance_mode ? 'bg-red-650 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
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
      {showEditOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl">
            <button
              onClick={() => setShowEditOrgModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Edit2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-white font-heading">Edit Tenant details: {showEditOrgModal.code}</h3>
            </div>

            <form onSubmit={handleEditOrganization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Organization Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Website URL</label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={e => setEditWebsite(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Location Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Logo Image URL</label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={e => setEditLogoUrl(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Admin Credentials Section */}
              <div className="border-t border-slate-900/80 pt-4">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">Primary Admin Account</h4>
                <p className="text-[10px] text-slate-500 mb-3">Update the primary administrator's display name or email address. To change the password, use the Credentials button on the organizations table.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Admin Name</label>
                    <input
                      type="text"
                      value={editAdminName}
                      onChange={e => setEditAdminName(e.target.value)}
                      placeholder="Administrator name"
                      className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Admin Email</label>
                    <input
                      type="email"
                      value={editAdminEmail}
                      onChange={e => setEditAdminEmail(e.target.value)}
                      placeholder="admin@university.edu"
                      className="w-full h-10 px-3 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {orgEditingError && (
                <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400">
                  ⚠️ {orgEditingError}
                </div>
              )}

              <button
                type="submit"
                disabled={orgEditing}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {orgEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
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
      {showViewOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-950 p-6 rounded-2xl relative animate-scale-in shadow-2xl">
            <button
              onClick={() => setShowViewOrgModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-white font-heading">Organization File Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl">
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

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-slate-900 rounded-xl bg-slate-900/10 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    showViewOrgModal.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
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

              <div className="p-4 border border-slate-900 rounded-xl bg-slate-900/20 space-y-2">
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
            </div>
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

    </div>
  );
}
