import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import {
  LayoutDashboard, Shield, GraduationCap, Building2, Settings,
  HelpCircle, FileText, Lock, Mail, Activity, BookOpen, ExternalLink
} from 'lucide-react';

export default function OrgAdminFooter() {
  const { roleData } = useRole();
  const orgName = roleData?.organizations?.name || 'Organization';
  const orgWebsite = roleData?.organizations?.website;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-sm mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">

        {/* Main row */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Col 1 — Portal nav */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Portal Navigation
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', to: '/organization-admin/dashboard' },
                { icon: Shield,          label: 'SubAdmins',  to: '/organization-admin/subadmins' },
                { icon: GraduationCap,  label: 'Students',   to: '/organization-admin/students' },
                { icon: Building2,      label: 'Recruiters', to: '/organization-admin/recruiters' },
                { icon: Settings,       label: 'Settings',   to: '/organization-admin/settings' },
              ].map(({ icon: Icon, label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 — Quick actions / data */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Quick Actions
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: GraduationCap, label: 'Verify Students',     to: '/organization-admin/students' },
                { icon: Building2,     label: 'Approve Recruiters',  to: '/organization-admin/recruiters' },
                { icon: Shield,        label: 'Add SubAdmin',        to: '/organization-admin/subadmins' },
                { icon: Settings,      label: 'Update Branding',     to: '/organization-admin/settings' },
                { icon: Activity,      label: 'View Applications',   to: '/organization-admin/dashboard' },
              ].map(({ icon: Icon, label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Organisation */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              {orgName}
            </h4>
            <ul className="space-y-2.5">
              {orgWebsite && (
                <li>
                  <a
                    href={orgWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                    Official Website
                  </a>
                </li>
              )}
              <li>
                <Link
                  to="/organization-admin/settings"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <BookOpen className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  Organization Profile
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  Placement Portal
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4 — Legal & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Support & Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: HelpCircle, label: 'Help & FAQs',       to: '/faqs' },
                { icon: Mail,       label: 'Contact Support',    to: '/contact' },
                { icon: FileText,   label: 'Terms of Service',   to: '/terms' },
                { icon: Lock,       label: 'Privacy Policy',     to: '/privacy' },
              ].map(({ icon: Icon, label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {year} Placify · {orgName} Administration Portal
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Placify Campus Placement System
          </p>
        </div>
      </div>
    </footer>
  );
}
