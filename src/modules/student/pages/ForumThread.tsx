import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    ArrowLeft, ChevronUp, Clock, Send, MessageSquare, Eye, Trash2, Plus, Building2, Flag, Pin 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS: Record<string, string> = {
    helpful: '👍',
    appreciate: '❤️',
    useful: '🔥',
    congrats: '🎉',
    insightful: '💡',
    support: '🙌',
    curious: '🤔',
    celebrate: '🚀'
};

const REACTION_LABELS: Record<string, string> = {
    helpful: 'Helpful',
    appreciate: 'Appreciate',
    useful: 'Useful',
    congrats: 'Congrats',
    insightful: 'Insightful',
    support: 'Support',
    curious: 'Curious',
    celebrate: 'Celebrate'
};

const renderReactionsSummary = (reactionsObj: Record<string, number> | undefined) => {
    if (!reactionsObj) return null;
    const activeReactions = Object.entries(reactionsObj).filter(([_, count]) => count > 0);
    if (activeReactions.length === 0) return null;

    const totalCount = activeReactions.reduce((sum, [_, count]) => sum + count, 0);

    return (
        <div className="flex items-center gap-1 pt-1">
            <div className="flex -space-x-1">
                {activeReactions.slice(0, 3).map(([type]) => (
                    <span key={type} className="text-sm select-none" title={REACTION_LABELS[type]}>
                        {REACTION_EMOJIS[type]}
                    </span>
                ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1 font-medium">{totalCount}</span>
        </div>
    );
};

// Helper to parse Postgres text[] attachments robustly
const parseAttachments = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    }
    return [];
};

// Helper to parse Postgres text[] tags robustly
const parseTags = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        return val.replace(/[{}]/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    }
    return [];
};

// Polymorphic author helper to batch query students, admins, and recruiters
async function fetchAuthors(items: { author_id: string; author_type: string }[]) {
    const studentIds = Array.from(new Set(items.filter(i => i.author_type === 'student' && i.author_id).map(i => i.author_id)));
    const adminIds = Array.from(new Set(items.filter(i => i.author_type === 'admin' && i.author_id).map(i => i.author_id)));
    const recruiterIds = Array.from(new Set(items.filter(i => i.author_type === 'recruiter' && i.author_id).map(i => i.author_id)));

    const authorMap: Record<string, { name: string; avatar_url: string | null; role: string }> = {};
    const queries: Promise<any>[] = [];

    if (studentIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('students')
                    .select('id, name, profile_photo_url')
                    .in('id', studentIds)
            ).then(({ data }) => {
                (data || []).forEach((s: any) => {
                    authorMap[s.id] = {
                        name: s.name,
                        avatar_url: s.profile_photo_url,
                        role: 'Student',
                    };
                });
            })
        );
    }

    if (adminIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('admins')
                    .select('id, name, profile_photo_url')
                    .in('id', adminIds)
            ).then(({ data }) => {
                (data || []).forEach((a: any) => {
                    authorMap[a.id] = {
                        name: a.name,
                        avatar_url: a.profile_photo_url,
                        role: 'Admin',
                    };
                });
            })
        );
    }

    if (recruiterIds.length > 0) {
        queries.push(
            Promise.resolve(
                insforge.database
                    .from('recruiters')
                    .select('id, name, profile_photo_url')
                    .in('id', recruiterIds)
            ).then(({ data }) => {
                (data || []).forEach((r: any) => {
                    authorMap[r.id] = {
                        name: r.name,
                        avatar_url: r.profile_photo_url,
                        role: 'Recruiter',
                    };
                });
            })
        );
    }

    try {
        await Promise.all(queries);
    } catch (err) {
        console.error('Error batch fetching authors:', err);
    }
    return authorMap;
}

