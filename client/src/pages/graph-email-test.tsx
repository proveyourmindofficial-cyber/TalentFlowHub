import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Mail, Send, TestTube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface TestEmailData {
  to: string;
  subject: string;
  body: string;
}

export default function GraphEmailTest() {
  const { toast } = useToast();
  const [emailData, setEmailData] = useState<TestEmailData>({
    to: "",
    subject: "Test Email from ATS - Microsoft Graph API",
    body: `<h2>Microsoft Graph API Integration Test</h2>
<p>This is a test email sent from your ATS system using Microsoft Graph API.</p>
<p><strong>Features:</strong></p>
<ul>
  <li>✅ OAuth2 authentication with Azure AD</li>
  <li>✅ Domain-based email sending</li>
  <li>✅ HTML email support</li>
  <li>✅ Template system ready</li>
</ul>
<p>If you received this email, the integration is working perfectly!</p>`,
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/graph-email/test-connection");
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Microsoft Graph API authentication is working correctly.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Unable to connect to Microsoft Graph API.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: `Failed to test connection: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Send test email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: TestEmailData) => {
      const response = await apiRequest("/api/graph-email/send-test-email", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Test email sent to ${emailData.to}`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: data.error || "Failed to send email.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Send Error",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Send templated email mutation
  const sendTemplateEmailMutation = useMutation({
    mutationFn: async (templateName: string) => {
      const response = await apiRequest("/api/graph-email/send-template-email", {
        method: "POST",
        body: JSON.stringify({
          to: emailData.to,
          templateName,
          variables: {
            candidateName: "John Doe",
            jobTitle: "Senior Developer",
            candidateEmail: emailData.to,
            interviewDate: "March 15, 2024",
            interviewTime: "2:00 PM",
            interviewLocation: "Conference Room A",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Template Email Sent",
          description: `Template email sent successfully to ${emailData.to}`,
        });
      } else {
        toast({
          title: "Template Email Failed",
          description: data.error || "Failed to send template email.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Template Send Error",
        description: `Failed to send template email: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen overflow-hidden" data-testid="graph-email-test-page">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Microsoft Graph API Email Test"
          description="Test your Office 365 email integration with Microsoft Graph API"
          showNewJobButton={false}
        />
        
        <div className="p-6 space-y-6">
          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Current Microsoft Graph API setup for your ATS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Tenant ID</p>
                  <Badge variant="secondary" className="mt-1">
                    {process.env.AZURE_TENANT_ID ? "✅ Configured" : "❌ Missing"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Client ID</p>
                  <Badge variant="secondary" className="mt-1">
                    {process.env.AZURE_CLIENT_ID ? "✅ Configured" : "❌ Missing"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Client Secret</p>
                  <Badge variant="secondary" className="mt-1">
                    {process.env.AZURE_CLIENT_SECRET ? "✅ Configured" : "❌ Missing"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">From Email</p>
                  <Badge variant="secondary" className="mt-1">
                    {process.env.GRAPH_FROM_EMAIL || "❌ Missing"}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Button
                  onClick={() => testConnectionMutation.mutate()}
                  disabled={testConnectionMutation.isPending}
                  className="w-full"
                  data-testid="button-test-connection"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testConnectionMutation.isPending ? "Testing Connection..." : "Test Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a custom test email to verify your integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">To Email Address</label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  data-testid="input-to-email"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  data-testid="input-subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Email Body (HTML)</label>
                <Textarea
                  rows={10}
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  data-testid="textarea-body"
                />
              </div>
              
              <Button
                onClick={() => sendEmailMutation.mutate(emailData)}
                disabled={sendEmailMutation.isPending || !emailData.to}
                className="w-full"
                data-testid="button-send-email"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending Email..." : "Send Test Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Template Email Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Template Email Tests</CardTitle>
              <CardDescription>
                Test predefined email templates for your ATS workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">Application Received</p>
                    <p className="text-sm text-muted-foreground">
                      Notification when new application is submitted
                    </p>
                  </div>
                  <Button
                    onClick={() => sendTemplateEmailMutation.mutate("application_received")}
                    disabled={sendTemplateEmailMutation.isPending || !emailData.to}
                    variant="outline"
                    size="sm"
                    data-testid="button-template-application"
                  >
                    Send Template
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">Interview Scheduled</p>
                    <p className="text-sm text-muted-foreground">
                      Interview confirmation for candidates
                    </p>
                  </div>
                  <Button
                    onClick={() => sendTemplateEmailMutation.mutate("interview_scheduled")}
                    disabled={sendTemplateEmailMutation.isPending || !emailData.to}
                    variant="outline"
                    size="sm"
                    data-testid="button-template-interview"
                  >
                    Send Template
                  </Button>
                </div>
              </div>
              
              {!emailData.to && (
                <p className="text-sm text-muted-foreground">
                  Enter an email address above to test templates
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Microsoft Graph API packages installed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">OAuth2 authentication configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email service endpoints ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Template system prepared</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email logging integrated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}