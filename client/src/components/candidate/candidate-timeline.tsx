import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timeline, Clock, FileText, User, Mail, Phone, Calendar } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "document_upload" | "status_change" | "email_sent" | "interview_scheduled" | "note_added";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

interface CandidateTimelineProps {
  candidateId: string;
  events: TimelineEvent[];
}

const EVENT_ICONS = {
  document_upload: FileText,
  status_change: User,
  email_sent: Mail,
  interview_scheduled: Calendar,
  note_added: FileText,
};

const EVENT_COLORS = {
  document_upload: "bg-blue-100 text-blue-800",
  status_change: "bg-green-100 text-green-800",
  email_sent: "bg-purple-100 text-purple-800",
  interview_scheduled: "bg-orange-100 text-orange-800",
  note_added: "bg-gray-100 text-gray-800",
};

export function CandidateTimeline({ candidateId, events }: CandidateTimelineProps) {
  const sortedEvents = events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timeline className="h-5 w-5" />
          Candidate Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => {
              const IconComponent = EVENT_ICONS[event.type];
              const colorClass = EVENT_COLORS[event.type];
              
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    {index < sortedEvents.length - 1 && (
                      <div className="w-px h-12 bg-border mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                    
                    {event.user && (
                      <Badge variant="outline" className="text-xs">
                        by {event.user}
                      </Badge>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}