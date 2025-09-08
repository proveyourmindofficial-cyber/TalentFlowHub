import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Users, 
  Clock, 
  MapPin, 
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  LogIn,
  MousePointer,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface UserJourney {
  userId: string;
  userEmail: string;
  currentStage: string;
  startedAt: string;
  lastActivity: string;
  totalSteps: number;
  completedSteps: number;
  status: 'active' | 'completed' | 'stuck' | 'abandoned';
  steps: JourneyStep[];
}

interface JourneyStep {
  id: string;
  step: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  duration?: string;
  details?: string;
  errorMessage?: string;
}

export function UserJourneyVisualization() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);

  // Fetch user journeys
  const { data: journeys, isLoading } = useQuery({
    queryKey: ['/api/admin/user-journeys', statusFilter, searchTerm],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch specific journey details
  const { data: journeyDetails } = useQuery({
    queryKey: ['/api/admin/user-journeys', selectedJourney],
    enabled: !!selectedJourney,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'email_sent':
      case 'email_opened':
        return <Mail className="h-4 w-4" />;
      case 'login':
      case 'authentication':
        return <LogIn className="h-4 w-4" />;
      case 'page_view':
      case 'navigation':
        return <MousePointer className="h-4 w-4" />;
      case 'form_submission':
      case 'data_entry':
        return <FileText className="h-4 w-4" />;
      case 'feedback_submitted':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getJourneyStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'stuck':
        return <Badge className="bg-yellow-100 text-yellow-800">Stuck</Badge>;
      case 'abandoned':
        return <Badge className="bg-red-100 text-red-800">Abandoned</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredJourneys = (Array.isArray(journeys) ? journeys : [])?.filter((journey: UserJourney) => {
    const matchesSearch = journey.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journey.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || journey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">User Journey Tracking</h2>
          <p className="text-muted-foreground">
            Monitor user progression from invitation to active usage
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stuck">Stuck</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Journey List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Journeys ({filteredJourneys?.length || 0})
            </CardTitle>
            <CardDescription>
              Click on a journey to view detailed timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading journeys...
                  </div>
                ) : filteredJourneys?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No journeys found matching your criteria
                  </div>
                ) : (
                  filteredJourneys?.map((journey: UserJourney) => (
                    <div
                      key={journey.userId}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedJourney === journey.userId ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedJourney(journey.userId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{journey.userEmail}</span>
                            {getJourneyStatusBadge(journey.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Stage: {journey.currentStage}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Started: {new Date(journey.startedAt).toLocaleDateString()}</span>
                            <span>Last activity: {new Date(journey.lastActivity).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {journey.completedSteps}/{journey.totalSteps} steps
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(journey.completedSteps / journey.totalSteps) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Journey Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Journey Timeline
            </CardTitle>
            <CardDescription>
              {selectedJourney ? 
                `Detailed steps for ${(journeyDetails as any)?.userEmail || 'selected user'}` :
                'Select a journey to view timeline'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {!selectedJourney ? (
                <div className="text-center py-20 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a user journey from the list to view their detailed timeline</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {((journeyDetails as any)?.steps || [])?.map((step: JourneyStep, index: number) => (
                    <div key={step.id} className="flex items-start gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white">
                          {getStatusIcon(step.status)}
                        </div>
                        {index < ((journeyDetails as any)?.steps?.length || 0) - 1 && (
                          <div className="w-px h-8 bg-gray-300 mt-2"></div>
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getActionIcon(step.action)}
                              <h4 className="font-medium">{step.step}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.details}</p>
                            {step.errorMessage && (
                              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                Error: {step.errorMessage}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{new Date(step.timestamp).toLocaleString()}</div>
                            {step.duration && (
                              <div className="mt-1">Duration: {step.duration}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading timeline...
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}