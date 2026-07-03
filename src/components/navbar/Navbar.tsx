import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser, SignedIn, SignedOut, SignInButton } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    Bell, Menu, Sun, Moon, Monitor, LogOut, User, CheckCircle2,
    XCircle, AlertTriangle, Info, Loader2, Shield, Briefcase, Key
} from 'lucide-react';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const navigate = useNavigate();
    const { user } = useUser();
    const { roleData } = useRole();
    const { theme, resolvedTheme, setTheme } = useTheme();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!roleData?.id) return;
        try {
            setNotifLoading(true);
            const res = await fetch('/api/notifications?page=1&limit=5');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
            }
            const countRes = await fetch('/api/notifications/unread-count');
            if (countRes.ok) {
                const countData = await countRes.json();
                setUnreadCount(countData.count || 0);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setNotifLoading(false);
        }
    };

    useEffect(() => {
        if (!roleData?.id) return;

        fetchNotifications();

        console.log(`[Realtime] Subscribing to notifications for ${roleData.id}`);
        insforge.realtime.connect();
        
        const channel = insforge.realtime.subscribe(`notifications:${roleData.id}`);

        const handleNewNotification = (payload: any) => {
            console.log('[Realtime] Received new notification:', payload);
            setNotifications(prev => {
                if (prev.some(n => n.id === payload.id)) return prev;
                return [payload, ...prev].slice(0, 5);
            });
            setUnreadCount(prev => prev + 1);
        };

        insforge.realtime.on('new_notification', handleNewNotification);

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => {
            clearInterval(interval);
            insforge.realtime.unsubscribe(`notifications:${roleData.id}`);
            insforge.realtime.off('new_notification', handleNewNotification);
        };
    }, [roleData?.id]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleNotificationClick = async (notif: any) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }
        if (notif.entity_type === 'job_application' && notif.entity_id) {
            navigate(`/my-applications/${notif.entity_id}`);
        } else if (notif.entity_type === 'forum_thread' && notif.entity_id) {
            navigate(`/forum/${notif.entity_id}`);
        } else if (notif.entity_type === 'profile') {
            navigate('/profile');
        } else {
            navigate('/notifications');
        }
    };

    const getRelativeTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getNotificationIcon = (type: string, entityType?: string) => {
        const t = (type || '').toLowerCase();
        const et = (entityType || '').toLowerCase();

        if (et === 'job_application') {
            if (t === 'success') return CheckCircle2;
            if (t === 'error') return XCircle;
            return Briefcase;
        }

        if (t === 'success') return CheckCircle2;
        if (t === 'error') return XCircle;
        if (t === 'warning') return AlertTriangle;
        return Info;
    };

    const getIconColors = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t === 'success') return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
        if (t === 'error') return "bg-rose-500/10 border-rose-500/20 text-rose-400";
        if (t === 'warning') return "bg-amber-500/10 border-amber-500/20 text-amber-400";
        return "bg-primary/10 border-primary/20 text-primary";
    };

    const cycleTheme = () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
    };

    return (
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                    <Menu className="w-5 h-5" />
                </Button>
                <div>
                    <p className="text-sm text-muted-foreground">
                        Welcome back{user?.profile?.name ? `, ${user.profile.name}` : ''}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={cycleTheme}
                    title={`Theme: ${theme}`}
                    className="relative"
                >
                    {theme === 'system' ? (
                        <Monitor className="w-5 h-5" />
                    ) : resolvedTheme === 'dark' ? (
                        <Moon className="w-5 h-5" />
                    ) : (
                        <Sun className="w-5 h-5" />
                    )}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl overflow-hidden animate-scale-in">
                        <div className="p-4 flex items-center justify-between border-b border-border">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />
                                <span className="font-heading font-bold text-sm text-foreground">Notifications</span>
                            </div>
                            {unreadCount > 0 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={markAllAsRead}
                                    className="h-7 text-xs font-bold text-primary hover:text-primary/80 hover:bg-muted px-2.5 rounded-lg"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="max-h-[350px] overflow-y-auto">
                            {notifLoading && notifications.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                                    <p className="text-xs text-muted-foreground">Loading notifications...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground space-y-1">
                                    <p className="text-sm font-semibold">All caught up!</p>
                                    <p className="text-xs">No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notif) => {
                                        const Icon = getNotificationIcon(notif.type, notif.entity_type);
                                        return (
                                            <div 
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={cn(
                                                    "p-4 flex gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer group relative",
                                                    !notif.is_read && "bg-primary/[0.02]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                                                    getIconColors(notif.type)
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex justify-between items-start gap-1">
                                                         <h4 className={cn(
                                                            "text-xs truncate text-foreground font-semibold group-hover:text-primary transition-colors",
                                                            !notif.is_read && "font-bold"
                                                        )}>
                                                            {notif.title || 'Notification'}
                                                        </h4>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                            {getRelativeTime(notif.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    {!notif.is_read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notif.id);
                                                            }}
                                                            className="text-[10px] font-bold text-primary hover:underline block pt-1.5"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                                {!notif.is_read && (
                                                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                        <DropdownMenuSeparator className="m-0 bg-border" />
                        <div className="p-2.5 bg-popover border-t border-border text-center">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/notifications')}
                                className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                            >
                                View All Notifications
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Separator orientation="vertical" className="h-6" />
                <SignedIn>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.profile?.avatar_url} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                        {user?.profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.profile?.name || 'User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                                <User className="w-4 h-4 mr-2" />
                                My Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/change-password')}>
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 font-bold"
                                onClick={async () => {
                                    await insforge.auth.signOut();
                                    window.location.href = '/';
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SignedIn>
                <SignedOut>
                    <SignInButton>
                        <Button size="sm">Sign In</Button>
                    </SignInButton>
                </SignedOut>
            </div>
        </header>
    );
}
