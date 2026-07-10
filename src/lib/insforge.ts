import { createClient } from '@insforge/sdk';

const getBaseUrl = () => {
    // Route through same-origin proxy (Vite dev proxy or Vercel rewrites in production)
    // to keep cookies first-party and avoid Safari/Incognito third-party cookie blocking.
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return import.meta.env.VITE_INSFORGE_BASE_URL;
};

const rawClient = createClient({
    baseUrl: getBaseUrl(),
    anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
    // Enable session persistence and automatic token refresh so users stay logged in across page reloads.
    autoRefreshToken: true,
    persistSession: true,
});

// Helper to get active organization_id
export const getActiveOrgId = (): string | null => {
    return localStorage.getItem('placify_organization_id');
};

export const setActiveOrgId = (id: string | null) => {
    if (id) {
        localStorage.setItem('placify_organization_id', id);
    } else {
        localStorage.removeItem('placify_organization_id');
    }
};

// Helper to check if a table needs organization isolation
const TABLES_NEEDING_ISOLATION = new Set([
    'students', 'recruiters', 'admins', 'jobs', 'job_applications',
    'saved_jobs', 'notifications', 'discussion_threads', 'discussion_comments',
    'audit_logs', 'alumni', 'referral_requests', 'coding_submissions',
    'dsa_progress', 'ats_scans', 'mock_interviews', 'resume_reviews',
    'off_campus_jobs', 'interview_rounds', 'application_status_history',
    'mentor_profiles', 'dsa_questions', 'subadmins'
]);

// Create a Proxy for rawClient.database
const databaseProxy = new Proxy(rawClient.database, {
    get(target: any, prop: string | symbol) {
        if (prop === 'from') {
            return function (tableName: string) {
                const builder = target.from(tableName);

                if (!TABLES_NEEDING_ISOLATION.has(tableName)) {
                    return builder;
                }

                const orgId = getActiveOrgId();
                if (!orgId) {
                    return builder;
                }

                // Proxy the builder's methods: select, insert, update, delete, upsert
                return new Proxy(builder, {
                    get(builderTarget: any, builderProp: string | symbol) {
                        if (builderProp === 'select') {
                            return function (...args: any[]) {
                                const selectQuery = builderTarget.select(...args);
                                return selectQuery.eq('organization_id', orgId);
                            };
                        }

                        if (builderProp === 'insert') {
                            return function (values: any, ...args: any[]) {
                                const payload = Array.isArray(values)
                                    ? values.map(item => ({ ...item, organization_id: orgId }))
                                    : { ...values, organization_id: orgId };
                                return builderTarget.insert(payload, ...args);
                            };
                        }

                        if (builderProp === 'update') {
                            return function (values: any, ...args: any[]) {
                                const payload = { ...values, organization_id: orgId };
                                const updateQuery = builderTarget.update(payload, ...args);
                                return updateQuery.eq('organization_id', orgId);
                            };
                        }

                        if (builderProp === 'delete') {
                            return function (...args: any[]) {
                                const deleteQuery = builderTarget.delete(...args);
                                return deleteQuery.eq('organization_id', orgId);
                            };
                        }

                        if (builderProp === 'upsert') {
                            return function (values: any, ...args: any[]) {
                                const payload = Array.isArray(values)
                                    ? values.map(item => ({ ...item, organization_id: orgId }))
                                    : { ...values, organization_id: orgId };
                                const upsertQuery = builderTarget.upsert(payload, ...args);
                                return upsertQuery.eq('organization_id', orgId);
                            };
                        }

                        const value = Reflect.get(builderTarget, builderProp);
                        return typeof value === 'function' ? value.bind(builderTarget) : value;
                    }
                });
            };
        }

        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
    }
});

// A shared promise to deduplicate active refresh/session requests
let activeSessionPromise: Promise<any> | null = null;
let activeUserPromise: Promise<any> | null = null;

