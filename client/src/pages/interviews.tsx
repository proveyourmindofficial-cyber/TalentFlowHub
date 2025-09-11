import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { InterviewForm } from "@/components/interview/interview-form";
import { InterviewTable } from "@/components/interview/interview-table";
import { InterviewFeedbackForm } from "@/components/interview/interview-feedback-form";
import { InterviewFeedbackView } from "@/components/interview/interview-feedback-view";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import type { Interview } from "@shared/schema";

export default function Interviews() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [deleteInterview, setDeleteInterview] = useState<Interview | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackViewInterview, setFeedbackViewInterview] = useState<Interview | null>(null);
  const [isFeedbackViewOpen, setIsFeedbackViewOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/interviews/${id}`);
    },
    onSuccess: () => {
      // Invalidate all queries affected by interview deletion
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Interview deleted successfully"
      });
      setDeleteInterview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete interview",
        variant: "destructive"
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (interviewIds: string[]) => {
      return apiRequest("POST", "/api/interviews/bulk-delete", { ids: interviewIds });
    },
    onSuccess: () => {
      // Invalidate all queries affected by interview deletion
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: `Interviews deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingInterview(null);
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setIsFormOpen(true);
  };

  const handleDelete = (interview: Interview) => {
    setDeleteInterview(interview);
  };

  const handleBulkDelete = (interviewIds: string[]) => {
    bulkDeleteMutation.mutate(interviewIds);
  };

  const handleFeedback = async (interview: Interview) => {
    try {
      // Check if feedback already exists
      const feedback = await apiRequest("GET", `/api/interviews/${interview.id}/feedback`);
      if (feedback) {
        // Show feedback view dialog
        setFeedbackViewInterview(interview);
        setCurrentFeedback(feedback);
        setIsFeedbackViewOpen(true);
      } else {
        // Show feedback form dialog
        setFeedbackInterview(interview);
        setIsFeedbackOpen(true);
      }
    } catch (error) {
      // No feedback exists, show form dialog
      setFeedbackInterview(interview);
      setIsFeedbackOpen(true);
    }
  };

  const handleCloseFeedback = async () => {
    setIsFeedbackOpen(false);
    
    // Get candidate ID from the interview to invalidate candidate-specific caches
    if (feedbackInterview) {
      try {
        const application = await apiRequest("GET", `/api/applications/${feedbackInterview.applicationId}`);
        const candidateId = application.candidateId;
        
        // Invalidate both Interview and Candidate view caches
        queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
        queryClient.invalidateQueries({ queryKey: ["/api/interviews/feedback-status"] });
        
        if (candidateId) {
          queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId, "timeline"] });
          queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId, "interviews"] });
          queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId, "interviews-feedback"] });
        }
      } catch (error) {
        console.error("Failed to invalidate candidate caches:", error);
        // Still invalidate interview caches even if candidate cache invalidation fails
        queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
        queryClient.invalidateQueries({ queryKey: ["/api/interviews/feedback-status"] });
      }
    }
    
    setFeedbackInterview(null);
  };

  const handleCloseFeedbackView = () => {
    setIsFeedbackViewOpen(false);
    setFeedbackViewInterview(null);
    setCurrentFeedback(null);
  };

  const handleEditFromView = () => {
    if (feedbackViewInterview) {
      // Close view dialog and open edit form
      setIsFeedbackViewOpen(false);
      setFeedbackInterview(feedbackViewInterview);
      setIsFeedbackOpen(true);
    }
  };

  const handleResend = (interview: Interview) => {
    // The resend functionality is handled by the InterviewTable component
    console.log('Resending interview email for:', interview.id);
  };

  const confirmDelete = () => {
    if (deleteInterview) {
      deleteMutation.mutate(deleteInterview.id);
    }
  };

  const headerActions = (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-interview">
          <Calendar className="h-4 w-4 mr-2" />
          New Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInterview ? "Edit Interview" : "Create New Interview"}
          </DialogTitle>
          <DialogDescription>
            {editingInterview 
              ? "Update the interview details below."
              : "Schedule a new interview for a candidate application."
            }
          </DialogDescription>
        </DialogHeader>
        <InterviewForm 
          interview={editingInterview || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingInterview(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Interview Management"
        description="Schedule and manage candidate interviews"
        action={headerActions}
      />
      
      <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <InterviewTable 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onResend={handleResend}
              onFeedback={handleFeedback}
            />
          </div>

        {/* Feedback Form Dialog */}
        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Interview Feedback</DialogTitle>
              <DialogDescription>
                Provide detailed feedback for the {feedbackInterview?.interviewRound} round interview
              </DialogDescription>
            </DialogHeader>
            {feedbackInterview && (
              <InterviewFeedbackForm 
                interviewId={feedbackInterview.id}
                candidateName="Candidate" // We'll fetch this from the API
                jobTitle="Position" // We'll fetch this from the API
                onSuccess={handleCloseFeedback}
                onCancel={handleCloseFeedback}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Feedback View Dialog */}
        <InterviewFeedbackView
          interview={feedbackViewInterview}
          feedback={currentFeedback}
          isOpen={isFeedbackViewOpen}
          onClose={handleCloseFeedbackView}
          onEdit={handleEditFromView}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteInterview} onOpenChange={() => setDeleteInterview(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the interview scheduled with{" "}
                <strong>{deleteInterview?.interviewer}</strong> for{" "}
                <strong>{deleteInterview?.interviewRound}</strong> round.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete Interview
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}