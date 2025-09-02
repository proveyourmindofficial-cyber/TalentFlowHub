import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { Edit, Trash2, FileCheck, Mail } from "lucide-react";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ApplicationWithRelations } from "@shared/schema";
import { OfferCreationDialog } from "@/components/offer-letter/offer-creation-dialog";

interface ApplicationTableProps {
  onEdit?: (application: ApplicationWithRelations) => void;
  onDelete?: (application: ApplicationWithRelations) => void;
  onBulkDelete?: (applicationIds: string[]) => void;
}

const getStageVariant = (stage: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (stage) {
    case "Applied":
      return "secondary";
    case "Shortlisted":
      return "outline";
    case "L1 Scheduled":
    case "L2 Scheduled":
      return "default";
    case "Selected":
    case "Offer Released":
      return "default";
    case "Joined":
      return "default";
    case "Rejected":
    case "No Show":
    case "Not Joined":
      return "destructive";
    case "On Hold":
      return "secondary";
    default:
      return "outline";
  }
};

const formatScheduledDate = (date: Date | string | null): string => {
  if (!date) return "—";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "dd-MM-yyyy HH:mm");
  } catch {
    return "—";
  }
};

export function ApplicationTable({ onEdit, onDelete, onBulkDelete }: ApplicationTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedApplicationForOffer, setSelectedApplicationForOffer] = useState<ApplicationWithRelations | null>(null);
  
  const { data: applications = [], isLoading, error } = useQuery<ApplicationWithRelations[]>({
    queryKey: ["/api/applications"]
  });

  const {
    selectedIds,
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    hasSelection
  } = useBulkSelection(applications);

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
      clearSelection();
    }
  };

  const handleReleaseOffer = (application: ApplicationWithRelations) => {
    // Check if candidate status is "Offered" (from existing automation)
    if (application.candidate?.status !== 'Offered') {
      toast({
        title: "Cannot Release Offer",
        description: "Candidate must have 'Offered' status to release offer letter.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedApplicationForOffer(application);
    setOfferDialogOpen(true);
  };

  // Resend JD Email Mutation
  const resendJDEmailMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest('POST', `/api/applications/${applicationId}/resend-jd-email`);
    },
    onSuccess: (data, applicationId) => {
      toast({
        title: "JD Email Sent",
        description: "Job description email has been resent successfully!",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error, applicationId) => {
      console.error('Error resending JD email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to resend job description email. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleResendJDEmail = (application: ApplicationWithRelations) => {
    resendJDEmailMutation.mutate(application.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Loading applications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Error loading applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">Failed to load applications</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Manage job applications and track candidate progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No applications found</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="applications-table">
      <CardHeader>
        <CardTitle>Applications ({applications.length})</CardTitle>
        <CardDescription>Manage job applications and track candidate progress</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSelection && onBulkDelete && (
          <BulkOperations
            selectedItems={selectedIds}
            totalItems={applications.length}
            onSelectAll={(checked) => toggleAll(checked)}
            onBulkDelete={handleBulkDelete}
            itemName="application"
          />
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <ItemCheckbox
                  checked={selectedIds.length > 0 && selectedIds.length === applications.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < applications.length}
                  onChange={(checked) => toggleAll(checked)}
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead data-testid="header-candidate">Candidate Name</TableHead>
              <TableHead data-testid="header-job">Job Title</TableHead>
              <TableHead data-testid="header-stage">Stage</TableHead>
              <TableHead data-testid="header-feedback">Feedback</TableHead>
              <TableHead data-testid="header-scheduled">Scheduled Date</TableHead>
              <TableHead className="w-[100px]" data-testid="header-actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id} data-testid={`application-row-${application.id}`}>
                <TableCell>
                  <ItemCheckbox
                    checked={isSelected(application.id)}
                    onChange={(checked) => toggleItem(application.id, checked)}
                    data-testid={`checkbox-${application.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium" data-testid={`cell-candidate-${application.id}`}>
                  {application.candidate?.name || "Unknown Candidate"}
                </TableCell>
                <TableCell data-testid={`cell-job-${application.id}`}>
                  {application.job?.title || "Unknown Job"}
                </TableCell>
                <TableCell data-testid={`cell-stage-${application.id}`}>
                  <Badge variant={getStageVariant(application.stage)}>
                    {application.stage}
                  </Badge>
                </TableCell>
                <TableCell data-testid={`cell-feedback-${application.id}`}>
                  <div className="max-w-[300px] truncate">
                    {application.feedback || "—"}
                  </div>
                </TableCell>
                <TableCell data-testid={`cell-scheduled-${application.id}`}>
                  {formatScheduledDate(application.scheduledDate)}
                </TableCell>
                <TableCell data-testid={`cell-actions-${application.id}`}>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendJDEmail(application)}
                      disabled={resendJDEmailMutation.isPending}
                      data-testid={`button-resend-jd-${application.id}`}
                      title="Resend JD email with response buttons"
                    >
                      <Mail className="h-4 w-4" />
                      {resendJDEmailMutation.isPending ? 'Sending...' : 'Resend JD'}
                    </Button>
                    {application.stage === "Selected" && application.candidate?.status === "Offered" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReleaseOffer(application)}
                        data-testid={`button-release-offer-${application.id}`}
                      >
                        <FileCheck className="h-4 w-4" />
                        Release Offer
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(application)}
                        data-testid={`button-edit-${application.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(application)}
                        data-testid={`button-delete-${application.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Offer Creation Dialog */}
      {selectedApplicationForOffer && selectedApplicationForOffer.candidate && selectedApplicationForOffer.job && (
        <OfferCreationDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          application={selectedApplicationForOffer}
        />
      )}
    </Card>
  );
}