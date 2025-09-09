import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Eye, 
  Upload,
  File,
  Image,
  Video,
  Link,
  Calendar,
  User
} from "lucide-react";
import type { Candidate } from "@shared/schema";
import { useState } from "react";

interface CandidateDocumentsTabProps {
  candidate: Candidate;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <FileText className="w-6 h-6 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-6 h-6 text-blue-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <Image className="w-6 h-6 text-green-500" />;
    case 'mp4':
    case 'avi':
    case 'mov':
      return <Video className="w-6 h-6 text-purple-500" />;
    default:
      return <File className="w-6 h-6 text-gray-500" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Not specified";
  return new Date(dateStr).toLocaleDateString('en-IN');
};

export function CandidateDocumentsTab({ candidate }: CandidateDocumentsTabProps) {
  const [resumeViewOpen, setResumeViewOpen] = useState(false);

  const handleResumeView = () => {
    if (candidate.resumeUrl) {
      setResumeViewOpen(true);
    }
  };

  const handleResumeDownload = async () => {
    if (candidate.resumeUrl) {
      try {
        const response = await fetch(candidate.resumeUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${candidate.name}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading resume:', error);
        // Fallback to direct link
        window.open(candidate.resumeUrl, '_blank');
      }
    }
  };

  // Real document data - only include resume if it exists
  const documents = candidate.resumeUrl ? [
    {
      id: '1',
      name: 'Resume.pdf',
      type: 'Resume',
      size: 245760, // Approximate size
      uploadedAt: candidate.createdAt,
      url: candidate.resumeUrl,
    }
  ] : [];

  const documentsByCategory = {
    'Resume': documents.filter(doc => doc.type === 'Resume'),
    'Certificates': [], // No certificates available yet
    'Identity Documents': [], // No identity documents available yet
    'Other Documents': [], // No other documents available yet
  };

  return (
    <div className="space-y-6">
      {/* Documents Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Documents</span>
              <Badge variant="outline">{documents.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resume</span>
              <Badge variant={candidate.resumeUrl ? "default" : "secondary"}>
                {candidate.resumeUrl ? "Available" : "Missing"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Certificates</span>
              <Badge variant="outline">0</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ID Documents</span>
              <Badge variant="outline">0</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.resumeUrl ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon('resume.pdf')}
                <div>
                  <h4 className="font-medium">{candidate.name}_Resume.pdf</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {formatDate(candidate.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleResumeView}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={handleResumeDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resume Uploaded</h3>
              <p className="text-muted-foreground mb-4">
                This candidate hasn't uploaded their resume yet.
              </p>
              <Button disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume (Contact Admin)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Categories */}
      {Object.entries(documentsByCategory).map(([category, docs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <File className="w-5 h-5" />
                {category}
              </span>
              <Badge variant="outline">{docs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docs.length > 0 ? (
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.name)}
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (doc.url) {
                            setResumeViewOpen(true);
                          }
                        }}
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (doc.url) {
                            handleResumeDownload();
                          }
                        }}
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No {category.toLowerCase()} uploaded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            External Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {candidate.linkedinUrl && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <Link className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">LinkedIn Profile</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {candidate.linkedinUrl}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </a>
                </Button>
              </div>
            )}
            
            {!candidate.linkedinUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No external links added yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">LinkedIn Verification</span>
              <Badge variant={candidate.linkedinVerificationStatus === 'verified' ? 'default' : 'secondary'}>
                {candidate.linkedinVerificationStatus || 'Not Required'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Aadhaar Verification</span>
              <Badge variant={candidate.aadhaarVerificationStatus === 'verified' ? 'default' : 'secondary'}>
                {candidate.aadhaarVerificationStatus || 'Not Required'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Viewing Modal */}
      <Dialog open={resumeViewOpen} onOpenChange={setResumeViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Resume - {candidate.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-[500px]">
            {candidate.resumeUrl ? (
              <iframe
                src={candidate.resumeUrl}
                className="w-full h-[500px] border rounded"
                title="Resume Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <p>No resume available to preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}