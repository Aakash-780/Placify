import React from 'react';
import { CheckCircle, X, Home, ArrowRight, Clock, Shield } from 'lucide-react';
import { Button } from './button';

export type RegistrationRole = 'student' | 'recruiter' | 'organization' | 'generic';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  role: RegistrationRole;
  onClose: () => void;
  onGoToMain: () => void;
  /** If true, adds an email-verification note to the message */
  requiresEmailVerification?: boolean;
}

const ROLE_CONFIG: Record<
  RegistrationRole,
  { title: string; message: string; approver: string; isOrg: boolean }
> = {
  student: {
    title: 'Registration Submitted Successfully',
    message:
      'Your student registration has been submitted successfully. Your account is pending verification by the administrator. Please wait for approval.',
    approver: 'Organization Admin',
    isOrg: false,
  },
  recruiter: {
    title: 'Registration Submitted Successfully',
    message:
      'Your recruiter registration has been submitted successfully. Your account is pending verification by the administrator. Please wait for approval.',
    approver: 'Organization Admin',
    isOrg: false,
  },
  organization: {
    title: 'Registration Submitted Successfully',
    message:
      'Your organization registration has been submitted successfully. Your application is under review by the Control Center. Please wait for approval.',
    approver: 'Placify Control Center',
    isOrg: true,
  },
  generic: {
    title: 'Registration Submitted Successfully',
    message:
      'Your registration has been submitted successfully. Your account is currently under review.',
    approver: 'Administrator',
    isOrg: false,
  },
};

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  role,
  onClose,
  onGoToMain,
  requiresEmailVerification = false,
}) => {
  if (!isOpen) return null;

  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.generic;
  const accent = config.isOrg ? 'blue' : 'emerald';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'rsm-fadeIn 0.2s ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
        style={{ animation: 'rsm-scaleIn 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reg-success-title"
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${config.isOrg ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
          {/* Glowing icon */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: config.isOrg ? '#3b82f6' : '#10b981' }}
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full border-2"
              style={{
                borderColor: config.isOrg ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)',
                background: config.isOrg ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
              }}
            >
              {config.isOrg
                ? <Shield className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
                : <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
              }
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2
              id="reg-success-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              {config.title}
            </h2>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: config.isOrg ? '#3b82f6' : '#10b981' }}
            >
              {config.isOrg ? 'Under Review' : 'Pending Approval'}
            </p>
          </div>

          {/* Main message */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {config.message}{' '}
            <span className="font-semibold text-foreground/80">
              You can check your application status anytime from the main page.
            </span>
          </p>

          {/* Email verification note */}
          {requiresEmailVerification && (
            <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left">
              <p className="text-xs font-bold text-amber-500">📧 Email Verification Required</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                A 6-digit verification code has been sent to your email. Please verify your
                email, then wait for admin approval before signing in.
              </p>
            </div>
          )}

          {/* Approval info row */}
          <div className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-left text-xs">
              <p className="font-semibold text-foreground">Reviewed by</p>
              <p className="text-muted-foreground">{config.approver} — usually within 1–2 business days</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex w-full flex-col gap-2.5 pt-1">
            <Button
              onClick={onGoToMain}
              className="h-11 w-full rounded-xl font-bold"
              id="reg-success-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Main Page
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 w-full rounded-xl text-sm font-semibold"
              id="reg-success-close"
            >
              Close
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rsm-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rsm-scaleIn {
          from { opacity: 0; transform: scale(0.86); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default RegistrationSuccessModal;
