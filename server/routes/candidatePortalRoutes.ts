import express from 'express';
import { candidateAuth } from '../candidateAuth';
import { storage } from '../storage';
import { candidateLoginSchema, candidateRegistrationSchema } from '../../shared/schema';
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
    
    const result = await candidateAuth.authenticateCandidate(email, password, req);
    
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

// Interview confirmation endpoint (for email confirmation links)
router.get('/interviews/:id/confirm', async (req, res) => {
  try {
    const interviewId = req.params.id;
    
    // Get interview details
    const interview = await storage.getInterview(interviewId);
    if (!interview) {
      return res.status(404).send(`
        <html>
          <head><title>Interview Not Found</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc3545;">Interview Not Found</h2>
            <p>The interview you're trying to confirm could not be found. Please check the link or contact us for assistance.</p>
            <p><a href="/candidate-portal" style="color: #007bff;">Go to Candidate Portal</a></p>
          </body>
        </html>
      `);
    }

    // Get application and candidate details
    const application = await storage.getApplication(interview.applicationId);
    if (!application) {
      return res.status(404).send(`
        <html>
          <head><title>Application Not Found</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc3545;">Application Not Found</h2>
            <p>The associated application could not be found.</p>
          </body>
        </html>
      `);
    }

    const candidate = await storage.getCandidate(application.candidateId);
    const job = await storage.getJob(application.jobId);

    // Format interview details for display
    const interviewDate = new Date(interview.scheduledDate);
    const formattedDate = interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Generate meeting link display
    const meetingInfo = interview.mode === 'Teams' && interview.teamsMeetingUrl 
      ? `<p><strong>Teams Meeting:</strong> <a href="${interview.teamsMeetingUrl}" style="color: #007bff; text-decoration: none;">Join Teams Meeting</a></p>`
      : interview.mode === 'Online' 
      ? `<p><strong>Online Meeting:</strong> Meeting details will be shared closer to the interview date</p>`
      : `<p><strong>Location:</strong> Office location will be shared via email</p>`;

    // Send confirmation page
    const confirmationPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Confirmation - O2F Info Solutions</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
          .container { max-width: 800px; margin: 0 auto; background: white; min-height: 100vh; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; }
          .content { padding: 40px; }
          .interview-card { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 30px; margin: 20px 0; }
          .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
          .detail-row { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; display: inline-block; width: 140px; }
          .detail-value { color: #6b7280; }
          .meeting-link { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center; }
          .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 10px 0; }
          .btn:hover { background: #1d4ed8; }
          .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>O2F Info Solutions</h1>
            <p>Interview Confirmation</p>
          </div>
          
          <div class="content">
            <div class="status-badge">✓ Interview Confirmed</div>
            <h2>Your interview details for ${job?.title || 'Position'}</h2>
            
            <div class="interview-card">
              <h3 style="color: #1e40af; margin-top: 0;">Interview Information</h3>
              
              <div class="detail-row">
                <span class="detail-label">Candidate:</span>
                <span class="detail-value">${candidate?.name || 'Candidate'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${job?.title || 'Position'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Interview Round:</span>
                <span class="detail-value">${interview.interviewRound || 'Interview'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formattedTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Interviewer:</span>
                <span class="detail-value">${interview.interviewer || 'TBD'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Mode:</span>
                <span class="detail-value">${interview.mode || 'TBD'}</span>
              </div>
            </div>
            
            ${interview.mode === 'Teams' && interview.teamsMeetingUrl ? `
              <div class="meeting-link">
                <h4 style="margin-top: 0; color: #1e40af;">Microsoft Teams Meeting</h4>
                <p>Join your interview using the Teams meeting link below:</p>
                <a href="${interview.teamsMeetingUrl}" class="btn">Join Teams Meeting</a>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Save this link for your interview</p>
              </div>
            ` : ''}
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Important Reminders:</h4>
              <ul style="color: #92400e; margin-bottom: 0;">
                <li>Please join the meeting 5 minutes before the scheduled time</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Test your camera and microphone beforehand</li>
                <li>Have your resume and portfolio ready</li>
                <li>Prepare questions about the role and company</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="/candidate-portal" class="btn" style="margin-right: 15px;">Go to Portal</a>
              <a href="mailto:hr@o2finfosolutions.com" class="btn" style="background: #6b7280;">Contact HR</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>O2F Info Solutions Private Limited</strong></p>
            <p>Building Excellence in IT Solutions</p>
            <p>For any questions, please contact us at hr@o2finfosolutions.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(confirmationPage);
  } catch (error) {
    console.error('Interview confirmation error:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h2 style="color: #dc3545;">Something went wrong</h2>
          <p>We encountered an error processing your request. Please try again later or contact us for assistance.</p>
          <p><a href="mailto:hr@o2finfosolutions.com" style="color: #007bff;">Contact HR</a></p>
        </body>
      </html>
    `);
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