export default function ForumThread() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const { user } = useUser();
    const [thread, setThread] = useState<any>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [topTrendingIds, setTopTrendingIds] = useState<string[]>([]);
    const [topFavoriteIds, setTopFavoriteIds] = useState<string[]>([]);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [upvoting, setUpvoting] = useState(false);

    // Resolved author details lookup state
    const [authors, setAuthors] = useState<Record<string, { name: string; avatar_url: string | null; role: string }>>({});

    // New Reply States (Anonymity & Drag-Drop attachments)
    const [isAnonymousReply, setIsAnonymousReply] = useState(true); // Default to Anonymous
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lightbox modal state
    const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

    // Reactions states
    const [threadReactions, setThreadReactions] = useState<Record<string, number>>({});
    const [threadUserReactions, setThreadUserReactions] = useState<string[]>([]);
    const [replyReactions, setReplyReactions] = useState<Record<string, Record<string, number>>>({});
    const [replyUserReactions, setReplyUserReactions] = useState<Record<string, string[]>>({});

    // LinkedIn Picker hover states
    const [activePickerId, setActivePickerId] = useState<string | null>(null);
    const pickerTimeoutRef = useRef<Record<string, any>>({});

    // Helpful voting states
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, { yes: number, no: number }>>({});
    const [userHelpfulVotes, setUserHelpfulVotes] = useState<Record<string, boolean | null>>({});

    // Reporting states
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<string | null>(null);
    const [reportTargetType, setReportTargetType] = useState<'thread' | 'reply' | null>(null);
    const [reportReason, setReportReason] = useState<string>('spam');
    const [reportDetails, setReportDetails] = useState<string>('');
    const [reporting, setReporting] = useState(false);

    // Admin view reports states
    const [reports, setReports] = useState<any[]>([]);
    const [showAdminReportDialog, setShowAdminReportDialog] = useState(false);
    const [selectedReportedItem, setSelectedReportedItem] = useState<{ id: string, title: string, type: string, reports: any[] } | null>(null);

    async function loadTopBadges() {
        try {
            const { data: allThreads } = await insforge.database
                .from('discussion_threads')
                .select('id, trending_score, last_engagement_at, created_at');

            const { data: allReactions } = await insforge.database
                .from('discussion_reactions')
                .select('target_id')
                .eq('target_type', 'thread');

            if (!allThreads) return;

            const nowVal = new Date().getTime();
            const topTrending = allThreads
                .map((t: any) => {
                    const lastEngagement = t.last_engagement_at || t.created_at;
                    const hours = (nowVal - new Date(lastEngagement).getTime()) / (1000 * 60 * 60);
                    const score = (t.trending_score || 0) / Math.pow(hours + 2, 1.5);
                    return { id: t.id, score };
                })
                .filter(x => x.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(x => x.id);

            const reactionCounts: Record<string, number> = {};
            (allReactions || []).forEach((r: any) => {
                reactionCounts[r.target_id] = (reactionCounts[r.target_id] || 0) + 1;
            });

            const topFavorite = Object.entries(reactionCounts)
                .map(([tid, count]) => ({ id: tid, count }))
                .filter(x => x.count >= 5)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map(x => x.id);

            setTopTrendingIds(topTrending);
            setTopFavoriteIds(topFavorite);
        } catch (err) {
            console.error("Error loading top badges:", err);
        }
    }

    async function updateThreadTrendingScore(threadId: string) {
        try {
            const { data: threadData } = await insforge.database
                .from('discussion_threads')
                .select('views_count, accepted_reply_id')
                .eq('id', threadId)
                .single();

            if (!threadData) return;

            const { count: repliesCount } = await insforge.database
                .from('discussion_replies')
                .select('*', { count: 'exact', head: true })
                .eq('thread_id', threadId);

            const { count: reactionsCount } = await insforge.database
                .from('discussion_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('target_id', threadId)
                .eq('target_type', 'thread');

            const views = threadData.views_count || 0;
            const repliesVal = repliesCount || 0;
            const reactions = reactionsCount || 0;
            const hasAcceptedAnswer = !!threadData.accepted_reply_id;

            const score = (views * 1) + (repliesVal * 15) + (reactions * 8) + (hasAcceptedAnswer ? 50 : 0);

            await insforge.database
                .from('discussion_threads')
                .update({ 
                    trending_score: score,
                    last_engagement_at: new Date().toISOString()
                })
                .eq('id', threadId);

            setThread((prev: any) => {
                if (prev && prev.id === threadId) {
                    return {
                        ...prev,
                        trending_score: score,
                        last_engagement_at: new Date().toISOString()
                    };
                }
                return prev;
            });

            await loadTopBadges();
        } catch (err) {
            console.error("Error updating trending score:", err);
        }
    }

    const renderBadges = () => {
        if (!thread) return null;
        const badges = [];
        const isTrending = topTrendingIds.includes(thread.id);
        const isFavorite = topFavoriteIds.includes(thread.id);
        
        const isHot = (new Date().getTime() - new Date(thread.created_at).getTime()) <= 24 * 60 * 60 * 1000 &&
                      (replies.length >= 2 || (thread.views_count || 0) >= 10);

        const lastEngagement = thread.last_engagement_at || thread.created_at;
        const hours = (new Date().getTime() - new Date(lastEngagement).getTime()) / (1000 * 60 * 60);
        const score = (thread.trending_score || 0) / Math.pow(hours + 2, 1.5);
        const isHelpful = !!thread.accepted_reply_id && score >= 50;

        if (isTrending) {
            badges.push(
                <Badge key="trending" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs py-0.5 px-2 font-semibold flex items-center gap-1">
                    🔥 Trending
                </Badge>
            );
        }
        if (isHot) {
            badges.push(
                <Badge key="hot" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs py-0.5 px-2 font-semibold flex items-center gap-1">
                    🚀 Hot Discussion
                </Badge>
            );
        }
        if (isFavorite) {
            badges.push(
                <Badge key="favorite" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs py-0.5 px-2 font-semibold flex items-center gap-1">
                    💎 Community Favorite
                </Badge>
            );
        }
        if (isHelpful) {
            badges.push(
                <Badge key="helpful" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs py-0.5 px-2 font-semibold flex items-center gap-1">
                    ✅ Most Helpful
                </Badge>
            );
        }

        if (badges.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
                {badges}
            </div>
        );
    };

    useEffect(() => {
        async function load() {
            try {
                const [threadRes, repliesRes, catsRes, reportsRes] = await Promise.all([
                    insforge.database.from('discussion_threads').select('*').eq('id', id).single(),
                    insforge.database.from('discussion_replies').select('*').eq('thread_id', id).order('created_at', { ascending: true }),
                    insforge.database.from('discussion_categories').select('*'),
                    role === 'admin' 
                        ? insforge.database.from('discussion_reports').select('*') 
                        : Promise.resolve({ data: [] }),
                ]);
                const t = threadRes.data;
                setThread(t);
                const loadedReplies = repliesRes.data || [];
                setReplies(loadedReplies);
                setCategories(catsRes.data || []);
                setReports(reportsRes.data || []);

                // Fetch details for thread author and comment authors
                const itemsToFetch: { author_id: string; author_type: string }[] = [];
                if (t) {
                    itemsToFetch.push({ author_id: t.author_id, author_type: t.author_type });
                }
                loadedReplies.forEach((r: any) => {
                    itemsToFetch.push({ author_id: r.author_id, author_type: r.author_type });
                });

                if (itemsToFetch.length > 0) {
                    const profiles = await fetchAuthors(itemsToFetch);
                    setAuthors(profiles);
                }

                // Load reactions for the thread
                const { data: tReactions } = await insforge.database
                    .from('discussion_reactions')
                    .select('*')
                    .eq('target_id', id)
                    .eq('target_type', 'thread');

                const tReactionsMap: Record<string, number> = {};
                const tUserReacted: string[] = [];
                (tReactions || []).forEach((r: any) => {
                    tReactionsMap[r.reaction_type] = (tReactionsMap[r.reaction_type] || 0) + 1;
                    if (user?.id && r.user_id === user.id) {
                        tUserReacted.push(r.reaction_type);
                    }
                });
                setThreadReactions(tReactionsMap);
                setThreadUserReactions(tUserReacted);

                // Load replies reactions & votes if comments exist
                if (loadedReplies.length > 0) {
                    const replyIds = loadedReplies.map((r: any) => r.id);

                    // Fetch reactions for comments
                    const { data: rReactions } = await insforge.database
                        .from('discussion_reactions')
                        .select('*')
                        .in('target_id', replyIds)
                        .eq('target_type', 'reply');

                    const rReactionsMap: Record<string, Record<string, number>> = {};
                    const rUserReacted: Record<string, string[]> = {};
                    (rReactions || []).forEach((r: any) => {
                        if (!rReactionsMap[r.target_id]) {
                            rReactionsMap[r.target_id] = {};
                        }
                        rReactionsMap[r.target_id][r.reaction_type] = (rReactionsMap[r.target_id][r.reaction_type] || 0) + 1;
                        if (user?.id && r.user_id === user.id) {
                            if (!rUserReacted[r.target_id]) {
                                rUserReacted[r.target_id] = [];
                            }
                            rUserReacted[r.target_id].push(r.reaction_type);
                        }
                    });
                    setReplyReactions(rReactionsMap);
                    setReplyUserReactions(rUserReacted);

                    // Fetch helpful votes
                    const { data: hVotes } = await insforge.database
                        .from('reply_helpful_votes')
                        .select('*')
                        .in('reply_id', replyIds);

                    const helpfulMap: Record<string, { yes: number, no: number }> = {};
                    const userVoteMap: Record<string, boolean | null> = {};

                    (hVotes || []).forEach((v: any) => {
                        if (!helpfulMap[v.reply_id]) {
                            helpfulMap[v.reply_id] = { yes: 0, no: 0 };
                        }
                        if (v.is_helpful) {
                            helpfulMap[v.reply_id].yes += 1;
                        } else {
                            helpfulMap[v.reply_id].no += 1;
                        }

                        if (user?.id && v.user_id === user.id) {
                            userVoteMap[v.reply_id] = v.is_helpful;
                        }
                    });
                    setHelpfulVotes(helpfulMap);
                    setUserHelpfulVotes(userVoteMap);
                }

                // Increment views
                if (t && id) {
                    await insforge.database.from('discussion_threads').update({ views_count: (t.views_count || 0) + 1 }).eq('id', id);
                    await updateThreadTrendingScore(id);
                } else {
                    await loadTopBadges();
                }
            } catch (err) {
                console.error("Error loading thread details:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, user?.id, role]);

    // Check if current user has already upvoted this thread
    useEffect(() => {
        async function checkUpvote() {
            if (!user?.id || !id) return;
            const { data } = await insforge.database
                .from('thread_upvotes')
                .select('id')
                .eq('thread_id', id)
                .eq('user_id', user.id)
                .maybeSingle();
            setHasUpvoted(!!data);
        }
        checkUpvote();
    }, [id, user?.id]);

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            imagePreviews.forEach(p => URL.revokeObjectURL(p));
        };
    }, [imagePreviews]);

    // Drag & Drop event handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (files: File[]) => {
        const validFiles: File[] = [];
        const errors: string[] = [];

        files.forEach(file => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                errors.push(`${file.name} is not a supported format (JPG, PNG, WebP)`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                errors.push(`${file.name} exceeds the 5MB size limit`);
                return;
            }
            validFiles.push(file);
        });

        if (errors.length > 0) {
            alert(errors.join('\n'));
        }

        setSelectedImages(prev => {
            const combined = [...prev, ...validFiles].slice(0, 4); // Limit to 4 images
            const previews = combined.map(file => URL.createObjectURL(file));
            imagePreviews.forEach(p => URL.revokeObjectURL(p));
            setImagePreviews(previews);
            return combined;
        });
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => {
            const next = prev.filter((_, i) => i !== index);
            const previews = next.map(file => URL.createObjectURL(file));
            imagePreviews.forEach(p => URL.revokeObjectURL(p));
            setImagePreviews(previews);
            return next;
        });
    };

    const handlePickerMouseEnter = (id: string) => {
        if (pickerTimeoutRef.current[id]) {
            clearTimeout(pickerTimeoutRef.current[id]);
        }
        setActivePickerId(id);
    };

    const handlePickerMouseLeave = (id: string) => {
        pickerTimeoutRef.current[id] = setTimeout(() => {
            setActivePickerId(prev => prev === id ? null : prev);
        }, 300);
    };

    async function postReply() {
        if (!newReply.trim() || !roleData?.id) return;
        setUploading(true);

        try {
            // Upload images sequentially to public bucket forum-attachments
            const uploadedUrls: string[] = [];
            for (const file of selectedImages) {
                const path = `${roleData.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { data, error } = await insforge.storage.from('forum-attachments').upload(path, file);
                if (error) {
                    console.error("Image upload failed:", error);
                } else if (data) {
                    uploadedUrls.push(data.url);
                }
            }

            const { data } = await insforge.database.from('discussion_replies').insert({
                thread_id: id,
                content: newReply,
                author_id: roleData.id,
                author_type: role,
                is_anonymous: isAnonymousReply,
                attachments: uploadedUrls
            }).select();
            
            if (data && data[0]) {
                const newReplyObj = data[0];
                setReplies(prev => [...prev, newReplyObj]);

                // Register current user details inside local authors map
                setAuthors(prev => ({
                    ...prev,
                    [roleData.id]: {
                        name: roleData.name,
                        avatar_url: roleData.profile_photo_url || null,
                        role: role === 'student' ? 'Student' : role === 'admin' ? 'Admin' : 'Recruiter',
                    }
                }));
                if (id) {
                    await updateThreadTrendingScore(id);
                }
            }
            
            setNewReply('');
            setIsAnonymousReply(true);
            setSelectedImages([]);
            setImagePreviews([]);
        } catch (err) {
            console.error("Reply creation failed:", err);
            alert("An error occurred while posting your reply.");
        } finally {
            setUploading(false);
        }
    }

    async function upvoteThread() {
        if (!thread || !user?.id || hasUpvoted || upvoting) return;
        setUpvoting(true);
        try {
            // Insert upvote record
            const { error } = await insforge.database.from('thread_upvotes').insert({
                thread_id: thread.id,
                user_id: user.id,
            }).select();
            if (error?.message || error?.code) return;
            // Increment count
            await insforge.database.from('discussion_threads')
                .update({ upvotes_count: (thread.upvotes_count || 0) + 1 })
                .eq('id', thread.id);
            setThread((prev: any) => ({ ...prev, upvotes_count: (prev.upvotes_count || 0) + 1 }));
            setHasUpvoted(true);
        } finally {
            setUpvoting(false);
        }
    }

    async function deleteThreadCascade(threadId: string) {
        // 1. Fetch reply IDs for this thread
        const { data: replyRows } = await insforge.database
            .from('discussion_replies')
            .select('id')
            .eq('thread_id', threadId);
        const replyIds = replyRows?.map(r => r.id) || [];

        // 2. Delete discussion_reports targeting the thread
        await insforge.database
            .from('discussion_reports')
            .delete()
            .eq('target_id', threadId)
            .eq('target_type', 'thread');

        // If there are replies, delete reports targeting those replies
        if (replyIds.length > 0) {
            await insforge.database
                .from('discussion_reports')
                .delete()
                .in('target_id', replyIds)
                .eq('target_type', 'reply');
        }

        // 3. Delete discussion_reactions targeting the thread
        await insforge.database
            .from('discussion_reactions')
            .delete()
            .eq('target_id', threadId)
            .eq('target_type', 'thread');

        // If there are replies, delete reactions targeting those replies
        if (replyIds.length > 0) {
            await insforge.database
                .from('discussion_reactions')
                .delete()
                .in('target_id', replyIds)
                .eq('target_type', 'reply');
        }

        // 4. Delete reply_helpful_votes
        if (replyIds.length > 0) {
            await insforge.database
                .from('reply_helpful_votes')
                .delete()
                .in('reply_id', replyIds);
        }

        // 5. Delete discussion_replies
        await insforge.database
            .from('discussion_replies')
            .delete()
            .eq('thread_id', threadId);

        // 6. Delete thread_upvotes
        await insforge.database
            .from('thread_upvotes')
            .delete()
            .eq('thread_id', threadId);

        // 7. Finally delete the thread
        await insforge.database
            .from('discussion_threads')
            .delete()
            .eq('id', threadId);
    }

    async function deleteThread() {
        if (!thread || !roleData?.id) return;
        const isUserAdmin = role === 'admin';
        if (!isUserAdmin && thread.author_id !== roleData.id) return;
        
        if (!confirm("Are you sure you want to permanently delete this thread?\n\nThis action cannot be undone.")) return;
        if (!confirm("Confirm again: delete this thread and all associated replies, reactions, and reports?")) return;

        try {
            await deleteThreadCascade(thread.id);
            navigate('/forum');
        } catch (err) {
            console.error("Error deleting thread:", err);
            alert("Failed to delete thread.");
        }
    }

    async function deleteReplyCascade(replyId: string) {
        // 1. Delete reports targeting the reply
        await insforge.database
            .from('discussion_reports')
            .delete()
            .eq('target_id', replyId)
            .eq('target_type', 'reply');

        // 2. Delete reactions targeting the reply
        await insforge.database
            .from('discussion_reactions')
            .delete()
            .eq('target_id', replyId)
            .eq('target_type', 'reply');

        // 3. Delete helpful votes targeting the reply
        await insforge.database
            .from('reply_helpful_votes')
            .delete()
            .eq('reply_id', replyId);

        // 4. Finally delete the reply
        await insforge.database
            .from('discussion_replies')
            .delete()
            .eq('id', replyId);
    }

    async function deleteReply(replyId: string) {
        if (!confirm('Delete this reply? This cannot be undone.')) return;
        
        try {
            await deleteReplyCascade(replyId);
            setReplies(prev => prev.filter(r => r.id !== replyId));
            if (id) {
                await updateThreadTrendingScore(id);
            }
        } catch (err) {
            console.error("Error deleting reply:", err);
            alert("Failed to delete reply.");
        }
    }

    async function togglePin() {
        if (!thread || role !== 'admin') return;
        const nextPinned = !thread.is_pinned;
        await insforge.database.from('discussion_threads').update({ is_pinned: nextPinned }).eq('id', thread.id);
        setThread((prev: any) => ({ ...prev, is_pinned: nextPinned }));
    }

    async function toggleReaction(targetId: string, targetType: 'thread' | 'reply', reactionType: string) {
        if (!user?.id) return;

        const isThread = targetType === 'thread';
        const currentReactions = isThread ? threadUserReactions : (replyUserReactions[targetId] || []);
        const isRemoving = currentReactions.includes(reactionType);

        // 1. Delete all existing reactions for this user & target (enforces single LinkedIn-style reaction)
        if (currentReactions.length > 0) {
            await insforge.database
                .from('discussion_reactions')
                .delete()
                .eq('user_id', user.id)
                .eq('target_id', targetId);

            if (isThread) {
                setThreadReactions(prev => {
                    const counts = { ...prev };
                    currentReactions.forEach(r => {
                        counts[r] = Math.max(0, (counts[r] || 1) - 1);
                    });
                    return counts;
                });
                setThreadUserReactions([]);
            } else {
                setReplyReactions(prev => {
                    const counts = { ...prev[targetId] };
                    currentReactions.forEach(r => {
                        counts[r] = Math.max(0, (counts[r] || 1) - 1);
                    });
                    return { ...prev, [targetId]: counts };
                });
                setReplyUserReactions(prev => ({ ...prev, [targetId]: [] }));
            }
        }

        // 2. If not removing, insert the new reaction
        if (!isRemoving) {
            const { error } = await insforge.database.from('discussion_reactions').insert({
                user_id: user.id,
                user_type: role,
                target_id: targetId,
                target_type: targetType,
                reaction_type: reactionType
            }).select();

            if (error) {
                console.error("Error toggling reaction:", error);
                return;
            }

            if (isThread) {
                setThreadUserReactions([reactionType]);
                setThreadReactions(prev => {
                    const counts = { ...prev };
                    counts[reactionType] = (counts[reactionType] || 0) + 1;
                    return counts;
                });
            } else {
                setReplyUserReactions(prev => ({ ...prev, [targetId]: [reactionType] }));
                setReplyReactions(prev => {
                    const counts = { ...prev[targetId] || {} };
                    counts[reactionType] = (counts[reactionType] || 0) + 1;
                    return { ...prev, [targetId]: counts };
                });
            }
        }

        if (isThread && id) {
            await updateThreadTrendingScore(id);
        }
    }

    async function castHelpfulVote(replyId: string, helpful: boolean) {
        if (!user?.id) return;

        const currentVote = userHelpfulVotes[replyId];

        if (currentVote === helpful) {
            // Undo vote
            await insforge.database
                .from('reply_helpful_votes')
                .delete()
                .eq('user_id', user.id)
                .eq('reply_id', replyId);

            setUserHelpfulVotes(prev => ({ ...prev, [replyId]: null }));
            setHelpfulVotes(prev => {
                const votes = { ...prev[replyId] || { yes: 0, no: 0 } };
                if (helpful) votes.yes = Math.max(0, votes.yes - 1);
                else votes.no = Math.max(0, votes.no - 1);
                return { ...prev, [replyId]: votes };
            });
        } else {
            // Cast new or updated vote
            if (currentVote !== null && currentVote !== undefined) {
                await insforge.database
                    .from('reply_helpful_votes')
                    .update({ is_helpful: helpful })
                    .eq('user_id', user.id)
                    .eq('reply_id', replyId);
                
                setUserHelpfulVotes(prev => ({ ...prev, [replyId]: helpful }));
                setHelpfulVotes(prev => {
                    const votes = { ...prev[replyId] || { yes: 0, no: 0 } };
                    if (helpful) {
                        votes.yes = votes.yes + 1;
                        votes.no = Math.max(0, votes.no - 1);
                    } else {
                        votes.no = votes.no + 1;
                        votes.yes = Math.max(0, votes.yes - 1);
                    }
                    return { ...prev, [replyId]: votes };
                });
            } else {
                await insforge.database.from('reply_helpful_votes').insert({
                    user_id: user.id,
                    reply_id: replyId,
                    is_helpful: helpful
                }).select();

                setUserHelpfulVotes(prev => ({ ...prev, [replyId]: helpful }));
                setHelpfulVotes(prev => {
                    const votes = { ...prev[replyId] || { yes: 0, no: 0 } };
                    if (helpful) votes.yes = votes.yes + 1;
                    else votes.no = votes.no + 1;
                    return { ...prev, [replyId]: votes };
                });
            }
        }
    }

    async function toggleAcceptedAnswer(replyId: string) {
        if (!thread || !roleData?.id || thread.author_id !== roleData.id) return;

        const isCurrentlyAccepted = thread.accepted_reply_id === replyId;
        const nextAcceptedId = isCurrentlyAccepted ? null : replyId;

        const { error } = await insforge.database
            .from('discussion_threads')
            .update({ accepted_reply_id: nextAcceptedId })
            .eq('id', thread.id)
            .select();

        if (error) {
            console.error("Error setting accepted answer:", error);
            alert("Could not set accepted answer.");
            return;
        }

        setThread((prev: any) => ({ ...prev, accepted_reply_id: nextAcceptedId }));

        if (thread.id) {
            await updateThreadTrendingScore(thread.id);
        }
    }

    async function submitReport() {
        if (!user?.id || !reportTargetId || !reportTargetType) return;
        setReporting(true);

        try {
            await insforge.database.from('discussion_reports').insert({
                user_id: user.id,
                user_type: role,
                target_id: reportTargetId,
                target_type: reportTargetType,
                reason: reportReason,
                details: reportDetails || null
            }).select();

            setShowReportDialog(false);
            setReportDetails('');
            alert('Thank you. The content has been reported for moderator review.');
        } catch (err) {
            console.error("Error reporting content:", err);
            alert("Could not submit report.");
        } finally {
            setReporting(false);
        }
    }

    if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded-lg" /></div>;
    if (!thread) return <div className="text-center py-20"><p>Thread not found</p><Button variant="ghost" className="mt-4" onClick={() => navigate('/forum')}>Back to Forum</Button></div>;

    const isUserAdmin = role === 'admin';
    const showThreadIdentity = !thread.is_anonymous || isUserAdmin;

    const rawThreadAuthor = authors[thread.author_id] || {
        name: 'Anonymous User',
        avatar_url: null,
        role: thread.author_type ? thread.author_type.charAt(0).toUpperCase() + thread.author_type.slice(1) : 'User'
    };

    const threadAuthor = showThreadIdentity
        ? {
            name: thread.is_anonymous ? `${rawThreadAuthor.name} (Anonymous ${rawThreadAuthor.role})` : rawThreadAuthor.name,
            avatar_url: rawThreadAuthor.avatar_url,
            role: rawThreadAuthor.role
          }
        : {
            name: thread.author_type === 'admin' 
                ? 'Anonymous Admin' 
                : thread.author_type === 'recruiter' 
                    ? 'Anonymous Recruiter' 
                    : 'Anonymous Student',
            avatar_url: null,
            role: thread.author_type === 'admin' 
                ? 'Anonymous Admin' 
                : thread.author_type === 'recruiter' 
                    ? 'Anonymous Recruiter' 
                    : 'Anonymous Student'
          };

    const category = categories.find(c => c.id === thread.category_id);
    const threadAttachments = parseAttachments(thread.attachments);
    const threadTags = parseTags(thread.tags);

    const activeUserReaction = threadUserReactions[0];
    const hasActiveReaction = !!activeUserReaction;

    // Sort accepted answer to the very top
    const sortedReplies = [...replies].sort((a, b) => {
        if (a.id === thread.accepted_reply_id) return -1;
        if (b.id === thread.accepted_reply_id) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Reports counts for this thread & comments
    const currentThreadReports = reports.filter(r => r.target_id === thread.id && r.target_type === 'thread');
    const threadReportCount = currentThreadReports.length;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/forum')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Forum</Button>
                
                <div className="flex items-center gap-2">
                    {/* Admin Pin Toggle */}
                    {isUserAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePin}
                            className={cn(
                                "h-8 transition-colors",
                                thread.is_pinned 
                                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Pin className={cn("w-4 h-4 mr-1", thread.is_pinned && "fill-current")} />
                            {thread.is_pinned ? "Pinned" : "Pin"}
                        </Button>
                    )}

                    {/* Report Dialog Trigger (only for non-owners) */}
                    {roleData?.id && thread.author_id !== roleData.id && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setReportTargetId(thread.id);
                                setReportTargetType('thread');
                                setReportReason('spam');
                                setShowReportDialog(true);
                            }}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8"
                        >
                            <Flag className="w-4 h-4 mr-1" /> Report
                        </Button>
                    )}

                    {roleData?.id && (isUserAdmin || thread.author_id === roleData.id) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={deleteThread}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                        >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete Thread
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Thread Card - Full Width (No Left Upvote Box) */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                    {/* Header Section: Author Info & Meta */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-border/40 flex-shrink-0">
                                {threadAuthor.avatar_url ? (
                                    <img src={threadAuthor.avatar_url} alt={threadAuthor.name} className="w-full h-full object-cover" />
                                ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {threadAuthor.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-foreground">{threadAuthor.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full font-medium">{threadAuthor.role}</span>
                                    {thread.is_pinned && (
                                        <Badge variant="warning" className="text-[9px] py-0 px-1.5 flex items-center gap-0.5 font-semibold">
                                            <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                                        </Badge>
                                    )}
                                    {thread.is_anonymous && (
                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] py-0 px-1.5 font-semibold">
                                            🕵️ Anonymous
                                        </Badge>
                                    )}
                                    {category && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent text-[9px] py-0 px-1.5 font-medium">
                                            {category.name}
                                        </Badge>
                                    )}
                                    {thread.company && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 flex items-center gap-0.5 border-border/60 font-medium">
                                            <Building2 className="w-2.5 h-2.5 text-muted-foreground" /> {thread.company}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <span>Posted on {new Date(thread.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    <span>•</span>
                                    <span>{thread.views_count || 0} views</span>
                                    <span>•</span>
                                    <span>{replies.length} replies</span>
                                </div>
                            </div>
                        </div>

                        {/* Admin reports indicator */}
                        {isUserAdmin && threadReportCount > 0 && (
                            <Badge 
                                variant="destructive" 
                                className="cursor-pointer select-none text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold hover:bg-destructive/90"
                                onClick={() => {
                                    setSelectedReportedItem({
                                        id: thread.id,
                                        title: thread.title,
                                        type: 'thread',
                                        reports: currentThreadReports
                                    });
                                    setShowAdminReportDialog(true);
                                }}
                            >
                                🚩 Reports: {threadReportCount}
                            </Badge>
                        )}
                    </div>

                    {/* Thread Content */}
                    <div className="space-y-3">
                        {renderBadges()}
                        <h1 className="text-2xl font-heading font-bold text-foreground leading-tight">{thread.title}</h1>
                        <p className="text-sm text-muted-foreground/95 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
                    </div>

                    {/* Thread Tags */}
                    {threadTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {threadTags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] py-0.5 px-2 border-border/40">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Multi-Image Grid */}
                    {threadAttachments.length > 0 && (
                        <div 
                            className={cn(
                                "grid gap-2 rounded-xl overflow-hidden max-w-xl",
                                threadAttachments.length === 1 && "grid-cols-1",
                                threadAttachments.length === 2 && "grid-cols-2",
                                threadAttachments.length >= 3 && "grid-cols-2 grid-rows-2"
                            )}
                        >
                            {threadAttachments.map((url, idx) => (
                                <div 
                                    key={url} 
                                    onClick={() => setSelectedModalImage(url)}
                                    className={cn(
                                        "relative overflow-hidden cursor-zoom-in bg-muted/40 aspect-video group",
                                        threadAttachments.length === 3 && idx === 0 && "row-span-2 aspect-auto h-full"
                                    )}
                                >
                                    <img 
                                        src={url} 
                                        alt={`Attachment ${idx + 1}`} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Thread Reaction Summary line */}
                    {renderReactionsSummary(threadReactions)}

                    {/* LinkedIn Reactions Controls Bar */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/10">
                        {/* React Button with Hover Picker Wrapper */}
                        <div 
                            className="relative"
                            onMouseEnter={() => handlePickerMouseEnter(thread.id)}
                            onMouseLeave={() => handlePickerMouseLeave(thread.id)}
                        >
                            {/* Floating Reaction Picker */}
                            {activePickerId === thread.id && (
                                <div 
                                    className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-800 shadow-xl rounded-full px-3 py-2 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50"
                                >
                                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                toggleReaction(thread.id, 'thread', type);
                                                setActivePickerId(null);
                                            }}
                                            className="hover:scale-135 transition-transform duration-150 active:scale-95 text-xl"
                                            title={REACTION_LABELS[type]}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (hasActiveReaction) {
                                        toggleReaction(thread.id, 'thread', activeUserReaction);
                                    } else {
                                        toggleReaction(thread.id, 'thread', 'helpful');
                                    }
                                }}
                                className={cn(
                                    "h-9 text-xs px-3 rounded-xl transition-all",
                                    hasActiveReaction 
                                        ? "text-primary hover:text-primary/90 bg-primary/10" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {hasActiveReaction ? (
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <span>{REACTION_EMOJIS[activeUserReaction]}</span>
                                        <span>{REACTION_LABELS[activeUserReaction]}</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <span>👍</span>
                                        <span>React</span>
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <h3 className="font-heading font-semibold flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5" />{replies.length} Replies
            </h3>

            {/* Replies List */}
            <div className="space-y-4">
                {sortedReplies.map(reply => {
                    const showReplyIdentity = !reply.is_anonymous || isUserAdmin;
                    const rawReplyAuthor = authors[reply.author_id] || {
                        name: 'Anonymous User',
                        avatar_url: null,
                        role: reply.author_type ? reply.author_type.charAt(0).toUpperCase() + reply.author_type.slice(1) : 'User'
                    };

                    const replyAuthor = showReplyIdentity
                        ? {
                            name: reply.is_anonymous ? `${rawReplyAuthor.name} (Anonymous ${rawReplyAuthor.role})` : rawReplyAuthor.name,
                            avatar_url: rawReplyAuthor.avatar_url,
                            role: rawReplyAuthor.role
                          }
                        : {
                            name: reply.author_type === 'admin' 
                                ? 'Anonymous Admin' 
                                : reply.author_type === 'recruiter' 
                                    ? 'Anonymous Recruiter' 
                                    : 'Anonymous Student',
                            avatar_url: null,
                            role: reply.author_type === 'admin' 
                                ? 'Anonymous Admin' 
                                : reply.author_type === 'recruiter' 
                                    ? 'Anonymous Recruiter' 
                                    : 'Anonymous Student'
                          };

                    const replyAttachments = parseAttachments(reply.attachments);
                    const isAccepted = thread.accepted_reply_id === reply.id;
                    const canAccept = roleData?.id && thread.author_id === roleData.id;

                    const votes = helpfulVotes[reply.id] || { yes: 0, no: 0 };
                    const userVote = userHelpfulVotes[reply.id];

                    const replyActiveReaction = replyUserReactions[reply.id]?.[0];
                    const hasReplyActiveReaction = !!replyActiveReaction;

                    const currentReplyReports = reports.filter(r => r.target_id === reply.id && r.target_type === 'reply');
                    const replyReportCount = currentReplyReports.length;

                    return (
                        <Card 
                            key={reply.id} 
                            className={cn(
                                "border transition-all duration-300",
                                isAccepted 
                                    ? "border-emerald-500/40 bg-emerald-950/10 backdrop-blur-md shadow-emerald-500/5 shadow-md" 
                                    : "border-border/40 bg-card/40 backdrop-blur-sm"
                            )}
                        >
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8 border border-border/40 flex-shrink-0">
                                        {replyAuthor.avatar_url ? (
                                            <img src={replyAuthor.avatar_url} alt={replyAuthor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                                {replyAuthor.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Reply Author details & controls */}
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                                <span className="font-semibold text-foreground">{replyAuthor.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full font-medium">{replyAuthor.role}</span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-muted-foreground">{new Date(reply.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                {reply.is_anonymous && (
                                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] py-0 px-1.5 font-semibold">
                                                        🕵️ Anonymous
                                                    </Badge>
                                                )}
                                                {isAccepted && (
                                                    <Badge className="bg-emerald-500 text-white text-[10px] py-0 px-1.5 font-semibold flex items-center gap-0.5">
                                                        ✓ Accepted Answer
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Top right buttons: Accept, Report, Delete */}
                                            <div className="flex items-center gap-1.5">
                                                {/* Reports Badge (Admins Only) */}
                                                {isUserAdmin && replyReportCount > 0 && (
                                                    <Badge 
                                                        variant="destructive" 
                                                        className="cursor-pointer select-none text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold hover:bg-destructive/90"
                                                        onClick={() => {
                                                            setSelectedReportedItem({
                                                                id: reply.id,
                                                                title: reply.content,
                                                                type: 'reply',
                                                                reports: currentReplyReports
                                                            });
                                                            setShowAdminReportDialog(true);
                                                        }}
                                                    >
                                                        🚩 Reports: {replyReportCount}
                                                    </Badge>
                                                )}

                                                {/* Mark accepted answer button */}
                                                {canAccept && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleAcceptedAnswer(reply.id)}
                                                        className={cn(
                                                            "h-7 text-xs px-2 rounded-md transition-all",
                                                            isAccepted 
                                                                ? "text-emerald-500 hover:text-emerald-600 bg-emerald-500/15" 
                                                                : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                                                        )}
                                                    >
                                                        ✓ {isAccepted ? "Accepted" : "Accept Answer"}
                                                    </Button>
                                                )}

                                                {/* Report reply button (only for non-owners) */}
                                                {roleData?.id && reply.author_id !== roleData.id && (
                                                    <button
                                                        onClick={() => {
                                                            setReportTargetId(reply.id);
                                                            setReportTargetType('reply');
                                                            setReportReason('spam');
                                                            setShowReportDialog(true);
                                                        }}
                                                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        title="Report reply"
                                                    >
                                                        <Flag className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {(isUserAdmin || (roleData?.id && reply.author_id === roleData.id)) && (
                                                    <button
                                                        onClick={() => deleteReply(reply.id)}
                                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        title="Delete reply"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{reply.content}</p>

                                        {/* Reply Attachments Grid */}
                                        {replyAttachments.length > 0 && (
                                            <div 
                                                className={cn(
                                                    "grid gap-2 mt-3 rounded-xl overflow-hidden max-w-md",
                                                    replyAttachments.length === 1 && "grid-cols-1",
                                                    replyAttachments.length === 2 && "grid-cols-2",
                                                    replyAttachments.length >= 3 && "grid-cols-2 grid-rows-2"
                                                )}
                                            >
                                                {replyAttachments.map((url, idx) => (
                                                    <div 
                                                        key={url} 
                                                        onClick={() => setSelectedModalImage(url)}
                                                        className={cn(
                                                            "relative overflow-hidden cursor-zoom-in bg-muted/40 aspect-video group",
                                                            replyAttachments.length === 3 && idx === 0 && "row-span-2 aspect-auto h-full"
                                                        )}
                                                    >
                                                        <img 
                                                            src={url} 
                                                            alt={`Attachment ${idx + 1}`} 
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reply Reactions summary line */}
                                {renderReactionsSummary(replyReactions[reply.id])}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/10">
                                    {/* LinkedIn Reactions Controls Bar */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* React Button with Hover Picker Wrapper */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handlePickerMouseEnter(reply.id)}
                                            onMouseLeave={() => handlePickerMouseLeave(reply.id)}
                                        >
                                            {/* Floating Reaction Picker */}
                                            {activePickerId === reply.id && (
                                                <div 
                                                    className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-800 shadow-xl rounded-full px-3 py-2 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50"
                                                >
                                                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => {
                                                                toggleReaction(reply.id, 'reply', type);
                                                                setActivePickerId(null);
                                                            }}
                                                            className="hover:scale-135 transition-transform duration-150 active:scale-95 text-xl"
                                                            title={REACTION_LABELS[type]}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (hasReplyActiveReaction) {
                                                        toggleReaction(reply.id, 'reply', replyActiveReaction);
                                                    } else {
                                                        toggleReaction(reply.id, 'reply', 'helpful');
                                                    }
                                                }}
                                                className={cn(
                                                    "h-8 text-xs px-2.5 rounded-lg transition-all",
                                                    hasReplyActiveReaction 
                                                        ? "text-primary hover:text-primary/90 bg-primary/10" 
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {hasReplyActiveReaction ? (
                                                    <span className="flex items-center gap-1 font-bold">
                                                        <span>{REACTION_EMOJIS[replyActiveReaction]}</span>
                                                        <span>{REACTION_LABELS[replyActiveReaction]}</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <span>👍</span>
                                                        <span>React</span>
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Was this answer helpful voting */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>Was this answer helpful?</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => castHelpfulVote(reply.id, true)}
                                                className={cn(
                                                    "px-2 py-0.5 rounded border transition-all",
                                                    userVote === true 
                                                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 font-medium"
                                                        : "bg-muted/30 border-border/20 hover:bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                👍 Yes ({votes.yes})
                                            </button>
                                            <button
                                                onClick={() => castHelpfulVote(reply.id, false)}
                                                className={cn(
                                                    "px-2 py-0.5 rounded border transition-all",
                                                    userVote === false 
                                                        ? "bg-red-500/15 border-red-500/40 text-red-500 font-medium"
                                                        : "bg-muted/30 border-border/20 hover:bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                👎 No ({votes.no})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Reply Form */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-4 space-y-4">
                    {/* Reply As Anonymity Select */}
                    <div className="space-y-2">
                        <Label>Reply As</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <input 
                                    type="radio" 
                                    name="reply_as" 
                                    checked={isAnonymousReply} 
                                    onChange={() => setIsAnonymousReply(true)} 
                                    className="accent-primary w-4 h-4"
                                    disabled={uploading}
                                />
                                <span>🕵️ Anonymous</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <input 
                                    type="radio" 
                                    name="reply_as" 
                                    checked={!isAnonymousReply} 
                                    onChange={() => setIsAnonymousReply(false)} 
                                    className="accent-primary w-4 h-4"
                                    disabled={uploading}
                                />
                                <span>👤 Real Name ({roleData?.name})</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea 
                            placeholder="Write your reply..." 
                            value={newReply} 
                            onChange={e => setNewReply(e.target.value)} 
                            rows={3} 
                            disabled={uploading}
                        />
                    </div>

                    {/* Drag & Drop Attachments Panel */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Attachments (Max 4 images, 5MB each)</Label>
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={cn(
                                "border border-dashed border-border hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 bg-muted/10 min-h-[90px]",
                                isDragging && "border-primary bg-primary/5 border-2 scale-[0.99]",
                                uploading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Plus className="w-5 h-5 text-muted-foreground" />
                            <p className="text-xs font-medium text-foreground">Drop images here, or <span className="text-primary hover:underline">Click to Upload</span></p>
                            <p className="text-[10px] text-muted-foreground">Supported: JPG, PNG, WebP</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect} 
                                multiple 
                                accept="image/jpeg,image/png,image/webp" 
                                className="hidden" 
                                disabled={uploading}
                            />
                        </div>

                        {/* Attachment Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {imagePreviews.map((url, idx) => (
                                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(idx);
                                            }}
                                            disabled={uploading}
                                            className="absolute top-1 right-1 bg-black/75 hover:bg-black text-white rounded-full p-1 transition-colors text-[10px] w-5 h-5 flex items-center justify-center disabled:opacity-50"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={postReply} 
                        disabled={!newReply.trim() || uploading}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading media..." : "Post Reply"}
                    </Button>
                </CardContent>
            </Card>

            {/* Centered Image Lightbox Modal */}
            {selectedModalImage && (
                <Dialog open={!!selectedModalImage} onOpenChange={() => setSelectedModalImage(null)}>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            <img 
                                src={selectedModalImage} 
                                alt="Lightbox Preview" 
                                className="max-w-full max-h-[85vh] object-contain rounded-lg select-none transition-all cursor-zoom-out"
                                onClick={() => setSelectedModalImage(null)}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-8 h-8"
                                onClick={() => setSelectedModalImage(null)}
                            >
                                ✕
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Reporting Dialog */}
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Report Content</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Reason for Report</Label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spam">Spam</SelectItem>
                                    <SelectItem value="harassment">Harassment</SelectItem>
                                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                    <SelectItem value="misleading">Misleading Information</SelectItem>
                                    <SelectItem value="off-topic">Off-topic</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Additional Details (optional)</Label>
                            <Textarea 
                                placeholder="Describe why this content violates guidelines..." 
                                value={reportDetails} 
                                onChange={e => setReportDetails(e.target.value)}
                                rows={3}
                                disabled={reporting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowReportDialog(false); setReportDetails(''); }} disabled={reporting}>
                            Cancel
                        </Button>
                        <Button onClick={submitReport} disabled={!reportReason || reporting} variant="destructive">
                            {reporting ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin View Reports Dialog */}
            <Dialog open={showAdminReportDialog} onOpenChange={setShowAdminReportDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1.5 text-red-500">
                            <span>🚩 Content Report History</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Content Preview</p>
                            <p className="text-sm font-semibold italic">"{selectedReportedItem?.title}"</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Flag History</p>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {selectedReportedItem?.reports.map((r: any) => (
                                    <div key={r.id} className="border border-border/40 bg-muted/20 p-2.5 rounded-lg text-xs space-y-1">
                                        <div className="flex justify-between items-center">
                                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 capitalize font-semibold text-[9px] py-0 px-1.5">
                                                {r.reason}
                                            </Badge>
                                            <span className="text-[9px] text-muted-foreground">
                                                {new Date(r.created_at).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                        {r.details && (
                                            <p className="text-muted-foreground italic font-medium mt-1">"{r.details}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdminReportDialog(false)}>
                            Close
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={async () => {
                                if (selectedReportedItem) {
                                    try {
                                        if (selectedReportedItem.type === 'thread') {
                                            if (!confirm("Are you sure you want to permanently delete this thread?\n\nThis action cannot be undone.")) return;
                                            if (!confirm("Confirm again: delete this thread and all associated replies, reactions, and reports?")) return;
                                            await deleteThreadCascade(selectedReportedItem.id);
                                            setShowAdminReportDialog(false);
                                            alert('Content deleted successfully.');
                                            navigate('/forum');
                                        } else {
                                            if (!confirm("Are you sure you want to permanently delete this reply?\n\nThis action cannot be undone.")) return;
                                            await deleteReplyCascade(selectedReportedItem.id);
                                            setReplies(prev => prev.filter(r => r.id !== selectedReportedItem.id));
                                            setShowAdminReportDialog(false);
                                            alert('Content deleted successfully.');
                                        }
                                    } catch (err) {
                                        console.error("Error deleting reported content:", err);
                                        alert("Failed to delete content.");
                                    }
                                }
                            }}
                        >
                            Delete Flagged Content
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