const authProxy = new Proxy(rawClient.auth, {
    get(target: any, prop: string | symbol) {
        if (prop === 'getCurrentSession') {
            return function (...args: any[]) {
                const sessionActive = localStorage.getItem('placify_session_active') === 'true';
                if (!sessionActive) {
                    // No active session hint — skip the network call entirely.
                    // This prevents spurious /api/auth/refresh calls for anonymous users.
                    console.log('[AUTH PROXY] getCurrentSession: skipping (no session_active flag)');
                    return Promise.resolve({ data: { session: null }, error: null });
                }

                // Deduplicate concurrent calls
                if (activeSessionPromise) {
                    return activeSessionPromise;
                }

                // NOTE: The raw @insforge/sdk auth client does NOT have getCurrentSession.
                // @insforge/react's InsforgeManager calls it expecting:
                //   { data: { session: { accessToken, user } }, error }
                // We implement it here by calling target.refreshSession() which sends
                // the httpOnly refresh cookie to POST /api/auth/refresh.
                console.log('[AUTH PROXY] getCurrentSession: calling refreshSession() → POST /api/auth/refresh');
                activeSessionPromise = target.refreshSession().then((res: any) => {
                    activeSessionPromise = null;
                    const accessToken = res?.data?.accessToken;
                    const user = res?.data?.user;
                    if (!accessToken || !user) {
                        console.warn(
                            '[AUTH PROXY] getCurrentSession: /api/auth/refresh returned no session.\n' +
                            'This means the browser did not send the refresh cookie.\n' +
                            'FIX: Make sure you logged in AFTER the Vite proxy Domain-strip fix was applied.\n' +
                            'Run localStorage.clear() + delete all cookies + log in fresh.'
                        );
                        localStorage.removeItem('placify_session_active');
                        return { data: { session: null }, error: null };
                    }
                    console.log('[AUTH PROXY] getCurrentSession: session restored ✓', { userId: user?.id, email: user?.email });
                    return {
                        data: {
                            session: {
                                accessToken,
                                user,
                            }
                        },
                        error: null
                    };
                }).catch((err: any) => {
                    activeSessionPromise = null;
                    console.error('[AUTH PROXY] getCurrentSession: refreshSession() threw an error:', err?.message || err);
                    localStorage.removeItem('placify_session_active');
                    return { data: { session: null }, error: null };
                });

                return activeSessionPromise;
            };
        }

        if (prop === 'getCurrentUser') {
            return function (...args: any[]) {
                const sessionActive = localStorage.getItem('placify_session_active') === 'true';
                if (!sessionActive) {
                    console.log('[AUTH PROXY] getCurrentUser: skipping (no session_active flag)');
                    return Promise.resolve({ data: { user: null }, error: null });
                }

                if (activeUserPromise) {
                    return activeUserPromise;
                }

                console.log('[AUTH PROXY] getCurrentUser: calling SDK...');
                activeUserPromise = target.getCurrentUser(...args).then((res: any) => {
                    activeUserPromise = null;
                    if (!res.data?.user) {
                        console.warn('[AUTH PROXY] getCurrentUser: user resolved to NULL — clearing session_active');
                        localStorage.removeItem('placify_session_active');
                    } else {
                        console.log('[AUTH PROXY] getCurrentUser: user loaded ✓', { userId: res.data.user?.id });
                    }
                    return res;
                }).catch((err: any) => {
                    activeUserPromise = null;
                    console.error('[AUTH PROXY] getCurrentUser: error:', err?.message || err);
                    localStorage.removeItem('placify_session_active');
                    throw err;
                });

                return activeUserPromise;
            };
        }

        if (prop === 'signOut') {
            return async function (...args: any[]) {
                console.log('[AUTH PROXY] signOut called — clearing all session storage');
                localStorage.removeItem('placify_session_active');
                localStorage.removeItem('placify_organization_id');
                return target.signOut(...args);
            };
        }

        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
    }
});

export const insforge = new Proxy(rawClient, {
    get(target: any, prop: string | symbol) {
        if (prop === 'database') {
            return databaseProxy;
        }
        if (prop === 'auth') {
            return authProxy;
        }
        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
    }
});
