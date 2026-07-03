import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@insforge/react';
import { insforge } from '@/lib/insforge';

import { checkAndProcessExpiredJobs } from '@/utils/deadlineAutomation';

export type UserRole = 'student' | 'admin' | 'recruiter' | 'PLATFORM_OWNER' | 'organization_admin' | null;

interface RoleContextType {
    role: UserRole;
    roleData: any;
    loading: boolean;
    refreshRole: () => void;
    accountStatus: string | null;
    otpCode: string | null;
    profileCompleted: boolean;
    verificationStatus: string | null;
}

const RoleContext = createContext<RoleContextType>({
    role: null,
    roleData: null,
    loading: true,
    refreshRole: () => { },
    accountStatus: null,
    otpCode: null,
    profileCompleted: false,
    verificationStatus: null,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const [role, setRole] = useState<UserRole>(null);
    const [roleData, setRoleData] = useState<any>(null);
    const [accountStatus, setAccountStatus] = useState<string | null>(null);
    const [otpCode, setOtpCode] = useState<string | null>(null);
    const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const determineRole = useCallback(async () => {
        setLoading(true);
        try {
            // ── GUARD: do not make any network call until the auth SDK has
            // finished initialising (isLoaded) AND the user is signed in.
            // In incognito / unauthenticated sessions this prevents the SDK from
            // hitting /api/auth/refresh with no token and returning a 401.
            if (!isLoaded) {
                // Still waiting for the auth SDK to boot — keep loading=true.
                return;
            }

            if (!isSignedIn) {
                // Definitely not authenticated — clear state and stop.
                setRole(null);
                setRoleData(null);
                setAccountStatus(null);
                setOtpCode(null);
                setProfileCompleted(false);
                setVerificationStatus(null);
                setLoading(false);
                return;
            }

            // Fetch profile immediately after authentication
            const { data: userData, error: userErr } = await insforge.auth.getCurrentUser();
            
            if (userErr || !userData?.user) {
                setRole(null);
                setRoleData(null);
                setAccountStatus(null);
                setOtpCode(null);
                setProfileCompleted(false);
                setVerificationStatus(null);
                setLoading(false);
                return;
            }

            const sdkUser = userData.user;

            // ── DEBUG: Step 1 — Auth user identity ──────────────────────────────
            const profileRole = (sdkUser.profile?.role || null) as any;
            console.log('[ROLE DEBUG] Step 1 | Auth user loaded:', {
                userId: sdkUser.id,
                email: sdkUser.email,
                profileRole,
                storedOrgId: localStorage.getItem('placify_organization_id'),
                signupRoleInStorage: localStorage.getItem('signup_role'),
            });
            // ────────────────────────────────────────────────────────────────────

            // 1. Resolve role from profile metadata.
            //
            // ONLY admin-type roles get a fast-path from profile.role. These values
            // are written exclusively by the DB lookup below (system-controlled),
            // so they can be trusted on subsequent logins.
            //
            // 'student' and 'recruiter' from profile.role are intentionally NOT
            // fast-pathed. They always fall through to the DB lookup so admin
            // tables (super_admins → organization_admins → admins) are checked
            // first. This prevents a corrupted profile.role from permanently
            // directing an Organization Admin or SubAdmin to the student dashboard.
            //
            // The signup_role localStorage fallback has been removed. It was the
            // primary root cause: any admin logging in on a browser where a student
            // previously signed up would have their profile.role permanently set to
            // 'student' by this fallback, making the DB lookup never run.
            let resolvedRole: UserRole = null;
            if (profileRole === 'platform_owner' || profileRole === 'PLATFORM_OWNER') {
                resolvedRole = 'PLATFORM_OWNER';
            } else if (profileRole === 'admin' || profileRole === 'subadmin') {
                resolvedRole = 'admin';
            } else if (profileRole === 'organization_admin') {
                resolvedRole = 'organization_admin';
            }
            // profileRole === 'student', 'recruiter', or null → fall through to DB lookup

            console.log('[ROLE DEBUG] Step 2 | Profile fast-path result:', {
                profileRole,
                resolvedRoleFromProfile: resolvedRole,
                willRunDbLookup: !resolvedRole,
            });

            // 2. DB lookup: runs for null profile.role AND for student/recruiter
            //    profile roles (safety net for already-corrupted profiles).
            //    Priority: PLATFORM_OWNER → organization_admin → admin/subadmin → recruiter → student
            if (!resolvedRole) {
                console.log('[ROLE DEBUG] Step 3 | Running DB priority lookup...');

                // Check super_admins
                const { data: superAdmin, error: saErr } = await insforge.database
                    .from('super_admins')
                    .select('*')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .maybeSingle();
                console.log('[ROLE DEBUG]   super_admins:', { found: !!superAdmin, saErr });

                if (superAdmin) {
                    resolvedRole = 'PLATFORM_OWNER';
                    await insforge.auth.setProfile({ role: 'platform_owner' });
                } else {
                    // Check organization_admins
                    const { data: orgAdmin, error: oaErr } = await insforge.database
                        .from('organization_admins')
                        .select('id, user_id, organization_id, name, email, is_active')
                        .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                        .maybeSingle();
                    console.log('[ROLE DEBUG]   organization_admins:', { found: !!orgAdmin, orgAdmin, oaErr });

                    if (orgAdmin) {
                        resolvedRole = 'organization_admin';
                        await insforge.auth.setProfile({ role: 'organization_admin' });
                    } else {
                        // Check admins (subadmins — role = 'sub_admin')
                        const { data: admin, error: adErr } = await insforge.database
                            .from('admins')
                            .select('*')
                            .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                            .neq('role', 'organization_admin')
                            .maybeSingle();
                        console.log('[ROLE DEBUG]   admins (subadmin):', { found: !!admin, adminRole: admin?.role, adErr });

                        if (admin) {
                            resolvedRole = 'admin';
                            await insforge.auth.setProfile({ role: 'subadmin' });
                        } else {
                            // Check recruiters
                            const { data: recruiter, error: rErr } = await insforge.database
                                .from('recruiters')
                                .select('*')
                                .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                                .maybeSingle();
                            console.log('[ROLE DEBUG]   recruiters:', { found: !!recruiter, rErr });

                            if (recruiter) {
                                resolvedRole = 'recruiter';
                                await insforge.auth.setProfile({ role: 'recruiter' });
                            } else {
                                // Check students (lowest priority)
                                const { data: student, error: stErr } = await insforge.database
                                    .from('students')
                                    .select('*')
                                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                                    .maybeSingle();
                                console.log('[ROLE DEBUG]   students:', { found: !!student, stErr });

                                if (student) {
                                    resolvedRole = 'student';
                                    await insforge.auth.setProfile({ role: 'student' });
                                }
                            }
                        }
                    }
                }
            }

            console.log('[ROLE DEBUG] Step 4 | Final resolved role:', resolvedRole);

            // 3. Load the role data from the respective table
            let resolvedRoleData = null;
            let resolvedStatus = 'Active';
            let resolvedOtp = null;

            if (resolvedRole === 'PLATFORM_OWNER') {
                const { data: superAdmin } = await insforge.database
                    .from('super_admins')
                    .select('*')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .maybeSingle();
                resolvedRoleData = superAdmin;
                resolvedStatus = 'Active';
            } else if (resolvedRole === 'organization_admin') {
                // Fetch org admin data — use a simple select to avoid join failures
                const { data: orgAdmin, error: orgAdminFetchErr } = await insforge.database
                    .from('organization_admins')
                    .select('id, user_id, organization_id, name, email, is_active, must_change_password, last_login, created_at')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .maybeSingle();
                console.log('[ROLE DEBUG]   org admin data fetch:', { orgAdmin, orgAdminFetchErr });

                // Fetch the linked organization separately to avoid silent join failure
                let linkedOrg: any = null;
                if (orgAdmin?.organization_id) {
                    const { data: orgData, error: orgFetchErr } = await insforge.database
                        .from('organizations')
                        .select('*')
                        .eq('id', orgAdmin.organization_id)
                        .maybeSingle();
                    linkedOrg = orgData;
                    console.log('[ROLE DEBUG]   linked org fetch:', { linkedOrg, orgFetchErr });
                }

                // Merge organization data into roleData so downstream components work
                resolvedRoleData = orgAdmin ? { ...orgAdmin, organizations: linkedOrg } : null;

                // Safe status: if orgAdmin found but org data missing, still default to Active
                if (!orgAdmin) {
                    resolvedStatus = 'Suspended';
                } else if (linkedOrg?.status === 'Suspended') {
                    resolvedStatus = 'Suspended';
                } else if (orgAdmin.is_active === false) {
                    resolvedStatus = 'Suspended';
                } else {
                    resolvedStatus = 'Active';
                }

                if (orgAdmin?.organization_id) {
                    localStorage.setItem('placify_organization_id', orgAdmin.organization_id);
                }
            } else if (resolvedRole === 'admin') {
                const { data: admin } = await insforge.database
                    .from('admins')
                    .select('*')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .neq('role', 'organization_admin')
                    .maybeSingle();
                resolvedRoleData = admin;
                resolvedStatus = admin?.status || 'Active';
                resolvedOtp = admin?.otp || null;
                if (admin?.organization_id) {
                    localStorage.setItem('placify_organization_id', admin.organization_id);
                }
            } else if (resolvedRole === 'recruiter') {
                const { data: recruiter } = await insforge.database
                    .from('recruiters')
                    .select('*')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .maybeSingle();
                resolvedRoleData = recruiter;
                resolvedStatus = recruiter?.status || 'Verified';
                resolvedOtp = recruiter?.otp || null;
                if (recruiter?.organization_id) {
                    localStorage.setItem('placify_organization_id', recruiter.organization_id);
                }
            } else if (resolvedRole === 'student') {
                const { data: student } = await insforge.database
                    .from('students')
                    .select('*')
                    .or(`user_id.eq.${sdkUser.id},email.eq.${sdkUser.email}`)
                    .maybeSingle();
                resolvedRoleData = student;
                resolvedStatus = student?.account_status || 'Active';
                resolvedOtp = student?.otp || null;
                if (student?.organization_id) {
                    localStorage.setItem('placify_organization_id', student.organization_id);
                }
            }

            // 3.5 If role is resolved, but profile record does not exist in DB, create placeholder record
            if (resolvedRole && !resolvedRoleData && (resolvedRole === 'student' || resolvedRole === 'recruiter')) {
                const cachedOrgId = localStorage.getItem('signup_organization_id') || '00000000-0000-0000-0000-000000000001';
                const cachedCollegeId = localStorage.getItem('signup_college_id') || null;
                const otpCodeVal = Math.floor(1000 + Math.random() * 9000).toString();

                if (resolvedRole === 'student') {
                    await insforge.database.from('students').insert([{
                        user_id: sdkUser.id,
                        name: sdkUser.email.split('@')[0],
                        email: sdkUser.email,
                        cgpa: 0,
                        backlogs: 0,
                        placement_status: 'not_placed',
                        account_status: 'Pending',
                        status: 'pending',
                        verification_status: 'Pending',
                        otp: otpCodeVal,
                        organization_id: cachedOrgId,
                        college_id: cachedCollegeId,
                        profile_completed: false
                    }]);
                    
                    const { data: student } = await insforge.database
                        .from('students')
                        .select('*')
                        .eq('user_id', sdkUser.id)
                        .maybeSingle();
                    resolvedRoleData = student;
                    resolvedStatus = student?.account_status || 'Pending';
                    resolvedOtp = student?.otp || null;
                } else if (resolvedRole === 'recruiter') {
                    await insforge.database.from('recruiters').insert([{
                        user_id: sdkUser.id,
                        name: sdkUser.email.split('@')[0],
                        email: sdkUser.email,
                        status: 'Pending',
                        verification_status: 'Pending',
                        otp: otpCodeVal,
                        organization_id: cachedOrgId,
                        profile_completed: false
                    }]);

                    const { data: recruiter } = await insforge.database
                        .from('recruiters')
                        .select('*')
                        .eq('user_id', sdkUser.id)
                        .maybeSingle();
                    resolvedRoleData = recruiter;
                    resolvedStatus = recruiter?.status || 'Pending';
                    resolvedOtp = recruiter?.otp || null;
                }
            }

            // Update user_id in the respective tables if it doesn't match
            if (resolvedRoleData && resolvedRoleData.user_id !== sdkUser.id) {
                const tableMap: Record<string, string> = {
                    'PLATFORM_OWNER': 'super_admins',
                    'organization_admin': 'organization_admins',
                    'admin': 'admins',
                    'recruiter': 'recruiters',
                    'student': 'students'
                };
                const tableName = tableMap[resolvedRole];
                if (tableName) {
                    await insforge.database.from(tableName).update({ user_id: sdkUser.id }).eq('id', resolvedRoleData.id);
                    resolvedRoleData.user_id = sdkUser.id;
                }
            }

            // 4. Determine profileCompleted and verificationStatus
            let resolvedProfileCompleted = false;
            let resolvedVerificationStatus: string | null = null;

            if (resolvedRole === 'PLATFORM_OWNER' || resolvedRole === 'organization_admin' || resolvedRole === 'admin') {
                resolvedProfileCompleted = true;
                resolvedVerificationStatus = 'Approved';
            } else if (resolvedRole === 'student') {
                resolvedProfileCompleted = resolvedRoleData?.profile_completed ?? false;
                resolvedVerificationStatus = resolvedRoleData?.status || 'pending';
            } else if (resolvedRole === 'recruiter') {
                resolvedProfileCompleted = resolvedRoleData?.profile_completed ?? false;
                resolvedVerificationStatus = resolvedRoleData?.verification_status || resolvedRoleData?.status || 'Pending';
            }

            // ── DEBUG: Step 5 — Final state being committed ─────────────────
            console.log('[ROLE DEBUG] Step 5 | Committing state:', {
                resolvedRole,
                resolvedStatus,
                resolvedProfileCompleted,
                resolvedVerificationStatus,
                resolvedRoleData,
            });
            // ────────────────────────────────────────────────────────────────────

            // Fetch organization details for the active role if not already merged
            if (resolvedRoleData && resolvedRoleData.organization_id && !resolvedRoleData.organizations) {
                const { data: orgData } = await insforge.database
                    .from('organizations')
                    .select('*')
                    .eq('id', resolvedRoleData.organization_id)
                    .maybeSingle();
                if (orgData) {
                    resolvedRoleData = { ...resolvedRoleData, organizations: orgData };
                }
            }

            setRole(resolvedRole);
            setRoleData(resolvedRoleData);
            setAccountStatus(resolvedStatus);
            setOtpCode(resolvedOtp);
            setProfileCompleted(resolvedProfileCompleted);
            setVerificationStatus(resolvedVerificationStatus);
        } catch (err) {
            console.error('[RoleContext] Error determining role:', err);
            setRole(null);
            setRoleData(null);
            setAccountStatus(null);
            setOtpCode(null);
            setProfileCompleted(false);
            setVerificationStatus(null);
        } finally {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, user]);

    useEffect(() => {
        // Only run once isLoaded is true — avoids firing while the auth SDK
        // is still bootstrapping (which would cause a spurious /api/auth/refresh
        // call in incognito / unauthenticated sessions).
        if (!isLoaded) return;
        determineRole();
    }, [determineRole, isLoaded]);

    useEffect(() => {
        if (role) {
            checkAndProcessExpiredJobs().catch(err => console.error("Expired jobs check failed:", err));
        }
    }, [role]);

    return (
        <RoleContext.Provider value={{ 
            role, 
            roleData, 
            loading, 
            refreshRole: determineRole, 
            accountStatus, 
            otpCode, 
            profileCompleted, 
            verificationStatus 
        }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
