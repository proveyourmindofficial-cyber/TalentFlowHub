import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, Briefcase, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const iconMap = {
  User,
  CheckCircle,
  Briefcase,
  Calendar,
};

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-activity'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="animate-fade-in" data-testid="recent-activity">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="link" className="text-primary text-sm p-0" data-testid="button-view-all-activity">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500" data-testid="text-no-activity">No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => {
                const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || User;
                return (
                  <div 
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center mt-1`}>
                      <IconComponent className={`${activity.iconColor} w-4 h-4`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900" data-testid={`activity-title-${activity.id}`}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1" data-testid={`activity-time-${activity.id}`}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
