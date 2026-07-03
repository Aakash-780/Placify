import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import Navbar from '@/components/navbar/Navbar';
import OrgAdminFooter from '@/components/layout/OrgAdminFooter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Shield, GraduationCap, Building2, Settings,
  ChevronLeft, ChevronRight, MapPin
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const organizationAdminNav = [
  { to: '/organization-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organization-admin/subadmins', icon: Shield, label: 'SubAdmins' },
  { to: '/organization-admin/students', icon: GraduationCap, label: 'Students' },
  { to: '/organization-admin/recruiters', icon: Building2, label: 'Recruiters' },
  { to: '/organization-admin/settings', icon: Settings, label: 'Settings' },
];

export default function OrganizationAdminLayout() {
  const { roleData } = useRole();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Org data from role context
  const orgData = roleData?.organizations;
  const orgName = orgData?.name || 'Organization';
  const orgLogo = orgData?.logo_url;
  const orgAddress = orgData?.address || '';
  const orgStatus = orgData?.status || 'Active';

  const addressParts = orgAddress.split(',').map((s: string) => s.trim());
  const city = addressParts[0] || '';
  const state = addressParts[1] || '';
  const locationStr = [city, state].filter(Boolean).join(', ');

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Branded Sidebar ── */}
      <aside
        className={cn(
          'fixed lg:relative z-50 h-full flex flex-col transition-all duration-300 ease-in-out',
          'border-r border-border bg-card',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ── Sidebar Header: Org Branding ── */}
        <div className={cn(
          'flex flex-col border-b border-border py-4 transition-all duration-300 relative overflow-hidden',
          collapsed ? 'px-2 items-center' : 'px-4'
        )}>
          {/* Subtle primary tint — works in both modes */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

          {collapsed ? (
            /* Collapsed: just org logo */
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-sm font-black text-muted-foreground">{orgName[0]}</span>
              )}
            </div>
          ) : (
            /* Expanded: full org branding */
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                  {orgLogo ? (
                    <img src={orgLogo} alt={orgName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-sm font-black text-muted-foreground">{orgName[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground leading-tight truncate">{orgName}</p>
                  {locationStr && (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {locationStr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {organizationAdminNav.map((item) => {
              const active = isActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden border',
                    collapsed && 'justify-center px-2',
                    active
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
                  )}
                >
                  {/* Active top-shine */}
                  {active && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  )}
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>



        {/* ── Collapse Button ── */}
        <div className="hidden lg:flex border-t border-border p-2">
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem('sidebarCollapsed', String(next));
            }}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs font-semibold"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
          <OrgAdminFooter />
        </main>
      </div>
    </div>
  );
}
