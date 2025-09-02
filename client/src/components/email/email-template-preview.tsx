import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Code, Mail } from "lucide-react";

interface EmailTemplatePreviewProps {
  template: {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    category: string;
    key: string;
    isActive: boolean;
  };
}

export default function EmailTemplatePreview({ template }: EmailTemplatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sample data for preview
  const sampleData = {
    candidate: {
      name: "John Smith",
      email: "john.smith@example.com"
    },
    job: {
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Hyderabad, India"
    },
    company: {
      name: "O2F Info Solutions",
      address: "Hyderabad, India",
      phone: "+91-40-12345678"
    },
    application: {
      id: "APP-2025-001",
      submittedDate: "January 20, 2025",
      submittedAt: "January 20, 2025",
      referenceId: "REF-2025-001",
      trackingLink: "https://talentflowhub.com/track/APP-2025-001"
    },
    interview: {
      date: "January 25, 2025",
      time: "10:00 AM",
      location: "Conference Room A"
    }
  };

  // Replace template variables with sample data
  const replaceVariables = (content: string) => {
    if (!content) return "";
    return content
      .replace(/\{\{candidate\.name\}\}/g, sampleData.candidate.name)
      .replace(/\{\{candidate\.email\}\}/g, sampleData.candidate.email)
      .replace(/\{\{job\.title\}\}/g, sampleData.job.title)
      .replace(/\{\{job\.department\}\}/g, sampleData.job.department)
      .replace(/\{\{job\.location\}\}/g, sampleData.job.location)
      .replace(/\{\{company\.name\}\}/g, sampleData.company.name)
      .replace(/\{\{company\.address\}\}/g, sampleData.company.address)
      .replace(/\{\{company\.phone\}\}/g, sampleData.company.phone)
      .replace(/\{\{application\.id\}\}/g, sampleData.application.id)
      .replace(/\{\{application\.submittedDate\}\}/g, sampleData.application.submittedDate)
      .replace(/\{\{application\.submittedAt\}\}/g, sampleData.application.submittedAt)
      .replace(/\{\{application\.referenceId\}\}/g, sampleData.application.referenceId)
      .replace(/\{\{application\.trackingLink\}\}/g, sampleData.application.trackingLink)
      .replace(/\{\{interview\.date\}\}/g, sampleData.interview.date)
      .replace(/\{\{interview\.time\}\}/g, sampleData.interview.time)
      .replace(/\{\{interview\.location\}\}/g, sampleData.interview.location);
  };

  const previewSubject = replaceVariables(template.subject || "");
  const previewBodyHtml = replaceVariables(template.htmlContent || "");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {template.name}
            </DialogTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">{template.category}</Badge>
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Email Preview</TabsTrigger>
            <TabsTrigger value="html">HTML Code</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          {/* Email Preview */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="border-b pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">From:</span> itsupport@o2finfosolutions.com
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {sampleData.candidate.email}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Subject:</span> {previewSubject}
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <style>{`
                    .greeting { 
                      font-size: 16px; 
                      margin-bottom: 16px; 
                      font-weight: 500;
                      color: #1f2937;
                    }
                    .body-text { 
                      font-size: 14px; 
                      line-height: 1.6; 
                      margin-bottom: 16px; 
                      color: #4b5563;
                    }
                    .highlight { 
                      background: #f0f9ff; 
                      border: 1px solid #bfdbfe; 
                      border-radius: 8px; 
                      padding: 16px; 
                      margin: 20px 0; 
                      color: #1e40af;
                      font-size: 14px;
                      line-height: 1.5;
                    }
                    .cta-button { 
                      background: #3b82f6; 
                      color: white; 
                      padding: 12px 24px; 
                      border-radius: 6px; 
                      text-decoration: none; 
                      font-weight: 500;
                      display: inline-block;
                    }
                    .footer { 
                      margin-top: 32px; 
                      padding-top: 20px; 
                      border-top: 1px solid #e5e7eb; 
                      color: #6b7280; 
                      font-size: 12px; 
                    }
                  `}</style>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HTML Code */}
          <TabsContent value="html" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Subject Template:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      <code>{template.subject}</code>
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">HTML Body Template:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto max-h-96">
                      <code>{template.htmlContent}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variables */}
          <TabsContent value="variables" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Template Variables</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      These variables are automatically replaced with actual data when emails are sent.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Candidate Variables:</h5>
                      <div className="text-sm space-y-1">
                        <div><code className="bg-muted px-1 rounded">{'{{candidate.name}}'}</code> → {sampleData.candidate.name}</div>
                        <div><code className="bg-muted px-1 rounded">{'{{candidate.email}}'}</code> → {sampleData.candidate.email}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Job Variables:</h5>
                      <div className="text-sm space-y-1">
                        <div><code className="bg-muted px-1 rounded">{'{{job.title}}'}</code> → {sampleData.job.title}</div>
                        <div><code className="bg-muted px-1 rounded">{'{{job.department}}'}</code> → {sampleData.job.department}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Company Variables:</h5>
                      <div className="text-sm space-y-1">
                        <div><code className="bg-muted px-1 rounded">{'{{company.name}}'}</code> → {sampleData.company.name}</div>
                        <div><code className="bg-muted px-1 rounded">{'{{company.address}}'}</code> → {sampleData.company.address}</div>
                        <div><code className="bg-muted px-1 rounded">{'{{company.phone}}'}</code> → {sampleData.company.phone}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Application Variables:</h5>
                      <div className="text-sm space-y-1">
                        <div><code className="bg-muted px-1 rounded">{'{{application.id}}'}</code> → {sampleData.application.id}</div>
                        <div><code className="bg-muted px-1 rounded">{'{{application.submittedDate}}'}</code> → {sampleData.application.submittedDate}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Trigger Key:</strong> <code className="bg-blue-100 px-1 rounded">{template.key}</code>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This template automatically sends when {template.category} events occur in the ATS workflow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}