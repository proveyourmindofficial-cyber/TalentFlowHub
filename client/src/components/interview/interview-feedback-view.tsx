import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Edit, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { type Interview } from "@shared/schema";

interface InterviewFeedbackViewProps {
  interview: Interview | null;
  feedback: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function InterviewFeedbackView({ 
  interview, 
  feedback, 
  isOpen, 
  onClose, 
  onEdit 
}: InterviewFeedbackViewProps) {
  if (!interview || !feedback) return null;

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Hire':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Maybe':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'No Hire':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`} 
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              Interview Feedback - {interview.interviewRound} Round
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="ml-4"
                data-testid="button-edit-feedback"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Feedback
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Interview Details */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Interviewer:</span>
                <span>{interview.interviewer}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{format(new Date(interview.scheduledDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Time:</span>
                <span>{format(new Date(interview.scheduledDate), "h:mm a")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Mode:</span>
                <span>{interview.mode}</span>
              </div>
            </div>
          </div>

          {/* Overall Recommendation */}
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Overall Recommendation</h3>
              <Badge className={getRecommendationColor(feedback.overallRecommendation || 'Not set')}>
                {feedback.overallRecommendation || 'Not set'}
              </Badge>
            </div>
          </div>

          {/* Ratings Grid */}
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Skill Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Technical Skills</h4>
                <StarRating rating={feedback.technicalSkills || 0} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Communication Skills</h4>
                <StarRating rating={feedback.communicationSkills || 0} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Problem Solving</h4>
                <StarRating rating={feedback.problemSolving || 0} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Cultural Fit</h4>
                <StarRating rating={feedback.culturalFit || 0} />
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            {feedback.strengthsComments && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Candidate Strengths
                </h4>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  {feedback.strengthsComments}
                </p>
              </div>
            )}

            {feedback.improvementsComments && (
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Areas for Improvement
                </h4>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  {feedback.improvementsComments}
                </p>
              </div>
            )}

            {feedback.additionalNotes && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Additional Notes
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {feedback.additionalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground border-t">
            <div className="flex justify-between">
              <span>Feedback submitted on: {format(new Date(feedback.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
              {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                <span>Last updated: {format(new Date(feedback.updatedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}