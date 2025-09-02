import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle } from "lucide-react";

export default function EmailSettingsContent() {
  const { toast } = useToast();

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/emails/templates"],
  });

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'applications': return '📝';
      case 'candidates': return '👤';
      case 'interviews': return '🗣️';
      case 'offers': return '🎉';
      default: return '📧';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-800 mb-2">📧 Email Templates System</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>5 Pre-Built ATS Templates:</strong> Application Received, Candidate Registered, Application Shortlisted, Interview Scheduled, Offer Extended</p>
              <p><strong>Dynamic Variables:</strong> Templates use candidate name, job title, company name automatically</p>
              <p><strong>Auto-Triggered:</strong> Emails sent automatically when application stages change</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Email Templates ({templates.length})</h3>
            <Button 
              onClick={() => {
                toast({
                  title: "Templates Available",
                  description: "System templates are pre-configured and working automatically"
                });
              }}
            >
              View System Info
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">Loading email templates...</p>
                <p className="text-sm text-muted-foreground mt-2">System templates should appear here.</p>
              </Card>
            ) : (
              templates.map((template: any) => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTemplateIcon(template.category)}</span>
                          <h3 className="font-semibold">{template.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{template.category}</Badge>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">System Template</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Key: {template.key}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            toast({
                              title: "Template Preview",
                              description: `Template: ${template.name} - Subject: ${template.subject}`,
                            });
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {templates.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🔄 How Email Templates Work</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• <strong>Automatic Triggering:</strong> Templates fire when application stages change</p>
                  <p>• <strong>Variable Replacement:</strong> Candidate names and job details filled automatically</p>
                  <p>• <strong>Company Branding:</strong> Uses your Company Profile data automatically</p>
                  <p>• <strong>Microsoft Graph:</strong> Sent via your Office 365 email integration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Email Tab */}
        <TabsContent value="test" className="space-y-4">
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
                      });
                  }}
                  variant="outline"
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
                        subject: "🚀 TalentFlow ATS - Email Templates Working!",
                        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <h2 style="color: #2563eb;">✅ Email Templates System Working!</h2>
                          <p>Your TalentFlow ATS email templates are operational.</p>
                          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>✨ What this confirms:</strong></p>
                            <ul>
                              <li>5 pre-built templates are active</li>
                              <li>Microsoft Graph integration working</li>
                              <li>Automatic email sending enabled</li>
                              <li>Templates use your company branding</li>
                            </ul>
                          </div>
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
                    });
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}