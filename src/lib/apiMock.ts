import { NotificationService } from '@/services/notificationService';
import { insforge } from '@/lib/insforge';

const searchRequestTracker: number[] = [];

function isRateLimited(): boolean {
    const now = Date.now();
    const cutoff = now - 60000;
    while (searchRequestTracker.length > 0 && searchRequestTracker[0] < cutoff) {
        searchRequestTracker.shift();
    }
    // Limit to 45 requests per minute per browser session
    if (searchRequestTracker.length >= 45) {
        return true;
    }
    searchRequestTracker.push(now);
    return false;
}

if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
        const urlString = typeof input === 'string' ? input : (input as Request).url;
        
        // Check if request is targeting our mock notifications or organizations search
        if (urlString.includes('/api/notifications') || urlString.includes('/api/organizations/search')) {
            console.log(`[apiMock] Intercepted request: ${urlString}`);
            
            try {
                const url = new URL(urlString, window.location.origin);
                const method = init?.method?.toUpperCase() || 'GET';

                // Handle GET /api/organizations/search publicly
                if (url.pathname === '/api/organizations/search') {
                    if (isRateLimited()) {
                        return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
                            status: 429,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    const query = url.searchParams.get('q') || '';
                    if (query.trim().length < 3) {
                        return new Response(JSON.stringify([]), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Exclude inactive, deleted, or disabled (anything neq 'Active')
                    const { data, error } = await insforge.database
                        .from('organizations')
                        .select('id, name, code')
                        .eq('status', 'Active')
                        .ilike('name', `%${query}%`)
                        .limit(5);

                    if (error) {
                        throw error;
                    }

                    return new Response(JSON.stringify(data || []), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Get current logged-in user
                const { data: session } = await insforge.auth.getCurrentUser();
                // Check if user is logged in
                const userId = session?.user?.id;

                if (!userId) {
                    return new Response(JSON.stringify({ error: 'Unauthorized: No session active.' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Resolve correct profile ID (student.id, admin.id, or recruiter.id) from auth userId
                let profileId = userId;
                const { data: student } = await insforge.database
                    .from('students')
                    .select('id')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (student) {
                    profileId = student.id;
                } else {
                    const { data: admin } = await insforge.database
                        .from('admins')
                        .select('id')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (admin) {
                        profileId = admin.id;
                    } else {
                        const { data: recruiter } = await insforge.database
                            .from('recruiters')
                            .select('id')
                            .eq('user_id', userId)
                            .maybeSingle();

                        if (recruiter) {
                            profileId = recruiter.id;
                        }
                    }
                }



                // GET /api/notifications/unread-count
                if (method === 'GET' && url.pathname === '/api/notifications/unread-count') {
                    const { count, error } = await NotificationService.getUnreadCount(profileId);
                    if (error) throw error;
                    return new Response(JSON.stringify({ count }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // PATCH /api/notifications/read-all
                if (method === 'PATCH' && url.pathname === '/api/notifications/read-all') {
                    const { error } = await NotificationService.markAllAsRead(profileId);
                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // GET /api/notifications (paginated)
                if (method === 'GET' && url.pathname === '/api/notifications') {
                    const page = parseInt(url.searchParams.get('page') || '1');
                    const limit = parseInt(url.searchParams.get('limit') || '10');
                    const type = url.searchParams.get('type') || undefined;
                    const isReadStr = url.searchParams.get('isRead');
                    const isRead = isReadStr === 'true' ? true : isReadStr === 'false' ? false : undefined;

                    const result = await NotificationService.getNotifications(profileId, { page, limit, type, isRead });
                    if (result.error) throw result.error;

                    return new Response(JSON.stringify({
                        data: result.data,
                        total: result.total,
                        page: result.page,
                        limit: result.limit
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // PATCH /api/notifications/:id/read
                const readMatch = url.pathname.match(/^\/api\/notifications\/([a-fA-F0-9-]+)\/read$/);
                if (method === 'PATCH' && readMatch) {
                    const notificationId = readMatch[1];
                    const { error } = await NotificationService.markAsRead(notificationId);
                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // DELETE /api/notifications/:id
                const deleteMatch = url.pathname.match(/^\/api\/notifications\/([a-fA-F0-9-]+)$/);
                if (method === 'DELETE' && deleteMatch) {
                    const notificationId = deleteMatch[1];
                    const { error } = await NotificationService.deleteNotification(notificationId);
                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({ error: `Not Found: ${method} ${url.pathname}` }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err: any) {
                console.error('[apiMock] Fetch handler error:', err);
                return new Response(JSON.stringify({ error: err.message || String(err) }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return originalFetch.apply(this, arguments as any);
    };
}
