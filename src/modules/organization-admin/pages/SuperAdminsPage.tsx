import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { createClient } from '@insforge/sdk';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, Plus, Search, Key, ShieldCheck, ShieldAlert, Edit2, 
  Trash2, UserCheck, UserX, Loader2, X, Check, Eye 
} from 'lucide-react';

const availablePermissions = [
  'Manage Students',
  'Manage Recruiters',
  'Manage Jobs',
  'Manage Applications',
  'View Analytics',
  'Manage Community',
  'Manage DSA Sheets',
  'Manage Notifications'
];

export default function SuperAdminsPage() {
  const { roleData } = useRole();
  const currentOrgId = roleData?.organization_id;

  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Editing State
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // View State
  const [showViewModal, setShowViewModal] = useState<any | null>(null);

  // Reset password state
  const [showResetModal, setShowResetModal] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessData, setResetSuccessData] = useState<{ email: string; pass: string } | null>(null);

  async function loadData() {
    if (!currentOrgId) return;
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('admins')
        .select('*')
        .eq('role', 'super_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuperAdmins(data || []);
    } catch (err) {
      console.error('Error loading super admins:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentOrgId]);

  function generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  async function handleCreateSuperAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateError('Please fill out all required fields.');
      return;
    }

    setCreating(true);
    try {
      // 1. Create client-side server connection
      const tempClient = createClient({
        baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
        anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
        isServerMode: true
      } as any);

      // 2. Sign up primary user
      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: newEmail.trim(),
        password: newPassword,
        name: newName.trim()
      });

      if (authErr) throw authErr;

      // 3. Create Row in Admins
      const { error: dbErr } = await insforge.database
        .from('admins')
        .insert([{
          user_id: authData.user.id,
          name: newName.trim(),
          email: newEmail.trim(),
          status: 'Active',
          role: 'super_admin',
          permissions: selectedPermissions,
          organization_id: currentOrgId
        }]);

      if (dbErr) throw dbErr;

      // Reset
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setSelectedPermissions([]);
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create Super Admin.');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSuperAdmin(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }

    setEditing(true);
    try {
      const { error } = await insforge.database
        .from('admins')
        .update({
          name: editName.trim(),
          permissions: editPermissions
        })
        .eq('id', showEditModal.id);

      if (error) throw error;

      setShowEditModal(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update details.');
    } finally {
      setEditing(false);
    }
  }

  async function handleToggleStatus(admin: any) {
    const nextStatus = admin.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await insforge.database
        .from('admins')
        .update({ status: nextStatus })
        .eq('id', admin.id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  }

  async function handleDeleteAdmin(admin: any) {
    if (!confirm(`Are you sure you want to delete Super Admin ${admin.name}?`)) return;
    try {
      const { error } = await insforge.database
        .from('admins')
        .delete()
        .eq('id', admin.id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Delete operation failed.');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    if (!resetPasswordVal.trim()) {
      setResetError('Please enter a temporary password.');
      return;
    }

    setResetting(true);
    try {
      const { error } = await insforge.database.rpc('reset_user_password', {
        user_email: showResetModal.email,
        new_password: resetPasswordVal.trim()
      });

      if (error) throw error;

      setResetSuccessData({ email: showResetModal.email, pass: resetPasswordVal.trim() });
      setResetPasswordVal('');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset credentials.');
    } finally {
      setResetting(false);
    }
  }

  const filteredAdmins = superAdmins.filter(a => {
    return a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalAdmins = superAdmins.length;
  const activeAdmins = superAdmins.filter(a => a.status === 'Active').length;
  const suspendedAdmins = superAdmins.filter(a => a.status === 'Suspended').length;
  const pendingAdmins = superAdmins.filter(a => a.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-background min-h-screen text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span>Super Admins Directory</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provision and manage Super Admins (Placement Coordinators) and set operational scopes.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewPassword(generateTempPassword());
            setCreateError('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 font-bold"
        >
          <Plus className="w-4 h-4" /> Create Super Admin
        </Button>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Super Admins', value: totalAdmins, desc: 'Registered in org' },
          { title: 'Active Super Admins', value: activeAdmins, desc: 'Operational keys', color: 'border-emerald-500/20 text-emerald-500' },
          { title: 'Suspended Admins', value: suspendedAdmins, desc: 'Logins restricted', color: 'border-red-500/20 text-red-500' },
          { title: 'Pending Onboardings', value: pendingAdmins, desc: 'Awaiting activation', color: 'border-yellow-500/20 text-yellow-500' }
        ].map((card, i) => (
          <Card key={i} className={card.color}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider">{card.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{card.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name or email address..."
          className="pl-9 h-11"
        />
      </div>

      {/* Admins Table */}
      <Card className="border border-border/60 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4">Profile</th>
                <th className="p-4">Email</th>
                <th className="p-4">Permissions Scope</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {filteredAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                          {admin.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{admin.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-muted-foreground">{admin.email}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[320px]">
                      {(admin.permissions || []).map((perm: string, pIdx: number) => (
                        <Badge key={pIdx} variant="secondary" className="text-[9px] font-semibold">
                          {perm}
                        </Badge>
                      ))}
                      {(admin.permissions || []).length === 0 && (
                        <span className="text-muted-foreground">No custom scope set</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={admin.status === 'Active' ? 'default' : 'destructive'} className="text-[9px] font-bold">
                      {admin.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowViewModal(admin)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-400 hover:text-blue-500"
                        onClick={() => {
                          setEditName(admin.name);
                          setEditPermissions(admin.permissions || []);
                          setEditError('');
                          setShowEditModal(admin);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-yellow-400 hover:text-yellow-500"
                        onClick={() => handleToggleStatus(admin)}
                      >
                        {admin.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-purple-400 hover:text-purple-500"
                        onClick={() => {
                          setResetPasswordVal(generateTempPassword());
                          setResetError('');
                          setResetSuccessData(null);
                          setShowResetModal(admin);
                        }}
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-500"
                        onClick={() => handleDeleteAdmin(admin)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'No Super Admins found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Onboard New Super Admin</span>
              </h3>
            </DialogHeader>

            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Dean Academics / Coordinator"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address *</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="coordinator@college.edu"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temporary Password *</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateTempPassword())}
                      className="text-[9px] font-bold text-primary hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Password input"
                    required
                  />
                </div>
              </div>

              {/* Permissions Selector */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissions Scope</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {availablePermissions.map(perm => {
                    const isChecked = selectedPermissions.includes(perm);
                    return (
                      <div
                        key={perm}
                        onClick={() => {
                          setSelectedPermissions(prev =>
                            isChecked ? prev.filter(p => p !== perm) : [...prev, perm]
                          );
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{perm}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-xl">
                  ⚠️ {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Complete Provisioning'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Dialog open={!!showEditModal} onOpenChange={() => setShowEditModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <h3 className="text-lg font-bold text-foreground">Edit Super Admin Details</h3>
            </DialogHeader>

            <form onSubmit={handleEditSuperAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissions Scope</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {availablePermissions.map(perm => {
                    const isChecked = editPermissions.includes(perm);
                    return (
                      <div
                        key={perm}
                        onClick={() => {
                          setEditPermissions(prev =>
                            isChecked ? prev.filter(p => p !== perm) : [...prev, perm]
                          );
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{perm}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-xl">
                  ⚠️ {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editing}>
                  {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* VIEW MODAL */}
      {showViewModal && (
        <Dialog open={!!showViewModal} onOpenChange={() => setShowViewModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <h3 className="text-lg font-bold text-foreground">Super Admin details</h3>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm uppercase">
                    {showViewModal.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold">{showViewModal.name}</h4>
                  <span className="text-[10px] text-muted-foreground block font-mono">{showViewModal.email}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Account Status</span>
                  <div className="mt-1">
                    <Badge variant={showViewModal.status === 'Active' ? 'default' : 'destructive'}>
                      {showViewModal.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Authorized permissions Scope</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(showViewModal.permissions || []).map((perm: string) => (
                      <Badge key={perm} variant="outline" className="text-[10px]">
                        {perm}
                      </Badge>
                    ))}
                    {(showViewModal.permissions || []).length === 0 && (
                      <span className="text-muted-foreground text-xs font-sans">No permissions assigned.</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-between text-muted-foreground">
                  <span>Registered date:</span>
                  <span>{new Date(showViewModal.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <Dialog open={!!showResetModal} onOpenChange={() => { setShowResetModal(null); setResetSuccessData(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <span>Reset password</span>
              </h3>
            </DialogHeader>

            {resetSuccessData ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Credentials reset Successfully</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">Please copy the new temporary login credentials.</p>
                </div>

                <div className="p-3 bg-muted border rounded-xl space-y-2 text-xs font-mono text-left">
                  <div>Email: <span className="text-foreground select-all">{resetSuccessData.email}</span></div>
                  <div>Password: <span className="text-foreground select-all">{resetSuccessData.pass}</span></div>
                </div>

                <Button
                  onClick={() => { setShowResetModal(null); setResetSuccessData(null); }}
                  className="w-full font-bold"
                >
                  Close Panel
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-normal">
                  Reset credentials for: <br />
                  <strong className="text-foreground font-mono">{showResetModal.name} ({showResetModal.email})</strong>
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Temporary Password *</label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordVal(generateTempPassword())}
                      className="text-[9px] font-bold text-primary hover:underline"
                    >
                      Generate New
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={resetPasswordVal}
                    onChange={e => setResetPasswordVal(e.target.value)}
                    placeholder="Enter or generate password"
                    required
                  />
                </div>

                {resetError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-xl">
                    ⚠️ {resetError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowResetModal(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={resetting} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Password Reset'}
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
