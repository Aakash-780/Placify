import React, { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Building2, Save, Globe, MapPin, Image, Loader2 } from 'lucide-react';

export default function OrgSettingsPage() {
  const { roleData, refreshRole } = useRole();
  const currentOrgId = roleData?.organization_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadOrgData() {
    if (!currentOrgId) return;
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('organizations')
        .select('*')
        .eq('id', currentOrgId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setCode(data.code || '');
        setWebsite(data.website || '');
        setAddress(data.address || '');
        setLogoUrl(data.logo_url || '');
        setDisabledFeatures(data.disabled_features || []);
      }
    } catch (err: any) {
      console.error('Error loading org details:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgData();
  }, [currentOrgId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name.trim()) {
      setErrorMsg('Organization name is required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await insforge.database
        .from('organizations')
        .update({
          name: name.trim(),
          website: website.trim() || null,
          address: address.trim() || null,
          logo_url: logoUrl.trim() || null,
          disabled_features: disabledFeatures
        })
        .eq('id', currentOrgId);

      if (error) throw error;

      // Log action
      await insforge.database.from('audit_logs').insert([{
        performed_by: roleData.name || roleData.email,
        action: 'Updated Organization Settings',
        affected_user: code,
        device_info: navigator.userAgent
      }]);

      setSuccessMsg('Settings updated successfully!');
      await refreshRole();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground text-xs font-sans">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading organization configurations...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 animate-fade-in text-foreground">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span>Organization Profile Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure branding, logo asset endpoints, and general profile variables for your tenant instance.
        </p>
      </div>

      <Card className="border border-border/60 shadow-md">
        <CardHeader>
          <CardTitle>Branding & Details</CardTitle>
          <CardDescription>Update your college/organization profile variables.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Organization Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Organization Code (Read Only)</Label>
                <Input
                  value={code}
                  className="bg-muted/40 font-mono font-bold"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://college.edu"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Location Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="City, State, India"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Branding Logo Image URL</Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="pl-9 font-mono"
                />
              </div>
              {logoUrl && (
                <div className="mt-2 p-2 border border-dashed rounded-lg flex items-center justify-center bg-muted/20">
                  <img src={logoUrl} alt="Logo Preview" className="h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Features Control Card */}
            <div className="border border-border/60 rounded-xl p-4 bg-muted/5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-foreground">SubAdmin Feature Permissions</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Enable or disable specific features for subadmin coordinators. Toggling a feature off restricts subadmins immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'students', label: 'Students Management', desc: 'Verify, suspend, or update student profiles' },
                  { key: 'recruiters', label: 'Recruiters Management', desc: 'Approve, verify, or suspend employer accounts' },
                  { key: 'jobs', label: 'Job Posting & Details', desc: 'Create, modify, and delete job postings' },
                  { key: 'applications', label: 'Applications Portal', desc: 'Manage applicant reviews and selections' },
                  { key: 'analytics', label: 'Analytics Dashboard', desc: 'View placement stats and metrics' },
                  { key: 'community', label: 'Community & Forums', desc: 'Oversee community forum threads & comments' },
                  { key: 'dsa', label: 'DSA Sheets Management', desc: 'Publish and coordinate DSA sheet curriculum' },
                  { key: 'mentor', label: 'Mentor Verification', desc: 'Verify and approve alumni mentor profiles' }
                ].map((feat) => {
                  const isEnabled = !disabledFeatures.includes(feat.key);
                  return (
                    <div key={feat.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors">
                      <div className="pr-2">
                        <span className="text-[11px] font-bold text-foreground block">{feat.label}</span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5 leading-tight">{feat.desc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDisabledFeatures(prev =>
                            prev.includes(feat.key)
                              ? prev.filter(k => k !== feat.key)
                              : [...prev, feat.key]
                          );
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none ${
                          isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold">
                ✓ {successMsg}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="flex items-center gap-2 font-bold">
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Configuration
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
