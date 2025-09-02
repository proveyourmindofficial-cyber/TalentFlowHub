import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { 
  Briefcase, 
  Users, 
  FileText, 
  Calendar, 
  Award,
  Settings,
  Edit2,
  Power,
  PowerOff,
  PlayCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const moduleIcons = {
  jobs: Briefcase,
  candidates: Users,
  applications: FileText,
  interviews: Calendar,
  offers: Award
};

const templateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'Content is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function EmailTemplatesSimple() {
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch module templates
  const { data: modules = {}, isLoading, refetch } = useQuery({
    queryKey: ['/api/module-templates'],
  });

  // Form for template editing
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      subject: '',
      htmlContent: '',
    },
  });

  // Initialize template mutation
  const initializeMutation = useMutation({
    mutationFn: async (stageKey: string) => {
      return apiRequest('POST', `/api/module-templates/stages/${stageKey}/initialize`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/module-templates'] });
      toast({ title: 'Success', description: 'Default template initialized successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle template mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ stageKey, isActive }: { stageKey: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/module-templates/stages/${stageKey}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/module-templates'] });
      toast({ title: 'Success', description: 'Template status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ stageKey, data }: { stageKey: string; data: TemplateFormData }) => {
      return apiRequest('PUT', `/api/module-templates/stages/${stageKey}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/module-templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({ title: 'Success', description: 'Template updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Initialize all defaults mutation
  const initAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/module-templates/initialize-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/module-templates'] });
      toast({ title: 'Success', description: 'All default templates initialized successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Handle edit template
  const handleEditTemplate = async (stageKey: string) => {
    try {
      const template = await apiRequest('GET', `/api/module-templates/stages/${stageKey}`);
      setEditingTemplate({ stageKey, ...template });
      templateForm.reset({
        subject: template.subject,
        htmlContent: template.htmlContent,
      });
      setIsEditDialogOpen(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle form submission
  const handleSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ stageKey: editingTemplate.stageKey, data });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading email templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Configure automated email templates for each module and stage
          </p>
        </div>
        <Button
          onClick={() => initAllMutation.mutate()}
          disabled={initAllMutation.isPending}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Initialize All Defaults
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(modules).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                Initialize default email templates to get started.
              </p>
              <Button
                onClick={() => initAllMutation.mutate()}
                disabled={initAllMutation.isPending}
              >
                <Settings className="h-4 w-4 mr-2" />
                Initialize Default Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(modules).map(([moduleKey, moduleData]: [string, any]) => {
              const ModuleIcon = moduleIcons[moduleKey] || FileText;
              const activeTemplates = moduleData.stages?.filter((stage: any) => stage.hasTemplate && stage.isActive).length || 0;
              const totalTemplates = moduleData.stages?.length || 0;

              return (
                <AccordionItem key={moduleKey} value={moduleKey} className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <ModuleIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold capitalize">{moduleData.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {activeTemplates} of {totalTemplates} templates active
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={activeTemplates > 0 ? "default" : "secondary"}>
                          {activeTemplates > 0 ? `${activeTemplates} Active` : 'No Templates'}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-4">
                    <div className="grid gap-3">
                      {moduleData.stages?.map((stage: any) => (
                        <div key={stage.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {stage.hasTemplate ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                )}
                                <span className="font-medium">{stage.name}</span>
                              </div>
                              {stage.hasTemplate && (
                                <Badge variant={stage.isActive ? "default" : "secondary"} className="text-xs">
                                  {stage.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {stage.hasTemplate ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(stage.key)}
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleMutation.mutate({ 
                                    stageKey: stage.key, 
                                    isActive: !stage.isActive 
                                  })}
                                  disabled={toggleMutation.isPending}
                                >
                                  {stage.isActive ? (
                                    <PowerOff className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Power className="h-3 w-3 mr-1" />
                                  )}
                                  {stage.isActive ? 'Disable' : 'Enable'}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => initializeMutation.mutate(stage.key)}
                                disabled={initializeMutation.isPending}
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Setup Template
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Email Template - {editingTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={templateForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter email subject..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Content (HTML)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={16}
                        placeholder="Enter email content with HTML formatting..."
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground mt-2">
                      <strong>Available placeholders:</strong> {"{"}{"{"} candidate.name {"}"}{"}"}  , {"{"}{"{"} job.title {"}"}{"}"}  , {"{"}{"{"} company.name {"}"}{"}"}  , {"{"}{"{"} application.referenceId {"}"}{"}"}  , {"{"}{"{"} interview.date {"}"}{"}"}  , {"{"}{"{"} offer.salary {"}"}{"}"} 
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingTemplate(null);
                    templateForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}