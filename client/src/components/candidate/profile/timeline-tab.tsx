import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  UserPlus, 
  FileText, 
  Briefcase, 
  Calendar,
  MessageSquare,
  Award,
  Edit,
  Mail,
  Phone,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface CandidateTimelineTabProps {
  candidateId: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'candidate_created':
      return <UserPlus className="w-4 h-4" />;
    case 'application_submitted':
      return <Briefcase className="w-4 h-4" />;
    case 'interview_scheduled':
      return <Calendar className="w-4 h-4" />;
    case 'feedback_added':
      return <MessageSquare className="w-4 h-4" />;
    case 'document_uploaded':
      return <FileText className="w-4 h-4" />;
    case 'skill_added':
      return <Award className="w-4 h-4" />;
    case 'profile_updated':
      return <Edit className="w-4 h-4" />;
    case 'email_sent':
      return <Mail className="w-4 h-4" />;
    case 'status_changed':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'candidate_created':
      return 'bg-green-100 text-green-800';
    case 'application_submitted':
      return 'bg-blue-100 text-blue-800';
    case 'interview_scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'feedback_added':
      return 'bg-orange-100 text-orange-800';
    case 'document_uploaded':
      return 'bg-indigo-100 text-indigo-800';
    case 'skill_added':
      return 'bg-yellow-100 text-yellow-800';
    case 'profile_updated':
      return 'bg-gray-100 text-gray-800';
    case 'email_sent':
      return 'bg-cyan-100 text-cyan-800';
    case 'status_changed':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "MMM dd, yyyy 'at' hh:mm a");
  } catch {
    return "—";
  }
};

export function CandidateTimelineTab({ candidateId }: CandidateTimelineTabProps) {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['/api/candidates', candidateId, 'timeline'],
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  // Group timeline events by date
  const groupedTimeline = timeline.reduce((acc: any, event: any) => {
    const date = format(new Date(event.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const timelineStats = {
    totalEvents: timeline.length,
    applications: timeline.filter((event: any) => event.type === 'application_submitted').length,
    interviews: timeline.filter((event: any) => event.type === 'interview_scheduled').length,
    documents: timeline.filter((event: any) => event.type === 'document_uploaded').length,
  };

  return (
    <div className="space-y-6">
      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Events</span>
              <Badge variant="outline">{timelineStats.totalEvents}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Applications</span>
              <Badge variant="default">{timelineStats.applications}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interviews</span>
              <Badge variant="secondary">{timelineStats.interviews}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documents</span>
              <Badge variant="outline">{timelineStats.documents}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedTimeline).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedTimeline)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, events]: [string, any]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <h3 className="font-semibold text-sm">
                        {format(new Date(date), "EEEE, MMMM dd, yyyy")}
                      </h3>
                    </div>
                    
                    <div className="ml-4 space-y-3">
                      {events.map((event: any) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className={`p-2 rounded-full ${getActivityColor(event.type)}`}>
                            {getActivityIcon(event.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.createdAt)}
                              </span>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                            
                            {event.metadata && (
                              <div className="mt-2 flex items-center gap-2">
                                {event.metadata.jobTitle && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.metadata.jobTitle}
                                  </Badge>
                                )}
                                {event.metadata.stage && (
                                  <Badge variant="secondary" className="text-xs">
                                    {event.metadata.stage}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Timeline will show candidate's journey and activities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <div className={`p-1.5 rounded-full ${getActivityColor(event.type)}`}>
                    {getActivityIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}