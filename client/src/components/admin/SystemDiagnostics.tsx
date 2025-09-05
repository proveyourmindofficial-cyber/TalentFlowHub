import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database, 
  Server, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  database: {
    status: 'connected' | 'slow' | 'disconnected';
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
  server: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    load: number[];
  };
  errors: {
    last24h: number;
    lastHour: number;
    trend: 'up' | 'down' | 'stable';
  };
  performance: {
    avgResponseTime: number;
    slowQueries: number;
    cacheHitRate: number;
  };
}

interface ErrorLog {
  id: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'critical';
  message: string;
  component: string;
  count: number;
  userAffected?: string;
}

export function SystemDiagnostics() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system metrics
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/system/metrics'],
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  // Fetch recent errors
  const { data: errors } = useQuery({
    queryKey: ['/api/admin/system/errors'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">System Diagnostics</h2>
          <p className="text-muted-foreground">
            Monitor system health, performance, and error tracking
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-green-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(metrics?.status || 'healthy')}
              <div>
                <p className="text-sm font-medium">System Status</p>
                <p className={`text-lg font-bold capitalize ${getStatusColor(metrics?.status || 'healthy')}`}>
                  {metrics?.status || 'Healthy'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-lg font-bold">
                  {metrics?.database?.connections || 0}/{metrics?.database?.maxConnections || 100}
                </p>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Response Time</p>
                <p className="text-lg font-bold">{metrics?.responseTime || 0}ms</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-lg font-bold">{metrics?.uptime || '99.9%'}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Resources
            </CardTitle>
            <CardDescription>Real-time server resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics?.server?.cpuUsage || 0}%</span>
              </div>
              <Progress 
                value={metrics?.server?.cpuUsage || 0} 
                className="h-2"
              />
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics?.server?.memoryUsage || 0}%</span>
              </div>
              <Progress 
                value={metrics?.server?.memoryUsage || 0} 
                className="h-2"
              />
            </div>

            {/* Disk Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics?.server?.diskUsage || 0}%</span>
              </div>
              <Progress 
                value={metrics?.server?.diskUsage || 0} 
                className="h-2"
              />
            </div>

            {/* Load Average */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Load Average</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span>1m: {metrics?.server?.load?.[0]?.toFixed(2) || '0.00'}</span>
                <span>5m: {metrics?.server?.load?.[1]?.toFixed(2) || '0.00'}</span>
                <span>15m: {metrics?.server?.load?.[2]?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Application performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Average Response Time */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Avg Response Time</p>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{metrics?.performance?.avgResponseTime || 0}ms</p>
              </div>
            </div>

            {/* Slow Queries */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Slow Queries</p>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{metrics?.performance?.slowQueries || 0}</p>
              </div>
            </div>

            {/* Cache Hit Rate */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Cache Hit Rate</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{metrics?.performance?.cacheHitRate || 0}%</p>
              </div>
            </div>

            {/* Error Rate */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium">Error Rate</p>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </div>
                {getTrendIcon(metrics?.errors?.trend || 'stable')}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{metrics?.errors?.last24h || 0}</p>
                <p className="text-xs text-muted-foreground">{metrics?.errors?.lastHour || 0} in last hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent System Errors
          </CardTitle>
          <CardDescription>Latest system errors and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {errors?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No recent errors detected</p>
                  <p className="text-sm">System is running smoothly</p>
                </div>
              ) : (
                errors?.map((error: ErrorLog) => (
                  <div key={error.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {error.severity === 'critical' && <XCircle className="h-4 w-4 text-red-500" />}
                      {error.severity === 'error' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      {error.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={error.severity === 'critical' ? 'destructive' : 'outline'}>
                              {error.severity}
                            </Badge>
                            <span className="text-sm font-medium">{error.component}</span>
                            {error.count > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {error.count}x
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{error.message}</p>
                          {error.userAffected && (
                            <p className="text-xs text-blue-600">User affected: {error.userAffected}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}