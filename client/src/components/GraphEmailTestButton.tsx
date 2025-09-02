import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GraphEmailTestButton() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");

  const sendTestEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("/api/graph-email/send-test-email", {
        method: "POST",
        body: JSON.stringify({
          to: email,
          subject: "Microsoft Graph API Test - Your ATS is Ready!",
          body: `
            <h2>Microsoft Graph API Integration Test</h2>
            <p>Congratulations! Your ATS system is now successfully sending emails through Microsoft Graph API.</p>
            <p><strong>What's working:</strong></p>
            <ul>
              <li>✅ OAuth2 authentication with Azure AD</li>
              <li>✅ Domain-based email sending from your Office 365</li>
              <li>✅ HTML email formatting</li>
              <li>✅ Template system ready for automation</li>
            </ul>
            <p>Your recruitment workflow can now automatically send:</p>
            <ul>
              <li>📧 New application notifications</li>
              <li>📅 Interview scheduling confirmations</li>
              <li>📄 Offer letter delivery</li>
              <li>📊 Status update notifications</li>
            </ul>
            <p>Test completed at: ${new Date().toLocaleString()}</p>
            <br>
            <p>Best regards,<br>Your TalentFlow ATS</p>
          `,
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
          title: "Email Sent Successfully!",
          description: `Test email sent to ${testEmail} via Microsoft Graph API`,
        });
        setTestEmail("");
      } else {
        toast({
          title: "Send Failed",
          description: data.error || "Failed to send test email",
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Graph API Email
        </CardTitle>
        <CardDescription>
          Send a test email using Microsoft Graph API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter your email to test"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            data-testid="input-test-email"
          />
        </div>
        
        <Button
          onClick={() => sendTestEmailMutation.mutate(testEmail)}
          disabled={sendTestEmailMutation.isPending || !testEmail}
          className="w-full"
          data-testid="button-send-test"
        >
          {sendTestEmailMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This will send a test email from your Office 365 domain using Microsoft Graph API
        </p>
      </CardContent>
    </Card>
  );
}