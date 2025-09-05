import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Signal, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users,
  Activity
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: 'connected' | 'slow' | 'disconnected';
  responseTime: number;
  uptime: string;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface OverviewStats {
  activeUsers: number;
  activitiesTotal: number;
  errorRate: number;
  onlineUsersNow: number;
  averageSessionTime: string;
}

interface Props {
  systemHealth?: SystemHealth;
  overviewStats?: OverviewStats;
}

export function RealTimeMetrics({ systemHealth, overviewStats }: Props) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
          {/* System Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(systemHealth?.status || 'healthy')}
              <span className="text-sm font-medium">System</span>
            </div>
            <Badge 
              variant="outline" 
              className={getStatusColor(systemHealth?.status || 'healthy')}
            >
              {systemHealth?.status || 'Healthy'}
            </Badge>
          </div>

          {/* Database Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Signal className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <Badge 
              variant="outline"
              className={systemHealth?.database === 'connected' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
            >
              {systemHealth?.database || 'Connected'}
            </Badge>
          </div>

          {/* Response Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <div className="text-sm">
              <span className="font-medium">{systemHealth?.responseTime || 0}ms</span>
              <div className="text-xs text-muted-foreground">Response</div>
            </div>
          </div>

          {/* Online Users */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <div className="text-sm">
              <span className="font-medium">{overviewStats?.onlineUsersNow || 0}</span>
              <div className="text-xs text-muted-foreground">Online Now</div>
            </div>
          </div>

          {/* Activity Rate */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <div className="text-sm">
              <span className="font-medium">{overviewStats?.activitiesTotal || 0}</span>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
          </div>

          {/* Uptime */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-indigo-500" />
            <div className="text-sm">
              <span className="font-medium">{systemHealth?.uptime || '99.9%'}</span>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>

        {/* Additional Metrics Row */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Usage:</span>
              <span className="font-medium">{systemHealth?.memoryUsage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU Usage:</span>
              <span className="font-medium">{systemHealth?.cpuUsage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Connections:</span>
              <span className="font-medium">{systemHealth?.activeConnections || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Session Time:</span>
              <span className="font-medium">{overviewStats?.averageSessionTime || '0m'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}