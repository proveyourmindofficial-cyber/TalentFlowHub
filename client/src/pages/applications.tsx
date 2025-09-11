import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ApplicationForm } from "@/components/application/application-form";
import { ApplicationTable } from "@/components/application/application-table";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { HelpButton } from "@/components/help/HelpCenter";
import type { ApplicationWithRelations } from "@shared/schema";

export default function Applications() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ApplicationWithRelations | null>(null);
  const [deleteApplication, setDeleteApplication] = useState<ApplicationWithRelations | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      // Invalidate all queries affected by application deletion
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/available-for-interview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Application deleted successfully"
      });
      setDeleteApplication(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive"
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (applicationIds: string[]) => {
      return apiRequest("POST", "/api/applications/bulk-delete", { ids: applicationIds });
    },
    onSuccess: () => {
      // Invalidate all queries affected by application deletion
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/available-for-interview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: `Applications deleted successfully`,
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
    setEditingApplication(null);
  };

  const handleEdit = (application: ApplicationWithRelations) => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const handleDelete = (application: ApplicationWithRelations) => {
    setDeleteApplication(application);
  };

  const handleBulkDelete = (applicationIds: string[]) => {
    bulkDeleteMutation.mutate(applicationIds);
  };

  const confirmDelete = () => {
    if (deleteApplication) {
      deleteMutation.mutate(deleteApplication.id);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="applications-page">
      <Header 
        title="Applications"
        description="Manage job applications and track candidate progress through the hiring workflow"
        action={
          <div className="flex gap-2">
            <HelpButton module="applications" />
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingApplication(null)} data-testid="button-new-application">
                  <Plus className="mr-2 h-4 w-4" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle data-testid="dialog-title">
                    {editingApplication ? "Edit Application" : "Create New Application"}
                  </DialogTitle>
                  <DialogDescription data-testid="dialog-description">
                    {editingApplication 
                      ? "Update the application details and stage progression."
                      : "Create a new application by connecting a candidate to a job position."
                    }
                  </DialogDescription>
                </DialogHeader>
                <ApplicationForm
                  application={editingApplication || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          }
        />

        <div className="flex-1 overflow-auto p-6">
          <ApplicationTable onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete} />
        </div>

      <AlertDialog open={!!deleteApplication} onOpenChange={() => setDeleteApplication(null)}>
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application
              {deleteApplication && (
                <span>
                  {" "}for <strong>{deleteApplication.candidate?.name}</strong> applying to{" "}
                  <strong>{deleteApplication.job?.title}</strong>
                </span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}