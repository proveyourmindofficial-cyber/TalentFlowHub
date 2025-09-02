import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SimpleEmailSettings() {
  const { toast } = useToast();

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/emails/templates"],
  });

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2">Email Templates System</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p><strong>5 Pre-Built ATS Templates:</strong> Application Received, Candidate Registered, Application Shortlisted, Interview Scheduled, Offer Extended</p>
          <p><strong>Dynamic Variables:</strong> Templates use candidate names, job titles, company info automatically</p>
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
          </Card>
        ) : (
          templates.map((template: any) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{template.name}</h3>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      toast({
                        title: "Template Preview",
                        description: `Template: ${template.name}`
                      });
                    }}
                  >
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {templates.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How Email Templates Work</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Automatic Triggering:</strong> Templates fire when application stages change</p>
              <p>• <strong>Variable Replacement:</strong> Candidate names and job details filled automatically</p>
              <p>• <strong>Company Branding:</strong> Uses your Company Profile data automatically</p>
              <p>• <strong>Microsoft Graph:</strong> Sent via your Office 365 email integration</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Test Email Integration</h4>
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                fetch('/api/graph-email/test-connection')
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      toast({ 
                        title: "Connection Success", 
                        description: "Microsoft Graph API is connected and ready!" 
                      });
                    } else {
                      toast({ 
                        title: "Connection Failed", 
                        description: data.message || "Could not connect", 
                        variant: "destructive" 
                      });
                    }
                  });
              }}
              variant="outline"
            >
              Test Connection
            </Button>
            
            <Button 
              onClick={() => {
                const testEmail = prompt("Enter your email:", "itsupport@o2finfosolutions.com");
                if (!testEmail) return;
                
                fetch('/api/graph-email/send-test-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: testEmail,
                    subject: "TalentFlow ATS - Email Templates Test",
                    body: "Your email templates system is working correctly!"
                  })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    toast({ 
                      title: "Email Sent Successfully!", 
                      description: `Test email sent to ${testEmail}`
                    });
                  } else {
                    toast({ 
                      title: "Send Failed", 
                      description: "Email sending failed", 
                      variant: "destructive" 
                    });
                  }
                });
              }}
            >
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}