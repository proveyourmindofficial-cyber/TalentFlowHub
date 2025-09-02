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
import { type Candidate, type InsertCandidate } from "@shared/schema";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";

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
    mutationFn: async (candidateData: InsertCandidate) => {
      const response = await fetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify(candidateData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate creation
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      setDialogOpen(false);
      setEditingCandidate(null);
      toast({
        title: "Success",
        description: "Candidate created successfully",
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCandidate }) => {
      const response = await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate updates
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
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

  const handleSubmit = (candidateData: InsertCandidate) => {
    if (editingCandidate) {
      updateMutation.mutate({ id: editingCandidate.id, data: candidateData });
    } else {
      createMutation.mutate(candidateData);
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
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setDialogOpen(true)} 
                data-testid="button-create-candidate"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="candidate-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidate ? "Edit Candidate" : "Create New Candidate"}
                </DialogTitle>
                <div id="candidate-form-description" className="sr-only">
                  {editingCandidate ? "Edit candidate information including contact details, experience, and compensation" : "Create a new candidate profile with contact details, experience, and compensation information"}
                </div>
              </DialogHeader>
              <CandidateForm
                initialData={editingCandidate || undefined}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>

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