import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, Edit, Trash2, User, Video, MapPin } from "lucide-react";
import { type Interview } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { useBulkSelection } from "@/hooks/use-bulk-selection";

interface InterviewTableProps {
  onEdit?: (interview: Interview) => void;
  onDelete?: (interview: Interview) => void;
  onBulkDelete?: (interviewIds: string[]) => void;
}

export function InterviewTable({ onEdit, onDelete, onBulkDelete }: InterviewTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roundFilter, setRoundFilter] = useState<string>("all");

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"]
  });

  const {
    selectedIds,
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    hasSelection
  } = useBulkSelection(interviews || []);

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
      clearSelection();
    }
  };

  if (isLoading) {
    return <div>Loading interviews...</div>;
  }

  if (!interviews || interviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No interviews found. Create your first interview to get started.
      </div>
    );
  }

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.interviewer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
    const matchesRound = roundFilter === "all" || interview.interviewRound === roundFilter;
    
    return matchesSearch && matchesStatus && matchesRound;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Selected":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getRoundColor = (round: string) => {
    switch (round) {
      case "L1":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "L2":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "HR":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      case "Final":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by interviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-interviews"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Selected">Selected</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roundFilter} onValueChange={setRoundFilter}>
          <SelectTrigger className="w-[120px]" data-testid="select-round-filter">
            <SelectValue placeholder="All Rounds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rounds</SelectItem>
            <SelectItem value="L1">L1</SelectItem>
            <SelectItem value="L2">L2</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Final">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Operations */}
      {hasSelection && onBulkDelete && (
        <BulkOperations
          selectedItems={selectedIds}
          totalItems={filteredInterviews.length}
          onSelectAll={toggleAll}
          onBulkDelete={handleBulkDelete}
          itemName="interview"
        />
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <ItemCheckbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredInterviews.length}
                  onChange={() => toggleAll()}
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterviews.map((interview) => (
              <TableRow key={interview.id} data-testid={`row-interview-${interview.id}`}>
                <TableCell>
                  <ItemCheckbox
                    checked={isSelected(interview.id)}
                    onChange={() => toggleItem(interview.id)}
                    data-testid={`checkbox-${interview.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Badge className={getRoundColor(interview.interviewRound)}>
                    {interview.interviewRound}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-interviewer-${interview.id}`}>
                      {interview.interviewer}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    {interview.mode === "Online" ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{interview.mode}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(interview.scheduledDate), "MMM dd, yyyy")}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(interview.scheduledDate), "h:mm a")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(interview.status)}>
                    {interview.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="max-w-[200px]">
                    {interview.notes ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {interview.notes}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        No feedback yet
                      </span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(interview)}
                        data-testid={`button-edit-${interview.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(interview)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${interview.id}`}
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
      </div>

      {filteredInterviews.length === 0 && interviews.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No interviews match your current filters.
        </div>
      )}
    </div>
  );
}