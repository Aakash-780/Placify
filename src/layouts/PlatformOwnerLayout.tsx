import React from 'react';
import { insforge } from '@/lib/insforge';

export default function PlatformOwnerLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white font-body select-none">
            <div className="max-w-md w-full border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-heading font-extrabold text-white">Placify Control Center</h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        This portal is restricted to Students, Recruiters, and Admins. Please access the Control Center application.
                    </p>
                </div>
                <a
                    href="http://localhost:3004"
                    className="inline-flex items-center justify-center w-full h-11 px-4 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/95 shadow-md shadow-primary/10 transition-colors"
                >
                    Open control.placify.in
                </a>
                <button
                    onClick={async () => {
                        await insforge.auth.signOut();
                        window.location.href = '/';
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
