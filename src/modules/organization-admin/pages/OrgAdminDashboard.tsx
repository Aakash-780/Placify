import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { insforge } from '@/lib/insforge';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, Briefcase, GraduationCap, Building2, ShieldCheck,
  Plus, CheckCircle, FileText, ChevronRight, TrendingUp,
  Award, Clock, Loader2, RefreshCw, Settings as SettingsIcon,
  Globe, MapPin, ExternalLink, Edit2, Star, Activity,
  BarChart3, BookOpen, UserCheck, Target, Shield, ArrowUpRight,
  CalendarDays, AlertTriangle, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashStats {
  totalStudents: number;
  verifiedStudents: number;
  pendingStudents: number;
  totalRecruiters: number;
  totalSubAdmins: number;
  totalJobs: number;
  totalApplications: number;
  placementPercentage: number;
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  progress,
  accent,
  link,
  loading
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  progress?: number;
  accent: string;
  link?: string;
  loading?: boolean;
}) {
  const inner = (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg select-none cursor-default h-full"
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px -8px ${accent}30`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}50`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        (e.currentTarget as HTMLDivElement).style.borderColor = '';
      }}
    >
      {/* Accent border top */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.05] dark:opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.1]"
        style={{ background: accent }}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-12 h-7" />
          <Skeleton className="w-24 h-3" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
            </div>
            {trend && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <TrendingUp className="w-2.5 h-2.5" />
                {trend}
              </span>
            )}
            {link && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-2xl font-black text-foreground tracking-tight tabular-nums">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground leading-relaxed">{sub}</p>}
          </div>
          {progress !== undefined && (
            <div className="mt-3">
              <div className="h-0.5 w-full rounded-full bg-muted">
                <div
                  className="h-0.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}80, ${accent})` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (link) return <Link to={link} className="block">{inner}</Link>;
  return inner;
}

// ─── Quick Action Card ────────────────────────────────────────────────────────

function QuickActionCard({
  icon: Icon, title, description, count, countLabel, link, accent
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  link: string;
  accent: string;
}) {
  return (
    <Link to={link} className="block group">
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md h-full"
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px -8px ${accent}25`;
          (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}40`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
          (e.currentTarget as HTMLDivElement).style.borderColor = '';
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px opacity-50"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        <div
          className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-[0.04] dark:opacity-[0.06] blur-xl"
          style={{ background: accent }}
        />

        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}12`, border: `1px solid ${accent}22` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          {count !== undefined && (
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${accent}18`, color: accent }}
            >
              {count} {countLabel}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{description}</p>
        <div className="flex items-center gap-1 text-[10px] font-bold transition-colors" style={{ color: accent }}>
          Manage <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({
  icon: Icon, text, time, color, isLast
}: {
  icon: React.ComponentType<any>;
  text: string;
  time: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        {!isLast && <div className="w-px flex-1 mt-1.5 bg-border" />}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs text-foreground leading-relaxed">{text}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ─── Analytics Card ──────────────────────────────────────────────────────────

function AnalyticsCard({
  label, value, icon: Icon, sub, color, loading
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  sub?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}
      >
        {loading ? <Skeleton className="w-5 h-5" /> : <Icon className="w-4.5 h-4.5" style={{ color }} />}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <>
            <Skeleton className="w-16 h-4 mb-1" />
            <Skeleton className="w-10 h-3" />
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-foreground tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </>
        )}
      </div>
      {sub && !loading && <p className="text-[10px] text-muted-foreground text-right">{sub}</p>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function OrgAdminDashboard() {
  const { roleData } = useRole();
  const orgId = roleData?.organization_id;
  const orgData = roleData?.organizations;
  const orgName = orgData?.name || 'Organization';
  const orgLogo = orgData?.logo_url;
  const orgAddress = orgData?.address || '';
  const orgWebsite = orgData?.website;
  const orgCode = orgData?.code || '';
  const orgStatus = orgData?.status || 'Active';
  const adminName = roleData?.name || 'Admin';
  const adminEmail = roleData?.email || '';

  // Derive city/state from address
  const addressParts = orgAddress.split(',').map((s: string) => s.trim());
  const city = addressParts[0] || '';
  const state = addressParts[1] || '';

  // Subscription calculation
  const subscription_type = orgData?.subscription_type || 'Trial';
  const subscription_status = orgData?.subscription_status || 'Active';
  const subscription_start_date = orgData?.subscription_start_date;
  const subscription_end_date = orgData?.subscription_end_date;
  const daysRemaining = subscription_end_date 
    ? Math.ceil((new Date(subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : null;

  const startDateStr = subscription_start_date 
    ? new Date(subscription_start_date).toLocaleDateString() 
    : 'N/A';
  const endDateStr = subscription_type === 'Lifetime' 
    ? 'No Expiry' 
    : (subscription_end_date ? new Date(subscription_end_date).toLocaleDateString() : 'N/A');
  const remainingStr = subscription_type === 'Lifetime' 
    ? 'Unlimited' 
    : (daysRemaining !== null ? (daysRemaining <= 0 ? '0 Days' : `${daysRemaining} Days`) : 'N/A');

  const now = new Date();
  const academicYear = `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`;

  // ── State ──
  const [stats, setStats] = useState<DashStats>({
    totalStudents: 0, verifiedStudents: 0, pendingStudents: 0,
    totalRecruiters: 0, totalSubAdmins: 0, totalJobs: 0,
    totalApplications: 0, placementPercentage: 0
  });
  const [students, setStudents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Data Loading (unchanged logic) ──
  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data: subData } = await insforge.database.from('subadmins').select('id').eq('organization_id', orgId);
      const { data: studData } = await insforge.database.from('students').select('*').eq('organization_id', orgId);
      const { data: recData } = await insforge.database.from('recruiters').select('id').eq('organization_id', orgId);
      const { data: jobData } = await insforge.database.from('jobs').select('id').eq('organization_id', orgId);
      const { data: appData } = await insforge.database
        .from('job_applications')
        .select('*, students(name, email, branch, current_year), jobs(title, company)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      const studList = studData || [];
      const subList = subData || [];
      const recList = recData || [];
      const jobList = jobData || [];
      const appList = appData || [];

      setStudents(studList);
      setApplications(appList);

      const totalStuds = studList.length;
      const verifiedStuds = studList.filter((s: any) => s.status === 'verified' || s.verification_status === 'Verified').length;
      const pendingStuds = studList.filter((s: any) => s.status === 'pending' || s.verification_status === 'Pending').length;
      const placedStudents = studList.filter((s: any) => s.placement_status === 'placed').length;
      const placementPct = totalStuds > 0 ? Math.round((placedStudents / totalStuds) * 100) : 0;

      setStats({
        totalStudents: totalStuds, verifiedStudents: verifiedStuds, pendingStudents: pendingStuds,
        totalRecruiters: recList.length, totalSubAdmins: subList.length,
        totalJobs: jobList.length, totalApplications: appList.length, placementPercentage: placementPct
      });
    } catch (err) {
      console.error('Error synchronizing multi-tenant resources:', err);
      triggerToast('Failed to load dashboard data from backend node.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const branchData = React.useMemo(() => {
    const branches: Record<string, number> = {};
    students.forEach((s: any) => {
      const b = s.branch || 'Other';
      branches[b] = (branches[b] || 0) + 1;
    });
    return Object.entries(branches).map(([name, count]) => ({ name, count }));
  }, [students]);

  const appTrend = [
    { name: 'Jan', apps: 4 }, { name: 'Feb', apps: 15 },
    { name: 'Mar', apps: 27 }, { name: 'Apr', apps: 48 },
    { name: 'May', apps: stats.totalApplications }
  ];

  const activities = [
    { icon: UserCheck, text: 'Student verification batch processed', time: '2 hours ago', color: '#10b981' },
    { icon: Building2, text: 'New recruiter access request received', time: '4 hours ago', color: '#6366f1' },
    { icon: Shield, text: 'SubAdmin permissions updated', time: 'Yesterday', color: '#f59e0b' },
    { icon: Briefcase, text: 'New placement drive created', time: '2 days ago', color: '#8b5cf6' },
    { icon: GraduationCap, text: 'Bulk student import completed', time: '3 days ago', color: '#3b82f6' },
  ];

  // Tooltip style adapts to theme via CSS vars
  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    borderRadius: 12,
    fontSize: 11,
    border: '1px solid hsl(var(--border))',
  };

  const gridStroke = 'hsl(var(--border))';
  const axisStroke = 'hsl(var(--muted-foreground))';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background font-sans text-foreground relative">

      {/* Subtle background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 p-6 lg:p-8 space-y-7 max-w-[1400px] mx-auto w-full">

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl border border-border bg-card text-xs font-semibold flex items-center gap-3 shadow-2xl text-foreground backdrop-blur-xl animate-fade-in">
            <div className={`w-2 h-2 rounded-full animate-ping ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span>{toast.message}</span>
          </div>
        )}

        {/* ── Header Toolbar ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight">{orgName} Placement Portal</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Academic Session: {academicYear}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <div className="h-8 px-3 rounded-xl border border-border bg-card flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <CalendarDays className="w-3 h-3 text-primary" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Banners */}
        {subscription_status === 'Expired' && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 animate-pulse shadow-lg shadow-red-500/5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider">Subscription Expired</h4>
              <p className="text-[10px] text-red-400 mt-0.5">Your organization's access is restricted. Please contact the platform administrators to renew or reactivate your subscription.</p>
            </div>
          </div>
        )}

        {subscription_status === 'Active' && daysRemaining !== null && daysRemaining > 0 && daysRemaining < 7 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-500 shadow-lg shadow-amber-500/5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider">Subscription Expiring Soon</h4>
              <p className="text-[10px] text-amber-400 mt-0.5">Your {subscription_type} subscription will expire in {daysRemaining} days (on {endDateStr}). Please contact the platform administrators to renew or extend.</p>
            </div>
          </div>
        )}

        {/* ── HERO & SUBSCRIPTION GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Hero details */}
          <div className="relative overflow-hidden rounded-3xl border border-border xl:col-span-3" style={{ minHeight: 220 }}>
            {/* Banner / ambient */}
            {orgLogo ? (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${orgLogo})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(40px) saturate(0.5)',
                  transform: 'scale(1.1)',
                  opacity: 0.15
                }}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.08) 0%, transparent 60%)' }}
              />
            )}

            {/* Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary/20 animate-float"
                  style={{
                    left: `${15 + i * 14}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${3 + i * 0.5}s`
                  }}
                />
              ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

            {/* Content */}
            <div className="relative p-7 lg:p-9">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left: Org info */}
                <div className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 border-border shadow-lg bg-card flex items-center justify-center">
                      {orgLogo ? (
                        <img src={orgLogo} alt={orgName} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-2xl lg:text-3xl font-black text-muted-foreground">{orgName[0]}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          background: orgStatus === 'Active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: orgStatus === 'Active' ? '#059669' : '#dc2626',
                          border: `1px solid ${orgStatus === 'Active' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`
                        }}
                      >
                        ● {orgStatus} Tenant
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                        {orgCode}
                      </span>
                    </div>
                    <h2 className="text-xl lg:text-2xl font-black text-foreground tracking-tight leading-tight">{orgName}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 italic">Placement &amp; Training Cell</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {(city || state) && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {[city, state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {orgWebsite && (
                        <a
                          href={orgWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Activity className="w-3 h-3" /> Last sync: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px h-20 bg-border mx-4 flex-shrink-0" />

                {/* Right: Admin info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Portal Administrator</p>
                      <p className="text-base font-black text-foreground">{adminName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{adminEmail}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Session: {academicYear}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/organization-admin/settings"
                        className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[11px] font-bold bg-muted hover:bg-muted/80 border border-border text-foreground transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Profile
                      </Link>
                      <Link
                        to="/organization-admin/settings"
                        className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[11px] font-bold text-primary transition-all border border-primary/30 bg-primary/8 hover:bg-primary/15"
                      >
                        <Star className="w-3 h-3" /> Branding
                      </Link>
                      {orgWebsite && (
                        <a
                          href={orgWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[11px] font-bold bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> Public Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="border border-border bg-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-500/[0.02] font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black block">Current Plan</span>
                  <h3 className="text-lg font-black text-foreground mt-0.5">{subscription_type}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  subscription_status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  subscription_status === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {subscription_status}
                </span>
              </div>

              <div className="space-y-2 text-[11px] border-t border-border/60 pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="text-foreground font-semibold font-mono">{startDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span className="text-foreground font-semibold font-mono">{endDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto Suspend:</span>
                  <span className="text-foreground font-semibold">{orgData?.auto_suspend ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Days Remaining</span>
                <span className={`text-xl font-black font-mono tracking-tight ${
                  subscription_status === 'Active' 
                    ? (daysRemaining !== null && daysRemaining < 7 ? 'text-amber-500 animate-pulse' : 'text-emerald-400')
                    : 'text-red-500'
                }`}>
                  {remainingStr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant Metrics</h3>
            <span className="text-[10px] text-muted-foreground">Updated just now</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={GraduationCap} label="Total Students" value={stats.totalStudents}
              sub={`${stats.verifiedStudents} verified · ${stats.pendingStudents} pending`}
              trend="+12%" accent="#3b82f6" link="/organization-admin/students" loading={loading}
              progress={stats.totalStudents > 0 ? (stats.verifiedStudents / stats.totalStudents) * 100 : 0}
            />
            <StatCard
              icon={CheckCircle} label="Verified Students" value={stats.verifiedStudents}
              sub={`${stats.totalStudents > 0 ? Math.round((stats.verifiedStudents / stats.totalStudents) * 100) : 0}% of total`}
              accent="#10b981" link="/organization-admin/students" loading={loading}
              progress={stats.totalStudents > 0 ? (stats.verifiedStudents / stats.totalStudents) * 100 : 0}
            />
            <StatCard
              icon={Clock} label="Pending Verification" value={stats.pendingStudents}
              sub="Awaiting review"
              accent="#f59e0b" link="/organization-admin/students" loading={loading}
            />
            <StatCard
              icon={Building2} label="Total Recruiters" value={stats.totalRecruiters}
              sub="Active corporate partners"
              accent="#8b5cf6" link="/organization-admin/recruiters" loading={loading}
            />
            <StatCard
              icon={ShieldCheck} label="SubAdmins" value={stats.totalSubAdmins}
              sub="Active coordinators"
              accent="#6366f1" link="/organization-admin/subadmins" loading={loading}
            />
            <StatCard
              icon={Briefcase} label="Active Jobs" value={stats.totalJobs}
              sub="Open positions"
              accent="#06b6d4" loading={loading}
            />
            <StatCard
              icon={FileText} label="Applications" value={stats.totalApplications}
              sub="Total submitted"
              accent="#f97316" loading={loading}
            />
            <StatCard
              icon={Award} label="Placement Rate" value={`${stats.placementPercentage}%`}
              sub={stats.placementPercentage > 0 ? '+6% vs last year' : 'No placements yet'}
              trend={stats.placementPercentage > 0 ? `${stats.placementPercentage}%` : undefined}
              accent="#ec4899" loading={loading}
              progress={stats.placementPercentage}
            />
          </div>
        </div>

        {/* ── MIDDLE ROW: Charts + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Charts (2/3) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Application Trend */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Application Volume</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Job Applications Trend</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-lg">2024–25</span>
              </div>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={appTrend}>
                      <defs>
                        <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="name" stroke={axisStroke} fontSize={10} tickLine={false} />
                      <YAxis stroke={axisStroke} fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone" dataKey="apps" stroke="#6366f1" strokeWidth={2}
                        fillOpacity={1} fill="url(#gApps)"
                        dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Branch Distribution */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrollment</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Students by Branch</p>
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : branchData.length === 0 ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No student data yet</p>
                  </div>
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="name" stroke={axisStroke} fontSize={10} tickLine={false} />
                      <YAxis stroke={axisStroke} fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed (1/3) */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timeline</p>
                <p className="text-sm font-bold text-foreground mt-0.5">Recent Activity</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              {activities.map((a, i) => (
                <ActivityItem
                  key={i}
                  icon={a.icon}
                  text={a.text}
                  time={a.time}
                  color={a.color}
                  isLast={i === activities.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── PLACEMENT ANALYTICS ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Placement Analytics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <AnalyticsCard
              icon={Users} label="Eligible Students" loading={loading}
              value={stats.verifiedStudents} color="#3b82f6"
            />
            <AnalyticsCard
              icon={CheckCircle} label="Placed Students" loading={loading}
              value={Math.round(stats.totalStudents * stats.placementPercentage / 100)} color="#10b981"
            />
            <AnalyticsCard
              icon={FileText} label="Offers Generated" loading={loading}
              value={stats.totalApplications} color="#f59e0b"
            />
            <AnalyticsCard
              icon={TrendingUp} label="Avg. Package" loading={loading}
              value="—" color="#8b5cf6" sub="LPA"
            />
            <AnalyticsCard
              icon={Star} label="Highest Package" loading={loading}
              value="—" color="#ec4899" sub="LPA"
            />
            <AnalyticsCard
              icon={Target} label="Placement %" loading={loading}
              value={`${stats.placementPercentage}%`} color="#f97316"
            />
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Management Modules</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={Shield} title="SubAdmin Management"
              description="Provision placement coordinators and manage their permissions."
              count={stats.totalSubAdmins} countLabel="Active"
              link="/organization-admin/subadmins" accent="#6366f1"
            />
            <QuickActionCard
              icon={UserCheck} title="Student Verification"
              description="Review and approve student profiles and documents."
              count={stats.pendingStudents} countLabel="Pending"
              link="/organization-admin/students" accent="#10b981"
            />
            <QuickActionCard
              icon={Building2} title="Recruiter Approval"
              description="Approve corporate access and manage recruitment partners."
              count={stats.totalRecruiters} countLabel="Total"
              link="/organization-admin/recruiters" accent="#8b5cf6"
            />
            <QuickActionCard
              icon={SettingsIcon} title="Organization Settings"
              description="Configure branding, preferences, and tenant settings."
              link="/organization-admin/settings" accent="#06b6d4"
            />
          </div>
        </div>

        {/* ── RECENT APPLICATIONS TABLE ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Applications</h3>
            <span className="text-[10px] text-muted-foreground">{applications.length} total</span>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No applications yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Applications will appear here once students start applying.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Student', 'Job Role', 'Status', 'Date'].map(h => (
                        <th key={h} className="p-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 6).map((app: any) => {
                      const statusColors: Record<string, string> = {
                        Applied: '#6366f1', Shortlisted: '#10b981', Rejected: '#ef4444',
                        Hired: '#f59e0b', Interview: '#8b5cf6'
                      };
                      const sc = statusColors[app.status] || '#6b7280';
                      return (
                        <tr key={app.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">
                                {(app.students?.name || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{app.students?.name || 'Unknown'}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{app.students?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{app.jobs?.title || 'Unknown Role'}</div>
                            <div className="text-[10px] text-muted-foreground">{app.jobs?.company}</div>
                          </td>
                          <td className="p-4">
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ color: sc, background: `${sc}15`, border: `1px solid ${sc}25` }}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground font-mono text-[10px]">
                            {new Date(app.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-10px); opacity: 0.6; }
        }
        .animate-float { animation: float linear infinite; }
      `}</style>
    </div>
  );
}
