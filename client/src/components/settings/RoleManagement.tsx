import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Shield, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('GET', '/api/roles'),
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: () => apiRequest('GET', '/api/permissions'),
  });

  // Fetch role permissions
  const { data: rolePermissions } = useQuery({
    queryKey: ['/api/roles', selectedRole?.id, 'permissions'],
    queryFn: () => apiRequest('GET', `/api/roles/${selectedRole?.id}/permissions`),
    enabled: !!selectedRole?.id,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormData) => apiRequest('POST', '/api/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Success', description: 'Role created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create role', variant: 'destructive' });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleFormData }) => 
      apiRequest('PUT', `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setIsEditDialogOpen(false);
      toast({ title: 'Success', description: 'Role updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({ title: 'Success', description: 'Role deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      apiRequest('PUT', `/api/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles', selectedRole?.id, 'permissions'] });
      toast({ title: 'Success', description: 'Permissions updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' });
    },
  });

  const createForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const handleCreateRole = (data: RoleFormData) => {
    createRoleMutation.mutate(data);
  };

  const handleUpdateRole = (data: RoleFormData) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data });
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystemRole) {
      toast({ title: 'Error', description: 'Cannot delete system roles', variant: 'destructive' });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    editForm.reset({
      name: role.name,
      description: role.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!selectedRole || !rolePermissions) return;

    const currentPermissionIds = rolePermissions.map((p: Permission) => p.id);
    const newPermissionIds = checked 
      ? [...currentPermissionIds, permissionId]
      : currentPermissionIds.filter(id => id !== permissionId);

    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: newPermissionIds,
    });
  };

  // Group permissions by module
  const groupedPermissions = permissions?.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {}) || {};

  const rolePermissionIds = rolePermissions?.map((p: Permission) => p.id) || [];

  if (rolesLoading || permissionsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage custom roles with granular permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-create-role">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a custom role with specific permissions for your organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreateRole)} className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  {...createForm.register('name')}
                  placeholder="e.g., Senior Recruiter"
                  data-testid="input-role-name"
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...createForm.register('description')}
                  placeholder="Brief description of this role's responsibilities"
                  data-testid="textarea-role-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  data-testid="button-save-role"
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map((role: Role) => (
          <Card key={role.id} className="relative" data-testid={`card-role-${role.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {role.name}
                  {role.isSystemRole && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {role.description && (
                <CardDescription className="text-sm">
                  {role.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Created: {new Date(role.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagePermissions(role)}
                    data-testid={`button-manage-permissions-${role.id}`}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                    data-testid={`button-edit-role-${role.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!role.isSystemRole && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRole(role)}
                      data-testid={`button-delete-role-${role.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role name and description
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdateRole)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                data-testid="input-edit-role-name"
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register('description')}
                data-testid="textarea-edit-role-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateRoleMutation.isPending}
                data-testid="button-update-role"
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Configure what actions this role can perform in each module
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <Card key={module}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">
                    {module.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {modulePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={rolePermissionIds.includes(permission.id)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.id, checked as boolean)
                          }
                          disabled={updatePermissionsMutation.isPending}
                          data-testid={`checkbox-permission-${permission.id}`}
                        />
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {permission.action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setIsPermissionsDialogOpen(false)}
              data-testid="button-close-permissions"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}