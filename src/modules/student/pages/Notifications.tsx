import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Bell, Search, Trash2, CheckCircle2, XCircle, AlertTriangle, Info,
    Briefcase, Clock, CheckCheck, Loader2, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Notifications() {
    const navigate = useNavigate();
    const { roleData } = useRole();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filtering and search state
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const fetchNotifications = async () => {
        if (!roleData?.id) return;
        try {
            setLoading(true);
            
            // Build URL search params matching apiMock.ts expectations
            const url = new URL('/api/notifications', window.location.origin);
            url.searchParams.set('page', String(page));
            url.searchParams.set('limit', String(limit));
            
            if (statusFilter === 'unread') {
                url.searchParams.set('isRead', 'false');
            } else if (statusFilter === 'read') {
                url.searchParams.set('isRead', 'true');
            }
            
            if (typeFilter !== 'all') {
                url.searchParams.set('type', typeFilter);
            }
            
            const res = await fetch(url.toString());
            if (res.ok) {
                const result = await res.json();
                
                // Client-side search filtering if query is provided
                let list = result.data || [];
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    list = list.filter((n: any) => 
                        (n.title && n.title.toLowerCase().includes(q)) || 
                        (n.message && n.message.toLowerCase().includes(q))
                    );
                }
                
                setNotifications(list);
                setTotalCount(result.total || 0);
            }

            const countRes = await fetch('/api/notifications/unread-count');
            if (countRes.ok) {
                const countData = await countRes.json();
                setUnreadCount(countData.count || 0);
            }
        } catch (err) {
            console.error('Failed to load notifications page data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [roleData?.id, statusFilter, typeFilter, page]);

    // Handle search query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotifications();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking as read:', err);
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

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                fetchNotifications();
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
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
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-6 text-foreground pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                        <Bell className="w-8 h-8 text-primary animate-pulse" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold text-sm ml-2">
                                {unreadCount} unread
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage and track your placement activities notifications</p>
                </div>
                {unreadCount > 0 && (
                    <Button 
                        onClick={markAllAsRead}
                        className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-200 self-start sm:self-center font-bold text-xs rounded-xl h-9 px-4 flex items-center gap-1.5"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark All as Read
                    </Button>
                )}
            </div>

            <Separator className="bg-border" />

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Search Bar */}
                <div className="relative md:col-span-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notifications..."
                        className="pl-10 h-10 bg-background border-input hover:border-border transition-colors"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {/* Type Filter */}
                <div className="md:col-span-3">
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-10 bg-background border-input text-foreground">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="job_application">Application Status</SelectItem>
                            <SelectItem value="success">Success / Offers</SelectItem>
                            <SelectItem value="info">Info / Updates</SelectItem>
                            <SelectItem value="error">Action / Alerts</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Read Status Filter */}
                <div className="md:col-span-3 flex border border-border p-1 bg-muted/40 rounded-lg">
                    {(['all', 'unread', 'read'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                            className={cn(
                                "flex-1 text-center py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all",
                                statusFilter === status 
                                    ? "bg-primary text-primary-foreground font-bold shadow-md"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications Main List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-card border border-border/40 animate-pulse flex items-center p-5 gap-4">
                            <div className="w-10 h-10 bg-muted rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4" />
                                <div className="h-3 bg-muted rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <Card className="border-border/40 bg-card backdrop-blur-md">
                    <CardContent className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-muted/40 border border-border flex items-center justify-center text-muted-foreground/60 mb-2">
                            <Bell className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No notifications yet</h3>
                        <p className="text-sm max-w-sm">
                            We'll let you know when there's an update regarding your applications, interview schedules, or profile activities.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 animate-stagger">
                    {notifications.map((notif) => {
                        const Icon = getNotificationIcon(notif.type, notif.entity_type);
                        
                        return (
                            <Card 
                                key={notif.id}
                                className={cn(
                                    "border-border/45 bg-card hover:bg-muted/10 backdrop-blur-md transition-all duration-300 relative group overflow-hidden rounded-2xl border",
                                    !notif.is_read && "border-primary/20 shadow-md shadow-primary/5"
                                )}
                            >
                                {/* Left Accent Line for Unread notifications */}
                                {!notif.is_read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                )}
                                
                                <CardContent className="p-5 flex items-start sm:items-center justify-between gap-4">
                                    <div 
                                        className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        {/* Status Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0",
                                            getIconColors(notif.type)
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        
                                        {/* Title & Message */}
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <h3 className={cn(
                                                    "font-bold text-sm tracking-tight text-foreground hover:text-primary transition-colors",
                                                    !notif.is_read && "text-foreground font-extrabold"
                                                )}>
                                                    {notif.title || 'Notification Update'}
                                                </h3>
                                                {!notif.is_read && (
                                                    <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold py-0.5 px-1.5 rounded-md uppercase tracking-wider">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/85 pt-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{getRelativeTime(notif.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons Panel */}
                                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                        {!notif.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notif.id)}
                                                className="h-8 text-xs font-semibold text-primary hover:text-primary/90 hover:bg-muted rounded-lg px-2"
                                                title="Mark as Read"
                                            >
                                                <CheckCheck className="w-4 h-4 mr-1.5" />
                                                <span className="hidden md:inline">Mark Read</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteNotification(notif.id)}
                                            className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/20 rounded-lg"
                                            title="Delete Notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-muted-foreground font-semibold">
                        Showing page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            className="bg-card border-border hover:bg-muted text-foreground font-bold"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            className="bg-card border-border hover:bg-muted text-foreground font-bold"
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
