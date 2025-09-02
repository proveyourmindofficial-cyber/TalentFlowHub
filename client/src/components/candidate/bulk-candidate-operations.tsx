import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Mail, Tag, Upload, Download, Trash2, Edit } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BulkOperationsProps {
  selectedCandidates: string[];
  onSelectionChange: (candidateIds: string[]) => void;
  candidates: any[];
}

interface BulkUpdateData {
  status?: string;
  recruiterName?: string;
  source?: string;
  tags?: string[];
}

export function BulkCandidateOperations({ 
  selectedCandidates, 
  onSelectionChange, 
  candidates 
}: BulkOperationsProps) {
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { candidateIds: string[]; updates: BulkUpdateData }) => {
      return await apiRequest("/api/candidates/bulk-update", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      setBulkUpdateDialog(false);
      onSelectionChange([]);
    },
  });

  const bulkEmailMutation = useMutation({
    mutationFn: async (data: { candidateIds: string[]; templateKey: string }) => {
      return await apiRequest("/api/candidates/bulk-email", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setEmailDialog(false);
      onSelectionChange([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (candidateIds: string[]) => {
      return await apiRequest("/api/candidates/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ candidateIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      onSelectionChange([]);
    },
  });

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(candidates.map(c => c.id));
    }
  };

  const handleBulkUpdate = () => {
    bulkUpdateMutation.mutate({
      candidateIds: selectedCandidates,
      updates: updateData,
    });
  };

  const handleBulkEmail = (templateKey: string) => {
    bulkEmailMutation.mutate({
      candidateIds: selectedCandidates,
      templateKey,
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCandidates.length} candidates? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedCandidates);
    }
  };

  const exportCandidates = () => {
    const selectedData = candidates.filter(c => selectedCandidates.includes(c.id));
    const csv = convertToCSV(selectedData);
    downloadCSV(csv, `candidates-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = ['Name', 'Email', 'Phone', 'Primary Skill', 'Experience', 'Current Company', 'Status'];
    const rows = data.map(candidate => [
      candidate.name,
      candidate.email,
      candidate.phone,
      candidate.primarySkill,
      candidate.totalExperience,
      candidate.currentCompany,
      candidate.status,
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
            {selectedCandidates.length > 0 && (
              <Badge variant="secondary">
                {selectedCandidates.length} selected
              </Badge>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedCandidates.length === candidates.length && candidates.length > 0}
              onCheckedChange={handleSelectAll}
              data-testid="select-all-checkbox"
            />
            <span className="text-sm">Select All</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      {selectedCandidates.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Bulk Update */}
            <Dialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="bulk-update-button">
                  <Edit className="h-4 w-4 mr-1" />
                  Update ({selectedCandidates.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Update Candidates</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Email Sent">Email Sent</SelectItem>
                        <SelectItem value="Interested">Interested</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recruiter</label>
                    <Select onValueChange={(value) => setUpdateData(prev => ({ ...prev, recruiterName: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign recruiter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="John Doe">John Doe</SelectItem>
                        <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                        <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkUpdate}
                      disabled={bulkUpdateMutation.isPending}
                      data-testid="confirm-bulk-update"
                    >
                      {bulkUpdateMutation.isPending ? "Updating..." : "Update All"}
                    </Button>
                    <Button variant="outline" onClick={() => setBulkUpdateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bulk Email */}
            <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="bulk-email-button">
                  <Mail className="h-4 w-4 mr-1" />
                  Send Email ({selectedCandidates.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Bulk Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Send email to {selectedCandidates.length} selected candidates
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleBulkEmail('candidate_welcome')}
                      disabled={bulkEmailMutation.isPending}
                    >
                      Welcome Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBulkEmail('candidate_follow_up')}
                      disabled={bulkEmailMutation.isPending}
                    >
                      Follow-up Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBulkEmail('interview_invitation')}
                      disabled={bulkEmailMutation.isPending}
                    >
                      Interview Invitation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBulkEmail('rejection_email')}
                      disabled={bulkEmailMutation.isPending}
                    >
                      Rejection Email
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={exportCandidates} data-testid="export-button">
              <Download className="h-4 w-4 mr-1" />
              Export ({selectedCandidates.length})
            </Button>

            {/* Bulk Delete */}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="bulk-delete-button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCandidates.length})
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}