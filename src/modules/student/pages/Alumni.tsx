import React, { useEffect, useRef, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Users, Building2, Linkedin, Mail, GraduationCap,
    Search, Send, MessageSquare, CheckCircle, ShieldAlert, Sparkles,
    Briefcase, FileText, CheckCircle2, AlertCircle, X, Star, FileUp, Calendar, Clock, MapPin, DollarSign, Plus, Inbox, Info, HelpCircle, XCircle,
    MoreVertical, Trash2, Smile, Paperclip, Mic, UserX, Check
} from 'lucide-react';



export default function Alumni() {
    const { role, roleData } = useRole();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [activeTab, setActiveTab] = useState<'mentors' | 'conversations' | 'become-mentor'>(
        () => {
            const saved = localStorage.getItem('career-network-active-tab');
            return (saved === 'mentors' || saved === 'conversations' || saved === 'become-mentor') ? saved : 'mentors';
        }
    );
    const switchTab = (tab: 'mentors' | 'conversations' | 'become-mentor') => {
        localStorage.setItem('career-network-active-tab', tab);
        setActiveTab(tab);
    };
    const [loading, setLoading] = useState(true);

    // Core Data States
    const [mentors, setMentors] = useState<any[]>([]);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [verificationRequest, setVerificationRequest] = useState<any>(null);
    const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
    const [allSkills, setAllSkills] = useState<string[]>([]);

    // Requests lists
    const [myMentorshipRequests, setMyMentorshipRequests] = useState<any[]>([]);
    const [myReferralRequests, setMyReferralRequests] = useState<any[]>([]);
    const [myResumeReviews, setMyResumeReviews] = useState<any[]>([]);
    const [myMockInterviews, setMyMockInterviews] = useState<any[]>([]);

    const [incomingMentorship, setIncomingMentorship] = useState<any[]>([]);
    const [incomingReferral, setIncomingReferral] = useState<any[]>([]);
    const [incomingResume, setIncomingResume] = useState<any[]>([]);
    const [incomingMock, setIncomingMock] = useState<any[]>([]);

    // Search and Filter States
    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Registration Wizard State
    const [showRegisterWizard, setShowRegisterWizard] = useState(false);
    const [isResubmit, setIsResubmit] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [submittingWizard, setSubmittingWizard] = useState(false);
    const [uploadedDoc, setUploadedDoc] = useState<{ url: string; key: string } | null>(null);

    // Wizard Form Data
    const [companyName, setCompanyName] = useState('');
    const [jobRole, setJobRole] = useState('');
    const [employmentType, setEmploymentType] = useState('Full-time');
    const [ctc, setCtc] = useState('');
    const [workLocation, setWorkLocation] = useState('');
    const [batch, setBatch] = useState('');
    const [branch, setBranch] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [skills, setSkills] = useState('');
    const [aboutMe, setAboutMe] = useState('');

    const [availReferral, setAvailReferral] = useState(true);
    const [availMentorship, setAvailMentorship] = useState(true);
    const [availResume, setAvailResume] = useState(true);
    const [availMock, setAvailMock] = useState(true);
    const [availGuidance, setAvailGuidance] = useState(true);

    const [docType, setDocType] = useState('Offer Letter');
    const [companyEmail, setCompanyEmail] = useState('');
    const [placementType, setPlacementType] = useState('On Campus');

    // Re-upload workflow state
    const [reuploading, setReuploading] = useState(false);
    const [reuploadDocType, setReuploadDocType] = useState('Offer Letter');
    const [reuploadEmail, setReuploadEmail] = useState('');
    const [reuploadedFile, setReuploadedFile] = useState<{ url: string; key: string } | null>(null);


    // Action dialog state
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [actionTarget, setActionTarget] = useState<any>(null);
    const [actionType, setActionType] = useState<'review_resume' | 'mock_feedback' | 'referral_feedback' | 'view_details'>('view_details');
    const [actionInput, setActionInput] = useState('');
    const [actionMeetingLink, setActionMeetingLink] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Rating dialog state
    const [showRateDialog, setShowRateDialog] = useState(false);
    const [ratingTarget, setRatingTarget] = useState<any>(null);
    const [ratingStars, setRatingStars] = useState(5);
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    // Redesign & Messaging State Declarations
    const [email, setEmail] = useState('');
    const [showEmail, setShowEmail] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageSubject, setMessageSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [messageTargetMentor, setMessageTargetMentor] = useState<any>(null);
    const [submittingMessage, setSubmittingMessage] = useState(false);

    const [selectedConversationUser, setSelectedConversationUser] = useState<string | null>(null);
    const [selectedConversationName, setSelectedConversationName] = useState<string>('');
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
    const [deletingConversationUser, setDeletingConversationUser] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingConversation, setDeletingConversation] = useState(false);

    // Advanced Chat Feature States
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [blocks, setBlocks] = useState<any[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, { name: string; avatarUrl?: string; company?: string; role?: string; isMentor: boolean; detail?: string; bio?: string; skills?: string[] }>>({});
    const [activePresence, setActivePresence] = useState<Record<string, number>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [profileDialogUser, setProfileDialogUser] = useState<any>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    // References for scrolling and timing
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesCountRef = useRef(0);
    const prevUserRef = useRef<string | null>(null);
    const shouldForceScrollRef = useRef(false);

    // Additional Refs for Realtime Chat Features
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const lastTypingTimeRef = useRef<number>(0);
    const selectedUserRef = useRef<string | null>(null);
    const blocksRef = useRef<any[]>([]);

    // Toast states
    interface Toast {
        id: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const fetchMessagesQuietly = async () => {
        if (!roleData?.user_id) return;
        try {
            const { data: messagesData } = await insforge.database
                .from('mentor_messages')
                .select('*, mentor_profiles(*)')
                .or(`sender_id.eq.${roleData.user_id},receiver_id.eq.${roleData.user_id}`)
                .order('created_at', { ascending: false });
            if (messagesData) setMessages(messagesData);
        } catch (e) {
            console.error("Quiet message poll failed", e);
        }
    };

    // Load initial data
    const loadData = async () => {
        setLoading(true);
        try {
            if (!roleData?.user_id) {
                // If not logged in, just load verified mentors
                const { data: mentorsData } = await insforge.database
                    .from('mentor_profiles')
                    .select('*, mentor_availability(*), mentor_skills(*), mentor_reviews(*)')
                    .eq('verification_status', 'approved')
                    .order('created_at', { ascending: false });

                if (mentorsData) {
                    setMentors(mentorsData);
                    const skillsSet = new Set<string>();
                    mentorsData.forEach((m: any) => {
                        m.mentor_skills?.forEach((s: any) => {
                            if (s.skill_name) skillsSet.add(s.skill_name);
                        });
                    });
                    setAllSkills(Array.from(skillsSet));
                }
                setLoading(false);
                return;
            }

            // Fetch current user's mentor profile first (sequential step 1)
            const { data: profile } = await insforge.database
                .from('mentor_profiles')
                .select('*, mentor_availability(*), mentor_skills(*)')
                .eq('user_id', roleData.user_id)
                .maybeSingle();

            // Setup parallel queries (sequential step 2)
            const promises: any[] = [
                // 0. Public verified mentors
                insforge.database
                    .from('mentor_profiles')
                    .select('*, mentor_availability(*), mentor_skills(*), mentor_reviews(*)')
                    .eq('verification_status', 'approved')
                    .order('created_at', { ascending: false }),

                // Student's own sent requests
                // 1. Mentorship
                insforge.database
                    .from('mentorship_requests')
                    .select('*, mentor_profiles(*)')
                    .eq('student_id', roleData.user_id)
                    .order('created_at', { ascending: false }),

                // 2. Referrals
                insforge.database
                    .from('referral_requests')
                    .select('*, mentor_profiles(*)')
                    .eq('student_id', roleData.user_id)
                    .order('created_at', { ascending: false }),

                // 3. Resume Reviews
                insforge.database
                    .from('resume_reviews')
                    .select('*, mentor_profiles(*)')
                    .eq('student_id', roleData.user_id)
                    .order('created_at', { ascending: false }),

                // 4. Mock Interviews
                insforge.database
                    .from('mock_interviews')
                    .select('*, mentor_profiles(*)')
                    .eq('student_id', roleData.user_id)
                    .order('created_at', { ascending: false }),

                // 5. Chat Blocks
                insforge.database
                    .from('chat_blocks')
                    .select('*')
                    .or(`blocker_id.eq.${roleData.user_id},blocked_id.eq.${roleData.user_id}`)
            ];

            if (profile) {
                setMyProfile(profile);
                promises.push(
                    // 6. Verification requests
                    insforge.database
                        .from('mentor_verification_requests')
                        .select('*')
                        .eq('mentor_id', profile.id)
                        .order('created_at', { ascending: false }),
                    // 7. Incoming mentorship
                    insforge.database
                        .from('mentorship_requests')
                        .select('*')
                        .eq('mentor_id', profile.id)
                        .order('created_at', { ascending: false }),
                    // 8. Incoming referrals
                    insforge.database
                        .from('referral_requests')
                        .select('*')
                        .eq('mentor_id', profile.id)
                        .order('created_at', { ascending: false }),
                    // 9. Incoming resume reviews
                    insforge.database
                        .from('resume_reviews')
                        .select('*')
                        .eq('mentor_id', profile.id)
                        .order('created_at', { ascending: false }),
                    // 10. Incoming mock interviews
                    insforge.database
                        .from('mock_interviews')
                        .select('*')
                        .eq('mentor_id', profile.id)
                        .order('created_at', { ascending: false }),
                );
            } else {
                setMyProfile(null);
                setVerificationRequest(null);
                setVerificationRequests([]);
                setIncomingMentorship([]);
                setIncomingReferral([]);
                setIncomingResume([]);
                setIncomingMock([]);
            }

            const results = await Promise.all(promises);

            // Extract public mentors
            const mentorsRes = results[0];
            if (mentorsRes.data) {
                setMentors(mentorsRes.data);
                const skillsSet = new Set<string>();
                mentorsRes.data.forEach((m: any) => {
                    m.mentor_skills?.forEach((s: any) => {
                        if (s.skill_name) skillsSet.add(s.skill_name);
                    });
                });
                setAllSkills(Array.from(skillsSet));
            }

            // Extract student's own requests
            if (results[1].data) setMyMentorshipRequests(results[1].data);
            if (results[2].data) setMyReferralRequests(results[2].data);
            if (results[3].data) setMyResumeReviews(results[3].data);
            if (results[4].data) setMyMockInterviews(results[4].data);
            
            // Extract Chat Blocks
            if (results[5].data) setBlocks(results[5].data);

            // Extract mentor's incoming requests (if exists)
            if (profile && results.length > 6) {
                if (results[6].data) {
                    setVerificationRequests(results[6].data);
                    // Use the most recent *rejected* request for the rejection card,
                    // so the admin reason is always visible even after a re-pending resubmit.
                    const rejectedReq = results[6].data.find((r: any) => r.status === 'rejected');
                    setVerificationRequest(rejectedReq || results[6].data[0] || null);
                }
                if (results[7].data) setIncomingMentorship(results[7].data);
                if (results[8].data) setIncomingReferral(results[8].data);
                if (results[9].data) setIncomingResume(results[9].data);
                if (results[10].data) setIncomingMock(results[10].data);
            }

            // Quietly fetch messages for current user
            await fetchMessagesQuietly();

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [role, roleData]);

    useEffect(() => {
        if (!roleData?.user_id) return;
        const interval = setInterval(() => {
            fetchMessagesQuietly();
        }, 5000);
        return () => clearInterval(interval);
    }, [roleData?.user_id]);

    // Update Refs
    useEffect(() => {
        selectedUserRef.current = selectedConversationUser;
    }, [selectedConversationUser]);

    useEffect(() => {
        blocksRef.current = blocks;
    }, [blocks]);

    // Real-time Presence, Messages, Receipts, and Typing subscriptions
    useEffect(() => {
        if (!roleData?.user_id) return;

        let mounted = true;

        const handleHeartbeat = (payload: any) => {
            if (payload?.user_id) {
                setActivePresence(prev => ({
                    ...prev,
                    [payload.user_id]: Date.now()
                }));
            }
        };

        const handleNewMessage = (payload: any) => {
            // Discard if user blocked
            const isBlockedUser = blocksRef.current.some(b => 
                (b.blocker_id === roleData.user_id && b.blocked_id === payload.sender_id) ||
                (b.blocker_id === payload.sender_id && b.blocked_id === roleData.user_id)
            );
            if (isBlockedUser) return;

            setMessages(prev => {
                if (prev.some(m => m.id === payload.id)) return prev;
                return [payload, ...prev];
            });

            // Check if currently viewing this sender's conversation
            if (selectedUserRef.current === payload.sender_id) {
                markConversationAsRead(payload.sender_id);
                // Broadcast seen receipt immediately
                insforge.realtime.publish(`chat_user_${payload.sender_id}`, 'message_read', {
                    reader_id: roleData.user_id
                });
            }
        };

        const handleMessageRead = (payload: any) => {
            if (payload?.reader_id === selectedUserRef.current) {
                setMessages(prev => prev.map(m => {
                    if (m.receiver_id === payload.reader_id && !m.is_read) {
                        return { ...m, is_read: true };
                    }
                    return m;
                }));
            }
        };

        const handleTyping = (payload: any) => {
            if (payload?.sender_id === selectedUserRef.current) {
                setTypingUsers(prev => ({
                    ...prev,
                    [payload.sender_id]: !!payload.is_typing
                }));
            }
        };

        const initRealtime = async () => {
            try {
                await insforge.realtime.connect();
                if (!mounted) return;

                // Subscribe to channels
                await insforge.realtime.subscribe('presence:global');
                await insforge.realtime.subscribe(`chat_user_${roleData.user_id}`);

                insforge.realtime.on('heartbeat', handleHeartbeat);
                insforge.realtime.on('new_message', handleNewMessage);
                insforge.realtime.on('message_read', handleMessageRead);
                insforge.realtime.on('typing', handleTyping);

            } catch (e) {
                console.error("Realtime initialization failed", e);
            }
        };

        initRealtime();

        const heartbeatInterval = setInterval(() => {
            if (insforge.realtime.isConnected) {
                insforge.realtime.publish('presence:global', 'heartbeat', {
                    user_id: roleData.user_id
                });
            }
        }, 5000);

        return () => {
            mounted = false;
            clearInterval(heartbeatInterval);
            insforge.realtime.unsubscribe('presence:global');
            insforge.realtime.unsubscribe(`chat_user_${roleData.user_id}`);
            insforge.realtime.off('heartbeat', handleHeartbeat);
            insforge.realtime.off('new_message', handleNewMessage);
            insforge.realtime.off('message_read', handleMessageRead);
            insforge.realtime.off('typing', handleTyping);
        };
    }, [roleData?.user_id]);

    // Fetch user profiles for all conversation partners (cache)
    useEffect(() => {
        if (!roleData?.user_id || messages.length === 0) return;
        
        const fetchProfiles = async () => {
            const conversations = getConversations();
            const missingIds = conversations
                .map(c => c.userId)
                .filter(id => !userProfiles[id]);
            
            if (missingIds.length === 0) return;
            
            const promises = missingIds.map(async (otherId) => {
                const existingMentor = mentors.find(m => m.user_id === otherId);
                if (existingMentor) {
                    return {
                        id: otherId,
                        profile: {
                            name: existingMentor.name,
                            avatarUrl: existingMentor.avatar_url,
                            company: existingMentor.company_name,
                            role: existingMentor.job_role,
                            isMentor: true,
                            detail: `${existingMentor.company_name || 'N/A'} • ${existingMentor.job_role || 'Mentor'} • Verified Mentor`,
                            bio: existingMentor.about_me,
                            skills: existingMentor.mentor_skills?.map((s: any) => s.skill_name) || []
                        }
                    };
                }

                // Try fetching from mentor_profiles table
                const { data: mentor } = await insforge.database
                    .from('mentor_profiles')
                    .select('*, mentor_skills(*)')
                    .eq('user_id', otherId)
                    .maybeSingle();
                
                if (mentor) {
                    return {
                        id: otherId,
                        profile: {
                            name: mentor.name,
                            avatarUrl: mentor.avatar_url,
                            company: mentor.company_name,
                            role: mentor.job_role,
                            isMentor: true,
                            detail: `${mentor.company_name || 'N/A'} • ${mentor.job_role || 'Mentor'} • Verified Mentor`,
                            bio: mentor.about_me,
                            skills: mentor.mentor_skills?.map((s: any) => s.skill_name) || []
                        }
                    };
                }

                // Try fetching from students table
                const { data: student } = await insforge.database
                    .from('students')
                    .select('*')
                    .eq('user_id', otherId)
                    .maybeSingle();
                
                if (student) {
                    return {
                        id: otherId,
                        profile: {
                            name: student.name,
                            avatarUrl: student.profile_photo_url,
                            isMentor: false,
                            detail: `${student.branch || 'N/A'} • Batch ${student.graduation_year || 'N/A'} • Student`,
                            bio: student.bio || '',
                            skills: student.skills || []
                        }
                    };
                }

                const convItem = conversations.find(c => c.userId === otherId);
                return {
                    id: otherId,
                    profile: {
                        name: convItem?.userName || 'User',
                        isMentor: false,
                        detail: 'Student',
                        bio: '',
                        skills: []
                    }
                };
            });

            const results = await Promise.all(promises);
            const newProfiles = { ...userProfiles };
            results.forEach(res => {
                newProfiles[res.id] = res.profile;
            });
            setUserProfiles(newProfiles);
        };

        fetchProfiles();
    }, [messages, roleData?.user_id, mentors]);

    // Auto-Scroll Logic: track and control scroll positions precisely
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const filteredMessages = messages
            .filter(m =>
                (m.sender_id === roleData?.user_id && m.receiver_id === selectedConversationUser) ||
                (m.receiver_id === roleData?.user_id && m.sender_id === selectedConversationUser)
            )
            .slice()
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const count = filteredMessages.length;
        if (count === 0) {
            prevMessagesCountRef.current = 0;
            return;
        }

        const lastMessage = filteredMessages[count - 1];
        const isMySentMessage = lastMessage?.sender_id === roleData?.user_id;

        // Reset scroll position to bottom instantly when opening a conversation
        if (prevUserRef.current !== selectedConversationUser) {
            prevUserRef.current = selectedConversationUser;
            prevMessagesCountRef.current = count;
            container.scrollTop = container.scrollHeight;
            return;
        }

        const isNewMessageArrived = count > prevMessagesCountRef.current;
        prevMessagesCountRef.current = count;

        if (isNewMessageArrived) {
            if (isMySentMessage) {
                // Force scroll for user's own sent message
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } else {
                // Scroll if near bottom (within 150px)
                const scrollOffset = container.scrollHeight - container.clientHeight - container.scrollTop;
                if (scrollOffset <= 150) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            }
        }
    }, [messages, selectedConversationUser, roleData?.user_id]);

    useEffect(() => {
        if (myProfile) {
            setCompanyName(myProfile.company_name || '');
            setJobRole(myProfile.job_role || '');
            setEmploymentType(myProfile.employment_type || 'Full-time');
            setCtc(myProfile.ctc || '');
            setWorkLocation(myProfile.work_location || '');
            setBatch(myProfile.batch || '');
            setBranch(myProfile.branch || '');
            setLinkedinUrl(myProfile.linkedin_url || '');
            setAboutMe(myProfile.about_me || '');
            setEmail(myProfile.email || '');
            setShowEmail(!!myProfile.show_email);
            setPlacementType(myProfile.placement_type || 'On Campus');
            
            if (myProfile.mentor_skills) {
                const skillNames = myProfile.mentor_skills.map((s: any) => s.skill_name).join(', ');
                setSkills(skillNames);
            }
            
            const avail = myProfile.mentor_availability?.[0] || {};
            setAvailReferral(!!avail.available_for_referral);
            setAvailMentorship(!!avail.available_for_mentorship);
            setAvailResume(!!avail.available_for_resume_review);
            setAvailMock(!!avail.available_for_mock_interview);
            setAvailGuidance(!!avail.available_for_career_guidance);
        }
    }, [myProfile]);

    const [savingSettings, setSavingSettings] = useState(false);
    const handleSaveSettings = async () => {
        if (!myProfile) return;
        setSavingSettings(true);
        try {
            const { error: profileError } = await insforge.database
                .from('mentor_profiles')
                .update({
                    company_name: companyName,
                    job_role: jobRole,
                    employment_type: employmentType,
                    ctc: ctc || null,
                    work_location: workLocation,
                    batch,
                    branch,
                    placement_type: placementType,
                    linkedin_url: linkedinUrl,
                    about_me: aboutMe,
                    email: email || null,
                    show_email: showEmail
                })
                .eq('id', myProfile.id);

            if (profileError) throw profileError;

            // Upsert availability
            const { error: availError } = await insforge.database
                .from('mentor_availability')
                .upsert({
                    mentor_id: myProfile.id,
                    available_for_referral: availReferral,
                    available_for_mentorship: availMentorship,
                    available_for_resume_review: availResume,
                    available_for_mock_interview: availMock,
                    available_for_career_guidance: availGuidance
                }, { onConflict: 'mentor_id' });

            if (availError) throw availError;

            // Update skills
            await insforge.database.from('mentor_skills').delete().eq('mentor_id', myProfile.id);
            if (skills.trim()) {
                const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
                const skillsInserts = skillsArr.map(s => ({
                    mentor_id: myProfile.id,
                    skill_name: s
                }));
                const { error: skillsError } = await insforge.database.from('mentor_skills').insert(skillsInserts);
                if (skillsError) throw skillsError;
            }

            showToast("Profile settings updated successfully!", "success");
            loadData();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setSavingSettings(false);
        }
    };

    // Reusable file upload helper
    const handleFileUpload = async (file: File, folder: string) => {
        if (!roleData?.id) return null;
        try {
            const path = `${roleData.id}/${folder}_${Date.now()}_${file.name}`;
            const { data, error } = await insforge.storage.from('certificates').upload(path, file);
            if (error || !data) {
                showToast("File upload failed: " + (error?.message || "No data returned"), "error");
                return null;
            }
            showToast("File uploaded successfully!", "success");
            return { url: data.url, key: data.key };
        } catch (err: any) {
            showToast("Upload error: " + err.message, "error");
            return null;
        }
    };

    // Re-submission flow for Mentors who have info requested
    const handleReuploadSubmit = async () => {
        if (!myProfile || !reuploadedFile) return;
        setReuploading(true);
        try {
            // Update request
            const { error: reqError } = await insforge.database
                .from('mentor_verification_requests')
                .update({
                    document_url: reuploadedFile.url,
                    document_key: reuploadedFile.key,
                    document_type: reuploadDocType,
                    company_email: reuploadEmail || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
                .eq('mentor_id', myProfile.id);

            if (reqError) throw reqError;

            // Reset mentor profile status
            const { error: profileError } = await insforge.database
                .from('mentor_profiles')
                .update({
                    verification_status: 'pending',
                    is_verified: false
                })
                .eq('id', myProfile.id);

            if (profileError) throw profileError;

            showToast("Documents submitted successfully for re-verification!", "success");
            setReuploadedFile(null);
            setReuploadEmail('');
            loadData();
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setReuploading(false);
        }
    };

    const handleStartResubmit = () => {
        if (!myProfile) return;
        setCompanyName(myProfile.company_name || '');
        setJobRole(myProfile.job_role || '');
        setEmploymentType(myProfile.employment_type || 'Full-time');
        setWorkLocation(myProfile.work_location || '');
        setCtc(myProfile.ctc || '');
        setBatch(myProfile.batch || '');
        setBranch(myProfile.branch || '');
        setPlacementType(myProfile.placement_type || 'On Campus');
        setLinkedinUrl(myProfile.linkedin_url || '');
        setAboutMe(myProfile.about_me || '');
        setEmail(myProfile.email || '');
        setShowEmail(!!myProfile.show_email);
        
        // Skills
        if (myProfile.mentor_skills) {
            const skillNames = myProfile.mentor_skills.map((s: any) => s.skill_name).join(', ');
            setSkills(skillNames);
        } else {
            setSkills('');
        }

        // Availability
        const avail = myProfile.mentor_availability?.[0] || {};
        setAvailReferral(!!avail.available_for_referral);
        setAvailMentorship(!!avail.available_for_mentorship);
        setAvailResume(!!avail.available_for_resume_review);
        setAvailMock(!!avail.available_for_mock_interview);
        setAvailGuidance(!!avail.available_for_career_guidance);

        setUploadedDoc(null); // Force upload document again for resubmission
        setWizardStep(1);
        setIsResubmit(true);
        setShowRegisterWizard(true);
    };

    // Register Mentor Flow
    const handleRegisterMentor = async () => {
        if (!roleData?.user_id) return;
        setSubmittingWizard(true);
        try {
            let mentorId = '';
            if (myProfile) {
                // UPDATE profile
                const { data: mentor, error: mentorError } = await insforge.database
                    .from('mentor_profiles')
                    .update({
                        company_name: companyName,
                        job_role: jobRole,
                        employment_type: employmentType,
                        ctc: ctc || null,
                        work_location: workLocation,
                        batch,
                        branch,
                        placement_type: placementType,
                        linkedin_url: linkedinUrl,
                        about_me: aboutMe,
                        is_verified: false,
                        verification_status: 'pending',
                        email: email || null,
                        show_email: showEmail
                    })
                    .eq('id', myProfile.id)
                    .select()
                    .single();

                if (mentorError) throw mentorError;
                mentorId = mentor.id;

                // Update availability
                const { error: availError } = await insforge.database
                    .from('mentor_availability')
                    .upsert({
                        mentor_id: mentorId,
                        available_for_referral: availReferral,
                        available_for_mentorship: availMentorship,
                        available_for_resume_review: availResume,
                        available_for_mock_interview: availMock,
                        available_for_career_guidance: availGuidance
                    }, { onConflict: 'mentor_id' });

                if (availError) console.error(availError);

                // Update skills
                await insforge.database.from('mentor_skills').delete().eq('mentor_id', mentorId);
                if (skills.trim()) {
                    const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
                    const skillsInserts = skillsArr.map(s => ({
                        mentor_id: mentorId,
                        skill_name: s
                    }));
                    await insforge.database.from('mentor_skills').insert(skillsInserts);
                }
            } else {
                // INSERT profile
                const { data: mentor, error: mentorError } = await insforge.database
                    .from('mentor_profiles')
                    .insert([{
                        user_id: roleData.user_id,
                        name: roleData.name || 'Anonymous Mentor',
                        avatar_url: roleData.profile_photo_url || null,
                        company_name: companyName,
                        job_role: jobRole,
                        employment_type: employmentType,
                        ctc: ctc || null,
                        work_location: workLocation,
                        batch,
                        branch,
                        placement_type: placementType,
                        linkedin_url: linkedinUrl,
                        about_me: aboutMe,
                        is_verified: false,
                        verification_status: 'pending',
                        email: email || null,
                        show_email: showEmail
                    }])
                    .select()
                    .single();

                if (mentorError) {
                    showToast(mentorError.message, "error");
                    setSubmittingWizard(false);
                    return;
                }
                mentorId = mentor.id;

                // Insert availability
                const { error: availError } = await insforge.database
                    .from('mentor_availability')
                    .insert([{
                        mentor_id: mentorId,
                        available_for_referral: availReferral,
                        available_for_mentorship: availMentorship,
                        available_for_resume_review: availResume,
                        available_for_mock_interview: availMock,
                        available_for_career_guidance: availGuidance
                    }]);

                if (availError) console.error(availError);

                // Insert skills
                if (skills.trim()) {
                    const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
                    const skillsInserts = skillsArr.map(s => ({
                        mentor_id: mentorId,
                        skill_name: s
                    }));
                    await insforge.database.from('mentor_skills').insert(skillsInserts);
                }
            }

            // Common: Insert verification request
            if (uploadedDoc) {
                const { error: verifyError } = await insforge.database
                    .from('mentor_verification_requests')
                    .insert([{
                        mentor_id: mentorId,
                        document_url: uploadedDoc.url,
                        document_key: uploadedDoc.key,
                        document_type: docType,
                        company_email: companyEmail || null,
                        status: 'pending'
                    }]);
                if (verifyError) console.error(verifyError);
            }

            showToast("Registration submitted! Pending admin verification.", "success");
            setShowRegisterWizard(false);
            setWizardStep(1);
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSubmittingWizard(false);
        }
    };


    // Action execution by Mentor
    const handleExecuteAction = async () => {
        if (!actionTarget) return;
        setSubmittingAction(true);
        try {
            if (actionType === 'review_resume') {
                const { error } = await insforge.database
                    .from('resume_reviews')
                    .update({
                        status: 'completed',
                        suggestions: actionInput,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', actionTarget.id);
                if (error) throw error;
                showToast("Resume review submitted successfully!", "success");
            } else if (actionType === 'mock_feedback') {
                const isAccepting = actionTarget.status === 'pending';
                const { error } = await insforge.database
                    .from('mock_interviews')
                    .update({
                        status: isAccepting ? 'accepted' : 'completed',
                        meeting_link: isAccepting ? actionMeetingLink : actionTarget.meeting_link,
                        feedback: isAccepting ? null : actionInput,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', actionTarget.id);
                if (error) throw error;
                showToast(isAccepting ? "Mock interview scheduled!" : "Mock interview feedback submitted!", "success");
            } else if (actionType === 'referral_feedback') {
                const { error } = await insforge.database
                    .from('referral_requests')
                    .update({
                        status: 'completed',
                        feedback: actionInput,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', actionTarget.id);
                if (error) throw error;
                showToast("Referral application updated!", "success");
            }

            // Send reply message notification
            const senderName = roleData.name || 'Mentor';
            const receiverName = 'Student';
            const msgText = 
                actionType === 'review_resume' ? `📝 Resume Review feedback submitted: "${actionInput}"` :
                actionType === 'mock_feedback' && actionTarget.status === 'pending' ? `📅 Mock Interview accepted! Meeting Link: ${actionMeetingLink}` :
                actionType === 'mock_feedback' ? `📅 Mock Interview feedback submitted: "${actionInput}"` :
                `💼 Referral status updated: "${actionInput}"`;

            await insforge.database
                .from('mentor_messages')
                .insert([{
                    sender_id: roleData.user_id,
                    sender_name: senderName,
                    receiver_id: actionTarget.student_id,
                    receiver_name: receiverName,
                    mentor_id: myProfile?.id || null,
                    message: msgText,
                    is_read: false
                }]);

            setShowActionDialog(false);
            setActionInput('');
            setActionMeetingLink('');
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSubmittingAction(false);
        }
    };

    // Send Direct Message Flow
    const handleSendDirectMessage = async () => {
        if (!messageTargetMentor || !roleData?.user_id) return;
        setSubmittingMessage(true);
        try {
            const senderName = roleData.name || 'Student';
            const receiverName = messageTargetMentor.name || 'Mentor';
            const receiverId = messageTargetMentor.user_id;

            // Check if blocked
            const isBlockedByMe = blocks.some(b => b.blocker_id === roleData.user_id && b.blocked_id === receiverId);
            const hasBlockedMe = blocks.some(b => b.blocker_id === receiverId && b.blocked_id === roleData.user_id);
            if (isBlockedByMe || hasBlockedMe) {
                showToast("You cannot message a blocked user.", "error");
                return;
            }

            const receiverOnline = activePresence[receiverId] && (Date.now() - activePresence[receiverId] < 15000);

            // 1. Insert into mentor_messages
            const { data: insertedMsg, error: msgErr } = await insforge.database
                .from('mentor_messages')
                .insert([{
                    sender_id: roleData.user_id,
                    sender_name: senderName,
                    receiver_id: receiverId,
                    receiver_name: receiverName,
                    mentor_id: messageTargetMentor.id,
                    message: messageText,
                    is_read: false,
                    is_delivered: !!receiverOnline
                }])
                .select()
                .single();
            
            if (msgErr) throw msgErr;

            if (insertedMsg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === insertedMsg.id)) return prev;
                    return [insertedMsg, ...prev];
                });

                if (insforge.realtime.isConnected) {
                    insforge.realtime.publish(`chat_user_${receiverId}`, 'new_message', insertedMsg);
                }
            }

            // 2. Fetch student ID of receiver if available
            const { data: recipientStudent } = await insforge.database
                .from('students')
                .select('id')
                .eq('user_id', receiverId)
                .maybeSingle();

            const notificationUserId = recipientStudent?.id || receiverId;

            // 3. Insert notification
            await insforge.database
                .from('notifications')
                .insert([{
                    user_id: notificationUserId,
                    message: `New message from ${senderName}: "${messageText.substring(0, 40)}..."`,
                    type: 'info',
                    is_read: false
                }]);

            // Add user to active_chat_users list helper
            try {
                const activeUsers = JSON.parse(localStorage.getItem('active_chat_users') || '[]');
                if (!activeUsers.some((u: any) => u.userId === receiverId)) {
                    activeUsers.push({ userId: receiverId, userName: receiverName });
                    localStorage.setItem('active_chat_users', JSON.stringify(activeUsers));
                }
            } catch (e) {
                console.error("Failed to add active chat user to storage", e);
            }

            showToast("Message sent successfully!", "success");
            setShowMessageModal(false);
            setMessageText('');
            
            // Navigate directly to the newly started conversation
            setSelectedConversationUser(receiverId);
            setSelectedConversationName(receiverName);
            switchTab('conversations');
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSubmittingMessage(false);
        }
    };

    // Send Conversation Reply Flow
    const handleSendReply = async (receiverId: string, receiverName: string, isFromMentor: boolean) => {
        if (!replyText.trim() || !roleData?.user_id) return;

        // Check if blocked
        const isBlockedByMe = blocks.some(b => b.blocker_id === roleData.user_id && b.blocked_id === receiverId);
        const hasBlockedMe = blocks.some(b => b.blocker_id === receiverId && b.blocked_id === roleData.user_id);
        if (isBlockedByMe || hasBlockedMe) {
            showToast("You cannot message a blocked user.", "error");
            return;
        }

        setSendingReply(true);
        try {
            const senderName = roleData.name || (isFromMentor ? 'Mentor' : 'Student');
            const receiverOnline = activePresence[receiverId] && (Date.now() - activePresence[receiverId] < 15000);
            
            // 1. Insert reply
            const { data: insertedMsg, error: msgErr } = await insforge.database
                .from('mentor_messages')
                .insert([{
                    sender_id: roleData.user_id,
                    sender_name: senderName,
                    receiver_id: receiverId,
                    receiver_name: receiverName,
                    mentor_id: myProfile?.id || null,
                    message: replyText,
                    is_read: false,
                    is_delivered: !!receiverOnline
                }])
                .select()
                .single();

            if (msgErr) throw msgErr;

            if (insertedMsg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === insertedMsg.id)) return prev;
                    return [insertedMsg, ...prev];
                });

                if (insforge.realtime.isConnected) {
                    insforge.realtime.publish(`chat_user_${receiverId}`, 'new_message', insertedMsg);
                }
            }

            // 2. Insert notification
            const { data: recipientStudent } = await insforge.database
                .from('students')
                .select('id')
                .eq('user_id', receiverId)
                .maybeSingle();

            const notificationUserId = recipientStudent?.id || receiverId;
            await insforge.database
                .from('notifications')
                .insert([{
                    user_id: notificationUserId,
                    message: `New reply from ${senderName}: "${replyText.substring(0, 45)}..."`,
                    type: 'info',
                    is_read: false
                }]);

            setReplyText('');
            showToast("Reply sent!", "success");
            
            // Reload messages
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSendingReply(false);
        }
    };

    // Mark Messages as Read Flow
    const markConversationAsRead = async (otherUserId: string) => {
        if (!roleData?.user_id) return;
        try {
            await insforge.database
                .from('mentor_messages')
                .update({ is_read: true })
                .eq('receiver_id', roleData.user_id)
                .eq('sender_id', otherUserId)
                .eq('is_read', false);
            
            // Broadcast read receipt
            if (insforge.realtime.isConnected) {
                insforge.realtime.publish(`chat_user_${otherUserId}`, 'message_read', {
                    reader_id: roleData.user_id
                });
            }

            // Quietly fetch messages again to clear unread counts
            const { data: messagesData } = await insforge.database
                .from('mentor_messages')
                .select('*, mentor_profiles(*)')
                .or(`sender_id.eq.${roleData.user_id},receiver_id.eq.${roleData.user_id}`)
                .order('created_at', { ascending: false });
            if (messagesData) setMessages(messagesData);
        } catch (e) {
            console.error("Failed to mark messages as read", e);
        }
    };

    // Delete Conversation Flow
    const handleDeleteConversation = async () => {
        if (!deletingConversationUser || !roleData?.user_id) return;
        setDeletingConversation(true);
        try {
            // Delete all messages between the two users
            await insforge.database
                .from('mentor_messages')
                .delete()
                .or(`and(sender_id.eq.${roleData.user_id},receiver_id.eq.${deletingConversationUser.userId}),and(sender_id.eq.${deletingConversationUser.userId},receiver_id.eq.${roleData.user_id})`);

            // Remove from active_chat_users in localStorage
            try {
                const activeUsers = JSON.parse(localStorage.getItem('active_chat_users') || '[]');
                const updated = activeUsers.filter((u: any) => u.userId !== deletingConversationUser.userId);
                localStorage.setItem('active_chat_users', JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to update active_chat_users", e);
            }

            // Remove from local state immediately
            setMessages(prev => prev.filter(m =>
                !(m.sender_id === deletingConversationUser.userId || m.receiver_id === deletingConversationUser.userId)
            ));

            // Deselect if this was the open conversation
            if (selectedConversationUser === deletingConversationUser.userId) {
                setSelectedConversationUser(null);
                setSelectedConversationName('');
            }

            showToast('Conversation deleted.', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setDeletingConversation(false);
            setShowDeleteConfirm(false);
            setDeletingConversationUser(null);
        }
    };

    // Clear Messages Flow (modally confirmed, database delete, keeps contact in sidebar)
    const [clearingMessages, setClearingMessages] = useState(false);
    const handleClearMessages = async () => {
        if (!selectedConversationUser || !roleData?.user_id) return;
        setClearingMessages(true);
        try {
            await insforge.database
                .from('mentor_messages')
                .delete()
                .or(`and(sender_id.eq.${roleData.user_id},receiver_id.eq.${selectedConversationUser}),and(sender_id.eq.${selectedConversationUser},receiver_id.eq.${roleData.user_id})`);

            setMessages(prev => prev.filter(m =>
                !(m.sender_id === selectedConversationUser || m.receiver_id === selectedConversationUser)
            ));

            showToast('Messages cleared.', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setClearingMessages(false);
            setShowClearConfirm(false);
        }
    };

    // Block User Flow (modally confirmed, inserts to chat_blocks table)
    const [blockingUser, setBlockingUser] = useState(false);
    const handleToggleBlockUser = async () => {
        if (!selectedConversationUser || !roleData?.user_id) return;
        setBlockingUser(true);
        try {
            const isBlockedByMe = blocks.some(b => b.blocker_id === roleData.user_id && b.blocked_id === selectedConversationUser);
            
            if (isBlockedByMe) {
                await insforge.database
                    .from('chat_blocks')
                    .delete()
                    .eq('blocker_id', roleData.user_id)
                    .eq('blocked_id', selectedConversationUser);
                
                setBlocks(prev => prev.filter(b => !(b.blocker_id === roleData.user_id && b.blocked_id === selectedConversationUser)));
                showToast('User unblocked successfully.', 'success');
            } else {
                await insforge.database
                    .from('chat_blocks')
                    .insert([{
                        blocker_id: roleData.user_id,
                        blocked_id: selectedConversationUser
                    }]);
                
                setBlocks(prev => [...prev, { blocker_id: roleData.user_id, blocked_id: selectedConversationUser }]);
                showToast('User blocked successfully.', 'success');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setBlockingUser(false);
            setShowBlockConfirm(false);
        }
    };

    // View Profile Helper
    const handleViewProfileClick = () => {
        if (!selectedConversationUser) return;
        const profile = userProfiles[selectedConversationUser];
        if (profile) {
            setProfileDialogUser({
                ...profile,
                id: selectedConversationUser
            });
            setShowProfileDialog(true);
        }
    };

    // Emoji Helper
    const EMOJIS = ['😊', '😂', '👍', '❤️', '🔥', '👏', '🙌', '🎉', '💡', '🤔', '🙏', '✨'];
    const handleAddEmoji = (emoji: string) => {
        setReplyText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    // Simulated Speech Note Helper (Speech Recognition)
    const handleToggleVoice = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast("Speech recognition not supported in this browser.", "error");
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsRecording(true);
                showToast("Listening... Speak now.", "info");
            };

            rec.onresult = (event: any) => {
                const result = event.results[0][0].transcript;
                setReplyText(prev => (prev ? prev + ' ' + result : result));
                showToast("Speech captured!", "success");
            };

            rec.onerror = (err: any) => {
                console.error("Speech recognition error", err);
                showToast("Voice recognition failed: " + err.error, "error");
                setIsRecording(false);
            };

            rec.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = rec;
            rec.start();
        }
    };

    // Attachment helper
    const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversationUser || !roleData?.user_id) return;
        
        showToast(`Uploading ${file.name}...`, 'info');
        const uploaded = await handleFileUpload(file, 'chat_attachment');
        if (uploaded) {
            try {
                const senderName = roleData.name || (myProfile?.is_verified ? 'Mentor' : 'Student');
                const messageText = `[Attachment] ${file.name}\n${uploaded.url}`;
                const receiverOnline = activePresence[selectedConversationUser] && (Date.now() - activePresence[selectedConversationUser] < 15000);

                const { data: insertedMsg, error: msgErr } = await insforge.database
                    .from('mentor_messages')
                    .insert([{
                        sender_id: roleData.user_id,
                        sender_name: senderName,
                        receiver_id: selectedConversationUser,
                        receiver_name: selectedConversationName,
                        mentor_id: myProfile?.id || null,
                        message: messageText,
                        is_read: false,
                        is_delivered: !!receiverOnline
                    }])
                    .select()
                    .single();

                if (msgErr) throw msgErr;

                if (insertedMsg) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === insertedMsg.id)) return prev;
                        return [insertedMsg, ...prev];
                    });

                    if (insforge.realtime.isConnected) {
                        insforge.realtime.publish(`chat_user_${selectedConversationUser}`, 'new_message', insertedMsg);
                    }
                }

                // Insert notification
                const { data: recipientStudent } = await insforge.database
                    .from('students')
                    .select('id')
                    .eq('user_id', selectedConversationUser)
                    .maybeSingle();

                const notificationUserId = recipientStudent?.id || selectedConversationUser;
                await insforge.database
                    .from('notifications')
                    .insert([{
                        user_id: notificationUserId,
                        message: `New file from ${senderName}: ${file.name}`,
                        type: 'info',
                        is_read: false
                    }]);

                showToast("Attachment sent!", "success");
                loadData();
            } catch (err: any) {
                showToast(err.message, "error");
            }
        }
    };

    // Typing broadcasts with throttle
    const handleInputChange = (val: string) => {
        setReplyText(val);
        
        const now = Date.now();
        if (now - lastTypingTimeRef.current > 2000) {
            lastTypingTimeRef.current = now;
            sendTypingStatus(true);
        }
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
        }, 3000);
    };

    const sendTypingStatus = (isTyping: boolean) => {
        if (!roleData?.user_id || !selectedConversationUser) return;
        if (insforge.realtime.isConnected) {
            insforge.realtime.publish(`chat_user_${selectedConversationUser}`, 'typing', {
                sender_id: roleData.user_id,
                is_typing: isTyping
            });
        }
    };

    const getDateSeparator = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    // Rating Dialog Submit
    const handleRatingSubmit = async () => {
        if (!ratingTarget || !roleData?.user_id) return;
        setSubmittingRating(true);
        try {
            const { error } = await insforge.database
                .from('mentor_reviews')
                .insert([{
                    student_id: roleData.user_id,
                    mentor_id: ratingTarget.mentor_id,
                    rating: ratingStars,
                    feedback: ratingFeedback
                }]);
            if (error) throw error;

            // Update request status to completed
            const requestTable = 
                ratingTarget.requestType === 'mentorship' ? 'mentorship_requests' :
                ratingTarget.requestType === 'referral' ? 'referral_requests' :
                ratingTarget.requestType === 'resume' ? 'resume_reviews' : 'mock_interviews';
            
            await insforge.database
                .from(requestTable)
                .update({ status: 'completed' })
                .eq('id', ratingTarget.id);

            // Increment helped count
            const currentHelped = ratingTarget.mentor_profiles?.students_helped || 0;
            await insforge.database
                .from('mentor_profiles')
                .update({ students_helped: currentHelped + 1 })
                .eq('id', ratingTarget.mentor_id);

            showToast("Review submitted successfully!", "success");
            setShowRateDialog(false);
            setRatingFeedback('');
            setRatingStars(5);
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleUpdateStatus = async (table: string, id: string, newStatus: string) => {
        try {
            const { error } = await insforge.database
                .from(table)
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            showToast(`Request updated to ${newStatus}`, "success");
            loadData();
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    const getConversations = () => {
        const map = new Map<string, { userId: string, userName: string, lastMessage: any, unreadCount: number }>();
        
        // 1. Load active users from localStorage
        try {
            const activeUsers = JSON.parse(localStorage.getItem('active_chat_users') || '[]');
            activeUsers.forEach((u: any) => {
                map.set(u.userId, {
                    userId: u.userId,
                    userName: u.userName,
                    lastMessage: { message: 'No messages yet', created_at: new Date(0).toISOString() },
                    unreadCount: 0
                });
            });
        } catch (e) {
            console.error("Failed to parse active_chat_users", e);
        }

        // 2. Overlay actual messages
        const sortedMsgs = [...messages].reverse();
        sortedMsgs.forEach(msg => {
            const isSender = msg.sender_id === roleData?.user_id;
            const otherId = isSender ? msg.receiver_id : msg.sender_id;
            const otherName = isSender ? msg.receiver_name : msg.sender_name;
            const existing = map.get(otherId);
            const unreadCount = (existing?.unreadCount || 0) + (!isSender && !msg.is_read ? 1 : 0);
            
            // Add user to active_chat_users list helper
            try {
                const activeUsers = JSON.parse(localStorage.getItem('active_chat_users') || '[]');
                if (!activeUsers.some((u: any) => u.userId === otherId)) {
                    activeUsers.push({ userId: otherId, userName: otherName || 'User' });
                    localStorage.setItem('active_chat_users', JSON.stringify(activeUsers));
                }
            } catch (e) {
                console.error("Failed to add active chat user to storage", e);
            }

            map.set(otherId, {
                userId: otherId,
                userName: otherName || 'User',
                lastMessage: msg,
                unreadCount
            });
        });

        // 3. Map profile cache updates
        const list = Array.from(map.values()).map(c => {
            const profile = userProfiles[c.userId];
            return {
                ...c,
                userName: profile?.name || c.userName,
                avatarUrl: profile?.avatarUrl
            };
        });

        // Sort by last message timestamp
        return list.sort((a, b) => 
            new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        );
    };

    const getRequestsForConversation = (otherUserId: string) => {
        const isMentor = myProfile?.is_verified;
        const studentId = isMentor ? otherUserId : roleData?.user_id;
        const mentorId = isMentor ? myProfile?.id : mentors.find(m => m.user_id === otherUserId)?.id;

        if (!studentId || !mentorId) return [];

        const list: any[] = [];
        
        // Student requests
        myMentorshipRequests.forEach(r => {
            if (r.student_id === studentId && r.mentor_id === mentorId) {
                list.push({ ...r, requestType: 'mentorship' });
            }
        });
        myReferralRequests.forEach(r => {
            if (r.student_id === studentId && r.mentor_id === mentorId) {
                list.push({ ...r, requestType: 'referral' });
            }
        });
        myResumeReviews.forEach(r => {
            if (r.student_id === studentId && r.mentor_id === mentorId) {
                list.push({ ...r, requestType: 'resume' });
            }
        });
        myMockInterviews.forEach(r => {
            if (r.student_id === studentId && r.mentor_id === mentorId) {
                list.push({ ...r, requestType: 'mock' });
            }
        });

        // Mentor incoming requests
        if (isMentor) {
            incomingMentorship.forEach(r => {
                if (r.student_id === studentId && r.mentor_id === mentorId) {
                    list.push({ ...r, requestType: 'mentorship' });
                }
            });
            incomingReferral.forEach(r => {
                if (r.student_id === studentId && r.mentor_id === mentorId) {
                    list.push({ ...r, requestType: 'referral' });
                }
            });
            incomingResume.forEach(r => {
                if (r.student_id === studentId && r.mentor_id === mentorId) {
                    list.push({ ...r, requestType: 'resume' });
                }
            });
            incomingMock.forEach(r => {
                if (r.student_id === studentId && r.mentor_id === mentorId) {
                    list.push({ ...r, requestType: 'mock' });
                }
            });
        }

        const unique: any[] = [];
        const seen = new Set();
        list.forEach(item => {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
            }
        });
        return unique;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
            case 'completed':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[10px] font-bold">Completed</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 border text-[10px] font-bold">Rejected</Badge>;
            case 'info_requested':
                return <Badge className="bg-sky-500/10 text-sky-600 border-sky-200 border text-[10px] font-bold">Info Requested</Badge>;
            case 'pending':
            default:
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 border text-[10px] font-bold">Pending</Badge>;
        }
    };

    const filteredMentors = mentors.filter(m => {
        if (roleData?.user_id && m.user_id === roleData.user_id) {
            return false;
        }

        const matchesSearch = !search || 
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.company_name.toLowerCase().includes(search.toLowerCase()) ||
            m.job_role.toLowerCase().includes(search.toLowerCase());

        const matchesCompany = !companyFilter || m.company_name.toLowerCase().includes(companyFilter.toLowerCase());
        const matchesRole = !roleFilter || m.job_role.toLowerCase().includes(roleFilter.toLowerCase());
        const matchesBatch = !batchFilter || m.batch === batchFilter;
        const matchesBranch = !branchFilter || m.branch.toLowerCase().includes(branchFilter.toLowerCase());
        
        const matchesSkill = !skillFilter || m.mentor_skills?.some((s: any) => 
            s.skill_name.toLowerCase().includes(skillFilter.toLowerCase())
        );

        const avail = m.mentor_availability?.[0] || {};
        const matchesAvailability = availabilityFilter === 'all' ||
            (availabilityFilter === 'referral' && avail.available_for_referral) ||
            (availabilityFilter === 'mentorship' && avail.available_for_mentorship) ||
            (availabilityFilter === 'resume' && avail.available_for_resume_review) ||
            (availabilityFilter === 'mock' && avail.available_for_mock_interview) ||
            (availabilityFilter === 'guidance' && avail.available_for_career_guidance);

        return matchesSearch && matchesCompany && matchesRole && matchesBatch && matchesBranch && matchesSkill && matchesAvailability;
    });

    const unreadConversationsCount = (() => {
        const unreadMsgs = messages.filter(m => m.receiver_id === roleData?.user_id && !m.is_read);
        const uniqueSenders = new Set(unreadMsgs.map(m => m.sender_id));
        return uniqueSenders.size;
    })();

    const handleToggleService = (key: string) => {
        if (key === 'referral') setAvailReferral(prev => !prev);
        else if (key === 'mentorship') setAvailMentorship(prev => !prev);
        else if (key === 'resume') setAvailResume(prev => !prev);
        else if (key === 'mock') setAvailMock(prev => !prev);
        else if (key === 'guidance') setAvailGuidance(prev => !prev);
    };

    const renderServiceChips = (
        availMap: { [key: string]: boolean },
        onToggle: (serviceKey: string) => void
    ) => {
        const services = [
            { key: 'referral', label: 'Referral' },
            { key: 'mentorship', label: 'Mentorship' },
            { key: 'resume', label: 'Resume Review' },
            { key: 'mock', label: 'Mock Interview' },
            { key: 'guidance', label: 'Career Guidance' }
        ];

        return (
            <div className="flex flex-wrap gap-2 pt-1">
                {services.map(s => {
                    const active = availMap[s.key];
                    return (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => onToggle(s.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                active 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 shadow-sm font-bold' 
                                : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                        >
                            {active ? '✓ Selected' : '+ Selectable'} {s.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderActiveServices = (m: any) => {
        const avail = m.mentor_availability?.[0] || {};
        const services = [
            { active: !!avail.available_for_referral, label: 'Referral' },
            { active: !!avail.available_for_mentorship, label: 'Mentorship' },
            { active: !!avail.available_for_resume_review, label: 'Resume Review' },
            { active: !!avail.available_for_mock_interview, label: 'Mock Interview' },
            { active: !!avail.available_for_career_guidance, label: 'Career Guidance' }
        ];

        const activeList = services.filter(s => s.active);
        if (activeList.length === 0) {
            return <p className="text-xs text-muted-foreground italic">No active services currently listed.</p>;
        }

        return (
            <div className="flex flex-wrap gap-1.5">
                {activeList.map(s => (
                    <span key={s.label} className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-xs font-semibold">
                        ✓ {s.label}
                    </span>
                ))}
            </div>
        );
    };

    const renderContactInfo = (m: any) => {
        return (
            <div className="space-y-2">
                {m.show_email && m.email && (
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{m.email}</span>
                    </div>
                )}
                {m.linkedin_url && (
                    <a
                        href={m.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] border border-[#0A66C2]/25 transition-colors font-semibold text-xs group"
                    >
                        <Linkedin className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate">View LinkedIn Profile</span>
                        <span className="text-[9px] opacity-60 group-hover:opacity-100 transition-opacity">↗</span>
                    </a>
                )}
                <div className="flex items-center gap-2 text-foreground/80">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <button 
                        onClick={() => {
                            setMessageTargetMentor(m);
                            setShowMessageModal(true);
                        }} 
                        className="text-primary hover:underline font-semibold"
                    >
                        Send Direct Message
                    </button>
                </div>
            </div>
        );
    };


    const renderChatWorkspace = () => {
        const conversations = getConversations();
        
        // Filter conversations based on sidebarSearch
        const filteredConversations = conversations.filter(c => 
            c.userName.toLowerCase().includes(sidebarSearch.toLowerCase())
        );

        const activeConv = conversations.find(c => c.userId === selectedConversationUser);
        const relatedRequests = selectedConversationUser ? getRequestsForConversation(selectedConversationUser) : [];

        const getRelativeTime = (dateStr: string) => {
            const now = Date.now();
            const then = new Date(dateStr).getTime();
            const diff = Math.floor((now - then) / 1000);
            if (diff < 60) return 'just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
        };

        const filteredMessages = messages
            .filter(m =>
                (m.sender_id === roleData?.user_id && m.receiver_id === selectedConversationUser) ||
                (m.receiver_id === roleData?.user_id && m.sender_id === selectedConversationUser)
            )
            .slice()
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const isOnline = selectedConversationUser && activePresence[selectedConversationUser] && (Date.now() - activePresence[selectedConversationUser] < 15000);
        const isBlockedByMe = selectedConversationUser && blocks.some(b => b.blocker_id === roleData?.user_id && b.blocked_id === selectedConversationUser);
        const hasBlockedMe = selectedConversationUser && blocks.some(b => b.blocker_id === selectedConversationUser && b.blocked_id === roleData?.user_id);
        const isBlocked = isBlockedByMe || hasBlockedMe;
        
        // Force offline if blocked
        const displayOnlineStatus = !isBlocked && isOnline;
        
        const partnerProfile = selectedConversationUser ? userProfiles[selectedConversationUser] : null;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 h-[680px] rounded-2xl overflow-hidden border border-border/60 shadow-xl bg-card">

                {/* ── SIDEBAR ── */}
                <div className="lg:col-span-1 border-r border-border/50 flex flex-col h-full bg-muted/20">
                    {/* Sidebar Header */}
                    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 bg-card/80 flex-shrink-0">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h3 className="font-heading font-bold text-xs text-foreground tracking-wide">Messages</h3>
                        {conversations.some(c => c.unreadCount > 0) && (
                            <span className="ml-auto bg-primary text-primary-foreground rounded-full text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                                {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
                            </span>
                        )}
                    </div>

                    {/* Sidebar Search Bar */}
                    <div className="p-3 border-b border-border/30 bg-card/40 flex-shrink-0">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                            <Input
                                placeholder="Search conversations..."
                                value={sidebarSearch}
                                onChange={e => setSidebarSearch(e.target.value)}
                                className="pl-8 text-xs h-8 bg-zinc-100/50 dark:bg-white/5 border-border/40 focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-muted-foreground/40" />
                                </div>
                                <p className="text-xs font-semibold text-foreground/60">No conversations</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    {sidebarSearch ? "No conversations match your search." : "Message a mentor to start chatting."}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(c => {
                                const isSelected = selectedConversationUser === c.userId;
                                const isMenuOpen = openMenuUserId === c.userId;
                                const initials = c.userName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                const cOnline = activePresence[c.userId] && (Date.now() - activePresence[c.userId] < 15000);
                                const cBlocked = blocks.some(b => (b.blocker_id === roleData?.user_id && b.blocked_id === c.userId) || (b.blocker_id === c.userId && b.blocked_id === roleData?.user_id));
                                const showOnlineDot = cOnline && !cBlocked;
                                
                                return (
                                    <div
                                        key={c.userId}
                                        onClick={() => {
                                            setOpenMenuUserId(null);
                                            setSelectedConversationUser(c.userId);
                                            setSelectedConversationName(c.userName);
                                            markConversationAsRead(c.userId);
                                        }}
                                        className={`relative flex items-start gap-3 px-3 py-3.5 cursor-pointer transition-all duration-200 border-b border-border/30 group hover:translate-x-1 hover:bg-zinc-100/50 dark:hover:bg-white/5 ${
                                            isSelected
                                                ? 'bg-zinc-100 dark:bg-zinc-800/40 border-l-4 border-l-primary shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                                                : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        {/* Avatar with status indicator */}
                                        <div className="relative shrink-0">
                                            <Avatar className="w-9 h-9 border border-border/50">
                                                {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.userName} className="object-cover" />}
                                                <AvatarFallback className="text-[11px] font-black bg-primary/10 text-primary">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            {showOnlineDot && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                    {c.userName}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground shrink-0">
                                                    {getRelativeTime(c.lastMessage.created_at)}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] truncate mt-0.5 ${c.unreadCount > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                                {c.lastMessage.message}
                                            </p>
                                        </div>

                                        {/* Right: unread + menu */}
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            {c.unreadCount > 0 && (
                                                <span className="bg-primary text-primary-foreground rounded-full text-[8px] min-w-[16px] h-4 px-1 flex items-center justify-center font-bold shadow-sm">
                                                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                                                </span>
                                            )}
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setOpenMenuUserId(isMenuOpen ? null : c.userId);
                                                }}
                                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Dropdown */}
                                        {isMenuOpen && (
                                            <div
                                                className="absolute right-2 top-11 z-30 bg-popover border border-border rounded-xl shadow-2xl min-w-[160px] py-1 text-xs overflow-hidden"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button
                                                    className="w-full px-3 py-2 text-left hover:bg-muted/60 flex items-center gap-2.5 text-foreground font-semibold"
                                                    onClick={() => {
                                                        setOpenMenuUserId(null);
                                                        setSelectedConversationUser(c.userId);
                                                        setSelectedConversationName(c.userName);
                                                        markConversationAsRead(c.userId);
                                                    }}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5 text-primary" /> Open Chat
                                                </button>
                                                <button
                                                    className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 text-rose-600 font-semibold"
                                                    onClick={() => {
                                                        setOpenMenuUserId(null);
                                                        setDeletingConversationUser(c);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Conversation
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── MAIN CHAT AREA ── */}
                <div className="lg:col-span-3 h-full overflow-hidden flex flex-col relative bg-zinc-50/20 dark:bg-transparent">
                    {selectedConversationUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-card/90 backdrop-blur-sm flex-shrink-0 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <Avatar className="w-9 h-9 border border-primary/20">
                                            {partnerProfile?.avatarUrl && <AvatarImage src={partnerProfile.avatarUrl} alt={selectedConversationName} className="object-cover" />}
                                            <AvatarFallback className="text-[12px] font-black bg-primary/10 text-primary">
                                                {selectedConversationName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {displayOnlineStatus && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-heading font-bold text-sm text-foreground truncate">{selectedConversationName}</h4>
                                            <span className={`flex items-center gap-1 text-[9px] font-semibold ${displayOnlineStatus ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${displayOnlineStatus ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'} inline-block`} />
                                                {displayOnlineStatus ? 'Online now' : 'Offline'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[320px]">
                                            {partnerProfile?.detail || 'Student'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0 relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[11px] font-bold px-3 border-border/80 shadow-sm"
                                        onClick={handleViewProfileClick}
                                    >
                                        View Profile
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>

                                    {/* Header Menu Dropdown */}
                                    {showHeaderMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                                            <div className="absolute right-0 top-9 z-50 bg-popover border border-border rounded-xl shadow-2xl min-w-[150px] py-1.5 text-xs overflow-hidden">
                                                <button
                                                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-foreground font-semibold"
                                                    onClick={() => {
                                                        setShowHeaderMenu(false);
                                                        setShowClearConfirm(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-amber-500" /> Clear Messages
                                                </button>
                                                <button
                                                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-foreground font-semibold"
                                                    onClick={() => {
                                                        setShowHeaderMenu(false);
                                                        const activeUsers = JSON.parse(localStorage.getItem('active_chat_users') || '[]');
                                                        const conv = activeUsers.find((u: any) => u.userId === selectedConversationUser) || { userId: selectedConversationUser, userName: selectedConversationName };
                                                        setDeletingConversationUser(conv);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Chat
                                                </button>
                                                <button
                                                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-rose-600 font-semibold"
                                                    onClick={() => {
                                                        setShowHeaderMenu(false);
                                                        setShowBlockConfirm(true);
                                                    }}
                                                >
                                                    <UserX className="w-3.5 h-3.5 text-rose-600" /> 
                                                    {isBlockedByMe ? 'Unblock User' : 'Block User'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
                            >
                                {filteredMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                        <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                                            <MessageSquare className="w-7 h-7 text-muted-foreground/30" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground/70">No messages yet</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">Send the first message to start the conversation.</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredMessages.map((msg, i) => {
                                        const isMe = msg.sender_id === roleData?.user_id;
                                        const prevMsg = filteredMessages[i - 1];
                                        const showDateSep = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                                        
                                        // Read receipt indicator
                                        let statusElement = null;
                                        if (isMe) {
                                            if (msg.is_read) {
                                                statusElement = <span className="text-blue-400 font-bold ml-1" title="Seen">✓✓</span>;
                                            } else if (msg.is_delivered) {
                                                statusElement = <span className="text-muted-foreground/60 font-bold ml-1" title="Delivered">✓✓</span>;
                                            } else {
                                                statusElement = <span className="text-muted-foreground/40 font-semibold ml-1" title="Sent">✓</span>;
                                            }
                                        }

                                        // Custom attachment rendering
                                        const isAttachment = msg.message.startsWith('[Attachment]');
                                        
                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDateSep && (
                                                    <div className="flex items-center gap-3 my-3">
                                                        <div className="flex-1 h-px bg-border/40" />
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted/60">
                                                            {getDateSeparator(msg.created_at)}
                                                        </span>
                                                        <div className="flex-1 h-px bg-border/40" />
                                                    </div>
                                                )}
                                                <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    {!isMe && (
                                                        <Avatar className="w-7 h-7 border border-border/50 shrink-0 mb-0.5">
                                                            {partnerProfile?.avatarUrl && <AvatarImage src={partnerProfile.avatarUrl} alt={selectedConversationName} className="object-cover" />}
                                                            <AvatarFallback className="text-[9px] font-black bg-secondary text-secondary-foreground">
                                                                {selectedConversationName?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={`max-w-[65%] px-4 py-2.5 text-xs leading-relaxed font-sans shadow-sm transition-all duration-200 ${
                                                            isMe
                                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none shadow-blue-500/10'
                                                                : 'bg-zinc-100 dark:bg-zinc-800/80 text-foreground border border-border/40 rounded-2xl rounded-tl-none'
                                                        }`}
                                                    >
                                                        {isAttachment ? (() => {
                                                            const lines = msg.message.split('\n');
                                                            const fileName = lines[0].replace('[Attachment] ', '');
                                                            const url = lines[1] || '';
                                                            return (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 border border-white/10 dark:border-white/5">
                                                                        <FileText className="w-5 h-5 text-blue-400" />
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-medium truncate">{fileName}</p>
                                                                            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline font-bold truncate block">
                                                                                Open Attachment
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })() : (
                                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                                        )}
                                                        <span className={`text-[9px] mt-1.5 flex items-center justify-end ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && statusElement}
                                                        </span>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                
                                {/* Typing Indicator */}
                                {typingUsers[selectedConversationUser] && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse italic py-1 pl-9">
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                                        <span>{selectedConversationName} is typing...</span>
                                    </div>
                                )}
                                
                                {/* Auto-scroll anchor */}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            {isBlocked ? (
                                <div className="px-4 py-4 border-t border-border/40 bg-card/80 text-center text-xs text-muted-foreground font-semibold flex-shrink-0">
                                    {isBlockedByMe 
                                        ? "🚫 You have blocked this user. Unblock them from the menu to resume chatting."
                                        : "🚫 This conversation is read-only. This user has blocked you or is unavailable."}
                                </div>
                            ) : (
                                <div className="px-4 py-3 border-t border-border/40 bg-card/80 backdrop-blur-sm flex-shrink-0 relative">
                                    {/* Emoji popover */}
                                    {showEmojiPicker && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                                            <div className="absolute bottom-16 left-4 z-40 bg-popover border border-border/80 rounded-xl shadow-2xl p-2 grid grid-cols-6 gap-1.5 min-w-[200px] animate-fade-in">
                                                {EMOJIS.map(e => (
                                                    <button
                                                        key={e}
                                                        onClick={() => handleAddEmoji(e)}
                                                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-lg transition-colors"
                                                    >
                                                        {e}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleAttachmentChange}
                                    />

                                    <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-1.5 h-[52px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-1 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform shrink-0"
                                            title="Add emoji"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>

                                        <input
                                            value={replyText}
                                            onChange={e => handleInputChange(e.target.value)}
                                            placeholder={`Message ${selectedConversationName}…`}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(selectedConversationUser, selectedConversationName, !!myProfile?.is_verified);
                                                }
                                            }}
                                            className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground py-1.5 font-sans"
                                        />

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform"
                                                title="Upload attachment"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={handleToggleVoice}
                                                className={`p-1 hover:scale-110 transition-transform ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                                                title="Voice command (Speech-to-text)"
                                            >
                                                <Mic className="w-5 h-5" />
                                            </button>

                                            <button
                                                disabled={sendingReply || !replyText.trim()}
                                                onClick={() => handleSendReply(selectedConversationUser, selectedConversationName, !!myProfile?.is_verified)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed`}
                                            >
                                                {sendingReply ? (
                                                    <span className="text-[10px] font-bold">...</span>
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground text-center mt-1.5 font-sans">Press Enter to send &bull; Shift + Enter for new line</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State — no conversation selected */
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-8 h-8 text-primary/40 animate-bounce" />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="font-heading font-bold text-base text-foreground">💬 Select a Conversation</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] font-sans">
                                    Connect with mentors and alumni.
                                </p>
                            </div>
                            <Button
                                onClick={() => switchTab('mentors')}
                                className="mt-2 text-xs font-bold bg-primary hover:bg-primary/95 text-white shadow-md rounded-xl h-9 px-5 flex items-center gap-1.5"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Browse Mentors
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-border/60">
                <div>
                    <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Career Network
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm max-w-2xl font-sans">
                        Connect with verified seniors and alumni for mentorship, referrals, interview preparation, and direct guidance.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/80 pb-px gap-6 text-sm font-semibold select-none overflow-x-auto scrollbar-none flex-shrink-0">
                <button
                    onClick={() => switchTab('mentors')}
                    className={`pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'mentors' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    🎓 Verified Mentors
                </button>
                <button
                    onClick={() => {
                        switchTab('conversations');
                        const convs = getConversations();
                        if (convs.length > 0 && !selectedConversationUser) {
                            setSelectedConversationUser(convs[0].userId);
                            setSelectedConversationName(convs[0].userName);
                        }
                    }}
                    className={`pb-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'conversations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    💬 My Conversations
                    {unreadConversationsCount > 0 && (
                        <span className="w-6 h-6 min-w-[24px] min-h-[24px] bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-md shadow-red-500/30">
                            {unreadConversationsCount > 99 ? '99+' : unreadConversationsCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => switchTab('become-mentor')}
                    className={`pb-3 border-b-2 transition-all whitespace-nowrap ${activeTab === 'become-mentor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    {myProfile?.is_verified ? '💼 Mentor Profile' : '🚀 Become Mentor'}
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Card key={i} className="h-56 animate-pulse bg-muted/40 border-dashed shadow-sm" />)}
                </div>
            ) : (
                <>
                    {/* =====================================================
                        TAB 1: VERIFIED MENTORS
                        ===================================================== */}
                    {activeTab === 'mentors' && (
                        <div className="space-y-6">
                            {/* Search and Collapsible Filters Panel */}
                            <Card className="border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                        <div className="relative flex-1">
                                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                                            <Input
                                                placeholder="Search by name, company, role, or keywords..."
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                className="pl-9 text-xs h-10"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                                <SelectTrigger className="w-[160px] h-10 text-xs">
                                                    <SelectValue placeholder="Availability" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Services</SelectItem>
                                                    <SelectItem value="referral">Referrals</SelectItem>
                                                    <SelectItem value="mentorship">Mentorship</SelectItem>
                                                    <SelectItem value="resume">Resume Review</SelectItem>
                                                    <SelectItem value="mock">Mock Interview</SelectItem>
                                                    <SelectItem value="guidance">Career Guidance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAdvancedFilters(prev => !prev)}
                                                className="h-10 text-xs font-semibold shrink-0"
                                            >
                                                Advanced Filters {showAdvancedFilters ? '▲' : '▼'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Advanced filter panels collapsible */}
                                    {showAdvancedFilters && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-border/40 font-sans">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Company</label>
                                                <Input value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} placeholder="e.g. Google" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Role</label>
                                                <Input value={roleFilter} onChange={e => setRoleFilter(e.target.value)} placeholder="e.g. SDE" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Batch</label>
                                                <Input value={batchFilter} onChange={e => setBatchFilter(e.target.value)} placeholder="e.g. 2024" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Branch</label>
                                                <Input value={branchFilter} onChange={e => setBranchFilter(e.target.value)} placeholder="e.g. CSE" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Skill</label>
                                                <Input value={skillFilter} onChange={e => setSkillFilter(e.target.value)} placeholder="e.g. React" className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Mentors Grid */}
                            {filteredMentors.length === 0 ? (
                                <div className="text-center py-12 max-w-md mx-auto space-y-2 font-sans bg-card/10 border border-dashed rounded-xl">
                                    <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
                                    <h3 className="font-bold text-sm text-foreground">No verified mentors found</h3>
                                    <p className="text-xs text-muted-foreground leading-normal">
                                        Try adjusting your search query, service selector, or advanced filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMentors.map(m => {
                                        const mentorSkills = m.mentor_skills || [];
                                        const visibleSkills = mentorSkills.slice(0, 4);
                                        const extraSkillsCount = mentorSkills.length - 4;
                                        const bio = m.about_me || '';

                                        // Deterministic cover gradient per mentor (cycles through palettes)
                                        const COVER_GRADIENTS = [
                                            'linear-gradient(135deg,#2563EB 0%,#7C3AED 60%,#14B8A6 100%)',
                                            'linear-gradient(135deg,#DB2777 0%,#7C3AED 60%,#2563EB 100%)',
                                            'linear-gradient(135deg,#059669 0%,#0284C7 60%,#7C3AED 100%)',
                                            'linear-gradient(135deg,#D97706 0%,#DC2626 55%,#9333EA 100%)',
                                            'linear-gradient(135deg,#0EA5E9 0%,#6366F1 60%,#EC4899 100%)',
                                        ];
                                        const coverGradient = COVER_GRADIENTS[(m.name?.charCodeAt(0) || 0) % COVER_GRADIENTS.length];

                                        return (
                                            <div
                                                key={m.id}
                                                style={{
                                                    borderRadius: isDark ? 20 : 24,
                                                    background: isDark ? 'linear-gradient(175deg,rgba(15,23,42,0.97) 0%,rgba(2,6,23,0.99) 100%)' : '#ffffff',
                                                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset' : '0 10px 35px rgba(15,23,42,0.08)',
                                                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    transition: isDark ? 'transform 220ms cubic-bezier(.22,.68,0,1.15), box-shadow 220ms ease' : 'transform 220ms ease, box-shadow 220ms ease',
                                                    cursor: 'default',
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                                                    (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 12px 40px rgba(99,102,241,0.25), 0 2px 12px rgba(0,0,0,0.5)' : '0 15px 45px rgba(15,23,42,0.12)';
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                                    (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset' : '0 10px 35px rgba(15,23,42,0.08)';
                                                }}
                                            >
                                                {/* ── COVER STRIP ── */}
                                                <div style={{
                                                    height: 65,
                                                    background: coverGradient,
                                                    position: 'relative',
                                                    flexShrink: 0,
                                                }}>
                                                    <div style={{
                                                        position: 'absolute', inset: 0,
                                                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                                                        backgroundSize: '14px 14px',
                                                    }} />
                                                </div>

                                                {/* ── BODY ── */}
                                                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                                                    {/* ── PROFILE PHOTO CONTAINER (overlaps cover) ── */}
                                                    <div style={{ position: 'relative', height: 36, marginBottom: 8 }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: -36,
                                                            left: 0,
                                                            width: 72, height: 72, borderRadius: '50%',
                                                            border: isDark ? '4px solid #0d121f' : '4px solid #ffffff',
                                                            boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                                                            overflow: 'hidden', flexShrink: 0,
                                                            background: 'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(139,92,246,0.2))',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            {m.avatar_url ? (
                                                                <img src={m.avatar_url} alt={m.name}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <span style={{ fontSize: 28, fontWeight: 900, color: '#8b5cf6', lineHeight: 1 }}>
                                                                    {m.name?.charAt(0)?.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ── USER INFO Stack ── */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
                                                        {/* Name + Verified badge */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                            <h3
                                                                style={{
                                                                    fontSize: 20, fontWeight: 700, color: isDark ? '#ffffff' : '#111827',
                                                                    lineHeight: 1.2, margin: 0,
                                                                }}
                                                            >
                                                                {m.name}
                                                            </h3>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                                                padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                                                                background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                                                                border: isDark ? '1px solid rgba(16,185,129,0.25)' : '1px solid #d1fae5',
                                                                color: isDark ? '#34d399' : '#059669',
                                                                fontSize: 10, fontWeight: 700,
                                                            }}>
                                                                <CheckCircle2 style={{ width: 10, height: 10, color: isDark ? '#34d399' : '#059669' }} />
                                                                Verified
                                                            </span>
                                                        </div>
                                                        {/* Role */}
                                                        {(m.job_role || m.company_name) && (
                                                            <p style={{
                                                                fontSize: 15, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#374151',
                                                                margin: 0, lineHeight: 1.3,
                                                            }}>
                                                                {m.job_role}{m.job_role && m.company_name ? ' @ ' : ''}{m.company_name}
                                                            </p>
                                                        )}
                                                        {/* Academic details */}
                                                        <p style={{
                                                            fontSize: 12, color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', margin: 0, fontWeight: 500,
                                                        }}>
                                                            {[
                                                                m.branch,
                                                                m.batch ? `Batch ${m.batch}` : null,
                                                                m.placement_type || null,
                                                            ].filter(Boolean).join(' • ')}
                                                        </p>
                                                    </div>

                                                    {/* ── COMPANY SECTION (Box) ── */}
                                                    <div style={{
                                                        background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                                                        borderRadius: 14,
                                                        padding: '8px 12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 6,
                                                        marginBottom: 10,
                                                    }}>
                                                        {m.company_name && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Building2 style={{ width: 14, height: 14, color: isDark ? 'rgba(255,255,255,0.6)' : '#4b5563' }} />
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#ffffff' : '#1f2937' }}>{m.company_name}</span>
                                                            </div>
                                                        )}
                                                        {m.job_role && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Briefcase style={{ width: 14, height: 14, color: isDark ? 'rgba(255,255,255,0.6)' : '#4b5563' }} />
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.job_role}</span>
                                                            </div>
                                                        )}
                                                        {m.employment_type && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontSize: 12, lineHeight: 1 }}>
                                                                    {m.employment_type === 'Full-time' || m.employment_type === 'Permanent' ? '🟢' : '🔵'}
                                                                </span>
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>{m.employment_type}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── BIO (3-line max) ── */}
                                                    {bio && (
                                                        <p style={{
                                                            fontSize: 12, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', lineHeight: 1.5,
                                                            margin: '0 0 10px',
                                                            display: '-webkit-box', WebkitLineClamp: 3,
                                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                        }}>
                                                            {bio}
                                                        </p>
                                                    )}

                                                    {/* ── SKILLS ── */}
                                                    {visibleSkills.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                                            <div style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em'
                                                            }}>
                                                                Skills
                                                            </div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                                {visibleSkills.map((s: any) => (
                                                                    <span key={s.id} style={{
                                                                        padding: '2px 8px', borderRadius: 999,
                                                                        background: isDark ? 'rgba(99,102,241,0.1)' : '#eff6ff',
                                                                        border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid #bfdbfe',
                                                                        color: isDark ? '#818cf8' : '#2563eb', fontSize: 10, fontWeight: 600,
                                                                    }}>
                                                                        {s.skill_name}
                                                                    </span>
                                                                ))}
                                                                {extraSkillsCount > 0 && (
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: 999,
                                                                        background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                                                        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 10, fontWeight: 600,
                                                                    }}>
                                                                        +{extraSkillsCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── DIVIDER ── */}
                                                    <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', marginBottom: 10, marginTop: 'auto' }} />

                                                    {/* ── ACTION BUTTONS ── */}
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        {m.linkedin_url && (
                                                            <a
                                                                href={m.linkedin_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={e => e.stopPropagation()}
                                                                style={{
                                                                    flex: 1, height: 38, borderRadius: 10,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                                    color: '#ffffff', fontSize: 12, fontWeight: 700,
                                                                    textDecoration: 'none', border: 'none',
                                                                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                                                                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                                                                }}
                                                                onMouseEnter={e => {
                                                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(37,99,235,0.3)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                                                                }}
                                                            >
                                                                <Linkedin style={{ width: 13, height: 13 }} />
                                                                LinkedIn
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (!roleData?.user_id) {
                                                                    showToast("Please select your role and sign in to send messages.", "error");
                                                                    return;
                                                                }
                                                                setSelectedConversationUser(m.user_id);
                                                                setSelectedConversationName(m.name);
                                                                switchTab('conversations');
                                                                markConversationAsRead(m.user_id);
                                                            }}
                                                            style={{
                                                                flex: 1, height: 38, borderRadius: 10,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                background: isDark ? 'transparent' : '#ffffff',
                                                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #d1d5db',
                                                                color: isDark ? '#ffffff' : '#111827', fontSize: 12, fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',
                                                            }}
                                                            onMouseEnter={e => {
                                                                (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#eff6ff';
                                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                                                if (!isDark) {
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
                                                                }
                                                            }}
                                                            onMouseLeave={e => {
                                                                (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'transparent' : '#ffffff';
                                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                                                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            <MessageSquare style={{ width: 13, height: 13, color: isDark ? '#818cf8' : '#111827' }} />
                                                            Message
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =====================================================
                        TAB 2: MY CONVERSATIONS
                        ===================================================== */}
                    {activeTab === 'conversations' && (
                        <div className="space-y-4 animate-fade-in">
                            {renderChatWorkspace()}
                        </div>
                    )}

                    {/* =====================================================
                        TAB 3: BECOME MENTOR / PROFILE SETTINGS
                        ===================================================== */}
                    {activeTab === 'become-mentor' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Promotional Card if no profile exists */}
                            {!myProfile && (
                                <Card className="border border-border shadow-md bg-gradient-to-br from-card to-zinc-50/50 dark:to-zinc-900/10 p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-heading font-black text-xl text-foreground">Become a Verified Mentor</h3>
                                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed font-sans">
                                        Share your career journey, review resumes, conduct mock interviews, and offer referrals to help your college juniors bridge the gap to their dream careers.
                                    </p>
                                    <Button
                                    onClick={() => {
                                        setIsResubmit(false);
                                        setShowRegisterWizard(true);
                                    }}
                                    className="h-10 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-md rounded-xl flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Register Now
                                </Button>
                                </Card>
                            )}

                            {myProfile && !myProfile.is_verified && (() => {
                                const status = myProfile.verification_status;

                                // ── REJECTED ──────────────────────────────────────────
                                if (status === 'rejected') return (
                                    <div className="space-y-6">
                                        <Card className="border border-red-200 bg-red-500/5 shadow-sm rounded-xl">
                                            <CardContent className="p-6 space-y-4 font-sans">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2.5 rounded-xl shrink-0 bg-red-500/10 text-red-600">
                                                        <XCircle className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-1 flex-1">
                                                        <h3 className="font-heading font-bold text-lg text-red-700 dark:text-red-400">❌ Mentor Verification Rejected</h3>
                                                        <div className="text-sm text-foreground/90 leading-relaxed space-y-1.5 pt-1.5">
                                                            <p><strong>Reason:</strong> {verificationRequest?.admin_notes || 'No notes provided.'}</p>
                                                            <p className="text-xs text-muted-foreground"><strong>Rejected On:</strong> {verificationRequest?.updated_at ? new Date(verificationRequest.updated_at).toLocaleDateString() : (verificationRequest?.created_at ? new Date(verificationRequest.created_at).toLocaleDateString() : 'N/A')} | <strong>Reviewer:</strong> {verificationRequest?.reviewer_name || 'Administrator'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-red-200/40">
                                                    <Button onClick={handleStartResubmit} size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md rounded-lg flex items-center gap-1.5">
                                                        <Plus className="w-4 h-4" />
                                                        Resubmit Application
                                                    </Button>
                                                    <Button onClick={handleStartResubmit} size="sm" variant="outline" className="text-xs font-bold rounded-lg flex items-center gap-1.5">
                                                        ✏️ Edit Application
                                                    </Button>
                                                </div>

                                                {/* TIMELINE APPLICATION HISTORY */}
                                                {verificationRequests.length > 0 && (
                                                    <div className="pt-4 border-t border-red-200/40">
                                                        <h4 className="font-heading font-bold text-xs text-foreground/95 flex items-center gap-2 mb-3">
                                                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                            Application Submission History
                                                        </h4>
                                                        <div className="relative pl-6 border-l border-border/80 space-y-4 font-sans">
                                                            {verificationRequests.map((req, idx) => (
                                                                <div key={req.id} className="relative group">
                                                                    <div className={`absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-background ${
                                                                        req.status === 'approved' ? 'border-emerald-500 bg-emerald-500' :
                                                                        req.status === 'rejected' ? 'border-red-500 bg-red-500' :
                                                                        'border-amber-500 bg-amber-500'
                                                                    }`} />
                                                                    <div className="space-y-0.5 text-xs">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <span className="font-semibold text-foreground/90">
                                                                                Submission #{verificationRequests.length - idx} &mdash; <span className="font-normal text-muted-foreground font-mono text-[10px]">[{req.document_type}]</span>
                                                                            </span>
                                                                            <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded font-mono">
                                                                                {new Date(req.created_at).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        {req.admin_notes && (
                                                                            <p className="mt-1 p-2 bg-muted/40 rounded border italic text-muted-foreground text-[10px]">"{req.admin_notes}"</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                );

                                // ── INFO REQUESTED ────────────────────────────────────
                                if (status === 'info_requested') return (
                                    <Card className="border border-sky-200 bg-sky-500/5 shadow-sm rounded-xl">
                                        <CardContent className="p-6 space-y-4 font-sans">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 rounded-xl shrink-0 bg-sky-500/10 text-sky-600">
                                                    <HelpCircle className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <h3 className="font-heading font-bold text-lg text-sky-700 dark:text-sky-400">✏️ Verification Info Requested</h3>
                                                    <div className="text-sm text-foreground/90 leading-relaxed space-y-1.5 pt-1.5">
                                                        <p><strong>Feedback:</strong> {verificationRequest?.admin_notes || 'Please upload additional documents.'}</p>
                                                        <p className="text-xs text-muted-foreground"><strong>Requested On:</strong> {verificationRequest?.created_at ? new Date(verificationRequest.created_at).toLocaleDateString() : 'N/A'} | <strong>Reviewer:</strong> {verificationRequest?.reviewer_name || 'Administrator'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-sky-100 dark:border-sky-900/20 pt-4 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Document Type</label>
                                                        <Select value={reuploadDocType} onValueChange={setReuploadDocType}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                                                                <SelectItem value="Internship Letter">Internship Letter</SelectItem>
                                                                <SelectItem value="Joining Letter">Joining Letter</SelectItem>
                                                                <SelectItem value="Employee ID">Employee ID Card</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold uppercase text-muted-foreground">Work Email (Optional)</label>
                                                        <Input placeholder="username@company.com" value={reuploadEmail} onChange={e => setReuploadEmail(e.target.value)} className="h-9" />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase text-muted-foreground">Select New File</label>
                                                    <div className="border border-dashed p-4 rounded-lg text-center flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const uploadFile = async () => {
                                                                        const res = await handleFileUpload(file, 'verify_reupload');
                                                                        if (res) setReuploadedFile(res);
                                                                    };
                                                                    uploadFile();
                                                                }
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <FileUp className="w-6 h-6 text-muted-foreground mb-1" />
                                                        {reuploadedFile ? (
                                                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> File uploaded!
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Click to upload alternative proof</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button onClick={handleReuploadSubmit} disabled={reuploading || !reuploadedFile} className="h-9 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold">
                                                    {reuploading ? 'Submitting...' : 'Re-submit Verification Documents'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );

                                // ── PENDING ───────────────────────────────────────────
                                if (status === 'pending') return (
                                    <Card className="border border-amber-200 bg-amber-500/5 shadow-sm rounded-xl">
                                        <CardContent className="p-6 space-y-4 font-sans">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 rounded-xl shrink-0 bg-amber-500/10 text-amber-600">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-lg text-amber-700 dark:text-amber-400">⏳ Profile Verification Pending</h3>
                                                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                                        Your mentor profile is awaiting verification by our placement cell administrators. You will be listed in the public directory once approved.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );

                                // ── FALLBACK (unknown status — never blank) ───────────
                                return (
                                    <Card className="border border-border bg-muted/20 shadow-sm rounded-xl">
                                        <CardContent className="p-6 flex items-start gap-4 font-sans">
                                            <div className="p-2.5 rounded-xl shrink-0 bg-muted text-muted-foreground">
                                                <HelpCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-heading font-bold text-base text-foreground">Application Status Unknown</h3>
                                                <p className="text-sm text-muted-foreground mt-1">Your application is being processed. Please check back later or contact an administrator.</p>
                                                <Button onClick={handleStartResubmit} size="sm" variant="outline" className="mt-3 text-xs">
                                                    Resubmit Application
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}

                            {/* Profile settings form if active (verified) */}
                            {myProfile && myProfile.is_verified && (
                                <Card className="border shadow-sm animate-fade-in">
                                    <CardHeader className="pb-3 border-b">
                                        <CardTitle className="text-base font-bold font-heading">Edit Profile Settings</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-sans">Quickly update your bio, skills, availability toggles, and email settings.</p>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6 text-sm font-sans">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Company Name</label>
                                                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Job Role</label>
                                                <Input value={jobRole} onChange={e => setJobRole(e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Employment Type</label>
                                                <Select value={employmentType} onValueChange={setEmploymentType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                                        <SelectItem value="Internship">Internship</SelectItem>
                                                        <SelectItem value="Contract">Contract</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Work Location</label>
                                                <Input value={workLocation} onChange={e => setWorkLocation(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">CTC</label>
                                                <Input value={ctc} onChange={e => setCtc(e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Batch (Year)</label>
                                                <Input value={batch} onChange={e => setBatch(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Branch</label>
                                                <Input value={branch} onChange={e => setBranch(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Placement Type</label>
                                                <Select value={placementType} onValueChange={setPlacementType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="On Campus">On Campus</SelectItem>
                                                        <SelectItem value="Off Campus">Off Campus</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Public Contact Email</label>
                                                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="alumni@domain.com" />
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input 
                                                    type="checkbox" 
                                                    id="settingsShowEmail" 
                                                    checked={showEmail} 
                                                    onChange={e => setShowEmail(e.target.checked)} 
                                                    className="w-4 h-4 rounded text-primary"
                                                />
                                                <label htmlFor="settingsShowEmail" className="text-xs font-bold text-muted-foreground uppercase cursor-pointer select-none font-sans">
                                                    Show Email Publicly on Profile
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase font-sans">LinkedIn URL</label>
                                            <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase font-sans">Technical Skills (Comma separated)</label>
                                            <Input value={skills} onChange={e => setSkills(e.target.value)} />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase font-sans">About / Bio Journey</label>
                                            <Textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} className="min-h-[100px]" />
                                        </div>



                                        <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 mt-2">
                                            {savingSettings ? 'Saving Settings...' : 'Save Profile Settings'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* =====================================================
                MODAL WIZARD: BECOME A MENTOR
                ===================================================== */}
            <Dialog open={showRegisterWizard} onOpenChange={setShowRegisterWizard}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xl font-bold font-heading flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 text-primary" />
                            {isResubmit ? 'Resubmit Mentor Application' : 'Become a Mentor / Alumni Connect'}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isResubmit
                                ? 'Update your details and upload a new document to resubmit for verification.'
                                : 'Complete the 2-step registration wizard to start helping juniors.'}
                        </p>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between px-6 py-2 bg-muted/40 rounded-lg text-xs font-semibold">
                        <span className={wizardStep >= 1 ? 'text-primary font-bold' : 'text-muted-foreground'}>1. Professional Details</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={wizardStep >= 2 ? 'text-primary font-bold' : 'text-muted-foreground'}>2. Verification Proof</span>
                    </div>

                    <div className="py-4 space-y-4 text-sm">
                        {wizardStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Company Name</label>
                                        <Input placeholder="Google, Microsoft, etc." value={companyName} onChange={e => setCompanyName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Job Role</label>
                                        <Input placeholder="Software Engineer, Product Manager, etc." value={jobRole} onChange={e => setJobRole(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Employment Type</label>
                                        <Select value={employmentType} onValueChange={setEmploymentType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full-time">Full-time</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Work Location</label>
                                        <Input placeholder="Bengaluru, remote, etc." value={workLocation} onChange={e => setWorkLocation(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">CTC / Package (Optional)</label>
                                        <Input placeholder="e.g. 24 LPA" value={ctc} onChange={e => setCtc(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Batch (Graduation Year)</label>
                                        <Input placeholder="e.g. 2023" value={batch} onChange={e => setBatch(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Branch</label>
                                        <Input placeholder="e.g. CSE, ECE" value={branch} onChange={e => setBranch(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Placement Type</label>
                                        <Select value={placementType} onValueChange={setPlacementType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="On Campus">On Campus</SelectItem>
                                                <SelectItem value="Off Campus">Off Campus</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Contact Email</label>
                                        <Input placeholder="alumni@domain.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input 
                                            type="checkbox" 
                                            id="wizardShowEmail" 
                                            checked={showEmail} 
                                            onChange={e => setShowEmail(e.target.checked)} 
                                            className="w-4 h-4 rounded text-primary"
                                        />
                                        <label htmlFor="wizardShowEmail" className="text-xs font-bold text-muted-foreground uppercase cursor-pointer select-none">
                                            Show Email on Profile
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">LinkedIn Profile URL</label>
                                    <Input placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Skills (Comma separated)</label>
                                    <Input placeholder="e.g. React, Python, System Design" value={skills} onChange={e => setSkills(e.target.value)} />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">About Yourself / Journey Description</label>
                                    <Textarea placeholder="Share your experience, advice, and how you can help juniors..." value={aboutMe} onChange={e => setAboutMe(e.target.value)} className="min-h-[90px]" />
                                </div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-foreground">Employment Verification Document</h3>
                                <p className="text-xs text-muted-foreground">To maintain network integrity, please upload official employment verification. This document is kept confidential and only viewed by administrators.</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Document Type</label>
                                        <Select value={docType} onValueChange={setDocType}>
                                            <SelectTrigger className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                                                <SelectItem value="Employee ID">Employee ID Card</SelectItem>
                                                <SelectItem value="Joining Letter">Joining Letter</SelectItem>
                                                <SelectItem value="Internship Letter">Internship Letter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Corporate Email (Alternative)</label>
                                        <Input placeholder="username@company.com" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="h-10" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">File Upload</label>
                                    <div className="border border-dashed p-6 rounded-lg text-center flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const uploadFile = async () => {
                                                        const res = await handleFileUpload(file, 'verification_proof');
                                                        if (res) setUploadedDoc(res);
                                                    };
                                                    uploadFile();
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
                                        {uploadedDoc ? (
                                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Proof Document Uploaded!
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Click here or drag file to upload verification proof</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4 flex gap-2">
                        {wizardStep > 1 && (
                            <Button variant="outline" onClick={() => setWizardStep(prev => prev - 1)} disabled={submittingWizard}>
                                Back
                            </Button>
                        )}
                        {wizardStep < 2 ? (
                            <Button
                                onClick={() => setWizardStep(prev => prev + 1)}
                                className="bg-primary text-white font-bold"
                            >
                                Next Step
                            </Button>
                        ) : (
                            <Button
                                onClick={handleRegisterMentor}
                                disabled={submittingWizard || !uploadedDoc}
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white font-bold"
                            >
                                {submittingWizard ? 'Submitting...' : 'Submit for Verification'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            {/* =====================================================
                MODAL: ACTION EXECUTION (ACCEPT / COMPLETE BY MENTOR)
                ===================================================== */}
            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogContent className="max-w-md font-sans">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-bold font-heading flex items-center gap-1.5">
                            {actionType === 'review_resume' && 'Write Resume Review Suggestions'}
                            {actionType === 'mock_feedback' && 'Mock Interview Action'}
                            {actionType === 'referral_feedback' && 'Provide Referral Feedback'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-3 space-y-4 text-xs">
                        {actionType === 'mock_feedback' && actionTarget?.status === 'pending' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Virtual Meeting Link (e.g. Google Meet)</label>
                                <Input placeholder="https://meet.google.com/..." value={actionMeetingLink} onChange={e => setActionMeetingLink(e.target.value)} />
                            </div>
                        )}

                        {actionType === 'mock_feedback' && actionTarget?.status === 'accepted' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Interview Performance Feedback</label>
                                <Textarea placeholder="Rate student's performance, strengths, and improvement points..." value={actionInput} onChange={e => setActionInput(e.target.value)} className="min-h-[100px]" />
                            </div>
                        )}

                        {actionType === 'review_resume' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Resume Feedback Suggestions</label>
                                <Textarea placeholder="Provide detailed comments, layout fixes, and bullet point adjustments..." value={actionInput} onChange={e => setActionInput(e.target.value)} className="min-h-[100px]" />
                            </div>
                        )}

                        {actionType === 'referral_feedback' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Referral Action Notes</label>
                                <Textarea placeholder="Add comments regarding internal submission (e.g. Job ID, portal updates)..." value={actionInput} onChange={e => setActionInput(e.target.value)} className="min-h-[100px]" />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-3 flex gap-2">
                        <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={submittingAction}>Cancel</Button>
                        <Button onClick={handleExecuteAction} disabled={submittingAction || (actionType === 'mock_feedback' && actionTarget?.status === 'pending' ? !actionMeetingLink : !actionInput)} className="bg-primary hover:bg-primary/95 text-white font-semibold">
                            {submittingAction ? 'Submitting...' : 'Submit Action'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                MODAL: RATE DIALOG (SUBMIT STARS & CLOSING NOTES)
                ===================================================== */}
            <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
                <DialogContent className="max-w-md font-sans">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-bold font-heading flex items-center gap-1.5">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Rate & Close Career Guidance Session
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Rate your experience with {ratingTarget?.mentor_profiles?.name}</p>
                    </DialogHeader>

                    <div className="py-3 space-y-4 text-xs font-sans">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase block">Rating Score</label>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(stars => (
                                    <button
                                        key={stars}
                                        type="button"
                                        onClick={() => setRatingStars(stars)}
                                        className="p-1 hover:scale-115 transition-transform"
                                    >
                                        <Star className={`w-6 h-6 ${stars <= ratingStars ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Review Comments</label>
                            <Textarea placeholder="Share your review comments and thanks to the mentor..." value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)} className="min-h-[80px]" />
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3 flex gap-2">
                        <Button variant="outline" onClick={() => setShowRateDialog(false)} disabled={submittingRating}>Cancel</Button>
                        <Button onClick={handleRatingSubmit} disabled={submittingRating || !ratingFeedback} className="bg-primary hover:bg-primary/95 text-white font-semibold">
                            {submittingRating ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                MODAL: SEND MESSAGE DIALOG
                ===================================================== */}
            <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
                <DialogContent className="max-w-md font-sans">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-bold font-heading flex items-center gap-1.5">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Send Direct Message
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">To: {messageTargetMentor?.name}</p>
                    </DialogHeader>

                    <div className="py-3 space-y-3.5 text-xs">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Message Content</label>
                            <Textarea placeholder="Type your initial message to start a conversation..." value={messageText} onChange={e => setMessageText(e.target.value)} className="min-h-[100px]" />
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3 flex gap-2">
                        <Button variant="outline" onClick={() => setShowMessageModal(false)} disabled={submittingMessage}>Cancel</Button>
                        <Button onClick={handleSendDirectMessage} disabled={submittingMessage || !messageText.trim()} className="bg-primary hover:bg-primary/95 text-white font-semibold">
                            {submittingMessage ? 'Sending...' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            {/* Delete Conversation Confirm Modal */}
            {showDeleteConfirm && deletingConversationUser && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => { setShowDeleteConfirm(false); setDeletingConversationUser(null); }} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-sm text-foreground">Delete Conversation</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">with <strong>{deletingConversationUser.userName}</strong></p>
                                </div>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                                This will permanently delete all messages in this conversation. This action cannot be undone.
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => { setShowDeleteConfirm(false); setDeletingConversationUser(null); }}
                                    disabled={deletingConversation}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                    onClick={handleDeleteConversation}
                                    disabled={deletingConversation}
                                >
                                    {deletingConversation ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Clear Messages Confirm Modal */}
            {showClearConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowClearConfirm(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-sm text-foreground">Clear Messages</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">with <strong>{selectedConversationName}</strong></p>
                                </div>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                                This will delete all messages in this conversation from the database, but keep {selectedConversationName} in your sidebar list.
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => setShowClearConfirm(false)}
                                    disabled={clearingMessages}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                    onClick={handleClearMessages}
                                    disabled={clearingMessages}
                                >
                                    {clearingMessages ? 'Clearing...' : 'Clear'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Block User Confirm Modal */}
            {showBlockConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowBlockConfirm(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 shrink-0">
                                    <UserX className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-sm text-foreground">
                                        {blocks.some(b => b.blocker_id === roleData?.user_id && b.blocked_id === selectedConversationUser) ? 'Unblock User' : 'Block User'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5"><strong>{selectedConversationName}</strong></p>
                                </div>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                                {blocks.some(b => b.blocker_id === roleData?.user_id && b.blocked_id === selectedConversationUser)
                                    ? "This will allow you and this user to send/receive messages and view each other's status."
                                    : "Blocked users cannot send or receive messages, and their presence status will always show as offline."}
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => setShowBlockConfirm(false)}
                                    disabled={blockingUser}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className={`flex-1 text-xs text-white font-bold ${
                                        blocks.some(b => b.blocker_id === roleData?.user_id && b.blocked_id === selectedConversationUser)
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                    onClick={handleToggleBlockUser}
                                    disabled={blockingUser}
                                >
                                    {blockingUser ? 'Processing...' : blocks.some(b => b.blocker_id === roleData?.user_id && b.blocked_id === selectedConversationUser) ? 'Unblock' : 'Block'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* View Profile Dialog */}
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                <DialogContent className="max-w-md font-sans">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="text-base font-bold font-heading flex items-center gap-2">
                            <Avatar className="w-8 h-8 border">
                                {profileDialogUser?.avatarUrl && <AvatarImage src={profileDialogUser.avatarUrl} alt={profileDialogUser.name} className="object-cover" />}
                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                    {profileDialogUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span>{profileDialogUser?.name}'s Profile</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4 text-xs font-sans">
                        {/* Status/Details */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Designation / Role</span>
                            <p className="text-sm font-semibold text-foreground/90">{profileDialogUser?.detail || 'No details specified.'}</p>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">About Me</span>
                            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap">
                                {profileDialogUser?.bio || 'No bio provided.'}
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skills</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {profileDialogUser?.skills && profileDialogUser.skills.length > 0 ? (
                                    profileDialogUser.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="px-2 py-0.5 text-[10px] font-semibold">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No skills listed.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-3">
                        <Button variant="outline" onClick={() => setShowProfileDialog(false)} size="sm">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toasts Rendering Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`p-3.5 rounded-lg border shadow-lg text-xs font-semibold pointer-events-auto font-sans flex items-center gap-2 animate-fade-in ${
                            t.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                            t.type === 'error' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                            'bg-sky-500/10 text-sky-600 border-sky-200'
                        }`}
                    >
                        {t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                         t.type === 'error' ? <XCircle className="w-4 h-4" /> :
                         <Info className="w-4 h-4" />}
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
