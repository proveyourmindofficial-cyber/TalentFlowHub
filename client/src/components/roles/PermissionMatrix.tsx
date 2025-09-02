import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, Briefcase, FileText, Calendar, FileCheck, 
  Building2, BarChart3, Settings, Shield, UserCheck,
  Eye, Plus, Edit3, Trash2, Download, Upload, Copy
} from 'lucide-react';

// App modules with icons and descriptions
const APP_MODULES = {
  dashboard: {
    name: 'Dashboard',
    icon: BarChart3,
    description: 'Overview and analytics',
    color: '#06b6d4'
  },
  candidates: {
    name: 'Candidates',
    icon: Users,
    description: 'Candidate management',
    color: '#10b981'
  },
  jobs: {
    name: 'Jobs',
    icon: Briefcase,
    description: 'Job postings and management',
    color: '#f59e0b'
  },
  applications: {
    name: 'Applications',
    icon: FileText,
    description: 'Application tracking',
    color: '#8b5cf6'
  },
  interviews: {
    name: 'Interviews',
    icon: Calendar,
    description: 'Interview scheduling',
    color: '#ef4444'
  },
  offer_letters: {
    name: 'Offer Letters',
    icon: FileCheck,
    description: 'Offer management',
    color: '#ec4899'
  },
  clients: {
    name: 'Clients',
    icon: Building2,
    description: 'Client relationships',
    color: '#84cc16'
  },
  client_requirements: {
    name: 'Client Requirements',
    icon: FileText,
    description: 'Client needs tracking',
    color: '#f97316'
  },
  reports: {
    name: 'Reports',
    icon: BarChart3,
    description: 'Analytics and reporting',
    color: '#6b7280'
  },
  settings: {
    name: 'Settings',
    icon: Settings,
    description: 'System configuration',
    color: '#6366f1'
  },
  user_management: {
    name: 'User Management',
    icon: UserCheck,
    description: 'User administration',
    color: '#dc2626'
  },
  role_management: {
    name: 'Role Management',
    icon: Shield,
    description: 'Role and permission control',
    color: '#7c3aed'
  },
};

const PERMISSION_ACTIONS = {
  view: { name: 'View', icon: Eye, description: 'View and access' },
  add: { name: 'Add', icon: Plus, description: 'Create new items' },
  edit: { name: 'Edit', icon: Edit3, description: 'Modify existing items' },
  delete: { name: 'Delete', icon: Trash2, description: 'Remove items' },
  export: { name: 'Export', icon: Download, description: 'Export data' },
  import: { name: 'Import', icon: Upload, description: 'Import data' },
  bulk_actions: { name: 'Bulk Actions', icon: Copy, description: 'Bulk operations' },
};

interface PermissionMatrixProps {
  roleId: string;
  onUpdate: () => void;
}

export default function PermissionMatrix({ roleId, onUpdate }: PermissionMatrixProps) {
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch role permissions
  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['/api/custom-roles', roleId, 'permissions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/custom-roles/${roleId}/permissions`);
      const data = await response.json();
      const permissionMap: Record<string, any> = {};
      data.forEach((perm: any) => {
        permissionMap[perm.module] = perm.permissions;
      });
      setPermissions(permissionMap);
      return data;
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { module: string; permissions: any }) => {
      const response = await apiRequest('PUT', `/api/custom-roles/${roleId}/permissions`, data);
      return response; // Don't parse JSON for PUT operations
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-roles', roleId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
      toast({ title: 'Success', description: 'Permissions updated successfully' });
      onUpdate();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' });
    },
  });

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const modulePermissions = permissions[module] || {};
    const updatedPermissions = {
      ...modulePermissions,
      [action]: checked,
    };
    
    setPermissions(prev => ({
      ...prev,
      [module]: updatedPermissions,
    }));

    updatePermissionsMutation.mutate({
      module,
      permissions: updatedPermissions,
    });
  };

  const handleModuleToggle = (module: string, enabled: boolean) => {
    const allActions = Object.keys(PERMISSION_ACTIONS);
    const modulePermissions = allActions.reduce((acc, action) => ({
      ...acc,
      [action]: enabled,
    }), {});

    setPermissions(prev => ({
      ...prev,
      [module]: modulePermissions,
    }));

    updatePermissionsMutation.mutate({
      module,
      permissions: modulePermissions,
    });
  };

  const getModulePermissionCount = (module: string) => {
    const modulePermissions = permissions[module] || {};
    return Object.values(modulePermissions).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(APP_MODULES).map(([moduleKey, moduleInfo]) => {
        const IconComponent = moduleInfo.icon;
        const permissionCount = getModulePermissionCount(moduleKey);
        const totalActions = Object.keys(PERMISSION_ACTIONS).length;
        const isFullAccess = permissionCount === totalActions;
        const hasPartialAccess = permissionCount > 0 && permissionCount < totalActions;

        return (
          <Card 
            key={moduleKey} 
            className="rounded-3xl border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${moduleInfo.color}20` }}
                  >
                    <IconComponent 
                      className="h-6 w-6" 
                      style={{ color: moduleInfo.color }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {moduleInfo.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{moduleInfo.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={isFullAccess ? "default" : hasPartialAccess ? "secondary" : "outline"}
                    className="rounded-full"
                  >
                    {permissionCount}/{totalActions} permissions
                  </Badge>
                  <Switch
                    checked={isFullAccess}
                    onCheckedChange={(checked) => handleModuleToggle(moduleKey, checked)}
                    data-testid={`switch-module-${moduleKey}`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(PERMISSION_ACTIONS).map(([actionKey, actionInfo]) => {
                  const ActionIcon = actionInfo.icon;
                  const isChecked = permissions[moduleKey]?.[actionKey] || false;
                  
                  return (
                    <div
                      key={actionKey}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handlePermissionChange(moduleKey, actionKey, !isChecked)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(moduleKey, actionKey, checked as boolean)
                          }
                          className="rounded-lg"
                          data-testid={`checkbox-${moduleKey}-${actionKey}`}
                        />
                        <ActionIcon className="h-5 w-5 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700 text-center">
                          {actionInfo.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}