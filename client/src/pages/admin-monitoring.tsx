import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Users, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Components
import { UserJourneyVisualization } from '@/components/admin/UserJourneyVisualization';
import { ActivityLogsViewer } from '@/components/admin/ActivityLogsViewer';
import { SystemDiagnostics } from '@/components/admin/SystemDiagnostics';
import { UserManagementTools } from '@/components/admin/UserManagementTools';
import { FeedbackManagement } from '@/components/admin/FeedbackManagement';
import { RealTimeMetrics } from '@/components/admin/RealTimeMetrics';

export default function AdminMonitoring() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch overview stats
  const { data: overviewStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/monitoring/overview'],
    refetchInterval: refreshInterval,
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['/api/admin/monitoring/health'],
    refetchInterval: 10000, // 10 seconds for health checks
  });

  const handleRefresh = () => {
    refetchStats();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-8 w-8 text-blue-600" />
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time user journey tracking and system diagnostics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      <RealTimeMetrics systemHealth={systemHealth} overviewStats={overviewStats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="journeys" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Journeys
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{overviewStats?.newUsersToday || 0} today
                </p>
              </CardContent>
            </Card>

            {/* Total Activities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activities Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats?.activitiesTotal || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats?.activitiesGrowth > 0 ? '+' : ''}{overviewStats?.activitiesGrowth || 0}% from yesterday
                </p>
              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overviewStats?.errorRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats?.errorCount || 0} errors today
                </p>
              </CardContent>
            </Card>

            {/* Pending Feedback */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats?.pendingFeedback || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats?.urgentFeedback || 0} urgent items
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                Latest user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overviewStats?.recentActivities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={activity.success ? 'default' : 'destructive'}>
                        {activity.action}
                      </Badge>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.userEmail} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{activity.resourceType}</Badge>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity to display
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Journeys Tab */}
        <TabsContent value="journeys">
          <UserJourneyVisualization />
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity">
          <ActivityLogsViewer />
        </TabsContent>

        {/* System Diagnostics Tab */}
        <TabsContent value="diagnostics">
          <SystemDiagnostics />
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <UserManagementTools />
        </TabsContent>

        {/* Feedback Management Tab */}
        <TabsContent value="feedback">
          <FeedbackManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}