import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
    statusCode?: number;
    title?: string;
    message?: string;
}

const errorInfo: Record<number, { title: string; message: string; emoji: string }> = {
    400: { title: 'Bad Request', message: 'The request could not be understood by the server. Please check your input and try again.', emoji: '🚫' },
    401: { title: 'Unauthorized', message: 'You need to be logged in to access this page. Please sign in and try again.', emoji: '🔒' },
    403: { title: 'Forbidden', message: 'You don\'t have permission to access this resource. Contact an administrator if you believe this is an error.', emoji: '⛔' },
    404: { title: 'Page Not Found', message: 'The page you\'re looking for doesn\'t exist or has been moved. Double-check the URL or navigate back.', emoji: '🔍' },
    408: { title: 'Request Timeout', message: 'The server took too long to respond. Please check your connection and try again.', emoji: '⏳' },
    429: { title: 'Too Many Requests', message: 'You\'ve made too many requests. Please wait a moment and try again.', emoji: '🐌' },
    500: { title: 'Internal Server Error', message: 'Something went wrong on our end. Our team has been notified and is working on a fix.', emoji: '💥' },
    502: { title: 'Bad Gateway', message: 'The server received an invalid response. Please try again in a few moments.', emoji: '🌐' },
    503: { title: 'Service Unavailable', message: 'The service is temporarily unavailable due to maintenance or overload. Please try again later.', emoji: '🔧' },
    504: { title: 'Gateway Timeout', message: 'The server didn\'t respond in time. Please check your connection and try again.', emoji: '⏱️' },
};

export default function ErrorPage({ statusCode = 404, title, message }: ErrorPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const info = errorInfo[statusCode] || errorInfo[404];
    const displayTitle = title || info.title;
    const displayMessage = message || info.message;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
                {/* Animated Error Code */}
                <div className="relative">
                    <div className="text-[10rem] font-heading font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary/20 to-accent/20 select-none">
                        {statusCode}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                            <span className="text-5xl">{info.emoji}</span>
                        </div>
                    </div>
                </div>

                {/* Error Details */}
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Error {statusCode}
                    </div>
                    <h1 className="text-3xl font-heading font-bold">{displayTitle}</h1>
                    <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {displayMessage}
                    </p>
                </div>

                {/* Current Path Info */}
                <div className="px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 inline-block">
                    <p className="text-xs text-muted-foreground font-mono">
                        Requested: <span className="text-foreground">{location.pathname}</span>
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                    <Button onClick={() => window.location.reload()} variant="ghost" className="w-full sm:w-auto">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        </div>
    );
}
