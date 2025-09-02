import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Settings, Shield, Search, Edit3, Trash2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import CreateRoleDialog from './CreateRoleDialog';
import RoleDetailView from './RoleDetailView';
import PermissionMatrix from './PermissionMatrix';

// Gen-Z Modern Design with Gradients and Clean Layout
export default function RoleManagementHub() {
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch custom roles with user counts and permission counts
  const { data: roles, isLoading } = useQuery({
    queryKey: ['/api/custom-roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/custom-roles');
      const rolesData = await response.json();
      
      // Fetch permission count for each role
      const rolesWithPermissionCounts = await Promise.all(
        rolesData.map(async (role: any) => {
          try {
            const permResponse = await apiRequest('GET', `/api/custom-roles/${role.id}/permissions`);
            const permissions = await permResponse.json();
            
            // Count total permissions
            const totalPermissions = permissions.reduce((total: number, perm: any) => {
              return total + Object.values(perm.permissions).filter(Boolean).length;
            }, 0);
            
            return { ...role, permissionCount: totalPermissions };
          } catch (error) {
            return { ...role, permissionCount: 0 };
          }
        })
      );
      
      return rolesWithPermissionCounts;
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiRequest('DELETE', `/api/custom-roles/${roleId}`);
      return response; // Don't parse JSON for DELETE operations
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
      toast({ title: 'Success', description: 'Role deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
    },
  });

  const duplicateRoleMutation = useMutation({
    mutationFn: async (role: any) => {
      const response = await apiRequest('POST', '/api/custom-roles', {
        name: `${role.name} (Copy)`,
        description: `Copy of ${role.description || role.name}`,
        color: role.color,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
      toast({ title: 'Success', description: 'Role duplicated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to duplicate role', variant: 'destructive' });
    },
  });

  const handleDeleteRole = (role: any) => {
    if (role.userCount > 0) {
      toast({
        title: 'Cannot Delete',
        description: 'This role is assigned to users. Remove all users first.',
        variant: 'destructive',
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleDuplicateRole = (role: any) => {
    duplicateRoleMutation.mutate(role);
  };

  const handleRoleDetail = (role: any) => {
    setSelectedRole(role);
    setIsDetailViewOpen(true);
  };

  // Process roles data
  const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  
  const filteredRoles = rolesArray.filter((role: any) =>
    role && role.name && (
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header Section - Gen-Z Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10"></div>
        <div className="relative p-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Roles & Permissions
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Create custom roles and manage granular permissions like Zoho Creator
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="px-4 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  {roles?.length || 0} Custom Roles
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  12 Modules Protected
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-create-role"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Role
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm"
          data-testid="input-search-roles"
        />
      </div>

      {/* Roles Grid - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role: any) => (
          <Card
            key={role.id}
            className="group hover:shadow-2xl transition-all duration-300 border-0 rounded-3xl bg-white/80 backdrop-blur-sm overflow-hidden"
            data-testid={`card-role-${role.id}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: role.color || '#6366f1' }}
                ></div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRoleDetail(role)}
                    className="h-8 w-8 p-0 rounded-xl"
                    data-testid={`button-view-role-${role.id}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicateRole(role)}
                    className="h-8 w-8 p-0 rounded-xl"
                    data-testid={`button-duplicate-role-${role.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRole(role)}
                    className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-700"
                    data-testid={`button-delete-role-${role.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {role.name}
              </CardTitle>
              {role.description && (
                <CardDescription className="text-gray-600 line-clamp-2">
                  {role.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Users Assigned</span>
                  <Badge 
                    variant={parseInt(role.userCount) > 0 ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {role.userCount || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Permissions</span>
                  <Badge 
                    variant={parseInt(role.permissionCount) > 0 ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {role.permissionCount || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge variant={role.isActive ? "default" : "secondary"} className="rounded-full">
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleRoleDetail(role)}
                  className="w-full mt-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-0"
                  data-testid={`button-manage-permissions-${role.id}`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'No roles found' : 'No custom roles yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms or create a new role.'
              : 'Create your first custom role to get started with granular permission management.'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Role
            </Button>
          )}
        </div>
      )}

      {/* Create Role Dialog */}
      <CreateRoleDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
        }}
      />

      {/* Role Detail View */}
      <RoleDetailView
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        role={selectedRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
        }}
      />
    </div>
  );
}