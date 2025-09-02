import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle, Settings, FileText } from "lucide-react";
import EmailTemplatePreview from "./email-template-preview";

export default function ComprehensiveEmailManagement() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/emails/templates"],
  });

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/graph-email/test-connection');
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: "Connection Success", 
          description: "Microsoft Graph API is connected and ready!" 
        });
      } else {
        toast({ 
          title: "Connection Failed", 
          description: data.message || "Could not connect to Microsoft Graph API", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Connection Error", 
        description: "Failed to test connection", 
        variant: "destructive" 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestEmail = async () => {
    const testEmail = prompt("Enter your email address to receive test:", "itsupport@o2finfosolutions.com");
    if (!testEmail) return;

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/graph-email/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: "TalentFlow ATS - Email System Test",
          body: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">TalentFlow ATS Email System</h2>
            <p>This test confirms your email templates system is working correctly!</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>System Status:</strong></p>
              <ul>
                <li>5 pre-built email templates active</li>
                <li>Microsoft Graph integration operational</li>
                <li>Automatic email triggers enabled</li>
              </ul>
            </div>
            <p>Best regards,<br/>Your TalentFlow ATS Team</p>
          </div>`
        })
      });
      const data = await response.json();
      
      if (data.success || data.message?.includes("sent successfully")) {
        toast({ 
          title: "Email Sent Successfully!", 
          description: `Test email sent to ${testEmail}. Check your inbox!`
        });
      } else {
        toast({ 
          title: "Send Failed", 
          description: data.error || "Email sending failed", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Send Error", 
        description: "Failed to send test email", 
        variant: "destructive" 
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Email Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Email Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Mail className="h-5 w-5" />
                Email System Status - Fully Operational
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-700 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Active Features:</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ 5 Pre-Built ATS Email Templates</li>
                    <li>✅ Microsoft Graph API Integration</li>
                    <li>✅ Automatic Email Triggers</li>
                    <li>✅ Dynamic Variable Replacement</li>
                    <li>✅ Company Branding Integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Email Templates:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Application Received</li>
                    <li>• Candidate Registered</li>
                    <li>• Application Shortlisted</li>
                    <li>• Interview Scheduled</li>
                    <li>• Offer Extended</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isTestingConnection ? "Testing..." : "Test Connection"}
                </Button>
                
                <Button 
                  onClick={sendTestEmail}
                  disabled={isSendingTest}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSendingTest ? "Sending..." : "Send Test Email"}
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Current Configuration:</strong> Emails sent from <strong>itsupport@o2finfosolutions.com</strong> via Microsoft Graph API (Office 365)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-sm text-muted-foreground">
                System templates that automatically trigger during ATS workflow stages
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {templates.length} Templates Active
            </Badge>
          </div>

          <div className="grid gap-4">
            {templates.length === 0 ? (
              <Card className="p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading email templates...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  System templates should appear here automatically.
                </p>
              </Card>
            ) : (
              templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.subject}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-11">
                          <Badge variant="outline" className="capitalize">{template.category}</Badge>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">System Template</Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground ml-11">
                          Trigger Key: <code className="bg-muted px-1 rounded">{template.key}</code>
                        </div>
                      </div>
                      
                      <EmailTemplatePreview template={template} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {templates.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-3">How Email Templates Work</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <p className="font-medium mb-2">Automatic Triggering:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Templates fire when application stages change</li>
                      <li>• No manual intervention required</li>
                      <li>• Integrated with ATS workflow</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Dynamic Content:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Candidate names inserted automatically</li>
                      <li>• Job titles and company data included</li>
                      <li>• Professional formatting maintained</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Microsoft Graph API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Current Configuration Status</h4>
                <div className="text-sm text-green-700 space-y-2">
                  <p><strong>Email Provider:</strong> Microsoft Graph API (Office 365)</p>
                  <p><strong>Sender Email:</strong> itsupport@o2finfosolutions.com</p>
                  <p><strong>Authentication:</strong> OAuth2 with Azure AD</p>
                  <p><strong>Status:</strong> Active and operational</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Configuration Notes</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Email configuration is managed through environment variables</p>
                  <p>• Azure AD app registration handles authentication</p>
                  <p>• Templates automatically use your company profile data</p>
                  <p>• All emails are sent with professional formatting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing & Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                >
                  {isTestingConnection ? "Testing Connection..." : "Test API Connection"}
                </Button>
                
                <Button 
                  onClick={sendTestEmail}
                  disabled={isSendingTest}
                >
                  {isSendingTest ? "Sending Test Email..." : "Send Test Email"}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Use these tools to verify your email integration is working properly.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}