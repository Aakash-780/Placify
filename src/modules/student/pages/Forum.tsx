import React, { useEffect, useState, useRef } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@insforge/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    MessageSquare, Plus, Eye, Clock, Pin,
    Search, ArrowRight, Trash2, Building2, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined list of placement-focused tags
const PRESET_TAGS = [
    'DSA', 'Resume', 'Interview', 'Placement', 'OffCampus', 'Amazon', 'Google', 'Microsoft', 
    'Backend', 'Frontend', 'Aptitude', 'OA', 'HRRound', 'CareerAdvice'
];

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

export default function Forum() {
    const navigate = useNavigate();
    const { role, roleData } = useRole();
    const { user } = useUser();
    const [threads, setThreads] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const filterCategory = searchParams.get('category') || 'all';
    const setFilterCategory = (category: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('category', category);
            return next;
        });
    };
    const sortBy = searchParams.get('sort') || 'trending';
    const setSortBy = (sort: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('sort', sort);
            return next;
        });
    };
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // New thread state values
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true); // Default to Anonymous
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Attachment & Upload States
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lightbox modal state
    const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

    // Metadata states
    const [authors, setAuthors] = useState<Record<string, { name: string; avatar_url: string | null; role: string }>>({});
    const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
    const [lastActivities, setLastActivities] = useState<Record<string, string>>({});

    // Reaction states
    const [threadReactions, setThreadReactions] = useState<Record<string, Record<string, number>>>({});
    const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

    // LinkedIn Picker hover states
    const [activePickerId, setActivePickerId] = useState<string | null>(null);
    const pickerTimeoutRef = useRef<Record<string, any>>({});

    // Moderation queue states
    const activeTab = (searchParams.get('tab') as 'threads' | 'moderation') || 'threads';
    const setActiveTab = (tab: 'threads' | 'moderation') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };
    const [reports, setReports] = useState<any[]>([]);

    // Reporting states
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<string | null>(null);
    const [reportTargetType, setReportTargetType] = useState<'thread' | 'reply' | null>(null);
    const [reportReason, setReportReason] = useState<string>('spam');
    const [reportDetails, setReportDetails] = useState<string>('');
    const [reporting, setReporting] = useState(false);

    // Admin view reports states
    const [showAdminReportDialog, setShowAdminReportDialog] = useState(false);
    const [selectedReportedItem, setSelectedReportedItem] = useState<{ id: string, title: string, type: string, reports: any[] } | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                const [threadsRes, catsRes, repliesRes] = await Promise.all([
                    insforge.database.from('discussion_threads').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
                    insforge.database.from('discussion_categories').select('*'),
                    insforge.database.from('discussion_replies').select('thread_id, created_at'),
                ]);

                const loadedThreads = threadsRes.data || [];
                setThreads(loadedThreads);
                setCategories(catsRes.data || []);

                const counts: Record<string, number> = {};
                const activities: Record<string, string> = {};
                (repliesRes.data || []).forEach((r: any) => {
                    counts[r.thread_id] = (counts[r.thread_id] || 0) + 1;
                    const prev = activities[r.thread_id];
                    if (!prev || new Date(r.created_at) > new Date(prev)) {
                        activities[r.thread_id] = r.created_at;
                    }
                });
                setReplyCounts(counts);
                setLastActivities(activities);

                // Fetch reactions for all threads
                const threadIds = loadedThreads.map((t: any) => t.id);
                if (threadIds.length > 0) {
                    const { data: reactionsRes } = await insforge.database
                        .from('discussion_reactions')
                        .select('*')
                        .in('target_id', threadIds)
                        .eq('target_type', 'thread');

                    const countsMap: Record<string, Record<string, number>> = {};
                    const userReactionsMap: Record<string, string[]> = {};

                    (reactionsRes || []).forEach((r: any) => {
                        if (!countsMap[r.target_id]) {
                            countsMap[r.target_id] = {};
                        }
                        countsMap[r.target_id][r.reaction_type] = (countsMap[r.target_id][r.reaction_type] || 0) + 1;

                        if (user?.id && r.user_id === user.id) {
                            if (!userReactionsMap[r.target_id]) {
                                userReactionsMap[r.target_id] = [];
                            }
                            userReactionsMap[r.target_id].push(r.reaction_type);
                        }
                    });

                    setThreadReactions(countsMap);
                    setUserReactions(userReactionsMap);
                }

                if (loadedThreads.length > 0) {
                    const authorProfiles = await fetchAuthors(loadedThreads);
                    setAuthors(authorProfiles);
                }

                // If user is admin, fetch reports
                if (role === 'admin') {
                    await fetchReportsWithDetails();
                }
            } catch (err) {
                console.error("Error loading forum data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [user?.id, role]);

    // Cleanup object URLs to prevent leaks
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

    async function createThread() {
        if (!newTitle.trim() || !newContent.trim() || !roleData?.id) return;
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

            const { data, error } = await insforge.database.from('discussion_threads').insert({
                title: newTitle,
                content: newContent,
                author_id: roleData.id,
                author_type: role,
                company: newCompany || null,
                category_id: newCategoryId || null,
                is_anonymous: isAnonymous,
                attachments: uploadedUrls,
                tags: selectedTags
            }).select();
            
            if (data && data[0]) {
                const newThreadObj = data[0];
                setThreads(prev => [newThreadObj, ...prev]);
                
                // Add details of user to dynamic authors map
                setAuthors(prev => ({
                    ...prev,
                    [roleData.id]: {
                        name: roleData.name,
                        avatar_url: roleData.profile_photo_url || null,
                        role: role === 'student' ? 'Student' : role === 'admin' ? 'Admin' : 'Recruiter',
                    }
                }));
            }

            // Reset dialog state
            setShowCreate(false);
            setNewTitle(''); 
            setNewContent(''); 
            setNewCompany('');
            setIsAnonymous(true);
            setSelectedTags([]);
            setSelectedImages([]);
            setImagePreviews([]);
        } catch (err) {
            console.error("Create thread exception:", err);
            alert("An error occurred while posting your thread.");
        } finally {
            setUploading(false);
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

    async function deleteThread(e: React.MouseEvent, threadId: string) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to permanently delete this thread?\n\nThis action cannot be undone.")) return;
        if (!confirm("Confirm again: delete this thread and all associated replies, reactions, and reports?")) return;

        try {
            await deleteThreadCascade(threadId);
            setThreads(prev => prev.filter(t => t.id !== threadId));
            setReports(prev => prev.filter(r => r.thread?.id !== threadId));
            alert('Thread deleted successfully.');
        } catch (err) {
            console.error("Error deleting thread:", err);
            alert("Failed to delete thread.");
        }
    }

    async function dismissAllReportsForThread(threadId: string, reportsList: any[]) {
        if (!confirm('Are you sure you want to dismiss all reports for this thread?')) return;
        
        try {
            const reportIds = reportsList.map(r => r.id);
            
            if (reportIds.length > 0) {
                await insforge.database
                    .from('discussion_reports')
                    .delete()
                    .in('id', reportIds);
                
                setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
                alert('All reports for this thread have been dismissed.');
            }
        } catch (err) {
            console.error("Error dismissing reports:", err);
            alert("Failed to dismiss reports.");
        }
    }

    async function deleteThreadAndCleanUp(threadId: string, reportsList: any[]) {
        if (!confirm("Are you sure you want to permanently delete this thread?\n\nThis action cannot be undone.")) return;
        if (!confirm("Confirm again: delete this thread and all associated replies, reactions, and reports?")) return;

        try {
            await deleteThreadCascade(threadId);
            setThreads(prev => prev.filter(t => t.id !== threadId));
            
            const reportIdsToRemove = reportsList.map(r => r.id);
            setReports(prev => prev.filter(r => !reportIdsToRemove.includes(r.id)));

            alert('Thread and all associated records deleted successfully.');
        } catch (err) {
            console.error("Error executing cascade delete:", err);
            alert("Failed to delete thread.");
        }
    }

    async function togglePin(e: React.MouseEvent, t: any) {
        e.stopPropagation();
        const nextPinned = !t.is_pinned;
        await insforge.database.from('discussion_threads').update({ is_pinned: nextPinned }).eq('id', t.id);
        
        setThreads(prev => prev.map(thread => thread.id === t.id ? { ...thread, is_pinned: nextPinned } : thread).sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }));
    }

    async function toggleReaction(e: React.MouseEvent, threadId: string, reactionType: string) {
        e.stopPropagation();
        if (!user?.id) return;

        const currentReactions = userReactions[threadId] || [];
        const isRemoving = currentReactions.includes(reactionType);

        // 1. Delete all existing reactions for this user & target (enforces single LinkedIn-style reaction)
        if (currentReactions.length > 0) {
            await insforge.database
                .from('discussion_reactions')
                .delete()
                .eq('user_id', user.id)
                .eq('target_id', threadId);

            setThreadReactions(prev => {
                const counts = { ...prev[threadId] };
                currentReactions.forEach(r => {
                    counts[r] = Math.max(0, (counts[r] || 1) - 1);
                });
                return { ...prev, [threadId]: counts };
            });
            setUserReactions(prev => ({ ...prev, [threadId]: [] }));
        }

        // 2. If not removing, insert the new reaction
        if (!isRemoving) {
            const { error } = await insforge.database.from('discussion_reactions').insert({
                user_id: user.id,
                user_type: role,
                target_id: threadId,
                target_type: 'thread',
                reaction_type: reactionType
            }).select();

            if (error) {
                console.error("Error adding reaction:", error);
                return;
            }

            setUserReactions(prev => ({
                ...prev,
                [threadId]: [reactionType]
            }));
            setThreadReactions(prev => {
                const counts = { ...prev[threadId] || {} };
                counts[reactionType] = (counts[reactionType] || 0) + 1;
                return { ...prev, [threadId]: counts };
            });
        }
        
        await updateThreadTrendingScore(threadId);
    }

    async function dismissReport(reportId: string) {
        await insforge.database.from('discussion_reports').delete().eq('id', reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
    }

    async function removeReportedContent(report: any) {
        const targetLabel = report.target_type === 'thread' ? 'thread' : 'reply';
        if (!confirm(`Are you sure you want to permanently delete this ${targetLabel}?\n\nThis action cannot be undone.`)) return;

        if (report.target_type === 'thread') {
            await insforge.database.from('discussion_threads').delete().eq('id', report.target_id);
            setThreads(prev => prev.filter(t => t.id !== report.target_id));
        } else {
            await insforge.database.from('discussion_replies').delete().eq('id', report.target_id);
        }

        await dismissReport(report.id);
        alert('Content deleted successfully.');
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

    const getReactionCount = (threadId: string) => {
        const reactions = threadReactions[threadId];
        if (!reactions) return 0;
        return Object.values(reactions).reduce((sum, count) => sum + count, 0);
    };

    const getDecayedScore = (thread: any) => {
        const baseScore = thread.trending_score || 0;
        const lastEngagement = thread.last_engagement_at || thread.created_at;
        const hours = (new Date().getTime() - new Date(lastEngagement).getTime()) / (1000 * 60 * 60);
        return baseScore / Math.pow(hours + 2, 1.5);
    };

    const { topTrendingIds, topFavoriteIds, decayedScoresMap } = React.useMemo(() => {
        const scoresMap: Record<string, number> = {};
        threads.forEach(t => {
            scoresMap[t.id] = getDecayedScore(t);
        });

        const trending = [...threads]
            .map(t => ({ id: t.id, score: scoresMap[t.id] }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(x => x.id);

        const favorite = [...threads]
            .map(t => ({ id: t.id, reactionCount: getReactionCount(t.id) }))
            .filter(x => x.reactionCount >= 5)
            .sort((a, b) => b.reactionCount - a.reactionCount)
            .slice(0, 3)
            .map(x => x.id);

        return { topTrendingIds: trending, topFavoriteIds: favorite, decayedScoresMap: scoresMap };
    }, [threads, threadReactions]);

    const filtered = threads.filter(t => {
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.company?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || t.category_id === filterCategory;
        return matchSearch && matchCat;
    });

    const sortedAndFiltered = React.useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) {
                return a.is_pinned ? -1 : 1;
            }
            if (sortBy === 'trending') {
                return (decayedScoresMap[b.id] || 0) - (decayedScoresMap[a.id] || 0);
            }
            if (sortBy === 'latest') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (sortBy === 'viewed') {
                return (b.views_count || 0) - (a.views_count || 0);
            }
            if (sortBy === 'replied') {
                return (replyCounts[b.id] || 0) - (replyCounts[a.id] || 0);
            }
            if (sortBy === 'reacted') {
                return getReactionCount(b.id) - getReactionCount(a.id);
            }
            return 0;
        });
    }, [filtered, sortBy, decayedScoresMap, replyCounts, threadReactions]);

    const groupedReports = React.useMemo(() => {
        const grouped: Record<string, { thread: any; reports: any[] }> = {};
        reports.forEach(report => {
            const threadId = report.thread?.id;
            if (!threadId) return;
            if (!grouped[threadId]) {
                grouped[threadId] = { thread: report.thread, reports: [] };
            }
            grouped[threadId].reports.push(report);
        });
        // Sort cards with the highest report count first
        return Object.values(grouped).sort((a, b) => b.reports.length - a.reports.length);
    }, [reports]);

    const renderBadges = (t: any) => {
        const badges = [];
        const isTrending = topTrendingIds.includes(t.id);
        const isFavorite = topFavoriteIds.includes(t.id);
        
        const isHot = (new Date().getTime() - new Date(t.created_at).getTime()) <= 24 * 60 * 60 * 1000 &&
                      ((replyCounts[t.id] || 0) >= 2 || (t.views_count || 0) >= 10);
                      
        const decayedScore = decayedScoresMap[t.id] || 0;
        const isHelpful = !!t.accepted_reply_id && decayedScore >= 50;

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
            <div className="flex flex-wrap gap-1.5 mb-1.5" onClick={e => e.stopPropagation()}>
                {badges}
            </div>
        );
    };

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

            setThreads(prev => prev.map(t => {
                if (t.id === threadId) {
                    return {
                        ...t,
                        trending_score: score,
                        last_engagement_at: new Date().toISOString()
                    };
                }
                return t;
            }));
        } catch (err) {
            console.error("Error updating trending score:", err);
        }
    }

    async function fetchReportsWithDetails() {
        try {
            const { data: reportsData } = await insforge.database
                .from('discussion_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (!reportsData || reportsData.length === 0) {
                setReports([]);
                return;
            }

            const threadIds = reportsData.filter(r => r.target_type === 'thread').map(r => r.target_id);
            const replyIds = reportsData.filter(r => r.target_type === 'reply').map(r => r.target_id);

            // Fetch threads details
            let fetchedThreads: any[] = [];
            if (threadIds.length > 0) {
                const { data } = await insforge.database
                    .from('discussion_threads')
                    .select('id, title, content, created_at, author_id, author_type')
                    .in('id', threadIds);
                fetchedThreads = data || [];
            }

            // Fetch replies details
            let fetchedReplies: any[] = [];
            if (replyIds.length > 0) {
                const { data } = await insforge.database
                    .from('discussion_replies')
                    .select('id, thread_id, content, created_at, author_id, author_type')
                    .in('id', replyIds);
                fetchedReplies = data || [];
            }

            // For the replies, we also need the parent thread details
            const parentThreadIds = Array.from(new Set(fetchedReplies.map(r => r.thread_id)));
            let fetchedParentThreads: any[] = [];
            if (parentThreadIds.length > 0) {
                const { data } = await insforge.database
                    .from('discussion_threads')
                    .select('id, title, content, created_at, author_id, author_type')
                    .in('id', parentThreadIds);
                fetchedParentThreads = data || [];
            }

            // Combine all threads
            const allThreads = [...fetchedThreads, ...fetchedParentThreads];
            const threadsMap = allThreads.reduce((map, t) => {
                map[t.id] = t;
                return map;
            }, {} as Record<string, any>);

            const repliesMap = fetchedReplies.reduce((map, r) => {
                map[r.id] = r;
                return map;
            }, {} as Record<string, any>);

            // Fetch author profiles
            const authorLookups: { author_id: string; author_type: string }[] = [];
            allThreads.forEach(t => {
                if (t.author_id) authorLookups.push({ author_id: t.author_id, author_type: t.author_type });
            });
            fetchedReplies.forEach(r => {
                if (r.author_id) authorLookups.push({ author_id: r.author_id, author_type: r.author_type });
            });
            reportsData.forEach(r => {
                if (r.user_id && r.user_type) {
                    authorLookups.push({ author_id: r.user_id, author_type: r.user_type });
                }
            });

            let authorNamesMap: Record<string, { name: string; avatar_url: string | null; role: string }> = {};
            if (authorLookups.length > 0) {
                authorNamesMap = await fetchAuthors(authorLookups);
            }

            // Enrich reports
            const enrichedReports = reportsData.map(report => {
                let threadInfo = null;
                let replyInfo = null;

                if (report.target_type === 'thread') {
                    const thread = threadsMap[report.target_id];
                    if (thread) {
                        const author = authorNamesMap[thread.author_id] || { name: 'Anonymous Student' };
                        threadInfo = {
                            id: thread.id,
                            title: thread.title,
                            content: thread.content,
                            created_at: thread.created_at,
                            author_name: author.name
                        };
                    }
                } else if (report.target_type === 'reply') {
                    const reply = repliesMap[report.target_id];
                    if (reply) {
                        const parentThread = threadsMap[reply.thread_id];
                        const author = authorNamesMap[reply.author_id] || { name: 'Anonymous Student' };
                        replyInfo = {
                            id: reply.id,
                            content: reply.content,
                            created_at: reply.created_at,
                            author_name: author.name
                        };
                        if (parentThread) {
                            threadInfo = {
                                id: parentThread.id,
                                title: parentThread.title,
                                content: parentThread.content,
                                created_at: parentThread.created_at,
                                author_name: authorNamesMap[parentThread.author_id]?.name || 'Anonymous Student'
                            };
                        }
                    }
                }

                const reporter = authorNamesMap[report.user_id] || { name: 'Anonymous User' };

                return {
                    ...report,
                    thread: threadInfo,
                    reply: replyInfo,
                    reporter_name: reporter.name
                };
            });

            setReports(enrichedReports.filter(r => r.thread !== null));
        } catch (err) {
            console.error("Error loading enriched reports:", err);
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Community Forum</h1>
                    <p className="text-muted-foreground mt-1">This community is yours — ask freely, share openly, and learn from real student experiences.</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4 mr-2" />New Thread
                </Button>
            </div>

            {/* Admin Tabs */}
            {role === 'admin' && (
                <div className="flex border-b border-border/40 gap-4">
                    <button
                        onClick={() => setActiveTab('threads')}
                        className={cn(
                            "pb-2 font-semibold text-sm border-b-2 transition-all",
                            activeTab === 'threads' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Discussion Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('moderation')}
                        className={cn(
                            "pb-2 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5",
                            activeTab === 'moderation' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Moderation Queue
                        {reports.length > 0 && (
                            <Badge variant="destructive" className="py-0 px-1.5 text-[10px] font-bold">
                                {reports.length}
                            </Badge>
                        )}
                    </button>
                </div>
            )}

            {role === 'admin' && activeTab === 'moderation' ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Flagged Content Reports</h2>
                    {groupedReports.length === 0 ? (
                        <Card><CardContent className="p-8 text-center text-muted-foreground">No reports found.</CardContent></Card>
                    ) : (
                        <div className="space-y-3">
                            {groupedReports.map((group) => {
                                const thread = group.thread;
                                const reportsForThread = group.reports;

                                const threadTitle = thread.title || 'Unknown Thread';
                                const authorName = thread.author_name || 'Anonymous Student';
                                const creationDate = thread.created_at
                                    ? new Date(thread.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : 'N/A';
                                const contentPreview = thread.content || '';

                                return (
                                    <Card key={thread.id} className="border-border/40 bg-card/60 backdrop-blur-sm">
                                        <CardContent className="p-5 flex flex-col gap-4">
                                            {/* Thread Header with Report Badge */}
                                            <div className="flex items-start justify-between gap-3 flex-wrap border-b border-border/10 pb-3">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-base text-foreground">
                                                        Thread: <span className="text-primary">"{threadTitle}"</span>
                                                    </h3>
                                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                                        <span>Posted by: <strong className="font-medium text-foreground/80">{authorName}</strong></span>
                                                        <span>Created: {creationDate}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="destructive" className="py-1 px-2.5 font-bold flex items-center gap-1">
                                                    🚩 Reported {reportsForThread.length} {reportsForThread.length === 1 ? 'Time' : 'Times'}
                                                </Badge>
                                            </div>

                                            {/* Original Thread Preview Box */}
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-muted-foreground">Original Thread Preview:</span>
                                                <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/10 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                                    {contentPreview}
                                                </p>
                                            </div>

                                            {/* Reported Items List */}
                                            <div className="space-y-2">
                                                <span className="text-xs font-bold text-destructive/90">Report Details ({reportsForThread.length}):</span>
                                                <ul className="space-y-2">
                                                    {reportsForThread.map((r) => {
                                                        const dateStr = new Date(r.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                                                        return (
                                                            <li key={r.id} className="bg-destructive/5 border border-destructive/10 p-3 rounded-lg text-xs space-y-1">
                                                                <div className="flex justify-between items-center flex-wrap gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="capitalize text-[10px] py-0.5 px-2 font-semibold border-destructive/20 text-destructive bg-destructive/5">
                                                                            {r.reason}
                                                                        </Badge>
                                                                        <span className="text-muted-foreground font-semibold">
                                                                            Target: {r.target_type === 'thread' ? 'Thread Post' : 'Comment/Reply'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {dateStr}
                                                                    </span>
                                                                </div>

                                                                {r.target_type === 'reply' && r.reply && (
                                                                    <div className="bg-muted/30 p-2 rounded border border-border/5 my-1 text-muted-foreground italic">
                                                                        Comment by <span className="font-semibold text-foreground/80">{r.reply.author_name}</span>: "{r.reply.content}"
                                                                    </div>
                                                                )}

                                                                {r.details && (
                                                                    <p className="text-foreground/90 italic pl-1">
                                                                        "{r.details}"
                                                                    </p>
                                                                )}
                                                                <div className="text-[10px] text-muted-foreground pl-1 mt-0.5">
                                                                    Reported by: <span className="font-medium text-foreground/75">{r.reporter_name || 'Anonymous User'}</span>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/10">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => navigate(`/forum/${thread.id}`)}
                                                    className="h-8 text-xs font-medium"
                                                >
                                                    View Thread
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => dismissAllReportsForThread(thread.id, reportsForThread)}
                                                    className="h-8 text-xs font-medium"
                                                >
                                                    Dismiss All Reports
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    onClick={() => deleteThreadAndCleanUp(thread.id, reportsForThread)}
                                                    className="h-8 text-xs font-medium"
                                                >
                                                    Delete Thread
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search threads by title or company..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="trending">Trending</SelectItem>
                                        <SelectItem value="latest">Latest</SelectItem>
                                        <SelectItem value="viewed">Most Viewed</SelectItem>
                                        <SelectItem value="replied">Most Replied</SelectItem>
                                        <SelectItem value="reacted">Most Reacted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Thread List */}
                    {loading ? (
                        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/50" />)}</div>
                    ) : sortedAndFiltered.length === 0 ? (
                        <Card><CardContent className="p-12 text-center"><MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p>No threads found</p></CardContent></Card>
                    ) : (
                        <div className="space-y-3 animate-stagger">
                            {sortedAndFiltered.map(thread => {
                                const isUserAdmin = role === 'admin';
                                const showIdentity = !thread.is_anonymous || isUserAdmin;

                                const rawAuthor = authors[thread.author_id] || {
                                    name: 'Anonymous User',
                                    avatar_url: null,
                                    role: thread.author_type ? thread.author_type.charAt(0).toUpperCase() + thread.author_type.slice(1) : 'User'
                                };

                                const author = showIdentity
                                    ? {
                                        name: thread.is_anonymous ? `${rawAuthor.name} (Anonymous ${rawAuthor.role})` : rawAuthor.name,
                                        avatar_url: rawAuthor.avatar_url,
                                        role: rawAuthor.role
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
                                const repliesNum = replyCounts[thread.id] || 0;
                                const activityDate = lastActivities[thread.id] || thread.created_at;
                                const threadAttachments = parseAttachments(thread.attachments);
                                const threadTags = parseTags(thread.tags);

                                const activeUserReaction = userReactions[thread.id]?.[0];
                                const hasActiveReaction = !!activeUserReaction;

                                // Excerpt Content Preview
                                const contentPreview = thread.content.length > 150 
                                    ? thread.content.substring(0, 150) + '...Read More' 
                                    : thread.content;

                                // Reports for this thread
                                const currentThreadReports = reports.filter(r => r.target_id === thread.id && r.target_type === 'thread');
                                const reportCount = currentThreadReports.length;

                                return (
                                    <Card 
                                        key={thread.id} 
                                        className="cursor-pointer card-hover border-border/40 bg-card/60 backdrop-blur-sm relative overflow-hidden" 
                                        onClick={() => navigate(`/forum/${thread.id}`)}
                                    >
                                        <CardContent className="p-5 flex flex-col gap-4">
                                            {/* Header Section: Author & Info */}
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 border border-border/40 flex-shrink-0">
                                                    {author.avatar_url ? (
                                                        <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                            {author.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-foreground">{author.name}</span>
                                                        <span className="text-[9px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full font-medium flex-shrink-0">{author.role}</span>
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
                                                        {thread.accepted_reply_id && (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] py-0 px-1.5 font-semibold">
                                                                ✓ Accepted Answer
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <span>{new Date(thread.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        <span>•</span>
                                                        <span>{thread.views_count || 0} views</span>
                                                        <span>•</span>
                                                        <span>{repliesNum} replies</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body Section: Title & Preview Excerpt */}
                                            <div className="space-y-1.5">
                                                {renderBadges(thread)}
                                                <h3 className="text-base font-heading font-bold text-foreground leading-snug">
                                                    {thread.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground/95 whitespace-pre-wrap leading-relaxed">
                                                    {contentPreview}
                                                </p>
                                            </div>

                                            {/* Post Tags */}
                                            {threadTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                    {threadTags.map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-[10px] py-0 px-2 border-border/40 font-medium">
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Multi-Image Grid */}
                                            {threadAttachments.length > 0 && (
                                                <div 
                                                    className={cn(
                                                        "grid gap-2 rounded-xl overflow-hidden max-w-md",
                                                        threadAttachments.length === 1 && "grid-cols-1",
                                                        threadAttachments.length === 2 && "grid-cols-2",
                                                        threadAttachments.length >= 3 && "grid-cols-2 grid-rows-2"
                                                    )}
                                                    onClick={e => e.stopPropagation()} // Prevent card navigation trigger
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

                                            {/* Reaction summary line */}
                                            {renderReactionsSummary(threadReactions[thread.id])}

                                            {/* LinkedIn-style Action Buttons */}
                                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/15">
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                                                                        onClick={(e) => {
                                                                            toggleReaction(e, thread.id, type);
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
                                                            onClick={(e) => {
                                                                if (hasActiveReaction) {
                                                                    toggleReaction(e, thread.id, activeUserReaction);
                                                                } else {
                                                                    toggleReaction(e, thread.id, 'helpful');
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

                                                    {/* Comment button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/forum/${thread.id}`)}
                                                        className="h-9 text-xs text-muted-foreground hover:text-foreground px-3 rounded-xl flex items-center gap-1.5"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>Comment</span>
                                                    </Button>
                                                </div>

                                                {/* Right Side Controls */}
                                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                                    {/* Reports Badge (Admins Only) */}
                                                    {isUserAdmin && reportCount > 0 && (
                                                        <Badge 
                                                            variant="destructive" 
                                                            className="cursor-pointer select-none text-[10px] py-0.5 px-2 flex items-center gap-1 font-semibold hover:bg-destructive/90"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedReportedItem({
                                                                    id: thread.id,
                                                                    title: thread.title,
                                                                    type: 'thread',
                                                                    reports: currentThreadReports
                                                                });
                                                                setShowAdminReportDialog(true);
                                                            }}
                                                        >
                                                            🚩 Reports: {reportCount}
                                                        </Badge>
                                                    )}

                                                    {/* Pin Button (Admins Only) */}
                                                    {isUserAdmin && (
                                                        <button
                                                            onClick={(e) => togglePin(e, thread)}
                                                            className={cn(
                                                                "p-1.5 rounded-md transition-colors",
                                                                thread.is_pinned 
                                                                    ? "text-amber-500 hover:text-amber-600 bg-amber-500/10" 
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                            )}
                                                            title={thread.is_pinned ? "Unpin thread" : "Pin thread"}
                                                        >
                                                            <Pin className={cn("w-4 h-4", thread.is_pinned && "fill-current")} />
                                                        </button>
                                                    )}

                                                    {/* Delete (if owner/admin) or Report (if standard user & not owner) */}
                                                    {(isUserAdmin || (roleData?.id && thread.author_id === roleData.id)) ? (
                                                        <button
                                                            onClick={(e) => deleteThread(e, thread.id)}
                                                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            title="Delete thread"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        roleData?.id && (
                                                            <button
                                                                    onClick={() => {
                                                                        setReportTargetId(thread.id);
                                                                        setReportTargetType('thread');
                                                                        setReportReason('spam');
                                                                        setShowReportDialog(true);
                                                                    }}
                                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                    title="Report thread"
                                                            >
                                                                    <Flag className="w-4 h-4" />
                                                            </button>
                                                        )
                                                    )}
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" onClick={() => navigate(`/forum/${thread.id}`)} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Create Thread Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                    <DialogHeader><DialogTitle>Create New Thread</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Post As Anonymity Select */}
                        <div className="space-y-2">
                            <Label>Post As</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="post_as" 
                                        checked={isAnonymous} 
                                        onChange={() => setIsAnonymous(true)} 
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span>🕵️ Anonymous</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="post_as" 
                                        checked={!isAnonymous} 
                                        onChange={() => setIsAnonymous(false)} 
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span>👤 Real Name ({roleData?.name})</span>
                                </label>
                            </div>
                        </div>

                        <div><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Thread title..." /></div>
                        <div><Label>Company (optional)</Label><Input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. Google, Amazon..." /></div>
                        {categories.length > 0 && (
                            <div>
                                <Label>Category</Label>
                                <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Tag Multi-Select */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {PRESET_TAGS.map(tag => {
                                    const selected = selectedTags.includes(tag);
                                    return (
                                        <Badge
                                            key={tag}
                                            variant={selected ? 'default' : 'outline'}
                                            className={cn(
                                                "cursor-pointer select-none py-1 px-3 rounded-full text-xs transition-colors",
                                                selected ? "bg-primary text-white border-transparent" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => {
                                                if (selected) {
                                                    setSelectedTags(prev => prev.filter(t => t !== tag));
                                                } else {
                                                    setSelectedTags(prev => [...prev, tag]);
                                                }
                                            }}
                                        >
                                            #{tag}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <div><Label>Content</Label><Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Share your experience or question..." rows={5} /></div>

                        {/* Drag & Drop Attachments Panel */}
                        <div className="space-y-2">
                            <Label>Attachments (Max 4 images, 5MB each)</Label>
                            <div 
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 bg-muted/10 min-h-[100px]",
                                    isDragging && "border-primary bg-primary/5 border-2 scale-[0.99]"
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
                                                className="absolute top-1 right-1 bg-black/75 hover:bg-black text-white rounded-full p-1 transition-colors text-[10px] w-5 h-5 flex items-center justify-center"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => { setShowCreate(false); setSelectedImages([]); setImagePreviews([]); }} disabled={uploading}>Cancel</Button>
                        <Button onClick={createThread} disabled={!newTitle.trim() || !newContent.trim() || uploading}>
                            {uploading ? "Uploading media..." : "Post Thread"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                    if (selectedReportedItem.type === 'thread') {
                                        await insforge.database.from('discussion_threads').delete().eq('id', selectedReportedItem.id);
                                        setThreads(prev => prev.filter(t => t.id !== selectedReportedItem.id));
                                    } else {
                                        await insforge.database.from('discussion_replies').delete().eq('id', selectedReportedItem.id);
                                    }
                                    setShowAdminReportDialog(false);
                                    alert('Content deleted successfully.');
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
