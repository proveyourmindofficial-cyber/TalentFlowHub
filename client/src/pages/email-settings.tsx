import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
// Removed layout imports since this will be embedded in settings page
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";

// Schema for email provider form
const emailProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.enum(["smtp", "sendgrid", "outlook", "gmail"]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().default(false),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  apiKey: z.string().optional(),
  fromEmail: z.string().email("Valid email is required"),
  fromName: z.string().min(1, "From name is required"),
});

const testEmailSchema = z.object({
  to: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type EmailProviderFormData = z.infer<typeof emailProviderSchema>;
type TestEmailFormData = z.infer<typeof testEmailSchema>;

export default function EmailSettings() {
  const [isProviderFormOpen, setIsProviderFormOpen] = useState(false);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["/api/emails/providers"],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/emails/templates"],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/emails/logs"],
  });

  const { data: atsTemplates = {} } = useQuery({
    queryKey: ["/api/emails/templates/ats"],
  });

  // Forms
  const providerForm = useForm<EmailProviderFormData>({
    resolver: zodResolver(emailProviderSchema),
    defaultValues: {
      name: "",
      provider: "smtp",
      isActive: true,
      isDefault: false,
      smtpSecure: false,
      smtpHost: "",
      smtpPort: undefined,
      smtpUsername: "",
      smtpPassword: "",
      apiKey: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const testEmailForm = useForm<TestEmailFormData>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      to: "",
      subject: "Test Email from ATS",
      message: "This is a test email from the ATS email service.",
    },
  });

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: async (data: EmailProviderFormData) => {
      return apiRequest("POST", "/api/emails/providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/providers"] });
      setIsProviderFormOpen(false);
      setEditingProvider(null);
      providerForm.reset();
      toast({ title: "Success", description: "Email provider created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailProviderFormData> }) => {
      return apiRequest("PUT", `/api/emails/providers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/providers"] });
      setIsProviderFormOpen(false);
      setEditingProvider(null);
      providerForm.reset();
      toast({ title: "Success", description: "Email provider updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/emails/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/providers"] });
      toast({ title: "Success", description: "Email provider deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/emails/providers/${id}/test`);
    },
    onSuccess: (result: any) => {
      setTestingProvider(null);
      if (result.connected) {
        toast({ title: "Success", description: "Connection test successful!" });
      } else {
        toast({ title: "Error", description: "Connection test failed", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      setTestingProvider(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: TestEmailFormData) => {
      return apiRequest("POST", "/api/emails/send", {
        to: data.to,
        subject: data.subject,
        text: data.message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/logs"] });
      setIsTestEmailOpen(false);
      testEmailForm.reset();
      toast({ title: "Success", description: "Test email sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleSubmitProvider = (data: EmailProviderFormData) => {
    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    providerForm.reset(provider);
    setIsProviderFormOpen(true);
  };

  const handleDeleteProvider = (id: string) => {
    if (confirm("Are you sure you want to delete this email provider?")) {
      deleteProviderMutation.mutate(id);
    }
  };

  const handleTestConnection = (id: string) => {
    setTestingProvider(id);
    testConnectionMutation.mutate(id);
  };

  const handleSendTestEmail = (data: TestEmailFormData) => {
    sendTestEmailMutation.mutate(data);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "sendgrid": return "📧";
      case "gmail": return "📬";
      case "outlook": return "📮";
      default: return "📨";
    }
  };

  return (
    <div className="space-y-6">
          <Tabs defaultValue="providers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="providers">Email Providers</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="logs">Email Logs</TabsTrigger>
              <TabsTrigger value="test">Test Email</TabsTrigger>
            </TabsList>

            {/* Email Providers Tab */}
            <TabsContent value="providers" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">🔧 How Email Configuration Works</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>One Email Sends Everything:</strong> Configure ONE email address that will send all ATS emails</p>
                  <p><strong>Recommended Options:</strong></p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Your Admin Email:</strong> `youremail@company.com` - Personal but professional</li>
                    <li><strong>Dedicated ATS Email:</strong> `ats@company.com` - Most professional</li>
                    <li><strong>HR Department:</strong> `hr@company.com` - Department approach</li>
                  </ul>
                  <p><strong>What Gets Sent:</strong> New applications, interview scheduling, offer letters, status updates</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Email Providers</h3>
                <Dialog open={isProviderFormOpen} onOpenChange={setIsProviderFormOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-provider">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProvider ? "Edit Email Provider" : "Add Email Provider"}
                      </DialogTitle>
                      {/* Office 365 Help */}
                      {providerForm.watch("provider") === "outlook" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <h4 className="font-semibold text-blue-800 mb-2">📮 Office 365 Setup Guide</h4>
                          <div className="text-sm text-blue-700 space-y-2">
                            <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-3">
                              <p className="font-semibold text-yellow-800">⚠️ Hardware Token Required?</p>
                              <p className="text-yellow-700">If Microsoft asks for a hardware token, your organization has MFA enforced. Contact your IT administrator for help setting up email integration.</p>
                            </div>
                            <p><strong>Quick Setup:</strong></p>
                            <ul className="list-disc ml-4 space-y-1">
                              <li>SMTP Host: <code className="bg-white px-1 rounded">smtp.office365.com</code></li>
                              <li>SMTP Port: <code className="bg-white px-1 rounded">587</code></li>
                              <li>Username: Your full Office 365 email</li>
                              <li>Password: App password (not your regular password)</li>
                              <li>Enable SSL/TLS ✓</li>
                            </ul>
                            <div className="flex space-x-2 mt-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  providerForm.setValue("smtpHost", "smtp.office365.com");
                                  providerForm.setValue("smtpPort", 587);
                                  providerForm.setValue("smtpSecure", true);
                                }}
                              >
                                Auto-fill Office 365 Settings
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.open("https://account.microsoft.com/security", "_blank")}
                              >
                                Open Microsoft Security →
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogHeader>
                    <Form {...providerForm}>
                      <form onSubmit={providerForm.handleSubmit(handleSubmitProvider)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={providerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-provider-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={providerForm.control}
                            name="provider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-provider-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="smtp">SMTP</SelectItem>
                                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                                    <SelectItem value="outlook">Outlook</SelectItem>
                                    <SelectItem value="gmail">Gmail</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={providerForm.control}
                            name="fromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" data-testid="input-from-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={providerForm.control}
                            name="fromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-from-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {providerForm.watch("provider") === "sendgrid" && (
                          <FormField
                            control={providerForm.control}
                            name="apiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SendGrid API Key</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" data-testid="input-api-key" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {["smtp", "gmail", "outlook"].includes(providerForm.watch("provider")) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={providerForm.control}
                                name="smtpHost"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>SMTP Host</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder={providerForm.watch("provider") === "outlook" ? "smtp.office365.com" : ""}
                                        data-testid="input-smtp-host" 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={providerForm.control}
                                name="smtpPort"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>SMTP Port</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        type="number" 
                                        placeholder={providerForm.watch("provider") === "outlook" ? "587" : ""}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                        data-testid="input-smtp-port" 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex items-center space-x-2 pt-8">
                                <FormField
                                  control={providerForm.control}
                                  name="smtpSecure"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <input 
                                          type="checkbox" 
                                          checked={field.value}
                                          onChange={field.onChange}
                                          data-testid="checkbox-smtp-secure"
                                        />
                                      </FormControl>
                                      <FormLabel>Use SSL/TLS</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={providerForm.control}
                                name="smtpUsername"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-smtp-username" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={providerForm.control}
                                name="smtpPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="password" data-testid="input-smtp-password" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsProviderFormOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" data-testid="button-save-provider">
                            {editingProvider ? "Update" : "Create"} Provider
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {providersLoading ? (
                  <div className="text-center py-8">Loading providers...</div>
                ) : providers.length === 0 ? (
                  <div className="text-center py-8">No email providers configured</div>
                ) : (
                  providers.map((provider: any) => (
                    <Card key={provider.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{getProviderIcon(provider.provider)}</span>
                            <div>
                              <h4 className="font-semibold">{provider.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {provider.provider.toUpperCase()} • {provider.fromEmail}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {provider.isDefault && (
                              <Badge variant="default">Default</Badge>
                            )}
                            {provider.isActive ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 border-gray-600">
                                <XCircle className="mr-1 h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(provider.id)}
                              disabled={testingProvider === provider.id}
                              data-testid={`button-test-${provider.id}`}
                            >
                              {testingProvider === provider.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Settings className="mr-2 h-4 w-4" />
                              )}
                              Test
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProvider(provider)}
                              data-testid={`button-edit-${provider.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProvider(provider.id)}
                              data-testid={`button-delete-${provider.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Email Templates</h3>
              
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Built-in ATS Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {Object.entries(atsTemplates).map(([key, template]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{key.replace(/_/g, ' ')}</h4>
                            <p className="text-sm text-muted-foreground">{template.subject}</p>
                          </div>
                          <Badge variant="secondary">Built-in</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <h3 className="text-lg font-semibold">Email Logs</h3>
              
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8">No email logs found</div>
                ) : (
                  logs.slice(0, 20).map((log: any) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{log.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              To: {log.to} • {new Date(log.sentAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={log.status === 'sent' ? 'default' : 'destructive'}
                            >
                              {log.status}
                            </Badge>
                            <Badge variant="outline">{log.provider}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Test Email Tab */}
            <TabsContent value="test" className="space-y-4">
              {/* Microsoft Graph API Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Microsoft Graph API (Office 365) - Quick Test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">✅ Your Office 365 Integration Status</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Microsoft Graph API is configured and ready! Emails will be sent from: <strong>itsupport@o2finfosolutions.com</strong>
                    </p>
                    <p className="text-xs text-blue-600">
                      This uses OAuth2 authentication with your Azure AD app registration.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <Button 
                      onClick={() => {
                        fetch('/api/graph-email/test-connection')
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              toast({ 
                                title: "✅ Connection Success", 
                                description: "Microsoft Graph API is connected and ready!" 
                              });
                            } else {
                              toast({ 
                                title: "❌ Connection Failed", 
                                description: data.message || "Could not connect to Microsoft Graph API", 
                                variant: "destructive" 
                              });
                            }
                          })
                          .catch(() => {
                            toast({ 
                              title: "❌ Error", 
                              description: "Failed to test connection", 
                              variant: "destructive" 
                            });
                          });
                      }}
                      variant="outline"
                      data-testid="button-test-graph-connection"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        const testEmail = prompt("Enter your email to receive test:", "itsupport@o2finfosolutions.com");
                        if (!testEmail) return;
                        
                        fetch('/api/graph-email/send-test-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            to: testEmail,
                            subject: "🚀 TalentFlow ATS - Microsoft Graph Test Success!",
                            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                              <h2 style="color: #2563eb;">✅ Microsoft Graph API Integration Working!</h2>
                              <p>Congratulations! Your Office 365 integration is working perfectly.</p>
                              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>✨ What this means:</strong></p>
                                <ul>
                                  <li>Your TalentFlow ATS can now send professional emails</li>
                                  <li>Offer letters will be emailed automatically</li>
                                  <li>Interview notifications will be sent</li>
                                  <li>All emails come from your company domain</li>
                                </ul>
                              </div>
                              <p style="color: #6b7280; font-size: 14px;">
                                This email was sent automatically from your TalentFlow ATS system using Microsoft Graph API.
                              </p>
                            </div>`
                          })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success || data.message?.includes("sent successfully")) {
                            toast({ 
                              title: "🎉 Email Sent Successfully!", 
                              description: `Test email sent to ${testEmail}. Check your inbox!`
                            });
                          } else {
                            toast({ 
                              title: "❌ Send Failed", 
                              description: data.error || "Email sending failed", 
                              variant: "destructive" 
                            });
                          }
                        })
                        .catch(() => {
                          toast({ 
                            title: "❌ Network Error", 
                            description: "Could not send email", 
                            variant: "destructive" 
                          });
                        });
                      }}
                      data-testid="button-send-graph-test"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Quick Test Email
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded">
                    💡 <strong>Tips:</strong> Use "Test Connection" to verify the API, then "Send Quick Test Email" to confirm delivery. 
                    Check your email logs below to see the results.
                  </div>
                </CardContent>
              </Card>

              {/* Regular Email Provider Test */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Email Test (via Microsoft Graph)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-700">
                      <strong>Note:</strong> This will also send via Microsoft Graph API (same as above) since no email providers are configured. 
                      Configure email providers first if you want to use SMTP instead.
                    </p>
                  </div>
                  <Form {...testEmailForm}>
                    <form onSubmit={testEmailForm.handleSubmit((data) => {
                      // Send via Microsoft Graph instead of email providers
                      fetch('/api/graph-email/send-test-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: data.to,
                          subject: data.subject,
                          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2>Custom Test Email from TalentFlow ATS</h2>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                              ${data.message.replace(/\n/g, '<br>')}
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">
                              This email was sent from your TalentFlow ATS system using Microsoft Graph API.
                            </p>
                          </div>`
                        })
                      })
                      .then(res => res.json())
                      .then(result => {
                        if (result.success) {
                          toast({ 
                            title: "Email Sent Successfully!", 
                            description: `Email sent to ${data.to} via Microsoft Graph API`
                          });
                        } else {
                          toast({ 
                            title: "Send Failed", 
                            description: result.error || "Email sending failed", 
                            variant: "destructive" 
                          });
                        }
                      })
                      .catch(() => {
                        toast({ 
                          title: "Network Error", 
                          description: "Could not send email", 
                          variant: "destructive" 
                        });
                      });
                    })} className="space-y-4">
                      <FormField
                        control={testEmailForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-test-to" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testEmailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-test-subject" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testEmailForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={6} data-testid="textarea-test-message" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={sendTestEmailMutation.isPending}
                        data-testid="button-send-test"
                      >
                        {sendTestEmailMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Custom Test Email
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
  );
}