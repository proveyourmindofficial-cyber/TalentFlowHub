import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from './storage';
import { type Candidate, type CandidateSession } from '../shared/schema';
import { ActivityLogger } from './activityLogger';
import type { Request } from 'express';

export class CandidateAuthService {
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async authenticateCandidate(email: string, password: string, req?: Request): Promise<{ candidate: Candidate; sessionToken: string } | null> {
    try {
      const candidate = await storage.getCandidateByEmail(email);
      
      if (!candidate || !candidate.password || !candidate.isPortalActive) {
        // Log failed login attempt - candidate not found or inactive
        try {
          await ActivityLogger.logActivity({
            userId: candidate?.id || 'unknown',
            action: 'authentication_failed',
            entityType: 'candidate',
            entityId: candidate?.id || email,
            metadata: {
              email,
              reason: !candidate ? 'candidate_not_found' : !candidate.password ? 'no_password_set' : 'portal_inactive',
              userAgent: req?.get('User-Agent'),
              ip: req?.ip
            },
            req,
            userJourneyContext: {
              flow: 'onboarding',
              stage: 'password_setup'
            }
          });
        } catch (logError) {
          console.error('Failed to log authentication failure:', logError);
        }
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, candidate.password);
      if (!isValidPassword) {
        // Log failed login attempt - invalid password
        try {
          await ActivityLogger.logActivity({
            userId: candidate.id,
            action: 'authentication_failed',
            entityType: 'candidate',
            entityId: candidate.id,
            metadata: {
              email,
              reason: 'invalid_password',
              userAgent: req?.get('User-Agent'),
              ip: req?.ip
            },
            req,
            userJourneyContext: {
              flow: 'onboarding',
              stage: 'password_setup'
            }
          });
        } catch (logError) {
          console.error('Failed to log authentication failure:', logError);
        }
        return null;
      }

      // Generate new session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      // Create session in database
      await storage.createCandidateSession({
        candidateId: candidate.id,
        sessionToken,
        expiresAt,
      });

      // Update last login time
      await storage.updateCandidate(candidate.id, {
        lastLoginAt: new Date(),
      });

      // Log successful authentication
      try {
        await ActivityLogger.logActivity({
          userId: candidate.id,
          action: 'authentication_success',
          entityType: 'candidate',
          entityId: candidate.id,
          metadata: {
            email,
            sessionTokenLength: sessionToken.length,
            userAgent: req?.get('User-Agent'),
            ip: req?.ip
          },
          req,
          userJourneyContext: {
            flow: 'onboarding',
            stage: 'password_setup'
          }
        });
      } catch (logError) {
        console.error('Failed to log successful authentication:', logError);
      }

      return { candidate, sessionToken };
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Log system error during authentication
      try {
        await ActivityLogger.logActivity({
          userId: 'system',
          action: 'authentication_error',
          entityType: 'system',
          entityId: 'candidate_auth',
          metadata: {
            email,
            error: error instanceof Error ? error.message : String(error),
            userAgent: req?.get('User-Agent'),
            ip: req?.ip
          },
          req,
          userJourneyContext: {
            flow: 'troubleshooting',
            stage: 'notification'
          }
        });
      } catch (logError) {
        console.error('Failed to log authentication error:', logError);
      }
      
      return null;
    }
  }

  async validateSession(sessionToken: string): Promise<Candidate | null> {
    try {
      const session = await storage.getCandidateSessionByToken(sessionToken);
      
      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await storage.deleteCandidateSession(session.id);
        }
        return null;
      }

      const candidate = await storage.getCandidate(session.candidateId);
      
      if (!candidate || !candidate.isPortalActive) {
        return null;
      }

      return candidate;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      const session = await storage.getCandidateSessionByToken(sessionToken);
      if (session) {
        await storage.deleteCandidateSession(session.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async setupCandidatePortalAccess(candidateId: string, password: string, req?: Request): Promise<void> {
    const hashedPassword = await this.hashPassword(password);
    await storage.updateCandidate(candidateId, {
      password: hashedPassword,
      isPortalActive: true,
    });

    // Log password setup completion
    try {
      await ActivityLogger.logActivity({
        userId: candidateId,
        action: 'password_setup',
        entityType: 'candidate',
        entityId: candidateId,
        metadata: {
          userAgent: req?.get('User-Agent'),
          ip: req?.ip
        },
        req,
        userJourneyContext: {
          flow: 'onboarding',
          stage: 'password_setup'
        }
      });
    } catch (logError) {
      console.error('Failed to log password setup:', logError);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      await storage.deleteExpiredCandidateSessions();
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

export const candidateAuth = new CandidateAuthService();