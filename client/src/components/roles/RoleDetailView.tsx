import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Settings, Edit3 } from 'lucide-react';
import PermissionMatrix from './PermissionMatrix';

interface RoleDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  role: any;
  onSuccess: () => void;
}

export default function RoleDetailView({ isOpen, onClose, role, onSuccess }: RoleDetailViewProps) {
  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${role.color}20` }}
              >
                <Shield 
                  className="h-6 w-6" 
                  style={{ color: role.color }}
                />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-gray-900">
                  {role.name}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 mt-1">
                  {role.description || 'Custom role with specific permissions'}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline" 
              className="rounded-2xl"
              data-testid="button-edit-role"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Role
            </Button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">Users Assigned:</span>
              <Badge variant="secondary" className="rounded-full">
                {role.userCount || 0}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">Status:</span>
              <Badge variant={role.isActive ? "default" : "secondary"} className="rounded-full">
                {role.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Permission Matrix</h3>
            <PermissionMatrix roleId={role.id} onUpdate={onSuccess} />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            onClick={onClose}
            className="px-6 py-2 rounded-2xl"
            data-testid="button-close"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}