import { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import { ActivityLogger } from './activityLogger';


// Extended request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated?: boolean;
      authMethod?: 'local';
    }
    interface SessionData {
      userId?: string;
      authMethod?: 'local';
    }
  }
}




// Session-based authentication middleware
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for session-based authentication (email/password login)
    if (req.session?.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
        req.isAuthenticated = true;
        req.authMethod = 'local';
        
        // Log successful session validation
        try {
          await ActivityLogger.logActivity({
            userId: user.id,
            action: 'session_started',
            entityType: 'user',
            entityId: user.id,
            metadata: {
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              path: req.path
            },
            req,
            userJourneyContext: {
              flow: 'daily_usage',
              stage: 'notification'
            }
          });
        } catch (logError) {
          // Silent fail for activity logging
        }
        
        return next();
      } else {
        // Log authentication failure - invalid session
        try {
          await ActivityLogger.logActivity({
            userId: req.session?.userId || 'unknown',
            action: 'authentication_failed',
            entityType: 'user',
            entityId: req.session?.userId || 'unknown',
            metadata: {
              reason: !user ? 'user_not_found' : 'user_inactive',
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              path: req.path
            },
            req,
            userJourneyContext: {
              flow: 'troubleshooting',
              stage: 'notification'
            }
          });
        } catch (logError) {
          // Silent fail for activity logging
        }
      }
    }

    // No valid authentication found
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Log authentication system error
    try {
      await ActivityLogger.logActivity({
        userId: 'system',
        action: 'authentication_error',
        entityType: 'system',
        entityId: 'auth_middleware',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          path: req.path
        },
        req,
        userJourneyContext: {
          flow: 'troubleshooting',
          stage: 'notification'
        }
      });
    } catch (logError) {
      // Silent fail for activity logging
    }
    
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roleId || !roles.includes(req.user.roleId)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * Hierarchical Data Access System
 * 
 * This system implements data visibility based on reporting structure:
 * - Recruiter: Only their own data
 * - Team Lead: Their own data + team members' data
 * - Manager: All data within their hierarchy
 * 
 * Key principle: managerId relationships define data access, not just roles
 */

// Get all users who report to this user (directly or indirectly)
export const getHierarchySubordinates = async (userId: string, storage: any): Promise<string[]> => {
  try {
    const allUsers = await storage.getUsersWithCustomRoles();
    const subordinates: string[] = [];
    
    // Find direct reports
    const directReports = allUsers.filter((user: any) => user.managerId === userId);
    
    // Add direct reports
    for (const report of directReports) {
      subordinates.push(report.id);
      
      // Recursively get their subordinates
      const subSubordinates = await getHierarchySubordinates(report.id, storage);
      subordinates.push(...subSubordinates);
    }
    
    return subordinates;
  } catch (error) {
    console.error('Error getting hierarchy subordinates:', error);
    return [];
  }
};

// Get all user IDs that the current user can access data for
export const getAccessibleUserIds = async (currentUser: User, storage: any): Promise<string[]> => {
  try {
    // Super Admin sees everything
    if (currentUser.email === 'itsupport@o2finfosolutions.com') {
      const allUsers = await storage.getUsersWithCustomRoles();
      return allUsers.map((user: any) => user.id);
    }
    
    // Get user's subordinates based on hierarchy
    const subordinates = await getHierarchySubordinates(currentUser.id, storage);
    
    // User can always see their own data + subordinates' data
    return [currentUser.id, ...subordinates];
    
  } catch (error) {
    console.error('Error getting accessible user IDs:', error);
    return [currentUser.id]; // Fallback to own data only
  }
};

// Middleware to attach accessible user IDs to request
export const attachDataAccess = (storage: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      (req as any).accessibleUserIds = await getAccessibleUserIds(req.user, storage);
      next();
    } catch (error) {
      console.error('Error attaching data access:', error);
      return res.status(500).json({ message: 'Failed to determine data access' });
    }
  };
};