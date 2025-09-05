import { storage } from './storage';
import type { Request } from 'express';

interface ActivityLogData {
  userId: string;
  sessionId?: string;
  action: "login" | "logout" | "login_failed" | "password_setup" | "password_reset" | "account_locked" | "account_unlocked" |
         "email_sent" | "email_delivered" | "email_bounced" | "email_opened" | "email_failed" | "invitation_sent" | "invitation_resent" |
         "create" | "update" | "delete" | "view" | "export" | "import" | "status_change" |
         "page_accessed" | "session_started" | "session_ended" | "error_encountered" | "feedback_submitted" |
         "user_invited" | "user_activated" | "user_deactivated" | "role_assigned" | "permission_changed";
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  category?: "authentication" | "email" | "data" | "navigation" | "error" | "feedback" | "admin";
  severity?: "info" | "warning" | "error" | "critical";
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  stackTrace?: string;
  
  // Email specific fields
  emailRecipient?: string;
  emailSubject?: string;
  emailProvider?: string;
  emailMessageId?: string;
  
  // Performance metrics
  responseTime?: number;
  pageLoadTime?: number;
  
  // User journey context
  previousPage?: string;
  currentPage?: string;
  nextAction?: string;
  userFlow?: "onboarding" | "daily_usage" | "troubleshooting";
  
  // Technical context
  ipAddress?: string;
  userAgent?: string;
  browserInfo?: string;
  deviceInfo?: string;
  
  // Additional context
  metadata?: string;
  tags?: string[];
  environment?: string;
  version?: string;
}

// Helper function to get client IP from request
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  );
}

// Helper function to get user agent from request
function getUserAgent(req: Request): string {
  return req.get('User-Agent') || 'unknown';
}

// Helper function to extract browser info from user agent
function getBrowserInfo(userAgent: string): string {
  try {
    const info = {
      browser: 'unknown',
      version: 'unknown',
      os: 'unknown'
    };
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) info.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
    else if (userAgent.includes('Safari')) info.browser = 'Safari';
    else if (userAgent.includes('Edge')) info.browser = 'Edge';
    
    // Simple OS detection
    if (userAgent.includes('Windows')) info.os = 'Windows';
    else if (userAgent.includes('Mac')) info.os = 'macOS';
    else if (userAgent.includes('Linux')) info.os = 'Linux';
    else if (userAgent.includes('Android')) info.os = 'Android';
    else if (userAgent.includes('iOS')) info.os = 'iOS';
    
    return JSON.stringify(info);
  } catch {
    return JSON.stringify({ browser: 'unknown', version: 'unknown', os: 'unknown' });
  }
}

