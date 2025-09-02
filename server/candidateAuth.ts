import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from './storage';
import { type Candidate, type CandidateSession } from '@shared/schema';

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

  async authenticateCandidate(email: string, password: string): Promise<{ candidate: Candidate; sessionToken: string } | null> {
    try {
      const candidate = await storage.getCandidateByEmail(email);
      
      if (!candidate || !candidate.password || !candidate.isPortalActive) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, candidate.password);
      if (!isValidPassword) {
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

      return { candidate, sessionToken };
    } catch (error) {
      console.error('Authentication error:', error);
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

  async setupCandidatePortalAccess(candidateId: string, password: string): Promise<void> {
    const hashedPassword = await this.hashPassword(password);
    await storage.updateCandidate(candidateId, {
      password: hashedPassword,
      isPortalActive: true,
    });
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