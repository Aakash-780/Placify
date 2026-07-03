import { insforge } from '@/lib/insforge';
import { NotificationService } from '@/services/notificationService';

let isProcessing = false;

export async function checkAndProcessExpiredJobs() {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        const nowStr = new Date().toISOString();
        
        // Find jobs that are active (or not expired) but past their deadline
        const { data: expiredJobs, error: jobsError } = await insforge.database
            .from('jobs')
            .select('id, company, title, role, application_deadline, status')
            .neq('status', 'expired')
            .lt('application_deadline', nowStr);
            
        if (jobsError) {
            console.error('[DeadlineAutomation] Error fetching expired jobs:', jobsError);
            return;
        }
        
        if (!expiredJobs || expiredJobs.length === 0) {
            return;
        }
        
        console.log(`[DeadlineAutomation] Found ${expiredJobs.length} expired jobs to process.`);
        
        for (const job of expiredJobs) {
            console.log(`[DeadlineAutomation] Processing expired job: ${job.title || job.role} at ${job.company}`);
            
            // 1. Mark job as Expired
            const { error: updateJobError } = await insforge.database
                .from('jobs')
                .update({ status: 'expired' })
                .eq('id', job.id);
                
            if (updateJobError) {
                console.error(`[DeadlineAutomation] Failed to update status of job ${job.id}:`, updateJobError);
                continue;
            }
            
            // 2. Fetch active applications (Applied, Shortlisted, Interviewing, pending, under_review, etc.)
            // Excluding: Selected ('accepted' or 'selected'), Rejected ('rejected'), Withdrawn ('withdrawn')
            const { data: activeApps, error: appsError } = await insforge.database
                .from('job_applications')
                .select('id, student_id, status')
                .eq('job_id', job.id)
                .in('status', ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'pending']);
                
            if (appsError) {
                console.error(`[DeadlineAutomation] Error fetching applications for job ${job.id}:`, appsError);
                continue;
            }
            
            if (!activeApps || activeApps.length === 0) {
                console.log(`[DeadlineAutomation] No active applications for job: ${job.title || job.role}`);
                continue;
            }
            
            console.log(`[DeadlineAutomation] Rejecting ${activeApps.length} active applications for job ${job.id}`);
            
            for (const app of activeApps) {
                // Update status to Rejected
                const { error: updateAppError } = await insforge.database
                    .from('job_applications')
                    .update({ status: 'rejected' })
                    .eq('id', app.id);
                    
                if (updateAppError) {
                    console.error(`[DeadlineAutomation] Failed to reject application ${app.id}:`, updateAppError);
                    continue;
                }
                
                // Write status history log
                const { error: historyError } = await insforge.database
                    .from('application_status_history')
                    .insert([{
                        application_id: app.id,
                        status: 'rejected',
                        notes: 'Job application closed because the hiring deadline has passed.'
                    }]);
                    
                if (historyError) {
                    console.error(`[DeadlineAutomation] Failed to insert status history for application ${app.id}:`, historyError);
                }
                
                // Send notification
                const jobTitleText = job.title || job.role || 'Job';
                const { error: notifError } = await NotificationService.createNotification({
                    userId: app.student_id,
                    title: 'Application Update',
                    message: `Job application for ${jobTitleText} at ${job.company} closed because the hiring deadline has passed.`,
                    type: 'error',
                    entityType: 'job_application',
                    entityId: app.id
                });
                
                if (notifError) {
                    console.error(`[DeadlineAutomation] Failed to send notification to student ${app.student_id}:`, notifError);
                }
            }
        }
        
        console.log('[DeadlineAutomation] Finished processing all expired jobs.');
    } catch (err) {
        console.error('[DeadlineAutomation] Exception during automation check:', err);
    } finally {
        isProcessing = false;
    }
}
