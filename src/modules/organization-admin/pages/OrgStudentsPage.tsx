import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { 
  Users, GraduationCap, Search, CheckCircle, Clock, Award, Loader2, AlertCircle, RefreshCw, Calendar, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';

type PageTabType = 'verification' | 'cohort';

export default function OrgStudentsPage() {
  const { roleData } = useRole();
  const orgId = roleData?.organization_id;
  const orgName = roleData?.organizations?.name || 'Organization';

  const [activeTab, setActiveTab] = useState<PageTabType>('cohort');
  const [students, setStudents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [showProfileDetails, setShowProfileDetails] = useState<any | null>(null);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data: studData } = await insforge.database
        .from('students')
        .select('*')
        .eq('organization_id', orgId);

      // Fetch admin/subadmin names to map approvals
      const { data: adminsList } = await insforge.database
        .from('admins')
        .select('id, name');

      const { data: orgAdminsList } = await insforge.database
        .from('organization_admins')
        .select('id, name')
        .eq('organization_id', orgId);

      // Create a lookup map of id -> name
      const verifiersMap: Record<string, string> = {};
      if (Array.isArray(adminsList)) {
        adminsList.forEach(a => { if (a.id && a.name) verifiersMap[a.id] = a.name; });
      }
      if (Array.isArray(orgAdminsList)) {
        orgAdminsList.forEach(oa => { if (oa.id && oa.name) verifiersMap[oa.id] = oa.name; });
      }

      // Map approved_by_name into student data
      const mappedStudents = (studData || []).map(s => ({
        ...s,
        approved_by_name: s.verified_by ? verifiersMap[s.verified_by] || 'Admin' : null
      }));

      setStudents(mappedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      triggerToast('Failed to load students data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranch, filterYear, filterStatus, activeTab]);

  // Verification actions for student
  async function handleStudentVerify(student: any, status: 'verified' | 'rejected' | 'suspended') {
    try {
      const legacyStatus = status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Suspended';
      const { error } = await insforge.database
        .from('students')
        .update({ 
          status,
          verification_status: legacyStatus,
          verified_by: roleData.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) throw error;
      triggerToast(`Student '${student.name}' is now marked as ${status}.`);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed.', 'error');
    }
  }

  // Toggle Student Account status
  async function toggleUserActiveStatus(studentRow: any) {
    const nextStatus = studentRow.account_status === 'Active' ? 'Suspended' : 'Active';
    try {
      const updateData: any = { account_status: nextStatus };
      if (nextStatus === 'Suspended') {
        updateData.status = 'suspended';
        updateData.verification_status = 'Suspended';
      } else {
        const legacyStatus = studentRow.verification_status === 'Verified' ? 'Verified' : 'Pending';
        updateData.status = legacyStatus === 'Verified' ? 'verified' : 'pending';
        updateData.verification_status = legacyStatus;
      }

      const { error } = await insforge.database
        .from('students')
        .update(updateData)
        .eq('id', studentRow.id);

      if (error) throw error;
      triggerToast(`Student status toggled to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed.', 'error');
    }
  }

  async function handleDeleteUserAccount(studentRow: any) {
    if (!confirm(`Are you sure you want to permanently delete student '${studentRow.name}'? This is destructive.`)) return;
    try {
      const { error } = await insforge.database
        .from('students')
        .delete()
        .eq('id', studentRow.id);

      if (error) throw error;
      triggerToast('Student account successfully removed.');
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Delete operation failed.', 'error');
    }
  }

  function handleAutoGeneratePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(generated);
  }

  async function handleResetStudentPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPasswordStudent || !tempPassword.trim()) return;
    setResetLoading(true);
    try {
      // 1. Reset user password in auth.users
      const { error: rpcError } = await insforge.database.rpc('reset_user_password', {
        user_email: resetPasswordStudent.email,
        new_password: tempPassword.trim()
      });
      if (rpcError) throw rpcError;

      // 2. Update students table fields
      const { error: updateError } = await insforge.database
        .from('students')
        .update({
          force_password_change: forceChange,
          password_reset_at: new Date().toISOString(),
          password_reset_by: roleData.id
        })
        .eq('id', resetPasswordStudent.id);
      if (updateError) throw updateError;

      triggerToast(`Password reset successfully for ${resetPasswordStudent.name}.`);
      setResetPasswordStudent(null);
      setTempPassword('');
      setForceChange(true);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setResetLoading(false);
    }
  }

  // Filters calculations
  const filteredStudents = students.filter(s => {
    if (activeTab === 'verification' && s.status === 'verified') {
      return false;
    }
    if (activeTab === 'cohort' && s.status !== 'verified') {
      return false;
    }

    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.college_id && s.college_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBranch = filterBranch === 'All' || s.branch === filterBranch;
    const matchesYear = filterYear === 'All' || String(s.current_year) === filterYear;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus.toLowerCase();
    return matchesSearch && matchesBranch && matchesYear && matchesStatus;
  });

  const totalStudentsCount = filteredStudents.length;
  const totalPages = Math.ceil(totalStudentsCount / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalStudentsCount);
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const uniqueBranches = Array.from(new Set(students.map(s => s.branch).filter(Boolean)));
  const uniqueYears = Array.from(new Set(students.map(s => s.current_year).filter(Boolean))).sort();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background font-sans text-foreground p-8 space-y-8 max-w-7xl mx-auto w-full">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-blue-500/20 bg-card/90 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl text-foreground backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full animate-ping ${toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      <header className="flex justify-between items-center pb-6 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight capitalize">Student Management</h1>
          <p className="text-xs text-muted-foreground mt-1">{orgName} · Tenant Administration Panel</p>
        </div>

        <div className="flex items-center gap-4">
          <SubadminFeatureToggle featureKey="students" />
          <button
            onClick={loadData}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl border border-border bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Node
          </button>
          <div className="h-10 px-4 rounded-xl border border-border bg-card/40 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest animate-pulse">Syncing students data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-foreground">Students Registry</h3>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded text-[10px] font-bold">
                  Total Count: {totalStudentsCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Manage and verify student accounts, CGPA, and placement information.</p>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex bg-card p-1 border border-border rounded-xl text-xs font-bold gap-1">
              {[
                { id: 'cohort', label: 'Enrolled Cohort' },
                { id: 'verification', label: 'Verification Queue' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as PageTabType); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-card text-foreground border border-border' 
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card/40 p-4 border border-border rounded-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search name or registration number..."
                className="pl-9 h-10 text-xs bg-card border-border text-foreground"
              />
            </div>

            <div>
              <select
                value={filterBranch}
                onChange={e => setFilterBranch(e.target.value)}
                className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs text-foreground/80 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Branches</option>
                {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs text-foreground/80 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Years</option>
                {uniqueYears.map(y => <option key={y} value={String(y)}>{y} Year</option>)}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs text-foreground/80 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <Card className="border border-border bg-card/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto text-sm font-sans">
              {activeTab === 'verification' ? (
                <div>
                  <div className="flex border-b border-border bg-card/80 p-4 font-bold uppercase tracking-wider text-foreground text-xs">
                    <div className="w-1/6">Student Info</div>
                    <div className="w-1/6">Reg Number</div>
                    <div className="w-1/6">Branch & Year</div>
                    <div className="w-1/6">CGPA / Backlogs</div>
                    <div className="w-1/6">Status</div>
                    <div className="w-1/6 text-center">Actions</div>
                  </div>

                  {paginatedStudents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No students match verification filter criteria.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {paginatedStudents.map(student => (
                        <div 
                          key={student.id} 
                          className="flex p-4 items-center hover:bg-card/30 transition-colors text-sm cursor-pointer group"
                          onClick={() => setShowProfileDetails(student)}
                          title="Click to view profile"
                        >
                          <div className="w-1/6 flex items-center gap-3">
                            {student.profile_photo_url ? (
                              <img src={student.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-indigo-400">
                                {student.name.slice(0,2).toUpperCase()}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <span className="font-bold block text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:underline">{student.name}</span>
                              <span className="text-xs text-muted-foreground block truncate max-w-[140px]">{student.email}</span>
                              {student.approved_by_name && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 truncate">
                                  Approved by {student.approved_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-1/6 font-mono font-bold text-foreground/80 text-xs">{student.college_id || '—'}</div>
                          <div className="w-1/6 text-foreground">{student.branch || '—'} · Year {student.current_year || '—'}</div>
                          <div className="w-1/6 text-foreground/80">
                            <span className="font-bold text-foreground">CGPA: {student.cgpa}</span>
                            <span className="text-[11px] text-red-400 block">{student.backlogs} active backlogs</span>
                          </div>
                          <div className="w-1/6">
                            <Badge variant={
                              student.status === 'verified' ? 'default' : 
                              student.status === 'pending' ? 'secondary' : 'destructive'
                            } className="text-[10px] font-bold px-2 py-0.5">
                              {student.status === 'verified' ? 'Verified' : 
                               student.status === 'pending' ? 'Pending' :
                               student.status === 'rejected' ? 'Rejected' : 'Suspended'}
                            </Badge>
                          </div>
                          <div className="w-1/6 flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {student.status === 'verified' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] font-bold border-border hover:bg-card text-indigo-400 hover:text-indigo-300"
                                onClick={() => setResetPasswordStudent(student)}
                              >
                                Reset Password
                              </Button>
                            )}
                            
                            {student.status !== 'verified' && (
                              <Button
                                size="sm"
                                className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-foreground"
                                onClick={() => handleStudentVerify(student, 'verified')}
                              >
                                Verify
                              </Button>
                            )}

                            {student.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-[10px] font-bold"
                                onClick={() => handleStudentVerify(student, 'rejected')}
                              >
                                Reject
                              </Button>
                            )}

                            {student.status === 'verified' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-bold text-red-400 hover:text-red-300"
                                onClick={() => handleStudentVerify(student, 'suspended')}
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex border-b border-border bg-card/80 p-4 font-bold uppercase tracking-wider text-foreground text-xs">
                    <div className="w-1/4">Student Name</div>
                    <div className="w-1/4">Branch & Year</div>
                    <div className="w-1/4">Account Status</div>
                    <div className="w-1/4 text-center">Actions</div>
                  </div>
                  {paginatedStudents.map(student => (
                    <div 
                      key={student.id} 
                      className="flex p-4 items-center hover:bg-card/30 text-sm cursor-pointer group"
                      onClick={() => setShowProfileDetails(student)}
                      title="Click to view profile"
                    >
                      <div className="w-1/4">
                        <span className="font-semibold text-foreground block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:underline">{student.name}</span>
                        {student.approved_by_name && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                            Approved by {student.approved_by_name}
                          </span>
                        )}
                      </div>
                      <div className="w-1/4 text-foreground/80">{student.branch} · Year {student.current_year}</div>
                      <div className="w-1/4">
                        <Badge variant={student.account_status === 'Active' ? 'default' : 'destructive'} className="text-[10px] font-bold px-2 py-0.5">
                          {student.account_status}
                        </Badge>
                      </div>
                      <div className="w-1/4 flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] font-bold border-border hover:bg-card text-indigo-400 hover:text-indigo-300"
                            onClick={() => setResetPasswordStudent(student)}
                          >
                            Reset Password
                          </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-bold text-yellow-400"
                          onClick={() => toggleUserActiveStatus(student)}
                        >
                          {student.account_status === 'Active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-bold text-red-500"
                          onClick={() => handleDeleteUserAccount(student)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {paginatedStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No students found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalStudentsCount > 0 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground bg-card/20">
                <div>
                  Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-foreground">{endIndex}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalStudentsCount}</span> students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-8 border-border bg-card/50 hover:bg-card text-foreground text-[10px] font-bold px-3 rounded-lg flex items-center"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-foreground font-bold">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg transition-colors ${
                          p === safeCurrentPage
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="h-8 border-border bg-card/50 hover:bg-card text-foreground text-[10px] font-bold px-3 rounded-lg flex items-center"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL: Student details */}
      {showProfileDetails && (
        <Dialog open={!!showProfileDetails} onOpenChange={() => setShowProfileDetails(null)}>
          <DialogContent className="max-w-md bg-card border border-border text-xs shadow-2xl text-foreground">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Student Academic Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 bg-card/50 p-4 rounded-xl border border-border">
                {showProfileDetails.profile_photo_url ? (
                  <img src={showProfileDetails.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-indigo-400">
                    {showProfileDetails.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-foreground">{showProfileDetails.name}</h4>
                  <span className="text-xs text-muted-foreground font-mono block">{showProfileDetails.email}</span>
                  {showProfileDetails.approved_by_name && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      ✓ Approved by {showProfileDetails.approved_by_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Registration number</span>
                    <span className="font-bold text-foreground mt-0.5 block">{showProfileDetails.college_id || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Placement Status</span>
                    <span className="font-bold text-foreground mt-0.5 block uppercase">{showProfileDetails.placement_status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Branch & year</span>
                    <span className="text-foreground mt-0.5 block">{showProfileDetails.branch} · Year {showProfileDetails.current_year}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">CGPA / Backlogs</span>
                    <span className="text-foreground mt-0.5 block font-bold">CGPA: {showProfileDetails.cgpa} ({showProfileDetails.backlogs} backlogs)</span>
                  </div>
                </div>

                {showProfileDetails.resume_url && (
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Student Resume PDF</span>
                    <a 
                      href={showProfileDetails.resume_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View File</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {resetPasswordStudent && (
        <Dialog open={!!resetPasswordStudent} onOpenChange={() => { setResetPasswordStudent(null); setTempPassword(''); }}>
          <DialogContent className="max-w-md bg-card border border-border text-xs shadow-2xl text-foreground">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Reset Student Password</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleResetStudentPassword} className="space-y-4 pt-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Student Name</span>
                <span className="font-bold text-foreground mt-0.5 block text-sm">{resetPasswordStudent.name}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Student Email</span>
                <span className="font-semibold text-muted-foreground mt-0.5 block text-sm bg-muted/20 p-2 rounded-lg border border-border/40 select-all font-mono">{resetPasswordStudent.email}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">New Temporary Password</span>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    disabled={resetLoading}
                    required
                    className="h-10 text-xs bg-card border-border text-foreground flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3 text-[10px] font-bold border-border bg-card/50 hover:bg-card text-foreground"
                    onClick={handleAutoGeneratePassword}
                    disabled={resetLoading}
                  >
                    Auto Generate
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="force-password-change"
                  checked={forceChange}
                  onChange={e => setForceChange(e.target.checked)}
                  disabled={resetLoading}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="force-password-change" className="text-xs text-foreground cursor-pointer select-none">
                  Force password change on next login
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 text-xs border border-border font-bold hover:bg-card text-foreground"
                  onClick={() => { setResetPasswordStudent(null); setTempPassword(''); }}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading || !tempPassword.trim()}
                  className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-foreground"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
