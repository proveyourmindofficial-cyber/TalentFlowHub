import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Plus, Edit2, Trash2, Mail, Eye, Send } from 'lucide-react';

// Form schemas
const templateSchema = z.object({
  key: z.string().min(1, 'Template key is required'),
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  category: z.string().default('general'),
  isActive: z.boolean().default(true),
});

const sendEmailSchema = z.object({
  templateKey: z.string().min(1, 'Template is required'),
  to: z.string().email('Valid email is required'),
  candidateName: z.string().default('John Doe'),
  jobTitle: z.string().default('Software Developer'),
  clientName: z.string().default('TechCorp Inc'),
  portalLink: z.string().url().default('https://d5e39f9d-2243-48e9-b99e-642cf80de1c8-00-3nrpx0ddmkv7z.janeway.replit.dev'),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type SendEmailFormData = z.infer<typeof sendEmailSchema>;

export default function EmailTemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { toast } = useToast();

  // Fetch templates
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/email-templates'],
  });

  // Form for template creation/editing
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      key: '',
      name: '',
      subject: '',
      htmlContent: '',
      category: 'general',
      isActive: true,
    },
  });

  // Form for sending test emails
  const sendEmailForm = useForm<SendEmailFormData>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      templateKey: '',
      to: '',
      candidateName: 'John Doe',
      jobTitle: 'Software Developer',
      clientName: 'TechCorp Inc',
      portalLink: 'https://portal.talentflowhub.com',
    },
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiRequest('POST', '/api/email-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsDialogOpen(false);
      templateForm.reset();
      setEditingTemplate(null);
      toast({ title: 'Success', description: 'Template saved successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      return apiRequest('PUT', `/api/email-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setIsDialogOpen(false);
      templateForm.reset();
      setEditingTemplate(null);
      toast({ title: 'Success', description: 'Template updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: 'Success', description: 'Template deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: SendEmailFormData) => {
      const emailData = {
        templateKey: data.templateKey,
        to: data.to,
        data: {
          candidate: { name: data.candidateName },
          job: { title: data.jobTitle },
          client: { name: data.clientName },
          candidatePortal: { link: data.portalLink },
          application: { 
            submittedAt: new Date().toLocaleDateString(),
            id: `APP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          },
        }
      };
      return apiRequest('POST', '/api/email-templates/send', emailData);
    },
    onSuccess: () => {
      setIsSendDialogOpen(false);
      sendEmailForm.reset();
      toast({ title: 'Success', description: 'Test email sent successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const initDefaultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/email-templates/init-defaults');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: 'Success', description: 'Default templates initialized successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Handle template form submission
  const handleSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      key: template.key,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent || '',
      category: template.category || 'general',
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle send test email
  const handleSendEmail = (data: SendEmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'application', label: 'Application' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejection', label: 'Rejection' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage email templates for automated recruitment communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => initDefaultsMutation.mutate()}
            disabled={initDefaultsMutation.isPending}
          >
            <Mail className="h-4 w-4 mr-2" />
            Initialize Defaults
          </Button>
          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Test Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
              </DialogHeader>
              <Form {...sendEmailForm}>
                <form onSubmit={sendEmailForm.handleSubmit(handleSendEmail)} className="space-y-4">
                  <FormField
                    control={sendEmailForm.control}
                    name="templateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map((template: any) => (
                                <SelectItem key={template.id} value={template.key}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sendEmailForm.control}
                    name="to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="test@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={sendEmailForm.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Doe" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sendEmailForm.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Software Developer" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={sendEmailForm.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="TechCorp Inc" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={sendEmailMutation.isPending}>
                      {sendEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
              </DialogHeader>
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Key</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., candidate_welcome" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Candidate Welcome Email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={templateForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Welcome {{candidate.name}} to TalentFlow" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>HTML Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={12}
                            placeholder={`<div class="greeting">Hi {{candidate.name}}!</div>
<div class="body-text">
  Welcome to <strong>TalentFlowHub</strong>!
</div>
<div class="highlight">
  <strong>Next Steps:</strong><br>
  Please complete your profile.
</div>
<div style="text-align: center; margin: 32px 0;">
  <a href="{{candidatePortal.link}}" class="cta-button">Access Portal</a>
</div>`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingTemplate(null);
                        templateForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      {(createTemplateMutation.isPending || updateTemplateMutation.isPending) 
                        ? 'Saving...' 
                        : editingTemplate ? 'Update Template' : 'Create Template'
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Templates</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first email template or initializing default templates.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => initDefaultsMutation.mutate()}
                  disabled={initDefaultsMutation.isPending}
                >
                  Initialize Defaults
                </Button>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Key: {template.key}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Subject:</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.subject}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          sendEmailForm.setValue('templateKey', template.key);
                          setIsSendDialogOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}