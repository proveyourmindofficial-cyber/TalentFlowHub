import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  userId?: string | null;
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  page?: string | null;
  userAgent?: string | null;
  assignedTo?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bug': return '🐛';
    case 'feature': return '✨';
    case 'improvement': return '🔧';
    case 'question': return '❓';
    default: return '📝';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'bug': return 'bg-red-100 text-red-800 border-red-300';
    case 'feature': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'improvement': return 'bg-green-100 text-green-800 border-green-300';
    case 'question': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <Clock className="w-3 h-3" />;
    case 'in_progress': return <ArrowUpDown className="w-3 h-3" />;
    case 'resolved': return <CheckCircle className="w-3 h-3" />;
    case 'closed': return <XCircle className="w-3 h-3" />;
    default: return <AlertCircle className="w-3 h-3" />;
  }
};

export function FeedbackManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Partial<FeedbackItem>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch feedback list
  const { data: feedbackList, isLoading } = useQuery({
    queryKey: ['/api/feedback', { type: typeFilter, status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append('type', typeFilter);
      if (statusFilter !== "all") params.append('status', statusFilter);
      if (priorityFilter !== "all") params.append('priority', priorityFilter);
      
      const url = `/api/feedback${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      return response.json();
    },
    refetchInterval: 30000, // Real-time updates
  });

  // Update feedback mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeedbackItem> }) => {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update feedback');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Updated! ✅",
        description: "The feedback has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      setEditDialogOpen(false);
      setEditingFeedback({});
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete feedback');
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Feedback Deleted! 🗑️",
        description: "The feedback has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredFeedback = (feedbackList as FeedbackItem[])?.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  }) || [];

  const handleViewFeedback = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setViewDialogOpen(true);
  };

  const handleEditFeedback = (feedback: FeedbackItem) => {
    setEditingFeedback({
      status: feedback.status,
      priority: feedback.priority,
      assignedTo: feedback.assignedTo,
      resolution: feedback.resolution,
    });
    setSelectedFeedback(feedback);
    setEditDialogOpen(true);
  };

  const handleUpdateFeedback = () => {
    if (!selectedFeedback) return;
    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      data: editingFeedback,
    });
  };

  const handleDeleteFeedback = (id: string) => {
    if (confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      deleteFeedbackMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (!filteredFeedback?.length) return;
    
    const csv = [
      ["Date", "Type", "Priority", "Status", "Title", "User", "Page", "Description"].join(","),
      ...filteredFeedback.map(item => [
        new Date(item.createdAt).toLocaleDateString(),
        item.type,
        item.priority,
        item.status,
        `"${item.title.replace(/"/g, '""')}"`,
        item.user?.username || "Anonymous",
        item.page || "",
        `"${item.description.replace(/"/g, '""')}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: filteredFeedback?.length || 0,
    open: filteredFeedback?.filter(f => f.status === 'open').length || 0,
    inProgress: filteredFeedback?.filter(f => f.status === 'in_progress').length || 0,
    resolved: filteredFeedback?.filter(f => f.status === 'resolved').length || 0,
    urgent: filteredFeedback?.filter(f => f.priority === 'urgent').length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Feedback Management
        </CardTitle>
        <CardDescription>
          Monitor, manage, and respond to user feedback, bug reports, and feature requests.
          Real-time tracking of all feedback submissions across the platform.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-feedback"
              />
            </div>
            
            {/* Filters */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">🐛 Bug</SelectItem>
                <SelectItem value="feature">✨ Feature</SelectItem>
                <SelectItem value="improvement">🔧 Improvement</SelectItem>
                <SelectItem value="question">❓ Question</SelectItem>
                <SelectItem value="other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40" data-testid="select-priority-filter">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Button */}
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
            disabled={!filteredFeedback?.length}
            data-testid="button-export-feedback"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Feedback</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{stats.open}</div>
            <div className="text-sm text-orange-600">Open</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
            <div className="text-sm text-red-600">Urgent</div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading feedback...</p>
            </div>
          ) : filteredFeedback?.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No feedback found</p>
              <p className="text-sm text-gray-400">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Feedback submissions will appear here when users submit them"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback?.map((feedback) => (
                  <TableRow 
                    key={feedback.id} 
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`feedback-row-${feedback.id}`}
                  >
                    <TableCell>
                      <div className="max-w-md">
                        <h4 className="font-medium text-gray-900 mb-1">{feedback.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{feedback.description}</p>
                        {feedback.page && (
                          <p className="text-xs text-gray-400 mt-1">Page: {feedback.page}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn("flex items-center gap-1", getTypeColor(feedback.type))}
                        variant="outline"
                      >
                        <span>{getTypeIcon(feedback.type)}</span>
                        {feedback.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn("text-xs", getPriorityColor(feedback.priority))}
                      >
                        {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn("flex items-center gap-1", getStatusColor(feedback.status))}
                        variant="outline"
                      >
                        {getStatusIcon(feedback.status)}
                        {feedback.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{feedback.user?.username || "Anonymous"}</div>
                          <div className="text-xs text-gray-500">{feedback.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFeedback(feedback)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          title="View Details"
                          data-testid={`view-feedback-${feedback.id}`}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFeedback(feedback)}
                          className="h-8 w-8 p-0 hover:bg-green-100"
                          title="Edit Feedback"
                          data-testid={`edit-feedback-${feedback.id}`}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          title="Delete Feedback"
                          data-testid={`delete-feedback-${feedback.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>

      {/* View Feedback Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{getTypeIcon(selectedFeedback?.type || '')}</span>
              {selectedFeedback?.title}
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedFeedback && formatDistanceToNow(new Date(selectedFeedback.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("flex items-center gap-1", getTypeColor(selectedFeedback.type))} variant="outline">
                  <span>{getTypeIcon(selectedFeedback.type)}</span>
                  {selectedFeedback.type}
                </Badge>
                <Badge className={cn("text-xs", getPriorityColor(selectedFeedback.priority))}>
                  {selectedFeedback.priority.charAt(0).toUpperCase() + selectedFeedback.priority.slice(1)} Priority
                </Badge>
                <Badge className={cn("flex items-center gap-1", getStatusColor(selectedFeedback.status))} variant="outline">
                  {getStatusIcon(selectedFeedback.status)}
                  {selectedFeedback.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedFeedback.description}</p>
                </div>

                {/* Context Information */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-gray-900">Context Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Submitted by:</span> 
                      <span className="ml-2">{selectedFeedback.user?.username || "Anonymous"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span> 
                      <span className="ml-2">{selectedFeedback.user?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Page:</span> 
                      <span className="ml-2">{selectedFeedback.page || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date:</span> 
                      <span className="ml-2">{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Resolution */}
                {selectedFeedback.resolution && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Resolution:</h4>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-green-700">{selectedFeedback.resolution}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Feedback Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feedback</DialogTitle>
            <DialogDescription>
              Update the status, priority, or add a resolution for this feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select 
                  value={editingFeedback.status || 'open'} 
                  onValueChange={(value) => setEditingFeedback(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <Select 
                  value={editingFeedback.priority || 'medium'} 
                  onValueChange={(value) => setEditingFeedback(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
              <Textarea
                placeholder="Add resolution notes or response..."
                value={editingFeedback.resolution || ''}
                onChange={(e) => setEditingFeedback(prev => ({ ...prev, resolution: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateFeedback}
                disabled={updateFeedbackMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateFeedbackMutation.isPending ? "Updating..." : "Update Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}