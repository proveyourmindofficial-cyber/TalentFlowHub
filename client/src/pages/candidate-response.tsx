import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Star } from 'lucide-react';

interface ResponsePageProps {
  token: string;
  response: 'interested' | 'not_interested';
}

interface JobDetails {
  title: string;
  companyName: string;
  department: string;
  location: string;
}

export default function CandidateResponsePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  // Extract token and response from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';
  const response = urlParams.get('response') as 'interested' | 'not_interested' || 'interested';

  useEffect(() => {
    loadJobDetails();
  }, [token]);

  const loadJobDetails = async () => {
    try {
      const res = await fetch(`/api/application/respond?token=${token}&response=${response}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setJobDetails(data.jobDetails);
        
        // If already responded and interested, redirect to portal
        if (data.alreadyResponded && data.portalUrl && response === 'interested') {
          toast({
            title: "Welcome Back!",
            description: "Redirecting to your portal...",
          });
          
          setTimeout(() => {
            window.location.href = data.portalUrl;
          }, 1500);
        }
      } else {
        toast({
          title: "Error",
          description: "Invalid or expired response link.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      toast({
        title: "Error",
        description: "Failed to load job details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (response === 'interested') {
      // Redirect to portal for interested candidates
      try {
        setIsSubmitting(true);
        const res = await apiRequest('POST', '/api/application/respond', {
          token,
          response,
          feedback,
          rating
        });
        
        const data = await res.json();
        
        if (data.success && data.portalUrl) {
          // Redirect to candidate portal
          window.location.href = data.portalUrl;
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to process response",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to submit response. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Show feedback form for not interested candidates
      try {
        setIsSubmitting(true);
        const result = await apiRequest('POST', '/api/application/respond', {
          token,
          response,
          feedback,
          rating
        });
        
        if (result.success) {
          setIsComplete(true);
          
          // For interested candidates, redirect to portal after a brief message
          if (response === 'interested' && result.portalUrl) {
            toast({
              title: "Welcome!",
              description: "Redirecting to your candidate portal...",
            });
            
            setTimeout(() => {
              window.location.href = result.portalUrl;
            }, 2000);
          } else {
            toast({
              title: "Thank You",
              description: "Your response has been recorded successfully.",
            });
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to submit response.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to submit response. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete && response === 'not_interested') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Thank You for Your Response
            </CardTitle>
            <CardDescription>
              We appreciate your time and feedback. We'll keep your profile for future opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {jobDetails?.companyName || 'O2F Info Solutions'} - Building careers, connecting talent
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {response === 'interested' ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {response === 'interested' 
              ? 'Thank You for Your Interest!' 
              : 'We Appreciate Your Response'}
          </CardTitle>
          <CardDescription>
            {jobDetails ? (
              <>
                <strong>{jobDetails.title}</strong> at {jobDetails.companyName}
                <br />
                {jobDetails.department} • {jobDetails.location}
              </>
            ) : (
              'Job Position'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {response === 'interested' ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Great! We're excited about your interest in this position. 
                You'll be redirected to your candidate portal where you can:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Track your application status</li>
                  <li>• Upload additional documents</li>
                  <li>• Complete your profile</li>
                  <li>• Communicate with our recruitment team</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 text-center">
                We understand this position might not be the right fit. 
                Your feedback helps us improve our process.
              </p>
            </div>
          )}

          {/* Feedback Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">How would you rate this opportunity? (Optional)</Label>
              <div className="mt-2">
                {renderStars()}
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback">
                {response === 'interested' 
                  ? 'Any additional comments? (Optional)'
                  : 'What made you decline this opportunity? (Optional)'}
              </Label>
              <Textarea
                id="feedback"
                placeholder={response === 'interested' 
                  ? 'Share your thoughts about this opportunity...'
                  : 'Help us understand your decision...'}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full max-w-md"
              size="lg"
            >
              {isSubmitting ? 'Processing...' : 
               response === 'interested' ? 'Continue to Portal' : 'Submit Response'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            {jobDetails?.companyName || 'TalentFlow Solutions'} - Building careers, connecting talent
          </div>
        </CardContent>
      </Card>
    </div>
  );
}