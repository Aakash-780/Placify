import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChangePassword() {
  const { role, roleData, refreshRole } = useRole();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update in auth.users
      const { error: rpcErr } = await insforge.database.rpc('reset_user_password', {
        user_email: roleData?.email,
        new_password: newPassword.trim()
      });
      if (rpcErr) throw rpcErr;

      // 2. Clear force/must change password flags based on role
      if (role === 'student' && roleData?.id) {
        const { error: dbErr } = await insforge.database
          .from('students')
          .update({ force_password_change: false })
          .eq('id', roleData.id);
        if (dbErr) throw dbErr;
      } else if (role === 'organization_admin' && roleData?.id) {
        const { error: dbErr } = await insforge.database
          .from('organization_admins')
          .update({ must_change_password: false })
          .eq('id', roleData.id);
        if (dbErr) throw dbErr;
      }

      setSuccess(true);
      
      // Refresh role state
      await refreshRole();

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#030712] text-white font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/50 to-black pointer-events-none" />
      
      <Card className="max-w-md w-full border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl relative shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <CardHeader className="text-center pb-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white tracking-tight">Change Password</CardTitle>
          <CardDescription className="text-xs text-slate-400 max-w-[280px] mx-auto">
            {roleData?.force_password_change || roleData?.must_change_password ? (
              "Your password was recently reset by the administrator. Please set a new password to secure your account."
            ) : (
              "Please enter a new password to secure your account."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Password changed successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading || success}
                  required
                  className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading || success}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] tracking-wider uppercase font-bold text-slate-400">
                Confirm New Password
              </label>
              <Input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={loading || success}
                required
                className="h-11 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-3">
              {!(roleData?.force_password_change || roleData?.must_change_password) && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading || success}
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 h-11 text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || success}
                className={cn(
                  "h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-xs",
                  !(roleData?.force_password_change || roleData?.must_change_password) ? "flex-1" : "w-full"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
