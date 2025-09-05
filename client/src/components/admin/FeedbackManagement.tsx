import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Eye,
  MessageCircle,
  Star,
  Trash2,
  Archive,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'feature_request' | 'bug_report' | 'improvement' | 'complaint' | 'praise';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  adminNotes?: string;
  attachments?: string[];
  votes: number;
  tags: string[];
}

export function FeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch feedback list
  const { data: feedbackList, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/feedback', typeFilter, statusFilter, priorityFilter, searchTerm],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch feedback details
  const { data: feedbackDetails } = useQuery({
    queryKey: ['/api/admin/feedback', selectedFeedback?.id],
    enabled: !!selectedFeedback && showDetails,
  });

  // Feedback management mutations
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
    },
  });

  const updatePriority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      fetch(`/api/admin/feedback/${id}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
    },
  });

  const addAdminNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      fetch(`/api/admin/feedback/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      setAdminNotes('');
    },
  });

  const deleteFeedback = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      setShowDetails(false);
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'improvement':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'complaint':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'praise':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      bug_report: 'bg-red-100 text-red-800',
      feature_request: 'bg-blue-100 text-blue-800',
      improvement: 'bg-yellow-100 text-yellow-800',
      complaint: 'bg-orange-100 text-orange-800',
      praise: 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {priority}
      </Badge>
    );
  };

  const filteredFeedback = feedbackList?.filter((feedback: Feedback) => {
    const matchesSearch = 
      feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || feedback.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || feedback.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetails(true);
  };

  const handleSaveNotes = () => {
    if (selectedFeedback && adminNotes.trim()) {
      addAdminNotes.mutate({ id: selectedFeedback.id, notes: adminNotes });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Feedback Management</h2>
          <p className="text-muted-foreground">
            Review and manage user feedback, bug reports, and feature requests
          </p>
        </div>
        
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{feedbackList?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">New</p>
                <p className="text-2xl font-bold">
                  {feedbackList?.filter((f: Feedback) => f.status === 'new').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Bugs</p>
                <p className="text-2xl font-bold">
                  {feedbackList?.filter((f: Feedback) => f.type === 'bug_report').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Urgent</p>
                <p className="text-2xl font-bold text-red-600">
                  {feedbackList?.filter((f: Feedback) => f.priority === 'urgent').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {feedbackList?.filter((f: Feedback) => f.status === 'resolved').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground self-center">
              Showing: {filteredFeedback?.length || 0} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Items ({filteredFeedback?.length || 0})
          </CardTitle>
          <CardDescription>
            Click on any feedback item to view details and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading feedback...
                </div>
              ) : filteredFeedback?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback found matching your criteria
                </div>
              ) : (
                filteredFeedback?.map((feedback: Feedback) => (
                  <div key={feedback.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                       onClick={() => handleViewDetails(feedback)}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          {getTypeIcon(feedback.type)}
                          <h3 className="font-medium">{feedback.title}</h3>
                          {getTypeBadge(feedback.type)}
                          {getStatusBadge(feedback.status)}
                          {getPriorityBadge(feedback.priority)}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {feedback.userEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                          {feedback.votes > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {feedback.votes} votes
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {feedback.tags && feedback.tags.length > 0 && (
                          <div className="flex gap-1">
                            {feedback.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {feedback.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{feedback.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Feedback Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFeedback && getTypeIcon(selectedFeedback.type)}
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Manage feedback item and add admin notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-4">
                {/* Header Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{selectedFeedback.title}</h3>
                  <div className="flex gap-2">
                    {getTypeBadge(selectedFeedback.type)}
                    {getStatusBadge(selectedFeedback.status)}
                    {getPriorityBadge(selectedFeedback.priority)}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {selectedFeedback.description}
                  </p>
                </div>

                {/* Meta Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">User Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedFeedback.userName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {selectedFeedback.userEmail}</p>
                      <p><span className="text-muted-foreground">Submitted:</span> {new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                      <p><span className="text-muted-foreground">Updated:</span> {new Date(selectedFeedback.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Management</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-muted-foreground">Status</label>
                        <Select 
                          value={selectedFeedback.status} 
                          onValueChange={(value) => updateStatus.mutate({ id: selectedFeedback.id, status: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground">Priority</label>
                        <Select 
                          value={selectedFeedback.priority} 
                          onValueChange={(value) => updatePriority.mutate({ id: selectedFeedback.id, priority: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h4 className="font-medium mb-2">Admin Notes</h4>
                  {selectedFeedback.adminNotes && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm">{selectedFeedback.adminNotes}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add admin notes..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleSaveNotes}
                      disabled={!adminNotes.trim() || addAdminNotes.isPending}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Save Notes
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="space-x-2">
                    <Button variant="outline">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={() => deleteFeedback.mutate(selectedFeedback.id)}
                    disabled={deleteFeedback.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}