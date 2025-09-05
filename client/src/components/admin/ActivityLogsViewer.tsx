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
  Activity, 
  Calendar, 
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  category: string;
  severity: 'info' | 'warning' | 'error';
  metadata?: any;
  errorMessage?: string;
  userFlow?: string;
  tags?: string[];
}

export function ActivityLogsViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch activity logs with filters
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: [
      '/api/admin/activity-logs', 
      searchTerm, 
      actionFilter, 
      severityFilter, 
      userFilter, 
      dateRange
    ],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if enabled
  });

  // Fetch unique users for filter
  const { data: users } = useQuery({
    queryKey: ['/api/admin/activity-logs/users'],
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge className="bg-green-100 text-green-800">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const filteredLogs = logs?.filter((log: ActivityLog) => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesUser = userFilter === 'all' || log.userId === userFilter;
    
    return matchesSearch && matchesAction && matchesSeverity && matchesUser;
  });

  const handleExport = () => {
    // Implementation for exporting logs
    console.log('Exporting logs...', filteredLogs);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Activity Logs</h2>
          <p className="text-muted-foreground">
            Monitor all user activities and system events in real-time
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
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="email_sent">Email Sent</SelectItem>
                <SelectItem value="page_view">Page View</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Feed ({filteredLogs?.length || 0})
              </CardTitle>
              <CardDescription>
                Click on an activity to view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px]">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading activities...
                    </div>
                  ) : filteredLogs?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No activities found matching your criteria
                    </div>
                  ) : (
                    filteredLogs?.map((log: ActivityLog) => (
                      <div
                        key={log.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedLog?.id === log.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-1">
                            {getSeverityIcon(log.severity)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{log.action}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {log.resourceType}
                                  </Badge>
                                  {getSeverityBadge(log.severity)}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {log.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {log.userEmail}
                                  </span>
                                  {log.ipAddress && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {log.ipAddress}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    {getDeviceIcon(log.userAgent)}
                                    Device
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-right text-xs text-muted-foreground ml-2">
                                <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                              </div>
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
        </div>

        {/* Activity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Activity Details
            </CardTitle>
            <CardDescription>
              Detailed information about the selected activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedLog ? (
              <div className="text-center py-20 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an activity from the list to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(selectedLog.severity)}
                    <h3 className="font-medium">{selectedLog.action}</h3>
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User:</span>
                      <span>{selectedLog.userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resource:</span>
                      <span>{selectedLog.resourceType}</span>
                    </div>
                    {selectedLog.resourceName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resource Name:</span>
                        <span className="text-right">{selectedLog.resourceName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success:</span>
                      <span>{selectedLog.success ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedLog.ipAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address:</span>
                        <span>{selectedLog.ipAddress}</span>
                      </div>
                    )}
                    {selectedLog.userFlow && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User Flow:</span>
                        <span>{selectedLog.userFlow}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-600">Error Message</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedLog.tags && selectedLog.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedLog.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.userAgent && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">User Agent</h4>
                    <p className="text-xs text-muted-foreground break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}

                {/* Raw Metadata */}
                {selectedLog.metadata && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Raw Metadata</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}