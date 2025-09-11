import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CandidateForm } from "@/components/candidate/candidate-form";
import { CandidateTable } from "@/components/candidate/candidate-table";
import { CandidateDetailView } from "@/components/candidate/candidate-detail-view";
import { apiRequest } from "@/lib/queryClient";
import { type Candidate, type InsertCandidate, type CandidateSkill } from "@shared/schema";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { HelpButton } from "@/components/help/HelpCenter";

export default function CandidatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

  const {
    data: candidates = [],
    isLoading: candidatesLoading,
  } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const createMutation = useMutation({
    mutationFn: async ({ candidateData, skills }: { candidateData: InsertCandidate; skills: CandidateSkill[] }) => {
      const response = await fetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify(candidateData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to create candidate";
        let errorType = "unknown";
        let errorField = "";
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
            errorType = errorData.type || "unknown";
            errorField = errorData.field || "";
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status code
          errorMessage = `Failed to create candidate (${response.status})`;
        }
        
        const error = new Error(errorMessage) as Error & { 
          type?: string; 
          field?: string; 
          status?: number;
        };
        error.type = errorType;
        error.field = errorField;
        error.status = response.status;
        throw error;
      }
      
      const candidate = await response.json();
      
      // Save skills after candidate is created
      if (skills.length > 0) {
        for (const skill of skills) {
          await fetch(`/api/candidates/${candidate.id}/skills`, {
            method: "POST",
            body: JSON.stringify({
              skillId: skill.id,
              proficiency: skill.proficiency,
              yearsOfExperience: skill.yearsOfExperience || 0,
              certified: skill.certified || false,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      }
      
      return candidate;
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate creation
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      // Invalidate skills queries for real-time updates in Enhanced Profile
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", "skills"] });
      setDialogOpen(false);
      setEditingCandidate(null);
      toast({
        title: "Success",
        description: "Candidate created successfully",
      });
    },
    onError: (error: Error & { type?: string; field?: string; status?: number }) => {
      let title = "Error Creating Candidate";
      let description = error.message;
      
      // Provide user-friendly messages based on error type
      if (error.type === "unique_violation") {
        title = "Duplicate Information";
        if (error.field === "phone") {
          description = "A candidate with this phone number already exists. Please check and use a different phone number.";
        } else if (error.field === "email") {
          description = "A candidate with this email address already exists. Please check and use a different email address.";
        } else {
          description = "This candidate information already exists in the system. Please check the phone number and email address.";
        }
      } else if (error.type === "validation_error") {
        title = "Validation Error";
        description = error.message || "Please check that all required fields are filled correctly.";
      } else if (error.status === 400) {
        title = "Invalid Data";
        description = error.message || "Please check your input and try again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 6000, // Show longer for user to read the detailed message
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, candidateData, skills }: { id: string; candidateData: InsertCandidate; skills: CandidateSkill[] }) => {
      const response = await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        body: JSON.stringify(candidateData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const candidate = await response.json();
      
      // First, remove all existing skills for this candidate
      const existingSkillsResponse = await fetch(`/api/candidates/${id}/skills`);
      if (existingSkillsResponse.ok) {
        const existingSkills = await existingSkillsResponse.json();
        for (const existingSkill of existingSkills) {
          await fetch(`/api/candidates/${id}/skills/${existingSkill.skillId}`, {
            method: "DELETE",
          });
        }
      }
      
      // Then save new skills
      if (skills.length > 0) {
        for (const skill of skills) {
          await fetch(`/api/candidates/${id}/skills`, {
            method: "POST",
            body: JSON.stringify({
              skillId: skill.id,
              proficiency: skill.proficiency,
              yearsOfExperience: skill.yearsOfExperience || 0,
              certified: skill.certified || false,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      }
      
      return candidate;
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate updates
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      // Invalidate skills queries for real-time updates in Enhanced Profile
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", "skills"] });
      setDialogOpen(false);
      setEditingCandidate(null);
      toast({
        title: "Success",
        description: "Candidate updated successfully",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate deletion
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
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

  const handleSubmit = (candidateData: InsertCandidate, skills: CandidateSkill[]) => {
    if (editingCandidate) {
      updateMutation.mutate({ id: editingCandidate.id, candidateData, skills });
    } else {
      createMutation.mutate({ candidateData, skills });
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setDialogOpen(true);
  };

  const handleView = (candidate: Candidate) => {
    setViewingCandidate(candidate);
    setViewDialogOpen(true);
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (candidateIds: string[]) => {
      return apiRequest("POST", "/api/candidates/bulk-delete", { ids: candidateIds });
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate deletion
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: `Candidates deleted successfully`,
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

  const handleDelete = (candidateId: string) => {
    deleteMutation.mutate(candidateId);
  };

  const handleBulkDelete = (candidateIds: string[]) => {
    bulkDeleteMutation.mutate(candidateIds);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCandidate(null);
  };

  return (
    <div className="flex flex-col h-full" data-testid="candidates-page">
      <Header 
        title="Candidates"
        description="Manage and track your candidate pipeline"
        showNewJobButton={false}
        action={
          <div className="flex gap-2">
            <HelpButton module="candidates" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-candidate" className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCandidate ? "Edit Candidate" : "Add New Candidate"}
                  </DialogTitle>
                </DialogHeader>
                <CandidateForm
                  initialData={editingCandidate || undefined}
                  onSubmit={handleSubmit}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        <CandidateTable
          candidates={candidates}
          isLoading={candidatesLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* Candidate Detail View Dialog */}
      {viewingCandidate && (
        <CandidateDetailView
          candidateId={viewingCandidate.id}
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setViewingCandidate(null);
          }}
        />
      )}
    </div>
  );
}