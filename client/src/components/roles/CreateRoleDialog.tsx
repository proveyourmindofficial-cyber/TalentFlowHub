import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Palette } from 'lucide-react';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#6366f1'),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

interface CreateRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6b7280'
];

export default function CreateRoleDialog({ isOpen, onClose, onSuccess }: CreateRoleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleFormData) => apiRequest('POST', '/api/custom-roles', data),
    onSuccess: () => {
      // Invalidate the query cache to refresh the roles list
      queryClient.invalidateQueries({ queryKey: ['/api/custom-roles'] });
      toast({ title: 'Success', description: 'Role created successfully' });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create role', variant: 'destructive' });
    },
  });

  const handleSubmit = (data: CreateRoleFormData) => {
    createRoleMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Custom Role
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Define a new role with specific permissions for your team members
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Role Name *
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g., Senior Recruiter, Client Manager"
              className="mt-1 h-12 rounded-2xl border-gray-200"
              data-testid="input-role-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Brief description of this role's responsibilities"
              className="mt-1 rounded-2xl border-gray-200 resize-none"
              rows={3}
              data-testid="textarea-role-description"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Role Color
            </Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  {...form.register('color')}
                  className="w-12 h-12 rounded-xl border-gray-200 p-1"
                  data-testid="input-role-color"
                />
                <span className="text-sm text-gray-500">
                  Choose a color to identify this role
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => form.setValue('color', color)}
                    className={`w-8 h-8 rounded-xl border-2 transition-all ${
                      form.watch('color') === color 
                        ? 'border-gray-400 scale-110' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`color-preset-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 py-2 rounded-2xl"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending}
              className="px-6 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-create"
            >
              {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}