// Main activity logging function
export async function logActivity(data: ActivityLogData, req?: Request): Promise<void> {
  try {
    const userAgent = data.userAgent || (req ? getUserAgent(req) : 'unknown');
    const ipAddress = data.ipAddress || (req ? getClientIP(req) : undefined);
    
    const activityLog = {
      userId: data.userId,
      sessionId: data.sessionId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName,
      description: data.description,
      category: data.category || 'data',
      severity: data.severity || 'info',
      success: data.success !== false, // Default to true unless explicitly false
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      stackTrace: data.stackTrace,
      
      // Email specific fields
      emailRecipient: data.emailRecipient,
      emailSubject: data.emailSubject,
      emailProvider: data.emailProvider,
      emailMessageId: data.emailMessageId,
      
      // Performance metrics
      responseTime: data.responseTime,
      pageLoadTime: data.pageLoadTime,
      
      // User journey context
      previousPage: data.previousPage,
      currentPage: data.currentPage,
      nextAction: data.nextAction,
      userFlow: data.userFlow,
      
      // Technical context
      ipAddress,
      userAgent,
      browserInfo: data.browserInfo || getBrowserInfo(userAgent),
      deviceInfo: data.deviceInfo,
      
      // Additional context
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      tags: data.tags,
      environment: data.environment || 'production',
      version: data.version || '1.0.0',
    };

    await storage.createActivityLog(activityLog);
    console.log(`✅ Activity logged: ${data.action} - ${data.description}`);
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

// Predefined logging functions for common actions
export const ActivityLogger = {
  // Authentication actions
  async logLogin(userId: string, req: Request, success: boolean = true) {
    await logActivity({
      userId,
      action: 'login',
      resourceType: 'user',
      resourceId: userId,
      resourceName: 'User Login',
      description: success ? 'User successfully logged in' : 'Failed login attempt',
      success,
    }, req);
  },

  async logLogout(userId: string, req: Request) {
    await logActivity({
      userId,
      action: 'logout',
      resourceType: 'user',
      resourceId: userId,
      resourceName: 'User Logout',
      description: 'User logged out',
      success: true,
    }, req);
  },

  // User management actions
  async logUserCreated(createdById: string, newUserId: string, username: string, req: Request) {
    await logActivity({
      userId: createdById,
      action: 'create',
      resourceType: 'user',
      resourceId: newUserId,
      resourceName: username,
      description: `Created new user account: ${username}`,
      success: true,
    }, req);
  },

  async logUserUpdated(updatedById: string, targetUserId: string, username: string, req: Request) {
    await logActivity({
      userId: updatedById,
      action: 'update',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: username,
      description: `Updated user account: ${username}`,
      success: true,
    }, req);
  },

  async logUserDeleted(deletedById: string, targetUserId: string, username: string, req: Request) {
    await logActivity({
      userId: deletedById,
      action: 'delete',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: username,
      description: `Deleted user account: ${username}`,
      success: true,
    }, req);
  },

  // Job management actions
  async logJobCreated(userId: string, jobId: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'create',
      resourceType: 'job',
      resourceId: jobId,
      resourceName: jobTitle,
      description: `Created new job posting: ${jobTitle}`,
      success: true,
    }, req);
  },

  async logJobUpdated(userId: string, jobId: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'update',
      resourceType: 'job',
      resourceId: jobId,
      resourceName: jobTitle,
      description: `Updated job posting: ${jobTitle}`,
      success: true,
    }, req);
  },

  async logJobDeleted(userId: string, jobId: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'delete',
      resourceType: 'job',
      resourceId: jobId,
      resourceName: jobTitle,
      description: `Deleted job posting: ${jobTitle}`,
      success: true,
    }, req);
  },

  // Candidate management actions
  async logCandidateCreated(userId: string, candidateId: string, candidateName: string, req: Request) {
    await logActivity({
      userId,
      action: 'create',
      resourceType: 'candidate',
      resourceId: candidateId,
      resourceName: candidateName,
      description: `Added new candidate: ${candidateName}`,
      success: true,
    }, req);
  },

  async logCandidateUpdated(userId: string, candidateId: string, candidateName: string, req: Request) {
    await logActivity({
      userId,
      action: 'update',
      resourceType: 'candidate',
      resourceId: candidateId,
      resourceName: candidateName,
      description: `Updated candidate profile: ${candidateName}`,
      success: true,
    }, req);
  },

  async logCandidateDeleted(userId: string, candidateId: string, candidateName: string, req: Request) {
    await logActivity({
      userId,
      action: 'delete',
      resourceType: 'candidate',
      resourceId: candidateId,
      resourceName: candidateName,
      description: `Deleted candidate: ${candidateName}`,
      success: true,
    }, req);
  },

  // Application management actions
  async logApplicationCreated(userId: string, applicationId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'create',
      resourceType: 'application',
      resourceId: applicationId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Created application for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  async logApplicationUpdated(userId: string, applicationId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'update',
      resourceType: 'application',
      resourceId: applicationId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Updated application for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  async logApplicationDeleted(userId: string, applicationId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'delete',
      resourceType: 'application',
      resourceId: applicationId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Deleted application for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  // Interview management actions
  async logInterviewScheduled(userId: string, interviewId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'create',
      resourceType: 'interview',
      resourceId: interviewId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Scheduled interview for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  async logInterviewUpdated(userId: string, interviewId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'update',
      resourceType: 'interview',
      resourceId: interviewId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Updated interview for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  async logInterviewDeleted(userId: string, interviewId: string, candidateName: string, jobTitle: string, req: Request) {
    await logActivity({
      userId,
      action: 'delete',
      resourceType: 'interview',
      resourceId: interviewId,
      resourceName: `${candidateName} → ${jobTitle}`,
      description: `Deleted interview for ${candidateName} applying to ${jobTitle}`,
      success: true,
    }, req);
  },

  // Enhanced Email actions with comprehensive tracking
  async logEmailSent(userId: string, recipientEmail: string, subject: string, provider: string, messageId?: string, req?: Request, success: boolean = true) {
    await logActivity({
      userId,
      action: 'email_sent',
      resourceType: 'email',
      resourceName: recipientEmail,
      description: success 
        ? `Email sent successfully to ${recipientEmail}: ${subject}`
        : `Failed to send email to ${recipientEmail}: ${subject}`,
      category: 'email',
      severity: success ? 'info' : 'error',
      success,
      emailRecipient: recipientEmail,
      emailSubject: subject,
      emailProvider: provider,
      emailMessageId: messageId,
      tags: ['email', 'communication', provider],
    }, req);
  },

  async logEmailDelivered(userId: string, recipientEmail: string, subject: string, provider: string, messageId: string) {
    await logActivity({
      userId,
      action: 'email_delivered',
      resourceType: 'email',
      resourceName: recipientEmail,
      description: `Email delivered successfully to ${recipientEmail}: ${subject}`,
      category: 'email',
      severity: 'info',
      success: true,
      emailRecipient: recipientEmail,
      emailSubject: subject,
      emailProvider: provider,
      emailMessageId: messageId,
      tags: ['email', 'delivery', 'success', provider],
    });
  },

  async logEmailBounced(userId: string, recipientEmail: string, subject: string, provider: string, messageId: string, bounceReason: string) {
    await logActivity({
      userId,
      action: 'email_bounced',
      resourceType: 'email',
      resourceName: recipientEmail,
      description: `Email bounced to ${recipientEmail}: ${subject} - ${bounceReason}`,
      category: 'email',
      severity: 'warning',
      success: false,
      errorMessage: bounceReason,
      emailRecipient: recipientEmail,
      emailSubject: subject,
      emailProvider: provider,
      emailMessageId: messageId,
      tags: ['email', 'bounce', 'failure', provider],
    });
  },

  async logEmailOpened(userId: string, recipientEmail: string, subject: string, provider: string, messageId: string) {
    await logActivity({
      userId,
      action: 'email_opened',
      resourceType: 'email',
      resourceName: recipientEmail,
      description: `Email opened by ${recipientEmail}: ${subject}`,
      category: 'email',
      severity: 'info',
      success: true,
      emailRecipient: recipientEmail,
      emailSubject: subject,
      emailProvider: provider,
      emailMessageId: messageId,
      tags: ['email', 'engagement', 'opened', provider],
    });
  },

  async logInvitationSent(userId: string, newUserId: string, recipientEmail: string, provider: string, messageId?: string, req?: Request) {
    await logActivity({
      userId,
      action: 'invitation_sent',
      resourceType: 'user',
      resourceId: newUserId,
      resourceName: recipientEmail,
      description: `User invitation sent to ${recipientEmail}`,
      category: 'email',
      severity: 'info',
      success: true,
      emailRecipient: recipientEmail,
      emailSubject: 'User Invitation - ATS System',
      emailProvider: provider,
      emailMessageId: messageId,
      userFlow: 'onboarding',
      tags: ['invitation', 'user_onboarding', 'email', provider],
    }, req);
  },

  async logInvitationResent(userId: string, targetUserId: string, recipientEmail: string, provider: string, messageId?: string, req?: Request) {
    await logActivity({
      userId,
      action: 'invitation_resent',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: recipientEmail,
      description: `User invitation resent to ${recipientEmail}`,
      category: 'email',
      severity: 'warning',
      success: true,
      emailRecipient: recipientEmail,
      emailSubject: 'User Invitation (Resent) - ATS System',
      emailProvider: provider,
      emailMessageId: messageId,
      userFlow: 'troubleshooting',
      tags: ['invitation', 'resent', 'user_support', 'email', provider],
    }, req);
  },

  // System actions
  async logSystemAction(userId: string, action: "view" | "export" | "import" | "status_change", description: string, req: Request, success: boolean = true) {
    await logActivity({
      userId,
      action,
      resourceType: 'system',
      resourceId: undefined,
      resourceName: 'System Action',
      description,
      success,
    }, req);
  },

  // Bulk operations
  async logBulkOperation(userId: string, action: "create" | "update" | "delete", resourceType: string, count: number, req: Request, success: boolean = true) {
    await logActivity({
      userId,
      action,
      resourceType,
      resourceId: undefined,
      resourceName: `${count} items`,
      description: success 
        ? `Successfully performed bulk ${action} on ${count} ${resourceType}(s)`
        : `Failed to perform bulk ${action} on ${count} ${resourceType}(s)`,
      success,
    }, req);
  },

  // Feedback and user issue reporting
  async logFeedbackSubmitted(userId: string, feedbackId: string, feedbackType: string, title: string, priority: string, req: Request) {
    await logActivity({
      userId,
      action: 'feedback_submitted',
      resourceType: 'feedback',
      resourceId: feedbackId,
      resourceName: title,
      description: `User submitted ${feedbackType} feedback: ${title}`,
      category: 'user_interaction',
      severity: feedbackType === 'bug_report' ? 'warning' : priority === 'high' ? 'warning' : 'info',
      success: true,
      metadata: JSON.stringify({ type: feedbackType, priority, title }),
      tags: ['feedback', feedbackType, priority],
      userFlow: 'daily_usage',
    }, req);
  },

  async logFeedbackUpdated(userId: string, feedbackId: string, title: string, status: string, req: Request) {
    await logActivity({
      userId,
      action: 'feedback_updated',
      resourceType: 'feedback',
      resourceId: feedbackId,
      resourceName: title,
      description: `Feedback status updated to: ${status}`,
      category: 'admin_action',
      severity: 'info',
      success: true,
      metadata: JSON.stringify({ status }),
      tags: ['feedback', 'status_update', status],
      userFlow: 'daily_usage',
    }, req);
  },

  async logUserReportedIssue(userId: string, issueType: string, description: string, context: any, req: Request) {
    await logActivity({
      userId,
      action: 'issue_reported',
      resourceType: 'user_report',
      resourceId: `issue_${Date.now()}`,
      resourceName: issueType,
      description: `User reported ${issueType}: ${description}`,
      category: 'user_support',
      severity: 'warning',
      success: true,
      metadata: JSON.stringify({ issueType, context, reportedAt: new Date().toISOString() }),
      tags: ['user_issue', issueType, 'support_needed'],
      userFlow: 'troubleshooting',
    }, req);
  },

  async logCustomActivity(userId: string, action: string, description: string, req: Request, success: boolean = true, entityType?: string, entityId?: string, metadata?: any) {
    await logActivity({
      userId,
      action,
      resourceType: entityType || 'system',
      resourceId: entityId,
      resourceName: action,
      description,
      category: 'custom',
      severity: 'info',
      success,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      tags: ['custom_activity'],
      userFlow: 'daily_usage',
    }, req);
  }
};