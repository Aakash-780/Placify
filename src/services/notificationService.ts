import { insforge } from '@/lib/insforge';

export interface NotificationOptions {
    userId: string;
    title: string;
    message: string;
    type: string;
    entityType?: string;
    entityId?: string;
}

export const NotificationService = {
    async createNotification(options: NotificationOptions) {
        try {
            const { data, error } = await insforge.database
                .from('notifications')
                .insert([{
                    user_id: options.userId,
                    title: options.title,
                    message: options.message,
                    type: options.type,
                    entity_type: options.entityType || null,
                    entity_id: options.entityId || null,
                    is_read: false
                }]);

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('[NotificationService] Error creating notification:', err);
            return { data: null, error: err };
        }
    },

    async createStatusNotification(userId: string, status: string, company: string, jobTitle: string, applicationId: string) {
        let title = '';
        let message = '';
        let type = 'info';

        if (status === 'shortlisted') {
            title = "🎉 You've been shortlisted";
            message = `${company} has shortlisted you for ${jobTitle}.`;
            type = 'success';
        } else if (status === 'interview_scheduled') {
            title = "📅 Interview Scheduled";
            message = `${company} has scheduled your interview for ${jobTitle}.`;
            type = 'info';
        } else if (status === 'selected') {
            title = "🎉 Congratulations!";
            message = `You have been selected by ${company} for ${jobTitle}.`;
            type = 'success';
        } else if (status === 'rejected') {
            title = "Application Update";
            message = `${company} has decided to move forward with other candidates for ${jobTitle}.`;
            type = 'error';
        } else if (status === 'under_review') {
            title = "Application Under Review";
            message = `Your application for ${jobTitle} at ${company} is now under review.`;
            type = 'info';
        } else if (status === 'applied') {
            title = "Application Submitted";
            message = `Your application for ${jobTitle} at ${company} has been submitted successfully.`;
            type = 'success';
        } else if (status === 'withdrawn') {
            title = "Application Withdrawn";
            message = `You have withdrawn your application for ${jobTitle} at ${company}.`;
            type = 'info';
        }

        if (title && message) {
            return await this.createNotification({
                userId,
                title,
                message,
                type,
                entityType: 'job_application',
                entityId: applicationId
            });
        }
        return { data: null, error: new Error('Invalid status for notification mapping') };
    },

    async getNotifications(userId: string, params: { page?: number; limit?: number; type?: string; isRead?: boolean } = {}) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            const offset = (page - 1) * limit;

            let query = insforge.database
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (params.type && params.type !== 'all') {
                if (params.type === 'job_application') {
                    query = query.eq('entity_type', 'job_application');
                } else {
                    query = query.eq('type', params.type);
                }
            }

            if (params.isRead !== undefined) {
                query = query.eq('is_read', params.isRead);
            }

            // Client-side range pagination using PostgREST standard
            const { data, error, count } = await query.range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: data || [],
                total: count || 0,
                page,
                limit,
                error: null
            };
        } catch (err: any) {
            console.error('[NotificationService] Error getting notifications:', err);
            return { data: [], total: 0, page: 1, limit: 10, error: err };
        }
    },

    async getUnreadCount(userId: string) {
        try {
            const { data, error, count } = await insforge.database
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { count: count || 0, error: null };
        } catch (err: any) {
            console.error('[NotificationService] Error getting unread count:', err);
            return { count: 0, error: err };
        }
    },

    async markAsRead(id: string) {
        try {
            const { data, error } = await insforge.database
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('[NotificationService] Error marking as read:', err);
            return { data: null, error: err };
        }
    },

    async markAllAsRead(userId: string) {
        try {
            const { data, error } = await insforge.database
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('[NotificationService] Error marking all as read:', err);
            return { data: null, error: err };
        }
    },

    async deleteNotification(id: string) {
        try {
            const { data, error } = await insforge.database
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('[NotificationService] Error deleting notification:', err);
            return { data: null, error: err };
        }
    }
};
