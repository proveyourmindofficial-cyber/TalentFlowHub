import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Microsoft Graph user info interface
interface GraphUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
}

// Extended request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated?: boolean;
    }
    interface Session {
      userId?: string;
    }
  }
}

// Office 365 authentication middleware
export const authenticateOffice365 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const accessToken = authHeader.split(' ')[1];
    
    // Get user info from Microsoft Graph
    const graphUser = await getUserFromGraph(accessToken);
    if (!graphUser) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Get or create user in our system
    let user = await storage.getUserByEmail(graphUser.mail);
    if (!user) {
      // Create new user from Graph data with basic setup
      user = await storage.createUser({
        username: graphUser.mail,
        email: graphUser.mail,
        firstName: graphUser.givenName,
        lastName: graphUser.surname,
        roleId: null, // Will be assigned by admin later
        department: graphUser.department || 'Recruitment',
        isActive: true
      });
      console.log(`🔐 New user auto-created from Office365: ${graphUser.mail}`);
    } else if (user.roleId) {
      // Existing user with custom role - ensure their role is active
      const customRole = await storage.getCustomRole(user.roleId);
      if (!customRole || !customRole.isActive) {
        console.warn(`⚠️ User ${user.email} has inactive or missing role: ${user.roleId}`);
      }
    }

    // Attach user to request
    req.user = user;
    req.isAuthenticated = true;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Get user information from Microsoft Graph
async function getUserFromGraph(accessToken: string): Promise<GraphUser | null> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get user from Graph:', error);
    return null;
  }
}

// Determine user role based on Graph data
function determineUserRole(graphUser: GraphUser): 'director' | 'am' | 'recruiter' | 'hr' {
  const jobTitle = graphUser.jobTitle?.toLowerCase() || '';
  const department = graphUser.department?.toLowerCase() || '';

  // Smart role detection from Office 365 profile
  if (jobTitle.includes('director') || jobTitle.includes('head') || jobTitle.includes('ceo') || jobTitle.includes('cto')) {
    return 'director';
  } else if (jobTitle.includes('manager') || jobTitle.includes('lead') || jobTitle.includes('supervisor')) {
    return 'am';
  } else if (department.includes('hr') || jobTitle.includes('hr') || jobTitle.includes('human resources')) {
    return 'hr';
  } else {
    // Default role for recruitment team members
    return 'recruiter';
  }
}

// Middleware for optional authentication (for public endpoints)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      const graphUser = await getUserFromGraph(accessToken);
      
      if (graphUser) {
        const user = await storage.getUserByEmail(graphUser.mail);
        if (user) {
          req.user = user;
          req.isAuthenticated = true;
        }
      }
    }
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Session-based authentication middleware (fixed for proper session handling)
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for session-based authentication first (current login method)
    if (req.session?.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
        req.isAuthenticated = true;
        return next();
      }
    }

    // Only try Office 365 if no session exists AND has Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      try {
        const graphUser = await getUserFromGraph(accessToken);
        
        if (graphUser) {
          let user = await storage.getUserByEmail(graphUser.mail);
          if (!user) {
            user = await storage.createUser({
              username: graphUser.mail,
              email: graphUser.mail,
              firstName: graphUser.givenName,
              lastName: graphUser.surname,
              roleId: null,
              department: graphUser.department || 'Recruitment',
              isActive: true
            });
            console.log(`🔐 New user auto-created from Office365: ${graphUser.mail}`);
          }

          req.user = user;
          req.isAuthenticated = true;
          return next();
        }
      } catch (graphError) {
        // Graph API failed - continue to check if we should reject or allow
        console.log('Graph API call failed:', graphError instanceof Error ? graphError.message : String(graphError));
      }
    }

    // If we get here and no valid authentication was found, reject
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
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