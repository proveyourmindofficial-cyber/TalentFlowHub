import express from 'express';
import { candidateAuth } from '../candidateAuth';
import { storage } from '../storage';
import { candidateLoginSchema, candidateRegistrationSchema } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

// Middleware to authenticate candidate
async function authenticateCandidate(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const candidate = await candidateAuth.validateSession(token);
  
  if (!candidate) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.candidate = candidate;
  next();
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = candidateLoginSchema.parse(req.body);
    
    const result = await candidateAuth.authenticateCandidate(email, password);
    
    if (!result) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: result.sessionToken,
      candidate: {
        id: result.candidate.id,
        name: result.candidate.name,
        email: result.candidate.email,
        status: result.candidate.status,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', authenticateCandidate, async (req: any, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await candidateAuth.logout(token);
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get candidate profile
router.get('/profile', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    
    // Remove sensitive fields
    const { password, portalToken, tokenExpiresAt, ...safeCandidate } = candidate;
    
    res.json(safeCandidate);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update candidate profile
router.put('/profile', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    const updateData = req.body;
    
    // Remove fields that candidates shouldn't update
    const { id, password, portalToken, tokenExpiresAt, isPortalActive, createdAt, ...allowedUpdates } = updateData;
    
    const updatedCandidate = await storage.updateCandidate(candidate.id, allowedUpdates);
    
    // Remove sensitive fields from response
    const { password: pwd, portalToken: token, tokenExpiresAt: expires, ...safeCandidate } = updatedCandidate;
    
    res.json(safeCandidate);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get candidate applications with job details
router.get('/applications', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    const applications = await storage.getApplicationsByCandidate(candidate.id);
    
    res.json(applications);
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific application details
router.get('/applications/:id', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    const applicationId = req.params.id;
    
    const application = await storage.getApplication(applicationId);
    
    if (!application || application.candidateId !== candidate.id) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get interviews for candidate
router.get('/interviews', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    
    // Get candidate's applications first
    const applications = await storage.getApplicationsByCandidate(candidate.id);
    const applicationIds = applications.map(app => app.id);
    
    // Get all interviews
    const allInterviews = await storage.getInterviews();
    
    // Filter interviews for this candidate's applications
    const candidateInterviews = allInterviews.filter(interview => 
      applicationIds.includes(interview.applicationId)
    );
    
    // Add application and job details
    const interviewsWithDetails = candidateInterviews.map(interview => {
      const application = applications.find(app => app.id === interview.applicationId);
      return {
        ...interview,
        application: application
      };
    });
    
    res.json(interviewsWithDetails);
  } catch (error) {
    console.error('Interviews fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get offer letters for candidate
router.get('/offers', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    
    const offers = await storage.getOfferLetters();
    const candidateOffers = offers.filter(offer => offer.candidateId === candidate.id);
    
    res.json(candidateOffers);
  } catch (error) {
    console.error('Offers fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Accept or decline offer
router.post('/offers/:id/respond', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    const offerId = req.params.id;
    const { response } = req.body; // 'accepted' or 'declined'
    
    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response. Must be "accepted" or "declined"' });
    }
    
    const offer = await storage.getOfferLetter(offerId);
    
    if (!offer || offer.candidateId !== candidate.id) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Update offer status
    const updatedOffer = await storage.updateOfferLetter(offerId, {
      status: response === 'accepted' ? 'accepted' : 'declined'
    });
    
    // If accepted, update application stage and candidate status
    if (response === 'accepted') {
      await storage.updateApplication(offer.applicationId!, { stage: 'Joined' });
      await storage.updateCandidate(candidate.id, { status: 'Joined' });
    } else {
      await storage.updateApplication(offer.applicationId!, { stage: 'Not Joined' });
      await storage.updateCandidate(candidate.id, { status: 'Not Joined' });
    }
    
    res.json({
      message: `Offer ${response} successfully`,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Offer response error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dashboard stats for candidate
router.get('/dashboard/stats', authenticateCandidate, async (req: any, res) => {
  try {
    const candidate = req.candidate;
    
    const applications = await storage.getApplicationsByCandidate(candidate.id);
    const offers = await storage.getOfferLetters();
    const candidateOffers = offers.filter(offer => offer.candidateId === candidate.id);
    
    // Get all interviews
    const allInterviews = await storage.getInterviews();
    const applicationIds = applications.map(app => app.id);
    const candidateInterviews = allInterviews.filter(interview => 
      applicationIds.includes(interview.applicationId)
    );
    
    const stats = {
      totalApplications: applications.length,
      activeApplications: applications.filter(app => !['Rejected', 'Joined', 'Not Joined'].includes(app.stage)).length,
      scheduledInterviews: candidateInterviews.filter(interview => 
        interview.status === 'Scheduled' && new Date(interview.scheduledDate) > new Date()
      ).length,
      offers: candidateOffers.filter(offer => offer.status === 'draft' || offer.status === 'sent').length,
      currentStatus: candidate.status
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;