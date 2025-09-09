import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface CandidateApplicationsTabProps {
  candidateId: string;
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

const getStageIcon = (stage: string) => {
  switch (stage) {
    case "Joined":
      return <CheckCircle className="w-4 h-4" />;
    case "Rejected":
    case "No Show":
    case "Not Joined":
      return <XCircle className="w-4 h-4" />;
    case "On Hold":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return "—";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "Not specified";
  return `₹${(amount / 100000).toFixed(1)}L`;
};

export function CandidateApplicationsTab({ candidateId }: CandidateApplicationsTabProps) {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/candidates', candidateId, 'applications'],
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  const activeApplications = applications.filter((app: any) => 
    !['Rejected', 'Not Joined', 'Joined'].includes(app.stage)
  );

  const completedApplications = applications.filter((app: any) => 
    ['Rejected', 'Not Joined', 'Joined'].includes(app.stage)
  );

  return (
    <div className="space-y-6">
      {/* Applications Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Applications</span>
              <Badge variant="outline">{applications.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant="default">{activeApplications.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <Badge variant="secondary">{completedApplications.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <Badge variant="outline">
                {applications.length > 0 
                  ? Math.round((applications.filter((app: any) => app.stage === 'Joined').length / applications.length) * 100)
                  : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Applications */}
      {activeApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Active Applications
              <Badge variant="default">{activeApplications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeApplications.map((application: any) => (
                <div
                  key={application.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            {application.job?.title || 'Job Title Not Available'}
                          </h3>
                          <p className="text-muted-foreground">
                            {application.job?.company || 'Company Not Specified'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStageIcon(application.stage)}
                          <Badge variant={getStageVariant(application.stage)}>
                            {application.stage}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Applied:</span>
                          <span className="font-medium">{formatDate(application.createdAt)}</span>
                        </div>
                        
                        {application.scheduledDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Scheduled:</span>
                            <span className="font-medium">{formatDate(application.scheduledDate)}</span>
                          </div>
                        )}
                        
                        {application.job?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{application.job.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {application.job?.salaryMin && application.job?.salaryMax && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Salary:</span>
                          <span className="font-medium">
                            {formatCurrency(application.job.salaryMin)} - {formatCurrency(application.job.salaryMax)}
                          </span>
                        </div>
                      )}
                      
                      {application.feedback && (
                        <div className="border-t pt-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-sm text-muted-foreground">Feedback:</span>
                              <p className="text-sm mt-1">{application.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" className="ml-4">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application History */}
      {completedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Application History
              <Badge variant="secondary">{completedApplications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedApplications.map((application: any) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStageIcon(application.stage)}
                      <Badge variant={getStageVariant(application.stage)}>
                        {application.stage}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{application.job?.title || 'Job Title Not Available'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {application.job?.company} • Applied {formatDate(application.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {applications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground">
              This candidate hasn't applied for any jobs yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}