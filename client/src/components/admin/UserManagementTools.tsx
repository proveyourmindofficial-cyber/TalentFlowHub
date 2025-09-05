import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail,
  Eye,
  MoreHorizontal,
  AlertCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  loginCount: number;
  currentSession?: UserSession;
  recentActivity: ActivitySummary[];
}

interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastActivity: string;
  isActive: boolean;
}

interface ActivitySummary {
  action: string;
  timestamp: string;
  resourceType: string;
  success: boolean;
}

export function UserManagementTools() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const queryClient = useQueryClient();

  // Fetch users list
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/users', roleFilter, statusFilter, searchTerm],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user details
  const { data: userDetails } = useQuery({
    queryKey: ['/api/admin/users', selectedUser?.id],
    enabled: !!selectedUser && showUserDetails,
  });

  // User management mutations
  const activateUser = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}/activate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const deactivateUser = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}/deactivate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const resendInvitation = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}/resend-invitation`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const terminateSession = useMutation({
    mutationFn: (sessionId: string) => 
      fetch(`/api/admin/sessions/${sessionId}/terminate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      director: 'bg-purple-100 text-purple-800',
      'account manager': 'bg-blue-100 text-blue-800',
      recruiter: 'bg-green-100 text-green-800',
      hr: 'bg-orange-100 text-orange-800',
      candidate: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (user: User, action: string) => {
    switch (action) {
      case 'activate':
        activateUser.mutate(user.id);
        break;
      case 'deactivate':
        deactivateUser.mutate(user.id);
        break;
      case 'resend':
        resendInvitation.mutate(user.id);
        break;
      case 'details':
        setSelectedUser(user);
        setShowUserDetails(true);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Monitor user sessions, manage access, and support user issues
          </p>
        </div>
        
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="account manager">Account Manager</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground self-center">
              Total: {filteredUsers?.length || 0} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers?.length || 0})
          </CardTitle>
          <CardDescription>
            Manage user accounts, sessions, and access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading users...
                </div>
              ) : filteredUsers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria
                </div>
              ) : (
                filteredUsers?.map((user: User) => (
                  <div key={user.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {user.currentSession?.isActive ? (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <UserX className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="font-medium">{user.name}</span>
                          </div>
                          {getStatusBadge(user.status)}
                          {getRoleBadge(user.role)}
                        </div>

                        <p className="text-sm text-muted-foreground">{user.email}</p>

                        {/* Session Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                          <span>Login count: {user.loginCount}</span>
                          {user.currentSession?.isActive && (
                            <>
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {user.currentSession.ipAddress}
                              </span>
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(user.currentSession.userAgent)}
                                Active session
                              </span>
                            </>
                          )}
                        </div>

                        {/* Recent Activity */}
                        {user.recentActivity && user.recentActivity.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Recent:</span>
                            <div className="flex gap-1">
                              {user.recentActivity.slice(0, 3).map((activity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {activity.action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUserAction(user, 'details')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>

                        {user.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user, 'resend')}
                            disabled={resendInvitation.isPending}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        )}

                        {user.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user, 'deactivate')}
                            disabled={deactivateUser.isPending}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user, 'activate')}
                            disabled={activateUser.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}

                        {user.currentSession?.isActive && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => terminateSession.mutate(user.currentSession!.id)}
                            disabled={terminateSession.isPending}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            End Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Details: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive user information and activity history
            </DialogDescription>
          </DialogHeader>
          
          {userDetails && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{userDetails.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role:</span>
                        {getRoleBadge(userDetails.role)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(userDetails.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(userDetails.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Session Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Login:</span>
                        <span>{new Date(userDetails.lastLogin).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Login Count:</span>
                        <span>{userDetails.loginCount}</span>
                      </div>
                      {userDetails.currentSession && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current IP:</span>
                            <span>{userDetails.currentSession.ipAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Session Started:</span>
                            <span>{new Date(userDetails.currentSession.startedAt).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {userDetails.recentActivity?.map((activity: ActivitySummary, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant={activity.success ? 'default' : 'destructive'}>
                            {activity.action}
                          </Badge>
                          <span className="text-sm">{activity.resourceType}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </div>

                {/* User Agent Details */}
                {userDetails.currentSession?.userAgent && (
                  <div>
                    <h4 className="font-medium mb-2">Browser Information</h4>
                    <p className="text-sm text-muted-foreground break-all p-2 bg-muted rounded">
                      {userDetails.currentSession.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}