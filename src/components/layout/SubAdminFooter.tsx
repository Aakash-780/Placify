import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import {
  LayoutDashboard, GraduationCap, Building2, Briefcase, Users,
  Sparkles, ExternalLink, BookMarked, MessageSquare, UserCheck,
  HelpCircle, FileText, Lock, Mail, Activity
} from 'lucide-react';

export default function SubAdminFooter() {
  const { roleData } = useRole();
  const orgName = roleData?.organizations?.name || 'Organization';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-sm mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">

        {/* Main row */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Col 1 — Main Navigation */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: LayoutDashboard, label: 'Dashboard',     to: '/dashboard' },
                { icon: GraduationCap,  label: 'Students',       to: '/admin/students' },
                { icon: Building2,      label: 'Recruiters',     to: '/admin/recruiters' },
                { icon: Briefcase,      label: 'Jobs',           to: '/jobs' },
                { icon: Users,          label: 'Applications',   to: '/admin/applicants' },
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

          {/* Col 2 — Tools & Management */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Tools & Management
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: Sparkles,      label: 'AI Explorer',            to: '/student-explorer' },
                { icon: ExternalLink,  label: 'Off-Campus Jobs',        to: '/admin/off-campus' },
                { icon: BookMarked,    label: 'DSA Sheets',             to: '/admin/manage-dsa' },
                { icon: MessageSquare, label: 'Community Threads',      to: '/forum' },
                { icon: UserCheck,     label: 'Mentor Verification',    to: '/admin/mentor-verification' },
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

          {/* Col 3 — Placement Activity */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Placement Activity
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: Users,        label: 'Pending Applications', to: '/admin/applicants' },
                { icon: GraduationCap,label: 'Student Verification', to: '/admin/students' },
                { icon: Building2,    label: 'Recruiter Access',     to: '/admin/recruiters' },
                { icon: Briefcase,    label: 'Active Drives',        to: '/jobs' },
                { icon: Activity,     label: 'Placement Stats',      to: '/dashboard' },
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

          {/* Col 4 — Legal & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
              Support & Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { icon: HelpCircle, label: 'Help & FAQs',      to: '/faqs' },
                { icon: Mail,       label: 'Contact Support',   to: '/contact' },
                { icon: FileText,   label: 'Terms of Service',  to: '/terms' },
                { icon: Lock,       label: 'Privacy Policy',    to: '/privacy' },
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
            © {year} Placify · {orgName} SubAdmin Portal
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Placify Campus Placement System
          </p>
        </div>
      </div>
    </footer>
  );
}
