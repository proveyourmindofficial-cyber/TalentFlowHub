import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
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