import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';


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
        return next();
      }
    }

    // No valid authentication found
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Authentication error:', error);
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