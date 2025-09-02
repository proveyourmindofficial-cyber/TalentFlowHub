import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function UpcomingInterviews() {
  const { data: todayInterviews = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/today-interviews'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="animate-fade-in" data-testid="upcoming-interviews">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Interviews</CardTitle>
          <Button variant="link" className="text-primary text-sm p-0" data-testid="button-view-calendar">
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {todayInterviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500" data-testid="text-no-interviews">No interviews scheduled for today</p>
              </div>
            ) : (
              todayInterviews.map((interview) => (
                <div 
                  key={interview.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  data-testid={`interview-item-${interview.id}`}
                >
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="text-gray-600 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900" data-testid={`interview-candidate-${interview.id}`}>
                      {interview.candidateName}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`interview-position-${interview.id}`}>
                      {interview.position}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900" data-testid={`interview-time-${interview.id}`}>
                      {interview.time}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`interview-duration-${interview.id}`}>
                      {interview.duration}
                    </p>
                  </div>
                </div>
              ))
            )}
          
            {todayInterviews.length > 0 && (
              <div className="text-center pt-2">
                <Button variant="link" className="text-primary text-sm" data-testid="button-view-all-interviews">
                  View All Interviews
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}