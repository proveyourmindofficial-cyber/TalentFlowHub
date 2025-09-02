import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, MapPin, Briefcase, DollarSign, Calendar, FileText, Eye, Download, X } from "lucide-react";
import type { Candidate } from "@shared/schema";

interface CandidateDetailViewProps {
  candidateId: string;
  open: boolean;
  onClose: () => void;
}

export function CandidateDetailView({ candidateId, open, onClose }: CandidateDetailViewProps) {
  const [resumeViewOpen, setResumeViewOpen] = useState(false);

  const { data: candidate, isLoading } = useQuery<Candidate>({
    queryKey: ['/api/candidates', candidateId],
    enabled: open && !!candidateId,
  });

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not specified";
    const num = parseFloat(amount);
    return `₹${(num / 100000).toFixed(1)}L`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not specified";
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Available': 'bg-green-100 text-green-800',
      'Interviewing': 'bg-blue-100 text-blue-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Placed': 'bg-emerald-100 text-emerald-800',
      'Rejected': 'bg-red-100 text-red-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleResumeView = () => {
    if (candidate?.resumeUrl) {
      setResumeViewOpen(true);
    }
  };

  const handleResumeDownload = () => {
    if (candidate?.resumeUrl) {
      const link = document.createElement('a');
      link.href = candidate.resumeUrl;
      link.download = `${candidate.name}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading candidate details...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!candidate) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Candidate not found</DialogTitle>
          </DialogHeader>
          <p>Unable to load candidate details.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="candidate-profile-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {candidate.name}
            </DialogTitle>
            <div id="candidate-profile-description" className="sr-only">
              View detailed candidate information including contact details, experience, skills, and resume
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={onClose}
              data-testid="button-close-detail"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <p className="text-muted-foreground">{candidate.primarySkill}</p>
              </div>
              <Badge className={getStatusColor(candidate.status)}>
                {candidate.status}
              </Badge>
            </div>

            <Separator />

            {/* Identity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{candidate.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-medium">{candidate.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Professional Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Skill</label>
                  <p className="font-medium">{candidate.primarySkill}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Company</label>
                  <p className="font-medium">{candidate.currentCompany || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Experience</label>
                  <p className="font-medium">{candidate.totalExperience || "0"} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Relevant Experience</label>
                  <p className="font-medium">{candidate.relevantExperience || "0"} years</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Location</label>
                  <p className="font-medium">{candidate.currentLocation || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preferred Location</label>
                  <p className="font-medium">{candidate.preferredLocation || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compensation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Compensation & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current CTC</label>
                  <p className="font-medium">{formatCurrency(candidate.currentCtc)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected CTC</label>
                  <p className="font-medium">{formatCurrency(candidate.expectedCtc)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notice Period</label>
                  <p className="font-medium">{candidate.noticePeriod || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tentative DOJ</label>
                  <p className="font-medium">{formatDate(candidate.tentativeDoj)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.resumeUrl ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Resume</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResumeView}
                        className="flex items-center gap-2"
                        data-testid="button-view-resume"
                      >
                        <Eye className="w-4 h-4" />
                        View Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResumeDownload}
                        className="flex items-center gap-2"
                        data-testid="button-download-resume"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resume</label>
                    <p className="text-muted-foreground">No resume uploaded</p>
                  </div>
                )}
                
                {candidate.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="whitespace-pre-wrap">{candidate.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Added on</label>
                  <p className="font-medium">{formatDate(candidate.createdAt ? candidate.createdAt.toString() : null)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Viewer Modal */}
      <Dialog open={resumeViewOpen} onOpenChange={setResumeViewOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Resume - {candidate.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {candidate.resumeUrl && (
              <iframe
                src={candidate.resumeUrl}
                className="w-full h-[80vh] border rounded-md"
                title={`Resume - ${candidate.name}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}