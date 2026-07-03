import React, { useEffect, useState } from "react";
import PlacifyLogo from "@/components/ui/PlacifyLogo";

const messages = [
  "Analyzing your profile",
  "Matching opportunities",
  "Preparing application insights",
  "Building your dashboard",
];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        .logo-float {
          animation: float 3s ease-in-out infinite;
        }

        .progress-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>

      {/* Background Glow */}
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />

      {/* Floating Roles */}
      <div className="absolute left-[12%] top-[28%] hidden lg:block">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
          <p className="text-xs text-slate-300">Software Engineer</p>
        </div>
      </div>

      <div className="absolute right-[15%] top-[22%] hidden lg:block">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
          <p className="text-xs text-slate-300">Product Manager</p>
        </div>
      </div>

      <div className="absolute bottom-[25%] left-[20%] hidden lg:block">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
          <p className="text-xs text-slate-300">Data Analyst</p>
        </div>
      </div>

      <div className="absolute bottom-[18%] right-[18%] hidden lg:block">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
          <p className="text-xs text-slate-300">UX Designer</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg px-6">

        {/* Logo */}
        <div className="logo-float flex justify-center mb-8">
          <PlacifyLogo
            iconClassName="w-14 h-14 text-white"
            textClassName="h-9"
          />
        </div>

        {/* Tagline */}
        <p className="text-center text-slate-400 mb-10">
          Connecting talent with opportunity
        </p>

        {/* Status Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm text-slate-300">
              {messages[messageIndex]}
            </p>
          </div>

          {/* Premium Progress */}
          <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

            <div className="progress-shimmer absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>

        {/* Footer Status */}
        <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
          Preparing Workspace
        </p>
      </div>
    </div>
  );
}