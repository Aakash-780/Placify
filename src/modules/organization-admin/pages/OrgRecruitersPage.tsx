import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { 
  Building2, Search, FileText, Loader2, RefreshCw, Calendar, Globe, MapPin, ExternalLink, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';

type PageTabType = 'verification' | 'partners';

export default function OrgRecruitersPage() {
  const { roleData } = useRole();
  const orgId = roleData?.organization_id;
  const orgName = roleData?.organizations?.name || 'Organization';

  const [activeTab, setActiveTab] = useState<PageTabType>('verification');
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [showRecruiterDetails, setShowRecruiterDetails] = useState<any | null>(null);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data: recData } = await insforge.database
        .from('recruiters')
        .select('*')
        .eq('organization_id', orgId);
      setRecruiters(recData || []);
    } catch (err) {
      console.error('Error fetching recruiters:', err);
      triggerToast('Failed to load recruiters data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  // Safe company details parser
  const parseCompany = (companyStr: string) => {
    if (!companyStr) return { name: 'N/A' };
    try {
      if (companyStr.trim().startsWith('{')) {
        const parsed = JSON.parse(companyStr);
        return {
          name: parsed.companyName || 'N/A',
          logoUrl: parsed.logoUrl || '',
          industry: parsed.industry || '',
          description: parsed.description || '',
          website: parsed.website || '',
          companyEmail: parsed.companyEmail || '',
          recruiterName: parsed.recruiterName || '',
          recruiterDesignation: parsed.recruiterDesignation || '',
          companySize: parsed.companySize || '',
          headquarters: parsed.headquarters || '',
          linkedin: parsed.linkedin || '',
          verificationDoc: parsed.verificationDoc || ''
        };
      }
    } catch (_) {}
    return { name: companyStr };
  };

  // Verification actions for recruiter
  async function handleRecruiterVerify(recruiter: any, status: 'Verified' | 'Rejected' | 'Suspended') {
    try {
      const { error } = await insforge.database
        .from('recruiters')
        .update({ 
          verification_status: status,
          verified_by: roleData.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', recruiter.id);

      if (error) throw error;
      triggerToast(`Recruiter '${recruiter.name}' is now marked as ${status}.`);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed.', 'error');
    }
  }

  // Toggle Recruiter active status
  async function toggleUserActiveStatus(recRow: any) {
    const currentStatus = recRow.status;
    const nextStatus = currentStatus === 'Active' || currentStatus === 'Verified' ? 'Suspended' : 'Active';
    
    try {
      const updatePayload = { 
        status: nextStatus, 
        verification_status: nextStatus === 'Active' ? 'Verified' : 'Suspended' 
      };

      const { error } = await insforge.database
        .from('recruiters')
        .update(updatePayload)
        .eq('id', recRow.id);

      if (error) throw error;
      triggerToast(`Recruiter status toggled to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed.', 'error');
    }
  }

  async function handleDeleteUserAccount(recRow: any) {
    if (!confirm(`Are you sure you want to permanently delete recruiter '${recRow.name}'? This is destructive.`)) return;
    try {
      const { error } = await insforge.database
        .from('recruiters')
        .delete()
        .eq('id', recRow.id);

      if (error) throw error;
      triggerToast('Recruiter account successfully removed.');
      loadData();
    } catch (err: any) {
      triggerToast(err.message || 'Delete operation failed.', 'error');
    }
  }

  const filteredRecruiters = recruiters.filter(r => {
    const company = parseCompany(r.company);
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.verification_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-foreground tracking-tight capitalize">Recruiter Management</h1>
          <p className="text-xs text-muted-foreground mt-1">{orgName} · Tenant Administration Panel</p>
        </div>

        <div className="flex items-center gap-4">
          <SubadminFeatureToggle featureKey="recruiters" />
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
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest animate-pulse">Syncing recruiters data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">Recruiters Registry</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Approve corporate registrations and review business validation documents.</p>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex bg-card p-1 border border-border rounded-xl text-xs font-bold gap-1">
              {[
                { id: 'verification', label: 'Verification Queue' },
                { id: 'partners', label: 'Corporate Partners' }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card/40 p-4 border border-border rounded-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search company or recruiter name..."
                className="pl-9 h-10 text-xs bg-card border-border text-foreground"
              />
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
                    <div className="w-1/5">Company</div>
                    <div className="w-1/5">Recruiter Name</div>
                    <div className="w-1/5">Email Address</div>
                    <div className="w-1/5">Validation Doc</div>
                    <div className="w-1/5">Status</div>
                    <div className="w-1/5 text-right">Actions</div>
                  </div>

                  {filteredRecruiters.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recruiters match verification filter criteria.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {filteredRecruiters.map(rec => {
                        const comp = parseCompany(rec.company);
                        return (
                          <div key={rec.id} className="flex p-4 items-center hover:bg-card/30 transition-colors text-sm">
                            <div className="w-1/5 font-bold text-foreground">{comp.name}</div>
                            <div className="w-1/5 text-foreground">{rec.name}</div>
                            <div className="w-1/5 font-mono text-foreground/80 text-xs">{rec.email}</div>
                            <div className="w-1/5">
                              {comp.verificationDoc ? (
                                <a 
                                  href={comp.verificationDoc} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No Document</span>
                              )}
                            </div>
                            <div className="w-1/5">
                              <Badge variant={
                                rec.verification_status === 'Verified' ? 'default' : 
                                rec.verification_status === 'Pending' ? 'secondary' : 'destructive'
                              } className="text-[10px] font-bold px-2 py-0.5">
                                {rec.verification_status}
                              </Badge>
                            </div>
                            <div className="w-1/5 flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] font-bold border-border"
                                onClick={() => setShowRecruiterDetails(rec)}
                              >
                                View Details
                              </Button>

                              {rec.verification_status !== 'Verified' && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-foreground"
                                  onClick={() => handleRecruiterVerify(rec, 'Verified')}
                                >
                                  Verify
                                </Button>
                              )}

                              {rec.verification_status === 'Pending' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-[10px] font-bold"
                                  onClick={() => handleRecruiterVerify(rec, 'Rejected')}
                                >
                                  Reject
                                </Button>
                              )}

                              {rec.verification_status === 'Verified' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] font-bold text-red-400 hover:text-red-300"
                                  onClick={() => handleRecruiterVerify(rec, 'Suspended')}
                                >
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex border-b border-border bg-card/80 p-4 font-bold uppercase tracking-wider text-foreground text-xs">
                    <div className="w-1/4">Recruiter Name</div>
                    <div className="w-1/4">Company</div>
                    <div className="w-1/4">Status</div>
                    <div className="w-1/4 text-right">Actions</div>
                  </div>
                  {filteredRecruiters.map(rec => {
                    const comp = parseCompany(rec.company);
                    return (
                      <div key={rec.id} className="flex p-4 items-center hover:bg-card/30 text-sm">
                        <div className="w-1/4 font-semibold text-foreground">{rec.name}</div>
                        <div className="w-1/4 text-foreground/80">{comp.name}</div>
                        <div className="w-1/4">
                          <Badge variant={rec.status === 'Active' || rec.status === 'Verified' ? 'default' : 'destructive'} className="text-[10px] font-bold px-2 py-0.5">
                            {rec.status}
                          </Badge>
                        </div>
                        <div className="w-1/4 flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] font-bold border-border"
                            onClick={() => setShowRecruiterDetails(rec)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] font-bold text-yellow-400"
                            onClick={() => toggleUserActiveStatus(rec)}
                          >
                            {rec.status === 'Active' || rec.status === 'Verified' ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] font-bold text-red-500"
                            onClick={() => handleDeleteUserAccount(rec)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRecruiters.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recruiters found.</div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Recruiter details */}
      {showRecruiterDetails && (() => {
        const comp = parseCompany(showRecruiterDetails.company);
        return (
          <Dialog open={!!showRecruiterDetails} onOpenChange={() => setShowRecruiterDetails(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border text-xs shadow-2xl text-foreground">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-bold">Recruiter Profile Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-border">
                    {comp.logoUrl ? <img src={comp.logoUrl} alt="" className="w-full h-full object-contain bg-white rounded-full" /> : null}
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-bold">{showRecruiterDetails.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-foreground">{showRecruiterDetails.name}</h2>
                    <p className="text-muted-foreground text-sm">{showRecruiterDetails.email}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {showRecruiterDetails.verification_status}
                      </Badge>
                      {comp.industry && <Badge variant="outline">{comp.industry}</Badge>}
                    </div>
                  </div>
                </div>
                <Separator className="border-border" />
                <div>
                  <h3 className="font-semibold text-sm text-indigo-400 flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs bg-card/30 p-4 rounded-lg border border-border">
                    <div><span className="text-muted-foreground block mb-1">Company Name</span> <span className="font-medium text-foreground">{comp.name}</span></div>
                    <div><span className="text-muted-foreground block mb-1">Industry</span> <span className="font-medium text-foreground">{comp.industry || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block mb-1">Company Size</span> <span className="font-medium text-foreground">{comp.companySize || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground block mb-1">Headquarters</span> <span className="font-medium text-foreground">{comp.headquarters || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground block mb-1">About Company</span> <span className="font-medium text-foreground/80 block leading-relaxed">{comp.description || 'No description provided.'}</span></div>
                  </div>
                </div>
                <Separator className="border-border" />
                <div>
                  <h3 className="font-semibold text-sm text-indigo-400 flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4" />
                    Professional & Verification Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs p-4 border border-border rounded-lg">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Company Website</span>
                      {comp.website ? <a href={comp.website} className="text-indigo-400 hover:text-indigo-350 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">website <ExternalLink className="w-3 h-3"/></a> : 'Not provided'}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">LinkedIn</span>
                      {comp.linkedin ? <a href={comp.linkedin} className="text-indigo-400 hover:text-indigo-350 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">linkedin <ExternalLink className="w-3 h-3"/></a> : 'Not provided'}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Validation Document</span>
                      {comp.verificationDoc ? <a href={comp.verificationDoc} className="text-orange-400 hover:text-orange-355 hover:underline inline-flex items-center gap-1 font-medium" target="_blank" rel="noreferrer">Download Document <ExternalLink className="w-3 h-3"/></a> : 'Not uploaded'}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
