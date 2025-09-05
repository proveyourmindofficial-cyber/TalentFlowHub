import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Search, Activity, User, Mail, Settings, Database, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceName?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
    case 'logout':
      return <User className="w-4 h-4" />;
    case 'email_sent':
      return <Mail className="w-4 h-4" />;
    case 'create':
    case 'update':
    case 'delete':
      return <Database className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getActionColor = (action: string, success: boolean) => {
  if (!success) return "bg-red-100 text-red-800 border-red-200";
  
  switch (action.toLowerCase()) {
    case 'login':
      return "bg-green-100 text-green-800 border-green-200";
    case 'logout':
      return "bg-gray-100 text-gray-800 border-gray-200";
    case 'email_sent':
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 'create':
      return "bg-purple-100 text-purple-800 border-purple-200";
    case 'update':
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 'delete':
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7"); // days

  // Fetch activity logs
  const { data: activityLogs, isLoading, error } = useQuery({
    queryKey: ['/api/activity-logs', searchQuery, actionFilter, resourceFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (resourceFilter !== 'all') params.set('resource', resourceFilter);
      if (dateRange) params.set('days', dateRange);
      
      const url = `/api/activity-logs${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time monitoring
  });

  const filteredLogs = (activityLogs as ActivityLog[])?.filter(log => {
    const matchesSearch = !searchQuery || 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resourceType === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  }) || [];

  const handleExport = () => {
    if (!filteredLogs?.length) return;
    
    const csv = [
      ["Timestamp", "User", "Action", "Resource Type", "Resource", "Description", "IP Address", "Success"].join(","),
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.user?.username || "Unknown",
        log.action,
        log.resourceType,
        log.resourceName || log.resourceId || "",
        `"${log.description.replace(/"/g, '""')}"`,
        log.ipAddress || "",
        log.success ? "Yes" : "No"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Error Loading Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load activity logs. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          Monitor user actions, system events, and security-related activities across the platform.
          Real-time tracking of logins, data modifications, and administrative actions.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-logs"
              />
            </div>
            
            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40" data-testid="select-action-filter">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="email_sent">Email Sent</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Resource Filter */}
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-40" data-testid="select-resource-filter">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="candidate">Candidates</SelectItem>
                <SelectItem value="application">Applications</SelectItem>
                <SelectItem value="interview">Interviews</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" data-testid="select-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Button */}
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
            disabled={!filteredLogs?.length}
            data-testid="button-export-logs"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{filteredLogs?.length || 0}</div>
            <div className="text-sm text-blue-600">Total Activities</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">
              {filteredLogs?.filter(log => log.success).length || 0}
            </div>
            <div className="text-sm text-green-600">Successful</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">
              {filteredLogs?.filter(log => !log.success).length || 0}
            </div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {new Set(filteredLogs?.map(log => log.userId)).size || 0}
            </div>
            <div className="text-sm text-purple-600">Unique Users</div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading activity logs...</p>
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No activity logs found</p>
              <p className="text-sm text-gray-400">
                {searchQuery || actionFilter !== "all" || resourceFilter !== "all" 
                  ? "Try adjusting your filters or search terms"
                  : "Activity logs will appear here as users interact with the system"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      !log.success && "bg-red-50 hover:bg-red-100"
                    )}
                    data-testid={`log-row-${log.id}`}
                  >
                    <TableCell className="font-mono text-sm">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{log.user?.username || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{log.user?.email}</div>
                          <Badge variant="outline" className="text-xs">
                            {log.user?.role || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn("flex items-center gap-1", getActionColor(log.action, log.success))}
                        variant="outline"
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium capitalize">{log.resourceType}</div>
                        {log.resourceName && (
                          <div className="text-sm text-gray-600">{log.resourceName}</div>
                        )}
                        {log.resourceId && (
                          <div className="text-xs text-gray-400 font-mono">ID: {log.resourceId}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-gray-700 line-clamp-2">{log.description}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || "N/A"}
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}