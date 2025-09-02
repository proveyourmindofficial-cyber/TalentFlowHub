import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, FileText } from "lucide-react";
import { type Candidate } from "@shared/schema";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { CandidateDetailView } from "./candidate-detail-view";

interface CandidateTableProps {
  candidates: Candidate[];
  isLoading?: boolean;
  onView: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (candidateId: string) => void;
  onBulkDelete: (candidateIds: string[]) => void;
}

export function CandidateTable({ candidates, isLoading, onView, onEdit, onDelete, onBulkDelete }: CandidateTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.primarySkill.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const {
    selectedIds,
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    hasSelection
  } = useBulkSelection(filteredCandidates);

  const handleBulkDelete = () => {
    onBulkDelete(selectedIds);
    clearSelection();
  };

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (candidateToDelete) {
      onDelete(candidateToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Interviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Offered":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Joined":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "Placed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Not Joined":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "-";
    return `₹${Number(amount).toLocaleString()}`;
  };

  const formatExperience = (total: string | null, relevant: string | null) => {
    if (!total && !relevant) return "-";
    const t = total ? Number(total) : 0;
    const r = relevant ? Number(relevant) : 0;
    return `${t}/${r}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Candidates...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-candidates"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Interviewing">Interviewing</SelectItem>
                  <SelectItem value="Offered">Offered</SelectItem>
                  <SelectItem value="Joined">Joined</SelectItem>
                  <SelectItem value="Placed">Placed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Not Joined">Not Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        {/* Bulk Operations */}
        <div className="px-6 py-3">
          <BulkOperations
            selectedItems={selectedIds}
            totalItems={filteredCandidates.length}
            onSelectAll={toggleAll}
            onBulkDelete={handleBulkDelete}
            itemName="candidate"
          />
        </div>
        
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No candidates match your search criteria." 
                : "No candidates found. Create your first candidate to get started."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Exp (T/R)</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>CTC/ECTC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id} data-testid={`row-candidate-${candidate.id}`}>
                      <TableCell>
                        <ItemCheckbox
                          id={candidate.id}
                          checked={isSelected(candidate.id)}
                          onCheckedChange={toggleItem}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-muted-foreground">{candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-skill-${candidate.id}`}>
                        {candidate.primarySkill}
                      </TableCell>
                      <TableCell data-testid={`text-experience-${candidate.id}`}>
                        {formatExperience(candidate.totalExperience, candidate.relevantExperience)}
                      </TableCell>
                      <TableCell data-testid={`text-company-${candidate.id}`}>
                        {candidate.currentCompany || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-ctc-${candidate.id}`}>
                        <div className="text-sm">
                          <div>{formatCurrency(candidate.currentCtc)}</div>
                          <div className="text-muted-foreground">{formatCurrency(candidate.expectedCtc)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getStatusColor(candidate.status)}
                          data-testid={`badge-status-${candidate.id}`}
                        >
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              data-testid={`button-actions-${candidate.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onView(candidate)}
                              data-testid={`button-view-${candidate.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(candidate)}
                              data-testid={`button-edit-${candidate.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {candidate.resumeUrl && (
                              <DropdownMenuItem
                                onClick={() => window.open(candidate.resumeUrl!, '_blank')}
                                data-testid={`button-resume-${candidate.id}`}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(candidate)}
                              className="text-red-600"
                              data-testid={`button-delete-${candidate.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-candidate">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{candidateToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}