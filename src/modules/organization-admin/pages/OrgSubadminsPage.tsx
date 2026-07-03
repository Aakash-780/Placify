import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { createClient } from '@insforge/sdk';
import { insforge } from '@/lib/insforge';
import { 
  ShieldCheck, Plus, Edit2, Trash2, Key, UserCheck, UserX, AlertCircle, 
  RefreshCw, Loader2, Check, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function OrgSubadminsPage() {
  const { roleData } = useRole();
  const orgId = roleData?.organization_id;
  const orgName = roleData?.organizations?.name || 'Organization';

  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [showCreateSubadmin, setShowCreateSubadmin] = useState(false);
  const [showEditSubadmin, setShowEditSubadmin] = useState<any | null>(null);
  const [showResetPass, setShowResetPass] = useState<any | null>(null);

  // Form Fields
  const [subadminName, setSubadminName] = useState('');
  const [subadminEmail, setSubadminEmail] = useState('');
  const [subadminDept, setSubadminDept] = useState('');
  const [subadminRole, setSubadminRole] = useState('Placement Officer');
  const [subadminPassword, setSubadminPassword] = useState('');
  const [subadminError, setSubadminError] = useState('');
  const [subadminLoading, setSubadminLoading] = useState(false);
  const [resetPassVal, setResetPassVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<{ email: string; pass: string } | null>(null);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data: subData } = await insforge.database
        .from('subadmins')
        .select('*')
        .eq('organization_id', orgId);
      setSubadmins(subData || []);
    } catch (err) {
      console.error('Error fetching subadmins:', err);
      triggerToast('Failed to load subadmins from backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function handleCreateSubadmin(e: React.FormEvent) {
    e.preventDefault();
    setSubadminError('');
    if (!subadminName.trim() || !subadminEmail.trim() || !subadminPassword.trim()) {
      setSubadminError('Please fill out all required fields.');
      return;
    }

    setSubadminLoading(true);
    try {
      const tempClient = createClient({
        baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
        anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
        isServerMode: true
      } as any);

      // Create auth user
      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: subadminEmail.trim(),
        password: subadminPassword,
        name: subadminName.trim()
      });

      if (authErr) throw authErr;

      // Insert subadmin record
      const { error: dbErr } = await insforge.database
        .from('subadmins')
        .insert([{
          user_id: authData.user.id,
          organization_id: orgId,
          created_by_admin: roleData.id,
          name: subadminName.trim(),
          email: subadminEmail.trim(),
          department: subadminDept.trim() || 'CSE',
          role: subadminRole,
          password_hash: subadminPassword,
          status: 'Active'
        }]);

      if (dbErr) throw dbErr;

      triggerToast(`SubAdmin ${subadminName} created successfully!`);
      setShowCreateSubadmin(false);
      
      setSubadminName('');
      setSubadminEmail('');
      setSubadminDept('');
      setSubadminPassword('');
      loadData();
    } catch (err: any) {
      setSubadminError(err.message || 'Operation failed. Verify email format.');
    } finally {
      setSubadminLoading(false);
    }
  }

  async function handleEditSubadmin(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditSubadmin) return;

    try {
      const { error } = await insforge.database
        .from('subadmins')
        .update({
          name: subadminName.trim(),
          department: subadminDept.trim(),
          role: subadminRole
        })
        .eq('id', showEditSubadmin.id);

      if (error) throw error;
      triggerToast('SubAdmin details updated.');
      setShowEditSubadmin(null);
      setSubadminName('');
      setSubadminDept('');
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update details.', 'error');
    }
  }

  async function toggleSubadminStatus(sub: any) {
    const nextStatus = sub.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await insforge.database
        .from('subadmins')
        .update({ status: nextStatus })
        .eq('id', sub.id);

      if (error) throw error;
      triggerToast(`Subadmin status updated to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed.', 'error');
    }
  }

  async function handleDeleteSubadmin(sub: any) {
    if (!confirm(`Are you sure you want to permanently delete SubAdmin ${sub.name}?`)) return;
    try {
      const { error } = await insforge.database
        .from('subadmins')
        .delete()
        .eq('id', sub.id);

      if (error) throw error;
      triggerToast('SubAdmin successfully deleted.');
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Delete failed.', 'error');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!showResetPass || !resetPassVal.trim()) return;
    setResetLoading(true);
    try {
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: showResetPass.email,
        new_password: resetPassVal.trim()
      });

      if (error) throw error;
      setResetSuccess({ email: showResetPass.email, pass: resetPassVal.trim() });
      triggerToast('Password updated.');
    } catch (err: any) {
      triggerToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setResetLoading(false);
    }
  }

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
          <h1 className="text-2xl font-bold text-foreground tracking-tight capitalize">SubAdmin Management</h1>
          <p className="text-xs text-muted-foreground mt-1">{orgName} · Tenant Administration Panel</p>
        </div>

        <div className="flex items-center gap-4">
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
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest animate-pulse">Syncing subadmins...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">SubAdmins Registry</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage credentials and departments for academic placement coordinators.</p>
            </div>
            <Button
              onClick={() => { setSubadminPassword(generatePassword()); setSubadminError(''); setShowCreateSubadmin(true); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-foreground text-xs font-bold px-4 h-10 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create SubAdmin
            </Button>
          </div>

          <Card className="border border-border overflow-hidden bg-card/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/80 text-xs font-bold uppercase tracking-wider text-foreground">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subadmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No SubAdmins found.</td>
                    </tr>
                  ) : (
                    subadmins.map(sub => (
                      <tr key={sub.id} className="hover:bg-card/30 transition-colors border-b border-border">
                        <td className="p-4 font-semibold text-foreground text-sm">{sub.name}</td>
                        <td className="p-4 font-mono text-foreground/80 text-xs">{sub.email}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-border bg-card/40 text-foreground text-xs px-2.5 py-0.5">
                            {sub.department || 'General'}
                          </Badge>
                        </td>
                        <td className="p-4 text-foreground text-sm">{sub.role}</td>
                        <td className="p-4">
                          <Badge variant={sub.status === 'Active' ? 'default' : 'destructive'} className="text-[10px] font-bold px-2 py-0.5">
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-foreground/80 text-sm">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-400 hover:text-blue-500"
                            onClick={() => {
                              setSubadminName(sub.name);
                              setSubadminDept(sub.department);
                              setSubadminRole(sub.role);
                              setShowEditSubadmin(sub);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-yellow-400 hover:text-yellow-500"
                            onClick={() => toggleSubadminStatus(sub)}
                            title="Suspend / Activate"
                          >
                            {sub.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-purple-400 hover:text-purple-500"
                            onClick={() => {
                              setResetPassVal(generatePassword());
                              setResetSuccess(null);
                              setShowResetPass(sub);
                            }}
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-400 hover:text-red-500"
                            onClick={() => handleDeleteSubadmin(sub)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: CREATE SUBADMIN */}
      {showCreateSubadmin && (
        <Dialog open={showCreateSubadmin} onOpenChange={setShowCreateSubadmin}>
          <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Onboard College SubAdmin</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">Register new coordinator credentials inside the organization directory.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubadmin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Full Name *</label>
                <Input
                  required
                  value={subadminName}
                  onChange={e => setSubadminName(e.target.value)}
                  placeholder="e.g. Prof. Aakash Srivastava"
                  className="bg-card border-border text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Email Address *</label>
                  <Input
                    required
                    type="email"
                    value={subadminEmail}
                    onChange={e => setSubadminEmail(e.target.value)}
                    placeholder="aakash.cse@college.edu"
                    className="bg-card border-border text-xs text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Department / Office</label>
                  <Input
                    value={subadminDept}
                    onChange={e => setSubadminDept(e.target.value)}
                    placeholder="e.g. CSE / Placement Cell"
                    className="bg-card border-border text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Designation / Role</label>
                  <select
                    value={subadminRole}
                    onChange={e => setSubadminRole(e.target.value)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs text-foreground/80 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="TPO Executive">TPO Executive</option>
                    <option value="Department TPO">Department TPO</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Temp Password *</label>
                    <button 
                      type="button" 
                      onClick={() => setSubadminPassword(generatePassword())}
                      className="text-[10px] font-bold text-indigo-400 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <Input
                    required
                    value={subadminPassword}
                    onChange={e => setSubadminPassword(e.target.value)}
                    className="bg-card border-border text-xs font-mono text-foreground"
                  />
                </div>
              </div>

              {subadminError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs font-bold text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{subadminError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowCreateSubadmin(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={subadminLoading} className="bg-indigo-600 hover:bg-indigo-500 text-foreground font-bold">
                  {subadminLoading ? 'Provisioning...' : 'Provision SubAdmin'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: EDIT SUBADMIN */}
      {showEditSubadmin && (
        <Dialog open={!!showEditSubadmin} onOpenChange={() => setShowEditSubadmin(null)}>
          <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold font-heading">Update SubAdmin Scope</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubadmin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Full Name *</label>
                <Input
                  required
                  value={subadminName}
                  onChange={e => setSubadminName(e.target.value)}
                  className="bg-card border-border text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Department</label>
                  <Input
                    value={subadminDept}
                    onChange={e => setSubadminDept(e.target.value)}
                    className="bg-card border-border text-xs text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">Role / Title</label>
                  <select
                    value={subadminRole}
                    onChange={e => setSubadminRole(e.target.value)}
                    className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs text-foreground/80 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="TPO Executive">TPO Executive</option>
                    <option value="Department TPO">Department TPO</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowEditSubadmin(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-foreground font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetPass && (
        <Dialog open={!!showResetPass} onOpenChange={() => { setShowResetPass(null); setResetSuccess(null); }}>
          <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Reset Password</DialogTitle>
            </DialogHeader>

            {resetSuccess ? (
              <div className="space-y-4 text-center py-2 animate-scale-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Credentials Reset Successfully</h4>
                  <p className="text-xs text-muted-foreground mt-1">Please copy the temporary login password below.</p>
                </div>
                <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-xs text-left font-mono">
                  <div>Email: <span className="text-white select-all">{resetSuccess.email}</span></div>
                  <div>Password: <span className="text-white select-all">{resetSuccess.pass}</span></div>
                </div>
                <Button onClick={() => { setShowResetPass(null); setResetSuccess(null); }} className="w-full bg-indigo-600 text-foreground font-bold">
                  Close Panel
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Reset temporary security password for coordinator:<br />
                  <strong className="text-white font-mono">{showResetPass.name} ({showResetPass.email})</strong>
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">New Password</label>
                    <button 
                      type="button" 
                      onClick={() => setResetPassVal(generatePassword())}
                      className="text-[10px] font-bold text-indigo-400 hover:underline"
                    >
                      Generate password
                    </button>
                  </div>
                  <Input
                    required
                    value={resetPassVal}
                    onChange={e => setResetPassVal(e.target.value)}
                    className="bg-card border-border text-xs font-mono text-foreground"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowResetPass(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={resetLoading} className="bg-indigo-600 hover:bg-indigo-500 text-foreground font-bold">
                    {resetLoading ? 'Resetting password...' : 'Confirm Reset'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
