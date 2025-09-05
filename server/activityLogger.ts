import { storage } from './storage';
import type { Request } from 'express';

interface ActivityLogData {
  userId: string;
  action: "login" | "logout" | "create" | "update" | "delete" | "view" | "email_sent" | "export" | "import" | "status_change";
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
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

// Main activity logging function
export async function logActivity(data: ActivityLogData, req?: Request): Promise<void> {
  try {
    const activityLog = {
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || undefined,
      resourceName: data.resourceName || undefined,
      description: data.description,
      success: data.success !== false, // Default to true unless explicitly false
      ipAddress: data.ipAddress || (req ? getClientIP(req) : undefined),
      userAgent: data.userAgent || (req ? getUserAgent(req) : undefined),
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

  // Email actions
  async logEmailSent(userId: string, recipientEmail: string, subject: string, req: Request, success: boolean = true) {
    await logActivity({
      userId,
      action: 'email_sent',
      resourceType: 'email',
      resourceId: undefined,
      resourceName: recipientEmail,
      description: success 
        ? `Email sent successfully to ${recipientEmail}: ${subject}`
        : `Failed to send email to ${recipientEmail}: ${subject}`,
      success,
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
  }
};