import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import {
  Building2, Search, FileText, Loader2, RefreshCw, Calendar, Globe, MapPin, ExternalLink, Mail, ChevronLeft, ChevronRight, X, Key, Check, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import SubadminFeatureToggle from '@/components/SubadminFeatureToggle';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';

type PageTabType = 'verification' | 'partners';

const ITEMS_PER_PAGE = 10;

export default function OrgRecruitersPage() {
  const { roleData } = useRole();
  const orgId = roleData?.organization_id;
  const orgName = roleData?.organizations?.name || 'Organization';

  const [activeTab, setActiveTab] = useState<PageTabType>('verification');
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showRecruiterDetails, setShowRecruiterDetails] = useState<any | null>(null);
  const [showResetPass, setShowResetPass] = useState<any | null>(null);
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
      triggerToast('Password updated successfully.');
    } catch (err: any) {
      triggerToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setResetLoading(false);
    }
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
  async function handleRecruiterVerify(recruiter: any, statusVal: 'Verified' | 'Rejected' | 'Suspended') {
    try {
      const updatePayload: any = {
        verification_status: statusVal,
        verified_by: roleData?.id,
        verified_at: new Date().toISOString()
      };

      if (statusVal === 'Verified') {
        updatePayload.status = 'Active';
      } else {
        updatePayload.status = 'Suspended';
      }

      const { error } = await insforge.database
        .from('recruiters')
        .update(updatePayload)
        .eq('id', recruiter.id);

      if (error) throw error;
      triggerToast(`Recruiter '${recruiter.name}' is now marked as ${statusVal}.`);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterStatus]);

  const totalRecruitersCount = filteredRecruiters.length;
  const totalPages = Math.ceil(totalRecruitersCount / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecruitersCount);
  const paginatedRecruiters = filteredRecruiters.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-foreground">Recruiters Registry</h3>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded text-[10px] font-bold">
                  Total Count: {totalRecruitersCount}
                </span>
              </div>
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
                    <div className="w-[18%]">Company</div>
                    <div className="w-[18%]">Recruiter Name</div>
                    <div className="w-[22%]">Email Address</div>
                    <div className="w-[18%]">Validation Doc</div>
                    <div className="w-[12%] text-center">Status</div>
                    <div className="w-[12%] text-center">Actions</div>
                  </div>

                  {paginatedRecruiters.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recruiters match verification filter criteria.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {paginatedRecruiters.map(rec => {
                        const comp = parseCompany(rec.company);
                        return (
                          <div
                            key={rec.id}
                            className="flex p-4 items-center hover:bg-card/40 transition-colors text-sm cursor-pointer"
                            onClick={() => setShowRecruiterDetails(rec)}
                          >
                            <div className="w-[18%] font-bold text-foreground truncate pr-2">{comp.name}</div>
                            <div className="w-[18%] text-foreground truncate pr-2">{rec.name}</div>
                            <div className="w-[22%] font-mono text-foreground/80 text-xs truncate pr-2">{rec.email}</div>
                            <div className="w-[18%] truncate pr-2">
                              {comp.verificationDoc ? (
                                <a 
                                  href={comp.verificationDoc} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No Document</span>
                              )}
                            </div>
                            <div className="w-[12%] flex justify-center">
                              <Badge variant={
                                rec.verification_status === 'Verified' ? 'default' : 
                                rec.verification_status === 'Pending' ? 'secondary' : 'destructive'
                              } className="text-[10px] font-bold px-2 py-0.5">
                                {rec.verification_status}
                              </Badge>
                            </div>
                            <div className="w-[12%] flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-card/60 rounded-lg">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4 text-foreground/70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border border-border shadow-xl text-xs min-w-[120px]">
                                  {rec.verification_status !== 'Verified' && (
                                    <DropdownMenuItem 
                                      className="text-emerald-500 hover:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer font-semibold py-1.5"
                                      onClick={() => handleRecruiterVerify(rec, 'Verified')}
                                    >
                                      Verify
                                    </DropdownMenuItem>
                                  )}
                                  {rec.verification_status === 'Pending' && (
                                    <DropdownMenuItem 
                                      className="text-red-500 hover:text-red-400 focus:bg-red-500/10 cursor-pointer font-semibold py-1.5"
                                      onClick={() => handleRecruiterVerify(rec, 'Rejected')}
                                    >
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                                  {rec.verification_status === 'Verified' && (
                                    <>
                                      <DropdownMenuItem 
                                        className="text-purple-400 hover:text-purple-300 focus:bg-purple-500/10 cursor-pointer font-semibold py-1.5"
                                        onClick={() => {
                                          setResetPassVal(generatePassword());
                                          setResetSuccess(null);
                                          setShowResetPass(rec);
                                        }}
                                      >
                                        Reset Password
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-500 hover:text-red-400 focus:bg-red-500/10 cursor-pointer font-semibold py-1.5"
                                        onClick={() => handleRecruiterVerify(rec, 'Suspended')}
                                      >
                                        Suspend
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <div className="w-1/4 text-center">Status</div>
                    <div className="w-1/4 text-center">Actions</div>
                  </div>
                  {paginatedRecruiters.map(rec => {
                    const comp = parseCompany(rec.company);
                    return (
                      <div
                        key={rec.id}
                        className="flex p-4 items-center hover:bg-card/40 transition-colors text-sm cursor-pointer"
                        onClick={() => setShowRecruiterDetails(rec)}
                      >
                        <div className="w-1/4 font-semibold text-foreground">{rec.name}</div>
                        <div className="w-1/4 text-foreground/80">{comp.name}</div>
                        <div className="w-1/4 flex justify-center">
                          <Badge variant={rec.status === 'Active' || rec.status === 'Verified' ? 'default' : 'destructive'} className="text-[10px] font-bold px-2 py-0.5">
                            {rec.status}
                          </Badge>
                        </div>
                        <div className="w-1/4 flex justify-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-card/60 rounded-lg">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4 text-foreground/70" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border shadow-xl text-xs min-w-[120px]">
                              <DropdownMenuItem 
                                className="text-purple-400 hover:text-purple-350 focus:bg-purple-500/10 cursor-pointer font-semibold py-1.5"
                                onClick={() => {
                                  setResetPassVal(generatePassword());
                                  setResetSuccess(null);
                                  setShowResetPass(rec);
                                }}
                              >
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-yellow-450 hover:text-yellow-400 focus:bg-yellow-500/10 cursor-pointer font-semibold py-1.5"
                                onClick={() => toggleUserActiveStatus(rec)}
                              >
                                {rec.status === 'Active' || rec.status === 'Verified' ? 'Disable' : 'Enable'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-500 hover:text-red-400 focus:bg-red-500/10 cursor-pointer font-semibold py-1.5"
                                onClick={() => handleDeleteUserAccount(rec)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                  {paginatedRecruiters.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recruiters found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalRecruitersCount > 0 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground bg-card/20">
                <div>
                  Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-foreground">{endIndex}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalRecruitersCount}</span> recruiters
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
                  Reset temporary security password for recruiter:<br />
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
